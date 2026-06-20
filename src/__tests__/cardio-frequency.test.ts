import { describe, expect, it } from 'vitest';

import {
  CARDIO_INTERFERENCE_FLOOR,
  cardioInterference,
  computeCardioFrequency,
} from '@/features/cardio/frequency';

// 2026-06-10 is a Wednesday. Monday-aligned weeks (weekStartsOn: 1):
//   current week : Mon 2026-06-08 .. Sun 2026-06-14
//   prev week    : Mon 2026-06-01 .. Sun 2026-06-07
const TODAY = '2026-06-10';

describe('computeCardioFrequency', () => {
  it('returns zeros with no sessions', () => {
    expect(computeCardioFrequency([], TODAY)).toEqual({
      currentWeekSessions: 0,
      loggedCount: 0,
    });
  });

  it('counts distinct cardio days in the current week', () => {
    const r = computeCardioFrequency(['2026-06-08', '2026-06-09'], TODAY);
    expect(r.currentWeekSessions).toBe(2);
    expect(r.loggedCount).toBe(2);
  });

  it('dedupes two sessions on the same calendar day to one cardio day', () => {
    const r = computeCardioFrequency(
      ['2026-06-09T07:00:00.000Z', '2026-06-09T18:00:00.000Z'],
      TODAY,
    );
    expect(r.currentWeekSessions).toBe(1);
    expect(r.loggedCount).toBe(1);
  });

  it('excludes prior-week sessions from the current-week count but counts them in total', () => {
    const r = computeCardioFrequency(['2026-06-02', '2026-06-09'], TODAY);
    expect(r.currentWeekSessions).toBe(1); // only the 06-09 session is this week
    expect(r.loggedCount).toBe(2);
  });

  it('ignores future-dated sessions (after today)', () => {
    const r = computeCardioFrequency(['2026-06-12', '2026-06-09'], TODAY);
    expect(r.currentWeekSessions).toBe(1);
    expect(r.loggedCount).toBe(1);
  });
});

describe('cardioInterference', () => {
  it('warns when cardio outpaces resistance at or above the floor', () => {
    expect(cardioInterference({ cardioThisWeek: CARDIO_INTERFERENCE_FLOOR, resistanceThisWeek: 1 })).toBe(true);
    expect(cardioInterference({ cardioThisWeek: 5, resistanceThisWeek: 2 })).toBe(true);
  });

  it('does NOT warn below the floor even if cardio outpaces resistance', () => {
    // 2 cardio vs 0 resistance: cardio is ahead, but under the floor (3) so no scary early-week warning.
    expect(cardioInterference({ cardioThisWeek: 2, resistanceThisWeek: 0 })).toBe(false);
  });

  it('does NOT warn when resistance is at least even with cardio', () => {
    expect(cardioInterference({ cardioThisWeek: 4, resistanceThisWeek: 4 })).toBe(false);
    expect(cardioInterference({ cardioThisWeek: 4, resistanceThisWeek: 5 })).toBe(false);
  });

  it('the floor is the documented value', () => {
    expect(CARDIO_INTERFERENCE_FLOOR).toBe(3);
  });
});
