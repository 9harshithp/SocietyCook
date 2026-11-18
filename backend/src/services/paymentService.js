import crypto from 'crypto';
import Razorpay from 'razorpay';
import { query, transaction } from '../config/database.js';
import { ENV } from '../config/env.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

let razorpayClient = null;
if (ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: ENV.RAZORPAY_KEY_ID,
    key_secret: ENV.RAZORPAY_KEY_SECRET
  });
}

export class PaymentService {
  /**
   * Create payment order (Razorpay or Demo simulation order)
   */
  static async createOrder({ bookingId, userId }) {
    const [booking] = await query(
      `SELECT b.*, ru.name as resident_name, ru.email, ru.phone, cu.name as cook_name 
       FROM bookings b
       JOIN users ru ON ru.id = b.resident_id
       JOIN cooks c ON c.id = b.cook_id
       JOIN users cu ON cu.id = c.user_id
       WHERE b.id = ? AND b.resident_id = ?`,
      [bookingId, userId]
    );

    if (!booking) {
      const err = new Error('Booking not found or unauthorized.');
      err.status = 404;
      throw err;
    }

    const amountInPaise = booking.amount * 100;
    const isRealRazorpay = razorpayClient && ENV.NODE_ENV === 'production';

    let orderId = `order_demo_${booking.id}_${Date.now()}`;

    if (isRealRazorpay) {
      const rpOrder = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${booking.id}`,
        notes: { bookingId: booking.id, userId }
      });
      orderId = rpOrder.id;
    }

    // Save pending payment record
    await query(
      `INSERT INTO payments (booking_id, amount, status, gateway, order_id, user_id, currency)
       VALUES (?, ?, 'PENDING', ?, ?, ?, 'INR')`,
      [booking.id, booking.amount, isRealRazorpay ? 'RAZORPAY' : 'DEMO_SIMULATED', orderId, userId]
    );

    return {
      orderId,
      amount: booking.amount,
      currency: 'INR',
      keyId: isRealRazorpay ? ENV.RAZORPAY_KEY_ID : 'rzp_test_demo_key',
      isDemo: !isRealRazorpay,
      booking: {
        id: booking.id,
        slot: booking.slot_label,
        cookName: booking.cook_name
      }
    };
  }

  /**
   * Complete payment in Demo mode (local development prototype)
   */
  static async confirmDemoPayment({ bookingId, userId }) {
    if (!ENV.DEMO_PAYMENTS) {
      const err = new Error('Demo payment mode is disabled in this environment.');
      err.status = 403;
      throw err;
    }

    return await transaction(async (q) => {
      const [b] = await q('SELECT * FROM bookings WHERE id = ? AND resident_id = ? FOR UPDATE', [bookingId, userId]);
      if (!b) throw new Error('Booking not found');

      // 1. Mark booking ACTIVE
      await q("UPDATE bookings SET status = 'ACTIVE' WHERE id = ?", [b.id]);

      // 2. Mark payment SUCCESS
      const paymentId = `pay_demo_${b.id}_${Date.now()}`;
      await q(
        `INSERT INTO payments (booking_id, amount, status, gateway, payment_id, order_id, user_id)
         VALUES (?, ?, 'SUCCESS', 'DEMO_SIMULATED', ?, CONCAT('order_demo_', ?), ?)
         ON DUPLICATE KEY UPDATE status = 'SUCCESS', payment_id = VALUES(payment_id)`,
        [b.id, b.amount, paymentId, b.id, userId]
      );

      // 3. Create or update subscription
      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10);

      await q(
        `INSERT INTO subscriptions (booking_id, resident_id, society_id, monthly_amount, status, current_period_start, current_period_end)
         VALUES (?, ?, 1, ?, 'ACTIVE', ?, ?)
         ON DUPLICATE KEY UPDATE status = 'ACTIVE', current_period_end = VALUES(current_period_end)`,
        [b.id, userId, b.amount, today, nextMonth]
      );

      // 4. Generate daily session for today
      const otp = String(Math.floor(1000 + Math.random() * 9000));
      await q(
        `INSERT IGNORE INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, otp_code)
         VALUES (?, ?, ?, 'SCHEDULED', ?, ?, ?)`,
        [b.id, b.cook_id, today, b.start_time, b.end_time, otp]
      );

      // 5. Generate Invoice
      const [payRow] = await q('SELECT id FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1', [b.id]);
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(b.id).padStart(5, '0')}`;
      await q(
        `INSERT IGNORE INTO invoices (payment_id, booking_id, resident_id, invoice_number, subtotal, total_amount, issued_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [payRow.id, b.id, userId, invoiceNumber, b.amount, b.amount, today]
      );

      // 6. Record cook earnings ledger
      const commission = Math.round(b.amount * 0.1);
      const netCookEarning = b.amount - commission;
      await q(
        `INSERT INTO earnings_ledger (cook_id, booking_id, gross_amount, platform_commission, net_cook_earning, status)
         VALUES (?, ?, ?, ?, ?, 'ACCRUED')`,
        [b.cook_id, b.id, b.amount, commission, netCookEarning]
      );

      // 7. Notification
      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Payment Confirmed · Subscription Active', ?, 'PAYMENT')`,
        [
          userId,
          `Payment of ₹${b.amount.toLocaleString('en-IN')} confirmed! Your daily cooking service is active. Invoice ${invoiceNumber} issued.`
        ]
      );

      await logAudit({
        userId,
        action: 'PAYMENT_COMPLETED',
        resourceType: 'PAYMENT',
        resourceId: payRow.id,
        diff: { amount: b.amount, bookingId: b.id }
      });

      return {
        success: true,
        bookingId: b.id,
        invoiceNumber,
        status: 'ACTIVE'
      };
    });
  }

  /**
   * Verify Razorpay Payment Signature
   */
  static async verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId, userId }) {
    if (!ENV.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured.');
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      const err = new Error('Payment signature verification failed.');
      err.status = 400;
      throw err;
    }

    return await transaction(async (q) => {
      const [b] = await q('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
      if (!b) throw new Error('Booking not found');

      await q("UPDATE bookings SET status = 'ACTIVE' WHERE id = ?", [b.id]);

      await q(
        `UPDATE payments 
         SET status = 'SUCCESS', payment_id = ?, signature = ?
         WHERE order_id = ?`,
        [razorpayPaymentId, razorpaySignature, razorpayOrderId]
      );

      return { success: true, bookingId: b.id };
    });
  }

  /**
   * Get user payment history with invoice links
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
