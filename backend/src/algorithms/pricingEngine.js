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

export const DISHWASHING_VOLUME_TIERS = [
  { households: 1, baseMonthlyPrice: 2200, proSharePct: 90 },
  { households: 2, baseMonthlyPrice: 2000, proSharePct: 90 },
  { households: 3, baseMonthlyPrice: 1900, proSharePct: 90 },
  { households: 4, baseMonthlyPrice: 1800, proSharePct: 90 },
  { households: 5, baseMonthlyPrice: 1700, proSharePct: 90 },
  { households: 6, baseMonthlyPrice: 1600, proSharePct: 90 },
  { households: 7, baseMonthlyPrice: 1550, proSharePct: 90 },
  { households: 8, baseMonthlyPrice: 1500, proSharePct: 90 }
];

export const COMBO_VOLUME_TIERS = [
  { households: 1, baseMonthlyPrice: 6500, cookSplitPct: 68, dwSplitPct: 32 },
  { households: 2, baseMonthlyPrice: 6000, cookSplitPct: 68, dwSplitPct: 32 },
  { households: 3, baseMonthlyPrice: 5700, cookSplitPct: 68, dwSplitPct: 32 },
  { households: 4, baseMonthlyPrice: 5400, cookSplitPct: 68, dwSplitPct: 32 },
  { households: 5, baseMonthlyPrice: 5100, cookSplitPct: 68, dwSplitPct: 32 },
  { households: 6, baseMonthlyPrice: 4850, cookSplitPct: 68, dwSplitPct: 32 },
  { households: 7, baseMonthlyPrice: 4700, cookSplitPct: 68, dwSplitPct: 32 },
  { households: 8, baseMonthlyPrice: 4600, cookSplitPct: 68, dwSplitPct: 32 }
];

export const MEAL_MULTIPLIERS = {
  BREAKFAST: 0.85,
  LUNCH: 1.0,
  DINNER: 1.0,
  MULTIPLE: 1.8
};

export const UTENSIL_LOAD_MULTIPLIERS = {
  LIGHT: 0.9,
  STANDARD: 1.0,
  HEAVY: 1.25
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
export const PRIVATE_DISHWASHING_BENCHMARK = 3500;
export const PRIVATE_COMBO_BENCHMARK = 11000;

// Minimum monthly wage floor for a full-slot cook to prevent wage erosion
export const MIN_COOK_COMPENSATION_FLOOR = 15000;
export const MIN_DISHWASHER_COMPENSATION_FLOOR = 7500;

export function calculateGroupPricing({
  householdCount = 1,
  mealService = 'DINNER',
  serviceType = 'COOKING',
  utensilLoad = 'STANDARD',
  householdSize = 2,
  customTiers = null,
  commissionPct = 10
}) {
  const count = Math.max(1, Math.min(10, householdCount));
  const sType = (serviceType || 'COOKING').toUpperCase();

  let tiers = customTiers;
  let benchmark = PRIVATE_COOK_BENCHMARK;
  let minFloor = MIN_COOK_COMPENSATION_FLOOR;

  if (sType === 'DISHWASHING') {
    tiers = tiers || DISHWASHING_VOLUME_TIERS;
    benchmark = PRIVATE_DISHWASHING_BENCHMARK;
    minFloor = MIN_DISHWASHER_COMPENSATION_FLOOR;
  } else if (sType === 'COMBO') {
    tiers = tiers || COMBO_VOLUME_TIERS;
    benchmark = PRIVATE_COMBO_BENCHMARK;
    minFloor = MIN_COOK_COMPENSATION_FLOOR + MIN_DISHWASHER_COMPENSATION_FLOOR;
  } else {
    tiers = tiers || BASE_VOLUME_TIERS;
    benchmark = PRIVATE_COOK_BENCHMARK;
    minFloor = MIN_COOK_COMPENSATION_FLOOR;
  }

  const tier = tiers.find((t) => t.households === count) || tiers[tiers.length - 1];

  const mealMult = sType === 'DISHWASHING' ? 1.0 : (MEAL_MULTIPLIERS[mealService] || 1.0);
  const sizeMult = HOUSEHOLD_SIZE_MULTIPLIERS[householdSize] || 1.0;
  const utensilMult = sType === 'COOKING' ? 1.0 : (UTENSIL_LOAD_MULTIPLIERS[utensilLoad] || 1.0);

  // Raw base price per household
  const rawPricePerHousehold = Math.round(tier.baseMonthlyPrice * mealMult * sizeMult * utensilMult);

  // Total gross revenue for the group
  const totalGrossMonthly = rawPricePerHousehold * count;

  // Platform commission and professional payout
  let platformCommission = Math.round((totalGrossMonthly * commissionPct) / 100);
  let totalProfessionalPayout = totalGrossMonthly - platformCommission;

  // Enforce fair wage floor for groups of 4+ households
  if (count >= 4 && totalProfessionalPayout < minFloor) {
    const subsidy = minFloor - totalProfessionalPayout;
    platformCommission = Math.max(0, platformCommission - subsidy);
    totalProfessionalPayout = totalGrossMonthly - platformCommission;
  }

  // Monthly savings compared to private solo hiring
  const singlePrivateCost = Math.round(benchmark * mealMult * utensilMult);
  const savingsPerHousehold = Math.max(0, singlePrivateCost - rawPricePerHousehold);
  const totalGroupSavings = savingsPerHousehold * count;
  const savingsPercentage = Math.round((savingsPerHousehold / Math.max(1, singlePrivateCost)) * 100);

  let cookGrossPayout = totalProfessionalPayout;
  let dishwasherGrossPayout = 0;

  if (sType === 'COMBO') {
    cookGrossPayout = Math.round(totalProfessionalPayout * 0.68);
    dishwasherGrossPayout = totalProfessionalPayout - cookGrossPayout;
  } else if (sType === 'DISHWASHING') {
    cookGrossPayout = 0;
    dishwasherGrossPayout = totalProfessionalPayout;
  }

  return {
    householdCount: count,
    serviceType: sType,
    mealService,
    utensilLoad,
    pricePerHousehold: rawPricePerHousehold,
    totalGrossMonthly,
    platformCommission,
    commissionPct,
    cookGrossPayout,
    dishwasherGrossPayout,
    totalProfessionalPayout,
    averageCookHourlyRate: cookGrossPayout > 0 ? Math.round(cookGrossPayout / (count * 26 * 0.75)) : 0,
    averageDishwasherHourlyRate: dishwasherGrossPayout > 0 ? Math.round(dishwasherGrossPayout / (count * 26 * 0.5)) : 0,
    privateCookBenchmark: singlePrivateCost,
    savingsPerHousehold,
    totalGroupSavings,
    savingsPercentage,
    breakdown: {
      cookCompensation: cookGrossPayout,
      dishwasherCompensation: dishwasherGrossPayout,
      totalProfessionalCompensation: totalProfessionalPayout,
      platformFee: platformCommission,
      operationalAndInsuranceFund: Math.round(totalGrossMonthly * 0.04),
      effectiveHourlyRate: Math.round(totalProfessionalPayout / (count * 26 * (sType === 'COMBO' ? 1.25 : sType === 'DISHWASHING' ? 0.5 : 0.75)))
    }
  };
}

export function generateGroupPricingTable(mealService = 'DINNER', serviceType = 'COOKING') {
  const tiers = serviceType === 'DISHWASHING' ? DISHWASHING_VOLUME_TIERS : serviceType === 'COMBO' ? COMBO_VOLUME_TIERS : BASE_VOLUME_TIERS;
  return tiers.map((tier) =>
    calculateGroupPricing({
      householdCount: tier.households,
      mealService,
      serviceType,
      householdSize: 2
    })
  );
}
