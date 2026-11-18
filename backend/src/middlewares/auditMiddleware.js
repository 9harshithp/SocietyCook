import { query } from '../config/database.js';

export async function logAudit({
  userId = null,
  action,
  resourceType,
  resourceId = null,
  req = null,
  diff = null
}) {
  try {
    const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || null;
    const ua = req?.headers['user-agent'] || null;
    const diffStr = diff ? JSON.stringify(diff) : null;

    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, payload_diff)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, action, resourceType, resourceId, ip, ua, diffStr]
    );
  } catch (err) {
    console.error('Audit log write error:', err.message);
  }
}
