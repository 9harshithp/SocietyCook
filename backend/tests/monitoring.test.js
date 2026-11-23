import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import {
  redactSensitiveBackendData,
  sanitizeSql,
  sanitizeUrl,
  recordLoginFailure,
  resetLoginFailure
} from '../src/config/monitoring.js';

describe('SocietyCook Production Monitoring & Reliability Tests', () => {
  let adminToken = '';

  beforeAll(async () => {
    // Authenticate admin for diagnostic test
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Demo12345!' });

    adminToken = res.body.token || res.body.accessToken;
  });

  it('1. Process Liveness Check: GET /health/liveness returns HTTP 200 with process telemetry', async () => {
    const res = await request(app).get('/health/liveness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.liveness).toBe('ALIVE');
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.memoryRssMb).toBe('number');
  });

  it('2. Database Readiness Check: GET /health/readiness returns HTTP 200 with database: CONNECTED', async () => {
    const res = await request(app).get('/health/readiness');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.readiness).toBe('READY');
    expect(res.body.database).toBe('CONNECTED');
  });

  it('3. Consolidated Health Check: GET /health returns HTTP 200 with liveness and database status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.liveness).toBe('ALIVE');
    expect(res.body.database).toBe('CONNECTED');
    expect(res.body.version).toBe('2.0.0');
  });

  it('4. PII Redaction: Strictly scrubs passwords, JWTs, phone numbers, and auth headers', () => {
    const testPayload = {
      email: 'resident@example.com',
      password: 'MySecretPassword123!',
      phone: '9876543210',
      nested: {
        token: 'eyTestHeader.eyTestPayload.TestSignature',
        flat: 'Tower B Flat 402',
        cardNumber: '4111222233334444',
        authorization: 'Bearer eySecretToken1234567890.eySecondPart.ThirdPart'
      },
      nonSensitive: 'SocietyCook Kitchen Service'
    };

    const redacted = redactSensitiveBackendData(testPayload);

    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.phone).toBe('[REDACTED]');
    expect(redacted.nested.token).toBe('[REDACTED]');
    expect(redacted.nested.flat).toBe('[REDACTED]');
    expect(redacted.nested.cardNumber).toBe('[REDACTED]');
    expect(redacted.nested.authorization).toBe('[REDACTED]');
    expect(redacted.nonSensitive).toBe('SocietyCook Kitchen Service');
  });

  it('5. SQL Sanitization: Sanitizes query string to prevent PII exposure in database error reports', () => {
    const rawSql = "SELECT * FROM users WHERE email = 'resident@example.com' AND society_id = 42";
    const sanitized = sanitizeSql(rawSql);

    expect(sanitized).not.toContain('resident@example.com');
    expect(sanitized).toContain("email = '?'");
  });

  it('6. Repeated Login Failure Detection: Tracks consecutive login failures without throwing unhandled exceptions', () => {
    const testIdentifier = '127.0.0.1:attacker@example.com';
    resetLoginFailure(testIdentifier);

    // Record 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      recordLoginFailure(testIdentifier);
    }

    // Reset after test
    resetLoginFailure(testIdentifier);
  });

  it('7. Diagnostic Staging Error Route: GET /api/v1/monitoring/test-error executes safely in non-production', async () => {
    const res = await request(app)
      .get('/api/v1/monitoring/test-error')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.scrubbingVerified).toBe(true);
  });

  it('8. Deep Nested Objects & Unexpected Event Shapes Audit', () => {
    // 8a. Deeply nested object beyond depth 5
    const deepObj = {
      level1: {
        level2: {
          level3: {
            level4: {
              secretToken: 'secretValue123',
              userAddress: 'Flat 501, Tower C, Bangalore'
            }
          }
        }
      }
    };
    const redactedDeep = redactSensitiveBackendData(deepObj);
    expect(redactedDeep.level1.level2.level3.level4.secretToken).toBe('[REDACTED]');
    expect(redactedDeep.level1.level2.level3.level4.userAddress).toBe('[REDACTED]');

    // 8b. Circular references: must handle gracefully without stack overflow
    const circularObj = { name: 'CircularTest', phone: '9876543210' };
    circularObj.self = circularObj;
    const redactedCircular = redactSensitiveBackendData(circularObj);
    expect(redactedCircular.phone).toBe('[REDACTED]');
    expect(redactedCircular.self).toBe('[CIRCULAR]');

    // 8c. Unexpected primitives, null, undefined, dates, regexes
    expect(redactSensitiveBackendData(null)).toBe(null);
    expect(redactSensitiveBackendData(undefined)).toBe(undefined);
    expect(redactSensitiveBackendData(42)).toBe(42);
    expect(redactSensitiveBackendData(true)).toBe(true);

    const testDate = new Date();
    expect(redactSensitiveBackendData(testDate)).toBe(testDate);

    const testRegex = /test-regex/gi;
    expect(redactSensitiveBackendData(testRegex)).toBe(testRegex);
  });

  it('9. URL & Query Parameter Sanitization Audit', () => {
    const rawUrl = 'https://societycook.vercel.app/api/v1/checkout?token=superSecret123&password=pass&phone=9876543210&mode=demo';
    const sanitized = sanitizeUrl(rawUrl);

    expect(sanitized).not.toContain('superSecret123');
    expect(sanitized).not.toContain('password=pass');
    expect(sanitized).toContain('token=%5BREDACTED%5D');
    expect(sanitized).toContain('mode=demo');

    // Unexpected URL shapes
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl('not-a-url')).toBe('not-a-url');
  });

  it('10. Header and Cookie Redaction Audit', () => {
    const rawHeaders = {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.TestSig',
      'cookie': 'connect.sid=s%3A12345; token=secretJwt; auth_user=Rahul',
      'x-api-key': 'topSecretApiKey',
      'content-type': 'application/json'
    };

    const redactedHeaders = redactSensitiveBackendData(rawHeaders);
    expect(redactedHeaders['authorization']).toBe('[REDACTED]');
    expect(redactedHeaders['cookie']).toBe('[REDACTED]');
    expect(redactedHeaders['x-api-key']).toBe('[REDACTED]');
    expect(redactedHeaders['content-type']).toBe('application/json');
  });

  it('11. Production Route Inaccessibility: Diagnostic endpoint returns 404 in production environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      const res = await request(app)
        .get('/api/v1/monitoring/test-error')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Endpoint not available in production');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});

