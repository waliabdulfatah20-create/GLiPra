import type { ResistanceFrequencyResult } from '@/features/resistance/frequency';
import { describe, expect, it } from 'vitest';
import { deriveResistanceInput } from '@/features/muscle-score/resistance-input';

// Fixture — a ResistanceFrequencyResult with sensible zeros; each test sets only
// the fields deriveResistanceInput reads (weeksTracked, hitRate, currentWeekSessions, weeklyTarget).
function makeFreq(overrides: Partial<ResistanceFrequencyResult> = {}): ResistanceFrequencyResult {
  return {
    currentWeekSessions: 0,
    weeklyTarget: 2,
    currentStreak: 0,
    longestStreak: 0,
    weeksTracked: 0,
    hitRate: 0,
    loggedCount: 0,
    ...overrides,
  };
}

describe('deriveResistanceInput', () => {
  it('stays untracked (null) when there is no resistance data at all', () => {
    expect(deriveResistanceInput(makeFreq())).toEqual({ adherence: null, weeksTracked: 0 });
  });

  it('counts a met current week with no resolved weeks (the reported bug: 3 sessions this week)', () => {
    // 3 sessions this week, target 2, nothing resolved yet -> full credit, tracked.
    expect(deriveResistanceInput(makeFreq({ currentWeekSessions: 3, weeklyTarget: 2 })))
      .toEqual({ adherence: 1, weeksTracked: 1 });
  });

  it('counts the current week at exactly target as a full hit', () => {
    expect(deriveResistanceInput(makeFreq({ currentWeekSessions: 2, weeklyTarget: 2 })))
      .toEqual({ adherence: 1, weeksTracked: 1 });
  });

  it('gives partial credit for an in-progress week below target (and still tracks it)', () => {
    expect(deriveResistanceInput(makeFreq({ currentWeekSessions: 1, weeklyTarget: 2 })))
      .toEqual({ adherence: 0.5, weeksTracked: 1 });
  });

  it('uses resolved weeks unchanged when the current week has no sessions', () => {
    // 2 resolved weeks, 1 hit (hitRate 0.5), current week empty -> old behavior.
    expect(deriveResistanceInput(makeFreq({ weeksTracked: 2, hitRate: 0.5, currentWeekSessions: 0 })))
      .toEqual({ adherence: 0.5, weeksTracked: 2 });
  });

  it('blends resolved weeks with a met current week', () => {
    // 2 resolved (1 hit) + current week met -> (1 + 1) / 3.
    const r = deriveResistanceInput(makeFreq({
      weeksTracked: 2,
      hitRate: 0.5,
      currentWeekSessions: 3,
      weeklyTarget: 2,
    }));
    expect(r.weeksTracked).toBe(3);
    expect(r.adherence).toBeCloseTo(2 / 3, 10);
  });

  it('blends all-hit resolved weeks with a met current week to 1.0', () => {
    expect(deriveResistanceInput(makeFreq({
      weeksTracked: 2,
      hitRate: 1,
      currentWeekSessions: 2,
      weeklyTarget: 2,
    }))).toEqual({ adherence: 1, weeksTracked: 3 });
  });

  it('guards a zero weekly target (no divide-by-zero)', () => {
    expect(deriveResistanceInput(makeFreq({ currentWeekSessions: 1, weeklyTarget: 0 })))
      .toEqual({ adherence: 1, weeksTracked: 1 });
  });
});
