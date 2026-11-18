# Testing Strategy & Test Execution Report
## SocietyCook v2 Test Suite

SocietyCook employs an automated testing pyramid comprising unit tests for mathematical algorithms, integration tests for REST APIs, and end-to-end lifecycle verification.

---

## 1. Test Architecture
- **Runner:** [Vitest](https://vitest.dev/) v5.1.1
- **HTTP Assertions:** Supertest
- **Assertions Library:** Chai / Vitest `expect`
- **Execution Script:** `npm test` inside `backend/`

---

## 2. Test Suites Overview

| Suite | File Path | Focus | Test Cases |
| :--- | :--- | :--- | :---: |
| **Pricing Engine** | `backend/tests/pricing.test.js` | Volume tiers, multipliers, living wage floor, breakdowns | 4 Passed |
| **Scheduling Engine** | `backend/tests/scheduler.test.js` | 45-min slots, 15-min buffers, leave conflict avoidance | 3 Passed |
| **Cook Recommender** | `backend/tests/recommender.test.js` | 7-factor weights, score normalization, explanations | 2 Passed |
| **End-to-End Lifecycle** | `backend/tests/lifecycle.test.js` | Multi-household clustering, backup dispatch, forecast | 5 Passed |
| **API Integration** | `backend/tests/api.test.js` | Health, Auth, Societies, Pricing API, Protected guards | 5 Passed |
| **Total** | | | **19 / 19 Passed (100%)** |

---

## 3. How to Run Tests

### Run Vitest Backend Suite
```bash
cd backend
npm test
```

### Run Frontend Production Build Check
```bash
cd frontend
npm run build
```
Builds in &lt;3.0 seconds with zero TypeScript or JSX bundling errors.

---

## 4. Test Execution Output Sample
```
 ✓ tests/pricing.test.js (4 tests) 7ms
 ✓ tests/scheduler.test.js (3 tests) 7ms
 ✓ tests/recommender.test.js (2 tests) 20ms
 ✓ tests/lifecycle.test.js (5 tests) 17ms
 ✓ tests/api.test.js (5 tests) 328ms

 Test Files  5 passed (5)
      Tests  19 passed (19)
   Duration  665ms
```
