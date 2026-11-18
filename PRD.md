# Product Requirements Document (PRD)
## SocietyCook – Community Cook Hiring & Workforce Management Platform
**Version:** 2.0.0 (Production Release)  
**Status:** Approved & Implemented  
**Tagline:** *Hire together. Save together. Eat better.*

---

## 1. Executive Summary & Value Proposition
SocietyCook is a community-first hyperlocal domestic cooking platform operating within gated residential apartment societies across urban India.

Unlike conventional gig or maid-placement platforms (ChefKart, COOX, Cookzy, Broomees) that treat cook hiring as isolated, high-brokerage individual appointments with unpredictable absenteeism, SocietyCook aggregates household demand at the tower and society level.

Multiple neighbouring households collectively hire verified professional cooks who prepare customized daily meals in individual kitchens. By concentrating appointments within the same tower and eliminating inter-society transit, SocietyCook enables:
1. **Residents:** Up to 35% lower monthly costs through community demand tiers with 100% service continuity backed by automated backup cook dispatch.
2. **Professional Cooks:** Predictable monthly income (₹20,000–₹28,000/mo) with zero travel time between flats, fair compensation floors, and direct bank payouts.
3. **Societies / RWAs:** Reduced security gate congestion, centralized gate clearance passes, and verified service personnel records.

---

## 2. Problem Statement
### For Residents
- **Unreliable Attendance:** Sudden absenteeism and leaves without replacement.
- **Inflated Costs:** Individual cook hiring costs ₹5,000–₹8,000/month plus hefty upfront brokerages.
- **Variable Quality & Hygiene:** Lack of standardized hygiene, cuisine proficiency, and accountability.
- **Coordination Friction:** Inability to easily coordinate shared schedules with neighbours.

### For Domestic Cooks
- **Unstable & Fragmented Income:** Erratic monthly earnings and non-payment risks.
- **Exhausting Transit:** Traveling across distant housing societies eats up 3–4 hours daily.
- **Unregulated Exploitation:** Deductions for sickness and leaves with zero safety net.

### For Residential Societies (RWAs & Gate Security)
- **High Gate Traffic:** Hundreds of unstructured daily vendor visits creating security vulnerabilities.
- **Unverified Backgrounds:** Lack of digital identity check and police clearance visibility.

---

## 3. Product Personas & Core Journeys

| Persona | Role | Primary Objective |
| :--- | :--- | :--- |
| **Rahul Sharma** | Resident | Enjoys daily fresh home cooking in his kitchen at ₹4,000/mo with daily OTP attendance validation. |
| **Chef Ramesh Kumar** | Professional Cook | Serves 5 flats inside Tower A, earning ₹24,500/mo with 0 km daily commute between appointments. |
| **Greenwood Heights RWA** | Society Manager | Approves gate clearances, monitors campus cook entries, and views tower demand heatmaps. |
| **Operations Team** | Platform Admin | Dispatches automated backup cooks on leave requests and monitors statistical demand forecasts. |

---

## 4. Key Functional Requirements (P0 – Launch Scope)

### P0.1: Hyperlocal Society & Tower Onboarding
- Multi-tier residency model: Society -> Block / Tower -> Flat Number.
- Gate clearance pass issuance (`#SC-8942`) with QR scan support.

### P0.2: Community Cook-Hiring Groups
- Residents create or discover cook-sharing clusters.
- Configurable parameters: Meal service (Breakfast, Lunch, Dinner, Multiple), cuisine preferences, dietary requirements (Veg, Jain, Non-Veg), preferred time windows, budget per household, and min/max household thresholds.
- Group Lifecycle State Machine:
  `DRAFT` -> `RECRUITING` -> `THRESHOLD_REACHED` -> `MATCHING` -> `AWAITING_CONFIRMATION` -> `ACTIVE` -> `PAUSED` -> `CANCELLED` -> `COMPLETED`.

### P0.3: Dynamic Group Pricing Engine
- Transparent tiered volume discounts (1 to 8 households).
- Meal multipliers (Breakfast 0.70x, Lunch 0.95x, Dinner 1.00x, Multiple 1.70x).
- Household size scaling (1–2 persons: 1.0x, 3–4 persons: 1.15x, 5+ persons: 1.30x).
- Minimum Fair Living Wage floor: Guaranteed ₹15,000+ base compensation for active clusters.
- Platform commission: 10% transparent platform fee.

### P0.4: Intelligent Route & Time Slot Scheduling
- 45-minute cooking appointment windows + 15-minute elevator transition buffers.
- Hard constraints: Non-overlapping slots, cook daily working hour caps, and leave exclusion.
- Soft optimization: Minimizes elevator inter-floor travel and idle waiting gaps.

### P0.5: Smart Cook Recommendation Engine
- 7-factor weighted multi-criteria heuristic scoring:
  1. Society Proximity & Gate Clearance (25%)
  2. Availability Window Match (25%)
  3. Cuisine & Dietary Compatibility (15%)
  4. Client Reviews & Rating (15%)
  5. Punctuality & Reliability Score (10%)
  6. Household Budget Alignment (5%)
  7. Workload Balancing (5%)
- Transparent, explainable matching breakdown for residents.

### P0.6: Daily OTP Attendance & Verification
- Resident dashboard generates a secure 4-digit session OTP code.
- Cook checks in and checks out via OTP code, guaranteeing transparent service delivery without manual diary disputes.

### P0.7: Automated Backup Cook Allocation
- Automated replacement dispatch on cook leave application.
- Collision detection checks existing appointments and schedules authorized society standbys in &lt;1 hour.

### P0.8: Real-Time Community Analytics & Forecasting
- Real-world database queries for GMV, active groups, and commission margins.
- Recharts-powered hourly demand heatmaps and capacity bottleneck detection.
- Statistical moving-average demand forecasting for proactive cook recruitment.
