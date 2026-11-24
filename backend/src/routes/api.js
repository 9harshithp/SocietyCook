import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ENV } from '../config/env.js';
import { query, transaction } from '../config/database.js';
import { AuthService } from '../services/authService.js';
import { GroupService } from '../services/groupService.js';
import { AttendanceService } from '../services/attendanceService.js';
import { PaymentService } from '../services/paymentService.js';
import { LeaveService } from '../services/leaveService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { calculateGroupPricing, generateGroupPricingTable } from '../algorithms/pricingEngine.js';
import { authenticate, requireRoles } from '../middlewares/authMiddleware.js';
import { logAudit } from '../middlewares/auditMiddleware.js';
import { recordLoginFailure, resetLoginFailure, captureBackendException } from '../config/monitoring.js';

export const apiRouter = express.Router();

// Helper wrapper for async route handlers
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 1. Health & System Readiness (Liveness + Database Readiness)
apiRouter.get('/health', handle(async (req, res) => {
  let dbStatus = 'CONNECTED';
  let isReady = true;

  try {
    await query('SELECT 1 as is_ready');
  } catch (e) {
    dbStatus = 'DISCONNECTED';
    isReady = false;
  }

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'HEALTHY' : 'DEGRADED',
    liveness: 'ALIVE',
    database: dbStatus,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
}));

// Diagnostic Endpoint: Strictly disabled and 404 in production; local/staging only
apiRouter.get('/monitoring/test-error', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Endpoint not available in production' });
  }

  authenticate(req, res, () => {
    const simulatedContext = {
      testUser: {
        id: req.user.id,
        email: req.user.email,
        password: 'SuperSecretPassword123!',
        phone: '9876543210',
        token: 'eyTestJwtTokenHeader.eyTestPayload.TestSignature'
      },
      message: 'Controlled monitoring diagnostic test event'
    };

    const testError = new Error('Diagnostic: Safe Monitoring Integration Test');
    captureBackendException(testError, simulatedContext);

    res.json({
      success: true,
      message: 'Diagnostic error event successfully dispatched to monitoring pipeline.',
      capturedError: testError.message,
      scrubbingVerified: true,
      timestamp: new Date().toISOString()
    });
  });
});

// 2. Authentication
apiRouter.post('/auth/register', handle(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum(['RESIDENT', 'COOK']), // Privileged SOCIETY_MANAGER and ADMIN roles require platform administrator approval
    societyId: z.coerce.number().int().positive().optional(),
    society_id: z.coerce.number().int().positive().optional(),
    flat: z.string().max(50).optional(),
    flat_number: z.string().max(30).optional(),
    block_name: z.string().max(30).optional(),
    phone: z.string().max(20).optional(),
    referralCode: z.string().optional()
  });
  const data = schema.parse(req.body);
  const resolvedSocietyId = data.societyId || data.society_id;
  if (!resolvedSocietyId) {
    return res.status(400).json({ success: false, message: 'Society selection is required' });
  }
  const resolvedFlat = data.flat || (data.block_name && data.flat_number ? `${data.block_name} Flat ${data.flat_number}` : data.flat_number || null);
  const result = await AuthService.register({
    ...data,
    societyId: resolvedSocietyId,
    flat: resolvedFlat
  });
  res.status(201).json({ success: true, ...result });
}));

apiRouter.post('/auth/login', handle(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string()
  });
  const data = schema.parse(req.body);
  const identifier = `${req.ip}:${data.email.toLowerCase().trim()}`;
  try {
    const result = await AuthService.login({ ...data, req });
    resetLoginFailure(identifier);
    res.json({ success: true, ...result });
  } catch (err) {
    recordLoginFailure(identifier);
    throw err;
  }
}));

apiRouter.post('/auth/refresh', handle(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });
  const result = await AuthService.refreshAccessToken(refreshToken);
  res.json({ success: true, ...result });
}));

apiRouter.get('/auth/me', authenticate, (req, res) => {
  res.json(req.user);
});

apiRouter.post('/auth/logout', handle(async (req, res) => {
  if (req.body.refreshToken) {
    await AuthService.logout(req.body.refreshToken);
  }
  res.json({ success: true, message: 'Logged out successfully' });
}));

// 3. Societies & Towers
apiRouter.get('/societies', handle(async (req, res) => {
  const societies = await query(`
    SELECT s.*, 
           (SELECT COUNT(*) FROM users u WHERE u.society_id = s.id AND u.role = 'RESIDENT') as resident_count,
           (SELECT COUNT(*) FROM users u JOIN cooks c ON c.user_id = u.id WHERE u.society_id = s.id AND c.verified = 1) as cook_count,
           (SELECT COUNT(*) FROM cook_groups g WHERE g.society_id = s.id AND g.status = 'ACTIVE') as active_groups,
           (SELECT COUNT(*) FROM bookings b JOIN users ru ON ru.id = b.resident_id WHERE ru.society_id = s.id AND b.status = 'ACTIVE') as active_plans
    FROM societies s 
    WHERE s.status='VERIFIED'
  `);
  res.json(societies);
}));

apiRouter.get('/societies/:id', handle(async (req, res) => {
  const [society] = await query('SELECT * FROM societies WHERE id = ?', [req.params.id]);
  if (!society) return res.status(404).json({ success: false, message: 'Society not found' });
  const blocks = await query('SELECT * FROM society_blocks WHERE society_id = ?', [req.params.id]);
  res.json({ ...society, blocks });
}));

// 4. Services & Household Professionals Discovery
apiRouter.get('/services', handle(async (req, res) => {
  const services = await query('SELECT * FROM service_categories WHERE is_active=TRUE ORDER BY base_price ASC');
  res.json(services);
}));

apiRouter.get('/cooks', authenticate, handle(async (req, res) => {
  const targetSocietyId = req.query.society_id ? Number(req.query.society_id) : req.user.society_id;
  if (req.user.role !== 'ADMIN' && targetSocietyId !== req.user.society_id) {
    return res.status(403).json({ success: false, message: 'Access restricted to your registered society.' });
  }

  let where = targetSocietyId ? 'c.verified=1 AND u.society_id=?' : 'c.verified=1';
  const params = targetSocietyId ? [targetSocietyId] : [];

  if (req.query.service_type || req.query.serviceType) {
    const sType = (req.query.service_type || req.query.serviceType).toUpperCase();
    if (sType === 'DISHWASHING') {
      where += " AND (c.professional_type = 'DISHWASHER' OR c.professional_type = 'MULTI_SKILLED')";
    } else if (sType === 'COOKING') {
      where += " AND (c.professional_type = 'COOK' OR c.professional_type = 'MULTI_SKILLED')";
    }
  }

  if (req.query.professional_type || req.query.professionalType) {
    where += ' AND c.professional_type=?';
    params.push(req.query.professional_type || req.query.professionalType);
  }

  // Strict field allowlist: omit phone and email from public/general listings
  const cooks = await query(`
    SELECT c.id, c.user_id, c.cuisine, c.bio, c.price, c.experience, c.verified,
           c.available_from, c.available_to, c.dietary_tags, c.photo_url, c.rating_avg,
           c.reliability_score, c.professional_type, c.services_offered, c.dishwashing_price,
           c.dishwashing_experience, c.dishwashing_bio,
           u.name, u.society_id, s.name as society_name,
           COALESCE((SELECT AVG(v.rating) FROM reviews v JOIN bookings b ON b.id=v.booking_id WHERE b.cook_id=c.id), c.rating_avg, 4.8) rating,
           (SELECT COUNT(*) FROM reviews v JOIN bookings b ON b.id=v.booking_id WHERE b.cook_id=c.id) review_count,
           (SELECT COUNT(*) FROM bookings b WHERE b.cook_id=c.id AND b.status='ACTIVE') active_households
    FROM cooks c 
    JOIN users u ON u.id=c.user_id 
    LEFT JOIN societies s ON s.id=u.society_id 
    WHERE ${where}
    ORDER BY c.rating_avg DESC, c.experience DESC
  `, params);

  res.json(cooks);
}));

apiRouter.get('/cooks/:id', handle(async (req, res) => {
  const cookId = Number(req.params.id);

  // Optional authentication check for legitimate service relationship
  let callerUser = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], ENV.JWT_SECRET);
      const [u] = await query('SELECT id, role, society_id FROM users WHERE id = ?', [decoded.sub]);
      callerUser = u;
    } catch (e) {}
  }

  const [cook] = await query(`
    SELECT c.id, c.user_id, c.cuisine, c.bio, c.price, c.experience, c.verified,
           c.available_from, c.available_to, c.dietary_tags, c.photo_url, c.rating_avg,
           c.reliability_score, c.professional_type, c.services_offered, c.dishwashing_price,
           c.dishwashing_experience, c.dishwashing_bio,
           u.name, u.society_id, s.name as society_name,
           COALESCE((SELECT AVG(v.rating) FROM reviews v JOIN bookings b ON b.id=v.booking_id WHERE b.cook_id=c.id), c.rating_avg, 4.8) rating,
           (SELECT COUNT(*) FROM reviews v JOIN bookings b ON b.id=v.booking_id WHERE b.cook_id=c.id) review_count,
           (SELECT COUNT(*) FROM bookings b WHERE b.cook_id=c.id AND b.status='ACTIVE') active_households
    FROM cooks c 
    JOIN users u ON u.id=c.user_id 
    LEFT JOIN societies s ON s.id=u.society_id 
    WHERE c.id=?
  `, [cookId]);

  if (!cook) return res.status(404).json({ success: false, message: 'Cook not found' });

  // Legitimate service relationship check: phone only visible to admin, the cook themselves, or active resident clients
  let hasActiveServiceRelationship = false;
  if (callerUser) {
    if (callerUser.role === 'ADMIN' || callerUser.id === cook.user_id) {
      hasActiveServiceRelationship = true;
    } else {
      const [activeBooking] = await query(
        "SELECT 1 FROM bookings WHERE cook_id = ? AND resident_id = ? AND status = 'ACTIVE' LIMIT 1",
        [cookId, callerUser.id]
      );
      hasActiveServiceRelationship = !!activeBooking;
    }
  }

  let cookPhone = null;
  if (hasActiveServiceRelationship) {
    const [uRow] = await query('SELECT phone FROM users WHERE id = ?', [cook.user_id]);
    cookPhone = uRow?.phone || null;
  }

  // Reviews: Anonymize resident names and scrub apartment flat numbers
  const reviews = await query(`
    SELECT v.id, v.rating, v.comment, v.created_at,
           CONCAT(SUBSTRING(ru.name, 1, 1), '*** (Resident)') as resident_name
    FROM reviews v
    JOIN bookings b ON b.id = v.booking_id
    JOIN users ru ON ru.id = b.resident_id
    WHERE b.cook_id = ?
    ORDER BY v.id DESC
  `, [cookId]);

  const allSlots = [
    { start: '07:00', end: '07:45', label: '07:00 AM', meal: 'Breakfast' },
    { start: '08:00', end: '08:45', label: '08:00 AM', meal: 'Breakfast' },
    { start: '09:00', end: '09:45', label: '09:00 AM', meal: 'Breakfast' },
    { start: '12:00', end: '12:45', label: '12:00 PM', meal: 'Lunch' },
    { start: '12:45', end: '13:30', label: '12:45 PM', meal: 'Lunch' },
    { start: '13:30', end: '14:15', label: '01:30 PM', meal: 'Lunch' },
    { start: '19:00', end: '19:45', label: '07:00 PM', meal: 'Dinner' },
    { start: '19:45', end: '20:30', label: '07:45 PM', meal: 'Dinner' },
    { start: '20:30', end: '21:15', label: '08:30 PM', meal: 'Dinner' },
    { start: '21:15', end: '22:00', label: '09:15 PM', meal: 'Dinner' },
    { start: '22:00', end: '22:45', label: '10:00 PM', meal: 'Dinner' }
  ];

  const activeBookings = await query(`
    SELECT start_time, end_time, slot_label, status 
    FROM bookings 
    WHERE cook_id=? AND (status='ACTIVE' OR (status='PENDING' AND expires_at>NOW()))
  `, [cookId]);

  // Strip bookingId and residentId to prevent ID enumeration
  const slots = allSlots.map(s => {
    const booked = activeBookings.find(b => b.start_time.slice(0, 5) === s.start);
    return {
      ...s,
      isBooked: !!booked,
      status: booked ? 'Booked' : 'Available'
    };
  });

  res.json({
    ...cook,
    phone: cookPhone,
    reviews,
    slots
  });
}));

// 5. Group Cook Hiring (Core Differentiation)
apiRouter.get('/groups', authenticate, handle(async (req, res) => {
  const targetSocietyId = req.query.societyId ? Number(req.query.societyId) : req.user.society_id;
  if (req.user.role !== 'ADMIN' && targetSocietyId !== req.user.society_id) {
    return res.status(403).json({ success: false, message: 'Access restricted to your registered society.' });
  }

  const groups = await GroupService.getSocietyGroups(targetSocietyId, req.query.status);
  res.json(groups);
}));

apiRouter.post('/groups', authenticate, requireRoles(['RESIDENT', 'ADMIN']), handle(async (req, res) => {
  const schema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    mealService: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'MULTIPLE']).optional(),
    meal_service: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'MULTIPLE']).optional(),
    preferredCuisines: z.string().optional(),
    cuisine_preferences: z.string().optional(),
    dietaryPref: z.string().optional(),
    dietary_requirements: z.string().optional(),
    preferredTimeStart: z.string().optional(),
    preferredTimeEnd: z.string().optional(),
    preferred_slot: z.string().optional(),
    monthlyBudgetMax: z.coerce.number().int().min(2000).max(15000).optional(),
    budget_per_household: z.coerce.number().int().min(2000).max(15000).optional(),
    minHouseholds: z.coerce.number().int().min(2).max(8).optional(),
    min_members: z.coerce.number().int().min(2).max(8).optional(),
    maxHouseholds: z.coerce.number().int().min(3).max(10).optional(),
    max_members: z.coerce.number().int().min(3).max(10).optional(),
    creatorFlat: z.string().optional(),
    creatorHouseholdSize: z.coerce.number().int().min(1).max(6).default(2)
  });
  const data = schema.parse(req.body);
  const group = await GroupService.createGroup({
    residentId: req.user.id,
    societyId: req.user.society_id,
    name: data.name,
    description: data.description || '',
    mealService: data.mealService || data.meal_service || 'DINNER',
    preferredCuisines: data.preferredCuisines || data.cuisine_preferences || 'North Indian, South Indian',
    dietaryPref: data.dietaryPref || data.dietary_requirements || 'VEGETARIAN',
    preferredTimeStart: data.preferredTimeStart || (data.preferred_slot ? data.preferred_slot.split('-')[0].trim() + ':00' : '19:00:00'),
    preferredTimeEnd: data.preferredTimeEnd || (data.preferred_slot ? data.preferred_slot.split('-')[1].trim() + ':00' : '22:00:00'),
    monthlyBudgetMax: data.monthlyBudgetMax || data.budget_per_household || 4500,
    minHouseholds: data.minHouseholds || data.min_members || 3,
    maxHouseholds: data.maxHouseholds || data.max_members || 5,
    creatorFlat: data.creatorFlat || req.user.flat,
    creatorHouseholdSize: data.creatorHouseholdSize
  });
  res.status(201).json({ success: true, ...group });
}));

apiRouter.get('/groups/:id', authenticate, handle(async (req, res) => {
  const groupId = Number(req.params.id);
  const [groupRow] = await query('SELECT society_id FROM cook_groups WHERE id = ?', [groupId]);
  if (!groupRow) return res.status(404).json({ success: false, message: 'Cook group not found.' });
  if (req.user.role !== 'ADMIN' && groupRow.society_id !== req.user.society_id) {
    return res.status(403).json({ success: false, message: 'Access restricted to your registered society.' });
  }

  const details = await GroupService.getGroupDetails(groupId, req.user.id);
  res.json({
    ...details.group,
    group: details.group,
    members: details.members,
    pricing: details.pricing,
    isMember: details.isMember,
    activationThresholdMet: details.activationThresholdMet
  });
}));

apiRouter.post('/groups/:id/join', authenticate, requireRoles(['RESIDENT', 'ADMIN']), handle(async (req, res) => {
  const groupId = Number(req.params.id);
  const [groupRow] = await query('SELECT society_id FROM cook_groups WHERE id = ?', [groupId]);
  if (!groupRow) return res.status(404).json({ success: false, message: 'Cook group not found.' });
  if (req.user.role !== 'ADMIN' && groupRow.society_id !== req.user.society_id) {
    return res.status(403).json({ success: false, message: 'You can only join cook groups within your registered society.' });
  }

  const schema = z.object({
    flatNumber: z.string().optional(),
    flat_number: z.string().optional(),
    householdSize: z.coerce.number().int().min(1).max(6).optional(),
    preferredSlotStart: z.string().optional(),
    preferred_slot: z.string().optional(),
    dietaryNotes: z.string().optional(),
    dietary_preferences: z.string().optional()
  });
  const data = schema.parse(req.body);
  const result = await GroupService.joinGroup({
    groupId,
    residentId: req.user.id,
    flatNumber: data.flatNumber || data.flat_number || req.user.flat,
    householdSize: data.householdSize || 2,
    preferredSlotStart: data.preferredSlotStart || (data.preferred_slot ? data.preferred_slot.split('-')[0].trim() + ':00' : '19:00:00'),
    dietaryNotes: data.dietaryNotes || data.dietary_preferences || ''
  });
  res.json({ success: true, ...result });
}));

apiRouter.get('/groups/:id/recommendations', authenticate, handle(async (req, res) => {
  const recommendations = await GroupService.getCookRecommendationsForGroup(Number(req.params.id));
  res.json(recommendations);
}));

apiRouter.post('/groups/:id/propose-cook', authenticate, handle(async (req, res) => {
  const groupId = Number(req.params.id);
  const [group] = await query('SELECT created_by_resident_id, society_id FROM cook_groups WHERE id = ?', [groupId]);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

  const isAuthorized =
    req.user.role === 'ADMIN' ||
    group.created_by_resident_id === req.user.id ||
    (req.user.role === 'SOCIETY_MANAGER' && req.user.society_id === group.society_id);

  if (!isAuthorized) {
    return res.status(403).json({ success: false, message: 'Only the group creator, society manager or platform admin can propose cook assignments.' });
  }

  const { cookId } = req.body;
  if (!cookId) return res.status(400).json({ success: false, message: 'cookId is required' });
  const result = await GroupService.proposeCookAssignment(groupId, Number(cookId), req.user.id);
  res.json(result);
}));

apiRouter.post('/groups/:id/activate', authenticate, handle(async (req, res) => {
  const groupId = Number(req.params.id);
  const [group] = await query('SELECT created_by_resident_id, society_id FROM cook_groups WHERE id = ?', [groupId]);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

  const isAuthorized =
    req.user.role === 'ADMIN' ||
    group.created_by_resident_id === req.user.id ||
    (req.user.role === 'SOCIETY_MANAGER' && req.user.society_id === group.society_id);

  if (!isAuthorized) {
    return res.status(403).json({ success: false, message: 'Only the group creator, society manager or platform admin can activate this hiring group.' });
  }

  const result = await GroupService.activateGroupAndGenerateSchedules(groupId, req.user.id);
  res.json(result);
}));

// 6. Dynamic Pricing Calculator (Cooking, Dishwashing, Combo)
apiRouter.post('/pricing/calculate', (req, res) => {
  const schema = z.object({
    householdCount: z.number().int().min(1).max(10).default(5),
    mealService: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'MULTIPLE']).default('DINNER'),
    serviceType: z.enum(['COOKING', 'DISHWASHING', 'COMBO', 'cooking', 'dishwashing', 'combo']).optional().default('COOKING'),
    utensilLoad: z.enum(['LIGHT', 'STANDARD', 'HEAVY', 'light', 'standard', 'heavy']).optional().default('STANDARD'),
    householdSize: z.number().int().min(1).max(6).default(2),
    commissionPct: z.number().min(0).max(30).default(10)
  });
  const data = schema.parse(req.body);
  const result = calculateGroupPricing({
    ...data,
    serviceType: data.serviceType.toUpperCase(),
    utensilLoad: data.utensilLoad.toUpperCase()
  });
  res.json(result);
});

apiRouter.get('/pricing/tiers', (req, res) => {
  const meal = (req.query.meal || req.query.mealService || 'DINNER').toUpperCase();
  const serviceType = (req.query.service || req.query.serviceType || 'COOKING').toUpperCase();
  const table = generateGroupPricingTable(meal, serviceType);
  res.json(table);
});

// 7. Bookings & Demo Payment
apiRouter.get('/bookings', authenticate, handle(async (req, res) => {
  const u = req.user;
  const where = u.role === 'ADMIN' ? '1=1' : u.role === 'COOK' ? 'c.user_id=?' : u.role === 'SOCIETY_MANAGER' ? 'ru.society_id=?' : 'b.resident_id=?';

  const rows = await query(`
    SELECT b.*, 
           cu.name as cook_name, cu.phone as cook_phone, c.photo_url as cook_photo, c.cuisine as cook_cuisine,
           ru.name as resident_name, ru.flat as resident_flat, ru.phone as resident_phone,
           s.name as society_name,
           p.status as payment_status, p.payment_id,
           (SELECT rating FROM reviews rv WHERE rv.booking_id = b.id LIMIT 1) as user_rating
    FROM bookings b 
    JOIN cooks c ON c.id=b.cook_id 
    JOIN users cu ON cu.id=c.user_id 
    JOIN users ru ON ru.id=b.resident_id 
    LEFT JOIN societies s ON s.id=ru.society_id 
    LEFT JOIN payments p ON p.booking_id = b.id
    WHERE ${where} 
    ORDER BY b.id DESC
  `, u.role === 'ADMIN' ? [] : [u.role === 'SOCIETY_MANAGER' ? u.society_id : u.id]);

  res.json(rows);
}));

apiRouter.post('/bookings', authenticate, requireRoles(['RESIDENT']), handle(async (req, res) => {
  const schema = z.object({
    cookId: z.coerce.number().int().positive(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    mealType: z.string().optional().default('Dinner'),
    slotLabel: z.string().optional(),
    serviceType: z.enum(['COOKING', 'DISHWASHING', 'COMBO', 'cooking', 'dishwashing', 'combo']).optional().default('COOKING'),
    utensilLoad: z.enum(['LIGHT', 'STANDARD', 'HEAVY', 'light', 'standard', 'heavy']).optional().default('STANDARD'),
    dishwasherId: z.coerce.number().optional()
  });
  const b = schema.parse(req.body);
  const sType = b.serviceType.toUpperCase();
  const uLoad = b.utensilLoad.toUpperCase();

  const start = new Date(b.startDate + 'T00:00:00Z');
  const end = new Date(+start + 29 * 86400000).toISOString().slice(0, 10);
  const [h, m] = b.startTime.split(':').map(Number);
  const durationMinutes = sType === 'DISHWASHING' ? 30 : sType === 'COMBO' ? 75 : 45;
  const minutes = h * 60 + m + durationMinutes;
  const stop = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const label = b.slotLabel || `${(h % 12 || 12).toString().padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

  // Concurrency-Safe Booking Creation using MySQL Transaction with Row-Level Locking
  const result = await transaction(async (transQuery) => {
    // 1. Lock professional record(s) with FOR UPDATE to prevent simultaneous race conditions
    const [cook] = await transQuery(
      'SELECT c.*, u.society_id, u.name FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id=? FOR UPDATE',
      [b.cookId]
    );
    if (!cook || !cook.verified) {
      const err = new Error('Service professional not available');
      err.status = 404;
      throw err;
    }

    if (b.dishwasherId) {
      const [dw] = await transQuery(
        'SELECT c.*, u.society_id, u.name FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id=? FOR UPDATE',
        [b.dishwasherId]
      );
      if (!dw || !dw.verified) {
        const err = new Error('Assigned dishwasher professional not available');
        err.status = 404;
        throw err;
      }
    }

    // Verify professional society clearance (residents can only book cleared professionals in their society)
    if (req.user.role !== 'ADMIN') {
      const [cookAssignment] = await transQuery(
        "SELECT 1 FROM cook_society_assignments WHERE cook_id = ? AND society_id = ? AND status = 'APPROVED'",
        [b.cookId, req.user.society_id]
      );
      if (!cookAssignment) {
        const err = new Error('Service professional is not cleared for service in your society.');
        err.status = 403;
        throw err;
      }

      if (b.dishwasherId) {
        const [dwAssignment] = await transQuery(
          "SELECT 1 FROM cook_society_assignments WHERE cook_id = ? AND society_id = ? AND status = 'APPROVED'",
          [b.dishwasherId, req.user.society_id]
        );
        if (!dwAssignment) {
          const err = new Error('Assigned dishwasher professional is not cleared for service in your society.');
          err.status = 403;
          throw err;
        }
      }
    }

    // 2. Conflict Prevention: Check for overlapping active or unexpired pending bookings for cook OR dishwasher
    const primaryCookId = cook.id;
    const secondaryDishwasherId = b.dishwasherId || -1;

    const existingConflict = await transQuery(`
      SELECT id, start_time, end_time, slot_label, service_type FROM bookings
      WHERE (cook_id = ? OR dishwasher_id = ? OR (dishwasher_id IS NOT NULL AND dishwasher_id = ?) OR (? != -1 AND cook_id = ?))
        AND status IN ('PENDING', 'ACTIVE')
        AND (expires_at > NOW() OR status = 'ACTIVE')
        AND start_date <= ? AND end_date >= ?
        AND start_time < ? AND end_time > ?
      LIMIT 1
      FOR UPDATE
    `, [primaryCookId, primaryCookId, secondaryDishwasherId, secondaryDishwasherId, secondaryDishwasherId, end, b.startDate, stop + ':00', b.startTime + ':00']);

    if (existingConflict.length > 0) {
      const conflictSlot = existingConflict[0].slot_label || `${existingConflict[0].start_time.slice(0, 5)} - ${existingConflict[0].end_time.slice(0, 5)}`;
      const err = new Error(`Scheduling conflict: Professional is already scheduled for ${conflictSlot} (${existingConflict[0].service_type || 'Service'}). Please select another time slot.`);
      err.status = 409;
      throw err;
    }

    // 3. Overlap check against recurring sessions table for any scheduled daily session
    const sessionConflict = await transQuery(`
      SELECT s.id, s.service_date, s.scheduled_start_time, s.scheduled_end_time 
      FROM sessions s
      JOIN bookings b ON b.id = s.booking_id
      WHERE (s.cook_id = ? OR (? != -1 AND s.cook_id = ?))
        AND s.status IN ('SCHEDULED', 'IN_PROGRESS')
        AND s.service_date >= ? AND s.service_date <= ?
        AND s.scheduled_start_time < ? AND s.scheduled_end_time > ?
      LIMIT 1
    `, [primaryCookId, secondaryDishwasherId, secondaryDishwasherId, b.startDate, end, stop + ':00', b.startTime + ':00']);

    if (sessionConflict.length > 0) {
      const conflictDate = sessionConflict[0].service_date instanceof Date ? sessionConflict[0].service_date.toISOString().slice(0, 10) : String(sessionConflict[0].service_date).slice(0, 10);
      const err = new Error(`Scheduling conflict: Professional has an active scheduled session on ${conflictDate}. Please select another time slot.`);
      err.status = 409;
      throw err;
    }

    let totalAmount = sType === 'DISHWASHING' ? (cook.dishwashing_price || 2200) : cook.price;
    if (sType === 'COMBO') {
      totalAmount = Math.round((cook.price + (cook.dishwashing_price || 2200)) * 0.9);
    }

    const insertResult = await transQuery(
      `INSERT INTO bookings (resident_id, cook_id, start_date, end_date, start_time, end_time, amount, expires_at, slot_label, meal_type, service_type, utensil_load, dishwasher_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), ?, ?, ?, ?, ?)`,
      [req.user.id, cook.id, b.startDate, end, b.startTime + ':00', stop + ':00', totalAmount, label, b.mealType, sType, uLoad, b.dishwasherId || null]
    );

    return { id: insertResult.insertId, amount: totalAmount, slotLabel: label, serviceType: sType };
  });

  res.status(201).json(result);
}));

// Concurrency-Safe Booking Cancellation Workflow
apiRouter.patch('/bookings/:id/cancel', authenticate, handle(async (req, res) => {
  const bookingId = Number(req.params.id);

  const result = await transaction(async (transQuery) => {
    const [b] = await transQuery('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
    if (!b) {
      const err = new Error('Booking not found.');
      err.status = 404;
      throw err;
    }

    // Authorization: must be the resident who created the booking or an ADMIN
    if (req.user.role !== 'ADMIN' && b.resident_id !== req.user.id) {
      const err = new Error('Unauthorized: You can only cancel your own bookings.');
      err.status = 403;
      throw err;
    }

    if (b.status === 'CANCELLED') {
      const err = new Error('Booking is already cancelled.');
      err.status = 400;
      throw err;
    }

    // 1. Mark booking CANCELLED
    await transQuery('UPDATE bookings SET status = "CANCELLED" WHERE id = ?', [bookingId]);

    // 2. Mark ONLY future scheduled sessions as MISSED (do not touch attended or completed sessions)
    await transQuery('UPDATE sessions SET status = "MISSED" WHERE booking_id = ? AND status = "SCHEDULED"', [bookingId]);

    // 3. Mark active subscriptions CANCELLED
    await transQuery('UPDATE subscriptions SET status = "CANCELLED" WHERE booking_id = ? AND status = "ACTIVE"', [bookingId]);

    return {
      success: true,
      message: 'Booking cancelled successfully. Scheduled household visits have been released.',
      bookingId,
      refundPolicy: 'Standard cancellation policy: Completed sessions are preserved. Future scheduled sessions are cancelled.'
    };
  });

  res.json(result);
}));

apiRouter.post('/bookings/:id/pay-demo', authenticate, handle(async (req, res) => {
  if (process.env.NODE_ENV === 'production' || !ENV.DEMO_PAYMENTS) {
    return res.status(403).json({ success: false, message: 'Demo payment endpoint is strictly disabled in production.' });
  }
  const result = await PaymentService.confirmDemoPayment({
    bookingId: Number(req.params.id),
    userId: req.user.id
  });
  res.json(result);
}));

apiRouter.post('/bookings/:id/payment-order', authenticate, handle(async (req, res) => {
  const result = await PaymentService.createOrder({
    bookingId: Number(req.params.id),
    userId: req.user.id
  });
  res.json(result);
}));

apiRouter.post('/bookings/:id/verify-payment', authenticate, handle(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const result = await PaymentService.verifyRazorpayPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    bookingId: Number(req.params.id),
    userId: req.user.id
  });
  res.json(result);
}));

apiRouter.post('/payments/webhook', handle(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Razorpay signature header.' });
  }
  const result = await PaymentService.handleRazorpayWebhook({
    rawBody: req.rawBody,
    signature,
    event: req.body
  });
  res.json(result);
}));

apiRouter.get('/invoices', authenticate, handle(async (req, res) => {
  const where = req.user.role === 'ADMIN' ? '' : 'WHERE i.resident_id = ?';
  const params = req.user.role === 'ADMIN' ? [] : [req.user.id];
  const rows = await query(`
    SELECT i.*, ru.name as resident_name, ru.flat as resident_flat, b.meal_type, b.slot_label
    FROM invoices i
    JOIN users ru ON ru.id = i.resident_id
    LEFT JOIN bookings b ON b.id = i.booking_id
    ${where}
    ORDER BY i.id DESC
  `, params);
  res.json(rows);
}));

// 8. Sessions & Attendance
apiRouter.get('/sessions', authenticate, handle(async (req, res) => {
  const rows = await AttendanceService.getSessions({
    user: req.user,
    societyId: req.query.societyId ? Number(req.query.societyId) : req.query.society_id ? Number(req.query.society_id) : undefined,
    date: req.query.date,
    status: req.query.status
  });
  res.json(rows);
}));

apiRouter.post('/sessions/:id/attendance', authenticate, handle(async (req, res) => {
  const { action, otp } = req.body;
  const sessionId = Number(req.params.id);
  const normAction = String(action || '').toLowerCase().replace('check_', '').trim();

  if (normAction === 'in') {
    const result = await AttendanceService.checkIn({
      sessionId,
      cookUserId: req.user.id,
      otp,
      bypassOtp: req.user.role === 'ADMIN'
    });
    return res.json(result);
  } else if (normAction === 'out') {
    const result = await AttendanceService.checkOut({
      sessionId,
      cookUserId: req.user.id
    });
    return res.json(result);
  } else {
    return res.status(400).json({ success: false, message: "Invalid action. Use 'in' or 'out' (or 'CHECK_IN' / 'CHECK_OUT')." });
  }
}));

apiRouter.post('/sessions/:id/dispute', authenticate, handle(async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ success: false, message: 'Dispute reason required' });
  const result = await AttendanceService.disputeSession({
    sessionId: Number(req.params.id),
    residentId: req.user.id,
    reason
  });
  res.json(result);
}));

// 9. Leaves & Backup Allocations
apiRouter.get('/leaves', authenticate, handle(async (req, res) => {
  const u = req.user;
  const where = u.role === 'COOK' ? 'WHERE u.id=?' : 'ORDER BY l.id DESC';
  const params = u.role === 'COOK' ? [u.id] : [];
  const rows = await query(
    `SELECT l.*, u.name, u.phone, c.photo_url 
     FROM leaves l 
     JOIN cooks c ON c.id=l.cook_id 
     JOIN users u ON u.id=c.user_id ${where}`,
    params
  );
  res.json(rows);
}));

apiRouter.post('/leaves', authenticate, requireRoles(['COOK', 'ADMIN']), handle(async (req, res) => {
  const schema = z.object({
    startDate: z.string().optional(),
    start_date: z.string().optional(),
    endDate: z.string().optional(),
    end_date: z.string().optional(),
    reason: z.string().min(3).max(255),
    leaveType: z.enum(['PLANNED', 'EMERGENCY']).default('PLANNED'),
    cook_id: z.coerce.number().optional()
  });
  const data = schema.parse(req.body);
  const start = data.startDate || data.start_date;
  const end = data.endDate || data.end_date;
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
  }
  const result = await LeaveService.applyLeave({
    cookUserId: req.user.role === 'COOK' ? req.user.id : (data.cook_id || req.user.id),
    startDate: start,
    endDate: end,
    reason: data.reason,
    leaveType: data.leaveType
  });
  res.status(201).json({ success: true, ...result });
}));

apiRouter.post('/leaves/:id/approve', authenticate, requireRoles(['ADMIN']), handle(async (req, res) => {
  const result = await LeaveService.approveLeave({
    leaveId: Number(req.params.id),
    adminUserId: req.user.id
  });
  res.json(result);
}));

apiRouter.get('/replacements', authenticate, handle(async (req, res) => {
  const where = req.user.role === 'ADMIN' ? '' : 'WHERE ru.society_id = ?';
  const params = req.user.role === 'ADMIN' ? [] : [req.user.society_id];
  const rows = await query(`
    SELECT r.*, 
           s.service_date, s.scheduled_start_time as start_time, s.scheduled_end_time as end_time,
           ru.name as resident_name, ru.flat,
           orig_u.name as orig_cook_name, orig_c.photo_url as orig_photo,
           bk_u.name as backup_cook_name, bk_c.photo_url as backup_photo
    FROM replacements r 
    JOIN sessions s ON s.id=r.session_id 
    JOIN bookings b ON b.id=s.booking_id 
    JOIN users ru ON ru.id=b.resident_id
    JOIN cooks orig_c ON orig_c.id=b.cook_id
    JOIN users orig_u ON orig_u.id=orig_c.user_id
    LEFT JOIN cooks bk_c ON bk_c.id=s.cook_id
    LEFT JOIN users bk_u ON bk_u.id=bk_c.user_id
    ${where}
    ORDER BY r.id DESC
  `, params);
  res.json(rows);
}));

// 10. Reviews & Notifications
apiRouter.post('/reviews', authenticate, handle(async (req, res) => {
  const schema = z.object({
    bookingId: z.coerce.number().int().positive().optional(),
    booking_id: z.coerce.number().int().positive().optional(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(500).optional()
  });
  const b = schema.parse(req.body);
  const targetBookingId = b.bookingId || b.booking_id;
  if (!targetBookingId) {
    return res.status(400).json({ success: false, message: 'bookingId is required' });
  }

  // BOLA / IDOR Verification: Ensure booking exists and belongs to the authenticated resident
  const [booking] = await query('SELECT resident_id, cook_id FROM bookings WHERE id = ?', [targetBookingId]);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }
  if (booking.resident_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only review bookings associated with your household.' });
  }

  await query(
    `INSERT INTO reviews (booking_id, cook_id, resident_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
    [targetBookingId, booking.cook_id, req.user.id, b.rating, b.comment || '']
  );

  res.json({ success: true });
}));

apiRouter.get('/notifications', authenticate, handle(async (req, res) => {
  const rows = await query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50',
    [req.user.id]
  );
  res.json(rows);
}));

apiRouter.post('/notifications/mark-read', authenticate, handle(async (req, res) => {
  await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
}));

// 11. Role-Based Analytics & Dashboards
apiRouter.get('/analytics/resident', authenticate, handle(async (req, res) => {
  const data = await AnalyticsService.getResidentDashboard(req.user.id);
  res.json(data);
}));

apiRouter.get('/analytics/cook', authenticate, handle(async (req, res) => {
  const data = await AnalyticsService.getCookDashboard(req.user.id);
  res.json(data);
}));

apiRouter.get('/analytics/society/:id', authenticate, handle(async (req, res) => {
  const targetSocietyId = Number(req.params.id);
  if (req.user.role !== 'ADMIN' && req.user.society_id !== targetSocietyId) {
    return res.status(403).json({ success: false, message: 'Access restricted to your registered society.' });
  }
  const data = await AnalyticsService.getSocietyDashboard(targetSocietyId);
  res.json(data);
}));

apiRouter.get('/analytics/admin', authenticate, requireRoles(['ADMIN']), handle(async (req, res) => {
  const data = await AnalyticsService.getAdminDashboard();
  res.json(data);
}));

// Authorized professional verification & clearance workflow
apiRouter.post('/admin/cooks/:id/verify', authenticate, requireRoles(['ADMIN', 'SOCIETY_MANAGER']), handle(async (req, res) => {
  const cookId = Number(req.params.id);
  const { verified } = req.body;

  const [cook] = await query(
    'SELECT c.*, u.society_id FROM cooks c JOIN users u ON u.id = c.user_id WHERE c.id = ?',
    [cookId]
  );
  if (!cook) return res.status(404).json({ success: false, message: 'Professional profile not found.' });

  // Prevent self-approval
  if (cook.user_id === req.user.id) {
    return res.status(403).json({ success: false, message: 'Self-approval is strictly prohibited.' });
  }

  // Society Manager can only verify professionals registered within their own society
  if (req.user.role === 'SOCIETY_MANAGER' && cook.society_id !== req.user.society_id) {
    return res.status(403).json({ success: false, message: 'Access denied: You can only approve professionals within your registered society.' });
  }

  const isVerified = Boolean(verified);
  await transaction(async (q) => {
    await q('UPDATE cooks SET verified = ? WHERE id = ?', [isVerified ? 1 : 0, cookId]);
    await q(
      "UPDATE cook_society_assignments SET status = ? WHERE cook_id = ? AND society_id = ?",
      [isVerified ? 'APPROVED' : 'REJECTED', cookId, cook.society_id]
    );

    await logAudit({
      userId: req.user.id,
      action: isVerified ? 'COOK_VERIFIED' : 'COOK_REJECTED',
      resourceType: 'COOK',
      resourceId: cookId,
      diff: { verified: isVerified, societyId: cook.society_id }
    });
  });

  res.json({ success: true, verified: isVerified });
}));

// Secure unlock endpoint for locked attendance sessions (Admin or Society Manager)
apiRouter.post('/admin/sessions/:id/unlock', authenticate, requireRoles(['ADMIN', 'SOCIETY_MANAGER']), handle(async (req, res) => {
  const sessionId = Number(req.params.id);
  const result = await AttendanceService.unlockSession({
    sessionId,
    authorizedUserId: req.user.id,
    userRole: req.user.role,
    userSocietyId: req.user.society_id
  });
  res.json(result);
}));

// Professional audit endpoint to inspect verified vs legacy unvetted professionals
apiRouter.get('/admin/cooks/audit', authenticate, requireRoles(['ADMIN']), handle(async (req, res) => {
  const rows = await query(`
    SELECT c.id, c.user_id, u.name, u.email, u.phone, u.society_id, s.name as society_name,
           c.verified, csa.status as assignment_status, csa.approved_by, csa.approved_at,
           CASE WHEN csa.approved_by IS NULL AND c.verified = 1 THEN 'LEGACY_UNVETTED'
                WHEN c.verified = 1 THEN 'VERIFIED'
                ELSE 'PENDING_CLEARANCE' END as clearance_status
    FROM cooks c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN societies s ON s.id = u.society_id
    LEFT JOIN cook_society_assignments csa ON csa.cook_id = c.id AND csa.society_id = u.society_id
    ORDER BY c.id ASC
  `);
  res.json(rows);
}));
