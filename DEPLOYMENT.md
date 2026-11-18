# Deployment & Operations Runbook
## SocietyCook v2 Production Setup

This guide details local orchestration via Docker Compose and production cloud hosting.

---

## 1. Quick Start with Docker Compose

SocietyCook uses configurable host port binding (`${DB_PORT:-3307}`) so it does not conflict with local host MySQL instances running on standard port 3306.

### Start Database Container
```bash
# Start MySQL 8 container in background
docker compose up -d db

# Verify health status
docker compose ps
```

---

## 2. Environment Variables Configuration

### Backend (`backend/.env`)
```ini
NODE_ENV=production
PORT=5000
DATABASE_URL=mysql://societycook:localpassword@localhost:3307/societycook
JWT_SECRET=super_secret_jwt_key_societycook_v2_prod_safe
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
CORS_ORIGIN=http://localhost:5173
DB_PORT=3307
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 3. Database Migration & Seed Instructions

### Run Non-Destructive Migrations
```bash
cd backend
node migrations.js
```
*Applies 31 tables, foreign keys, and indexes safely without dropping existing user data.*

### Populate Seed Dataset
```bash
cd backend
node seed.js
```
*Seeds 3 societies, 6 towers, 30 realistic users (Residents, Cooks, Managers, Admin), groups, schedules, and OTP codes.*

---

## 4. Starting Production Services

### Start Express Backend Server
```bash
cd backend
npm run start
# Server runs on port 5000
# Swagger API docs available at http://localhost:5000/api/v1/docs
```

### Start Vite Frontend Application
```bash
cd frontend
npm run dev -- --host
# App runs on http://localhost:5173
```

---

## 5. Health Checks & Monitoring
- **Backend Health Check:** `GET /health` -> `{"status": "ok", "version": "2.0.0"}`
- **Swagger Documentation:** `GET /api/v1/docs`
- **Database Connection Pool:** Monitored via `src/config/database.js` pool status.
