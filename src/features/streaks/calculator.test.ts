import { describe, expect, it } from 'vitest';

import {
  STREAK_THRESHOLD,
  calculateStreaks,
} from '@/features/streaks/calculator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a StreakDayInput that meets the threshold. */
function passing(date: string, floor = 100): { date: string; proteinConsumedG: number; proteinFloorG: number } {
  return { date, proteinConsumedG: floor, proteinFloorG: floor }; // 100% → passes
}

/** Build a StreakDayInput that is exactly at the threshold. */
function atThreshold(date: string, floor = 100): { date: string; proteinConsumedG: number; proteinFloorG: number } {
  return { date, proteinConsumedG: floor * STREAK_THRESHOLD, proteinFloorG: floor };
}

/** Build a StreakDayInput that is just below the threshold. */
function failing(date: string, floor = 100): { date: string; proteinConsumedG: number; proteinFloorG: number } {
  return { date, proteinConsumedG: floor * STREAK_THRESHOLD - 0.01, proteinFloorG: floor };
}

// ─── Empty input ──────────────────────────────────────────────────────────────

describe('calculateStreaks — empty input', () => {
  it('returns all zeros and nulls for an empty array', () => {
    const result = calculateStreaks([], '2024-01-10');
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      todayCountsAsStreak: false,
    });
  });
});

// ─── Single-day edge cases ────────────────────────────────────────────────────

describe('calculateStreaks — single day', () => {
  it('single day below threshold → streak 0', () => {
    const result = calculateStreaks([failing('2024-01-10')], '2024-01-10');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.lastStreakDate).toBeNull();
    expect(result.todayCountsAsStreak).toBe(false);
  });

  it('single day exactly at threshold (0.80) → streak 1', () => {
    const result = calculateStreaks([atThreshold('2024-01-10')], '2024-01-10');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastStreakDate).toBe('2024-01-10');
    expect(result.todayCountsAsStreak).toBe(true);
  });

  it('single passing day → streak 1', () => {
    const result = calculateStreaks([passing('2024-01-10')], '2024-01-10');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastStreakDate).toBe('2024-01-10');
    expect(result.todayCountsAsStreak).toBe(true);
  });
});

// ─── Consecutive streaks ──────────────────────────────────────────────────────

describe('calculateStreaks — consecutive days', () => {
  it('3 consecutive days all above threshold → currentStreak 3, longestStreak 3', () => {
    const days = [
      passing('2024-01-08'),
      passing('2024-01-09'),
      passing('2024-01-10'),
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.lastStreakDate).toBe('2024-01-10');
    expect(result.todayCountsAsStreak).toBe(true);
  });
});

// ─── Gap in streak ────────────────────────────────────────────────────────────

describe('calculateStreaks — gap in streak', () => {
  it('5 days with gap on day 3 → currentStreak is 2 (last 2 days), longestStreak is 2', () => {
    // Days 1-2 pass, day 3 fails (gap), days 4-5 pass.
    const days = [
      passing('2024-01-06'),
      passing('2024-01-07'),
      failing('2024-01-08'),  // gap — breaks the run
      passing('2024-01-09'),
      passing('2024-01-10'),
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.lastStreakDate).toBe('2024-01-10');
    expect(result.todayCountsAsStreak).toBe(true);
  });

  it('gap via missing entry also breaks the streak', () => {
    // Day 8 is simply absent — counts as a gap.
    const days = [
      passing('2024-01-06'),
      passing('2024-01-07'),
      // 2024-01-08 missing
      passing('2024-01-09'),
      passing('2024-01-10'),
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });
});

// ─── Streak still live when last qualifying day was yesterday ─────────────────

describe('calculateStreaks — streak live vs dead', () => {
  it('last streak day was yesterday, no today entry → currentStreak still live', () => {
    const days = [
      passing('2024-01-08'),
      passing('2024-01-09'), // yesterday relative to today=2024-01-10
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(2);
    expect(result.todayCountsAsStreak).toBe(false);
  });

  it('last streak day was 2 days ago, no today entry → currentStreak 0', () => {
    const days = [
      passing('2024-01-07'),
      passing('2024-01-08'), // 2 days before today=2024-01-10
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2); // historical max preserved
    expect(result.todayCountsAsStreak).toBe(false);
  });
});

// ─── proteinFloorG === 0 ──────────────────────────────────────────────────────

describe('calculateStreaks — zero floor', () => {
  it('proteinFloorG === 0 means day never counts, even with high consumed', () => {
    const days = [
      { date: '2024-01-10', proteinConsumedG: 200, proteinFloorG: 0 },
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.lastStreakDate).toBeNull();
    expect(result.todayCountsAsStreak).toBe(false);
  });

  it('negative proteinFloorG also means day never counts', () => {
    const days = [
      { date: '2024-01-10', proteinConsumedG: 200, proteinFloorG: -10 },
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });
});

// ─── Future dates ─────────────────────────────────────────────────────────────

describe('calculateStreaks — future dates excluded', () => {
  it('entries with date > today are ignored', () => {
    const days = [
      passing('2024-01-10'),
      passing('2024-01-11'), // future
      passing('2024-01-12'), // future
    ];
    const result = calculateStreaks(days, '2024-01-10');
    // Only 2024-01-10 counts
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastStreakDate).toBe('2024-01-10');
  });

  it('all entries are in the future → returns empty result', () => {
    const days = [
      passing('2024-01-11'),
      passing('2024-01-12'),
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      todayCountsAsStreak: false,
    });
  });
});

// ─── todayCountsAsStreak ─────────────────────────────────────────────────────

describe('calculateStreaks — todayCountsAsStreak', () => {
  it('todayCountsAsStreak true when today meets threshold', () => {
    const result = calculateStreaks([passing('2024-01-10')], '2024-01-10');
    expect(result.todayCountsAsStreak).toBe(true);
  });

  it('todayCountsAsStreak false when today is below threshold', () => {
    const result = calculateStreaks([failing('2024-01-10')], '2024-01-10');
    expect(result.todayCountsAsStreak).toBe(false);
  });

  it('todayCountsAsStreak false when today has no entry', () => {
    const result = calculateStreaks([passing('2024-01-09')], '2024-01-10');
    expect(result.todayCountsAsStreak).toBe(false);
  });
});

// ─── longestStreak across multiple runs ───────────────────────────────────────

describe('calculateStreaks — longestStreak', () => {
  it('correctly tracks historical max across multiple streak runs', () => {
    // Run 1: 3 days; gap; Run 2: 2 days; gap; Run 3: 4 days (most recent)
    const days = [
      passing('2024-01-01'),
      passing('2024-01-02'),
      passing('2024-01-03'),
      // gap
      passing('2024-01-05'),
      passing('2024-01-06'),
      // gap
      passing('2024-01-08'),
      passing('2024-01-09'),
      passing('2024-01-10'),
      passing('2024-01-11'),
    ];
    const result = calculateStreaks(days, '2024-01-11');
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(4);
  });

  it('longestStreak equals the historical best even when current streak is shorter', () => {
    const days = [
      passing('2024-01-01'),
      passing('2024-01-02'),
      passing('2024-01-03'),
      passing('2024-01-04'), // best run = 4
      // gap on 2024-01-05
      passing('2024-01-06'), // new run starts — only 1 day
    ];
    const result = calculateStreaks(days, '2024-01-06');
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(1);
  });
});

// ─── STREAK_THRESHOLD constant ────────────────────────────────────────────────

describe('STREAK_THRESHOLD', () => {
  it('is exported and equals 0.80', () => {
    expect(STREAK_THRESHOLD).toBe(0.8);
  });
});

// ─── Unsorted input ───────────────────────────────────────────────────────────

describe('calculateStreaks — input order', () => {
  it('handles input entries in non-chronological order', () => {
    const days = [
      passing('2024-01-10'),
      passing('2024-01-08'),
      passing('2024-01-09'),
    ];
    const result = calculateStreaks(days, '2024-01-10');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });
});
