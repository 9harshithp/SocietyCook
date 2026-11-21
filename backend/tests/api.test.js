import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('SocietyCook v2 Endpoints Integration Test', () => {
  let residentToken = '';

  beforeAll(async () => {
    // Authenticate as resident
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resident@example.com', password: 'Demo12345!' });

    if (res.body?.token || res.body?.accessToken) {
      residentToken = res.body.token || res.body.accessToken;
    }
  });

  it('GET /api/v1/health returns status HEALTHY', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.version).toBe('2.0.0');
  });

  it('POST /api/v1/pricing/calculate returns group savings and tiers', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/calculate')
      .send({ householdCount: 5, mealService: 'DINNER' });

    expect(res.status).toBe(200);
    expect(res.body.pricePerHousehold).toBe(4000);
    expect(res.body.totalGrossMonthly).toBe(20000);
    expect(res.body.savingsPercentage).toBeGreaterThanOrEqual(40);
  });

  it('GET /api/v1/groups returns active hiring groups in society', async () => {
    const res = await request(app)
      .get('/api/v1/groups?societyId=1')
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('pricingEstimate');
  });

  it('GET /api/v1/cooks returns verified cooks in society', async () => {
    const res = await request(app)
      .get('/api/v1/cooks')
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/analytics/resident returns real analytics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/resident')
      .set('Authorization', `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('estimatedSavings');
    expect(res.body).toHaveProperty('activeSubscriptionsCount');
  });

  it('POST /api/v1/bookings creates a booking and enforces scheduling conflict checks', async () => {
    // 1. Create a primary booking for tomorrow at 18:00
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        cookId: 1,
        startDate: tomorrow,
        startTime: '18:00',
        mealType: 'Dinner',
        serviceType: 'COMBO',
        utensilLoad: 'STANDARD'
      });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body).toHaveProperty('id');
    expect(bookingRes.body.serviceType).toBe('COMBO');
    const createdId = bookingRes.body.id;

    // 2. Attempt duplicate booking for the same cook at the overlapping slot (18:15)
    const conflictRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        cookId: 1,
        startDate: tomorrow,
        startTime: '18:15',
        mealType: 'Dinner',
        serviceType: 'COOKING'
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.message).toContain('Scheduling conflict');

    // 3. Cancel the booking
    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${createdId}/cancel`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // 4. Verify double cancellation is rejected
    const reCancelRes = await request(app)
      .patch(`/api/v1/bookings/${createdId}/cancel`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(reCancelRes.status).toBe(400);
    expect(reCancelRes.body.message).toContain('already cancelled');
  });
});
