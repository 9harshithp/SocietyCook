import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { ENV } from './src/config/env.js';
import { db } from './src/config/database.js';
import { apiRouter } from './src/routes/api.js';
import { notFoundHandler, errorHandler } from './src/middlewares/errorMiddleware.js';
import { initSocket } from './src/sockets/socketHandler.js';
import { startCronJobs } from './src/jobs/cronJobs.js';
import { swaggerSpec } from './src/docs/swagger.js';

const app = express();
const server = http.createServer(app);

// Strict CORS Allowlist Validation (No Wildcard Reflection)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, tests) with no origin header
    if (!origin) return callback(null, true);

    const isAllowed = ENV.ALLOWED_ORIGINS.some((allowed) => {
      if (allowed === origin) return true;
      // Support Vercel preview branch deployments
      if (allowed.includes('vercel.app') && origin.endsWith('.vercel.app')) return true;
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: Origin '${origin}' is not authorized by platform security policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Razorpay-Signature']
};

const io = new Server(server, {
  cors: {
    origin: ENV.ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST']
  }
});
initSocket(io);

// Security Headers via Helmet (OWASP ASVS V14 Compliance)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com', 'https://www.googletagmanager.com'],
        connectSrc: [
          "'self'",
          'https://api.razorpay.com',
          'wss:',
          'ws:',
          'https://*.google-analytics.com',
          'https://*.analytics.google.com',
          'https://*.googletagmanager.com'
        ],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'https://*.google-analytics.com', 'https://*.googletagmanager.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        frameSrc: ["'self'", 'https://api.razorpay.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true
  })
);

app.use(cors(corsOptions));

// Body Parser with Raw Body preservation for Webhook Signature Verification
app.use(
  express.json({
    limit: '500kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// Global API Rate Limiter
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' }
  })
);

// Strict Rate Limiting on Sensitive Authentication Endpoints (Brute-Force & Credential Stuffing Prevention)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // Max 15 attempts per IP per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes before trying again.' }
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Swagger / OpenAPI documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/v1/docs.json', (req, res) => res.json(swaggerSpec));

// Health check (at root and /api/v1/health)
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime())
  });
});

// Mount Versioned API Routes
app.use('/api/v1', apiRouter);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Background cron scheduler
startCronJobs();

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down SocietyCook API...`);
  try {
    server.close(() => {
      console.log('  + HTTP server closed.');
    });
    await db.end();
    console.log('  + Database connection pool closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Only listen if executed directly, not when imported during tests
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  server.listen(ENV.PORT, () => {
    console.log(`\n========================================================`);
    console.log(`🍲 SocietyCook v4 Enterprise API Server`);
    console.log(`🚀 Mode:       ${ENV.NODE_ENV}`);
    console.log(`🔗 Port:       ${ENV.PORT}`);
    console.log(`🔒 Security:   Strict CORS, Helmet HSTS, CSP Enabled`);
    console.log(`🌐 Base URL:   http://localhost:${ENV.PORT}/api/v1`);
    console.log(`📖 Swagger:    http://localhost:${ENV.PORT}/api/v1/docs`);
    console.log(`========================================================\n`);
  });
}

export default app;
export { app, server };
