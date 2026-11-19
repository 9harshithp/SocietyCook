# SocietyCook – Premium Household Services Marketplace (v3.0)

> **"More living. Less chores."**  
> *A happier home. A simpler everyday.*  
> A production-grade hyperlocal household services platform enabling neighbouring households within gated residential societies to collectively hire verified home cooks, dishwashing specialists, and complete kitchen care — scheduled seamlessly in their own homes.

[![Test Suite](https://img.shields.io/badge/Vitest-21%20Passing-brightgreen.svg)](#automated-testing)
[![Branch](https://img.shields.io/badge/Branch-feature%2Fsocietycook--v3-blue.svg)](#git-branch)
[![API Docs](https://img.shields.io/badge/Swagger-OpenAPI%203.0-orange.svg)](#api-documentation)

---

## 🌟 Expanded Household Services

SocietyCook v3.0 expands beyond cook booking into an intelligent, community-first household services marketplace:

1. **Professional Home Cooking (`COOKING`)** — Daily customized meals cooked fresh in resident kitchens with personalized spice, oil, and dietary controls.
2. **Utensil Care & Dishwashing (`DISHWASHING`)** — Dedicated utensil scrubbing, pressure cooker / heavy kadhai scouring, and pristine sink & counter hygiene.
3. **Complete Kitchen Care (`COMBO`)** — Synchronized back-to-back routine where the cook prepares the meal and the utensil specialist washes the cookware and dinner plates immediately after.

---

## 🌟 Core Differentiation (vs ChefKart, COOX, Cookzy, Broomees)

| Capability | SocietyCook v3 | Traditional Platforms |
| :--- | :--- | :--- |
| **Hiring Paradigm** | **Community Demand Clustering** (Flats in same tower share route) | Isolated individual booking |
| **Service Scope** | **Cooking + Utensil Care + Synchronized Combo** | Cooking only or fragmented maids |
| **Pricing** | **Dynamic Volume Discount** (Up to 35% community savings) | High solo rates + ₹15k brokerage |
| **Staff Commute** | **0 km (1-minute elevator transit)** | 3–4 hours stressful daily city transit |
| **Staff Monthly Earnings**| **₹20,000 – ₹35,000/mo** (Fair wage floors guaranteed) | Variable / high agency cuts |
| **Absenteeism Defense** | **Automated Standby Allocation in &lt;1 Hr** | 24–48 hr wait or no replacement |
| **Session Verification** | **Daily 4-Digit Resident OTP** | Paper diaries / frequent disputes |
| **Society Gate Clearance**| **RWA Gate Pass (#SC-8942) + RFID / App Check-in** | Manual visitor register entries |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Git

### 2. Clone and Checkout V3 Feature Branch
```bash
git clone https://github.com/9harshithp/SocietyCook.git
cd SocietyCook
git checkout feature/societycook-v3
```

### 3. Start Database (Host Port 3307)
```bash
docker compose up -d db
```
*Note: Configured with `${DB_PORT:-3307}:3306` to avoid collisions with local port 3306.*

### 4. Run Migrations & Realistic Seed Dataset
```bash
cd backend
node migrations.js   # Non-destructive migrations (household services & columns)
node seed.js         # Seeds societies, cooks, dishwashers, combo groups, and sessions
```

### 5. Start Backend Server
```bash
cd backend
npm run start
# Server listens on http://localhost:5000
# OpenAPI Docs available at http://localhost:5000/api/v1/docs
```

### 6. Start Frontend Web Client
```bash
cd frontend
npm install
npm run dev
# Web application available at http://localhost:5173
```

---

## 🧪 Automated Testing
```bash
cd backend
npm test
```
*Executes 21 passing Vitest unit and integration tests covering dynamic pricing engine (Cooking, Dishwashing, Combo), intelligent scheduling, weighted recommender, and full booking lifecycles.*

---

## 📚 Complete Documentation Suite
- [PRD.md](PRD.md) — Product Requirements Document (MVP to v3.0)
- [TRD.md](TRD.md) — Technical Requirements Document & Engineering Architecture
- [ARCHITECTURE.md](ARCHITECTURE.md) — Modular Monolith Architecture & System Design
- [DATABASE.md](DATABASE.md) — MySQL 8.0 Schema, Relationships, and Indexes
- [API.md](API.md) — REST API Specification with Request & Response Payloads
- [ALGORITHMS.md](ALGORITHMS.md) — Transparent Mathematical & Heuristic Formulations
- [SECURITY.md](SECURITY.md) — Multi-Layer Defense, RBAC, OTP, and Audit Trails
- [TESTING.md](TESTING.md) — Test Strategy, Test Cases, and Coverage Breakdown
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production Deployment & Cloud Operations Runbook
- [CHANGELOG.md](CHANGELOG.md) — Complete v1.0 to v3.0 Version History
- [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) — 100% Verified Milestone Tracking

---

## 👥 Demo Personas (1-Click Switcher)
Test all platform workflows using the top-bar persona switcher:
1. **Resident (Rahul Sharma):** Flat A-101 · Today's session OTP `4829`, 7-day meal planner, group savings.
2. **Cook (Ramesh Kumar):** Multi-skilled chef · Flat route schedule, flat OTP check-in & check-out, monthly earnings.
3. **Cook (Lakshmi Devi):** Chef · South Indian homestyle specialist, leave request desk.
4. **Society Manager:** Greenwood Heights RWA · Campus gate pass clearance, tower clusters, demand heatmaps.
5. **Platform Admin:** Superadmin · Cook KYC verification, leave & backup dispatcher, moving average forecast.
