import { query, transaction } from '../config/database.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

export class AttendanceService {
  /**
   * Get sessions filtered by role and date
   */
  static async getSessions({ user, societyId, date, status }) {
    let sql = `
      SELECT s.*, 
             b.slot_label, b.meal_type, b.amount, b.group_id,
             ru.name as resident_name, ru.flat as resident_flat, ru.phone as resident_phone,
             cu.name as cook_name, c.photo_url as cook_photo, cu.phone as cook_phone,
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
    const params = [];

    if (user.role === 'COOK') {
      sql += ' AND c.user_id = ?';
      params.push(user.id);
    } else if (user.role === 'RESIDENT') {
      sql += ' AND b.resident_id = ?';
      params.push(user.id);
    } else if (user.role === 'SOCIETY_MANAGER') {
      sql += ' AND ru.society_id = ?';
      params.push(user.society_id);
    } else if (societyId) {
      sql += ' AND ru.society_id = ?';
      params.push(societyId);
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
   * Check in cook with optional OTP verification
   */
  static async checkIn({ sessionId, cookUserId, otp = null, bypassOtp = false }) {
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

      if (!sess) throw new Error('Session not found.');
      if (sess.cook_user_id !== cookUserId && bypassOtp === false) {
        throw new Error('Unauthorized: only the assigned cook can check into this session.');
      }

      if (sess.status === 'COMPLETED') {
        throw new Error('This session has already been completed.');
      }

      let otpVerified = false;
      if (otp && sess.otp_code) {
        if (sess.otp_code.trim() === otp.trim()) {
          otpVerified = true;
        } else {
          throw new Error('Invalid OTP code provided. Please ask the resident for their 4-digit service PIN.');
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

      await q(
        `UPDATE sessions 
         SET status = 'IN_PROGRESS', check_in = NOW(), otp_verified = ?, late_minutes = ?
         WHERE id = ?`,
        [otpVerified ? 1 : 0, lateMinutes, sessionId]
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
        otpVerified,
        lateMinutes
      };
    });
  }

  /**
   * Check out cook and complete service
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

      if (!sess) throw new Error('Session not found.');

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
}
