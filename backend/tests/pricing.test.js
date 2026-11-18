import { describe, it, expect } from 'vitest';
import { calculateGroupPricing, generateGroupPricingTable, MIN_COOK_COMPENSATION_FLOOR } from '../src/algorithms/pricingEngine.js';

describe('Dynamic Group Pricing Engine', () => {
  it('calculates tiered volume discount for 1 to 5 households', () => {
    const p1 = calculateGroupPricing({ householdCount: 1, mealService: 'DINNER' });
    const p3 = calculateGroupPricing({ householdCount: 3, mealService: 'DINNER' });
    const p5 = calculateGroupPricing({ householdCount: 5, mealService: 'DINNER' });

    expect(p1.pricePerHousehold).toBe(5000);
    expect(p3.pricePerHousehold).toBe(4500);
    expect(p5.pricePerHousehold).toBe(4000);

    // Volume discount savings
    expect(p5.pricePerHousehold).toBeLessThan(p1.pricePerHousehold);
    expect(p5.totalGroupSavings).toBeGreaterThan(0);
  });

  it('applies meal multipliers correctly', () => {
    const dinner = calculateGroupPricing({ householdCount: 5, mealService: 'DINNER' });
    const breakfast = calculateGroupPricing({ householdCount: 5, mealService: 'BREAKFAST' });
    const multiple = calculateGroupPricing({ householdCount: 5, mealService: 'MULTIPLE' });

    expect(breakfast.pricePerHousehold).toBeLessThan(dinner.pricePerHousehold);
    expect(multiple.pricePerHousehold).toBeGreaterThan(dinner.pricePerHousehold);
  });

  it('enforces fair cook compensation floor for 4+ households', () => {
    const result = calculateGroupPricing({ householdCount: 5, mealService: 'DINNER', commissionPct: 10 });
    expect(result.cookGrossPayout).toBeGreaterThanOrEqual(MIN_COOK_COMPENSATION_FLOOR);
    expect(result.breakdown.cookCompensation).toBe(result.cookGrossPayout);
  });

  it('generates transparent group pricing breakdown table', () => {
    const table = generateGroupPricingTable('DINNER');
    expect(table).toHaveLength(8);
    expect(table[0].householdCount).toBe(1);
    expect(table[4].householdCount).toBe(5);
    expect(table[4].savingsPercentage).toBeGreaterThanOrEqual(40);
  });
});
