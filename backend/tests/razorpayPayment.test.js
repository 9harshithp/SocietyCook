import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../server.js';
import { query, transaction } from '../src/config/database.js';
import { ENV } from '../src/config/env.js';
import { PaymentService, setRazorpayClientForTest } from '../src/services/paymentService.js';

describe('SocietyCook Phase 3: Secure Razorpay Payment Gateway Integration Tests', () => {
  let residentToken = '';
  let otherResidentToken = '';
  let cookToken = '';
  let adminToken = '';
  let managerToken = '';

  const TEST_KEY_ID = 'rzp_test_societycook_key_12345';
  const TEST_KEY_SECRET = 'test_secret_societycook_razorpay_98765';
  const TEST_WEBHOOK_SECRET = 'test_webhook_secret_razorpay_11223';

  // Mock Razorpay Client for deterministic test execution
  let mockOrders = new Map();
  let mockPayments = new Map();
  let mockRefunds = new Map();

  const mockRazorpay = {
    orders: {
      create: async (params) => {
        const orderId = `order_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const orderObj = { id: orderId, ...params, status: 'created' };
        mockOrders.set(orderId, orderObj);
        return orderObj;
      }
    },
    payments: {
      fetch: async (paymentId) => {
        if (!mockPayments.has(paymentId)) {
          return {
            id: paymentId,
            order_id: 'order_test_order',
            amount: 350000,
            currency: 'INR',
            status: 'captured',
            fee: 8000,
            tax: 1440
          };
        }
        return mockPayments.get(paymentId);
      },
      refund: async (paymentId, params) => {
        const refundId = `rfnd_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const refundObj = { id: refundId, payment_id: paymentId, ...params, status: 'processed' };
        mockRefunds.set(refundId, refundObj);
        return refundObj;
      }
    }
  };

  beforeAll(async () => {
    // Set test environment secrets and enable payments and refunds for testing
    ENV.RAZORPAY_KEY_ID = TEST_KEY_ID;
    ENV.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    ENV.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    ENV.ONLINE_PAYMENTS_ENABLED = true;
    ENV.REFUNDS_ENABLED = true;
    setRazorpayClientForTest(mockRazorpay);

    // 1. Authenticate resident 1 (society 1)
    const resRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resident@example.com', password: 'Demo12345!' });
    residentToken = resRes.body.accessToken;

    // 2. Authenticate admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Demo12345!' });
    adminToken = adminRes.body.accessToken;

    // 3. Authenticate society manager (society 1)
    const mgrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@example.com', password: 'Demo12345!' });
    managerToken = mgrRes.body.accessToken;

    // 4. Create an isolated other resident for cross-user tests
    const [existingOther] = await query("SELECT id FROM users WHERE email = 'other.resident@example.com'");
    let otherId = existingOther?.id;
    if (!otherId) {
      const ins = await query(`
        INSERT INTO users (name, email, password_hash, role, society_id, flat, is_verified)
        VALUES ('Other Resident', 'other.resident@example.com', '$2b$12$DUMMY', 'RESIDENT', 2, 'B-909', 1)
      `);
      otherId = ins.insertId;
    }
    const otherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'other.resident@example.com', password: 'Demo12345!' });
    // If password hash was dummy, fallback to direct token creation or login
    otherResidentToken = otherLogin.body.accessToken || residentToken;
  });

  afterAll(async () => {
    // Clean up test bookings and related records
    try {
      const testBookings = await query("SELECT id FROM bookings WHERE expires_at IN ('2030-01-01 00:00:00', '2020-01-01 00:00:00')");
      const ids = testBookings.map(b => b.id);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        await query(`DELETE FROM refunds WHERE payment_id IN (SELECT id FROM payments WHERE booking_id IN (${placeholders}))`, ids);
        await query(`DELETE FROM payments WHERE booking_id IN (${placeholders})`, ids);
        await query(`DELETE FROM earnings_ledger WHERE booking_id IN (${placeholders})`, ids);
        await query(`DELETE FROM sessions WHERE booking_id IN (${placeholders})`, ids);
        await query(`DELETE FROM subscriptions WHERE booking_id IN (${placeholders})`, ids);
        await query(`DELETE FROM bookings WHERE id IN (${placeholders})`, ids);
      }
    } catch (e) {
      // Ignore cleanup error
    }
    // Reset test client
    setRazorpayClientForTest(null);
  });

  // Helper to create an isolated test booking (uses non-overlapping early morning slot)
  async function createTestBooking({ residentId = 1, cookId = 1, amount = 4000, status = 'PENDING', isExpired = false } = {}) {
    const expiresAt = isExpired ? '2020-01-01 00:00:00' : '2030-01-01 00:00:00';
    const res = await query(`
      INSERT INTO bookings 
      (resident_id, cook_id, start_date, end_date, start_time, end_time, amount, status, expires_at, slot_label, meal_type, service_type)
      VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), '05:00:00', '05:45:00', ?, ?, ?, '05:00 AM', 'Dinner', 'COOKING')
    `, [residentId, cookId, amount, status, expiresAt]);
    return res.insertId;
  }

  // Helper to generate valid Razorpay checkout signature
  function generateCheckoutSignature(orderId, paymentId) {
    return crypto
      .createHmac('sha256', TEST_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
  }

  // Helper to generate valid webhook signature
  function generateWebhookSignature(rawBody) {
    return crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
  }

  describe('1. Gateway Configuration & Status Endpoint', () => {
    it('returns public gateway status with test-mode indicator and without secrets', async () => {
      const res = await request(app).get('/api/v1/payments/config');
      expect(res.status).toBe(200);
      expect(res.body.onlinePaymentsAvailable).toBe(true);
      expect(res.body.keyId).toBe(TEST_KEY_ID);
      expect(res.body.currency).toBe('INR');
      expect(res.body.isTestMode).toBe(true);
      expect(res.body).not.toHaveProperty('keySecret');
      expect(res.body).not.toHaveProperty('webhookSecret');
    });

    it('reports onlinePaymentsAvailable as false when credentials are empty', () => {
      const origKey = ENV.RAZORPAY_KEY_ID;
      const origSec = ENV.RAZORPAY_KEY_SECRET;
      ENV.RAZORPAY_KEY_ID = '';
      ENV.RAZORPAY_KEY_SECRET = '';

      const config = PaymentService.getPaymentConfig();
      expect(config.onlinePaymentsAvailable).toBe(false);
      expect(config.keyId).toBeNull();

      ENV.RAZORPAY_KEY_ID = origKey;
      ENV.RAZORPAY_KEY_SECRET = origSec;
    });
  });

  describe('2. Secure Server-Side Order Creation', () => {
    it('creates an authoritative order in paise and INR currency', async () => {
      const bookingId = await createTestBooking({ residentId: 1, amount: 3500 });
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orderId');
      expect(res.body.orderId).toMatch(/^order_rzp_/);
      expect(res.body.amount).toBe(3500);
      expect(res.body.amountInPaise).toBe(350000);
      expect(res.body.currency).toBe('INR');
      expect(res.body.keyId).toBe(TEST_KEY_ID);
      expect(res.body.isTestMode).toBe(true);

      // Verify pending row in payments table
      const [payRow] = await query('SELECT * FROM payments WHERE order_id = ?', [res.body.orderId]);
      expect(payRow).toBeDefined();
      expect(payRow.status).toBe('PENDING');
      expect(payRow.amount_paise).toBe(350000);
      expect(payRow.gateway).toBe('RAZORPAY');
    });

    it('rejects order creation for already ACTIVE bookings', async () => {
      const bookingId = await createTestBooking({ residentId: 1, status: 'ACTIVE' });
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already confirmed and active/i);
    });

    it('rejects order creation for CANCELLED bookings', async () => {
      const bookingId = await createTestBooking({ residentId: 1, status: 'CANCELLED' });
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot pay for a cancelled booking/i);
    });

    it('rejects order creation for EXPIRED bookings and updates status', async () => {
      const bookingId = await createTestBooking({ residentId: 1, isExpired: true });
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/expired/i);

      const [b] = await query('SELECT status FROM bookings WHERE id = ?', [bookingId]);
      expect(b.status).toBe('EXPIRED');
    });

    it('rejects unauthorized order creation across different residents', async () => {
      const bookingId = await createTestBooking({ residentId: 2 }); // Other resident user (ID 2)
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/unauthorized/i);
    });
  });

  describe('3. Payment Verification & Signature Validation', () => {
    it('verifies valid Razorpay checkout signature and provisions service transactionally', async () => {
      const bookingId = await createTestBooking({ residentId: 1, amount: 4000 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);
      
      const orderId = orderRes.body.orderId;
      const paymentId = `pay_${Date.now()}`;
      const signature = generateCheckoutSignature(orderId, paymentId);

      // Register payment in mock Razorpay client
      mockPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        amount: 400000,
        currency: 'INR',
        status: 'captured',
        fee: 8000,
        tax: 1440
      });

      const verifyRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/verify-payment`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.status).toBe('ACTIVE');

      // Verify DB state
      const [booking] = await query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
      expect(booking.status).toBe('ACTIVE');
      expect(booking.activated_at).not.toBeNull();

      const [payment] = await query('SELECT * FROM payments WHERE order_id = ?', [orderId]);
      expect(payment.status).toBe('SUCCESS');
      expect(payment.payment_id).toBe(paymentId);

      const [sub] = await query('SELECT * FROM subscriptions WHERE booking_id = ?', [bookingId]);
      expect(sub).toBeDefined();
      expect(sub.status).toBe('ACTIVE');

      const [inv] = await query('SELECT * FROM invoices WHERE booking_id = ?', [bookingId]);
      expect(inv).toBeDefined();
      expect(inv.total_amount).toBe(4000);

      const [session] = await query('SELECT * FROM sessions WHERE booking_id = ?', [bookingId]);
      expect(session).toBeDefined();
      expect(session.status).toBe('SCHEDULED');
    });

    it('rejects invalid or tampered checkout signatures with HTTP 400', async () => {
      const bookingId = await createTestBooking({ residentId: 1 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);
      
      const orderId = orderRes.body.orderId;
      const paymentId = `pay_fake_${Date.now()}`;
      const fakeSignature = 'tampered_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const verifyRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/verify-payment`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: fakeSignature
        });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.message).toMatch(/signature verification failed/i);
    });

    it('rejects uncaptured payments with HTTP 400', async () => {
      const bookingId = await createTestBooking({ residentId: 1, amount: 3500 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);
      
      const orderId = orderRes.body.orderId;
      const paymentId = `pay_uncaptured_${Date.now()}`;
      const signature = generateCheckoutSignature(orderId, paymentId);

      mockPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        amount: 350000,
        currency: 'INR',
        status: 'authorized' // NOT captured!
      });

      const verifyRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/verify-payment`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature
        });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.message).toMatch(/captured/i);
    });
  });

  describe('4. Webhook Handling & Idempotency', () => {
    it('processes signed payment.captured webhook and provisions service', async () => {
      const bookingId = await createTestBooking({ residentId: 1, amount: 3500 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      const orderId = orderRes.body.orderId;
      const paymentId = `pay_wh_${Date.now()}`;

      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: 350000,
              currency: 'INR',
              status: 'captured',
              fee: 8400,
              tax: 1512
            }
          }
        }
      };

      const rawPayload = JSON.stringify(payload);
      const signature = generateWebhookSignature(Buffer.from(rawPayload, 'utf8'));

      const whRes = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(whRes.status).toBe(200);
      expect(whRes.body.handled).toBe(true);
      expect(whRes.body.status).toBe('ACTIVE');

      // Verify booking is active
      const [b] = await query('SELECT status FROM bookings WHERE id = ?', [bookingId]);
      expect(b.status).toBe('ACTIVE');
    });

    it('handles duplicate webhook deliveries idempotently without duplicate records', async () => {
      const bookingId = await createTestBooking({ residentId: 1, amount: 4000 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      const orderId = orderRes.body.orderId;
      const paymentId = `pay_dup_${Date.now()}`;

      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: paymentId,
              order_id: orderId,
              amount: 400000,
              currency: 'INR',
              status: 'captured'
            }
          }
        }
      };

      const rawPayload = JSON.stringify(payload);
      const signature = generateWebhookSignature(Buffer.from(rawPayload, 'utf8'));

      // Delivery 1
      const res1 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);
      expect(res1.body.status).toBe('ACTIVE');

      // Delivery 2 (Duplicate)
      const res2 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);
      expect(res2.body.handled).toBe(true);
      expect(res2.body.status).toMatch(/already_processed/i);

      // Verify exactly 1 subscription, 1 invoice, 1 session
      const subs = await query('SELECT id FROM subscriptions WHERE booking_id = ?', [bookingId]);
      expect(subs.length).toBe(1);

      const invoices = await query('SELECT id FROM invoices WHERE booking_id = ?', [bookingId]);
      expect(invoices.length).toBe(1);

      const sessions = await query('SELECT id FROM sessions WHERE booking_id = ?', [bookingId]);
      expect(sessions.length).toBe(1);
    });

    it('rejects webhooks with invalid signatures', async () => {
      const payload = { event: 'payment.captured', payload: {} };
      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature_hex')
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid webhook signature/i);
    });

    it('rejects webhooks with unsupported currency', async () => {
      const bookingId = await createTestBooking({ residentId: 1, amount: 4000 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      const payload = {
        id: `evt_usd_${Date.now()}`,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_usd_${Date.now()}`,
              order_id: orderRes.body.orderId,
              amount: 5000,
              currency: 'USD', // INVALID CURRENCY
              status: 'captured'
            }
          }
        }
      };

      const rawPayload = JSON.stringify(payload);
      const signature = generateWebhookSignature(Buffer.from(rawPayload, 'utf8'));

      const res = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unsupported currency/i);
    });
  });

  describe('5. Refunds & Financial Reconciliation', () => {
    let paidBookingId = 0;
    let paymentRecordId = 0;

    beforeEach(async () => {
      paidBookingId = await createTestBooking({ residentId: 1, amount: 5000 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${paidBookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      const orderId = orderRes.body.orderId;
      const paymentId = `pay_ref_${Date.now()}`;
      const sig = generateCheckoutSignature(orderId, paymentId);

      mockPayments.set(paymentId, {
        id: paymentId,
        order_id: orderId,
        amount: 500000,
        currency: 'INR',
        status: 'captured'
      });

      await request(app)
        .post(`/api/v1/bookings/${paidBookingId}/verify-payment`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: sig });

      const [p] = await query('SELECT id FROM payments WHERE order_id = ?', [orderId]);
      paymentRecordId = p.id;
    });

    it('processes partial refund and updates payment status to PARTIALLY_REFUNDED', async () => {
      const res = await request(app)
        .post(`/api/v1/payments/${paymentRecordId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1500,
          reason: 'Cook was unavailable for 2 planned sessions'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('PARTIALLY_REFUNDED');
      expect(res.body.newTotalRefunded).toBe(1500);
      expect(res.body.isFullRefund).toBe(false);

      const [p] = await query('SELECT * FROM payments WHERE id = ?', [paymentRecordId]);
      expect(p.amount_refunded).toBe(1500);
      expect(p.status).toBe('PARTIALLY_REFUNDED');
    });

    it('rejects refund amount exceeding the captured payment balance', async () => {
      const res = await request(app)
        .post(`/api/v1/payments/${paymentRecordId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 6000, // Total is 5000!
          reason: 'Excessive refund attempt'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds remaining refundable balance/i);
    });

    it('processes full refund and cancels booking, subscription, and upcoming sessions', async () => {
      const res = await request(app)
        .post(`/api/v1/payments/${paymentRecordId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 5000,
          reason: 'Resident relocated before service commencement'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('REFUNDED');
      expect(res.body.isFullRefund).toBe(true);

      // Verify booking cancelled
      const [b] = await query('SELECT status FROM bookings WHERE id = ?', [paidBookingId]);
      expect(b.status).toBe('CANCELLED');

      // Verify subscription cancelled
      const [s] = await query('SELECT status FROM subscriptions WHERE booking_id = ?', [paidBookingId]);
      expect(s.status).toBe('CANCELLED');

      // Verify upcoming sessions cancelled
      const [session] = await query('SELECT status FROM sessions WHERE booking_id = ?', [paidBookingId]);
      expect(session.status).toBe('CANCELLED');
    });

    it('rejects refund attempts by unauthorized resident role', async () => {
      const res = await request(app)
        .post(`/api/v1/payments/${paymentRecordId}/refund`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ amount: 1000, reason: 'Self-service refund attempt' });

      expect(res.status).toBe(403);
    });
  });

  describe('6. Production Demo Payment Hardening', () => {
    it('strictly returns HTTP 403 when DEMO_PAYMENTS is disabled', async () => {
      const bookingId = await createTestBooking({ residentId: 1 });
      const origDemo = ENV.DEMO_PAYMENTS;
      ENV.DEMO_PAYMENTS = false;

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/pay-demo`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/disabled in production/i);

      ENV.DEMO_PAYMENTS = origDemo;
    });
  });

  describe('7. Group Partial Payment & Concurrency Lifecycle', () => {
    it('unpaid group bookings remain pending and do not schedule daily sessions', async () => {
      const unpaidBookingId = await createTestBooking({ residentId: 1, status: 'PENDING' });
      
      // Verify no sessions created for unpaid pending booking
      const sessions = await query('SELECT * FROM sessions WHERE booking_id = ?', [unpaidBookingId]);
      expect(sessions.length).toBe(0);

      // Verify no subscription active
      const subs = await query('SELECT * FROM subscriptions WHERE booking_id = ?', [unpaidBookingId]);
      expect(subs.length).toBe(0);
    });
  });

  describe('8. Phase 3 Security Review Safeguards & Hardening', () => {
    it('strictly rejects order creation when ONLINE_PAYMENTS_ENABLED is false', async () => {
      const bookingId = await createTestBooking({ residentId: 1 });
      const origEnabled = ENV.ONLINE_PAYMENTS_ENABLED;
      ENV.ONLINE_PAYMENTS_ENABLED = false;

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/disabled/i);

      ENV.ONLINE_PAYMENTS_ENABLED = origEnabled;
    });

    it('blocks accidental live key activation in non-production environments', async () => {
      const origKey = ENV.RAZORPAY_KEY_ID;
      ENV.RAZORPAY_KEY_ID = 'rzp_live_accidental_production_key_12345';

      expect(() => PaymentService.validateKeyConfiguration()).toThrow(/Live Razorpay key/i);

      ENV.RAZORPAY_KEY_ID = origKey;
    });

    it('blocks test keys on live production cluster without IS_STAGING', async () => {
      const origNodeEnv = ENV.NODE_ENV;
      const origStaging = ENV.IS_STAGING;
      ENV.NODE_ENV = 'production';
      ENV.IS_STAGING = false;

      expect(() => PaymentService.validateKeyConfiguration()).toThrow(/cannot be used against the live production database/i);

      ENV.NODE_ENV = origNodeEnv;
      ENV.IS_STAGING = origStaging;
    });

    it('strictly preserves agreed booking contract price when cook price changes subsequently', async () => {
      // 1. Create booking with agreed contract price of 4000
      const bookingId = await createTestBooking({ residentId: 1, cookId: 1, amount: 4000 });

      // 2. Cook updates price to 9999 in database
      const [cookBefore] = await query('SELECT price FROM cooks WHERE id = 1');
      const origCookPrice = cookBefore?.price;
      await query('UPDATE cooks SET price = 9999 WHERE id = 1');

      // 3. Create payment order for booking
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(orderRes.status).toBe(200);
      // Contract price must be preserved at 4000 (400,000 paise), NOT updated cook price (9999)
      expect(orderRes.body.amount).toBe(4000);
      expect(orderRes.body.amountInPaise).toBe(400000);

      // Revert cook price
      if (origCookPrice) {
        await query('UPDATE cooks SET price = ? WHERE id = 1', [origCookPrice]);
      }
    });

    it('ensures signature alone cannot activate service if gateway verification fails', async () => {
      const bookingId = await createTestBooking({ residentId: 1, amount: 3500 });
      const orderRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/payment-order`)
        .set('Authorization', `Bearer ${residentToken}`);

      const orderId = orderRes.body.orderId;
      const paymentId = `pay_missing_gw_${Date.now()}`;
      const signature = generateCheckoutSignature(orderId, paymentId);

      // Point mock client to throw gateway communication error
      const origPaymentsFetch = mockRazorpay.payments.fetch;
      mockRazorpay.payments.fetch = async () => {
        throw new Error('Gateway network timeout contacting bank network');
      };

      const verifyRes = await request(app)
        .post(`/api/v1/bookings/${bookingId}/verify-payment`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature
        });

      expect(verifyRes.status).toBe(502);
      expect(verifyRes.body.message).toMatch(/cannot activate services/i);

      // Verify booking did NOT transition to ACTIVE
      const [booking] = await query('SELECT status FROM bookings WHERE id = ?', [bookingId]);
      expect(booking.status).toBe('PENDING');

      // Restore fetch mock
      mockRazorpay.payments.fetch = origPaymentsFetch;
    });

    it('idempotently deduplicates webhook events via webhook_events table', async () => {
      const eventId = `evt_dedup_test_${Date.now()}`;
      const testPayload = JSON.stringify({
        id: eventId,
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_dedup_${Date.now()}`,
              order_id: 'order_test_dedup',
              amount: 350000,
              currency: 'INR',
              status: 'captured'
            }
          }
        }
      });
      const sig = generateWebhookSignature(testPayload);

      // First delivery: processes event
      const res1 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', sig)
        .set('Content-Type', 'application/json')
        .send(testPayload);

      expect(res1.status).toBe(200);

      // Second duplicate delivery with the exact same event ID: returns already_processed
      const res2 = await request(app)
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', sig)
        .set('Content-Type', 'application/json')
        .send(testPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe('already_processed');
      expect(res2.body.eventId).toBe(eventId);
    });

    it('rejects refund initiation with HTTP 403 when REFUNDS_ENABLED is false', async () => {
      const origRefunds = ENV.REFUNDS_ENABLED;
      ENV.REFUNDS_ENABLED = false;

      const res = await request(app)
        .post('/api/v1/payments/1/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 1000, reason: 'Refund disabled test' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Refund processing is currently disabled/i);

      ENV.REFUNDS_ENABLED = origRefunds;
    });
  });
});
