import 'dotenv/config';

const isProduction = process.env.NODE_ENV === 'production';

// Strict validation of JWT Secret in production
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'societycook-dev-jwt-secret-min-32-chars-2026');
if (isProduction && (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('dev-jwt-secret'))) {
  throw new Error('SECURITY FATAL: JWT_SECRET environment variable must be set to a secure secret of at least 32 characters in production.');
}

const defaultAllowedOrigins = [
  'https://societycook.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://societycook.vercel.app',
  ALLOWED_ORIGINS: Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins])),
  DATABASE_URL:
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQLPUBLICURL ||
    'mysql://societycook:localpassword@localhost:3307/societycook',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  REFRESH_TOKEN_EXPIRES_DAYS: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30),
  // Demo payments are strictly prohibited in production mode
  DEMO_PAYMENTS: isProduction ? false : process.env.DEMO_PAYMENTS === 'true',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || ''
};
