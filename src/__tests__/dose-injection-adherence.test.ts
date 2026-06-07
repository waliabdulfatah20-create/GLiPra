import { describe, expect, it } from 'vitest';

import {
  computeInjectionAdherence,
  deriveInjectionIntervalDays,
  deriveLastInjectionDate,
} from '@/features/dose/injection-adherence';

const TODAY = '2026-06-07'; // a Sunday

describe('deriveInjectionIntervalDays', () => {
  it('defaults to weekly with fewer than 2 distinct days', () => {
    expect(deriveInjectionIntervalDays([])).toBe(7);
    expect(deriveInjectionIntervalDays(['2026-06-01', '2026-06-01'])).toBe(7);
  });

  it('detects daily', () => {
    expect(deriveInjectionIntervalDays(['2026-06-07', '2026-06-06'])).toBe(1);
  });

  it('detects weekly', () => {
    expect(deriveInjectionIntervalDays(['2026-06-07', '2026-05-31'])).toBe(7);
  });

  it('detects biweekly', () => {
    expect(deriveInjectionIntervalDays(['2026-06-07', '2026-05-24'])).toBe(14);
  });

  it('uses the two most recent distinct days regardless of input order', () => {
    expect(
      deriveInjectionIntervalDays(['2026-05-24', '2026-06-07', '2026-05-31']),
    ).toBe(7);
  });

  it('tolerates ISO timestamps', () => {
    expect(
      deriveInjectionIntervalDays([
        '2026-06-07T08:00:00.000Z',
        '2026-05-31T09:30:00.000Z',
      ]),
    ).toBe(7);
  });
});

describe('computeInjectionAdherence', () => {
  it('returns all zeros with no logs', () => {
    expect(computeInjectionAdherence([], 7, TODAY)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      onTimeRate: 0,
      expectedCount: 0,
      loggedCount: 0,
    });
  });

  it('guards a non-positive interval', () => {
    expect(computeInjectionAdherence(['2026-06-07'], 0, TODAY).expectedCount).toBe(0);
  });

  it('scores a single dose today as a perfect 1-week streak', () => {
    const r = computeInjectionAdherence(['2026-06-07'], 7, TODAY);
    expect(r).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      onTimeRate: 1,
      expectedCount: 1,
      loggedCount: 1,
    });
  });

  it('builds a clean streak across a perfect weekly run', () => {
    // 5 weekly doses ending today.
    const dates = ['2026-05-10', '2026-05-17', '2026-05-24', '2026-05-31', '2026-06-07'];
    const r = computeInjectionAdherence(dates, 7, TODAY);
    expect(r.loggedCount).toBe(5);
    expect(r.expectedCount).toBe(5);
    expect(r.onTimeRate).toBe(1);
    expect(r.currentStreak).toBe(5);
    expect(r.longestStreak).toBe(5);
  });

  it('counts a dose within the +/-1 day grace as on-time (late)', () => {
    // Second dose a day late (expected 2026-05-17, logged 2026-05-18).
    const dates = ['2026-05-10', '2026-05-18', '2026-05-24', '2026-05-31', '2026-06-07'];
    const r = computeInjectionAdherence(dates, 7, TODAY);
    expect(r.onTimeRate).toBe(1);
    expect(r.currentStreak).toBe(5);
  });

  it('counts a dose a day early as on-time', () => {
    const dates = ['2026-05-10', '2026-05-16', '2026-05-24', '2026-05-31', '2026-06-07'];
    const r = computeInjectionAdherence(dates, 7, TODAY);
    expect(r.onTimeRate).toBe(1);
  });

  it('breaks the streak and dents the rate on a fully-missed week', () => {
    // Missing the 2026-05-24 dose entirely (gap > grace).
    const dates = ['2026-05-10', '2026-05-17', '2026-05-31', '2026-06-07'];
    const r = computeInjectionAdherence(dates, 7, TODAY);
    // expected: 05-10, 05-17, 05-24(miss), 05-31, 06-07 => 5 slots, 4 hits
    expect(r.expectedCount).toBe(5);
    expect(r.onTimeRate).toBeCloseTo(4 / 5, 5);
    expect(r.longestStreak).toBe(2); // 05-31 + 06-07
    expect(r.currentStreak).toBe(2);
  });

  it('does not penalize the current open period (pending slot skipped)', () => {
    // Last dose 6 days ago; the next weekly slot is due ~tomorrow (still open).
    // Expected slots up to today: 05-25, 06-01 (both hit). The 06-08 slot is future.
    const dates = ['2026-05-25', '2026-06-01'];
    const r = computeInjectionAdherence(dates, 7, TODAY);
    expect(r.expectedCount).toBe(2);
    expect(r.onTimeRate).toBe(1);
    expect(r.currentStreak).toBe(2);
  });

  it('treats a long-overdue current slot as missed once grace passes', () => {
    // Last dose 10 days ago, weekly: the slot at +7 (3 days ago) is now missed.
    const dates = ['2026-05-28']; // expected 05-28 (hit), 06-04 (missed, today-3 > grace)
    const r = computeInjectionAdherence(dates, 7, TODAY);
    expect(r.expectedCount).toBe(2);
    expect(r.onTimeRate).toBeCloseTo(1 / 2, 5);
    expect(r.currentStreak).toBe(0); // trailing slot is a miss
    expect(r.longestStreak).toBe(1);
  });

  it('drops future-dated logs', () => {
    const dates = ['2026-06-07', '2026-06-21'];
    const r = computeInjectionAdherence(dates, 7, TODAY);
    expect(r.loggedCount).toBe(1);
  });

  it('dedupes multiple logs on the same calendar day', () => {
    const dates = [
      '2026-06-07T08:00:00.000Z',
      '2026-06-07T20:00:00.000Z',
    ];
    expect(computeInjectionAdherence(dates, 7, TODAY).loggedCount).toBe(1);
  });

  it('handles a daily interval', () => {
    const dates = ['2026-06-05', '2026-06-06', '2026-06-07'];
    const r = computeInjectionAdherence(dates, 1, TODAY);
    expect(r.expectedCount).toBe(3);
    expect(r.currentStreak).toBe(3);
    expect(r.onTimeRate).toBe(1);
  });
});

describe('deriveLastInjectionDate', () => {
  it('returns null with no dates', () => {
    expect(deriveLastInjectionDate([])).toBeNull();
  });

  it('returns the most recent calendar day', () => {
    expect(
      deriveLastInjectionDate(['2026-05-31', '2026-06-07T08:00:00.000Z', '2026-05-24']),
    ).toBe('2026-06-07');
  });
});
