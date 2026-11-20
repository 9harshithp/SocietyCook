# SocietyCook Enterprise Security Policy & Vulnerability Disclosure

**Version:** 4.0.0  
**Effective Date:** November 2026  
**Security Contact:** `security@societycook.in`  

---

## 1. Security Architecture & Controls

SocietyCook enforces multi-layered defense-in-depth across all system boundaries:

1. **Authentication & Session Security:**
   - Password hashing utilizing bcrypt with salt cost 12.
   - Cryptographically random 40-byte refresh tokens with SHA-256 hashed database storage and automatic token rotation upon each exchange.
   - Public registration restricted to `RESIDENT` and `COOK`; privileged `SOCIETY_MANAGER` and `ADMIN` accounts require verified administrative approval.
   - Dedicated authentication rate limiting (15 attempts per 15 minutes per IP) to neutralize credential stuffing and automated dictionary attacks.

2. **Multi-Tenant Logical Isolation:**
   - Deny-by-default role authorization on every API route via `requireRoles()`.
   - Every residential society acts as an isolated tenant boundary enforced server-side.
   - Object-level authorization prevents Broken Object Level Authorization (BOLA/IDOR) on reviews, appointments, and society financial analytics.

3. **Transport & Perimeter Defense:**
   - Strict CORS origin allowlist matching authorized domains without wildcard reflection.
   - Comprehensive HTTP security headers via Helmet: Strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS) with 1-year preload, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
   - MySQL connections mandate TLS 1.2+ encryption in transit.

4. **Financial & Payment Integrity:**
   - All booking amounts and cluster discounts are computed strictly server-side.
   - Razorpay Webhooks verified cryptographically using HMAC-SHA256 signatures over raw request body buffers.
   - Demonstration payment mode is strictly disabled in production environments (`NODE_ENV === 'production'`).

---

## 2. Vulnerability Reporting (Coordinated Disclosure)

If you discover a security vulnerability in SocietyCook:
1. Email `security@societycook.in` with detailed technical steps to reproduce.
2. Allow up to 48 hours for initial triage and acknowledgment.
3. We request that you adhere to coordinated vulnerability disclosure and refrain from accessing or modifying real user data or executing denial-of-service payloads against live services.
