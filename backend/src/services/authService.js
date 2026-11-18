import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, transaction } from '../config/database.js';
import { ENV } from '../config/env.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

export class AuthService {
  static generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        societyId: user.society_id
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );
  }

  static async generateRefreshToken(userId) {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + ENV.REFRESH_TOKEN_EXPIRES_DAYS * 86400000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt]
    );

    return rawToken;
  }

  static async register({ name, email, password, role, societyId, flat, phone, referralCode }) {
    // Prevent self-registration as ADMIN or direct SOCIETY_MANAGER without admin approval
    if (role === 'ADMIN') {
      const err = new Error('Admin registration requires platform administrator authorization.');
      err.status = 403;
      throw err;
    }

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      const err = new Error('An account with this email address already exists.');
      err.status = 409;
      throw err;
    }

    // Verify society exists
    const [society] = await query("SELECT id, name FROM societies WHERE id = ? AND status = 'VERIFIED'", [societyId]);
    if (!society) {
      const err = new Error('Selected society is not verified or does not exist.');
      err.status = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const selfReferralCode = 'SC-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Check if referred by someone
    let referredById = null;
    if (referralCode) {
      const [referrer] = await query('SELECT id FROM users WHERE referral_code = ?', [referralCode.trim().toUpperCase()]);
      if (referrer) referredById = referrer.id;
    }

    return await transaction(async (q) => {
      const userRes = await q(
        `INSERT INTO users (name, email, password_hash, role, society_id, flat, phone, referral_code, referred_by_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name.trim(), email.toLowerCase().trim(), passwordHash, role, societyId, flat || null, phone || null, selfReferralCode, referredById]
      );
      const userId = userRes.insertId;

      // Add society membership record
      if (flat) {
        await q(
          `INSERT INTO society_memberships (society_id, user_id, flat_number, status)
           VALUES (?, ?, ?, 'VERIFIED')`,
          [societyId, userId, flat]
        );
      }

      // If cook, create initial cook profile
      if (role === 'COOK') {
        await q(
          `INSERT INTO cooks (user_id, cuisine, bio, price, experience, verified, available_from, available_to, dietary_tags)
           VALUES (?, 'Homestyle Indian Cooking', 'Dedicated residential cook committed to hygiene and punctuality.', 4000, 2, 1, '06:30:00', '21:30:00', 'Pure Veg, Custom Spice')`,
          [userId]
        );

        const [cook] = await q('SELECT id FROM cooks WHERE user_id = ?', [userId]);
        await q(
          `INSERT INTO cook_society_assignments (cook_id, society_id, status) VALUES (?, ?, 'APPROVED')`,
          [cook.id, societyId]
        );
      }

      // Record referral if valid
      if (referredById && referredById !== userId) {
        await q(
          `INSERT IGNORE INTO referrals (referrer_id, referee_id, referral_code, reward_amount, status)
           VALUES (?, ?, ?, 500, 'QUALIFIED')`,
          [referredById, userId, referralCode.trim().toUpperCase()]
        );
      }

      const user = { id: userId, name, email, role, society_id: societyId };
      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = await AuthService.generateRefreshToken(userId);

      await logAudit({
        userId,
        action: 'USER_REGISTERED',
        resourceType: 'USER',
        resourceId: userId
      });

      return { user, accessToken, refreshToken };
    });
  }

  static async login({ email, password, req = null }) {
    const [user] = await query(
      `SELECT u.*, s.name as society_name 
       FROM users u 
       LEFT JOIN societies s ON s.id = u.society_id 
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = await AuthService.generateRefreshToken(user.id);

    // Clean up sensitive field
    delete user.password_hash;

    await logAudit({
      userId: user.id,
      action: 'USER_LOGGED_IN',
      resourceType: 'USER',
      resourceId: user.id,
      req
    });

    return { user, accessToken, refreshToken };
  }

  static async refreshAccessToken(rawRefreshToken) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const [storedToken] = await query(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0 AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!storedToken) {
      const err = new Error('Refresh token is invalid or has expired.');
      err.status = 401;
      throw err;
    }

    // Revoke old token (rotation)
    await query('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [storedToken.id]);

    const [user] = await query('SELECT * FROM users WHERE id = ?', [storedToken.user_id]);
    if (!user) {
      const err = new Error('User not found.');
      err.status = 401;
      throw err;
    }

    const newAccessToken = AuthService.generateAccessToken(user);
    const newRefreshToken = await AuthService.generateRefreshToken(user.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await query('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
  }
}
