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
});
