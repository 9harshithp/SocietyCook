import { ZodError } from 'zod';
import { ENV } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  const isDev = ENV.NODE_ENV !== 'production';

  if (isDev) {
    console.error('❌ Error caught by central middleware:', err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation error: ' + err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      errors: err.errors
    });
  }

  // Handle MySQL Duplicate Entry (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Record with matching unique information already exists.'
    });
  }

  // Custom HTTP status or default 500
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && err.stack ? { stack: err.stack } : {})
  });
};
