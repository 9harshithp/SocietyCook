import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  console.log('🔄 Running SocietyCook non-destructive database migrations...');

  // 0. Ensure base schema tables exist (users, cooks, bookings, payments, etc.)
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const stmt of statements) {
        await query(stmt);
      }
    }
  } catch (err) {
    console.warn('  ! Base schema initialization notice:', err.message);
  }

  const safeAddCol = async (table, column, definition) => {
    try {
      await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      console.log(`  + Added column ${column} to ${table}`);
    } catch (e) {
      const isDuplicate =
        e.errno === 1060 ||
        e.code === 'ER_DUP_FIELDNAME' ||
        (e.message && e.message.toLowerCase().includes('duplicate column'));
      if (!isDuplicate) {
        console.warn(`  ! Column warning on ${table}.${column}:`, e.message);
      }
    }
  };

  const safeAddUniqueIndex = async (table, indexName, columns) => {
    try {
      await query(`ALTER TABLE ${table} ADD UNIQUE INDEX ${indexName} (${columns})`);
      console.log(`  + Added unique index ${indexName} to ${table}`);
    } catch (e) {
      const isDuplicate =
        e.errno === 1061 ||
        e.code === 'ER_DUP_KEYNAME' ||
        (e.message && e.message.toLowerCase().includes('duplicate key name'));
      if (!isDuplicate) {
        console.warn(`  ! Index warning on ${table}.${indexName}:`, e.message);
      }
    }
  };

  // 1. Core Societies & Blocks
  await query(`
    CREATE TABLE IF NOT EXISTS societies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) DEFAULT 'Bengaluru',
      state VARCHAR(100) DEFAULT 'Karnataka',
      postal_code VARCHAR(20) DEFAULT '560066',
      total_towers INT DEFAULT 3,
      total_flats INT DEFAULT 450,
      status ENUM('PENDING', 'VERIFIED') DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await safeAddCol('societies', 'city', "VARCHAR(100) DEFAULT 'Bengaluru'");
  await safeAddCol('societies', 'state', "VARCHAR(100) DEFAULT 'Karnataka'");
  await safeAddCol('societies', 'postal_code', "VARCHAR(20) DEFAULT '560066'");
  await safeAddCol('societies', 'total_towers', 'INT DEFAULT 3');
  await safeAddCol('societies', 'total_flats', 'INT DEFAULT 450');

  await query(`
    CREATE TABLE IF NOT EXISTS society_blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      name VARCHAR(50) NOT NULL,
      floors INT DEFAULT 14,
      total_flats INT DEFAULT 150,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      UNIQUE KEY (society_id, name)
    )
  `);

  // 2. Users table extensions
  await safeAddCol('users', 'phone', 'VARCHAR(20) NULL');
  await safeAddCol('users', 'block_id', 'INT NULL');
  await safeAddCol('users', 'avatar_url', 'VARCHAR(500) NULL');
  await safeAddCol('users', 'is_verified', 'BOOLEAN DEFAULT TRUE');
  await safeAddCol('users', 'referral_code', 'VARCHAR(20) NULL');
  await safeAddCol('users', 'referred_by_id', 'INT NULL');
  await safeAddCol('users', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await safeAddCol('users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  // Society memberships
  await query(`
    CREATE TABLE IF NOT EXISTS society_memberships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      user_id INT NOT NULL,
      flat_number VARCHAR(30) NOT NULL,
      block_name VARCHAR(50) DEFAULT 'Tower A',
      status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'VERIFIED',
      verified_by INT NULL,
      verified_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY (society_id, user_id)
    )
  `);

  // 3. Cooks extensions & skills
  await safeAddCol('cooks', 'photo_url', 'VARCHAR(500) NULL');
  await safeAddCol('cooks', 'dietary_tags', 'VARCHAR(255) NULL');
  await safeAddCol('cooks', 'rating_avg', 'DECIMAL(3,1) DEFAULT 4.8');
  await safeAddCol('cooks', 'max_daily_hours', 'DECIMAL(4,1) DEFAULT 8.0');
  await safeAddCol('cooks', 'rest_period_minutes', 'INT DEFAULT 15');
  await safeAddCol('cooks', 'buffer_minutes', 'INT DEFAULT 15');
  await safeAddCol('cooks', 'weekly_holiday', "VARCHAR(20) DEFAULT 'Sunday'");
  await safeAddCol('cooks', 'reliability_score', 'DECIMAL(4,1) DEFAULT 98.5');
  await safeAddCol('cooks', 'total_ratings', 'INT DEFAULT 1');
  await safeAddCol('cooks', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await safeAddCol('cooks', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await query(`
    CREATE TABLE IF NOT EXISTS cook_society_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cook_id INT NOT NULL,
      society_id INT NOT NULL,
      status ENUM('PENDING', 'APPROVED', 'REVOKED') DEFAULT 'APPROVED',
      approved_by INT NULL,
      approved_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      UNIQUE KEY (cook_id, society_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cook_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cook_id INT NOT NULL,
      doc_type ENUM('AADHAAR', 'POLICE_VERIFICATION', 'HYGIENE_CERT', 'VACCINATION') NOT NULL,
      doc_url VARCHAR(500) NOT NULL,
      verified BOOLEAN DEFAULT TRUE,
      verified_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cook_skills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cook_id INT NOT NULL,
      skill_name VARCHAR(100) NOT NULL,
      cuisine_type VARCHAR(100) NOT NULL,
      proficiency ENUM('BEGINNER', 'INTERMEDIATE', 'EXPERT') DEFAULT 'EXPERT',
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE
    )
  `);

  // 4. Group Cook Hiring Module (Core Feature)
  await query(`
    CREATE TABLE IF NOT EXISTS cook_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      created_by_resident_id INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      description TEXT,
      meal_service ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'MULTIPLE') DEFAULT 'DINNER',
      preferred_cuisines VARCHAR(255) DEFAULT 'North Indian, South Indian',
      dietary_pref VARCHAR(100) DEFAULT 'VEGETARIAN',
      preferred_time_start TIME DEFAULT '19:00:00',
      preferred_time_end TIME DEFAULT '22:00:00',
      monthly_budget_max INT DEFAULT 4500,
      min_households INT DEFAULT 3,
      max_households INT DEFAULT 5,
      current_households INT DEFAULT 1,
      status ENUM('DRAFT', 'RECRUITING', 'THRESHOLD_REACHED', 'MATCHING', 'AWAITING_CONFIRMATION', 'ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED') DEFAULT 'RECRUITING',
      assigned_cook_id INT NULL,
      invite_code VARCHAR(32) UNIQUE,
      activated_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by_resident_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_cook_id) REFERENCES cooks(id) ON DELETE SET NULL,
      INDEX idx_group_status (society_id, status)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      resident_id INT NOT NULL,
      flat_number VARCHAR(30) NOT NULL,
      household_size INT DEFAULT 2,
      meal_requirements VARCHAR(255) DEFAULT 'Standard meal prep',
      preferred_slot_start TIME DEFAULT '19:00:00',
      dietary_notes VARCHAR(255) NULL,
      status ENUM('JOINED', 'CONFIRMED', 'LEFT') DEFAULT 'JOINED',
      confirmed_at DATETIME NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES cook_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY (group_id, resident_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_invitations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      invited_by_id INT NOT NULL,
      invite_token VARCHAR(64) UNIQUE NOT NULL,
      email_or_phone VARCHAR(100) NULL,
      status ENUM('PENDING', 'ACCEPTED', 'EXPIRED') DEFAULT 'PENDING',
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES cook_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 5. Dynamic Pricing Engine Rules & Snapshots
  await query(`
    CREATE TABLE IF NOT EXISTS group_pricing_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      min_households INT NOT NULL,
      max_households INT NOT NULL,
      base_price_per_household INT NOT NULL,
      cook_payout_per_household INT NOT NULL,
      platform_commission_pct DECIMAL(4,2) DEFAULT 10.00,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS group_price_snapshots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NOT NULL,
      household_count INT NOT NULL,
      price_per_household INT NOT NULL,
      cook_payout_total INT NOT NULL,
      platform_fee_total INT NOT NULL,
      snapshot_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES cook_groups(id) ON DELETE CASCADE
    )
  `);

  // 6. Intelligent Scheduling Engine (Schedules & Entries)
  await query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      group_id INT NULL,
      cook_id INT NOT NULL,
      society_id INT NOT NULL,
      version_number INT DEFAULT 1,
      effective_from DATE NOT NULL,
      effective_to DATE NOT NULL,
      status ENUM('DRAFT', 'PROPOSED', 'ACTIVE', 'SUPERSEDED') DEFAULT 'ACTIVE',
      algorithm_score DECIMAL(5,2) DEFAULT 95.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES cook_groups(id) ON DELETE SET NULL,
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS schedule_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      schedule_id INT NOT NULL,
      booking_id INT NULL,
      group_id INT NULL,
      resident_id INT NOT NULL,
      cook_id INT NOT NULL,
      flat_number VARCHAR(30) NOT NULL,
      block_name VARCHAR(50) DEFAULT 'Tower A',
      day_of_week VARCHAR(15) DEFAULT 'DAILY',
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      meal_type VARCHAR(50) DEFAULT 'Dinner',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE,
      INDEX idx_cook_time (cook_id, start_time, end_time)
    )
  `);

  // Bookings extensions
  await safeAddCol('bookings', 'slot_label', 'VARCHAR(50) NULL');
  await safeAddCol('bookings', 'meal_type', "VARCHAR(50) DEFAULT 'Dinner'");
  await safeAddCol('bookings', 'dietary_notes', 'VARCHAR(255) NULL');
  await safeAddCol('bookings', 'group_id', 'INT NULL');
  await safeAddCol('bookings', 'schedule_id', 'INT NULL');
  await safeAddCol('bookings', 'monthly_price', 'INT DEFAULT 4000');
  await safeAddCol('bookings', 'recurrence_type', "ENUM('DAILY_30_DAYS', 'WEEKDAYS', 'CUSTOM') DEFAULT 'DAILY_30_DAYS'");
  await safeAddCol('bookings', 'confirmation_code', 'VARCHAR(10) NULL');
  await safeAddCol('bookings', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await safeAddCol('bookings', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  // Sessions extensions
  await safeAddCol('sessions', 'scheduled_start_time', 'TIME NULL');
  await safeAddCol('sessions', 'scheduled_end_time', 'TIME NULL');
  await safeAddCol('sessions', 'flat_number', 'VARCHAR(30) NULL');
  await safeAddCol('sessions', 'otp_code', "VARCHAR(6) DEFAULT '4892'");
  await safeAddCol('sessions', 'otp_verified', 'BOOLEAN DEFAULT FALSE');
  await safeAddCol('sessions', 'otp_attempts', 'INT DEFAULT 0');
  await safeAddCol('sessions', 'late_minutes', 'INT DEFAULT 0');
  await safeAddCol('sessions', 'resident_confirmed', 'BOOLEAN DEFAULT FALSE');
  await safeAddCol('sessions', 'dispute_reason', 'VARCHAR(255) NULL');
  await safeAddCol('sessions', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  // Subscriptions & Payments
  await query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      group_id INT NULL,
      resident_id INT NOT NULL,
      society_id INT NOT NULL,
      monthly_amount INT NOT NULL,
      status ENUM('PENDING', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
      current_period_start DATE NOT NULL,
      current_period_end DATE NOT NULL,
      renewal_reminded BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES cook_groups(id) ON DELETE SET NULL,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE
    )
  `);

  await safeAddCol('payments', 'subscription_id', 'INT NULL');
  await safeAddCol('payments', 'group_id', 'INT NULL');
  await safeAddCol('payments', 'user_id', 'INT NULL');
  await safeAddCol('payments', 'currency', "VARCHAR(5) DEFAULT 'INR'");
  await safeAddCol('payments', 'gateway', "ENUM('RAZORPAY', 'DEMO_SIMULATED') DEFAULT 'DEMO_SIMULATED'");
  await safeAddCol('payments', 'signature', 'VARCHAR(255) NULL');
  await safeAddCol('payments', 'webhook_event_id', 'VARCHAR(100) NULL');
  await safeAddCol('payments', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_id INT NOT NULL,
      booking_id INT NOT NULL,
      resident_id INT NOT NULL,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      subtotal INT NOT NULL,
      tax_amount INT DEFAULT 0,
      total_amount INT NOT NULL,
      invoice_pdf_url VARCHAR(500) NULL,
      issued_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS earnings_ledger (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cook_id INT NOT NULL,
      session_id INT NULL,
      booking_id INT NULL,
      gross_amount INT NOT NULL,
      platform_commission INT NOT NULL,
      net_cook_earning INT NOT NULL,
      status ENUM('ACCRUED', 'PAID_OUT', 'DISPUTED') DEFAULT 'ACCRUED',
      payout_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE,
      INDEX idx_cook_earnings (cook_id, status)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cook_id INT NOT NULL,
      amount INT NOT NULL,
      reference_number VARCHAR(100) UNIQUE NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'COMPLETED',
      processed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE CASCADE
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_id INT NOT NULL,
      booking_id INT NOT NULL,
      resident_id INT NOT NULL,
      amount INT NOT NULL,
      reason VARCHAR(255) NOT NULL,
      status ENUM('PENDING', 'COMPLETED') DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Leaves & Replacements
  await safeAddCol('leaves', 'leave_type', "ENUM('PLANNED', 'EMERGENCY') DEFAULT 'PLANNED'");
  await safeAddCol('leaves', 'reviewed_by', 'INT NULL');
  await safeAddCol('leaves', 'reviewed_at', 'DATETIME NULL');
  await safeAddCol('leaves', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await safeAddCol('replacements', 'orig_cook_id', 'INT NULL');
  await safeAddCol('replacements', 'backup_cook_id', 'INT NULL');
  await safeAddCol('replacements', 'assigned_by_type', "ENUM('ALGORITHM_AUTO', 'ADMIN_OVERRIDE') DEFAULT 'ALGORITHM_AUTO'");
  await safeAddCol('replacements', 'notes', 'VARCHAR(255) NULL');
  await safeAddCol('replacements', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await safeAddCol('replacements', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  // Reviews extensions
  await safeAddCol('reviews', 'cook_id', 'INT NULL');
  await safeAddCol('reviews', 'resident_id', 'INT NULL');
  await safeAddCol('reviews', 'punctuality_rating', 'INT DEFAULT 5');
  await safeAddCol('reviews', 'hygiene_rating', 'INT DEFAULT 5');
  await safeAddCol('reviews', 'taste_rating', 'INT DEFAULT 5');
  await safeAddCol('reviews', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  // Referrals
  await query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      referrer_id INT NOT NULL,
      referee_id INT NOT NULL,
      referral_code VARCHAR(20) NOT NULL,
      reward_amount INT DEFAULT 500,
      status ENUM('PENDING', 'QUALIFIED', 'REWARDED') DEFAULT 'REWARDED',
      rewarded_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY (referee_id)
    )
  `);

  // Complaints & Service Disputes
  await query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      resident_id INT NOT NULL,
      cook_id INT NULL,
      session_id INT NULL,
      category ENUM('ABSENTEEISM', 'HYGIENE', 'TASTE', 'TIMING', 'BEHAVIOR', 'OTHER') DEFAULT 'TIMING',
      description TEXT NOT NULL,
      status ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
      resolution_notes TEXT NULL,
      resolved_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (cook_id) REFERENCES cooks(id) ON DELETE SET NULL
    )
  `);

  // Security: Refresh Tokens & Audit Logs
  await query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_token_user (user_id, revoked)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id INT NULL,
      ip_address VARCHAR(45) NULL,
      user_agent VARCHAR(255) NULL,
      payload_diff TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_action (action, created_at)
    )
  `);

  // Notifications extensions
  await safeAddCol('notifications', 'title', 'VARCHAR(150) NULL');
  await safeAddCol('notifications', 'type', "VARCHAR(50) DEFAULT 'GENERAL'");
  await safeAddCol('notifications', 'is_read', 'BOOLEAN DEFAULT FALSE');
  await safeAddCol('notifications', 'read_at', 'DATETIME NULL');
  await safeAddCol('notifications', 'link_url', 'VARCHAR(255) NULL');

  // =========================================================================
  // V3 EXTENSION: Household Services & Dishwashing Marketplace
  // =========================================================================
  console.log('🔄 Running SocietyCook v3 Household Services & Dishwashing Migrations...');

  await query(`
    CREATE TABLE IF NOT EXISTS service_categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      tagline VARCHAR(200) NOT NULL,
      base_price INT NOT NULL,
      standard_duration_minutes INT DEFAULT 45,
      description TEXT NULL,
      icon_name VARCHAR(50) DEFAULT 'ChefHat',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert standard service categories
  await query(`
    INSERT INTO service_categories (id, name, tagline, base_price, standard_duration_minutes, description, icon_name)
    VALUES
      ('COOKING', 'Professional Home Cooking', 'Fresh, customized daily meals cooked in your kitchen', 5000, 45, 'Dedicated chef visits daily to prepare breakfast, lunch, or dinner tailored to your spice, dietary and cuisine preferences.', 'ChefHat'),
      ('DISHWASHING', 'Utensil Washing & Kitchen Care', 'Sparkling clean dishes and spotless countertops every day', 2200, 30, 'Professional dishwashing assistant washes and dries all utensils, pots, thalis and wipes kitchen counters on a recurring daily schedule.', 'Sparkles'),
      ('COMBO', 'Complete Kitchen Care (Cooking + Dishwashing)', 'Delicious hot meals plus sparkling clean dishes in one coordinated plan', 6800, 75, 'Coordinated daily cooking followed by complete utensil cleaning and kitchen tidying with consolidated billing and zero hassle.', 'UtensilsCrossed')
    ON DUPLICATE KEY UPDATE name=VALUES(name), tagline=VALUES(tagline), base_price=VALUES(base_price)
  `);

  // Professional type extensions on cooks table (now service professionals)
  await safeAddCol('cooks', 'professional_type', "VARCHAR(50) DEFAULT 'COOK'");
  await safeAddCol('cooks', 'services_offered', "VARCHAR(255) DEFAULT 'COOKING'");
  await safeAddCol('cooks', 'utensil_capacity_tier', "VARCHAR(50) DEFAULT 'STANDARD'");
  await safeAddCol('cooks', 'dishwashing_price', "INT DEFAULT 2200");
  await safeAddCol('cooks', 'dishwashing_experience', "INT DEFAULT 4");
  await safeAddCol('cooks', 'dishwashing_bio', "TEXT NULL");

  // Bookings extensions for dishwashing & combo
  await safeAddCol('bookings', 'service_type', "VARCHAR(50) DEFAULT 'COOKING'");
  await safeAddCol('bookings', 'utensil_load', "VARCHAR(50) DEFAULT 'STANDARD'");
  await safeAddCol('bookings', 'dishwasher_id', "INT NULL");
  await safeAddCol('bookings', 'dishwashing_slot_label', "VARCHAR(50) NULL");
  await safeAddCol('bookings', 'dishwashing_amount', "INT DEFAULT 0");

  // Groups extensions
  await safeAddCol('cook_groups', 'service_type', "VARCHAR(50) DEFAULT 'COOKING'");
  await safeAddCol('cook_groups', 'assigned_dishwasher_id', "INT NULL");
  await safeAddCol('cook_groups', 'utensil_load', "VARCHAR(50) DEFAULT 'STANDARD'");

  // Sessions extensions
  await safeAddCol('sessions', 'service_type', "VARCHAR(50) DEFAULT 'COOKING'");
  await safeAddCol('sessions', 'utensil_load', "VARCHAR(50) NULL");

  // Phase 3: Razorpay Payment Gateway Integration & Financial Reconciliation
  await safeAddCol('payments', 'amount_paise', 'INT NULL');
  await safeAddCol('payments', 'amount_refunded', 'INT DEFAULT 0');
  await safeAddCol('payments', 'razorpay_order_id', 'VARCHAR(100) NULL');
  await safeAddCol('payments', 'razorpay_payment_id', 'VARCHAR(100) NULL');
  await safeAddCol('payments', 'gateway_fee', 'INT DEFAULT 0');
  await safeAddCol('payments', 'gateway_tax', 'INT DEFAULT 0');
  await safeAddCol('refunds', 'gateway_refund_id', 'VARCHAR(100) NULL');
  await safeAddCol('refunds', 'created_by', 'INT NULL');
  await safeAddCol('bookings', 'activated_at', 'DATETIME NULL');

  // Expand payments status ENUM to support refunds and partial refunds
  try {
    await query("ALTER TABLE payments MODIFY COLUMN status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED') DEFAULT 'PENDING'");
  } catch (e) {
    console.warn('  ! Payment status enum modification warning:', e.message);
  }

  // Expand sessions status ENUM to support CANCELLED
  try {
    await query("ALTER TABLE sessions MODIFY COLUMN status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED') DEFAULT 'SCHEDULED'");
  } catch (e) {
    console.warn('  ! Session status enum modification warning:', e.message);
  }

  // Webhook events table for idempotent gateway event tracking
  await query(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id VARCHAR(100) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      resource_id VARCHAR(100) NULL,
      payload JSON NULL,
      processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_webhook_event_id (event_id)
    )
  `);

  // Gateway unique indexes for financial idempotency
  await safeAddUniqueIndex('payments', 'uk_payments_razorpay_payment_id', 'razorpay_payment_id');
  await safeAddUniqueIndex('refunds', 'uk_refunds_gateway_refund_id', 'gateway_refund_id');

  console.log('✅ SocietyCook v3 Household Services database migrations completed successfully!');
  console.log('✅ SocietyCook database migrations finished successfully!');
}

if (process.argv[1]?.endsWith('migrations.js')) {
  runMigrations()
    .then(async () => {
      try { await db.end(); } catch (e) {}
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
