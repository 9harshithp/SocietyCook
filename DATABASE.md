# Database Architecture & Schema Reference
## SocietyCook Enterprise Schema (MySQL 8.0 / TiDB Cloud)

The SocietyCook database enforces strict relational integrity, UTF8MB4 collation, cascading foreign key constraints, ACID transaction safety, and optimized indexing for geographical clustering and elevator-synchronized route scheduling.

---

## 🗺️ Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    %% ==========================================
    %% 1. IDENTITY & GATED SOCIETIES
    %% ==========================================
    SOCIETIES ||--o{ SOCIETY_BLOCKS : "towers/wings"
    SOCIETIES ||--o{ SOCIETY_MEMBERSHIPS : "enrolled residents"
    SOCIETIES ||--o{ USERS : "resides"
    SOCIETIES ||--o{ COOK_SOCIETY_ASSIGNMENTS : "approved staff"
    SOCIETIES ||--o{ COOK_GROUPS : "hosts clusters"
    SOCIETIES ||--o{ GROUP_PRICING_RULES : "configures pricing"
    SOCIETIES ||--o{ SCHEDULES : "manages calendar"
    SOCIETIES ||--o{ SUBSCRIPTIONS : "service contracts"
    SOCIETIES ||--o{ COMPLAINTS : "logs disputes"

    USERS ||--o{ SOCIETY_MEMBERSHIPS : "holds membership"
    USERS ||--o| COOKS : "pro profile"
    USERS ||--o{ COOK_GROUPS : "creates group"
    USERS ||--o{ GROUP_MEMBERS : "joins group"
    USERS ||--o{ GROUP_INVITATIONS : "invites neighbor"
    USERS ||--o{ BOOKINGS : "books service"
    USERS ||--o{ SCHEDULE_ENTRIES : "scheduled slot"
    USERS ||--o{ SUBSCRIPTIONS : "subscriber"
    USERS ||--o{ INVOICES : "billed resident"
    USERS ||--o{ REFUNDS : "refund recipient"
    USERS ||--o{ REFERRALS : "referrer/referee"
    USERS ||--o{ REFRESH_TOKENS : "session tokens"
    USERS ||--o{ NOTIFICATIONS : "inbox alerts"
    USERS ||--o{ COMPLAINTS : "files grievance"

    %% ==========================================
    %% 2. PROFESSIONALS & SERVICE CAPABILITIES
    %% ==========================================
    COOKS ||--o{ COOK_DOCUMENTS : "kyc documents"
    COOKS ||--o{ COOK_SKILLS : "cuisines/proficiencies"
    COOKS ||--o{ COOK_SOCIETY_ASSIGNMENTS : "society clearance"
    COOKS ||--o{ COOK_GROUPS : "assigned chef"
    COOKS ||--o{ BOOKINGS : "assigned pro"
    COOKS ||--o{ SCHEDULES : "daily schedule"
    COOKS ||--o{ SCHEDULE_ENTRIES : "slot assignment"
    COOKS ||--o{ SESSIONS : "conducts session"
    COOKS ||--o{ LEAVES : "submits leave"
    COOKS ||--o{ EARNINGS_LEDGER : "accrues earnings"
    COOKS ||--o{ PAYOUTS : "settlement payout"

    %% ==========================================
    %% 3. COMMUNITY CLUSTERING & ROUTE SCHEDULING
    %% ==========================================
    COOK_GROUPS ||--o{ GROUP_MEMBERS : "households"
    COOK_GROUPS ||--o{ GROUP_INVITATIONS : "tokens"
    COOK_GROUPS ||--o{ GROUP_PRICE_SNAPSHOTS : "snapshots"
    COOK_GROUPS ||--o{ SCHEDULES : "group schedule"
    COOK_GROUPS ||--o{ SUBSCRIPTIONS : "group tier"

    SCHEDULES ||--o{ SCHEDULE_ENTRIES : "time blocks"

    %% ==========================================
    %% 4. BOOKINGS, SESSIONS & REPLACEMENTS
    %% ==========================================
    BOOKINGS ||--o{ SESSIONS : "daily sessions"
    BOOKINGS ||--o{ SUBSCRIPTIONS : "recurring billing"
    BOOKINGS ||--o{ PAYMENTS : "transactions"
    BOOKINGS ||--o{ INVOICES : "tax invoices"
    BOOKINGS ||--o{ REFUNDS : "refund claims"
    BOOKINGS ||--o| REVIEWS : "service rating"

    SESSIONS ||--o| REPLACEMENTS : "standby backup"

    %% ==========================================
    %% 5. PAYMENTS, RECONCILIATION & REFUNDS
    %% ==========================================
    PAYMENTS ||--o{ INVOICES : "receipt"
    PAYMENTS ||--o{ REFUNDS : "gateway refund"

    %% ==========================================
    %% ENTITY DEFINITIONS & SCHEMAS
    %% ==========================================
    SOCIETIES {
        int id PK
        string name
        string address
        string city
        string state
        string postal_code
        int total_towers
        int total_flats
        string status
    }

    SOCIETY_BLOCKS {
        int id PK
        int society_id FK
        string name
        int floors
        int total_flats
    }

    SOCIETY_MEMBERSHIPS {
        int id PK
        int society_id FK
        int user_id FK
        string flat_number
        string block_name
        string status
        int verified_by
        datetime verified_at
    }

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        int society_id FK
        string flat
        string phone
        int block_id
        boolean is_verified
        string referral_code
    }

    COOKS {
        int id PK
        int user_id FK "UK"
        string cuisine
        string professional_type
        string services_offered
        int price
        int dishwashing_price
        int experience
        boolean verified
        decimal rating_avg
        decimal reliability_score
    }

    COOK_DOCUMENTS {
        int id PK
        int cook_id FK
        string doc_type
        string doc_url
        boolean verified
        datetime verified_at
    }

    COOK_SKILLS {
        int id PK
        int cook_id FK
        string skill_name
        string cuisine_type
        string proficiency
    }

    COOK_SOCIETY_ASSIGNMENTS {
        int id PK
        int cook_id FK
        int society_id FK
        string status
        int approved_by
        datetime approved_at
    }

    COOK_GROUPS {
        int id PK
        int society_id FK
        int created_by_resident_id FK
        int assigned_cook_id FK
        string name
        string meal_service
        string service_type
        int min_households
        int max_households
        int current_households
        string status
        string invite_code UK
    }

    GROUP_MEMBERS {
        int id PK
        int group_id FK
        int resident_id FK
        string flat_number
        int household_size
        time preferred_slot_start
        string status
    }

    GROUP_INVITATIONS {
        int id PK
        int group_id FK
        int invited_by_id FK
        string invite_token UK
        string email_or_phone
        string status
        datetime expires_at
    }

    GROUP_PRICING_RULES {
        int id PK
        int society_id FK
        int min_households
        int max_households
        int base_price_per_household
        int cook_payout_per_household
        decimal platform_commission_pct
    }

    GROUP_PRICE_SNAPSHOTS {
        int id PK
        int group_id FK
        int household_count
        int price_per_household
        int cook_payout_total
        int platform_fee_total
        date snapshot_date
    }

    SCHEDULES {
        int id PK
        int group_id FK
        int cook_id FK
        int society_id FK
        int version_number
        date effective_from
        date effective_to
        string status
        decimal algorithm_score
    }

    SCHEDULE_ENTRIES {
        int id PK
        int schedule_id FK
        int resident_id FK
        int cook_id FK
        string flat_number
        string block_name
        string day_of_week
        time start_time
        time end_time
    }

    BOOKINGS {
        int id PK
        int resident_id FK
        int cook_id FK
        date start_date
        date end_date
        time start_time
        time end_time
        int amount
        string status
        string service_type
        string slot_label
        int monthly_price
        string recurrence_type
    }

    SESSIONS {
        int id PK
        int booking_id FK
        int cook_id FK
        date service_date
        string status
        datetime check_in
        datetime check_out
        time scheduled_start_time
        time scheduled_end_time
        string otp_code
        boolean otp_verified
        int otp_attempts
        string service_type
    }

    LEAVES {
        int id PK
        int cook_id FK
        date start_date
        date end_date
        string reason
        string status
        string leave_type
        int reviewed_by
    }

    REPLACEMENTS {
        int id PK
        int session_id FK "UK"
        int orig_cook_id
        int backup_cook_id
        string status
        string assigned_by_type
        string reason
    }

    SUBSCRIPTIONS {
        int id PK
        int booking_id FK
        int group_id FK
        int resident_id FK
        int society_id FK
        int monthly_amount
        string status
        date current_period_start
        date current_period_end
    }

    PAYMENTS {
        int id PK
        int booking_id FK
        int amount
        int amount_paise
        string razorpay_order_id
        string razorpay_payment_id UK
        string status
        string currency
        string gateway
    }

    WEBHOOK_EVENTS {
        int id PK
        string event_id UK
        string event_type
        string resource_id
        json payload
        timestamp processed_at
    }

    INVOICES {
        int id PK
        int payment_id FK
        int booking_id FK
        int resident_id FK
        string invoice_number UK
        int subtotal
        int tax_amount
        int total_amount
        date issued_date
    }

    EARNINGS_LEDGER {
        int id PK
        int cook_id FK
        int session_id
        int booking_id
        int gross_amount
        int platform_commission
        int net_cook_earning
        string status
        int payout_id
    }

    PAYOUTS {
        int id PK
        int cook_id FK
        int amount
        string reference_number UK
        date period_start
        date period_end
        string status
        datetime processed_at
    }

    REFUNDS {
        int id PK
        int payment_id FK
        int booking_id FK
        int resident_id FK
        int amount
        string reason
        string status
        string gateway_refund_id UK
        int created_by
    }

    REVIEWS {
        int id PK
        int booking_id FK "UK"
        int rating
        string comment
        int punctuality_rating
        int hygiene_rating
        int taste_rating
    }

    COMPLAINTS {
        int id PK
        int society_id FK
        int resident_id FK
        int cook_id FK
        string category
        text description
        string status
    }

    REFERRALS {
        int id PK
        int referrer_id FK
        int referee_id FK "UK"
        string referral_code
        int reward_amount
        string status
        datetime rewarded_at
    }

    REFRESH_TOKENS {
        int id PK
        int user_id FK
        string token_hash
        datetime expires_at
        boolean revoked
    }

    AUDIT_LOGS {
        int id PK
        int user_id
        string action
        string resource_type
        int resource_id
        string ip_address
        string user_agent
        text payload_diff
    }

    SERVICE_CATEGORIES {
        string id PK
        string name
        string tagline
        int base_price
        int standard_duration_minutes
        boolean is_active
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        string message
        string type
        boolean is_read
        datetime read_at
    }
```

---

## 1. Core Tables

### 1. `societies`
Stores gated residential apartment communities.
- `id` (INT, PK, AUTO_INCREMENT)
- `name` (VARCHAR 255, NOT NULL)
- `address`, `city`, `state`, `postal_code`
- `gate_pass_prefix` (VARCHAR 50, default 'SC-PASS')
- `total_flats` (INT, default 200)

### 2. `society_blocks`
Represents individual towers or wings (e.g. Tower A, Tower B).
- `id` (INT, PK, AUTO_INCREMENT)
- `society_id` (INT, FK -> societies.id)
- `block_name` (VARCHAR 100)
- `floors_count` (INT, default 14)
- `flats_per_floor` (INT, default 4)

### 3. `users`
System accounts across 4 distinct roles.
- `id` (INT, PK, AUTO_INCREMENT)
- `society_id` (INT, FK -> societies.id)
- `block_name`, `flat_number`
- `name`, `email` (UNIQUE), `phone`, `password_hash`
- `role` (`RESIDENT`, `COOK`, `SOCIETY_MANAGER`, `ADMIN`)
- `status` (`ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`)

### 4. `cooks`
Professional cook profiles and service metrics.
- `id` (INT, PK, AUTO_INCREMENT)
- `user_id` (INT, FK -> users.id)
- `experience_years`, `bio`, `specialties`, `cuisines`
- `rating_avg` (DECIMAL 3,2, default 4.80)
- `reliability_score` (DECIMAL 5,2, default 98.00)
- `punctuality_score` (DECIMAL 3,2, default 0.98)
- `police_verification_status` (`CLEARED`, `PENDING`, `REJECTED`)
- `gate_clearance_code` (VARCHAR 100)

### 5. `cook_groups`
Community cook hiring clusters.
- `id` (INT, PK, AUTO_INCREMENT)
- `society_id` (INT, FK -> societies.id)
- `assigned_cook_id` (INT, FK -> cooks.id, NULLABLE)
- `name` (VARCHAR 255)
- `meal_service` (`BREAKFAST`, `LUNCH`, `DINNER`, `MULTIPLE`)
- `dietary_requirements` (`VEGETARIAN`, `NON_VEGETARIAN`, `JAIN`, `MIXED`)
- `budget_per_household` (DECIMAL 10,2)
- `status` (`DRAFT`, `RECRUITING`, `THRESHOLD_REACHED`, `MATCHING`, `ACTIVE`, `PAUSED`, `CANCELLED`)
- `min_members`, `max_members`, `current_members`

### 6. `group_members`
Households participating in a group.
- `id` (INT, PK, AUTO_INCREMENT)
- `group_id` (INT, FK -> cook_groups.id)
- `resident_id` (INT, FK -> users.id)
- `preferred_slot` (VARCHAR 50)
- `dietary_preferences` (TEXT)
- `monthly_price` (DECIMAL 10,2)

### 7. `schedules` & `schedule_entries`
Optimized route calendar.
- `schedule_entries.schedule_id` (FK -> schedules.id)
- `resident_id`, `flat_number`, `block_name`
- `start_time`, `end_time` (e.g. 19:00:00 to 19:45:00)
- `buffer_minutes` (INT, default 15)

### 8. `sessions`
Daily cooking appointments with OTP authentication.
- `id` (INT, PK, AUTO_INCREMENT)
- `booking_id`, `cook_id`, `resident_id`, `society_id`
- `service_date` (DATE)
- `start_time`, `end_time`
- `otp_code` (VARCHAR 6) - Generated for resident to verify arrival
- `status` (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `DISPUTED`, `MISSED`)
- `check_in_time`, `check_out_time`

### 9. `leaves` & `replacements`
Cook absence and automated backup dispatch.
- `leaves.cook_id`, `start_date`, `end_date`, `reason`
- `replacements.replacement_cook_id` (FK -> cooks.id)
- `replacements.status` (`PENDING`, `DISPATCHED`, `COMPLETED`)

### 10. `audit_logs`
Non-repudiable ledger of operational and security changes.
- `actor_id` (INT)
- `action` (VARCHAR 100)
- `entity_type`, `entity_id`
- `diff_payload` (JSON)
- `created_at` (TIMESTAMP)
