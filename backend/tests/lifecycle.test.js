import { describe, it, expect } from 'vitest';
import { calculateGroupPricing } from '../src/algorithms/pricingEngine.js';
import { SchedulingEngine } from '../src/algorithms/scheduler.js';
import { rankCooksForGroup } from '../src/algorithms/recommender.js';
import { findEligibleBackupCooks } from '../src/algorithms/backupAllocator.js';
import { calculateDemandForecast } from '../src/algorithms/forecasting.js';

describe('SocietyCook v2 End-to-End Core Lifecycle', () => {
  it('Scenario 1: Dynamic Community Pricing saves up to 35% with fair cook wage', () => {
    // 5 households clustering dinner
    const clusterPricing = calculateGroupPricing({
      householdCount: 5,
      mealService: 'DINNER',
      householdSize: '4',
      serviceDaysPerWeek: 6
    });

    expect(clusterPricing.pricePerHousehold).toBeLessThan(5000);
    expect(clusterPricing.totalGroupSavings).toBeGreaterThan(0);
    expect(clusterPricing.cookGrossPayout).toBeGreaterThanOrEqual(15000); // Living wage floor
    expect(clusterPricing.platformCommission).toBeGreaterThan(0);
  });

  it('Scenario 2: Recommender ranks verified cooks using 7 weighted criteria with explanation', () => {
    const candidateCooks = [
      {
        id: 1,
        name: 'Chef Ramesh',
        rating: 4.9,
        punctuality_score: 0.98,
        cuisines: 'North Indian, Homestyle',
        active_societies: [1],
        active_bookings_count: 2,
        verified: true
      },
      {
        id: 2,
        name: 'Chef Suresh',
        rating: 4.1,
        punctuality_score: 0.85,
        cuisines: 'Continental',
        active_societies: [2],
        active_bookings_count: 7,
        verified: true
      }
    ];

    const group = {
      society_id: 1,
      preferred_cuisines: 'North Indian',
      preferred_slot: '19:30-20:15',
      budget_per_household: 4500
    };

    const { rankedRecommendations } = rankCooksForGroup({ group, cooks: candidateCooks });
    expect(rankedRecommendations.length).toBe(2);
    expect(rankedRecommendations[0].cookId).toBe(1); // Chef Ramesh matches society, cuisine, high rating
    expect(rankedRecommendations[0].matchPercentage).toBeGreaterThan(rankedRecommendations[1].matchPercentage);
    expect(rankedRecommendations[0].explanations.length).toBeGreaterThan(0);
  });

  it('Scenario 3: Greedy optimizer schedules 45-min slots with 15-min buffers', () => {
    const scheduler = new SchedulingEngine({ bufferMinutes: 15, defaultDuration: 45 });
    const dummyCook = {
      id: 1,
      name: 'Ramesh Kumar',
      available_from: '18:00:00',
      available_to: '23:00:00',
      max_daily_hours: 6.0,
      leaves: []
    };

    const households = [
      { resident_id: 1, flat_number: 'A-101', block_name: 'Tower A', preferred_slot_start: '19:00:00' },
      { resident_id: 2, flat_number: 'A-102', block_name: 'Tower A', preferred_slot_start: '19:45:00' },
      { resident_id: 3, flat_number: 'A-103', block_name: 'Tower A', preferred_slot_start: '20:30:00' }
    ];

    const result = scheduler.generateSchedule({
      cook: dummyCook,
      households,
      serviceDate: '2026-11-20',
      preferredMeal: 'DINNER'
    });

    expect(result.feasible).toBe(true);
    expect(result.entries).toHaveLength(3);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('Scenario 4: Automated Backup Dispatch allocates standby cook upon leave', () => {
    const leave = {
      cook_id: 1,
      society_id: 1,
      start_date: '2026-11-25',
      end_date: '2026-11-26'
    };

    const candidateCooks = [
      { id: 2, name: 'Chef Lakshmi', rating: 4.8, active_societies: [1], verified: true, leaves: [] },
      { id: 3, name: 'Chef Suresh', rating: 4.2, active_societies: [2], verified: true, leaves: [] }
    ];

    const { eligibleBackups } = findEligibleBackupCooks({
      leave,
      affectedSessions: [],
      candidateCooks,
      existingSessionsByCook: {}
    });

    expect(eligibleBackups.length).toBeGreaterThanOrEqual(1);
    expect(eligibleBackups[0].cookId).toBe(2); // In same society, highest rating
  });

  it('Scenario 5: Statistical forecasting projects demand trends accurately', () => {
    const historicalPeriods = [
      { period: 'Week 1', newHouseholds: 5, newGroups: 1, activeCooks: 2 },
      { period: 'Week 2', newHouseholds: 8, newGroups: 2, activeCooks: 3 },
      { period: 'Week 3', newHouseholds: 10, newGroups: 2, activeCooks: 4 },
      { period: 'Week 4', newHouseholds: 12, newGroups: 3, activeCooks: 4 }
    ];

    const forecast = calculateDemandForecast({
      historicalPeriods,
      currentActiveHouseholds: 35,
      currentActiveCooks: 5,
      societyCapacityFlats: 400
    });

    expect(forecast.status).toBe('ACTIVE_FORECAST');
    expect(forecast.projectedNewHouseholdsNextMonth).toBeGreaterThan(0);
    expect(forecast.projectedCooksNeeded).toBeGreaterThanOrEqual(5);
  });
});
