# SocietyCook Privacy & Data Inventory (DPDP Act & GDPR)

**Regulatory Frameworks Evaluated:**
- Digital Personal Data Protection Act, 2023 (DPDP Act, India)
- Information Technology (Reasonable Security Practices) Rules, 2011 (IT Act)
- CERT-In Cyber Security Directions (April 2022)
- Payment Card Industry Data Security Standard (PCI DSS v4.0 - SAQ A)
- General Data Protection Regulation (GDPR - EU standard reference)

---

## 1. Data Collection & Processing Inventory

| Data Field | Category | Data Subject | Purpose of Collection | Legal Basis | Storage Location | Retention Period |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **Full Name** | Personal | Resident / Cook | Account identity, service coordination | Contractual Necessity | `users.name` | Duration of account + 180 days |
| **Email Address** | Personal | Resident / Cook | Authentication, notices, invoices | Contractual Necessity | `users.email` | Duration of account |
| **Mobile Number** | Personal | Resident / Cook | Daily OTP attendance, urgent contact | Contractual Necessity | `users.phone` | Duration of account |
| **Password Hash** | Security | Resident / Cook | Authentication credential | Security / Contract | `users.password_hash` (bcrypt 12) | Immediate overwrite on change |
| **Flat & Block Number** | Location | Resident | Physical home cooking service delivery | Contractual Necessity | `users.flat` | Duration of subscription |
| **Dietary Requirements**| Sensitive | Resident | Safe meal preparation (allergies, veg) | Explicit Consent | `cook_groups.dietary_pref` | Duration of group membership |
| **Identity Proofs** | Sensitive | Domestic Cook | Campus security clearance, police check | Legal Compliance / Safety | `cook_documents` (Masked/restricted) | Duration of engagement + 1 yr |
| **Bank Account / UPI** | Financial | Domestic Cook | Living wage floor direct payouts | Contractual / Statutory | `payouts.reference_number` | 7 years (Income Tax requirement) |
| **Session Timestamps** | Audit | Resident / Cook | Attendance verification, fraud defense | Legitimate Interest | `sessions.check_in`, `audit_logs` | 180 days (CERT-In mandate) |

---

## 2. DPDP Act & Data Principal Rights Implementation

1. **Right to Access & Data Portability:**
   - Residents and Cooks can export their account profile, session history, and invoices via authenticated endpoints (`/api/v1/invoices`, `/api/v1/auth/me`).
2. **Right to Correction & Erasure:**
   - Users may update profile details or request account deletion.
   - Deletion revokes all refresh tokens and anonymizes personal identifying information while retaining financial invoices required under statutory tax law.
3. **Data Minimization & Purpose Limitation:**
   - SocietyCook collects apartment flat numbers strictly for elevator-routing and kitchen dispatch.
   - Contact numbers are never exposed to public crawlers or third-party ad networks.
4. **Data Protection Officer (DPO) & Grievance Redressal:**
   - Designated Grievance Officer email: `grievance@societycook.in`.
   - Guaranteed response timeline within 7 business days.
