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

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: ENV.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});
initSocket(io);

// Security & Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: ENV.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true, limit: '500kb' }));

// Rate limiter for API
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    message: { success: false, message: 'Too many requests. Please slow down.' }
  })
);

// Swagger / OpenAPI documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/v1/docs.json', (req, res) => res.json(swaggerSpec));

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
    console.log(`🍛 SocietyCook v2 API running on http://localhost:${ENV.PORT}/api/v1`);
    console.log(`📖 Swagger API Docs available at http://localhost:${ENV.PORT}/api/v1/docs`);
  });
}

export default app;
