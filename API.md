# REST API Specification
## SocietyCook v2.0.0 Endpoints
Base URL: `http://localhost:5000/api/v1`  
Interactive Swagger UI: `http://localhost:5000/api/v1/docs`

All protected endpoints require HTTP Header:  
`Authorization: Bearer <ACCESS_TOKEN>`

---

## 1. Authentication (`/api/v1/auth`)

### POST `/auth/login`
Authenticates a user and returns short-lived Access Token & Refresh Token.
```json
// Request
{
  "email": "resident@example.com",
  "password": "DemoPassword123!"
}

// Response (200 OK)
{
  "user": {
    "id": 1,
    "name": "Rahul Sharma",
    "email": "resident@example.com",
    "role": "RESIDENT",
    "society_id": 1,
    "block_name": "Tower A",
    "flat_number": "101"
  },
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "48b11c..."
}
```

### POST `/auth/register`
Creates a resident, cook, or manager account.

### GET `/auth/me`
Fetches authenticated user identity and active society permissions.

---

## 2. Community Groups (`/api/v1/groups`)

### GET `/groups?societyId=1&status=RECRUITING`
Fetches hiring groups matching filters.

### POST `/groups`
Creates a new community cook hiring group.
```json
// Request
{
  "society_id": 1,
  "name": "Tower A Evening Dinner Club",
  "meal_service": "DINNER",
  "cuisine_preferences": "North Indian, Homestyle",
  "dietary_requirements": "VEGETARIAN",
  "min_members": 3,
  "max_members": 5,
  "budget_per_household": 4200
}
```

### POST `/groups/:id/join`
Adds resident to the group roster and calculates updated volume pricing.

### GET `/groups/:id/recommendations`
Runs the 7-factor recommendation engine and returns ranked cooks with explainable matching percentages.
```json
// Response (200 OK)
[
  {
    "cook_id": 1,
    "cook_name": "Chef Ramesh Kumar",
    "match_score": 94,
    "rating": 4.9,
    "experience_years": 8,
    "match_reasons": [
      "Located directly in Greenwood Heights (2-min elevator transit)",
      "Available during 07:00 PM - 10:00 PM window",
      "Matches requested cuisine: North Indian"
    ]
  }
]
```

### POST `/groups/:id/activate`
Atomically transitions group to `ACTIVE`, runs scheduler to lock 45-min slots, generates recurring calendar entries, and initializes session records.

---

## 3. Dynamic Pricing (`/api/v1/pricing`)

### POST `/pricing/calculate`
Calculates estimated household price, total savings, and cook payout.
```json
// Request
{
  "householdCount": 5,
  "mealService": "DINNER",
  "householdSize": "4",
  "serviceDaysPerWeek": 6
}

// Response (200 OK)
{
  "householdCount": 5,
  "mealService": "DINNER",
  "pricePerHousehold": 4000,
  "totalGrossMonthly": 20000,
  "platformCommission": 2000,
  "cookGrossPayout": 18000,
  "totalGroupSavings": 17500,
  "savingsPercentage": 47
}
```

---

## 4. Sessions & Attendance (`/api/v1/sessions`)

### GET `/sessions?societyId=1`
Returns daily appointments.

### POST `/sessions/:id/attendance`
Authenticates cook arrival or departure using resident session OTP.
```json
// Request
{
  "action": "CHECK_IN", // or "CHECK_OUT"
  "otp": "4829"
}

// Response (200 OK)
{
  "success": true,
  "sessionId": 12,
  "status": "IN_PROGRESS",
  "checkInTime": "2026-11-20T19:02:14.000Z"
}
```

---

## 5. Leaves & Automated Backup Dispatch (`/api/v1/leaves`)

### POST `/leaves`
Submits leave request and triggers automated backup cook matching.

### POST `/leaves/:id/approve`
Approves leave and reassigns all affected appointments to standby cook without disruption.
