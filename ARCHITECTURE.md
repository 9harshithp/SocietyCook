# SocietyCook Enterprise Architecture Documentation

**Platform:** SocietyCook Hyperlocal Enterprise Platform  
**Version:** 4.0.0  
**Pattern:** Enterprise Modular Monolith with Multi-Tenant Logical Isolation  

---

## 1. System Architecture & Component Diagram

```mermaid
graph TD
    Client[Web & Mobile Clients] -->|HTTPS / TLS 1.3| Edge[Vercel CDN / WAF Edge]
    Edge -->|Strict CORS & Security Headers| Express[Express 4.x Application Engine]

    subgraph SecurityPerimeter[Enterprise Security Perimeter]
        Express --> Helmet[Helmet CSP & HSTS]
        Express --> RateLimiter[Sliding Window Rate Limiters]
        Express --> AuthGuard[JWT Verification & Role RBAC]
        AuthGuard --> TenantIsolation[Multi-Tenant Society Boundary Filter]
    end

    subgraph DomainModules[Core Domain Services]
        TenantIsolation --> GroupService[Group Hiring & Clustering]
        TenantIsolation --> AttendanceService[Attendance & Daily OTP Engine]
        TenantIsolation --> PaymentService[Billing, Ledger & Razorpay Webhooks]
        TenantIsolation --> AnalyticsService[Multi-Role Realtime Analytics]
    end

    subgraph MathematicalEngines[Deterministic Algorithms]
        GroupService --> PricingEngine[Dynamic Tier Pricing Engine]
        GroupService --> Recommender[7-Factor Cook Recommender]
        AttendanceService --> Scheduler[Elevator-Optimized Route Scheduler]
        AttendanceService --> BackupAllocator[Standby Staff Allocator]
        AnalyticsService --> DemandForecaster[Moving Average Demand Forecaster]
    end

    subgraph DataTier[Data & Persistence Layer]
        GroupService --> MySQL[(MySQL 8.4 / TiDB Cloud TLS 1.2+)]
        AttendanceService --> MySQL
        PaymentService --> MySQL
        AnalyticsService --> MySQL
        AuthGuard --> RefreshTokens[("refresh_tokens (SHA-256)")]
        Express --> AuditLogs[("audit_logs (Immutable Trail)")]
    end

    subgraph ExternalIntegrations[External Gateways]
        PaymentService --> Razorpay[Razorpay Payment Gateway API]
        Razorpay -->|HMAC-SHA256 Webhook| PaymentService
    end
```

---

## 2. Multi-Tenant Logical Separation Model
- **Tenant Boundary:** Every residential apartment society (`societies.id`) acts as an isolated tenant boundary.
- **Tenant Enforcement:**
  - Authenticated user records embed `society_id` within signed JWT claims.
  - Route handlers enforce `requireSameSocietyOrAdmin` middleware or parameterized SQL clauses `WHERE society_id = ?`.
  - Residents and cooks are strictly denied cross-tenant reads or writes.
- **Data Protection:** Financial ledgers, household rosters, apartment flat numbers, and phone numbers are never returned in public or cross-society queries.

---

## 3. Technology Stack Specification
- **Frontend:** React 19, Vite 6, Tailwind CSS 4, React Router 7, TanStack Query 5, Lucide Icons, Recharts.
- **Backend:** Node.js 20 LTS, Express 4, Socket.IO 4, Zod 4 (patched against ReDoS), Bcrypt.js, Helmet 8, Express Rate Limit 7.
- **Database:** MySQL 8.4 / TiDB Cloud Serverless, connection pooling with keep-alive, parameterized prepared statements (`execute`), ACID transaction isolation.
- **Containerization:** Multi-stage Dockerfile based on Alpine Linux executing under unprivileged user `societycook` (`UID 1001`).
