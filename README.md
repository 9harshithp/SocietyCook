# SocietyCook – Community Cook Hiring & Workforce Platform (v2.0)

> **"Hire together. Save together. Eat better."**  
> A production-grade hyperlocal domestic cooking platform enabling neighbouring households within gated residential societies to collectively hire verified cooks, receive fresh customized meals in their private kitchens, and benefit from tiered group discounts.

[![Test Suite](https://img.shields.io/badge/Vitest-19%20Passing-brightgreen.svg)](#testing)
[![Branch](https://img.shields.io/badge/Branch-feature%2Fsocietycook--v2-blue.svg)](#git-branch)
[![API Docs](https://img.shields.io/badge/Swagger-OpenAPI%203.0-orange.svg)](#api-documentation)

---

## 🌟 Core Differentiation (vs ChefKart, COOX, Cookzy, Broomees)

| Capability | SocietyCook v2 | Traditional Platforms |
| :--- | :--- | :--- |
| **Hiring Paradigm** | **Community Demand Clustering** (Flats in same tower share route) | Isolated individual booking |
| **Pricing** | **Dynamic Volume Discount** (₹4,000–₹4,500/mo) | High rate (₹7,000–₹10,000) + ₹15k brokerage |
| **Cook Commute** | **0 km (2-minute elevator transit)** | 3–4 hours stressful daily city transit |
| **Cook Monthly Earnings** | **₹20,000 – ₹28,000/mo** (Fair wage floor guaranteed) | Variable / high agency deductions |
| **Absenteeism Defense** | **Automated Backup Dispatch in &lt;1 Hr** | 24–48 hr wait or no replacement |
| **Session Verification** | **Daily 4-Digit Resident OTP** | Paper diaries / frequent disputes |
| **Society Gate Clearance** | **RWA Gate Pass (#SC-8942) + QR check-in** | Manual visitor register entries |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- Git

### 2. Clone and Checkout Feature Branch
```bash
git clone https://github.com/9harshithp/SocietyCook.git
cd SocietyCook
git checkout feature/societycook-v2
```

### 3. Start Database (Host Port 3307)
```bash
docker compose up -d db
```
*Note: Configured with `${DB_PORT:-3307}:3306` to avoid collisions with local port 3306.*

### 4. Run Migrations & Realistic Seed Dataset
```bash
cd backend
node migrations.js   # Non-destructive migrations (31 tables/extensions)
node seed.js         # Seeds 3 societies, 30 users, cooks, groups, and sessions
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
npm run dev
# Web application available at http://localhost:5173
```

---

## 🧪 Automated Testing
```bash
cd backend
npm test
```
*Runs 19 comprehensive Vitest unit and integration tests across pricing, scheduling, recommender, and full lifecycle flows.*

---

## 📚 Complete Documentation Suite
- [PRD.md](PRD.md) — Product Requirements Document (MVP to v2.0)
- [TRD.md](TRD.md) — Technical Requirements Document & Engineering Architecture
- [ARCHITECTURE.md](ARCHITECTURE.md) — Modular Monolith Architecture & Mermaid Diagrams
- [DATABASE.md](DATABASE.md) — MySQL 8.0 Schema, Relationships, and Indexes
- [API.md](API.md) — REST API Specification with Request & Response Payloads
- [ALGORITHMS.md](ALGORITHMS.md) — Transparent Mathematical & Heuristic Formulations
- [SECURITY.md](SECURITY.md) — Multi-Layer Defense, RBAC, OTP, and Audit Trails
- [TESTING.md](TESTING.md) — Test Strategy, Test Cases, and Coverage Breakdown
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production Deployment & Cloud Operations Runbook
- [CHANGELOG.md](CHANGELOG.md) — Complete v1.0 to v2.0 Version History
- [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md) — 100% Verified Task Tracking

---

## 👥 Demo Personas (1-Click Switcher)
Test all platform workflows using the top-bar persona switcher:
1. **Resident (Rahul Sharma):** Flat A-101 · Today's cooking OTP `4829`, 7-day meal planner, group savings.
2. **Cook (Ramesh Kumar):** Chef · Flat route schedule, flat OTP check-in & check-out, monthly earnings.
3. **Cook (Lakshmi Devi):** Chef · South Indian homestyle specialist, leave request desk.
4. **Society Manager:** Greenwood Heights RWA · Campus gate pass clearance, tower clusters, demand heatmaps.
5. **Platform Admin:** Superadmin · Cook KYC verification, leave & backup dispatcher, moving average forecast.
