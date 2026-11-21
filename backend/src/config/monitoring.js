import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;
const APP_COMMIT = process.env.APP_COMMIT || process.env.RENDER_GIT_COMMIT || '53c4d09';
const APP_ENV = process.env.NODE_ENV || 'production';

// Sensitive keys to scrub from backend error logs and telemetry
const SENSITIVE_KEYS = [
  'password',
  'token',
  'jwt',
  'authorization',
  'cookie',
  'secret',
  'hash',
  'phone',
  'flat',
  'address',
  'cvv',
  'card',
  'upi',
  'pin',
  'otp',
  'razorpay_key_secret',
  'razorpay_signature'
];

/**
 * Deep redaction of sensitive PII, passwords, tokens and financial data
 */
export function redactSensitiveBackendData(obj, depth = 0) {
  if (!obj || depth > 6) return obj;

  if (typeof obj === 'string') {
    // Redact JWT tokens
    let cleaned = obj.replace(/ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]');
    // Redact 10-digit Indian mobile numbers
    cleaned = cleaned.replace(/\b(?:\+91|0)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]');
    // Redact Bearer headers
    cleaned = cleaned.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]');
    return cleaned;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveBackendData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
        key.toLowerCase().includes(sensitive)
      );

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveBackendData(value, depth + 1);
      }
    }
    return redacted;
  }

  return obj;
}

/**
 * Sanitize SQL statements to remove literals while preserving query structure
 */
export function sanitizeSql(sql) {
  if (!sql || typeof sql !== 'string') return '';
  return sql
    .replace(/'[^']*'/g, "'?'")
    .replace(/\b\d+\b/g, '?')
    .slice(0, 300);
}

/**
 * In-memory sliding window tracker for consecutive failed login attempts (Security Alerting)
 */
const failedLoginMap = new Map(); // ip/identity -> [timestamps]

export function recordLoginFailure(identifier) {
  if (!identifier) return;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes

  const attempts = (failedLoginMap.get(identifier) || []).filter((t) => now - t < windowMs);
  attempts.push(now);
  failedLoginMap.set(identifier, attempts);

  // If threshold exceeded (5 failed logins in 5 mins), emit Sentry security alert
  if (attempts.length >= 5) {
    if (SENTRY_DSN) {
      Sentry.captureMessage(
        `Security Alert: Repeated authentication failures detected (${attempts.length} attempts in 5m)`,
        {
          level: 'warning',
          tags: {
            alert_type: 'repeated_login_failures',
            service: 'societycook-backend'
          },
          extra: {
            attemptsCount: attempts.length,
            timeWindow: '5m'
          }
        }
      );
    } else {
      console.warn(`[Security Alert] Repeated login failures: ${attempts.length} attempts in 5m`);
    }
  }
}

export function resetLoginFailure(identifier) {
  if (identifier) failedLoginMap.delete(identifier);
}

/**
 * Initialize Backend Sentry Monitoring
 */
export function initBackendMonitoring() {
  if (!SENTRY_DSN) {
    console.info('📡 [Monitoring] Sentry DSN not set. Backend error monitoring active in passive local mode.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    release: `societycook-api@${APP_COMMIT}`,
    environment: APP_ENV,
    tracesSampleRate: APP_ENV === 'production' ? 0.2 : 1.0,

    initialScope: {
      tags: {
        service: 'societycook-backend',
        commit: APP_COMMIT,
        node_version: process.version
      }
    },

    beforeSend(event) {
      // Redact request data
      if (event.request) {
        if (event.request.headers) {
          event.request.headers = redactSensitiveBackendData(event.request.headers);
        }
        if (event.request.data) {
          event.request.data = redactSensitiveBackendData(event.request.data);
        }
        if (event.request.cookies) {
          event.request.cookies = '[REDACTED]';
        }
      }

      // Redact exception messages and values
      if (event.exception?.values) {
        event.exception.values.forEach((v) => {
          if (v.value) v.value = redactSensitiveBackendData(v.value);
        });
      }

      // Redact extra context
      if (event.extra) {
        event.extra = redactSensitiveBackendData(event.extra);
      }

      return event;
    }
  });

  console.info(`📡 [Monitoring] Sentry initialized on backend (Commit: ${APP_COMMIT}, Env: ${APP_ENV})`);
}

/**
 * Capture backend exception
 */
export function captureBackendException(error, context = {}) {
  const sanitized = redactSensitiveBackendData(context);
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: sanitized });
  } else if (process.env.NODE_ENV !== 'test') {
    console.error('❌ [Backend Error]', error.message, sanitized);
  }
}

/**
 * Capture Database Error with Sanitized Query
 */
export function captureDatabaseError(error, sql) {
  const sanitizedQuery = sanitizeSql(sql);
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        error_type: 'database_error',
        sql_state: error.sqlState || 'UNKNOWN',
        sql_code: error.code || 'UNKNOWN'
      },
      extra: {
        sanitizedQuery,
        errno: error.errno
      }
    });
  }
}

/**
 * Middleware: Critical Path Latency & 5xx Alerting
 */
export function latencyAndErrorTrackerMiddleware(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const url = req.originalUrl || req.url;
    const method = req.method;
    const status = res.statusCode;

    // Monitor critical business workflows
    const isLogin = url.includes('/auth/login') && method === 'POST';
    const isBookingCreate = url.includes('/bookings') && method === 'POST';
    const isBookingCancel = url.includes('/bookings') && url.includes('/cancel') && method === 'PATCH';

    if (isLogin || isBookingCreate || isBookingCancel) {
      const op = isLogin ? 'Auth:Login' : isBookingCreate ? 'Booking:Create' : 'Booking:Cancel';

      if (SENTRY_DSN) {
        Sentry.addBreadcrumb({
          category: 'latency',
          message: `${op} [${method} ${url}] completed in ${duration}ms (status ${status})`,
          level: duration > 1500 ? 'warning' : 'info',
          data: { durationMs: duration, status, operation: op }
        });

        // Trigger alert if operation latency exceeds 2.5s SLA
        if (duration > 2500) {
          Sentry.captureMessage(`Elevated Latency: ${op} took ${duration}ms (SLA: 2500ms)`, {
            level: 'warning',
            tags: { operation: op, alert_type: 'latency_sla_breach' }
          });
        }
      }
    }

    // Trigger alert on 5xx server errors
    if (status >= 500 && SENTRY_DSN) {
      Sentry.captureMessage(`Elevated 5xx Error: ${method} ${url} responded with ${status}`, {
        level: 'error',
        tags: {
          endpoint: url.split('?')[0],
          status_code: String(status),
          alert_type: 'api_5xx_rate'
        }
      });
    }
  });

  next();
}

export { Sentry };

