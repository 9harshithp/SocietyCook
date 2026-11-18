import { describe, it, expect } from 'vitest';
import { rankCooksForGroup } from '../src/algorithms/recommender.js';

describe('Smart Cook Matching & Recommendation Engine', () => {
  const dummyGroup = {
    society_id: 1,
    preferred_cuisines: 'North Indian, Punjabi',
    dietary_pref: 'VEGETARIAN',
    monthly_budget_max: 4500,
    preferred_time_start: '19:00:00',
    preferred_time_end: '22:00:00',
    min_households: 3
  };

  const candidateCooks = [
    {
      id: 1,
      name: 'Ramesh Kumar',
      society_id: 1,
      cuisine: 'North Indian, Punjabi Delicacies',
      dietary_tags: 'Pure Veg, Custom Spice',
      price: 4000,
      rating_avg: 4.9,
      reliability_score: 99.2,
      available_from: '07:00:00',
      available_to: '22:00:00',
      verified: 1,
      active_households: 2
    },
    {
      id: 2,
      name: 'Lakshmi Narayanan',
      society_id: 1,
      cuisine: 'South Indian, Tamil',
      dietary_tags: 'Pure Veg, Sattvic',
      price: 3500,
      rating_avg: 4.8,
      reliability_score: 98.0,
      available_from: '06:30:00',
      available_to: '21:30:00',
      verified: 1,
      active_households: 1
    },
    {
      id: 3,
      name: 'External Cook',
      society_id: 2, // different society
      cuisine: 'Continental',
      price: 6000,
      verified: 1
    }
  ];

  it('ranks cooks using normalized multi-factor weighted scoring', () => {
    const result = rankCooksForGroup({ group: dummyGroup, candidateCooks });

    expect(result.rankedRecommendations).toHaveLength(3);
    expect(result.topMatch.cookId).toBe(1); // Ramesh should be top match
    expect(result.topMatch.matchPercentage).toBeGreaterThanOrEqual(85);
    expect(result.topMatch.explanations.length).toBeGreaterThan(0);
  });

  it('filters out unverified cooks from recommendations', () => {
    const withUnverified = [
      ...candidateCooks,
      { id: 4, name: 'Unverified Candidate', verified: 0 }
    ];
    const result = rankCooksForGroup({ group: dummyGroup, candidateCooks: withUnverified });
    expect(result.rankedRecommendations.some((c) => c.cookId === 4)).toBe(false);
  });
});
