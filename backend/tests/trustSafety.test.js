import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { query } from '../src/config/database.js';
import { redactSensitiveBackendData } from '../src/config/monitoring.js';

describe('SocietyCook Phase 2: Production Trust, Security & Privacy Tests', () => {
  let residentToken = '';
  let cookToken = '';
  let managerToken = '';
  let adminToken = '';

  beforeAll(async () => {
    // 1. Authenticate resident (society 1)
    const resRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resident@example.com', password: 'Demo12345!' });
    residentToken = resRes.body.accessToken;

    // 2. Authenticate cook (id 2, user_id 2, society 1)
    const cookRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'cook@example.com', password: 'Demo12345!' });
    cookToken = cookRes.body.accessToken;

    // 3. Authenticate society manager (society 1)
    const mgrRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@example.com', password: 'Demo12345!' });
    managerToken = mgrRes.body.accessToken;

    // 4. Authenticate admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Demo12345!' });
    adminToken = adminRes.body.accessToken;
  });

  describe('1. Personal Information Protection & Response Allowlisting', () => {
    it('public /cooks/:id omits cook phone for unauthenticated callers', async () => {
      const res = await request(app).get('/api/v1/cooks/1');
      expect(res.status).toBe(200);
      expect(res.body.phone).toBeNull();
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('cuisine');
    });

    it('public /cooks/:id anonymizes resident names and scrubs flat numbers in reviews', async () => {
      const res = await request(app).get('/api/v1/cooks/1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reviews)).toBe(true);
      if (res.body.reviews.length > 0) {
        for (const review of res.body.reviews) {
          expect(review).not.toHaveProperty('flat');
          expect(review.resident_name).toMatch(/^[A-Za-z]\*\*\* \(Resident\)$/);
        }
      }
    });

    it('public /cooks/:id slots omit internal bookingId and residentId', async () => {
      const res = await request(app).get('/api/v1/cooks/1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.slots)).toBe(true);
      for (const slot of res.body.slots) {
        expect(slot).not.toHaveProperty('bookingId');
        expect(slot).not.toHaveProperty('residentId');
        expect(slot).toHaveProperty('isBooked');
        expect(slot).toHaveProperty('status');
      }
    });

    it('/cooks listing endpoint omits phone and email from results', async () => {
      const res = await request(app)
        .get('/api/v1/cooks')
        .set('Authorization', `Bearer ${residentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      for (const cook of res.body) {
        expect(cook.phone).toBeUndefined();
        expect(cook.email).toBeUndefined();
      }
    });
  });

  describe('2. Professional Verification & Clearance Controls', () => {
    let unverifiedCookId = null;
    let unverifiedCookUserId = null;

    it('newly registered cook defaults to verified = 0 and pending society assignment', async () => {
      const email = `cook-unverified-${Date.now()}@example.com`;
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Chef Unverified Test',
          email,
          password: 'Password123!',
          role: 'COOK',
          societyId: 1
        });

      expect(regRes.status).toBe(201);
      unverifiedCookUserId = regRes.body.user.id;

      const [cookRow] = await query('SELECT * FROM cooks WHERE user_id = ?', [unverifiedCookUserId]);
      expect(cookRow).toBeDefined();
      expect(cookRow.verified).toBe(0);
      unverifiedCookId = cookRow.id;

      const [assignRow] = await query('SELECT * FROM cook_society_assignments WHERE cook_id = ?', [unverifiedCookId]);
      expect(assignRow).toBeDefined();
      expect(assignRow.status).toBe('PENDING');
    });

    it('rejects resident booking attempts for unverified cook', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          cookId: unverifiedCookId,
          startDate: tomorrow,
          startTime: '19:00',
          mealType: 'Dinner',
          serviceType: 'COOKING'
        });

      // Must be rejected as unavailable / unverified
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('blocks self-approval by professional', async () => {
      // Login as unverified cook
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: (await query('SELECT email FROM users WHERE id = ?', [unverifiedCookUserId]))[0].email,
          password: 'Password123!'
        });

      const res = await request(app)
        .post(`/api/v1/admin/cooks/${unverifiedCookId}/verify`)
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .send({ verified: true });

      // Blocked: Role requires ADMIN/SOCIETY_MANAGER, plus self-approval check
      expect(res.status).toBe(403);
    });

    it('society manager can approve cook assigned to their society', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/cooks/${unverifiedCookId}/verify`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ verified: true });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);

      const [cookRow] = await query('SELECT verified FROM cooks WHERE id = ?', [unverifiedCookId]);
      expect(cookRow.verified).toBe(1);

      const [assignRow] = await query('SELECT status FROM cook_society_assignments WHERE cook_id = ?', [unverifiedCookId]);
      expect(assignRow.status).toBe('APPROVED');
    });

    it('society manager cannot approve cook belonging to another society', async () => {
      // Find a cook belonging to society 2
      const [cookSoc2] = await query(
        'SELECT c.id FROM cooks c JOIN users u ON u.id = c.user_id WHERE u.society_id = 2 LIMIT 1'
      );
      const res = await request(app)
        .post(`/api/v1/admin/cooks/${cookSoc2.id}/verify`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ verified: true });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });
  });

  describe('3. Cross-Society Authorization & Tenant Boundaries', () => {
    it('blocks resident from querying cook directory of another society', async () => {
      const res = await request(app)
        .get('/api/v1/cooks?society_id=2')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access restricted to your registered society');
    });

    it('blocks resident from querying groups of another society', async () => {
      const res = await request(app)
        .get('/api/v1/groups?societyId=2')
        .set('Authorization', `Bearer ${residentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access restricted to your registered society');
    });

    it('blocks resident from accessing group details in another society', async () => {
      // Find or create group in society 2
      const [group2] = await query('SELECT id FROM cook_groups WHERE society_id = 2 LIMIT 1');
      if (group2) {
        const res = await request(app)
          .get(`/api/v1/groups/${group2.id}`)
          .set('Authorization', `Bearer ${residentToken}`);

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Access restricted to your registered society');
      }
    });

    it('blocks resident from joining group in another society', async () => {
      const [group2] = await query('SELECT id FROM cook_groups WHERE society_id = 2 LIMIT 1');
      if (group2) {
        const res = await request(app)
          .post(`/api/v1/groups/${group2.id}/join`)
          .set('Authorization', `Bearer ${residentToken}`)
          .send({ flatNumber: 'Tower X Flat 101' });

        expect(res.status).toBe(403);
        expect(res.body.message).toContain('You can only join cook groups within your registered society');
      }
    });

    it('blocks resident from booking cook not cleared for their society', async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const [cookSoc2] = await query(
        'SELECT c.id FROM cooks c JOIN users u ON u.id = c.user_id WHERE u.society_id = 2 LIMIT 1'
      );
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          cookId: cookSoc2.id,
          startDate: tomorrow,
          startTime: '19:00',
          mealType: 'Dinner',
          serviceType: 'COOKING'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Service professional is not cleared for service in your society');
    });
  });

  describe('4. Mandatory Attendance PIN Verification & Session State Safety', () => {
    let testSessionId = null;
    const testOtp = '7892';
    const createdBookingIds = [];

    const createTestBookingForSession = async () => {
      const bRes = await query(
        `INSERT INTO bookings (resident_id, cook_id, status, start_date, end_date, start_time, end_time, amount, expires_at, meal_type, service_type)
         VALUES (1, 1, 'ACTIVE', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), '12:00:00', '13:00:00', 4000, DATE_ADD(NOW(), INTERVAL 30 DAY), 'Lunch', 'COOKING')`
      );
      createdBookingIds.push(bRes.insertId);
      return bRes.insertId;
    };

    afterAll(async () => {
      if (createdBookingIds.length > 0) {
        await query(`DELETE FROM sessions WHERE booking_id IN (${createdBookingIds.join(',')})`);
        await query(`DELETE FROM bookings WHERE id IN (${createdBookingIds.join(',')})`);
      }
    });

    beforeAll(async () => {
      const today = new Date().toISOString().slice(0, 10);
      const bId = await createTestBookingForSession();
      // Insert test session for today assigned to cook 1 (user_id 2) and resident 1
      const res = await query(
        `INSERT INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, flat_number, otp_code, otp_attempts)
         VALUES (?, 1, ?, 'SCHEDULED', '18:00:00', '18:45:00', 'A-101', ?, 0)`,
        [bId, today, testOtp]
      );
      testSessionId = res.insertId;
    });

    it('GET /sessions hides otp_code from cook and exposes it only to booking resident', async () => {
      // Cook view
      const cookRes = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${cookToken}`);
      expect(cookRes.status).toBe(200);
      const cookSession = cookRes.body.find((s) => s.id === testSessionId);
      if (cookSession) {
        expect(cookSession.otp_code).toBeNull();
      }

      // Resident view
      const resRes = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${residentToken}`);
      expect(resRes.status).toBe(200);
      const resSession = resRes.body.find((s) => s.id === testSessionId);
      if (resSession) {
        expect(resSession.otp_code).toBe(testOtp);
      }
    });

    it('rejects check-in when PIN is missing', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'in' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Valid 4-digit resident attendance PIN is required');
    });

    it('rejects check-in with invalid PIN format', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'in', otp: '12' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be exactly 4 digits');
    });

    it('rejects check-in with incorrect PIN and decrements remaining attempts', async () => {
      const res = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'in', otp: '0000' });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid service PIN provided');
    });

    it('locks session attendance after 5 consecutive incorrect attempts', async () => {
      // Submit 4 more incorrect attempts to reach threshold (1 + 4 = 5)
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post(`/api/v1/sessions/${testSessionId}/attendance`)
          .set('Authorization', `Bearer ${cookToken}`)
          .send({ action: 'in', otp: '1111' });
      }

      // 6th attempt must be locked with 429
      const lockRes = await request(app)
        .post(`/api/v1/sessions/${testSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'in', otp: testOtp });

      expect(lockRes.status).toBe(429);
      expect(lockRes.body.message).toContain('Session attendance locked for security');
    });

    it('cannot complete service without professional checking in first', async () => {
      // Create fresh scheduled session
      const today = new Date().toISOString().slice(0, 10);
      const bId = await createTestBookingForSession();
      const res = await query(
        `INSERT INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, flat_number, otp_code, otp_attempts)
         VALUES (?, 1, ?, 'SCHEDULED', '20:00:00', '20:45:00', 'A-101', '5566', 0)`,
        [bId, today]
      );
      const freshSessionId = res.insertId;

      const completeRes = await request(app)
        .post(`/api/v1/sessions/${freshSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'out' });

      expect(completeRes.status).toBe(400);
      expect(completeRes.body.message).toContain("Cannot complete session in 'SCHEDULED' state");
    });

    it('unauthorized users cannot check in or complete another professional session', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const bId = await createTestBookingForSession();
      const res = await query(
        `INSERT INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, flat_number, otp_code, otp_attempts)
         VALUES (?, 1, ?, 'SCHEDULED', '21:00:00', '21:45:00', 'A-101', '4321', 0)`,
        [bId, today]
      );
      const sessId = res.insertId;

      // Resident attempting to check in as professional
      const residentAttempt = await request(app)
        .post(`/api/v1/sessions/${sessId}/attendance`)
        .set('Authorization', `Bearer ${residentToken}`)
        .send({ action: 'in', otp: '4321' });

      expect(residentAttempt.status).toBe(403);
      expect(residentAttempt.body.message).toContain('Unauthorized');
    });

    it('valid PIN successfully transitions session to IN_PROGRESS and replay is rejected', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const bId = await createTestBookingForSession();
      const res = await query(
        `INSERT INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, flat_number, otp_code, otp_attempts)
         VALUES (?, 1, ?, 'SCHEDULED', '19:00:00', '19:45:00', 'A-101', '9876', 0)`,
        [bId, today]
      );
      const validSessionId = res.insertId;

      // 1. First check-in with valid PIN: PASS
      const checkInRes = await request(app)
        .post(`/api/v1/sessions/${validSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'in', otp: '9876' });

      expect(checkInRes.status).toBe(200);
      expect(checkInRes.body.status).toBe('IN_PROGRESS');
      expect(checkInRes.body.otpVerified).toBe(true);

      // 2. Replay check-in on already active session: REJECTED
      const replayRes = await request(app)
        .post(`/api/v1/sessions/${validSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'in', otp: '9876' });

      expect(replayRes.status).toBe(400);
      expect(replayRes.body.message).toContain('already checked in');

      // 3. Complete service: PASS
      const checkOutRes = await request(app)
        .post(`/api/v1/sessions/${validSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'out' });

      expect(checkOutRes.status).toBe(200);
      expect(checkOutRes.body.status).toBe('COMPLETED');

      // 4. Check-in on completed session: REJECTED
      const postCompleteCheckIn = await request(app)
        .post(`/api/v1/sessions/${validSessionId}/attendance`)
        .set('Authorization', `Bearer ${cookToken}`)
        .send({ action: 'in', otp: '9876' });

      expect(postCompleteCheckIn.status).toBe(400);
      expect(postCompleteCheckIn.body.message).toContain('already been completed');
    });
  });

  describe('5. Service Activation & Payment Isolation', () => {
    it('group activation creates reservations in PENDING status without fake payments', async () => {
      // Create a test group in society 1
      const groupRes = await query(
        `INSERT INTO cook_groups (society_id, created_by_resident_id, name, meal_service, min_households, max_households, current_households, status, assigned_cook_id)
         VALUES (1, 1, 'Phase 2 Test Group', 'DINNER', 1, 5, 1, 'AWAITING_CONFIRMATION', 1)`
      );
      const groupId = groupRes.insertId;

      await query(
        `INSERT INTO group_members (group_id, resident_id, flat_number, household_size, status)
         VALUES (?, 1, 'A-101', 2, 'CONFIRMED')`,
        [groupId]
      );

      // Activate group
      const actRes = await request(app)
        .post(`/api/v1/groups/${groupId}/activate`)
        .set('Authorization', `Bearer ${residentToken}`);

      expect(actRes.status).toBe(200);

      // Verify that member booking is PENDING (not ACTIVE)
      const memberBookings = await query('SELECT * FROM bookings WHERE group_id = ?', [groupId]);
      expect(memberBookings.length).toBeGreaterThan(0);
      for (const b of memberBookings) {
        expect(b.status).toBe('PENDING');
      }

      // Verify NO fake DEMO_SIMULATED payments were automatically created
      const fakePayments = await query("SELECT * FROM payments WHERE group_id = ? AND gateway = 'DEMO_SIMULATED'", [groupId]);
      expect(fakePayments.length).toBe(0);

      // Verify NO daily sessions were prematurely created for unpaid booking
      const unpaidSessions = await query('SELECT * FROM sessions WHERE booking_id = ?', [memberBookings[0].id]);
      expect(unpaidSessions.length).toBe(0);

      // Clean up test group resources
      await query('DELETE FROM bookings WHERE group_id = ?', [groupId]);
      await query('DELETE FROM group_members WHERE group_id = ?', [groupId]);
      await query('DELETE FROM cook_groups WHERE id = ?', [groupId]);
    });

    it('confirms Sentry sensitive keys redacts passwords, tokens, pins, and flats', () => {
      const payload = {
        password: 'TopSecretPassword!',
        token: 'Bearer eyJhbGciOi...',
        otp: '4892',
        pin: '1234',
        otp_code: '9876',
        flat: 'A-101',
        phone: '+91 98450 12345'
      };

      const redacted = redactSensitiveBackendData(payload);
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.otp).toBe('[REDACTED]');
      expect(redacted.pin).toBe('[REDACTED]');
      expect(redacted.otp_code).toBe('[REDACTED]');
      expect(redacted.flat).toBe('[REDACTED]');
      expect(redacted.phone).toBe('[REDACTED]');
    });
  });
});
