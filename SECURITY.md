# Security Architecture & Compliance
## SocietyCook v2 Security Model

SocietyCook processes real-world residential addresses, personal identity documents, and domestic workforce credentials. The platform enforces multi-layered defense-in-depth controls.

---

## 1. Authentication & Token Lifecycle
- **Access Tokens:** Signed with HMAC-SHA256 (`JWT_SECRET`) with a short 15-minute time-to-live (TTL).
- **Refresh Tokens:** Cryptographically random 64-character tokens stored in the database with 7-day expiration and automatic rotation on reuse detection.
- **Password Protection:** bcrypt password hashing using a work factor of 10 salt rounds. Plaintext passwords are never logged or stored.

---

## 2. Role-Based Access Control (RBAC)

| Resource | Resident | Cook | Society Manager | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Own Household Bookings** | Read / Write | Read (Assigned) | - | Read / Write |
| **View Daily Session OTP** | Read (Own) | - | - | Read |
| **Check In / Check Out via OTP** | - | Write | - | Write (Override) |
| **Gate Clearance Approvals** | - | - | Read / Write | Read / Write |
| **Cook Earnings Ledger** | - | Read (Self) | - | Read / Write |
| **Platform Analytics & GMV** | - | - | Read (Society) | Read (Global) |
| **Audit Logs Inspection** | - | - | - | Read |

---

## 3. Daily Session Verification (Anti-Fraud)
- **Eliminating Phantom Attendance:** Cooks cannot mark attendance independently. They must physically arrive at the flat and input the resident's dynamic 4-digit session OTP.
- **Dispute Escalation:** If a session is marked disputed or missed, billing is placed on temporary escrow hold until resolved.

---

## 4. Society Gate Security Clearance
- Every approved cook is assigned a unique alphanumeric Gate Pass (e.g. `#SC-PASS-103`).
- Security guards at society entrance gates can verify the pass code or QR scan to confirm active daily route clearance and background check status.
- Prevents unauthorized persons from entering apartment towers under the pretext of domestic service.

---

## 5. Non-Repudiation & Audit Trails
The `audit_logs` table logs all administrative actions:
```json
{
  "actor_id": 5,
  "action": "LEAVE_BACKUP_DISPATCHED",
  "entity_type": "LEAVE",
  "entity_id": 4,
  "diff_payload": {
    "original_cook": 2,
    "assigned_backup_cook": 1,
    "affected_sessions": [101, 102, 103]
  },
  "ip_address": "127.0.0.1",
  "created_at": "2026-11-20T08:15:00.000Z"
}
```
