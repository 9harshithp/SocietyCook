import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { query } from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }

    const [user] = await query(
      `SELECT u.id, u.name, u.email, u.role, u.society_id, u.flat, u.phone, u.avatar_url, s.name as society_name 
       FROM users u 
       LEFT JOIN societies s ON s.id = u.society_id 
       WHERE u.id = ?`,
      [decoded.sub]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

export const requireSameSocietyOrAdmin = (req, res, next) => {
  const targetSocietyId = Number(req.params.societyId || req.body.societyId || req.query.societyId);
  if (!targetSocietyId) return next();

  if (req.user.role === 'ADMIN') return next();

  if (req.user.society_id !== targetSocietyId) {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to your registered society.'
    });
  }
  next();
};
