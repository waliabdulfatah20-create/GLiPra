import { describe, expect, it } from 'vitest';

import {
  estimateLevel,
  FALLBACK_HALF_LIFE,
  generateLevelCurve,
  generateSteadyStateCurve,
  HALF_LIVES,
} from './calculator';

// ---------------------------------------------------------------------------
// HALF_LIVES constant validation
// ---------------------------------------------------------------------------

describe('hALF_LIVES', () => {
  it('all HALF_LIVES values are positive numbers', () => {
    for (const [key, value] of Object.entries(HALF_LIVES)) {
      expect(typeof value, `${key} should be a number`).toBe('number');
      expect(value, `${key} should be positive`).toBeGreaterThan(0);
    }
  });

  it('ozempic half-life is 7 days', () => {
    expect(HALF_LIVES.semaglutide_ozempic).toBe(7);
  });

  it('wegovy half-life is 7 days', () => {
    expect(HALF_LIVES.semaglutide_wegovy).toBe(7);
  });

  it('mounjaro half-life is 5 days', () => {
    expect(HALF_LIVES.tirzepatide_mounjaro).toBe(5);
  });

  it('zepbound half-life is 5 days', () => {
    expect(HALF_LIVES.tirzepatide_zepbound).toBe(5);
  });

  it('saxenda half-life is 0.5 days', () => {
    expect(HALF_LIVES.liraglutide_saxenda).toBe(0.5);
  });

  it('victoza half-life is 0.5 days', () => {
    expect(HALF_LIVES.liraglutide_victoza).toBe(0.5);
  });

  it('trulicity half-life is 4.5 days', () => {
    expect(HALF_LIVES.dulaglutide_trulicity).toBe(4.5);
  });

  it('compounded_semaglutide half-life is 7 days', () => {
    expect(HALF_LIVES.compounded_semaglutide).toBe(7);
  });

  it('compounded_tirzepatide half-life is 5 days', () => {
    expect(HALF_LIVES.compounded_tirzepatide).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// FALLBACK_HALF_LIFE
// ---------------------------------------------------------------------------

describe('fALLBACK_HALF_LIFE', () => {
  it('is exported and equals 7', () => {
    expect(FALLBACK_HALF_LIFE).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// estimateLevel
// ---------------------------------------------------------------------------

describe('estimateLevel', () => {
  it('day 0: full dose returned (ozempic)', () => {
    expect(estimateLevel(1.0, 0, 'semaglutide_ozempic')).toBe(1.0);
  });

  it('one half-life: ~0.5 of dose (ozempic, 7 days)', () => {
    expect(estimateLevel(1.0, 7, 'semaglutide_ozempic')).toBeCloseTo(0.5, 5);
  });

  it('two half-lives: ~0.25 of dose (ozempic, 14 days)', () => {
    expect(estimateLevel(1.0, 14, 'semaglutide_ozempic')).toBeCloseTo(0.25, 5);
  });

  it('zero dose always returns 0 regardless of days', () => {
    expect(estimateLevel(0, 5, 'tirzepatide_mounjaro')).toBe(0);
  });

  it('saxenda: full dose at day 0', () => {
    expect(estimateLevel(2.5, 0, 'liraglutide_saxenda')).toBe(2.5);
  });

  it('saxenda: ~half the dose at 0.5 days (one half-life)', () => {
    expect(estimateLevel(2.5, 0.5, 'liraglutide_saxenda')).toBeCloseTo(1.25, 5);
  });

  it('saxenda: full half-life is 0.5 days — confirms formula', () => {
    // At 1 half-life (0.5 days): 2.5 * 0.5^(0.5/0.5) = 2.5 * 0.5 = 1.25
    const result = estimateLevel(2.5, 0.5, 'liraglutide_saxenda');
    expect(result).toBeCloseTo(1.25, 4);
  });

  it('unknown medication falls back to FALLBACK_HALF_LIFE (7 days)', () => {
    // At 7 days with fallback half-life of 7 days: doseMg * 0.5^(7/7) = doseMg * 0.5
    const result = estimateLevel(2.0, 7, 'unknown_medication' as never);
    expect(result).toBeCloseTo(1.0, 5);
  });

  it('unknown medication at day 0 returns full dose', () => {
    expect(estimateLevel(1.5, 0, 'rybelsus_unknown' as never)).toBe(1.5);
  });

  it('mounjaro at one half-life (5 days) returns ~half the dose', () => {
    expect(estimateLevel(1.0, 5, 'tirzepatide_mounjaro')).toBeCloseTo(0.5, 5);
  });

  it('trulicity at one half-life (4.5 days) returns ~half the dose', () => {
    expect(estimateLevel(1.0, 4.5, 'dulaglutide_trulicity')).toBeCloseTo(0.5, 5);
  });

  it('compounded_semaglutide behaves same as ozempic (7-day half-life)', () => {
    const ozResult = estimateLevel(0.5, 3, 'semaglutide_ozempic');
    const compResult = estimateLevel(0.5, 3, 'compounded_semaglutide');
    expect(ozResult).toBeCloseTo(compResult, 10);
  });

  it('compounded_tirzepatide behaves same as mounjaro (5-day half-life)', () => {
    const mojResult = estimateLevel(5.0, 2, 'tirzepatide_mounjaro');
    const compResult = estimateLevel(5.0, 2, 'compounded_tirzepatide');
    expect(mojResult).toBeCloseTo(compResult, 10);
  });

  it('returns a number greater than 0 for reasonable inputs', () => {
    expect(estimateLevel(1.0, 3, 'semaglutide_ozempic')).toBeGreaterThan(0);
  });

  it('level decreases monotonically as days increase', () => {
    const d0 = estimateLevel(1.0, 0, 'semaglutide_ozempic');
    const d3 = estimateLevel(1.0, 3, 'semaglutide_ozempic');
    const d7 = estimateLevel(1.0, 7, 'semaglutide_ozempic');
    const d14 = estimateLevel(1.0, 14, 'semaglutide_ozempic');
    expect(d0).toBeGreaterThan(d3);
    expect(d3).toBeGreaterThan(d7);
    expect(d7).toBeGreaterThan(d14);
  });
});

// ---------------------------------------------------------------------------
// generateLevelCurve
// ---------------------------------------------------------------------------

describe('generateLevelCurve', () => {
  it('returns daysToProject + 1 points (days 0 through N) with default 14 days', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic');
    expect(curve.length).toBe(15); // 0..14 inclusive
  });

  it('returns daysToProject + 1 points with custom daysToProject', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic', 7);
    expect(curve.length).toBe(8); // 0..7 inclusive
  });

  it('first point (day 0) equals the full doseMg', () => {
    const doseMg = 2.4;
    const curve = generateLevelCurve(doseMg, 'semaglutide_ozempic');
    expect(curve[0].day).toBe(0);
    expect(curve[0].levelMg).toBe(doseMg);
  });

  it('day values are sequential from 0', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic', 5);
    curve.forEach((point, index) => {
      expect(point.day).toBe(index);
    });
  });

  it('levelMg values decrease monotonically', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic', 14);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].levelMg).toBeLessThan(curve[i - 1].levelMg);
    }
  });

  it('last point is less than first point', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic', 14);
    expect(curve[curve.length - 1].levelMg).toBeLessThan(curve[0].levelMg);
  });

  it('works for saxenda (short half-life)', () => {
    const curve = generateLevelCurve(2.5, 'liraglutide_saxenda', 3);
    expect(curve.length).toBe(4);
    expect(curve[0].levelMg).toBe(2.5);
    expect(curve[1].levelMg).toBeCloseTo(estimateLevel(2.5, 1, 'liraglutide_saxenda'), 5);
  });

  it('works for zero dose', () => {
    const curve = generateLevelCurve(0, 'semaglutide_ozempic', 14);
    for (const point of curve) {
      expect(point.levelMg).toBe(0);
    }
  });

  it('daysToProject = 0 returns a single point (day 0)', () => {
    const curve = generateLevelCurve(1.0, 'semaglutide_ozempic', 0);
    expect(curve.length).toBe(1);
    expect(curve[0].day).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// generateSteadyStateCurve
// ---------------------------------------------------------------------------

describe('generateSteadyStateCurve', () => {
  const lastInjectionDate = '2024-01-15';
  const today = '2024-01-15';

  it('returns an array with date strings in ISO format (YYYY-MM-DD)', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
    );
    for (const point of curve) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('contains dayOffset property for each point', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
    );
    expect(curve.length).toBeGreaterThan(0);
    for (const point of curve) {
      expect(typeof point.dayOffset).toBe('number');
    }
  });

  it('contains levelMg property for each point', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
    );
    for (const point of curve) {
      expect(typeof point.levelMg).toBe('number');
      expect(point.levelMg).toBeGreaterThanOrEqual(0);
    }
  });

  it('today point has dayOffset = 0', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
    );
    const todayPoint = curve.find(p => p.dayOffset === 0);
    expect(todayPoint).toBeDefined();
    expect(todayPoint!.date).toBe(today);
  });

  it('steady-state: levels build up over multiple doses', () => {
    // At 7 days after injection in steady state (4 past cycles), the accumulated
    // level should be greater than a single-dose level at 7 days
    const singleDoseLevel = estimateLevel(1.0, 7, 'semaglutide_ozempic');

    const injDate = '2024-01-01';
    const todayDate = '2024-01-08'; // 7 days after lastInjectionDate

    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      injDate,
      7,
      todayDate,
    );

    const todayPoint = curve.find(p => p.dayOffset === 0);
    expect(todayPoint).toBeDefined();
    // With accumulated doses from prior cycles, level should be higher
    expect(todayPoint!.levelMg).toBeGreaterThan(singleDoseLevel);
  });

  it('returns more points than just today — includes past and future', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
      14,
    );
    // Should have past (4 cycles * 7 days = 28 days back) + future 14 days + 1
    expect(curve.length).toBeGreaterThan(14);
  });

  it('works with daily injection interval (saxenda)', () => {
    const curve = generateSteadyStateCurve(
      1.2,
      'liraglutide_saxenda',
      '2024-01-10',
      1,
      '2024-01-10',
      3,
    );
    expect(curve.length).toBeGreaterThan(0);
    for (const point of curve) {
      expect(point.levelMg).toBeGreaterThanOrEqual(0);
    }
  });

  it('works with biweekly injection interval', () => {
    const curve = generateSteadyStateCurve(
      2.0,
      'tirzepatide_mounjaro',
      '2024-01-01',
      14,
      '2024-01-15',
      14,
    );
    expect(curve.length).toBeGreaterThan(0);
    const todayPt = curve.find(p => p.dayOffset === 0);
    expect(todayPt).toBeDefined();
  });

  it('future points (dayOffset > 0) are included in the curve', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
      14,
    );
    const futurePoints = curve.filter(p => p.dayOffset > 0);
    expect(futurePoints.length).toBeGreaterThan(0);
  });

  it('past points (dayOffset < 0) are included in the curve', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
      14,
    );
    const pastPoints = curve.filter(p => p.dayOffset < 0);
    expect(pastPoints.length).toBeGreaterThan(0);
  });

  it('dates are monotonically increasing', () => {
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      lastInjectionDate,
      7,
      today,
      7,
    );
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].dayOffset).toBeGreaterThan(curve[i - 1].dayOffset);
    }
  });

  it('levelMg at injection day has contributions from all administered doses', () => {
    // On the lastInjectionDate, dayOffset=0 with today=lastInjectionDate:
    // - Dose from 4 cycles ago, 3 cycles ago, 2 cycles ago, 1 cycle ago, and today all contribute
    const curve = generateSteadyStateCurve(
      1.0,
      'semaglutide_ozempic',
      '2024-01-29',
      7,
      '2024-01-29',
      0,
    );
    const todayPt = curve.find(p => p.dayOffset === 0);
    expect(todayPt).toBeDefined();
    // With 5 doses at 0, 7, 14, 21, 28 days prior, total is sum of their decay
    // Day 0 dose contributes 1.0 (full), others contribute decayed amounts
    expect(todayPt!.levelMg).toBeGreaterThan(1.0);
  });
});
