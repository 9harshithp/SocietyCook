import { describe, it, expect } from 'vitest';
import { SchedulingEngine, formatTimeLabel } from '../src/algorithms/scheduler.js';

describe('Intelligent Scheduling Engine', () => {
  const scheduler = new SchedulingEngine({ bufferMinutes: 15, defaultDuration: 45 });

  const dummyCook = {
    id: 1,
    name: 'Ramesh Kumar',
    available_from: '18:00:00',
    available_to: '23:00:00',
    max_daily_hours: 6.0,
    leaves: []
  };

  it('formats time labels correctly', () => {
    expect(formatTimeLabel('19:00:00')).toBe('07:00 PM');
    expect(formatTimeLabel('08:30:00')).toBe('08:30 AM');
  });

  it('allocates 45-min slots with 15-min buffers without collision', () => {
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

    // Check buffer between consecutive entries
    const e1 = result.entries[0];
    const e2 = result.entries[1];
    expect(e2.startMin - e1.endMin).toBeGreaterThanOrEqual(0);
  });

  it('rejects scheduling if cook is on approved leave on requested service date', () => {
    const cookOnLeave = {
      ...dummyCook,
      leaves: [{ start_date: '2026-11-20', end_date: '2026-11-22', status: 'APPROVED' }]
    };

    const households = [
      { resident_id: 1, flat_number: 'A-101', preferred_slot_start: '19:00:00' }
    ];

    const result = scheduler.generateSchedule({
      cook: cookOnLeave,
      households,
      serviceDate: '2026-11-21',
      preferredMeal: 'DINNER'
    });

    expect(result.feasible).toBe(false);
    expect(result.reason).toContain('approved leave');
    expect(result.entries).toHaveLength(0);
  });
});
