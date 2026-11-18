import { query, transaction } from '../config/database.js';
import { findEligibleBackupCooks } from '../algorithms/backupAllocator.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

export class LeaveService {
  /**
   * Cook submits a leave request
   */
  static async applyLeave({ cookUserId, startDate, endDate, reason, leaveType = 'PLANNED' }) {
    if (endDate < startDate) {
      throw new Error('End date cannot precede start date.');
    }

    const [cook] = await query('SELECT id, user_id FROM cooks WHERE user_id = ?', [cookUserId]);
    if (!cook) throw new Error('Cook profile not found');

    const res = await query(
      `INSERT INTO leaves (cook_id, start_date, end_date, reason, leave_type, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [cook.id, startDate, endDate, reason, leaveType]
    );

    await logAudit({
      userId: cookUserId,
      action: 'LEAVE_REQUESTED',
      resourceType: 'LEAVE',
      resourceId: res.insertId,
      diff: { startDate, endDate, reason, leaveType }
    });

    return { id: res.insertId, status: 'PENDING', startDate, endDate };
  }

  /**
   * Admin approves leave and triggers automatic backup cook allocation
   */
  static async approveLeave({ leaveId, adminUserId }) {
    return await transaction(async (q) => {
      const [leave] = await q(
        "SELECT l.*, c.user_id as cook_user_id, cu.name as cook_name, u.society_id FROM leaves l JOIN cooks c ON c.id=l.cook_id JOIN users cu ON cu.id=c.user_id JOIN users u ON u.id=c.user_id WHERE l.id = ? AND l.status = 'PENDING' FOR UPDATE",
        [leaveId]
      );
      if (!leave) throw new Error('Leave request not found or already processed.');

      // 1. Mark leave APPROVED
      await q(
        "UPDATE leaves SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
        [adminUserId, leaveId]
      );

      // 2. Identify affected sessions
      const affectedSessions = await q(
        `SELECT s.id, s.service_date, b.start_time, b.end_time, b.resident_id, ru.name as resident_name, ru.flat
         FROM sessions s
         JOIN bookings b ON b.id = s.booking_id
         JOIN users ru ON ru.id = b.resident_id
         WHERE s.cook_id = ? AND s.service_date BETWEEN ? AND ? AND s.status = 'SCHEDULED'`,
        [leave.cook_id, leave.start_date, leave.end_date]
      );

      if (affectedSessions.length === 0) {
        return { success: true, leaveId, backupAllocated: false, affectedCount: 0 };
      }

      // 3. Search and rank backup cooks in the same society
      const candidateCooks = await q(
        `SELECT c.*, u.name, u.phone 
         FROM cooks c 
         JOIN users u ON u.id = c.user_id 
         WHERE c.verified = 1 AND c.id != ? AND u.society_id = ?`,
        [leave.cook_id, leave.society_id]
      );

      // Existing sessions of candidate cooks to check collisions
      const candidateIds = candidateCooks.map((c) => c.id);
      const existingSessionsByCook = {};
      if (candidateIds.length > 0) {
        const busySessions = await q(
          `SELECT s.cook_id, s.service_date, b.start_time, b.end_time 
           FROM sessions s
           JOIN bookings b ON b.id = s.booking_id
           WHERE s.cook_id IN (${candidateIds.join(',')}) AND s.service_date BETWEEN ? AND ?`,
          [leave.start_date, leave.end_date]
        );
        for (const bs of busySessions) {
          if (!existingSessionsByCook[bs.cook_id]) existingSessionsByCook[bs.cook_id] = [];
          existingSessionsByCook[bs.cook_id].push(bs);
        }
      }

      const allocation = findEligibleBackupCooks({
        leave,
        affectedSessions,
        candidateCooks,
        existingSessionsByCook
      });

      if (allocation.recommendedBackup) {
        const backup = allocation.recommendedBackup;

        for (const sess of affectedSessions) {
          // Reassign session to backup cook
          await q('UPDATE sessions SET cook_id = ? WHERE id = ?', [backup.cookId, sess.id]);

          // Record replacement record
          await q(
            `INSERT INTO replacements (session_id, orig_cook_id, backup_cook_id, assigned_by_type, reason, status)
             VALUES (?, ?, ?, 'ALGORITHM_AUTO', ?, 'ASSIGNED')
             ON DUPLICATE KEY UPDATE backup_cook_id = VALUES(backup_cook_id), status = 'ASSIGNED'`,
            [
              sess.id,
              leave.cook_id,
              backup.cookId,
              `Cook ${leave.cook_name} on approved leave. Auto-assigned backup ${backup.name}.`
            ]
          );

          // Notify resident
          await q(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES (?, '🛡️ Verified Backup Cook Assigned', ?, 'LEAVE')`,
            [
              sess.resident_id,
              `Your regular cook ${leave.cook_name} is on approved leave on ${sess.service_date}. Verified backup cook ${backup.name} has been assigned to prepare your meal.`
            ]
          );
        }

        await logAudit({
          userId: adminUserId,
          action: 'LEAVE_APPROVED_BACKUP_ASSIGNED',
          resourceType: 'LEAVE',
          resourceId: leaveId,
          diff: { backupCookId: backup.cookId, affectedSessions: affectedSessions.length }
        });

        return {
          success: true,
          leaveId,
          backupAllocated: true,
          backupCookName: backup.name,
          affectedCount: affectedSessions.length
        };
      } else {
        // Escalate: mark replacements as UNFULFILLED
        for (const sess of affectedSessions) {
          await q(
            `INSERT INTO replacements (session_id, orig_cook_id, assigned_by_type, reason, status)
             VALUES (?, ?, 'ALGORITHM_AUTO', 'No automatic backup available within schedule constraints', 'UNFULFILLED')
             ON DUPLICATE KEY UPDATE status = 'UNFULFILLED'`,
            [sess.id, leave.cook_id]
          );
        }

        return {
          success: true,
          leaveId,
          backupAllocated: false,
          escalated: true,
          message: 'Leave approved, but no collision-free backup cook found. Flagged for Admin manual dispatch.'
        };
      }
    });
  }
}
