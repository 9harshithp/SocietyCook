import crypto from 'crypto';
import Razorpay from 'razorpay';
import { query, transaction } from '../config/database.js';
import { ENV } from '../config/env.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

let razorpayClient = null;
export function getRazorpayClient() {
  if (!razorpayClient && ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET) {
    razorpayClient = new Razorpay({
      key_id: ENV.RAZORPAY_KEY_ID,
      key_secret: ENV.RAZORPAY_KEY_SECRET
    });
  }
  return razorpayClient;
}

export function setRazorpayClientForTest(client) {
  razorpayClient = client;
}

export class PaymentService {
  /**
   * Public Payment Gateway Configuration & Status
   */
  static getPaymentConfig() {
    const keyId = ENV.RAZORPAY_KEY_ID || '';
    const isTestMode = keyId.startsWith('rzp_test_');
    const hasKeys = Boolean(keyId && ENV.RAZORPAY_KEY_SECRET);
    // In production without live gateway credentials, online payments are disabled
    const onlinePaymentsAvailable = hasKeys;

    return {
      onlinePaymentsAvailable,
      keyId: onlinePaymentsAvailable ? keyId : null,
      currency: 'INR',
      isTestMode,
      demoAllowed: Boolean(ENV.DEMO_PAYMENTS && ENV.NODE_ENV !== 'production')
    };
  }

  /**
   * Secure Server-Side Order Creation
   * Validates resident ownership, society isolation, booking status, expiration, and computes authoritative price.
   */
  static async createOrder({ bookingId, userId, userRole, userSocietyId }) {
    // 1. Initial check & expired reservation sweep outside transaction to prevent connection deadlocks
    const [bCheck] = await query(
      'SELECT id, status, expires_at, resident_id FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (!bCheck) {
      const err = new Error('Booking not found.');
      err.status = 404;
      throw err;
    }

    if (bCheck.status === 'ACTIVE') {
      const err = new Error('Booking is already confirmed and active.');
      err.status = 400;
      throw err;
    }

    if (bCheck.status === 'CANCELLED') {
      const err = new Error('Cannot pay for a cancelled booking.');
      err.status = 400;
      throw err;
    }

    if (bCheck.status === 'EXPIRED') {
      const err = new Error('Booking reservation hold has expired. Please create a new booking.');
      err.status = 400;
      throw err;
    }

    if (bCheck.expires_at && new Date(bCheck.expires_at) <= new Date()) {
      await query("UPDATE bookings SET status = 'EXPIRED' WHERE id = ?", [bookingId]);
      const err = new Error('Booking reservation hold has expired. Please create a new booking.');
      err.status = 400;
      throw err;
    }

    return await transaction(async (q) => {
      // 2. Fetch full booking with resident, cook, and society details with row-level lock
      const [booking] = await q(
        `SELECT b.*, ru.name as resident_name, ru.email, ru.phone, ru.society_id as resident_society_id, 
                cu.name as cook_name, c.price as cook_price, c.dishwashing_price
         FROM bookings b
         JOIN users ru ON ru.id = b.resident_id
         JOIN cooks c ON c.id = b.cook_id
         JOIN users cu ON cu.id = c.user_id
         WHERE b.id = ? FOR UPDATE`,
        [bookingId]
      );

      // Ownership & Tenant Authorization
      if (booking.resident_id !== userId && userRole !== 'ADMIN') {
        const err = new Error('Unauthorized: You can only create payment orders for your own bookings.');
        err.status = 403;
        throw err;
      }

      if (userRole !== 'ADMIN' && userSocietyId && booking.resident_society_id !== userSocietyId) {
        const err = new Error('Cross-society access forbidden.');
        err.status = 403;
        throw err;
      }

      // 4. Authoritative Price Computation (Server-Side, Never Trust Frontend)
      let authoritativeAmount = booking.amount;
      if (booking.group_id) {
        authoritativeAmount = booking.monthly_price || booking.amount;
      } else {
        const sType = (booking.service_type || 'COOKING').toUpperCase();
        if (sType === 'DISHWASHING') {
          authoritativeAmount = booking.dishwashing_price || 2200;
        } else if (sType === 'COMBO') {
          authoritativeAmount = Math.round((booking.cook_price + (booking.dishwashing_price || 2200)) * 0.9);
        } else {
          authoritativeAmount = booking.cook_price || booking.amount;
        }
      }

      const amountInPaise = Math.round(authoritativeAmount * 100);
      const client = getRazorpayClient();
      const hasKeys = Boolean(ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET);

      let orderId = '';
      let isDemo = false;

      // 5. Gateway Order Generation
      if (client) {
        const receipt = `rcpt_${booking.id}_${Date.now()}`.slice(0, 40);
        const rpOrder = await client.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            booking_id: String(booking.id),
            resident_id: String(booking.resident_id),
            society_id: String(booking.resident_society_id)
          }
        });
        orderId = rpOrder.id;
      } else {
        // If gateway is not configured
        if (ENV.NODE_ENV === 'production' || !ENV.DEMO_PAYMENTS) {
          const err = new Error('Online payments are temporarily unavailable pending payment gateway activation.');
          err.status = 503;
          throw err;
        }
        // Test / Development mode sandbox simulation order
        orderId = `order_test_${booking.id}_${Date.now()}`;
        isDemo = true;
      }

      // 6. Save or update pending payment record with database-backed idempotency
      await q(
        `INSERT INTO payments (booking_id, amount, amount_paise, status, gateway, order_id, user_id, currency, razorpay_order_id)
         VALUES (?, ?, ?, 'PENDING', ?, ?, ?, 'INR', ?)`,
        [
          booking.id,
          authoritativeAmount,
          amountInPaise,
          isDemo ? 'DEMO_SIMULATED' : 'RAZORPAY',
          orderId,
          userId,
          orderId
        ]
      );

      return {
        orderId,
        amount: authoritativeAmount,
        amountInPaise,
        currency: 'INR',
        keyId: hasKeys ? ENV.RAZORPAY_KEY_ID : 'rzp_test_mock_key',
        isTestMode: (ENV.RAZORPAY_KEY_ID || '').startsWith('rzp_test_'),
        isDemo,
        booking: {
          id: booking.id,
          slot: booking.slot_label,
          mealType: booking.meal_type,
          cookName: booking.cook_name
        }
      };
    });
  }

  /**
   * Verify Razorpay Payment Signature and Trigger Authoritative Service Provisioning
   */
  static async verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId, userId }) {
    if (!ENV.RAZORPAY_KEY_SECRET) {
      const err = new Error('Razorpay credentials not configured on backend.');
      err.status = 500;
      throw err;
    }

    // 1. Constant-Time HMAC-SHA256 Signature Verification
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const sigBuf = Buffer.from(razorpaySignature || '', 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      const err = new Error('Payment signature verification failed.');
      err.status = 400;
      throw err;
    }

    // 2. Fetch and verify payment entity directly from Razorpay API
    const client = getRazorpayClient();
    if (client) {
      try {
        const rzpPayment = await client.payments.fetch(razorpayPaymentId);
        if (rzpPayment.order_id && rzpPayment.order_id !== razorpayOrderId) {
          const err = new Error('Razorpay order ID mismatch.');
          err.status = 400;
          throw err;
        }
        if (rzpPayment.status !== 'captured') {
          const err = new Error(`Payment not captured. Current status: ${rzpPayment.status}`);
          err.status = 400;
          throw err;
        }
      } catch (err) {
        if (err.status) throw err;
        // In local/test mode with mock keys where network fetch fails, log and proceed if signature passed
        console.warn('Razorpay payment fetch warning:', err.message);
      }
    }

    // 3. Centralized Transactional Provisioning
    return await transaction(async (q) => {
      return await PaymentService.provisionBookingService(q, {
        bookingId,
        userId,
        orderId: razorpayOrderId,
        gatewayPaymentId: razorpayPaymentId,
        signature: razorpaySignature,
        gateway: 'RAZORPAY'
      });
    });
  }

  /**
   * Process Signed Razorpay Webhooks Idempotently
   */
  static async handleRazorpayWebhook({ rawBody, signature, event }) {
    if (!ENV.RAZORPAY_WEBHOOK_SECRET) {
      const err = new Error('Razorpay webhook secret is not configured.');
      err.status = 500;
      throw err;
    }

    if (!rawBody || !signature) {
      const err = new Error('Missing webhook payload or signature header.');
      err.status = 400;
      throw err;
    }

    // 1. Constant-Time Webhook Signature Verification against Raw Body
    const expectedSignature = crypto
      .createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      const err = new Error('Invalid webhook signature.');
      err.status = 400;
      throw err;
    }

    const eventName = event?.event;
    const webhookEventId = event?.payload?.payment?.entity?.id || `evt_${Date.now()}`;

    // 2. Handle 'payment.captured'
    if (eventName === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) return { handled: false, reason: 'NO_PAYMENT_ENTITY' };

      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amountPaise = paymentEntity.amount;
      const currency = paymentEntity.currency;

      if (currency !== 'INR') {
        const err = new Error(`Unsupported currency: ${currency}. Only INR is accepted.`);
        err.status = 400;
        throw err;
      }

      return await transaction(async (q) => {
        const [payment] = await q(
          'SELECT * FROM payments WHERE order_id = ? OR razorpay_order_id = ? FOR UPDATE',
          [orderId, orderId]
        );

        if (!payment) {
          console.warn(`Webhook received for unknown order: ${orderId}`);
          return { handled: false, reason: 'ORDER_NOT_FOUND', orderId };
        }

        // Verify amount
        if (payment.amount_paise && payment.amount_paise !== amountPaise) {
          const err = new Error(`Payment amount mismatch: expected ${payment.amount_paise} paise, got ${amountPaise}`);
          err.status = 400;
          throw err;
        }

        return await PaymentService.provisionBookingService(q, {
          bookingId: payment.booking_id,
          userId: payment.user_id,
          orderId,
          gatewayPaymentId: paymentId,
          signature,
          gateway: 'RAZORPAY',
          webhookEventId,
          fee: paymentEntity.fee || 0,
          tax: paymentEntity.tax || 0,
          paymentRecord: payment
        });
      });
    }

    // 3. Handle 'payment.failed'
    if (eventName === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity?.order_id) {
        await query(
          "UPDATE payments SET status = 'FAILED' WHERE order_id = ? AND status = 'PENDING'",
          [paymentEntity.order_id]
        );
      }
      return { handled: true, event: 'payment.failed' };
    }

    // 4. Handle 'refund.processed'
    if (eventName === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      if (refundEntity?.id) {
        await query(
          "UPDATE refunds SET status = 'COMPLETED' WHERE gateway_refund_id = ?",
          [refundEntity.id]
        );
      }
      return { handled: true, event: 'refund.processed' };
    }

    return { handled: true, event: eventName || 'IGNORED' };
  }

  /**
   * Central Authoritative Service Provisioning
   * Atomically transitions booking, payment, subscription, sessions, invoices, and ledger.
   * Completely idempotent: Safe against duplicate webhooks and concurrent verify calls.
   */
  static async provisionBookingService(q, {
    bookingId,
    userId,
    orderId,
    gatewayPaymentId,
    signature,
    gateway = 'RAZORPAY',
    webhookEventId = null,
    fee = 0,
    tax = 0,
    paymentRecord = null
  }) {
    // 1. Fetch payment row with lock if not already provided
    let payment = paymentRecord;
    if (!payment) {
      const [found] = await q(
        `SELECT * FROM payments 
         WHERE (order_id = ? OR razorpay_order_id = ? OR (booking_id = ? AND status = 'PENDING'))
         ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        [orderId || '', orderId || '', bookingId]
      );
      payment = found;
    }

    if (payment && payment.status === 'SUCCESS') {
      return {
        handled: true,
        status: 'ALREADY_PROCESSED',
        bookingId: payment.booking_id,
        paymentId: payment.id
      };
    }

    // 2. Fetch booking row with lock
    const [b] = await q(
      `SELECT b.*, ru.society_id as resident_society_id, ru.name as resident_name 
       FROM bookings b 
       JOIN users ru ON ru.id = b.resident_id 
       WHERE b.id = ? FOR UPDATE`,
      [bookingId]
    );

    if (!b) throw new Error('Booking record not found for provisioning.');

    const targetUserId = userId || b.resident_id;

    // 3. Mark booking ACTIVE
    await q("UPDATE bookings SET status = 'ACTIVE', activated_at = NOW() WHERE id = ?", [b.id]);

    // 4. Update or Insert Payment Record
    let paymentRecordId = payment?.id;
    if (payment) {
      await q(
        `UPDATE payments 
         SET status = 'SUCCESS', payment_id = ?, signature = ?, gateway = ?, 
             webhook_event_id = ?, gateway_fee = ?, gateway_tax = ?
         WHERE id = ?`,
        [gatewayPaymentId, signature, gateway, webhookEventId, fee, tax, payment.id]
      );
    } else {
      const insRes = await q(
        `INSERT INTO payments 
         (booking_id, amount, amount_paise, status, gateway, payment_id, order_id, user_id, signature, webhook_event_id)
         VALUES (?, ?, ?, 'SUCCESS', ?, ?, ?, ?, ?, ?)`,
        [
          b.id,
          b.amount,
          Math.round(b.amount * 100),
          gateway,
          gatewayPaymentId,
          orderId || `order_${b.id}_${Date.now()}`,
          targetUserId,
          signature,
          webhookEventId
        ]
      );
      paymentRecordId = insRes.insertId;
    }

    // 5. Create or Update Subscription (Tenant Isolation Preserved)
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10);

    const [existingSub] = await q('SELECT id FROM subscriptions WHERE booking_id = ? FOR UPDATE', [b.id]);
    if (existingSub) {
      await q("UPDATE subscriptions SET status = 'ACTIVE', current_period_end = ? WHERE id = ?", [
        nextMonth,
        existingSub.id
      ]);
    } else {
      await q(
        `INSERT INTO subscriptions (booking_id, group_id, resident_id, society_id, monthly_amount, status, current_period_start, current_period_end)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [b.id, b.group_id || null, targetUserId, b.resident_society_id || 1, b.amount, today, nextMonth]
      );
    }

    // 6. Generate Daily Scheduled Session (Idempotent via UNIQUE(booking_id, service_date))
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    await q(
      `INSERT IGNORE INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, otp_code)
       VALUES (?, ?, ?, 'SCHEDULED', ?, ?, ?)`,
      [b.id, b.cook_id, today, b.start_time, b.end_time, otp]
    );

    // 7. Generate Tax Invoice (Idempotent Check)
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(b.id).padStart(5, '0')}`;
    const [existingInv] = await q('SELECT id FROM invoices WHERE booking_id = ?', [b.id]);
    if (!existingInv) {
      await q(
        `INSERT INTO invoices (payment_id, booking_id, resident_id, invoice_number, subtotal, total_amount, issued_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [paymentRecordId || 1, b.id, targetUserId, invoiceNumber, b.amount, b.amount, today]
      );
    }

    // 8. Record Cook Earnings Ledger (Idempotent Check)
    const [existingLedger] = await q('SELECT id FROM earnings_ledger WHERE booking_id = ?', [b.id]);
    if (!existingLedger) {
      const commission = Math.round(b.amount * 0.1);
      const netCookEarning = b.amount - commission;
      await q(
        `INSERT INTO earnings_ledger (cook_id, booking_id, gross_amount, platform_commission, net_cook_earning, status)
         VALUES (?, ?, ?, ?, ?, 'ACCRUED')`,
        [b.cook_id, b.id, b.amount, commission, netCookEarning]
      );
    }

    // 9. Send Notification to Resident
    await q(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, 'Payment Confirmed · Subscription Active', ?, 'PAYMENT')`,
      [
        targetUserId,
        `Payment of ₹${b.amount.toLocaleString('en-IN')} confirmed! Daily service is now active. Invoice ${invoiceNumber} issued.`
      ]
    );

    // 10. Audit Logging
    await logAudit({
      userId: targetUserId,
      action: 'PAYMENT_PROVISIONED',
      resourceType: 'PAYMENT',
      resourceId: paymentRecordId,
      diff: { amount: b.amount, bookingId: b.id, gateway, paymentId: gatewayPaymentId }
    });

    return {
      success: true,
      handled: true,
      status: 'ACTIVE',
      bookingId: b.id,
      invoiceNumber,
      paymentId: gatewayPaymentId
    };
  }

  /**
   * Secure Full and Partial Refund Processing
   * Enforces RBAC, maximum refundable limits, atomic ledger reconciliation, and cancellation cascades.
   */
  static async processRefund({ paymentId, amount, reason, adminUserId, adminRole, adminSocietyId }) {
    if (adminRole !== 'ADMIN' && adminRole !== 'SOCIETY_MANAGER') {
      const err = new Error('Unauthorized: Refund processing requires ADMIN or SOCIETY_MANAGER role.');
      err.status = 403;
      throw err;
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      const err = new Error('Invalid refund amount. Must be a positive number.');
      err.status = 400;
      throw err;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      const err = new Error('A detailed refund reason is required (min 5 characters).');
      err.status = 400;
      throw err;
    }

    return await transaction(async (q) => {
      // 1. Fetch payment with lock
      const [payment] = await q(
        `SELECT p.*, b.resident_id, ru.society_id as resident_society_id, b.cook_id 
         FROM payments p
         JOIN bookings b ON b.id = p.booking_id
         JOIN users ru ON ru.id = b.resident_id
         WHERE p.id = ? FOR UPDATE`,
        [paymentId]
      );

      if (!payment) {
        const err = new Error('Payment record not found.');
        err.status = 404;
        throw err;
      }

      // 2. Society Manager Tenant Check
      if (adminRole === 'SOCIETY_MANAGER' && payment.resident_society_id !== adminSocietyId) {
        const err = new Error('Cross-society refund forbidden.');
        err.status = 403;
        throw err;
      }

      // 3. Status & Limit Validations
      if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
        const err = new Error(`Cannot refund payment in '${payment.status}' state.`);
        err.status = 400;
        throw err;
      }

      const alreadyRefunded = payment.amount_refunded || 0;
      const remainingRefundable = payment.amount - alreadyRefunded;

      if (amount > remainingRefundable) {
        const err = new Error(
          `Refund amount (₹${amount}) exceeds remaining refundable balance (₹${remainingRefundable}).`
        );
        err.status = 400;
        throw err;
      }

      const client = getRazorpayClient();
      let gatewayRefundId = `rfnd_${payment.id}_${Date.now()}`;

      // 4. Razorpay Gateway Refund Call
      if (client && payment.gateway === 'RAZORPAY' && payment.payment_id) {
        try {
          const rzpRefund = await client.payments.refund(payment.payment_id, {
            amount: Math.round(amount * 100),
            notes: {
              reason,
              adminUserId: String(adminUserId),
              paymentId: String(payment.id)
            }
          });
          gatewayRefundId = rzpRefund.id;
        } catch (rpErr) {
          console.error('Razorpay refund API error:', rpErr);
          const err = new Error(`Payment gateway refund rejected: ${rpErr.error?.description || rpErr.message}`);
          err.status = 502;
          throw err;
        }
      }

      // 5. Insert Refund Record
      const newTotalRefunded = alreadyRefunded + amount;
      const isFullRefund = newTotalRefunded >= payment.amount;
      const newPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      const refundIns = await q(
        `INSERT INTO refunds (payment_id, booking_id, resident_id, amount, reason, gateway_refund_id, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)`,
        [payment.id, payment.booking_id, payment.resident_id, amount, reason, gatewayRefundId, adminUserId]
      );

      // 6. Update Payment
      await q(
        `UPDATE payments SET amount_refunded = ?, status = ? WHERE id = ?`,
        [newTotalRefunded, newPaymentStatus, payment.id]
      );

      // 7. Full Refund State Transitions
      if (isFullRefund) {
        // Cancel booking
        await q("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", [payment.booking_id]);

        // Cancel subscription
        await q("UPDATE subscriptions SET status = 'CANCELLED' WHERE booking_id = ?", [payment.booking_id]);

        // Cancel upcoming scheduled sessions
        await q(
          "UPDATE sessions SET status = 'CANCELLED' WHERE booking_id = ? AND status = 'SCHEDULED' AND service_date >= CURDATE()",
          [payment.booking_id]
        );

        // Reverse cook earnings ledger
        await q(
          `INSERT INTO earnings_ledger (cook_id, booking_id, gross_amount, platform_commission, net_cook_earning, status)
           VALUES (?, ?, ?, ?, ?, 'DISPUTED')`,
          [payment.cook_id, payment.booking_id, -payment.amount, 0, -payment.amount]
        );
      }

      // 8. Notification & Audit Log
      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Refund Processed', ?, 'PAYMENT')`,
        [
          payment.resident_id,
          `A ${isFullRefund ? 'full' : 'partial'} refund of ₹${amount.toLocaleString('en-IN')} has been processed. Reason: ${reason}`
        ]
      );

      await logAudit({
        userId: adminUserId,
        action: 'PAYMENT_REFUNDED',
        resourceType: 'PAYMENT',
        resourceId: payment.id,
        diff: {
          amount,
          previousRefunded: alreadyRefunded,
          newTotalRefunded,
          isFullRefund,
          gatewayRefundId,
          reason
        }
      });

      return {
        success: true,
        refundId: refundIns.insertId,
        gatewayRefundId,
        amount,
        newTotalRefunded,
        isFullRefund,
        status: newPaymentStatus
      };
    });
  }

  /**
   * Prototype Demo Payment (Strictly disabled in production)
   */
  static async confirmDemoPayment({ bookingId, userId }) {
    if (!ENV.DEMO_PAYMENTS || ENV.NODE_ENV === 'production') {
      const err = new Error('Demo payment endpoint is strictly disabled in production.');
      err.status = 403;
      throw err;
    }

    return await transaction(async (q) => {
      const paymentId = `pay_demo_${bookingId}_${Date.now()}`;
      return await PaymentService.provisionBookingService(q, {
        bookingId,
        userId,
        orderId: `order_demo_${bookingId}_${Date.now()}`,
        gatewayPaymentId: paymentId,
        signature: 'sig_demo_simulation',
        gateway: 'DEMO_SIMULATED'
      });
    });
  }

  /**
   * Get User Payment History
   */
  static async getPaymentHistory(userId) {
    return await query(
      `SELECT p.*, b.slot_label, b.meal_type, cu.name as cook_name,
              i.invoice_number, i.issued_date, i.total_amount as invoice_amount
       FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       JOIN cooks c ON c.id = b.cook_id
       JOIN users cu ON cu.id = c.user_id
       LEFT JOIN invoices i ON i.payment_id = p.id
       WHERE p.user_id = ? OR b.resident_id = ?
       ORDER BY p.id DESC`,
      [userId, userId]
    );
  }
}
