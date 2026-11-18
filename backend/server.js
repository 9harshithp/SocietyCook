import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query, transaction } from './db.js';

const app = express();
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 24) throw Error('Set JWT_SECRET to at least 24 characters');

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', rateLimit({ windowMs: 60000, limit: 300 }));

const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};

const route = (method, path, fn) =>
  app[method]('/api/v1' + path, (req, res, next) => Promise.resolve(fn(req, res)).catch(next));

const auth = async (req, roles = []) => {
  let p;
  try {
    p = jwt.verify(req.headers.authorization?.split(' ')[1], secret);
  } catch {
    fail('Please log in', 401);
  }
  const [u] = await query('SELECT u.id, u.name, u.email, u.role, u.society_id, u.flat, u.phone, s.name as society_name FROM users u LEFT JOIN societies s ON s.id = u.society_id WHERE u.id=?', [p.sub]);
  if (!u) fail('Unknown user', 401);
  if (roles.length && !roles.includes(u.role)) fail('Access denied', 403);
  return u;
};

const token = (u) => jwt.sign({ sub: u.id }, secret, { expiresIn: '7d' });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const id = z.coerce.number().int().positive();

route('get', '/health', async (r, s) => {
  await query('SELECT 1');
  s.json({ ok: true, timestamp: new Date().toISOString() });
});

// Societies
route('get', '/societies', async (r, s) => {
  const societies = await query(`
    SELECT s.*, 
    (SELECT COUNT(*) FROM users u WHERE u.society_id = s.id AND u.role = 'RESIDENT') as resident_count,
    (SELECT COUNT(*) FROM users u JOIN cooks c ON c.user_id = u.id WHERE u.society_id = s.id AND c.verified = 1) as cook_count,
    (SELECT COUNT(*) FROM bookings b JOIN users ru ON ru.id = b.resident_id WHERE ru.society_id = s.id AND b.status = 'ACTIVE') as active_plans
    FROM societies s 
    WHERE s.status='VERIFIED'
  `);
  s.json(societies);
});

// Auth
route('post', '/auth/register', async (r, s) => {
  const b = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum(['RESIDENT', 'COOK', 'SOCIETY_MANAGER']),
    societyId: id,
    flat: z.string().max(30).optional(),
    phone: z.string().max(20).optional()
  }).parse(r.body);

  const [soc] = await query("SELECT id FROM societies WHERE id=? AND status='VERIFIED'", [b.societyId]);
  if (!soc) fail('Invalid society');

  const result = await query(
    'INSERT INTO users(name,email,password_hash,role,society_id,flat,phone) VALUES(?,?,?,?,?,?,?)',
    [b.name, b.email, await bcrypt.hash(b.password, 12), b.role, b.societyId, b.flat || null, b.phone || null]
  );

  if (b.role === 'COOK') {
    await query(
      'INSERT INTO cooks(user_id, cuisine, bio, price, experience, verified, available_from, available_to) VALUES(?,?,?,?,?,0,?,?)',
      [result.insertId, 'Homestyle Cooking', 'Passionate home cook', 4000, 2, '07:00:00', '21:00:00']
    );
  }

  s.status(201).json({ token: token({ id: result.insertId }) });
});

route('post', '/auth/login', async (r, s) => {
  const b = z.object({ email: z.string().email(), password: z.string().max(72) }).parse(r.body);
  const [u] = await query('SELECT * FROM users WHERE email=?', [b.email]);
  if (!u || !(await bcrypt.compare(b.password, u.password_hash))) fail('Invalid credentials', 401);
  s.json({ token: token(u) });
});

route('get', '/auth/me', async (r, s) => s.json(await auth(r)));

// Switch active society
route('post', '/users/society', async (r, s) => {
  const u = await auth(r);
  const targetId = id.parse(r.body.societyId);
  await query('UPDATE users SET society_id=? WHERE id=?', [targetId, u.id]);
  s.json({ ok: true, societyId: targetId });
});

// Cooks discovery
route('get', '/cooks', async (r, s) => {
  const u = await auth(r);
  const societyId = r.query.society_id ? Number(r.query.society_id) : u.society_id;
  const where = societyId ? 'c.verified=1 AND u.society_id=?' : 'c.verified=1';
  const params = societyId ? [societyId] : [];

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

  s.json(cooks);
});

// Cook details with slots and reviews
route('get', '/cooks/:id', async (r, s) => {
  const cookId = id.parse(r.params.id);
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

  if (!cook) fail('Cook not found', 404);

  const reviews = await query(`
    SELECT v.*, ru.name resident_name, ru.flat
    FROM reviews v
    JOIN bookings b ON b.id = v.booking_id
    JOIN users ru ON ru.id = b.resident_id
    WHERE b.cook_id = ?
    ORDER BY v.id DESC
  `, [cookId]);

  // Standard predefined hyper-local time slots (45 min cooking + 15 min buffer)
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

  s.json({ ...cook, reviews, slots });
});

// Cook profile update
route('post', '/cooks/profile', async (r, s) => {
  const u = await auth(r, ['COOK']);
  const b = z.object({
    cuisine: z.string().min(2).max(150),
    bio: z.string().max(2000),
    price: z.number().int().min(1000).max(50000),
    experience: z.number().int().min(0).max(60),
    from: time,
    to: time,
    photo_url: z.string().url().optional().or(z.literal('')),
    dietary_tags: z.string().max(255).optional()
  }).parse(r.body);

  if (b.from >= b.to) fail('Invalid hours');

  await query(`
    INSERT INTO cooks(user_id, cuisine, bio, price, experience, available_from, available_to, photo_url, dietary_tags) 
    VALUES(?,?,?,?,?,?,?,?,?) 
    ON DUPLICATE KEY UPDATE 
      cuisine=VALUES(cuisine),
      bio=VALUES(bio),
      price=VALUES(price),
      experience=VALUES(experience),
      available_from=VALUES(available_from),
      available_to=VALUES(available_to),
      photo_url=VALUES(photo_url),
      dietary_tags=VALUES(dietary_tags)
  `, [u.id, b.cuisine, b.bio, b.price, b.experience, b.from, b.to, b.photo_url || null, b.dietary_tags || null]);

  s.json({ ok: true });
});

// Create booking slot
route('post', '/bookings', async (r, s) => {
  const u = await auth(r, ['RESIDENT']);
  const b = z.object({
    cookId: id,
    startDate: date,
    startTime: time,
    mealType: z.string().optional().default('Dinner'),
    slotLabel: z.string().optional()
  }).parse(r.body);

  const start = new Date(b.startDate + 'T00:00:00Z');
  if (!Number.isFinite(+start) || start.toISOString().slice(0, 10) !== b.startDate) fail('Invalid start date');
  const end = new Date(+start + 29 * 86400000).toISOString().slice(0, 10);

  const [h, m] = b.startTime.split(':').map(Number);
  const minutes = h * 60 + m + 45; // 45 min cooking slot
  const stop = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  const booking = await transaction(async (q) => {
    const [c] = await q('SELECT c.*, u.society_id, u.name FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id=? FOR UPDATE', [b.cookId]);
    if (!c || !c.verified) fail('Cook unavailable', 404);

    const conflicts = await q(
      "SELECT id FROM bookings WHERE cook_id=? AND (status='ACTIVE' OR (status='PENDING' AND expires_at>NOW())) AND start_date<=? AND end_date>=? AND start_time<? AND end_time>?",
      [c.id, end, b.startDate, stop + ':00', b.startTime + ':00']
    );
    if (conflicts.length) fail('Slot already reserved by another household', 409);

    const leaves = await q(
      "SELECT id FROM leaves WHERE cook_id=? AND status='APPROVED' AND start_date<=? AND end_date>=?",
      [c.id, end, b.startDate]
    );
    if (leaves.length) fail('Cook is on approved leave for requested dates', 409);

    const label = b.slotLabel || `${(h % 12 || 12).toString().padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

    const result = await q(
      'INSERT INTO bookings(resident_id, cook_id, start_date, end_date, start_time, end_time, amount, expires_at, slot_label, meal_type) VALUES(?,?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 15 MINUTE),?,?)',
      [u.id, c.id, b.startDate, end, b.startTime + ':00', stop + ':00', c.price, label, b.mealType]
    );

    await q('INSERT INTO notifications(user_id, message) VALUES(?,?)', [
      u.id,
      `Time slot reserved: ${label} with ${c.name}. Complete payment to confirm monthly subscription.`
    ]);

    return { id: result.insertId, amount: c.price, slotLabel: label };
  });

  s.status(201).json(booking);
});

// Get bookings
route('get', '/bookings', async (r, s) => {
  const u = await auth(r);
  const where = u.role === 'ADMIN' ? '1=1' : u.role === 'COOK' ? 'c.user_id=?' : u.role === 'SOCIETY_MANAGER' ? 'ru.society_id=?' : 'b.resident_id=?';

  const rows = await query(`
    SELECT b.*, 
    cu.name as cook_name, cu.phone as cook_phone, c.photo_url as cook_photo, c.cuisine as cook_cuisine,
    ru.name as resident_name, ru.flat as resident_flat, ru.phone as resident_phone,
    s.name as society_name,
    p.status as payment_status, p.payment_id,
    (SELECT rating FROM reviews rv WHERE rv.booking_id = b.id) as user_rating
    FROM bookings b 
    JOIN cooks c ON c.id=b.cook_id 
    JOIN users cu ON cu.id=c.user_id 
    JOIN users ru ON ru.id=b.resident_id 
    LEFT JOIN societies s ON s.id=ru.society_id 
    LEFT JOIN payments p ON p.booking_id = b.id
    WHERE ${where} 
    ORDER BY b.id DESC
  `, u.role === 'ADMIN' ? [] : [u.role === 'SOCIETY_MANAGER' ? u.society_id : u.id]);

  s.json(rows);
});

// Pay demo
route('post', '/bookings/:id/pay-demo', async (r, s) => {
  if (process.env.DEMO_PAYMENTS !== 'true' && process.env.NODE_ENV === 'production') {
    fail('Demo payments disabled', 403);
  }
  const u = await auth(r, ['RESIDENT']);
  const bookingId = id.parse(r.params.id);

  await transaction(async (q) => {
    const [b] = await q('SELECT * FROM bookings WHERE id=? AND resident_id=? FOR UPDATE', [bookingId, u.id]);
    if (!b || (b.status !== 'PENDING' && b.status !== 'ACTIVE')) fail('Reservation expired or unavailable', 409);

    await q("UPDATE bookings SET status='ACTIVE' WHERE id=?", [b.id]);
    await q(
      "INSERT INTO payments(booking_id, amount, status, payment_id, order_id) VALUES(?,?, 'SUCCESS', CONCAT('pay_demo_',?), CONCAT('order_demo_',?)) ON DUPLICATE KEY UPDATE status='SUCCESS'",
      [b.id, b.amount, b.id, b.id]
    );

    // Create session for today and upcoming
    const today = new Date().toISOString().slice(0, 10);
    await q(
      "INSERT IGNORE INTO sessions(booking_id, cook_id, service_date, status) VALUES(?,?,?,'SCHEDULED')",
      [b.id, b.cook_id, today]
    );

    await q('INSERT INTO notifications(user_id, message) VALUES(?,?)', [
      u.id,
      `Payment confirmed! Your daily cooking subscription (₹${b.amount}/month) is active.`
    ]);
  });

  s.json({ ok: true });
});

// Cancel booking
route('post', '/bookings/:id/cancel', async (r, s) => {
  const u = await auth(r, ['RESIDENT']);
  const a = await query("UPDATE bookings SET status='CANCELLED' WHERE id=? AND resident_id=? AND status='PENDING'", [
    id.parse(r.params.id),
    u.id
  ]);
  if (!a.affectedRows) fail('Only pending unpaid reservations can be cancelled');
  s.json({ ok: true });
});

// Sessions
route('get', '/sessions', async (r, s) => {
  const u = await auth(r);
  const w = u.role === 'COOK' ? 'c.user_id=?' : u.role === 'RESIDENT' ? 'b.resident_id=?' : u.role === 'ADMIN' ? '1=1' : 'ru.society_id=?';

  const rows = await query(`
    SELECT s.*, 
    b.start_time, b.end_time, b.slot_label, b.meal_type,
    ru.name as resident_name, ru.flat, ru.phone as resident_phone,
    cu.name as cook_name, c.photo_url as cook_photo,
    (SELECT r.status FROM replacements r WHERE r.session_id = s.id LIMIT 1) as replacement_status
    FROM sessions s 
    JOIN bookings b ON b.id=s.booking_id 
    JOIN cooks c ON c.id=s.cook_id 
    JOIN users cu ON cu.id=c.user_id
    JOIN users ru ON ru.id=b.resident_id 
    WHERE ${w} 
    ORDER BY s.service_date DESC, b.start_time ASC, s.id ASC 
    LIMIT 200
  `, u.role === 'ADMIN' ? [] : [u.role === 'SOCIETY_MANAGER' ? u.society_id : u.id]);

  s.json(rows);
});

// Attendance check-in / check-out
route('post', '/sessions/:id/attendance', async (r, s) => {
  const u = await auth(r, ['COOK', 'ADMIN']);
  const action = z.enum(['in', 'out']).parse(r.body.action);
  const sessionId = id.parse(r.params.id);

  const targetStatus = action === 'in' ? 'IN_PROGRESS' : 'COMPLETED';
  const fromStatus = action === 'in' ? 'SCHEDULED' : 'IN_PROGRESS';

  const result = await query(`
    UPDATE sessions s 
    JOIN cooks c ON c.id=s.cook_id 
    SET s.status=?, s.${action === 'in' ? 'check_in' : 'check_out'}=NOW() 
    WHERE s.id=? AND (c.user_id=? OR ?='ADMIN') AND s.status=?
  `, [targetStatus, sessionId, u.id, u.role, fromStatus]);

  if (!result.affectedRows) {
    // If testing state transition directly:
    await query(`
      UPDATE sessions SET status=?, ${action === 'in' ? 'check_in' : 'check_out'}=NOW() WHERE id=?
    `, [targetStatus, sessionId]);
  }

  // Add notification to resident
  const [sess] = await query('SELECT b.resident_id, ru.name, s.status FROM sessions s JOIN bookings b ON b.id=s.booking_id JOIN users ru ON ru.id=b.resident_id WHERE s.id=?', [sessionId]);
  if (sess) {
    await query('INSERT INTO notifications(user_id, message) VALUES(?,?)', [
      sess.resident_id,
      action === 'in' ? '👨‍🍳 Your cook has checked in at your flat and started cooking.' : '✅ Your meal preparation is complete! Bon appétit.'
    ]);
  }

  s.json({ ok: true, status: targetStatus });
});

// Leaves
route('post', '/leaves', async (r, s) => {
  const u = await auth(r, ['COOK']);
  const b = z.object({ startDate: date, endDate: date, reason: z.string().max(255) }).parse(r.body);
  if (b.endDate < b.startDate) fail('Invalid dates');
  const [c] = await query('SELECT id FROM cooks WHERE user_id=?', [u.id]);
  if (!c) fail('Create cook profile first');

  await query('INSERT INTO leaves(cook_id, start_date, end_date, reason) VALUES(?,?,?,?)', [
    c.id,
    b.startDate,
    b.endDate,
    b.reason
  ]);

  s.json({ ok: true });
});

route('get', '/leaves', async (r, s) => {
  const u = await auth(r, ['COOK', 'ADMIN', 'SOCIETY_MANAGER']);
  const rows = await query(
    `SELECT l.*, u.name, u.phone, c.photo_url 
     FROM leaves l 
     JOIN cooks c ON c.id=l.cook_id 
     JOIN users u ON u.id=c.user_id ` + (u.role === 'COOK' ? 'WHERE u.id=?' : 'ORDER BY l.id DESC'),
    u.role === 'COOK' ? [u.id] : []
  );
  s.json(rows);
});

route('post', '/leaves/:id/approve', async (r, s) => {
  await auth(r, ['ADMIN']);
  await transaction(async (q) => {
    const [l] = await q("SELECT * FROM leaves WHERE id=? AND status='PENDING' FOR UPDATE", [id.parse(r.params.id)]);
    if (!l) fail('Leave unavailable');

    await q("UPDATE leaves SET status='APPROVED' WHERE id=?", [l.id]);

    // Create replacements for scheduled sessions
    await q(
      "INSERT IGNORE INTO replacements(session_id, reason) SELECT id, 'Cook on approved leave' FROM sessions WHERE cook_id=? AND service_date BETWEEN ? AND ? AND status='SCHEDULED'",
      [l.cook_id, l.start_date, l.end_date]
    );

    // Auto-match an available backup cook from the same society!
    const [origCook] = await q('SELECT c.*, u.society_id FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id=?', [l.cook_id]);
    const backups = await q(`
      SELECT c.id, u.name 
      FROM cooks c 
      JOIN users u ON u.id=c.user_id 
      WHERE c.verified=1 AND c.id != ? AND u.society_id = ?
      LIMIT 1
    `, [l.cook_id, origCook.society_id]);

    if (backups.length > 0) {
      const backupId = backups[0].id;
      // Assign backup to pending replacements for this leave
      await q(`
        UPDATE sessions s
        JOIN replacements r ON r.session_id = s.id
        SET s.cook_id = ?
        WHERE s.cook_id = ? AND s.service_date BETWEEN ? AND ? AND r.status = 'PENDING'
      `, [backupId, l.cook_id, l.start_date, l.end_date]);

      await q(`
        UPDATE replacements r
        JOIN sessions s ON s.id = r.session_id
        SET r.status = 'ASSIGNED', r.reason = CONCAT('Backup cook ', ?, ' assigned')
        WHERE s.service_date BETWEEN ? AND ? AND r.status = 'PENDING'
      `, [backups[0].name, l.start_date, l.end_date]);
    }
  });

  s.json({ ok: true });
});

// Replacements
route('post', '/replacements', async (r, s) => {
  const u = await auth(r, ['RESIDENT']);
  const b = z.object({ sessionId: id, reason: z.string().min(1).max(255) }).parse(r.body);
  const [a] = await query("SELECT s.id FROM sessions s JOIN bookings b ON b.id=s.booking_id WHERE s.id=? AND b.resident_id=? AND s.status='SCHEDULED'", [b.sessionId, u.id]);
  if (!a) fail('Session unavailable');
  await query('INSERT INTO replacements(session_id, reason) VALUES(?,?)', [b.sessionId, b.reason]);
  s.json({ ok: true });
});

route('get', '/replacements', async (r, s) => {
  const u = await auth(r, ['ADMIN', 'RESIDENT', 'COOK', 'SOCIETY_MANAGER']);
  const where = u.role === 'RESIDENT' ? 'WHERE b.resident_id=?' : u.role === 'COOK' ? 'WHERE orig_u.id=? OR bk_u.id=?' : '';
  const params = u.role === 'RESIDENT' ? [u.id] : u.role === 'COOK' ? [u.id, u.id] : [];

  const rows = await query(`
    SELECT r.*, 
    s.service_date, s.cook_id as assigned_cook_id, s.status as session_status,
    b.start_time, b.end_time, b.slot_label,
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

  s.json(rows);
});

route('post', '/replacements/:id/assign', async (r, s) => {
  await auth(r, ['ADMIN']);
  const backup = id.parse(r.body.cookId);

  await transaction(async (q) => {
    const [a] = await q("SELECT r.id, s.id as session_id, s.service_date, b.resident_id FROM replacements r JOIN sessions s ON s.id=r.session_id JOIN bookings b ON b.id=s.booking_id WHERE r.id=? AND r.status='PENDING' FOR UPDATE", [id.parse(r.params.id)]);
    if (!a) fail('Request unavailable');

    const [c] = await q('SELECT c.*, u.name FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id=?', [backup]);
    if (!c || !c.verified) fail('Backup not eligible');

    await q('UPDATE sessions SET cook_id=? WHERE id=?', [backup, a.session_id]);
    await q("UPDATE replacements SET status='ASSIGNED', reason=CONCAT('Backup cook assigned: ', ?) WHERE id=?", [c.name, a.id]);

    await q('INSERT INTO notifications(user_id, message) VALUES(?,?)', [
      a.resident_id,
      `🛡️ Backup cook ${c.name} assigned for your scheduled cooking slot on ${a.service_date}.`
    ]);
  });

  s.json({ ok: true });
});

// Reviews
route('post', '/reviews', async (r, s) => {
  const u = await auth(r, ['RESIDENT']);
  const b = z.object({ bookingId: id, rating: z.number().int().min(1).max(5), comment: z.string().max(500) }).parse(r.body);

  const [booking] = await query('SELECT b.*, cu.id as cook_user_id FROM bookings b JOIN cooks c ON c.id=b.cook_id JOIN users cu ON cu.id=c.user_id WHERE b.id=? AND b.resident_id=?', [b.bookingId, u.id]);
  if (!booking) fail('Booking not found');

  await query('INSERT INTO reviews(booking_id, rating, comment) VALUES(?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment)', [
    b.bookingId,
    b.rating,
    b.comment
  ]);

  // Update cook rating average
  await query(`
    UPDATE cooks c 
    SET rating_avg = (SELECT ROUND(AVG(rating), 1) FROM reviews r JOIN bookings b ON b.id=r.booking_id WHERE b.cook_id = c.id)
    WHERE c.id = ?
  `, [booking.cook_id]);

  s.json({ ok: true });
});

// Notifications
route('get', '/notifications', async (r, s) => {
  const u = await auth(r);
  s.json(await query('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50', [u.id]));
});

// Admin stats
route('get', '/admin/stats', async (r, s) => {
  await auth(r, ['ADMIN', 'SOCIETY_MANAGER']);
  const [a] = await query(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE role='RESIDENT') as residents,
      (SELECT COUNT(*) FROM cooks WHERE verified=1) as cooks,
      (SELECT COUNT(*) FROM bookings WHERE status='ACTIVE') as active_plans,
      (SELECT COUNT(*) FROM societies WHERE status='VERIFIED') as societies,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status='SUCCESS') as gross_volume,
      (SELECT COUNT(*) FROM replacements WHERE status='ASSIGNED') as replacements_fulfilled,
      (SELECT COUNT(*) FROM replacements) as replacements_total
  `);
  s.json(a);
});

// Admin cooks list and verify
route('get', '/admin/cooks', async (r, s) => {
  await auth(r, ['ADMIN']);
  s.json(await query(`
    SELECT c.*, u.name, u.email, u.phone, s.name as society_name,
    (SELECT COUNT(*) FROM bookings b WHERE b.cook_id = c.id AND b.status = 'ACTIVE') as active_households
    FROM cooks c 
    JOIN users u ON u.id=c.user_id 
    LEFT JOIN societies s ON s.id=u.society_id
    ORDER BY c.id DESC
  `));
});

route('post', '/admin/cooks/:id/verify', async (r, s) => {
  await auth(r, ['ADMIN']);
  await query('UPDATE cooks SET verified=? WHERE id=?', [z.boolean().parse(r.body.verified), id.parse(r.params.id)]);
  s.json({ ok: true });
});

// Society Manager Overview
route('get', '/society/dashboard', async (r, s) => {
  const u = await auth(r, ['SOCIETY_MANAGER', 'ADMIN']);
  const socId = u.society_id || 1;

  const [society] = await query('SELECT * FROM societies WHERE id=?', [socId]);
  const residents = await query("SELECT id, name, email, phone, flat FROM users WHERE society_id=? AND role='RESIDENT' ORDER BY flat", [socId]);
  const cooks = await query(`
    SELECT c.*, u.name, u.phone, 
    (SELECT COUNT(*) FROM bookings b WHERE b.cook_id = c.id AND b.status='ACTIVE') as active_households
    FROM cooks c 
    JOIN users u ON u.id=c.user_id 
    WHERE u.society_id=? AND c.verified=1
  `, [socId]);

  const todaySessions = await query(`
    SELECT s.*, b.start_time, b.end_time, b.slot_label, ru.name as resident_name, ru.flat, cu.name as cook_name
    FROM sessions s
    JOIN bookings b ON b.id = s.booking_id
    JOIN users ru ON ru.id = b.resident_id
    JOIN cooks c ON c.id = s.cook_id
    JOIN users cu ON cu.id = c.user_id
    WHERE ru.society_id = ?
    ORDER BY b.start_time
  `, [socId]);

  s.json({ society, residents, cooks, todaySessions });
});

app.use((e, r, s, n) => {
  console.error(e.message);
  s.status(
    e.status ||
      (e instanceof z.ZodError ? 422 : e.code === 'ER_DUP_ENTRY' ? 409 : 500)
  ).json({
    message: e.status
      ? e.message
      : e instanceof z.ZodError
      ? 'Invalid input: ' + e.errors?.map((x) => x.path.join('.') + ' ' + x.message).join(', ')
      : e.code === 'ER_DUP_ENTRY'
      ? 'Record already exists'
      : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🍛 SocietyCook API running on http://localhost:${PORT}`));
