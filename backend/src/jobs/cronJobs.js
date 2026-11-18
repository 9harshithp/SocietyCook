import cron from 'node-cron';
import { query } from '../config/database.js';

export function startCronJobs() {
  // 1. Daily morning task at 05:00 AM: generate daily sessions for active subscriptions
  cron.schedule('0 5 * * *', async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await query(`
        INSERT IGNORE INTO sessions (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, flat_number, otp_code)
        SELECT b.id, b.cook_id, ?, 'SCHEDULED', b.start_time, b.end_time, ru.flat, LPAD(FLOOR(RAND() * 9000 + 1000), 4, '0')
        FROM bookings b
        JOIN users ru ON ru.id = b.resident_id
        WHERE b.status = 'ACTIVE' AND b.start_date <= ? AND b.end_date >= ?
      `, [today, today, today]);
    } catch (e) {
      console.error('Cron error (session generator):', e.message);
    }
  });

  // 2. Hourly check: mark expired unpaid reservations and group invitations
  cron.schedule('0 * * * *', async () => {
    try {
      await query("UPDATE bookings SET status = 'EXPIRED' WHERE status = 'PENDING' AND expires_at < NOW()");
      await query("UPDATE group_invitations SET status = 'EXPIRED' WHERE status = 'PENDING' AND expires_at < NOW()");
      await query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
    } catch (e) {
      console.error('Cron error (expiration cleanup):', e.message);
    }
  });

  console.log('⏰ SocietyCook background cron jobs registered.');
}
