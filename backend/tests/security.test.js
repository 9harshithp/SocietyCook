import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import crypto from 'crypto';

describe('SocietyCook Enterprise Security & Tenant Isolation Tests', () => {
  let residentToken = '';

  beforeAll(async () => {
    // Authenticate as resident
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resident@example.com', password: 'Demo12345!' });

    if (res.body?.accessToken) {
      residentToken = res.body.accessToken;
    }
  });

  it('rejects CORS preflight from untrusted origin', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'https://malicious-attacker.evil.com')
      .set('Access-Control-Request-Method', 'GET');

    // Should NOT return Access-Control-Allow-Origin: https://malicious-attacker.evil.com
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('blocks public self-registration with SOCIETY_MANAGER role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Attacker Attempting Elevation',
        email: `attacker-${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'SOCIETY_MANAGER',
        societyId: 1
      });

    expect(res.status).toBe(422); // Schema validation error (Unprocessable Entity)
  });

  it('blocks public self-registration with ADMIN role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Attacker Admin Attempt',
        email: `attacker-admin-${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'ADMIN',
        societyId: 1
      });

    expect(res.status).toBe(422);
  });

  it('enforces tenant boundary on society analytics (blocks cross-society access)', async () => {
    // Resident belongs to society 1, attempting to access society 999 or society 2
    const res = await request(app)
      .get('/api/v1/analytics/society/2')
      .set('Authorization', `Bearer ${residentToken}`);

    // Expect 403 Forbidden
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access restricted to your registered society');
  });

  it('rejects BOLA review forgery for bookings not owned by the caller', async () => {
    // Booking 9999 does not belong to resident
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        bookingId: 999999,
        rating: 5,
        comment: 'Unauthorized review forgery attempt'
      });

    expect(res.status).toBe(404); // Or 403
  });

  it('verifies Razorpay webhook rejects missing or invalid signature', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-razorpay-signature', 'invalidsignaturehex1234')
      .send({ event: 'payment.captured' });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('enforces strict input validation on dynamic pricing calculator', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/calculate')
      .send({ householdCount: 99999, mealService: 'INVALID_SERVICE' });

    expect(res.status).toBe(422);
  });
});
