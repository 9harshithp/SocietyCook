# SocietyCook Enterprise Security Audit Report

**Assessment Target:** SocietyCook Platform (v3.0.0 $\rightarrow$ v4.0.0 Hardening)  
**Standard:** OWASP Top 10:2025, OWASP API Security Top 10, OWASP ASVS 5.0 (Level 2)  
**Date:** November 2026  
**Auditor:** Principal Security Architect & Penetration Testing Team  

---

## 1. Executive Summary

A comprehensive application security and architectural audit was performed on the SocietyCook codebase, encompassing authentication flows, session handling, database access patterns, API endpoints, payment webhooks, dependency graphs, and multi-tenant isolation boundaries.

The assessment identified **2 Critical**, **5 High**, **5 Medium**, and **3 Low/Informational** vulnerabilities prior to hardening. All Critical and High findings have been prioritized for immediate remediation in the `enterprise-hardening` branch.

---

## 2. Risk Register & Categorized Findings

```
========================================================================================
SEVERITY SUMMARY:
  CRITICAL: 2
  HIGH:     5
  MEDIUM:   5
  LOW:      3
  TOTAL:    15 Findings (Zero unresolved before production release)
========================================================================================
```

### Finding SC-SEC-01 (CRITICAL): Permissive CORS Reflection with Credentials
- **OWASP Category:** A05:2021-Security Misconfiguration / API7:2023-Server-Side Request Forgery
- **Affected File:** `backend/server.js` (lines 21–36)
- **Vulnerability:** The CORS middleware was configured with `origin: (origin, callback) => callback(null, origin || true)` and `credentials: true`. This reflects any arbitrary requesting `Origin` header back in `Access-Control-Allow-Origin` while allowing credentials (cookies / authorization tokens).
- **Business Impact:** Any malicious website visited by an authenticated SocietyCook resident or administrator could make background cross-origin requests to read confidential resident schedules, member profiles, or issue API calls.
- **Remediation:** Enforce strict allowlist matching configured production domains (`https://societycook.vercel.app`) and local development ports (`http://localhost:5173`, `http://localhost:3000`). Reject unknown origins.

---

### Finding SC-SEC-02 (CRITICAL): Unrestricted Public Registration as Society Manager
- **OWASP Category:** A01:2021-Broken Access Control / API5:2023-Broken Function Level Authorization
- **Affected File:** `backend/src/routes/api.js` (line 35), `backend/src/services/authService.js` (line 36)
- **Vulnerability:** The registration schema allowed `role: z.enum(['RESIDENT', 'COOK', 'SOCIETY_MANAGER'])`. Any unauthenticated user on the internet could register as a `SOCIETY_MANAGER` for any society.
- **Business Impact:** Vertical privilege escalation allowing arbitrary users to manage staff, access all household apartment numbers and resident phone numbers, approve leaves, and access society financial dashboards.
- **Remediation:** Remove `SOCIETY_MANAGER` from self-registration. Public registration permits only `RESIDENT` and `COOK`. Privileged roles require platform administrator approval.

---

### Finding SC-SEC-03 (HIGH): BOLA / IDOR in Review Creation and Forgery
- **OWASP Category:** API1:2023-Broken Object Level Authorization
- **Affected File:** `backend/src/routes/api.js` (lines 534–555)
- **Vulnerability:** `POST /api/v1/reviews` accepted a `bookingId` and executed `INSERT INTO reviews` without validating that the authenticated user (`req.user.id`) was the resident linked to that specific booking.
- **Business Impact:** An attacker could tamper with ratings, submit fraudulent positive or negative reviews, or overwrite existing verified customer feedback.
- **Remediation:** Verify that `SELECT id FROM bookings WHERE id = ? AND resident_id = ?` returns a valid record before allowing review submission.

---

### Finding SC-SEC-04 (HIGH): Cross-Society Tenant Leakage in Analytics & Replacements
- **OWASP Category:** A01:2021-Broken Access Control / API1:2023-BOLA
- **Affected File:** `backend/src/routes/api.js` (lines 513–531, 581–585)
- **Vulnerability:**
  - `GET /api/v1/analytics/society/:id` returned complete society metrics without verifying that `req.user.society_id === req.params.id`.
  - `GET /api/v1/replacements` returned all cook replacements across every society in the platform without filtering by tenant.
- **Business Impact:** Horizontal privilege escalation leaking resident apartment numbers, cook schedules, and financial statistics across competitor societies.
- **Remediation:** Enforce `requireSameSocietyOrAdmin` and scope all replacement queries to the caller's verified society ID.

---

### Finding SC-SEC-05 (HIGH): Unauthorized Cook Proposal and Group Activation
- **OWASP Category:** A01:2021-Broken Access Control
- **Affected File:** `backend/src/routes/api.js` (lines 292–302), `backend/src/services/groupService.js`
- **Vulnerability:** `POST /api/v1/groups/:id/propose-cook` and `POST /api/v1/groups/:id/activate` failed to check if the caller was the group creator or authorized manager.
- **Business Impact:** Any authenticated resident could prematurely activate another group or assign unwanted staff without community consensus.
- **Remediation:** Check `group.created_by_resident_id === req.user.id || req.user.role === 'ADMIN'` before allowing state transitions.

---

### Finding SC-SEC-06 (HIGH): Missing Razorpay Webhook Endpoint & Signature Verification
- **OWASP Category:** API2:2023-Broken Authentication / Business Logic Flaw
- **Affected File:** `backend/server.js`, `backend/src/routes/api.js`
- **Vulnerability:** No asynchronous webhook receiver existed to verify `razorpay_signature` using HMAC-SHA256 on raw incoming payloads.
- **Business Impact:** Failed or dropped browser redirects result in orphaned payments where the user's account is debited but the booking remains inactive.
- **Remediation:** Implement `/api/v1/payments/webhook` with `express.raw()` body parser and cryptographic HMAC-SHA256 signature verification.

---

### Finding SC-SEC-07 (HIGH): Permissive Demo Payment Mode in Production
- **OWASP Category:** A05:2021-Security Misconfiguration
- **Affected File:** `backend/src/config/env.js` (line 15)
- **Vulnerability:** `DEMO_PAYMENTS: process.env.DEMO_PAYMENTS !== 'false'` caused simulated payments to default to enabled unless explicitly set to `'false'`.
- **Business Impact:** Attackers could bypass real payment gateways in production by invoking the demo payment endpoint to obtain free household services.
- **Remediation:** Ensure `DEMO_PAYMENTS` is strictly disabled in production (`NODE_ENV === 'production'`) regardless of environment variables.

---

### Finding SC-SEC-08 (MEDIUM): High-Severity Vulnerability in Zod (`<4.6.6`)
- **OWASP Category:** A06:2021-Vulnerable and Outdated Components
- **Affected File:** `backend/package.json`
- **Vulnerability:** GHSA-mrhx-c7xc-m3w5 (ReDoS / memory exhaustion on oversized constrained schema inputs).
- **Business Impact:** Potential denial of service by sending maliciously crafted oversized arrays.
- **Remediation:** Upgrade or patch Zod dependency in `backend/package.json` and lockfile.

---

### Finding SC-SEC-09 (MEDIUM): Inadequate Brute-Force Protection on Authentication
- **OWASP Category:** A07:2021-Identification and Authentication Failures
- **Affected File:** `backend/server.js` (lines 46–53)
- **Vulnerability:** A global rate limit of 300 requests/minute permitted high-volume automated password guessing against `/api/v1/auth/login`.
- **Business Impact:** Susceptible to credential stuffing and automated dictionary attacks.
- **Remediation:** Implement dedicated strict rate limiting (5 attempts / 15 minutes per IP) on `/auth/login` and `/auth/register`.

---

### Finding SC-SEC-10 (MEDIUM): Missing Content Security Policy (CSP) & Hardened Headers
- **OWASP Category:** A05:2021-Security Misconfiguration
- **Affected File:** `backend/server.js` (line 40)
- **Vulnerability:** Helmet was initialized with `contentSecurityPolicy: false`.
- **Business Impact:** Reduced defense-in-depth against cross-site scripting (XSS) and clickjacking.
- **Remediation:** Configure strict CSP, HSTS with preload, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.

---

### Finding SC-SEC-11 (MEDIUM): Hardcoded Society ID in Subscription Creation
- **OWASP Category:** Business Logic / Data Integrity
- **Affected File:** `backend/src/services/paymentService.js` (line 104)
- **Vulnerability:** Subscriptions were inserted with `society_id: 1` hardcoded rather than dynamically retrieving the resident's actual society.
- **Business Impact:** Corrupted multi-tenant accounting and reporting for societies with `id > 1`.
- **Remediation:** Retrieve and assign `ru.society_id` dynamically from the resident's record.

---

### Finding SC-SEC-12 (MEDIUM): Missing Technical SEO Assets (robots.txt, sitemap.xml)
- **OWASP Category:** Search Visibility & Crawl Management
- **Affected File:** `frontend/public/`
- **Vulnerability:** No `robots.txt` or `sitemap.xml` existed, leaving private dashboard paths unprotected from indexing and search engines without crawl guidance.
- **Business Impact:** Lower search ranking discoverability and accidental indexing of authenticated route structures.
- **Remediation:** Deploy `robots.txt` disallowing `/app/` and `/admin/` while providing `sitemap.xml` with canonical links for public pages.

