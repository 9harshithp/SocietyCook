# SocietyCook — Hyperlocal Shared Cook Booking Platform (MVP 1.0)

> **"Your kitchen. Your cook. Your time."**  
> A society-first hyperlocal marketplace connecting apartment complex residents with verified professional cooks who serve multiple households in the same building during predefined time slots.

---

## ✨ Features & Unique Touches

1. **Hyperlocal Society Clustering**:
   - Cooks service 5 adjacent households in the same building tower (e.g. Greenwood Residency Tower A).
   - Reduces travel lag to **2 minutes by elevator**, zero road traffic, and ensures 100% on-time arrivals.
   - Saves residents ~40% (₹4,000/mo vs ₹8,000–₹12,000 for exclusive private cooks).

2. **Wireframe-Accurate Slot Booking (PRD Section 9)**:
   - Dedicated 45-minute cooking slots with 15-minute inter-flat transition buffer.
   - Interactive time slot selector: `07:00 PM (Booked)`, `07:45 PM (Booked)`, `08:30 PM (Selected / Booked)`, `09:15 PM (Booked)`, `10:00 PM (Available)`.
   - Simulated UPI / Razorpay payment modal with instant confirmation.

3. **Guaranteed Backup Cook & Replacement Engine**:
   - Wireframe alert card: *"Cook on leave: A backup cook has been assigned. Replacement confirmed."*
   - Automated & manual backup cook dispatching from the same society pool (e.g. Sunita Sharma covering for Lakshmi Narayanan).
   - Resident 1-click emergency replacement requests.

4. **Interactive Business Revenue Calculator (PRD Section 12)**:
   - Live sliders for:
     - Households per cook (1 to 8)
     - Monthly subscription price (₹2,000 to ₹8,000)
     - Platform commission % (5% to 25%)
     - Active cooks on platform (10 to 10,000)
   - Real-time KPIs: Cook Payout (90%), Platform Revenue per Cook (10%), Monthly Platform Revenue, and Annual Gross Revenue.
   - Scaled projections table matching the PRD revenue forecasting matrix.

5. **Cook Partner Dashboard (PRD Wireframe Replica)**:
   - Monthly earnings card: **₹20,000** (5 active households × ₹4,000/mo).
   - Today's flat route schedule with 1-click **Check In** and **Check Out** timestamps.
   - Detailed resident dietary preferences and meal notes for each flat.
   - Leave application desk with zero lost wages.

6. **Weekly Menu Planner & Dietary Taste Profile (PRD P1/P2)**:
   - 7-day personalized homestyle Indian meal board (Monday to Sunday).
   - Customizable dishes (Dal Tadka, Paneer Butter Masala, Sambar, Phulkas, Theplas, Biryani).
   - Dietary switches: Spice level (Mild/Desi/High), Oil usage (Minimal/Ghee), Vegetarian / 100% Jain Friendly.
   - One-click sync to the assigned cook's daily schedule.

7. **Society Security Gate & Pass Hub (MyGate / NoBrokerHood Integration)**:
   - Digital Gate Pass & QR code generator (#SC-8942) for authorized cooks.
   - Society Tower & Flat directory tracking cook clearance and gate check-ins.
   - Police & hygiene verification badges.

8. **1-Click Demo Persona Switcher Bar**:
   - Instantly test every role from the sticky top bar:
     - `Resident (Rahul)` — Flat A-101, active ₹4,000 plan, slot booking, reviews.
     - `Cook (Ramesh)` — Master of Phulkas, ₹20,000 earnings, 5 flats in Tower A, check in/out.
     - `Cook (Lakshmi)` — South Indian pure veg specialist, approved leave with backup assigned.
     - `Society Manager` — Security gate pass, tower directory, resident roster.
     - `Platform Admin` — KYC verification, backup dispatching, dispute resolution.

---

## 🚀 Quick Setup

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- npm

### 1. Start MySQL Database
```sh
docker compose up -d
```

### 2. Backend Setup & Seeding
```sh
cd backend
npm install
node seed.js
npm run dev
```
Backend API will be running on `http://localhost:5000/api/v1`.

### 3. Frontend Setup
In a second terminal:
```sh
cd frontend
npm install
npm run dev
```
Frontend Web App will be running on `http://localhost:5173`.

---

## 🔑 Demo Accounts (All password: `Demo12345!`)

| Role | Email | Highlights |
|---|---|---|
| **Resident** | `resident@example.com` | Flat A-101, active ₹4,000 plan with Ramesh, reviews |
| **Cook** | `ramesh@example.com` | 5 active households in Tower A, ₹20k earnings, daily schedule |
| **Cook** | `cook@example.com` | Lakshmi Narayanan, South Indian specialist, leave with backup |
| **Society Manager** | `manager@example.com` | Greenwood Residency gate passes, Tower A roster |
| **Platform Admin** | `admin@example.com` | Cook verification, backup matching desk, revenue analytics |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React
- **Backend**: Node.js, Express, MySQL 8 (mysql2 connection pool), JWT, Zod
- **Database**: Dockerized MySQL 8.4
- **Design System**: Warm saffron, turmeric amber, fresh mint emerald, card glassmorphism
