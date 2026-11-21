import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { query } from '../src/config/database.js';

describe('Booking Concurrency & Safety Review Tests', () => {
  let residentToken = '';
  let otherResidentToken = '';
  let cookId = 1;

  beforeAll(async () => {
    // 1. Authenticate resident 1
    const res1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resident@example.com', password: 'Demo12345!' });
    residentToken = res1.body.token || res1.body.accessToken;

    // 2. Fetch or create a second resident for testing ownership / concurrency isolation
    const [existing] = await query("SELECT id, email FROM users WHERE role = 'RESIDENT' AND email != 'resident@example.com' LIMIT 1");
    if (existing) {
      const res2 = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: existing.email, password: 'Demo12345!' });
      otherResidentToken = res2.body.token || res2.body.accessToken;
    }

    // 3. Find verified cook
    const [cook] = await query("SELECT id FROM cooks WHERE verified = 1 LIMIT 1");
    if (cook) cookId = cook.id;
  });

  it('Concurrent Booking Prevention: Simultaneous overlapping requests serialize and reject duplicate with HTTP 409', async () => {
    // Clean up any test booking for this test slot first
    const testDate = '2027-10-10';
    const testTime = '13:30';

    await query("DELETE FROM bookings WHERE cook_id = ? AND start_date = ?", [cookId, testDate]);

    // Send TWO simultaneous booking requests for the exact same cook and time slot
    const req1 = request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        cookId,
        startDate: testDate,
        startTime: testTime,
        mealType: 'Lunch',
        serviceType: 'COOKING'
      });

    const req2 = request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        cookId,
        startDate: testDate,
        startTime: testTime,
        mealType: 'Lunch',
        serviceType: 'COOKING'
      });

    const [result1, result2] = await Promise.all([req1, req2]);

    const statuses = [result1.status, result2.status].sort();

    // Exactly one must succeed (201) and one must be rejected (409 Conflict)
    expect(statuses).toEqual([201, 409]);

    const conflictResp = result1.status === 409 ? result1.body : result2.body;
    expect(conflictResp.success).toBe(false);
    expect(conflictResp.message).toContain('Scheduling conflict');

    // Clean up created test booking
    const successResp = result1.status === 201 ? result1.body : result2.body;
    if (successResp.id) {
      await query("DELETE FROM bookings WHERE id = ?", [successResp.id]);
    }
  });

  it('Booking Cancellation: Checks authorization, updates state, and leaves completed sessions intact', async () => {
    const testDate = '2027-11-15';
    const testTime = '08:00';

    // 1. Create a test booking
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${residentToken}`)
      .send({
        cookId,
        startDate: testDate,
        startTime: testTime,
        mealType: 'Breakfast',
        serviceType: 'COOKING'
      });

    expect(createRes.status).toBe(201);
    const bookingId = createRes.body.id;

    // 2. Insert mock sessions: one SCHEDULED and one COMPLETED
    await query(
      `INSERT INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time)
       VALUES (?, ?, ?, 'SCHEDULED', '08:00:00', '08:45:00')`,
      [bookingId, cookId, '2027-11-16']
    );
    await query(
      `INSERT INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time)
       VALUES (?, ?, ?, 'COMPLETED', '08:00:00', '08:45:00')`,
      [bookingId, cookId, '2027-11-15']
    );

    // 3. Unauthorized user attempt (if otherResidentToken available)
    if (otherResidentToken) {
      const unauthRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${otherResidentToken}`);
      expect(unauthRes.status).toBe(403);
    }

    // 4. Authorized resident cancels booking
    const cancelRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.bookingId).toBe(bookingId);

    // 5. Verify sessions state transitions in database
    const sessions = await query('SELECT service_date, status FROM sessions WHERE booking_id = ? ORDER BY service_date ASC', [bookingId]);
    const completedSession = sessions.find(s => s.status === 'COMPLETED');
    const missedSession = sessions.find(s => s.status === 'MISSED');

    expect(completedSession).toBeDefined(); // COMPLETED session was NOT modified
    expect(missedSession).toBeDefined(); // SCHEDULED session transitioned to MISSED

    // 6. Idempotency check: Subsequent cancellation attempt returns HTTP 400
    const secondCancelRes = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${residentToken}`);

    expect(secondCancelRes.status).toBe(400);
    expect(secondCancelRes.body.message).toContain('already cancelled');

    // Clean up
    await query('DELETE FROM sessions WHERE booking_id = ?', [bookingId]);
    await query('DELETE FROM bookings WHERE id = ?', [bookingId]);
  });
});

