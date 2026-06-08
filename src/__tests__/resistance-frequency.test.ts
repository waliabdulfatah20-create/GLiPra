import { describe, expect, it } from 'vitest';

import {
  computeResistanceFrequency,
  RESISTANCE_WEEKLY_TARGET,
} from '@/features/resistance/frequency';

// 2026-06-10 is a Wednesday. Monday-aligned weeks (weekStartsOn: 1):
//   current week : Mon 2026-06-08 .. Sun 2026-06-14
//   prev week    : Mon 2026-06-01 .. Sun 2026-06-07
//   2 weeks ago  : Mon 2026-05-25 .. Sun 2026-05-31
//   3 weeks ago  : Mon 2026-05-18 .. Sun 2026-05-24
const TODAY = '2026-06-10';

describe('computeResistanceFrequency', () => {
  it('returns all zeros with no sessions', () => {
    expect(computeResistanceFrequency([], TODAY)).toEqual({
      currentWeekSessions: 0,
      weeklyTarget: RESISTANCE_WEEKLY_TARGET,
      currentStreak: 0,
      longestStreak: 0,
      weeksTracked: 0,
      hitRate: 0,
      loggedCount: 0,
    });
  });

  it('counts a single session this week but resolves no past weeks (pending)', () => {
    const r = computeResistanceFrequency(['2026-06-09'], TODAY);
    expect(r.currentWeekSessions).toBe(1);
    expect(r.weeksTracked).toBe(0);
    expect(r.currentStreak).toBe(0);
    expect(r.hitRate).toBe(0);
    expect(r.loggedCount).toBe(1);
  });

  it('does not score the current week even when it has already hit target', () => {
    const r = computeResistanceFrequency(['2026-06-08', '2026-06-10'], TODAY);
    expect(r.currentWeekSessions).toBe(2);
    expect(r.weeksTracked).toBe(0); // current week is pending, not resolved
    expect(r.currentStreak).toBe(0);
  });

  it('dedupes two sessions on the same calendar day to one training day', () => {
    const r = computeResistanceFrequency(
      ['2026-06-09T08:00:00', '2026-06-09T20:00:00'],
      TODAY,
    );
    expect(r.currentWeekSessions).toBe(1);
    expect(r.loggedCount).toBe(1);
  });

  it('builds a clean streak across a perfect run of target-hitting weeks', () => {
    const r = computeResistanceFrequency(
      [
        '2026-05-18',
        '2026-05-20', // 3 weeks ago: 2 days -> hit
        '2026-05-25',
        '2026-05-27', // 2 weeks ago: 2 days -> hit
        '2026-06-01',
        '2026-06-03', // prev week:   2 days -> hit
        '2026-06-09', // current week (pending)
      ],
      TODAY,
    );
    expect(r.weeksTracked).toBe(3);
    expect(r.currentStreak).toBe(3);
    expect(r.longestStreak).toBe(3);
    expect(r.hitRate).toBe(1);
    expect(r.currentWeekSessions).toBe(1);
    expect(r.loggedCount).toBe(7);
  });

  it('breaks the streak and dents the rate on a below-target week', () => {
    const r = computeResistanceFrequency(
      [
        '2026-05-18',
        '2026-05-20', // hit
        '2026-05-25', // 1 day -> miss
        '2026-06-01',
        '2026-06-03', // hit
      ],
      TODAY,
    );
    expect(r.weeksTracked).toBe(3);
    expect(r.currentStreak).toBe(1); // trailing hit at the prev week
    expect(r.longestStreak).toBe(1);
    expect(r.hitRate).toBeCloseTo(2 / 3, 5);
  });

  it('counts a zero-session gap week as a miss', () => {
    const r = computeResistanceFrequency(
      [
        '2026-05-18',
        '2026-05-20', // hit
        // 2 weeks ago: no sessions at all -> miss
        '2026-06-01',
        '2026-06-03', // hit
      ],
      TODAY,
    );
    expect(r.weeksTracked).toBe(3);
    expect(r.hitRate).toBeCloseTo(2 / 3, 5);
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(1);
  });

  it('never penalizes an empty current week', () => {
    const r = computeResistanceFrequency(['2026-06-01', '2026-06-03'], TODAY);
    expect(r.currentWeekSessions).toBe(0);
    expect(r.weeksTracked).toBe(1);
    expect(r.currentStreak).toBe(1);
    expect(r.hitRate).toBe(1);
  });

  it('drops future-dated sessions', () => {
    const r = computeResistanceFrequency(['2026-06-09', '2026-06-20'], TODAY);
    expect(r.loggedCount).toBe(1);
    expect(r.currentWeekSessions).toBe(1);
    expect(r.weeksTracked).toBe(0);
  });

  it('honors a custom weekly target', () => {
    const miss = computeResistanceFrequency(['2026-06-01', '2026-06-03'], TODAY, 3);
    expect(miss.weeklyTarget).toBe(3);
    expect(miss.weeksTracked).toBe(1);
    expect(miss.currentStreak).toBe(0); // 2 days < target 3
    expect(miss.hitRate).toBe(0);

    const hit = computeResistanceFrequency(
      ['2026-06-01', '2026-06-03', '2026-06-05'],
      TODAY,
      3,
    );
    expect(hit.currentStreak).toBe(1); // 3 days == target 3
    expect(hit.hitRate).toBe(1);
  });

  it('clamps a non-positive target to 1', () => {
    const r = computeResistanceFrequency(['2026-06-01'], TODAY, 0);
    expect(r.weeklyTarget).toBe(1);
    expect(r.weeksTracked).toBe(1);
    expect(r.currentStreak).toBe(1); // 1 day >= clamped target 1
  });

  it('splits Sunday and Monday into the correct Monday-aligned weeks', () => {
    // 2026-06-07 (Sun) belongs to the prev week; 2026-06-08 (Mon) to the current week.
    const r = computeResistanceFrequency(['2026-06-07', '2026-06-08'], TODAY);
    expect(r.weeksTracked).toBe(1); // only the prev week is resolved
    expect(r.currentStreak).toBe(0); // prev week had 1 day < target 2 -> miss
    expect(r.currentWeekSessions).toBe(1); // the Monday session
    expect(r.hitRate).toBe(0);
  });

  it('does not let a same-day double-log inflate a resolved week', () => {
    const r = computeResistanceFrequency(
      ['2026-06-01T08:00:00', '2026-06-01T20:00:00', '2026-06-03'],
      TODAY,
    );
    expect(r.loggedCount).toBe(2); // 06-01 (deduped) + 06-03
    expect(r.weeksTracked).toBe(1);
    expect(r.currentStreak).toBe(1); // 2 distinct days == target 2 -> hit
  });
});
