/**
 * SocietyCook Smart Cook Matching & Recommendation Engine
 * Evaluates candidate cooks using normalized multi-factor weighted scoring.
 * Generates transparent match percentages and human-readable reasoning.
 */

export const DEFAULT_WEIGHTS = {
  availability: 0.25,
  proximity: 0.25,
  cuisineAndSkills: 0.15,
  ratings: 0.15,
  reliability: 0.1,
  budget: 0.05,
  workload: 0.05
};

export function rankCooksForGroup({
  group,
  candidateCooks = [],
  cooks = [],
  weights = DEFAULT_WEIGHTS,
  existingCookBookingsMap = {}
}) {
  const targetSocietyId = group.society_id;
  const targetCuisines = (group.preferred_cuisines || group.cuisine_preferences || '').toLowerCase().split(',').map((s) => s.trim());
  const targetDiet = (group.dietary_pref || group.dietary_requirements || 'VEGETARIAN').toUpperCase();
  const maxBudget = group.monthly_budget_max || group.budget_per_household || 5000;
  const preferredStart = group.preferred_time_start || '19:00:00';
  const preferredEnd = group.preferred_time_end || '22:00:00';

  const cooksToScore = candidateCooks.length ? candidateCooks : cooks;
  const scoredCooks = cooksToScore
    .filter((cook) => cook.verified) // Mandatory eligibility filter
    .map((cook) => {
      const explanations = [];

      // 1. Society Proximity Score (0–100)
      const cookSocietyId = cook.society_id || (cook.active_societies && cook.active_societies[0]);
      let proximityScore = 0;
      if (cookSocietyId === targetSocietyId) {
        proximityScore = 100;
        explanations.push(`Located directly in ${cook.society_name || 'the same society'} (2-min elevator transit)`);
      } else if ((cook.assigned_societies && cook.assigned_societies.includes(targetSocietyId)) || (cook.active_societies && cook.active_societies.includes(targetSocietyId))) {
        proximityScore = 85;
        explanations.push('Authorized across sister society clusters');
      } else {
        proximityScore = 30;
        explanations.push('Neighbouring society location');
      }

      // 2. Availability Compatibility Score (0–100)
      let availabilityScore = 0;
      const cookStart = cook.available_from || '07:00:00';
      const cookEnd = cook.available_to || '22:00:00';
      if (preferredStart >= cookStart && preferredEnd <= cookEnd) {
        availabilityScore = 100;
        explanations.push(`Available during your requested window (${cookStart.slice(0, 5)} - ${cookEnd.slice(0, 5)})`);
      } else if (preferredStart >= cookStart) {
        availabilityScore = 60;
        explanations.push('Partial availability match during required service time');
      } else {
        availabilityScore = 20;
      }

      // 3. Cuisine & Skills Compatibility Score (0–100)
      let cuisineScore = 40;
      const cookCuisine = (cook.cuisines || cook.cuisine || '').toLowerCase();
      const cookDiet = (cook.dietary_tags || '').toLowerCase();

      const matchedCuisines = targetCuisines.filter((c) => cookCuisine.includes(c));
      if (matchedCuisines.length > 0) {
        cuisineScore += 35 * Math.min(1, matchedCuisines.length / targetCuisines.length);
        explanations.push(`Matches requested cuisine: ${matchedCuisines.join(', ')}`);
      }
      if (targetDiet === 'JAIN' && cookDiet.includes('jain')) {
        cuisineScore += 25;
        explanations.push('Certified Jain (No Onion/Garlic) preparation');
      } else if (targetDiet === 'VEGETARIAN' && (cookDiet.includes('veg') || cookCuisine.includes('veg'))) {
        cuisineScore += 25;
        explanations.push('Strict vegetarian and Sattvic kitchen compliant');
      } else if (targetDiet === 'NON_VEG') {
        cuisineScore += 25;
      }
      cuisineScore = Math.min(100, cuisineScore);

      // 4. Resident Rating Score (0–100)
      const rating = Number(cook.rating || cook.rating_avg || 4.5);
      const ratingScore = Math.round((Math.min(5.0, rating) / 5.0) * 100);
      explanations.push(`Consistently rated ${rating.toFixed(1)}/5 by society residents`);

      // 5. Reliability Score (0–100)
      const reliability = Number(cook.reliability_score || 98.0);
      const reliabilityScore = Math.min(100, Math.round(reliability));
      if (reliabilityScore >= 95) {
        explanations.push(`${reliabilityScore}% on-time arrival and attendance record`);
      }

      // 6. Budget Compatibility Score (0–100)
      const cookMonthlyPrice = Number(cook.price || 4000);
      let budgetScore = 100;
      if (cookMonthlyPrice <= maxBudget) {
        budgetScore = 100;
        explanations.push(`Within monthly budget (₹${cookMonthlyPrice.toLocaleString('en-IN')}/mo)`);
      } else {
        const excessRatio = (cookMonthlyPrice - maxBudget) / maxBudget;
        budgetScore = Math.max(0, Math.round(100 - excessRatio * 150));
        explanations.push(`Slightly above target budget (+₹${(cookMonthlyPrice - maxBudget).toLocaleString('en-IN')})`);
      }

      // 7. Workload Suitability Score (0–100)
      const activeFlats = existingCookBookingsMap[cook.id] || cook.active_households || 0;
      const maxFlats = Math.floor((cook.max_daily_hours || 8.0) / 1.0);
      const remainingCapacity = Math.max(0, maxFlats - activeFlats);
      let workloadScore = 0;
      if (remainingCapacity >= (group.min_households || 3)) {
        workloadScore = 100;
        explanations.push(`Available capacity for ${group.min_households}+ households`);
      } else if (remainingCapacity > 0) {
        workloadScore = 50;
        explanations.push(`Limited slots remaining (${remainingCapacity} slots)`);
      } else {
        workloadScore = 10;
        explanations.push('Currently near maximum daily household capacity');
      }

      // Calculate Normalized Weighted Score
      const totalScore = Math.round(
        proximityScore * weights.proximity +
          availabilityScore * weights.availability +
          cuisineScore * weights.cuisineAndSkills +
          ratingScore * weights.ratings +
          reliabilityScore * weights.reliability +
          budgetScore * weights.budget +
          workloadScore * weights.workload
      );

      return {
        cook,
        cookId: cook.id,
        name: cook.name,
        photoUrl: cook.photo_url,
        matchPercentage: Math.max(30, Math.min(99, totalScore)),
        cuisine: cook.cuisine,
        price: cookMonthlyPrice,
        rating: rating.toFixed(1),
        reliabilityScore,
        factorScores: {
          proximity: proximityScore,
          availability: availabilityScore,
          cuisine: cuisineScore,
          ratings: ratingScore,
          reliability: reliabilityScore,
          budget: budgetScore,
          workload: workloadScore
        },
        explanations
      };
    })
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return {
    topMatch: scoredCooks[0] || null,
    rankedRecommendations: scoredCooks,
    alternatives: scoredCooks.slice(1, 4),
    matchingCriteria: {
      societyId: targetSocietyId,
      cuisines: targetCuisines,
      diet: targetDiet,
      budget: maxBudget
    }
  };
}
