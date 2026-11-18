/**
 * SocietyCook Dynamic Group Pricing Engine
 * Implements configurable tiered volume pricing, meal multipliers,
 * fair cook compensation floors, and transparent platform commission breakdown.
 */

export const BASE_VOLUME_TIERS = [
  { households: 1, baseMonthlyPrice: 5000, cookSharePct: 90 },
  { households: 2, baseMonthlyPrice: 4700, cookSharePct: 90 },
  { households: 3, baseMonthlyPrice: 4500, cookSharePct: 90 },
  { households: 4, baseMonthlyPrice: 4200, cookSharePct: 90 },
  { households: 5, baseMonthlyPrice: 4000, cookSharePct: 90 },
  { households: 6, baseMonthlyPrice: 3800, cookSharePct: 90 },
  { households: 7, baseMonthlyPrice: 3700, cookSharePct: 90 },
  { households: 8, baseMonthlyPrice: 3600, cookSharePct: 90 }
];

export const MEAL_MULTIPLIERS = {
  BREAKFAST: 0.85,
  LUNCH: 1.0,
  DINNER: 1.0,
  MULTIPLE: 1.8
};

export const HOUSEHOLD_SIZE_MULTIPLIERS = {
  1: 1.0,
  2: 1.0,
  3: 1.15,
  4: 1.15,
  5: 1.3,
  6: 1.3
};

// Benchmark cost of an exclusive private cook in gated communities in Bengaluru
export const PRIVATE_COOK_BENCHMARK = 7500;

// Minimum monthly wage floor for a full-slot cook to prevent wage erosion
export const MIN_COOK_COMPENSATION_FLOOR = 15000;

export function calculateGroupPricing({
  householdCount = 1,
  mealService = 'DINNER',
  householdSize = 2,
  customTiers = null,
  commissionPct = 10
}) {
  const count = Math.max(1, Math.min(10, householdCount));
  const tiers = customTiers || BASE_VOLUME_TIERS;
  const tier = tiers.find((t) => t.households === count) || tiers[tiers.length - 1];

  const mealMult = MEAL_MULTIPLIERS[mealService] || 1.0;
  const sizeMult = HOUSEHOLD_SIZE_MULTIPLIERS[householdSize] || 1.0;

  // Raw base price per household
  const rawPricePerHousehold = Math.round(tier.baseMonthlyPrice * mealMult * sizeMult);

  // Total gross revenue for the group
  const totalGrossMonthly = rawPricePerHousehold * count;

  // Platform commission and cook payout
  let platformCommission = Math.round((totalGrossMonthly * commissionPct) / 100);
  let cookGrossPayout = totalGrossMonthly - platformCommission;

  // Enforce fair cook compensation floor for groups of 4+ households
  if (count >= 4 && cookGrossPayout < MIN_COOK_COMPENSATION_FLOOR) {
    const subsidy = MIN_COOK_COMPENSATION_FLOOR - cookGrossPayout;
    platformCommission = Math.max(0, platformCommission - subsidy);
    cookGrossPayout = totalGrossMonthly - platformCommission;
  }

  // Monthly savings compared to private cook hiring
  const singlePrivateCost = PRIVATE_COOK_BENCHMARK * mealMult;
  const savingsPerHousehold = Math.max(0, singlePrivateCost - rawPricePerHousehold);
  const totalGroupSavings = savingsPerHousehold * count;
  const savingsPercentage = Math.round((savingsPerHousehold / singlePrivateCost) * 100);

  return {
    householdCount: count,
    mealService,
    pricePerHousehold: rawPricePerHousehold,
    totalGrossMonthly,
    platformCommission,
    commissionPct,
    cookGrossPayout,
    averageCookHourlyRate: Math.round(cookGrossPayout / (count * 26 * 0.75)),
    privateCookBenchmark: singlePrivateCost,
    savingsPerHousehold,
    totalGroupSavings,
    savingsPercentage,
    breakdown: {
      cookCompensation: cookGrossPayout,
      platformFee: platformCommission,
      operationalAndInsuranceFund: Math.round(platformCommission * 0.4),
      effectiveHourlyRate: Math.round(cookGrossPayout / (count * 26))
    }
  };
}

export function generateGroupPricingTable(mealService = 'DINNER') {
  return BASE_VOLUME_TIERS.map((tier) =>
    calculateGroupPricing({
      householdCount: tier.households,
      mealService,
      householdSize: 2
    })
  );
}
