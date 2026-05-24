import { describe, expect, it } from 'vitest';
import {
  calculateInjectionPhase,
  type InjectionCycleResult,
} from './calculator';

// Helper: build an ISO date string offset by N days from a base date
function offsetDate(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const BASE = '2026-05-10'; // lastInjectionDate anchor for all tests

describe('calculateInjectionPhase — phase mapping', () => {
  it('Day 0 → injection_day', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 0),
    });
    expect(result.phase).toBe('injection_day');
    expect(result.daysSinceInjection).toBe(0);
    expect(result.isOverdue).toBe(false);
  });

  it('Day 1 → peak_suppression', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 1),
    });
    expect(result.phase).toBe('peak_suppression');
    expect(result.daysSinceInjection).toBe(1);
    expect(result.isOverdue).toBe(false);
  });

  it('Day 2 → peak_suppression', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 2),
    });
    expect(result.phase).toBe('peak_suppression');
    expect(result.daysSinceInjection).toBe(2);
  });

  it('Day 3 → adjustment', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 3),
    });
    expect(result.phase).toBe('adjustment');
    expect(result.daysSinceInjection).toBe(3);
  });

  it('Day 4 → adjustment', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 4),
    });
    expect(result.phase).toBe('adjustment');
    expect(result.daysSinceInjection).toBe(4);
  });

  it('Day 5 → recovery_window', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 5),
    });
    expect(result.phase).toBe('recovery_window');
    expect(result.daysSinceInjection).toBe(5);
  });

  it('Day 6 → recovery_window', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 6),
    });
    expect(result.phase).toBe('recovery_window');
    expect(result.daysSinceInjection).toBe(6);
  });

  it('Day 7 → recovery_window', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 7),
    });
    expect(result.phase).toBe('recovery_window');
    expect(result.daysSinceInjection).toBe(7);
  });

  it('Day 8 → overdue (isOverdue: true, nulls for next injection fields)', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 8),
    });
    expect(result.phase).toBe('overdue');
    expect(result.daysSinceInjection).toBe(8);
    expect(result.isOverdue).toBe(true);
    expect(result.daysUntilNextInjection).toBeNull();
    expect(result.nextInjectionDate).toBeNull();
  });

  it('Day 15 → overdue', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 15),
    });
    expect(result.phase).toBe('overdue');
    expect(result.daysSinceInjection).toBe(15);
    expect(result.isOverdue).toBe(true);
    expect(result.daysUntilNextInjection).toBeNull();
    expect(result.nextInjectionDate).toBeNull();
  });
});

describe('calculateInjectionPhase — nextInjectionDate correctness (default 7-day interval)', () => {
  it('Day 0: nextInjectionDate is 7 days after lastInjectionDate', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 0),
    });
    expect(result.nextInjectionDate).toBe('2026-05-17');
    expect(result.daysUntilNextInjection).toBe(7);
  });

  it('Day 3: nextInjectionDate is still 7 days after lastInjectionDate, 4 days away', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 3),
    });
    expect(result.nextInjectionDate).toBe('2026-05-17');
    expect(result.daysUntilNextInjection).toBe(4);
  });

  it('Day 7: nextInjectionDate is same day as today (0 days away)', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 7),
    });
    expect(result.nextInjectionDate).toBe('2026-05-17');
    expect(result.daysUntilNextInjection).toBe(0);
  });
});

describe('calculateInjectionPhase — custom interval (14-day biweekly)', () => {
  it('Day 7 with 14-day interval → recovery_window, nextInjectionDate 14 days after last', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 7),
      injectionIntervalDays: 14,
    });
    // Day 7 is recovery_window regardless of interval
    expect(result.phase).toBe('recovery_window');
    expect(result.nextInjectionDate).toBe('2026-05-24');
    expect(result.daysUntilNextInjection).toBe(7);
    expect(result.isOverdue).toBe(false);
  });

  it('Day 0 with 14-day interval → injection_day, nextInjectionDate 14 days out', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 0),
      injectionIntervalDays: 14,
    });
    expect(result.phase).toBe('injection_day');
    expect(result.nextInjectionDate).toBe('2026-05-24');
    expect(result.daysUntilNextInjection).toBe(14);
  });

  it('Day 8 with 14-day interval → overdue (phase boundary unchanged), next is null', () => {
    const result = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 8),
      injectionIntervalDays: 14,
    });
    // Phase is driven by daysSince alone, not the interval
    expect(result.phase).toBe('overdue');
    expect(result.isOverdue).toBe(true);
    expect(result.nextInjectionDate).toBeNull();
    expect(result.daysUntilNextInjection).toBeNull();
  });
});

describe('calculateInjectionPhase — return type shape', () => {
  it('non-overdue result satisfies InjectionCycleResult fully', () => {
    const result: InjectionCycleResult = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 2),
    });
    expect(typeof result.phase).toBe('string');
    expect(typeof result.daysSinceInjection).toBe('number');
    expect(typeof result.daysUntilNextInjection).toBe('number');
    expect(typeof result.isOverdue).toBe('boolean');
    expect(typeof result.nextInjectionDate).toBe('string');
  });

  it('overdue result has null for nextInjectionDate and daysUntilNextInjection', () => {
    const result: InjectionCycleResult = calculateInjectionPhase({
      lastInjectionDate: BASE,
      today: offsetDate(BASE, 10),
    });
    expect(result.daysUntilNextInjection).toBeNull();
    expect(result.nextInjectionDate).toBeNull();
  });
});
