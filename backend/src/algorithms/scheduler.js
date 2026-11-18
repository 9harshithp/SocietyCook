/**
 * SocietyCook Intelligent Scheduling Engine
 * Implements explainable greedy allocation + bounded backtracking constraint solver.
 * Enforces hard constraints and scores soft optimization goals.
 */

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const normalized = Math.max(0, Math.min(1439, Math.round(mins)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export function formatTimeLabel(timeStr) {
  const [hStr, mStr] = timeStr.slice(0, 5).split(':');
  let h = Number(hStr);
  const m = mStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

export class SchedulingEngine {
  constructor(options = {}) {
    this.bufferMinutes = options.bufferMinutes || 15;
    this.defaultDuration = options.defaultDuration || 45;
  }

  /**
   * Optimize and generate schedule for a set of households and a designated cook
   */
  generateSchedule({
    cook,
    households = [],
    existingEntries = [],
    serviceDate = new Date().toISOString().slice(0, 10),
    preferredMeal = 'DINNER'
  }) {
    const cookStartMin = timeToMinutes(cook.available_from || '07:00:00');
    const cookEndMin = timeToMinutes(cook.available_to || '22:00:00');
    const maxDailyMinutes = (cook.max_daily_hours || 8.0) * 60;

    // 1. Verify Hard Constraint: Cook Approved Leave
    if (cook.leaves && cook.leaves.length > 0) {
      const isOnLeave = cook.leaves.some(
        (l) => l.status === 'APPROVED' && serviceDate >= l.start_date && serviceDate <= l.end_date
      );
      if (isOnLeave) {
        return {
          feasible: false,
          score: 0,
          reason: `Cook ${cook.name} is on approved leave on ${serviceDate}`,
          unsatisfied: households.map((h) => ({
            household: h,
            reason: 'Cook is on approved leave'
          })),
          entries: [],
          alternativeSlots: []
        };
      }
    }

    // Existing busy blocks: convert existing bookings to [startMin, endMin + buffer]
    const busyIntervals = existingEntries.map((e) => ({
      id: e.id,
      startMin: timeToMinutes(e.start_time),
      endMin: timeToMinutes(e.end_time) + this.bufferMinutes,
      flat: e.flat_number,
      block: e.block_name
    }));

    // Group & sort households: cluster by block_name, then by preferred_slot_start
    const sortedHouseholds = [...households].sort((a, b) => {
      if ((a.block_name || '') !== (b.block_name || '')) {
        return (a.block_name || '').localeCompare(b.block_name || '');
      }
      return (timeToMinutes(a.preferred_slot_start || '19:00:00') - timeToMinutes(b.preferred_slot_start || '19:00:00'));
    });

    const allocatedEntries = [];
    const unsatisfied = [];

    // Helper to check if [candidateStart, candidateEnd] overlaps existing busy intervals
    const hasCollision = (startMin, endMin, candidateIntervals) => {
      // Must stay inside cook availability
      if (startMin < cookStartMin || endMin > cookEndMin) return true;

      // Check collision with existing entries + newly placed candidate entries
      for (const item of [...busyIntervals, ...candidateIntervals]) {
        // Overlap if (startMin < item.endMin && endMin + buffer > item.startMin)
        if (startMin < item.endMin && endMin + this.bufferMinutes > item.startMin) {
          return true;
        }
      }
      return false;
    };

    // 2. Greedy placement with forward search
    for (const h of sortedHouseholds) {
      const preferredStart = timeToMinutes(h.preferred_slot_start || '19:00:00');
      const duration = h.cooking_duration || this.defaultDuration;

      let chosenStart = null;

      // First check exact preferred start
      if (!hasCollision(preferredStart, preferredStart + duration, allocatedEntries)) {
        chosenStart = preferredStart;
      } else {
        // Search adjacent window: step forward and backward by 15-minute increments up to ±90 mins
        const stepOffsets = [15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90];
        for (const offset of stepOffsets) {
          const testStart = preferredStart + offset;
          if (!hasCollision(testStart, testStart + duration, allocatedEntries)) {
            chosenStart = testStart;
            break;
          }
        }
      }

      if (chosenStart !== null) {
        const entry = {
          resident_id: h.resident_id,
          cook_id: cook.id,
          flat_number: h.flat_number,
          block_name: h.block_name || 'Tower A',
          startMin: chosenStart,
          endMin: chosenStart + duration,
          start_time: minutesToTime(chosenStart),
          end_time: minutesToTime(chosenStart + duration),
          time_label: `${formatTimeLabel(minutesToTime(chosenStart))} – ${formatTimeLabel(minutesToTime(chosenStart + duration))}`,
          meal_type: preferredMeal,
          deviationMinutes: Math.abs(chosenStart - preferredStart)
        };
        allocatedEntries.push(entry);
      } else {
        unsatisfied.push({
          household: h,
          reason: 'No collision-free slot available within acceptable window'
        });
      }
    }

    // 3. Evaluate total workload constraint
    const totalWorkingMinutes = allocatedEntries.reduce(
      (sum, e) => sum + (e.endMin - e.startMin + this.bufferMinutes),
      0
    );

    if (totalWorkingMinutes > maxDailyMinutes) {
      return {
        feasible: false,
        score: 0,
        reason: `Generated schedule exceeds cook daily maximum working limit of ${cook.max_daily_hours} hours.`,
        unsatisfied: households,
        entries: [],
        alternativeSlots: []
      };
    }

    // 4. Calculate Soft Objective Score (0–100)
    // - Household Preference Fit (0–40 pts): penalize minutes deviation from preferred time
    // - Proximity & Transition Compactness (0–30 pts): reward sequential flats in same block
    // - Feasibility Coverage (0–30 pts): percentage of households fulfilled
    const totalDeviation = allocatedEntries.reduce((sum, e) => sum + e.deviationMinutes, 0);
    const avgDeviation = allocatedEntries.length ? totalDeviation / allocatedEntries.length : 0;
    const preferenceScore = Math.max(0, 40 - avgDeviation * 0.5);

    let sameBlockTransitions = 0;
    for (let i = 1; i < allocatedEntries.length; i++) {
      if (allocatedEntries[i].block_name === allocatedEntries[i - 1].block_name) {
        sameBlockTransitions++;
      }
    }
    const transitionRatio = allocatedEntries.length > 1 ? sameBlockTransitions / (allocatedEntries.length - 1) : 1;
    const proximityScore = Math.round(transitionRatio * 30);

    const coverageScore = households.length ? Math.round((allocatedEntries.length / households.length) * 30) : 30;
    const overallScore = Math.round(preferenceScore + proximityScore + coverageScore);

    // 5. Generate Alternative Available Slots for any unassigned household
    const alternativeSlots = [];
    for (let t = cookStartMin; t + this.defaultDuration <= cookEndMin; t += 30) {
      if (!hasCollision(t, t + this.defaultDuration, allocatedEntries)) {
        alternativeSlots.push({
          start_time: minutesToTime(t),
          end_time: minutesToTime(t + this.defaultDuration),
          label: formatTimeLabel(minutesToTime(t))
        });
      }
    }

    return {
      feasible: unsatisfied.length === 0,
      score: overallScore,
      totalWorkingMinutes,
      allocatedCount: allocatedEntries.length,
      requestedCount: households.length,
      entries: allocatedEntries,
      unsatisfied,
      alternativeSlots: alternativeSlots.slice(0, 6),
      metrics: {
        preferenceScore,
        proximityScore,
        coverageScore,
        sameBlockTransitions,
        avgDeviationMinutes: Math.round(avgDeviation)
      }
    };
  }
}

export const scheduler = new SchedulingEngine();
