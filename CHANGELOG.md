# Changelog
All notable changes to the **SocietyCook** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-19

### Major Architecture & Feature Upgrade (v2 Production Release)
- **New Branch:** Developed on dedicated Git branch `feature/societycook-v2`.
- **Database Architecture:**
  - Designed and executed non-destructive migration (`backend/migrations.js`) introducing 31 new relational tables and column extensions.
  - Added support for society blocks/towers, group pricing snapshots, elevator schedules, daily OTP sessions, audit logs, and refund ledgers.
- **Dynamic Community Pricing Engine:**
  - Implemented `pricingEngine.js` calculating tiered volume discounts for 1 to 8 participating households.
  - Added configurable meal multipliers, household size adjustments, and a guaranteed minimum living wage floor (₹15,000/mo) for cooks with a 10% platform fee.
- **Intelligent Route & Slot Scheduler:**
  - Implemented `scheduler.js` featuring greedy slot allocation with bounded backtracking.
  - Enforced 45-minute in-kitchen cooking windows paired with dedicated 15-minute elevator transition buffers within the same tower.
- **7-Factor Weighted Cook Recommender:**
  - Implemented `recommender.js` matching verified cooks to community groups based on Proximity (25%), Availability (25%), Cuisine (15%), Ratings (15%), Reliability (10%), Budget (5%), and Workload Balance (5%).
  - Provides explainable match breakdown percentages.
- **Automated Backup Cook Allocation:**
  - Implemented `backupAllocator.js` to eliminate service disruption during cook leaves.
  - Auto-matches certified standby cooks with valid society gate passes and zero appointment collisions.
- **Statistical Demand Forecasting:**
  - Implemented `forecasting.js` computing 4-period moving-average projections for household demand and cook recruitment requirements.
- **Dual-Token Authentication & Security:**
  - Short-lived Access Tokens (15 min) + Refresh Token rotation (7 days).
  - Role-Based Access Control (RBAC) across `RESIDENT`, `COOK`, `SOCIETY_MANAGER`, and `ADMIN`.
  - Non-repudiation audit logging for operational actions.
- **Frontend Redesign (React 19 + Tailwind v4 + Recharts):**
  - Modularized frontend with React Router DOM v7 (`BrowserRouter`, `Routes`, `Route`).
  - Added comprehensive `LandingPage` with interactive savings calculator, how-it-works progression, and comparison tables.
  - Added role-based `DashboardHub`:
    - Resident: Today's session card, dynamic OTP display, 7-day meal planner, group savings widget.
    - Cook: Flat-by-flat route schedule, OTP check-in & check-out, earnings overview, leave application.
    - Society Manager: Campus clearance pass `#SC-8942`, gate security pass list, tower cluster metrics.
    - Admin: Operations KPIs, cook verification desk, leave & backup dispatcher, demand forecasting cards.
  - Added `GroupHub` and `GroupDetailsPage` with real-time WhatsApp sharing, 1-click group activation, and member roster.
  - Added `CookDirectoryPage`, `ScheduleCalendarPage`, `BillingPage` with demo UPI payments, and `AnalyticsPage` powered by Recharts.
  - Added `TermsPage`, `PrivacyPage`, `403 Forbidden`, and `404 Not Found`.
  - Added 1-Click Demo Persona Switcher (Rahul, Ramesh, Lakshmi, Manager, Admin).
  - Added Dark Mode theme toggle.
- **Testing & Documentation:**
  - Vitest test suite with 19 passing tests covering pricing, scheduling, recommender, lifecycle, and API endpoints.
  - Generated full documentation suite: `PRD.md`, `TRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `ALGORITHMS.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`.

---

## [1.0.0] - 2026-11-18
### Initial Proof-of-Concept Release
- Initial basic prototype with single-flat booking endpoints and rudimentary HTML/JSX mockup.
