/**
 * SocietyCook Automatic Backup Cook Allocation Engine
 * Manages society-level backup cook matching during leaves and emergencies.
 */

export function findEligibleBackupCooks({
  leave,
  affectedSessions = [],
  candidateCooks = [],
  existingSessionsByCook = {}
}) {
  const origCookId = leave.cook_id;

  const eligibleCandidates = candidateCooks
    .filter((cook) => cook.id !== origCookId && cook.verified)
    .map((candidate) => {
      let isAvailable = true;
      const reasons = [];

      // Check if candidate has approved leave during these dates
      if (candidate.leaves && candidate.leaves.length) {
        const candidateOnLeave = candidate.leaves.some(
          (l) => l.status === 'APPROVED' && l.start_date <= leave.end_date && l.end_date >= leave.start_date
        );
        if (candidateOnLeave) {
          isAvailable = false;
          reasons.push('Candidate has overlapping approved leave');
        }
      }

      // Check session collision for each affected session
      const candidateExistingSessions = existingSessionsByCook[candidate.id] || [];
      for (const sess of affectedSessions) {
        const sessDate = sess.service_date;
        const sessStart = sess.start_time;
        const sessEnd = sess.end_time;

        const hasCollision = candidateExistingSessions.some((cs) => {
          return cs.service_date === sessDate && cs.start_time < sessEnd && cs.end_time > sessStart;
        });

        if (hasCollision) {
          isAvailable = false;
          reasons.push(`Collision on ${sessDate} around ${sessStart}`);
          break;
        }
      }

      // Rank candidate by proximity, rating, and reliability
      const rating = Number(candidate.rating || candidate.rating_avg || 4.5);
      const reliability = Number(candidate.reliability_score || 95);
      const fitnessScore = Math.round(rating * 12 + reliability * 0.4);

      return {
        cook: candidate,
        cookId: candidate.id,
        name: candidate.name,
        photoUrl: candidate.photo_url,
        cuisine: candidate.cuisine,
        rating,
        reliability,
        fitnessScore,
        isAvailable,
        reasons
      };
    })
    .filter((c) => c.isAvailable)
    .sort((a, b) => b.fitnessScore - a.fitnessScore);

  return {
    affectedCount: affectedSessions.length,
    eligibleBackups: eligibleCandidates,
    recommendedBackup: eligibleCandidates[0] || null,
    escalationRequired: eligibleCandidates.length === 0
  };
}
