# SocietyCook Enterprise Deployment & Infrastructure Runbook

**Version:** 4.0.0  
**Target Environments:** Local Docker Compose, Staging Container Clusters, Production Cloud (Vercel CDN + Render API + TiDB Cloud MySQL).  

---

## 1. Multi-Container Orchestration (Docker Compose)

SocietyCook provides multi-container orchestration out of the box with separate unprivileged services:

```bash
# Build and run the entire stack (Database, Backend API, Frontend Web)
docker compose up -d --build

# Inspect container health status
docker compose ps
```

Services:
- **`db`:** MySQL 8.4 Server with persistent volume `dbdata` and schema init.
- **`api`:** Hardened Node.js backend running under unprivileged user `societycook` on port `5000`.
- **`web`:** High-performance Alpine Nginx server serving optimized static bundle on port `8080`.

---

## 2. Production Environment Configuration

### Required Backend Environment Variables:
```ini
NODE_ENV=production
PORT=5000
DATABASE_URL=mysql://user:password@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/societycook?ssl={"minVersion":"TLSv1.2"}
JWT_SECRET=<CRYPTOGRAPHICALLY_RANDOM_SECRET_MIN_32_CHARS>
JWT_EXPIRES_IN=2h
REFRESH_TOKEN_EXPIRES_DAYS=30
ALLOWED_ORIGINS=https://societycook.vercel.app
DEMO_PAYMENTS=false
RAZORPAY_KEY_ID=<YOUR_RAZORPAY_LIVE_KEY_ID>
RAZORPAY_KEY_SECRET=<YOUR_RAZORPAY_LIVE_KEY_SECRET>
RAZORPAY_WEBHOOK_SECRET=<YOUR_RAZORPAY_WEBHOOK_SECRET>
```

### Required Frontend Environment Variables:
```ini
VITE_API_BASE_URL=https://societycook.onrender.com/api/v1
```

---

## 3. Database Migration & Zero-Downtime Deployment
1. **Migrations:** Run `node migrations.js` in `backend/` before launching new container images. All migrations use `CREATE TABLE IF NOT EXISTS` and `safeAddCol` to guarantee zero data loss.
2. **Rolling Update:** Deploy new container images behind the reverse proxy with healthcheck verification (`/health`). Traffic is shifted only once the container reports `status: 'HEALTHY'`.
3. **Rollback Procedure:** If `/health` fails consecutive probes within 30 seconds, traffic routing reverts to previous stable container revision.
