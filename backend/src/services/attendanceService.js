import { query, transaction } from '../config/database.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

export class AttendanceService {
  /**
   * Get sessions filtered by role and date
   */
  static async getSessions({ user, societyId, date, status }) {
    let sql = `
      SELECT s.id, s.booking_id, s.cook_id, s.service_date, s.status, s.check_in, s.check_out,
             s.scheduled_start_time, s.scheduled_end_time, s.flat_number, s.otp_verified,
             s.late_minutes, s.resident_confirmed, s.dispute_reason, s.created_at,
             IF(b.resident_id = ?, s.otp_code, NULL) as otp_code,
             b.slot_label, b.meal_type, b.amount, b.group_id,
             ru.name as resident_name, ru.flat as resident_flat,
             IF(c.user_id = ? OR ? = 'ADMIN', ru.phone, NULL) as resident_phone,
             cu.name as cook_name, c.photo_url as cook_photo,
             IF(b.resident_id = ? OR ? = 'ADMIN', cu.phone, NULL) as cook_phone,
             soc.name as society_name,
             (SELECT r.status FROM replacements r WHERE r.session_id = s.id LIMIT 1) as replacement_status
      FROM sessions s
      JOIN bookings b ON b.id = s.booking_id
      JOIN cooks c ON c.id = s.cook_id
      JOIN users cu ON cu.id = c.user_id
      JOIN users ru ON ru.id = b.resident_id
      LEFT JOIN societies soc ON soc.id = ru.society_id
      WHERE 1=1
    `;
    const params = [user.id, user.id, user.role, user.id, user.role];

    if (user.role === 'COOK') {
      sql += ' AND c.user_id = ?';
      params.push(user.id);
    } else if (user.role === 'RESIDENT') {
      sql += ' AND b.resident_id = ?';
      params.push(user.id);
    } else if (user.role === 'SOCIETY_MANAGER') {
      sql += ' AND ru.society_id = ?';
      params.push(user.society_id);
    } else if (user.role === 'ADMIN') {
      if (societyId) {
        sql += ' AND ru.society_id = ?';
        params.push(societyId);
      }
    } else {
      sql += ' AND 1=0';
    }

    if (date) {
      sql += ' AND s.service_date = ?';
      params.push(date);
    }

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.service_date DESC, s.scheduled_start_time ASC, s.id ASC LIMIT 100';

    return await query(sql, params);
  }

  /**
   * Check in cook with mandatory resident PIN verification & attempt lockout
   */
  static async checkIn({ sessionId, cookUserId, otp = null, bypassOtp = false }) {
    const [sess] = await query(
      `SELECT s.*, b.resident_id, ru.name as resident_name, c.user_id as cook_user_id, cu.name as cook_name
       FROM sessions s
       JOIN bookings b ON b.id = s.booking_id
       JOIN cooks c ON c.id = s.cook_id
       JOIN users cu ON cu.id = c.user_id
       JOIN users ru ON ru.id = b.resident_id
       WHERE s.id = ?`,
      [sessionId]
    );

    if (!sess) {
      const err = new Error('Session not found.');
      err.status = 404;
      throw err;
    }

    if (sess.cook_user_id !== cookUserId && bypassOtp === false) {
      const err = new Error('Unauthorized: only the assigned professional can check into this session.');
      err.status = 403;
      throw err;
    }

    // 1. Session State Transition Check
    if (sess.status === 'IN_PROGRESS') {
      const err = new Error('Session is already checked in and in progress.');
      err.status = 400;
      throw err;
    }
    if (sess.status === 'COMPLETED') {
      const err = new Error('This session has already been completed.');
      err.status = 400;
      throw err;
    }
    if (sess.status === 'CANCELLED' || sess.status === 'MISSED' || sess.status === 'DISPUTED') {
      const err = new Error(`Cannot check in: session is in ${sess.status} state.`);
      err.status = 400;
      throw err;
    }
    if (sess.status !== 'SCHEDULED') {
      const err = new Error(`Invalid session state for check-in: ${sess.status}.`);
      err.status = 400;
      throw err;
    }

    // 2. Mandatory Valid Resident Service PIN Syntax Validation
    let cleanOtp = null;
    if (bypassOtp === false) {
      if (!otp || typeof otp !== 'string' || !otp.trim()) {
        const err = new Error('Valid 4-digit resident attendance PIN is required for check-in.');
        err.status = 400;
        throw err;
      }
      cleanOtp = otp.trim();
      if (!/^\d{4}$/.test(cleanOtp)) {
        const err = new Error('Invalid PIN format. Resident service PIN must be exactly 4 digits.');
        err.status = 400;
        throw err;
      }
    }

    // 3. Operational Date Window Verification
    const toDateStr = (d) => {
      if (!d) return '';
      if (d instanceof Date) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
      return String(d).slice(0, 10);
    };

    const today = toDateStr(new Date());
    const sessDate = toDateStr(sess.service_date);
    if (sessDate !== today && bypassOtp === false) {
      const err = new Error(`Check-in is only permitted on the scheduled service date (${sessDate}). Today is ${today}.`);
      err.status = 400;
      throw err;
    }

    // 4. Attempt Limit / Lockout Protection (Max 5 attempts)
    const maxAttempts = 5;
    const currentAttempts = Number(sess.otp_attempts || 0);
    if (currentAttempts >= maxAttempts && bypassOtp === false) {
      const err = new Error('Too many invalid PIN attempts. Session attendance locked for security. Please contact administrator.');
      err.status = 429;
      throw err;
    }

    // 5. Validate Resident Service PIN Match (Atomic increment & serialization)
    if (bypassOtp === false) {
      if (!sess.otp_code || sess.otp_code.trim() !== cleanOtp) {
        // Atomic increment in storage engine to prevent race condition under high concurrency
        await query(
          'UPDATE sessions SET otp_attempts = LEAST(otp_attempts + 1, 5) WHERE id = ?',
          [sessionId]
        );
        const [updatedSess] = await query('SELECT otp_attempts FROM sessions WHERE id = ?', [sessionId]);
        const currentCount = updatedSess ? Number(updatedSess.otp_attempts) : maxAttempts;
        const remaining = Math.max(0, maxAttempts - currentCount);
        const msg = remaining > 0
          ? `Invalid service PIN provided. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many invalid PIN attempts. Session attendance locked for security. Please contact administrator.';
        const err = new Error(msg);
        err.status = remaining > 0 ? 401 : 429;
        throw err;
      }
    }

    // Calculate if arrival is late against scheduled_start_time
    let lateMinutes = 0;
    if (sess.scheduled_start_time) {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = sess.scheduled_start_time.slice(0, 5).split(':').map(Number);
      const schedMin = sh * 60 + sm;
      if (nowMin > schedMin + 15) {
        lateMinutes = nowMin - schedMin;
      }
    }

    // 6. Valid PIN Verified: Execute transactional state transition
    return await transaction(async (q) => {
      const [lockedSess] = await q('SELECT status, otp_attempts FROM sessions WHERE id = ? FOR UPDATE', [sessionId]);
      if (lockedSess.status !== 'SCHEDULED') {
        const err = new Error(`Session has already transitioned to ${lockedSess.status}`);
        err.status = 400;
        throw err;
      }
      if (lockedSess.otp_attempts >= maxAttempts && bypassOtp === false) {
        const err = new Error('Too many invalid PIN attempts. Session attendance locked for security. Please contact administrator.');
        err.status = 429;
        throw err;
      }

      await q(
        `UPDATE sessions 
         SET status = 'IN_PROGRESS', check_in = NOW(), otp_verified = 1, otp_attempts = 0, late_minutes = ?
         WHERE id = ?`,
        [lateMinutes, sessionId]
      );

      // Notify resident
      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Cook Arrived & Checked In', ?, 'ATTENDANCE')`,
        [
          sess.resident_id,
          `👨‍🍳 ${sess.cook_name} has checked into your kitchen. Meal preparation is now in progress.`
        ]
      );

      return {
        sessionId,
        status: 'IN_PROGRESS',
        otpVerified: true,
        lateMinutes
      };
    });
  }

  /**
   * Check out cook and complete service (strictly requires in-progress state)
   */
  static async checkOut({ sessionId, cookUserId }) {
    return await transaction(async (q) => {
      const [sess] = await q(
        `SELECT s.*, b.resident_id, ru.name as resident_name, c.user_id as cook_user_id, cu.name as cook_name
         FROM sessions s
         JOIN bookings b ON b.id = s.booking_id
         JOIN cooks c ON c.id = s.cook_id
         JOIN users cu ON cu.id = c.user_id
         JOIN users ru ON ru.id = b.resident_id
         WHERE s.id = ? FOR UPDATE`,
        [sessionId]
      );

      if (!sess) {
        const err = new Error('Session not found.');
        err.status = 404;
        throw err;
      }

      if (sess.cook_user_id !== cookUserId) {
        const err = new Error('Unauthorized: only the assigned professional can complete this session.');
        err.status = 403;
        throw err;
      }

      if (sess.status !== 'IN_PROGRESS') {
        const err = new Error(`Cannot complete session in '${sess.status}' state. Professional must check in first.`);
        err.status = 400;
        throw err;
      }

      await q(
        "UPDATE sessions SET status = 'COMPLETED', check_out = NOW() WHERE id = ?",
        [sessionId]
      );

      // Notify resident with review prompt
      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Meal Preparation Complete', ?, 'ATTENDANCE')`,
        [
          sess.resident_id,
          `✅ ${sess.cook_name} has completed preparing your meal and sanitized the counter. Please rate the service!`
        ]
      );

      return {
        sessionId,
        status: 'COMPLETED'
      };
    });
  }

  /**
   * File an attendance dispute
   */
  static async disputeSession({ sessionId, residentId, reason }) {
    return await transaction(async (q) => {
      const [sess] = await q(
        `SELECT s.*, b.resident_id FROM sessions s JOIN bookings b ON b.id=s.booking_id WHERE s.id=?`,
        [sessionId]
      );
      if (!sess || sess.resident_id !== residentId) {
        throw new Error('Session not found or unauthorized.');
      }

      await q(
        "UPDATE sessions SET status = 'DISPUTED', dispute_reason = ? WHERE id = ?",
        [reason, sessionId]
      );

      await logAudit({
        userId: residentId,
        action: 'ATTENDANCE_DISPUTED',
        resourceType: 'SESSION',
        resourceId: sessionId,
        diff: { reason }
      });

      return { success: true, sessionId, status: 'DISPUTED' };
    });
  }

  /**
   * Securely unlock a locked attendance session and regenerate resident service PIN
   */
  static async unlockSession({ sessionId, authorizedUserId, userRole, userSocietyId }) {
    const [sess] = await query(
      `SELECT s.*, b.resident_id, ru.society_id as resident_society_id, ru.name as resident_name, cu.name as cook_name
       FROM sessions s
       JOIN bookings b ON b.id = s.booking_id
       JOIN cooks c ON c.id = s.cook_id
       JOIN users cu ON cu.id = c.user_id
       JOIN users ru ON ru.id = b.resident_id
       WHERE s.id = ?`,
      [sessionId]
    );

    if (!sess) {
      const err = new Error('Session not found.');
      err.status = 404;
      throw err;
    }

    if (userRole === 'SOCIETY_MANAGER' && sess.resident_society_id !== userSocietyId) {
      const err = new Error('Access denied: You can only unlock attendance sessions within your registered society.');
      err.status = 403;
      throw err;
    }

    if (sess.status === 'COMPLETED' || sess.status === 'CANCELLED') {
      const err = new Error(`Cannot unlock session in ${sess.status} state.`);
      err.status = 400;
      throw err;
    }

    // Generate secure fresh 4-digit PIN
    const newOtp = String(Math.floor(1000 + Math.random() * 9000));

    await transaction(async (q) => {
      await q(
        'UPDATE sessions SET otp_attempts = 0, otp_code = ? WHERE id = ?',
        [newOtp, sessionId]
      );

      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Attendance Session Unlocked', ?, 'ATTENDANCE')`,
        [
          sess.resident_id,
          `Your scheduled session with ${sess.cook_name} has been unlocked by administrator. Your new attendance PIN is ${newOtp}.`
        ]
      );

      await logAudit({
        userId: authorizedUserId,
        action: 'SESSION_ATTENDANCE_UNLOCKED',
        resourceType: 'SESSION',
        resourceId: sessionId,
        diff: { previousAttempts: sess.otp_attempts, unlocked: true }
      });
    });

    return {
      success: true,
      sessionId,
      message: 'Session attendance unlocked successfully. New resident PIN has been generated and dispatched.',
      unlocked: true,
      newOtp
    };
  }
}
