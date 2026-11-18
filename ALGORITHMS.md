# Algorithm Specifications
## Heuristic & Statistical Intelligence in SocietyCook v2

SocietyCook strictly avoids opaque or fabricated "AI" claims. All optimization, pricing, recommendations, and capacity forecasting are powered by mathematically sound, transparent heuristic and statistical algorithms.

---

## 1. Dynamic Group Pricing Engine (`pricingEngine.js`)

The pricing engine translates collective residential demand into volume discounts while guaranteeing a non-negotiable living wage floor for cooks.

### Formula
$$ \text{Base Price} = \text{TierPrice}(N) \times M_{\text{meal}} \times M_{\text{size}} \times \left(\frac{D_{\text{service}}}{6}\right) $$

- **Volume Tiers:** 1 flat = ₹5,000, 2 flats = ₹4,700, 3 flats = ₹4,500, 4 flats = ₹4,200, 5 flats = ₹4,000, 6 flats = ₹3,800, 7 flats = ₹3,600, 8 flats = ₹3,500.
- **Meal Multipliers ($M_{\text{meal}}$):** Breakfast (0.70), Lunch (0.95), Dinner (1.00), Multiple (1.70).
- **Household Size Multipliers ($M_{\text{size}}$):** 1–2 people (1.00), 3–4 people (1.15), 5+ people (1.30).
- **Cook Living Wage Floor:** For clusters of 4+ households, cook gross payout is guaranteed at:
  $$ \text{CookPayout} = \max(\text{MIN\_FLOOR} = ₹15,000, \text{Gross} \times 0.85) $$
- **Platform Fee:** Fixed 10% commission on gross subscription value.

---

## 2. Greedy Schedule Placement with Elevator Buffering (`scheduler.js`)

Optimizes recurring cooking appointment routes within the same tower.

### Hard Constraints
1. **Window Duration:** Dedicated 45 minutes of in-kitchen cooking per household.
2. **Transit Buffer:** Fixed 15-minute inter-appointment elevator buffer between consecutive flats in the same tower.
3. **Daily Cap:** Maximum 6.0 cooking hours per day per cook.
4. **Leave Exclusion:** Cannot schedule on approved leave dates.

### Scoring Heuristic
$$ \text{Score} = 100 - (\Delta_{\text{time}} \times 0.4) - (\text{TowerSwitch} \times 20) - (\text{IdleGap} \times 0.1) $$
- **Bounded Backtracking:** When a resident's ideal slot conflicts with a neighbouring flat, the engine tests adjacent 45-min windows (+15m / -15m) to find the global optimum without schedule collisions.

---

## 3. 7-Factor Weighted Cook Recommender (`recommender.js`)

Evaluates candidate cooks against a hiring group's specific parameters.

| Factor | Weight | Scoring Metric |
| :--- | :---: | :--- |
| **Society Proximity** | 25% | 100 pts if in same society; 85 pts if in sister campus; 30 pts neighbouring. |
| **Availability Match** | 25% | Overlap between cook operating hours and group time window. |
| **Cuisine & Dietary** | 15% | Jaccard similarity between preferred cuisines and cook specialties. |
| **Rating & Reviews** | 15% | Normalized client review score (4.0 to 5.0 scale). |
| **Reliability Score** | 10% | Historic punctuality and attendance percentage from OTP logs. |
| **Budget Alignment** | 5% | Cook standard rate vs group household budget ceiling. |
| **Workload Balance** | 5% | Cook active appointments vs maximum capacity. |

**Output:** Match score percentage (e.g. 94%) accompanied by bulleted, human-readable explanations.

---

## 4. Automated Backup Cook Allocator (`backupAllocator.js`)

Guarantees 100% service continuity during cook sick leaves or vacations.
1. Identifies all affected sessions during the leave date range.
2. Filters society-cleared standby cooks with valid police clearances.
3. Performs temporal collision detection against existing standby commitments.
4. Ranks available standbys by historic rating and reliability.
5. Emits dispatch alerts via WebSockets and SMS simulation.

---

## 5. Statistical Moving Average Demand Forecasting (`forecasting.js`)

Models compound household demand and cook recruitment requirements over 6-month horizons.
$$ \bar{G}_{\text{household}} = \frac{1}{k} \sum_{i=1}^{k} \Delta H_i $$
- Computes 4-period moving average of new group formation velocity.
- Projects cook hiring thresholds (1 cook required per 5 subscribing flats).
- Flags capacity alerts when projected demand exceeds campus cook supply by &gt;15%.
