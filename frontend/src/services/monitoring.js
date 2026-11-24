import * as Sentry from '@sentry/react';

// Sentry DSN from environment variable - never committed to source
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_COMMIT = import.meta.env.VITE_APP_COMMIT || '53c4d09';
const APP_ENV = import.meta.env.VITE_SENTRY_ENVIRONMENT || (import.meta.env.VITE_IS_STAGING === 'true' ? 'staging' : (import.meta.env.MODE || 'production'));

// Sensitive keys to redact from events and breadcrumbs
const SENSITIVE_KEYS = [
  'password',
  'token',
  'jwt',
  'authorization',
  'cookie',
  'cookies',
  'secret',
  'hash',
  'phone',
  'mobile',
  'flat',
  'flat_number',
  'address',
  'cvv',
  'card',
  'credit_card',
  'card_number',
  'upi',
  'pin',
  'otp',
  'otp_code',
  'key',
  'api-key',
  'apikey'
];

/**
 * Deep redaction of sensitive PII and authentication tokens
 */
export function redactSensitiveData(obj, depth = 0, seen = new WeakSet()) {
  if (obj === null || obj === undefined || depth > 8) return obj;

  if (typeof obj === 'string') {
    // Redact JWT pattern
    let cleaned = obj.replace(/ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[REDACTED_JWT]');
    // Redact 10-digit Indian phone numbers
    cleaned = cleaned.replace(/\b(?:\+91|0)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]');
    // Redact Bearer tokens
    cleaned = cleaned.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]');
    return cleaned;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Preserve non-plain objects
  if (obj instanceof Date || obj instanceof RegExp || typeof obj === 'function') {
    return obj;
  }

  // Circular reference protection
  if (seen.has(obj)) {
    return '[CIRCULAR]';
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1, seen));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitiveKey = SENSITIVE_KEYS.some((sensitive) =>
      key.toLowerCase().includes(sensitive)
    );

    if (isSensitiveKey) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactSensitiveData(value, depth + 1, seen);
    }
  }
  return redacted;
}

/**
 * Scrub sensitive query parameters from URLs
 */
function sanitizeUrl(urlString) {
  try {
    const url = new URL(urlString, window.location.origin);
    const sensitiveParams = ['token', 'auth', 'jwt', 'otp', 'code', 'secret', 'password'];
    let modified = false;

    for (const param of sensitiveParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, '[REDACTED]');
        modified = true;
      }
    }

    return modified ? url.toString() : urlString;
  } catch (e) {
    return urlString;
  }
}

/**
 * Initialize Frontend Production Monitoring
 */
export function initMonitoring() {
  if (!SENTRY_DSN) {
    console.info('[Monitoring] Sentry DSN not configured. Error monitoring running in passive local mode.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    release: `societycook-frontend@${APP_COMMIT}`,
    environment: APP_ENV,
    
    // Error monitoring only: tracing, profiling, and session replay disabled
    tracesSampleRate: 0,
    sendDefaultPii: false,

    // Enterprise Privacy: Session Replay is STRICTLY DISABLED per review requirements
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Attach release tags and service identity
    initialScope: {
      tags: {
        service: 'societycook-frontend',
        commit: APP_COMMIT,
        framework: 'react-vite'
      }
    },

    // Sanitize event payload before transmission
    beforeSend(event, hint) {
      // Redact exception values and messages
      if (event.exception?.values) {
        event.exception.values.forEach((v) => {
          if (v.value) v.value = redactSensitiveData(v.value);
        });
      }

      // Redact request URL and headers
      if (event.request) {
        if (event.request.url) event.request.url = sanitizeUrl(event.request.url);
        if (event.request.headers) event.request.headers = redactSensitiveData(event.request.headers);
        if (event.request.data) event.request.data = redactSensitiveData(event.request.data);
      }

      // Redact extra context and user identity
      if (event.extra) event.extra = redactSensitiveData(event.extra);
      if (event.user) {
        // Redact email, phone, IP, keeping only non-PII role identifier
        event.user = {
          id: event.user.id || 'anonymous',
          role: event.user.role || 'GUEST'
        };
      }

      return event;
    },

    // Sanitize breadcrumbs (fetch, navigation, console)
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = sanitizeUrl(breadcrumb.data.url);
      }

      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        if (breadcrumb.data) {
          breadcrumb.data = redactSensitiveData(breadcrumb.data);
        }
      }

      if (breadcrumb.message) {
        breadcrumb.message = redactSensitiveData(breadcrumb.message);
      }

      return breadcrumb;
    }
  });

  console.info(`[Monitoring] Sentry initialized (Release: ${APP_COMMIT}, Env: ${APP_ENV})`);
}

/**
 * Capture frontend exception with sanitization
 */
export function captureException(error, context = {}) {
  try {
    const sanitizedContext = redactSensitiveData(context);
    if (SENTRY_DSN) {
      Sentry.captureException(error, { extra: sanitizedContext });
    } else if (import.meta.env.DEV) {
      console.error('[Monitoring Dev]', error, sanitizedContext);
    }
  } catch (err) {
    // Fail-safe: monitoring exception capture must never throw or disrupt rendering
  }
}

/**
 * Track Business Operation Latency (Login, Booking, Cancellation)
 */
export function trackLatency(operation, durationMs, metadata = {}) {
  const sanitized = redactSensitiveData(metadata);
  const isElevated = durationMs > 2000;

  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${operation} completed in ${durationMs}ms`,
      level: isElevated ? 'warning' : 'info',
      data: {
        operation,
        durationMs,
        ...sanitized
      }
    });

    if (isElevated) {
      Sentry.captureMessage(`Elevated Latency: ${operation} took ${durationMs}ms`, 'warning');
    }
  }
}

/**
 * Expose verification hook strictly in development and preview environments (never in public production)
 */
const isPreviewOrDev =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' &&
    window.location.hostname !== 'societycook.vercel.app' &&
    !window.location.hostname.endsWith('societycook.com'));

if (typeof window !== 'undefined' && isPreviewOrDev) {
  window.__societycook_verify_sentry = (customMessage = 'Verification: Controlled Frontend Error Event') => {
    const testError = new Error(customMessage);
    captureException(testError, {
      diagnostic: true,
      timestamp: new Date().toISOString(),
      testToken: 'eySimulatedAuthToken12345'
    });
    return { dispatched: true, error: testError.message };
  };
}

export { Sentry };

