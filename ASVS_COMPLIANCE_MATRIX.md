# OWASP ASVS 5.0 (Level 2) Compliance Traceability Matrix

**Platform:** SocietyCook Hyperlocal Enterprise Platform  
**Target Level:** Level 2 (Applications processing sensitive personal data and financial transactions)  
**Verification Date:** November 2026  
**Status Legend:**
- **PASS**: Verified and fully enforced in code and configuration
- **PARTIALLY VERIFIED**: Implemented, automated test covers core flow
- **NOT APPLICABLE**: Requirement not relevant to current architecture
- **BLOCKED**: Requires external legal or third-party infrastructure setup

---

| ASVS Section | Requirement Description | Implementation Evidence | Verification Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **V1. Architecture** | V1.1.1 — Defined security architecture with trust zones | `ARCHITECTURE.md`, `THREAT_MODEL.md` trust boundary diagrams | Architecture audited | **PASS** |
| | V1.4.1 — Multi-tenant isolation verified server-side | `authMiddleware.js`, `requireSameSocietyOrAdmin`, tenant-scoped SQL | Integration tests verify cross-tenant denial | **PASS** |
| **V2. Authentication** | V2.1.1 — Minimum 8-character password policy | `zod` schema: `password: z.string().min(8).max(72)` | Unit test verifies 8 char min | **PASS** |
| | V2.1.2 — Truncation prevention (supports 64+ chars) | `bcrypt.hash(password, 12)` with max 72 chars | Password test handles long strings | **PASS** |
| | V2.2.1 — Salting and password hashing (bcrypt cost 12) | `bcrypt.hash(password, 12)` in `authService.js` | Algorithm verified in code | **PASS** |
| | V2.3.1 — Rate limiting on authentication endpoints | `express-rate-limit` (5 req / 15 min per IP on `/auth/login`) | Automated rate limit test | **PASS** |
| | V2.4.1 — Generic error messages on login | `Invalid email or password` returned uniformly | Negative auth test confirms identical msg | **PASS** |
| | V2.8.1 — Cryptographically secure refresh tokens | `crypto.randomBytes(40).toString('hex')` with SHA-256 hash | Refresh token rotation verified | **PASS** |
| **V3. Session Mgmt** | V3.1.1 — Cryptographically signed session tokens | JWT with HS256, 256-bit secret, 2h expiry | Token verification tested | **PASS** |
| | V3.3.1 — Session revocation on logout | `refresh_tokens.revoked = 1` in `authService.logout` | Revocation verified in DB | **PASS** |
| | V3.3.2 — Refresh token rotation and single-use | Old token revoked immediately on exchange | Rotation verified | **PASS** |
| **V4. Access Control** | V4.1.1 — Deny-by-default role authorization | `requireRoles(['ADMIN'])` on privileged routes | Unauthorized roles receive 403 | **PASS** |
| | V4.1.2 — Prevention of horizontal privilege escalation | `resUser.society_id !== group.society_id` check in `joinGroup` | Cross-society test passes | **PASS** |
| | V4.1.3 — BOLA / IDOR protection on review endpoints | `resident_id = req.user.id` verified on booking review | IDOR test confirms 403 | **PASS** |
| | V4.2.1 — Prevention of public admin self-registration | `if (role === 'ADMIN') throw 403` in `authService.js` | Admin registration test fails with 403 | **PASS** |
| **V5. Validation** | V5.1.1 — Strict input validation schemas | `zod` schema applied to all route bodies and queries | Invalid payload tests return 400 | **PASS** |
| | V5.2.1 — Sanitized output and typed parameters | `mysql2.execute` prepared statements | SQL injection test suite passes | **PASS** |
| **V6. Cryptography** | V6.1.1 — Secure random number generation | `crypto.randomBytes` used for tokens and codes | Cryptographic randomness verified | **PASS** |
| | V6.2.1 — TLS 1.2+ for database and API transit | `ssl: { minVersion: 'TLSv1.2' }` in `database.js` | Enforced in pool configuration | **PASS** |
| **V7. Error Handling** | V7.1.1 — Stack traces suppressed in production | `errorMiddleware.js` conceals stack in `production` | Error response test verified | **PASS** |
| | V7.1.2 — Centralized structured logging | `auditMiddleware.js` records actions and timestamps | Audit table inspected | **PASS** |
| **V8. Data Protection** | V8.1.1 — Passwords and secrets redacted from logs | Password fields removed before returning / logging | Audit logs checked for redaction | **PASS** |
| | V8.2.1 — Aadhaar and sensitive ID protection | Masked ID handling, no raw image storage in web root | Architecture review | **PASS** |
| **V9. Communications** | V9.1.1 — HTTPS enforcement and HSTS header | `helmet.hsts({ maxAge: 31536000, preload: true })` | Response headers audited | **PASS** |
| | V9.2.1 — Restricted CORS with exact origin whitelist | Strict origin callback without wildcard reflection | Origin reflection attack blocked | **PASS** |
| **V10. Malicious Code** | V10.1.1 — Dependency vulnerability auditing | Clean `npm audit` and lockfile integrity | Zero high/critical vulnerabilities | **PASS** |
| **V11. Business Logic** | V11.1.1 — Server-side price and discount computation | `calculateGroupPricing` calculates prices on server | Client price tampering rejected | **PASS** |
| | V11.1.2 — Webhook signature verification | Razorpay HMAC-SHA256 signature verification | Invalid webhook signature returns 400 | **PASS** |
| | V11.1.3 — Concurrency locking on critical bookings | `SELECT ... FOR UPDATE` in transactions | Concurrent race condition test | **PASS** |
| **V13. API Security** | V13.1.1 — Parameterized queries for all SQL operations | 100% prepared statement coverage via `execute` | Zero raw string interpolation | **PASS** |
| | V13.2.1 — Rate limiting on public and sensitive routes | IP-based sliding window rate limiter | 429 Too Many Requests verified | **PASS** |
| **V14. Configuration** | V14.1.1 — Content Security Policy and frame prevention | Helmet configured with CSP and `frameguard: deny` | Headers verified via cURL | **PASS** |
| | V14.2.1 — Multi-stage non-root container deployment | Dockerfile uses `USER node` and Alpine base | Container config inspected | **PASS** |
