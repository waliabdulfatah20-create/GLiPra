import { describe, expect, it } from 'vitest';
import {
  estimateLevel,
  FALLBACK_HALF_LIFE,
  generateLevelCurve,
  generateSteadyStateCurve,
  HALF_LIVES,
} from '@/features/medication-level/calculator';

describe('estimateLevel', () => {
  it('returns 0 when doseMg is 0', () => {
    expect(estimateLevel(0, 5, 'semaglutide_ozempic')).toBe(0);
  });

  it('returns full dose at day 0', () => {
    expect(estimateLevel(1.0, 0, 'semaglutide_ozempic')).toBe(1.0);
  });

  it('returns half dose after one half-life — semaglutide 7d', () => {
    expect(estimateLevel(2.0, 7, 'semaglutide_ozempic')).toBeCloseTo(1.0, 5);
  });

  it('returns half dose after one half-life — tirzepatide 5d', () => {
    expect(estimateLevel(10, 5, 'tirzepatide_mounjaro')).toBeCloseTo(5.0, 5);
  });

  it('returns half dose after one half-life — liraglutide 0.5d', () => {
    expect(estimateLevel(1.8, 0.5, 'liraglutide_saxenda')).toBeCloseTo(0.9, 5);
  });

  it('uses fallback half-life for unknown medication', () => {
    expect(estimateLevel(4.0, 7, 'unknown_med')).toBeCloseTo(2.0, 5);
  });

  it('approaches 0 after many half-lives', () => {
    expect(estimateLevel(2.0, 70, 'semaglutide_ozempic')).toBeLessThan(0.002);
  });

  it('compounded medications use correct half-lives', () => {
    expect(HALF_LIVES.compounded_semaglutide).toBe(7);
    expect(HALF_LIVES.compounded_tirzepatide).toBe(5);
    expect(HALF_LIVES.compounded_glp1_gip).toBe(5);
  });
});

describe('generateLevelCurve', () => {
  it('returns daysToProject+1 points', () => {
    expect(generateLevelCurve(1.0, 'semaglutide_ozempic', 14)).toHaveLength(15);
  });

  it('first point is { day: 0, levelMg: doseMg }', () => {
    const curve = generateLevelCurve(2.4, 'semaglutide_ozempic', 7);
    expect(curve[0]).toEqual({ day: 0, levelMg: 2.4 });
  });

  it('is monotonically decreasing for a single dose', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic', 14);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].levelMg).toBeLessThan(curve[i - 1].levelMg);
    }
  });

  it('defaults to 14 days (15 points)', () => {
    expect(generateLevelCurve(1.0, 'semaglutide_ozempic')).toHaveLength(15);
  });

  it('day field equals index', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic', 5);
    expect(curve.map(p => p.day)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('generateSteadyStateCurve', () => {
  const TODAY = '2026-05-28';
  const LAST_INJ = '2026-05-28';

  it('every point has date, dayOffset, levelMg', () => {
    const curve = generateSteadyStateCurve(1.0, 'semaglutide_ozempic', LAST_INJ, 7, TODAY);
    for (const p of curve) {
      expect(p).toHaveProperty('date');
      expect(p).toHaveProperty('dayOffset');
      expect(p).toHaveProperty('levelMg');
    }
  });

  it('today point (dayOffset=0) exists with positive level', () => {
    const curve = generateSteadyStateCurve(2.0, 'semaglutide_ozempic', LAST_INJ, 7, TODAY);
    const today = curve.find(p => p.dayOffset === 0);
    expect(today).toBeDefined();
    expect(today!.levelMg).toBeGreaterThan(0);
  });

  it('steady-state (multi-dose) level is higher than single dose at injection time', () => {
    const dose = 1.0;
    const curve = generateSteadyStateCurve(dose, 'semaglutide_ozempic', LAST_INJ, 7, TODAY);
    const today = curve.find(p => p.dayOffset === 0);
    expect(today!.levelMg).toBeGreaterThan(dose);
  });

  it('projects the requested future days', () => {
    const curve = generateSteadyStateCurve(1.0, 'semaglutide_ozempic', LAST_INJ, 7, TODAY, 14);
    const maxOffset = Math.max(...curve.map(p => p.dayOffset));
    expect(maxOffset).toBe(14);
  });

  it('covers past window', () => {
    const curve = generateSteadyStateCurve(1.0, 'semaglutide_ozempic', LAST_INJ, 7, TODAY, 7, 10);
    const minOffset = Math.min(...curve.map(p => p.dayOffset));
    expect(minOffset).toBeLessThanOrEqual(-9);
  });

  it('works for daily injection (liraglutide)', () => {
    const curve = generateSteadyStateCurve(1.8, 'liraglutide_saxenda', LAST_INJ, 1, TODAY);
    const today = curve.find(p => p.dayOffset === 0);
    expect(today).toBeDefined();
    expect(today!.levelMg).toBeGreaterThan(0);
  });

  it('models the oral daily curve (normalized dose) accumulating to steady state', () => {
    // Mirrors the oral PK curve: daily dosing of oral semaglutide (Rybelsus, t½ 7d)
    // with a normalized unit dose and real logged dates. Steady state from ~14 days
    // of daily dosing should sit well above a single dose, and today must be positive.
    const TODAY_ORAL = '2026-06-06';
    const dailyDates: string[] = [];
    for (let i = 0; i <= 14; i++) {
      const d = new Date(Date.UTC(2026, 4, 23) + i * 86400000);
      dailyDates.push(d.toISOString().slice(0, 10));
    }
    const lastDate = dailyDates[dailyDates.length - 1];
    const curve = generateSteadyStateCurve(
      1, // NORMALIZED_ORAL_DOSE
      'semaglutide_rybelsus',
      lastDate,
      1, // daily
      TODAY_ORAL,
      14,
      undefined,
      dailyDates,
    );
    const today = curve.find(p => p.dayOffset === 0);
    expect(today).toBeDefined();
    expect(today!.levelMg).toBeGreaterThan(1); // accumulated above a single unit dose
    expect(curve.every(p => p.levelMg >= 0)).toBe(true);
  });

  it('all dates are YYYY-MM-DD', () => {
    const curve = generateSteadyStateCurve(1.0, 'semaglutide_ozempic', LAST_INJ, 7, TODAY);
    for (const p of curve) {
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('levelMg is always non-negative', () => {
    const curve = generateSteadyStateCurve(2.4, 'semaglutide_ozempic', LAST_INJ, 7, TODAY);
    for (const p of curve) {
      expect(p.levelMg).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('constants', () => {
  it('fALLBACK_HALF_LIFE is 7', () => {
    expect(FALLBACK_HALF_LIFE).toBe(7);
  });

  it('semaglutide half-life is 7', () => {
    expect(HALF_LIVES.semaglutide_ozempic).toBe(7);
    expect(HALF_LIVES.semaglutide_wegovy).toBe(7);
  });

  it('tirzepatide half-life is 5', () => {
    expect(HALF_LIVES.tirzepatide_mounjaro).toBe(5);
    expect(HALF_LIVES.tirzepatide_zepbound).toBe(5);
  });

  it('dulaglutide half-life is 4.5', () => {
    expect(HALF_LIVES.dulaglutide_trulicity).toBe(4.5);
  });
});

describe('generateSteadyStateCurve — actualInjectionDates', () => {
  const TODAY = '2026-05-28';

  it('no phantom peaks before first injection', () => {
    const actual = ['2026-05-23', '2026-05-16', '2026-05-09'];
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      '2026-05-23',
      7,
      TODAY,
      14,
      26,
      actual,
    );
    // May 8 is one day before first shot — must be 0
    const before = curve.find(p => p.date === '2026-05-08');
    expect(before?.levelMg).toBe(0);
  });

  it('single injection: today level equals doseMg', () => {
    const curve = generateSteadyStateCurve(
      2.0,
      'semaglutide_ozempic',
      TODAY,
      7,
      TODAY,
      7,
      7,
      [TODAY],
    );
    const today = curve.find(p => p.dayOffset === 0);
    expect(today?.levelMg).toBeCloseTo(2.0, 5);
  });

  it('accumulates level across multiple actual injections', () => {
    const actual = ['2026-05-23', '2026-05-16', '2026-05-09'];
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      '2026-05-23',
      7,
      TODAY,
      14,
      28,
      actual,
    );
    const today = curve.find(p => p.dayOffset === 0);
    expect(today?.levelMg).toBeGreaterThan(0);
    expect(today?.levelMg).toBeLessThan(3);
  });

  it('empty actualInjectionDates produces all-zero levels', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      TODAY,
      7,
      TODAY,
      7,
      7,
      [],
    );
    for (const p of curve) {
      expect(p.levelMg).toBe(0);
    }
  });

  it('dedupes same-day dose dates (no double-count)', () => {
    const single = generateSteadyStateCurve(
      2.0,
      'semaglutide_ozempic',
      TODAY,
      7,
      TODAY,
      7,
      7,
      [TODAY],
    );
    const duplicated = generateSteadyStateCurve(
      2.0,
      'semaglutide_ozempic',
      TODAY,
      7,
      TODAY,
      7,
      7,
      [TODAY, TODAY, TODAY], // same calendar day logged 3x (e.g. re-logs)
    );
    const singleToday = single.find(p => p.dayOffset === 0)?.levelMg;
    const dupToday = duplicated.find(p => p.dayOffset === 0)?.levelMg;
    expect(dupToday).toBeCloseTo(singleToday ?? -1, 5); // not 3x
    expect(dupToday).toBeCloseTo(2.0, 5);
  });
});
