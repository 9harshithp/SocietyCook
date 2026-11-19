# Changelog
All notable changes to the **SocietyCook** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-11-19

### Premium Redesign & Household Services Expansion (v3.0 Release)
- **New Branch:** Developed on dedicated Git branch `feature/societycook-v3`.
- **Brand Identity & Creative Direction:**
  - Taglines: Primary: **More living. Less chores.** | Supporting: **A happier home. A simpler everyday.**
  - Palette: Deep Forest Green (`#153D32`), Warm Terracotta (`#E9A15B`), Warm Cream (`#FBF7EF`), Soft Sage (`#DDE9D8`), Charcoal (`#202A25`), White (`#FFFFFF`), Muted Gray-Green (`#64746B`).
  - Typography: Editorial serif headings with `Playfair Display` paired with `Plus Jakarta Sans` for functional UI and body text.
- **Household Services Expansion:**
  - Database support for 3 distinct initial service categories:
    1. `COOKING`: Professional Home Cooking (fresh custom meals in private kitchens)
    2. `DISHWASHING`: Utensil Care & Dishwashing (spotless vessels, pressure cookers, sink & counter hygiene)
    3. `COMBO`: Complete Kitchen Care (synchronized cooking followed immediately by utensil washing)
  - Non-destructive database migrations (`backend/migrations.js`):
    - Added `service_categories` table with extensible category flags.
    - Added `professional_type` (`COOK`, `DISHWASHER`, `MULTI_SKILLED`), `utensil_capacity_tier`, `dishwashing_price` to `cooks` table.
    - Added `service_type`, `utensil_load`, `dishwasher_id`, `dishwashing_slot_label`, and `dishwashing_amount` to `bookings`, `cook_groups`, and `sessions`.
- **Dynamic Pricing Engine Expansion:**
  - Added `DISHWASHING_VOLUME_TIERS` (₹2,200 down to ₹1,500/mo) and `COMBO_VOLUME_TIERS` (₹6,500 down to ₹4,600/mo).
  - Added `UTENSIL_LOAD_MULTIPLIERS` (`LIGHT`: 0.9, `STANDARD`: 1.0, `HEAVY`: 1.25).
  - Coordinated compensation split for combo care (65% primary cook / 35% dishwasher) with guaranteed income floors.
  - Vitest test suite expanded to 21 passing tests covering all service algorithms.
- **Redesigned Public Landing Page (`LandingPage.jsx`):**
  - Section A: Refined brand navbar with services dropdown, anchor links, theme toggle, and 1-click persona switcher.
  - Section B: Cinematic asymmetrical hero section with high-res warm kitchen photography, floating trust badges, and interactive Service Finder bar.
  - Section C: Trust and value proposition strip highlighting society clusters, up to 35% savings, 100% verified staff, zero commute gaps, and backup continuity.
  - Section D: Signature Service Showcase featuring 3 editorial cards with authentic local photography.
  - Section E: Lifestyle storytelling section ("Spend your evenings on what actually matters").
  - Section F: Community-first tower visualizer showing elevator-synchronized visits between flats.
  - Section G: Interactive Community Savings Calculator supporting Cooking, Utensil Care, and Combo care with real-time breakdowns.
  - Section H: 4-step friction-free onboarding timeline.
  - Section I: Sample daily tower routine with tabbed schedule previews.
  - Section J: Meet Your Professionals card grid with real API data and credentials.
  - Section K: Workforce dignity and empowerment benefits.
  - Section L: Residential Society Partnerships (RWA) with interactive demo request dialog.
  - Section M: Animated accessible FAQ accordion.
  - Section N: Full-width conversion banner with serene home photography.
  - Section O: Comprehensive editorial footer.
- **Frontend Hub & Dashboard Enhancements:**
  - `CookDirectoryPage`: Added service category filters (`ALL`, `COOK`, `DISHWASHER`, `MULTI_SKILLED`) and utensil load indicators.
  - `GroupHub`: Added service category filtering, service badges on cards, and updated creation form for dishwashing & combo clusters.
  - `DashboardHub`: Added multi-service support for daily appointments showing cook and dishwasher windows side by side with shared OTP.
- **High-Resolution Local Photographic Assets:**
  - Downloaded and curated 7 high-resolution local assets stored in `frontend/public/images/`.

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
- **Testing & QA Verification:**
  - Vitest test suite with 19 passing tests covering pricing, scheduling, recommender, lifecycle, and API endpoints.
  - Comprehensive automated browser test suite (Puppeteer + Headless Chrome) verifying 7 critical workflows with 100% pass rate.
  - Generated full documentation suite: `PRD.md`, `TRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `ALGORITHMS.md`, `SECURITY.md`, `TESTING.md`, `DEPLOYMENT.md`, `CHANGELOG.md`.

### Bug Fixes & QA Hardening (Verified in v2.0.0)
- **Theme Switching:** Added `@custom-variant dark` in `style.css` and reactive `isDarkMode` state syncing in `AuthContext.jsx` to enable seamless class-based dark mode switching in Tailwind CSS v4.
- **Navbar Responsive Layout:** Added `whitespace-nowrap`, fixed `h-7`, `shrink-0`, and identical 1px borders to prevent role switcher button text-wrapping and height jitter across viewports.
- **Root Health Route:** Added root `GET /health` endpoint in `backend/server.js` alongside `/api/v1/health` responding with service status and uptime.
- **API Parameter Normalization:**
  - Fixed `/auth/register` to support both `societyId` and `society_id`, `flat` and `flat_number`.
  - Fixed `/groups` creation and `/groups/:id/join` to seamlessly accept both snake_case and camelCase payload fields.
  - Fixed `/sessions/:id/attendance` to normalize action strings (`check_in`, `CHECK_IN`, `in`).
  - Fixed `/leaves` and `/reviews` Zod validation schemas for dual-format compatibility.
- **Attendance Query Fix:** Resolved SQL error `Unknown column 'c.phone'` in `AttendanceService.getSessions` by selecting `cu.phone` from the joined `users` table.
- **Invoicing API & Download:** Added `GET /api/v1/invoices` backend route returning reconciled invoices and connected `BillingPage` to download official tax receipts.
- **Dynamic Dashboards:** Replaced hardcoded static appointment and KPI data in `DashboardHub`, `ScheduleCalendarPage`, `BillingPage`, and `AnalyticsPage` with live database analytics and query feeds.

---

## [1.0.0] - 2026-11-18
### Initial Proof-of-Concept Release
- Initial basic prototype with single-flat booking endpoints and rudimentary HTML/JSX mockup.
