# SocietyCook Penetration Testing & Ethical Hacking Report

**Test Scope:** SocietyCook Web Application & REST APIs (`/api/v1/*`)  
**Methodology:** OWASP Web Security Testing Guide (WSTG v4.2) & API Security Testing  
**Test Mode:** Authorized Local & Staging Environment Simulation  
**Test Account Personas:**
- `attacker_external`: Unauthenticated internet bot / threat actor
- `dishonest_resident_1`: Resident in Society 1 (Green Glen Palms, Flat A-101)
- `resident_society_2`: Resident in Society 2 (Prestige Ferns, Flat B-402)
- `compromised_cook`: Verified Cook account
- `malicious_manager`: Untrusted user attempting to register as Manager
- `platform_admin`: Verified superadministrator

---

## 1. Test Scenarios and Results

### Test Case 1: Arbitrary Origin Reflection & Credential Stealing (CORS Bypass)
- **Target:** `POST /api/v1/auth/me` and `GET /api/v1/bookings`
- **Method:** Injected `Origin: https://evil-attacker.example.com` with `Credentials: include`.
- **Pre-Fix Result:** `Access-Control-Allow-Origin: https://evil-attacker.example.com` and `Access-Control-Allow-Credentials: true` returned. **[VULNERABLE - CRITICAL]**
- **Remediation Applied:** Strict allowlist validation checking exact domains (`https://societycook.vercel.app`, local dev origins).
- **Post-Fix Verification:** Origin rejected or set to null. Request blocked by browser SOP. **[PASS]**

---

### Test Case 2: Vertical Privilege Escalation via Self-Registration
- **Target:** `POST /api/v1/auth/register`
- **Payload:** `{"name":"Attacker","email":"hacker@evil.com","password":"Password123!","role":"SOCIETY_MANAGER","societyId":1}`
- **Pre-Fix Result:** HTTP 201 Created. Attacker obtained `SOCIETY_MANAGER` JWT with access to all society member records and staff. **[VULNERABLE - CRITICAL]**
- **Remediation Applied:** Removed `SOCIETY_MANAGER` from `z.enum(['RESIDENT', 'COOK'])`.
- **Post-Fix Verification:** Schema validation rejects payload with HTTP 400 Bad Request. **[PASS]**

---

### Test Case 3: Horizontal Cross-Tenant Data Access (IDOR / BOLA)
- **Target:** `GET /api/v1/analytics/society/2` using Resident token from Society 1.
- **Pre-Fix Result:** HTTP 200 OK with complete financial ledger and resident counts of Society 2 returned. **[VULNERABLE - HIGH]**
- **Remediation Applied:** Implemented tenant check: `if (req.user.role !== 'ADMIN' && req.user.society_id !== targetSocietyId) return 403 Forbidden`.
- **Post-Fix Verification:** HTTP 403 Forbidden: "Access restricted to your registered society." **[PASS]**

---

### Test Case 4: Review Forgery & Overwrite (BOLA)
- **Target:** `POST /api/v1/reviews`
- **Payload:** `{"bookingId": 9999, "rating": 5, "comment": "Hacked review!"}` (Booking 9999 belongs to another resident).
- **Pre-Fix Result:** Review inserted into database regardless of who created the booking. **[VULNERABLE - HIGH]**
- **Remediation Applied:** Database validation verifying `SELECT id FROM bookings WHERE id = ? AND resident_id = ?`.
- **Post-Fix Verification:** HTTP 403 Forbidden: "You can only review bookings associated with your household." **[PASS]**

---

### Test Case 5: Client-Side Price & Discount Tampering
- **Target:** `POST /api/v1/bookings`
- **Payload:** `{"cookId": 1, "amount": 1, "startDate": "2026-12-01", "startTime": "08:00"}`
- **Pre-Fix Result:** `amount` parameter from client was discarded; server re-computed amount from database `cook.price`. **[PASS - ROBUST]**
- **Post-Fix Verification:** Server-side calculation confirmed intact; client amounts are completely ignored. **[PASS]**

---

### Test Case 6: Concurrent Booking Race Condition (Double Booking)
- **Target:** Two simultaneous `POST /api/v1/bookings` requests for the same cook and time slot.
- **Method:** Simulated 10 concurrent requests at the exact same millisecond.
- **Verification:** Row-level transaction locks (`SELECT ... FOR UPDATE`) and database indexing ensure only one booking succeeds; competing requests receive conflict errors. **[PASS]**

---

### Test Case 7: Fake Payment Confirmation Bypass in Production
- **Target:** `POST /api/v1/bookings/1/pay-demo` in production environment (`NODE_ENV=production`).
- **Pre-Fix Result:** Enabled by default because `DEMO_PAYMENTS !== 'false'`. **[VULNERABLE - HIGH]**
- **Remediation Applied:** `DEMO_PAYMENTS` strictly disabled whenever `NODE_ENV === 'production'`.
- **Post-Fix Verification:** HTTP 403 Forbidden: "Demo payment mode is disabled in production." **[PASS]**

---

### Test Case 8: Brute-Force Credential Stuffing on Login
- **Target:** `POST /api/v1/auth/login`
- **Method:** 50 consecutive login requests within 10 seconds.
- **Pre-Fix Result:** Global 300 req/min permitted all 50 attempts. **[VULNERABLE - MEDIUM]**
- **Remediation Applied:** Dedicated rate limiter (5 requests / 15 minutes per IP on `/auth/login`).
- **Post-Fix Verification:** Request 6 immediately blocked with HTTP 429 Too Many Requests. **[PASS]**

---

### Test Case 9: SQL Injection Probing on Cook Search and Filter
- **Target:** `GET /api/v1/cooks?society_id=1' OR '1'='1` and `service_type=COOKING'; DROP TABLE users;--`
- **Verification:** Both parameters validated with Zod/Number casting and parameterized via `mysql2.execute` prepared statements. HTTP 400 or sanitized query execution. Zero SQL injection possible. **[PASS]**

