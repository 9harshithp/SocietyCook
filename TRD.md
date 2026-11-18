# Technical Requirements Document (TRD)
## SocietyCook – Architecture & Engineering Specifications
**Version:** 2.0.0  
**Stack:** React 19, Vite, Tailwind CSS, Express.js, MySQL 8.0, Socket.IO, Vitest

---

## 1. System Architecture

SocietyCook v2 is structured as a **modular monolith** with clean separation between HTTP controllers, service layer business logic, heuristic algorithm engines, and data repositories.

```
                           +---------------------------+
                           |  React 19 + Vite Frontend |
                           |  Tailwind CSS + Recharts  |
                           +-------------+-------------+
                                         |
                                (REST API + WebSockets)
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        Node.js / Express Modular Backend                          |
|                                                                                   |
|  +--------------------+  +---------------------+  +----------------------------+  |
|  | JWT & RBAC Auth    |  | Sockets & Cron Jobs |  | OpenAPI Swagger Docs       |  |
|  +--------------------+  +---------------------+  +----------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Services: GroupService, AttendanceService, PaymentService, LeaveService     |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Algorithm Engines:                                                          |  |
|  | - PricingEngine (Volume tiers & fair wage floor)                            |  |
|  | - SchedulingEngine (Greedy placement & 15-min elevator buffers)             |  |
|  | - RecommenderEngine (7-factor multi-criteria scoring)                       |  |
|  | - BackupAllocator (Automated leave standby matching)                        |  |
|  | - ForecastingEngine (Moving average capacity projection)                     |  |
|  +-----------------------------------------------------------------------------+  |
+----------------------------------------+------------------------------------------+
                                         |
                                (mysql2 Pool :3307)
                                         v
+-----------------------------------------------------------------------------------+
|                               MySQL 8.0 Relational DB                             |
|  Societies, Blocks, Users, Cooks, Groups, Members, Schedules, Sessions, Ledger     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technical Stack Specification

### Frontend
- **Framework:** React 19 + Vite 6
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4 + Dark Mode
- **State Management:** TanStack React Query v5 + Context API
- **Visualizations:** Recharts (Area charts, Bar charts)
- **Forms & Validation:** React Hook Form + Zod
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v18+)
- **Server:** Express.js 4.21 with CORS and helmet security headers
- **Database:** MySQL 8.0 with `mysql2/promise` connection pooling
- **Authentication:** Dual-token JWT (15-min Access Tokens + 7-day Refresh Token rotation)
- **Hashing:** bcryptjs (10 salt rounds)
- **Real-Time:** Socket.IO v4 (session status updates & announcements)
- **Scheduling Jobs:** node-cron (daily morning session generator, backup dispatcher)
- **API Documentation:** Swagger UI Express at `/api/v1/docs`

---

## 3. Database Integrity & Concurrency Controls
- **ACID Transactions:** Group activation, schedule entry creation, and invoice generation execute inside managed database transactions (`db.beginTransaction()`, `db.commit()`, `db.rollback()`).
- **Idempotency:** Payment simulation and session attendance check-ins are protected with idempotency guards and unique database constraints.
- **Audit Logging:** Every administrative action, status override, and leave approval is recorded in `audit_logs` with actor ID, IP address, and JSON diff payload.
