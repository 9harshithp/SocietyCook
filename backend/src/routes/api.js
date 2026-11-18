import express from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { AuthService } from '../services/authService.js';
import { GroupService } from '../services/groupService.js';
import { AttendanceService } from '../services/attendanceService.js';
import { PaymentService } from '../services/paymentService.js';
import { LeaveService } from '../services/leaveService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { calculateGroupPricing, generateGroupPricingTable } from '../algorithms/pricingEngine.js';
import { authenticate, requireRoles } from '../middlewares/authMiddleware.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

export const apiRouter = express.Router();

// Helper wrapper for async route handlers
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// 1. Health & System Readiness
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

// 2. Authentication
apiRouter.post('/auth/register', handle(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum(['RESIDENT', 'COOK', 'SOCIETY_MANAGER']),
    societyId: z.coerce.number().int().positive(),
    flat: z.string().max(30).optional(),
    phone: z.string().max(20).optional(),
    referralCode: z.string().optional()
  });
  const data = schema.parse(req.body);
  const result = await AuthService.register(data);
  res.status(201).json({ success: true, ...result });
}));

apiRouter.post('/auth/login', handle(async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string()
  });
  const data = schema.parse(req.body);
  const result = await AuthService.login({ ...data, req });
  res.json({ success: true, ...result });
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

// 4. Cooks Discovery & Profiles
apiRouter.get('/cooks', authenticate, handle(async (req, res) => {
  const targetSocietyId = req.query.society_id ? Number(req.query.society_id) : req.user.society_id;
  const where = targetSocietyId ? 'c.verified=1 AND u.society_id=?' : 'c.verified=1';
  const params = targetSocietyId ? [targetSocietyId] : [];

  const cooks = await query(`
    SELECT c.*, u.name, u.email, u.phone, u.society_id, s.name as society_name,
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
  const [cook] = await query(`
    SELECT c.*, u.name, u.phone, u.society_id, s.name as society_name,
           COALESCE((SELECT AVG(v.rating) FROM reviews v JOIN bookings b ON b.id=v.booking_id WHERE b.cook_id=c.id), c.rating_avg, 4.8) rating,
           (SELECT COUNT(*) FROM reviews v JOIN bookings b ON b.id=v.booking_id WHERE b.cook_id=c.id) review_count,
           (SELECT COUNT(*) FROM bookings b WHERE b.cook_id=c.id AND b.status='ACTIVE') active_households
    FROM cooks c 
    JOIN users u ON u.id=c.user_id 
    LEFT JOIN societies s ON s.id=u.society_id 
    WHERE c.id=?
  `, [cookId]);

  if (!cook) return res.status(404).json({ success: false, message: 'Cook not found' });

  const reviews = await query(`
    SELECT v.*, ru.name resident_name, ru.flat
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
    SELECT id, start_time, end_time, slot_label, resident_id, status 
    FROM bookings 
    WHERE cook_id=? AND (status='ACTIVE' OR (status='PENDING' AND expires_at>NOW()))
  `, [cookId]);

  const slots = allSlots.map(s => {
    const booked = activeBookings.find(b => b.start_time.slice(0, 5) === s.start);
    return {
      ...s,
      isBooked: !!booked,
      bookingId: booked?.id || null,
      status: booked ? 'Booked' : 'Available'
    };
  });

  res.json({ ...cook, reviews, slots });
}));

// 5. Group Cook Hiring (Core Differentiation)
apiRouter.get('/groups', authenticate, handle(async (req, res) => {
  const targetSocietyId = req.query.societyId ? Number(req.query.societyId) : req.user.society_id;
  const groups = await GroupService.getSocietyGroups(targetSocietyId, req.query.status);
  res.json(groups);
}));

apiRouter.post('/groups', authenticate, requireRoles(['RESIDENT', 'ADMIN']), handle(async (req, res) => {
  const schema = z.object({
    name: z.string().min(3).max(100),
    description: z.string().optional(),
    mealService: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'MULTIPLE']).default('DINNER'),
    preferredCuisines: z.string().default('North Indian, South Indian'),
    dietaryPref: z.string().default('VEGETARIAN'),
    preferredTimeStart: z.string().default('19:00:00'),
    preferredTimeEnd: z.string().default('22:00:00'),
    monthlyBudgetMax: z.number().int().min(2000).max(15000).default(4500),
    minHouseholds: z.number().int().min(2).max(8).default(3),
    maxHouseholds: z.number().int().min(3).max(10).default(5),
    creatorFlat: z.string().optional(),
    creatorHouseholdSize: z.number().int().min(1).max(6).default(2)
  });
  const data = schema.parse(req.body);
  const group = await GroupService.createGroup({
    residentId: req.user.id,
    societyId: req.user.society_id,
    ...data
  });
  res.status(201).json({ success: true, ...group });
}));

apiRouter.get('/groups/:id', authenticate, handle(async (req, res) => {
  const details = await GroupService.getGroupDetails(Number(req.params.id), req.user.id);
  res.json(details);
}));

apiRouter.post('/groups/:id/join', authenticate, requireRoles(['RESIDENT', 'ADMIN']), handle(async (req, res) => {
  const schema = z.object({
    flatNumber: z.string().optional(),
    householdSize: z.number().int().min(1).max(6).default(2),
    preferredSlotStart: z.string().default('19:00:00'),
    dietaryNotes: z.string().optional()
  });
  const data = schema.parse(req.body);
  const result = await GroupService.joinGroup({
    groupId: Number(req.params.id),
    residentId: req.user.id,
    ...data
  });
  res.json({ success: true, ...result });
}));

apiRouter.get('/groups/:id/recommendations', authenticate, handle(async (req, res) => {
  const recommendations = await GroupService.getCookRecommendationsForGroup(Number(req.params.id));
  res.json(recommendations);
}));

apiRouter.post('/groups/:id/propose-cook', authenticate, handle(async (req, res) => {
  const { cookId } = req.body;
  if (!cookId) return res.status(400).json({ success: false, message: 'cookId is required' });
  const result = await GroupService.proposeCookAssignment(Number(req.params.id), Number(cookId), req.user.id);
  res.json(result);
}));

apiRouter.post('/groups/:id/activate', authenticate, handle(async (req, res) => {
  const result = await GroupService.activateGroupAndGenerateSchedules(Number(req.params.id), req.user.id);
  res.json(result);
}));

// 6. Dynamic Pricing Calculator
apiRouter.post('/pricing/calculate', (req, res) => {
  const schema = z.object({
    householdCount: z.number().int().min(1).max(10).default(5),
    mealService: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'MULTIPLE']).default('DINNER'),
    householdSize: z.number().int().min(1).max(6).default(2),
    commissionPct: z.number().min(0).max(30).default(10)
  });
  const data = schema.parse(req.body);
  const result = calculateGroupPricing(data);
  res.json(result);
});

apiRouter.get('/pricing/tiers', (req, res) => {
  const meal = req.query.meal || 'DINNER';
  const table = generateGroupPricingTable(meal);
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
    slotLabel: z.string().optional()
  });
  const b = schema.parse(req.body);

  const start = new Date(b.startDate + 'T00:00:00Z');
  const end = new Date(+start + 29 * 86400000).toISOString().slice(0, 10);
  const [h, m] = b.startTime.split(':').map(Number);
  const minutes = h * 60 + m + 45;
  const stop = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  const [cook] = await query('SELECT c.*, u.society_id, u.name FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id=?', [b.cookId]);
  if (!cook || !cook.verified) return res.status(404).json({ success: false, message: 'Cook not available' });

  const label = b.slotLabel || `${(h % 12 || 12).toString().padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

  const result = await query(
    `INSERT INTO bookings (resident_id, cook_id, start_date, end_date, start_time, end_time, amount, expires_at, slot_label, meal_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), ?, ?)`,
    [req.user.id, cook.id, b.startDate, end, b.startTime + ':00', stop + ':00', cook.price, label, b.mealType]
  );

  res.status(201).json({ id: result.insertId, amount: cook.price, slotLabel: label });
}));

apiRouter.post('/bookings/:id/pay-demo', authenticate, handle(async (req, res) => {
  const result = await PaymentService.confirmDemoPayment({
    bookingId: Number(req.params.id),
    userId: req.user.id
  });
  res.json(result);
}));

// 8. Sessions & Attendance
apiRouter.get('/sessions', authenticate, handle(async (req, res) => {
  const rows = await AttendanceService.getSessions({
    user: req.user,
    date: req.query.date,
    status: req.query.status
  });
  res.json(rows);
}));

apiRouter.post('/sessions/:id/attendance', authenticate, handle(async (req, res) => {
  const { action, otp } = req.body;
  const sessionId = Number(req.params.id);

  if (action === 'in') {
    const result = await AttendanceService.checkIn({
      sessionId,
      cookUserId: req.user.id,
      otp,
      bypassOtp: req.user.role === 'ADMIN'
    });
    return res.json(result);
  } else if (action === 'out') {
    const result = await AttendanceService.checkOut({
      sessionId,
      cookUserId: req.user.id
    });
    return res.json(result);
  } else {
    return res.status(400).json({ success: false, message: "Invalid action. Use 'in' or 'out'." });
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

apiRouter.post('/leaves', authenticate, requireRoles(['COOK']), handle(async (req, res) => {
  const schema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().min(3).max(255),
    leaveType: z.enum(['PLANNED', 'EMERGENCY']).default('PLANNED')
  });
  const data = schema.parse(req.body);
  const result = await LeaveService.applyLeave({ cookUserId: req.user.id, ...data });
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
    ORDER BY r.id DESC
  `);
  res.json(rows);
}));

// 10. Reviews & Notifications
apiRouter.post('/reviews', authenticate, handle(async (req, res) => {
  const schema = z.object({
    bookingId: z.coerce.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional()
  });
  const b = schema.parse(req.body);

  await query(
    `INSERT INTO reviews (booking_id, rating, comment)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
    [b.bookingId, b.rating, b.comment || '']
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
  const data = await AnalyticsService.getSocietyDashboard(Number(req.params.id));
  res.json(data);
}));

apiRouter.get('/analytics/admin', authenticate, requireRoles(['ADMIN']), handle(async (req, res) => {
  const data = await AnalyticsService.getAdminDashboard();
  res.json(data);
}));

// Admin cook verification toggle
apiRouter.post('/admin/cooks/:id/verify', authenticate, requireRoles(['ADMIN']), handle(async (req, res) => {
  const { verified } = req.body;
  await query('UPDATE cooks SET verified = ? WHERE id = ?', [Boolean(verified), req.params.id]);
  res.json({ success: true, verified: Boolean(verified) });
}));
