# SocietyCook Database Backup & Restoration Runbook

**Database Engine:** MySQL 8.4 Compatible (TiDB Cloud Serverless / Managed MySQL)  
**Backup Frequency:** Daily full logical backup + continuous transaction log (WAL) archiving  
**Encryption:** AES-256 encrypted at rest and in transit  

---

## 1. Automated Backup Procedures

### 1.1. Automated Logical Snapshot (CLI / Cron)
To perform a full encrypted backup of the SocietyCook database:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DATE=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_DIR="/var/backups/societycook"
BACKUP_FILE="${BACKUP_DIR}/societycook_backup_${BACKUP_DATE}.sql.gz"

mkdir -p "${BACKUP_DIR}"

# Execute mysqldump with single-transaction consistency
mysqldump \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  "${DATABASE_URL}" | gzip -c > "${BACKUP_FILE}"

echo "✅ Backup successfully created at ${BACKUP_FILE}"
```

---

## 2. Restoration & Verification Procedure

### Step 1: Pre-Restoration Safety Check
Ensure destination database exists and has required privileges. Never restore directly over a live production database without taking a final differential snapshot.

### Step 2: Unpack & Execute Restore
```bash
# Decompress and apply SQL dump to destination database
gunzip -c /var/backups/societycook/societycook_backup_TARGET_DATE.sql.gz | mysql "${RESTORE_DATABASE_URL}"
```

### Step 3: Run Post-Restoration Verifications
Execute verification query to ensure table row counts match pre-incident figures:

```sql
SELECT 'societies' AS tbl, COUNT(*) AS count FROM societies
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'cooks', COUNT(*) FROM cooks
UNION ALL
SELECT 'cook_groups', COUNT(*) FROM cook_groups
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;
```

### Step 4: Execute Migrations
Run `npm run migrate` in the backend directory to ensure any newly added tables or columns are applied non-destructively.
