import 'dotenv/config';

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQLPUBLICURL ||
    'mysql://societycook:localpassword@localhost:3307/societycook',
  JWT_SECRET: process.env.JWT_SECRET || 'societycook-super-secure-production-jwt-secret-min-32-chars-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  REFRESH_TOKEN_EXPIRES_DAYS: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30),
  DEMO_PAYMENTS: process.env.DEMO_PAYMENTS !== 'false',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || ''
};
