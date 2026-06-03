import { describe, expect, it } from 'vitest';
import { composeInsight, FLOOR_HIT_TOLERANCE_G } from '@/features/food-log/pro-insight-helpers';

const BASE = {
  proteinConsumedG: 50,
  mealProteinG: 30,
  proteinFloorG: 120,
  phase: null,
  daysSinceInjection: null,
} as const;

describe('composeInsight — suppression', () => {
  it('returns null when proteinFloorG is null', () => {
    expect(composeInsight({ ...BASE, proteinFloorG: null })).toBeNull();
  });

  it('returns null when proteinFloorG is zero', () => {
    expect(composeInsight({ ...BASE, proteinFloorG: 0 })).toBeNull();
  });

  it('returns null when consumed and meal protein are both zero', () => {
    expect(
      composeInsight({ ...BASE, proteinConsumedG: 0, mealProteinG: 0 }),
    ).toBeNull();
  });

  it('renders even when only the meal has protein (consumed = 0)', () => {
    const out = composeInsight({ ...BASE, proteinConsumedG: 0, mealProteinG: 30 });
    expect(out).not.toBeNull();
    expect(out?.headlineVars.projectedG).toBe(30);
  });
});

describe('composeInsight — headline classification', () => {
  it('under floor → headline_under_floor', () => {
    const out = composeInsight({ ...BASE, proteinConsumedG: 50, mealProteinG: 20, proteinFloorG: 120 });
    expect(out?.headlineKey).toBe('headline_under_floor');
    expect(out?.headlineVars.projectedG).toBe(70);
    expect(out?.headlineVars.remainingG).toBe(50);
    expect(out?.headlineVars.overG).toBe(0);
  });

  it('exactly at floor → headline_at_floor', () => {
    const out = composeInsight({ ...BASE, proteinConsumedG: 80, mealProteinG: 40, proteinFloorG: 120 });
    expect(out?.headlineKey).toBe('headline_at_floor');
    expect(out?.headlineVars.projectedG).toBe(120);
    expect(out?.headlineVars.remainingG).toBe(0);
    expect(out?.headlineVars.overG).toBe(0);
  });

  it('within +/- tolerance of floor → headline_at_floor', () => {
    const out = composeInsight({
      ...BASE,
      proteinConsumedG: 80,
      mealProteinG: 40 + FLOOR_HIT_TOLERANCE_G,
      proteinFloorG: 120,
    });
    expect(out?.headlineKey).toBe('headline_at_floor');
  });

  it('over floor → headline_over_floor', () => {
    const out = composeInsight({ ...BASE, proteinConsumedG: 100, mealProteinG: 30, proteinFloorG: 120 });
    expect(out?.headlineKey).toBe('headline_over_floor');
    expect(out?.headlineVars.projectedG).toBe(130);
    expect(out?.headlineVars.remainingG).toBe(0);
    expect(out?.headlineVars.overG).toBe(10);
  });

  it('rounds projected protein to nearest integer', () => {
    const out = composeInsight({ ...BASE, proteinConsumedG: 50.4, mealProteinG: 29.7 });
    expect(out?.headlineVars.projectedG).toBe(80);
  });

  it('clamps remaining/over at zero (no negatives)', () => {
    const out = composeInsight({ ...BASE, proteinConsumedG: 200, mealProteinG: 0, proteinFloorG: 120 });
    expect(out?.headlineVars.remainingG).toBe(0);
    expect(out?.headlineVars.overG).toBe(80);
  });

  it('always populates floorG in headlineVars', () => {
    const out = composeInsight({ ...BASE, proteinFloorG: 100 });
    expect(out?.headlineVars.floorG).toBe(100);
  });
});

describe('composeInsight — phase subline mapping', () => {
  it('null phase → no subline', () => {
    const out = composeInsight({ ...BASE, phase: null });
    expect(out?.sublineKey).toBeNull();
  });

  it('injection_day → subline_injection_day', () => {
    const out = composeInsight({ ...BASE, phase: 'injection_day', daysSinceInjection: 0 });
    expect(out?.sublineKey).toBe('subline_injection_day');
    expect(out?.sublineVars.n).toBe(0);
  });

  it('peak_suppression → subline_peak_suppression with day count', () => {
    const out = composeInsight({ ...BASE, phase: 'peak_suppression', daysSinceInjection: 2 });
    expect(out?.sublineKey).toBe('subline_peak_suppression');
    expect(out?.sublineVars.n).toBe(2);
  });

  it('adjustment → subline_adjustment', () => {
    const out = composeInsight({ ...BASE, phase: 'adjustment', daysSinceInjection: 3 });
    expect(out?.sublineKey).toBe('subline_adjustment');
    expect(out?.sublineVars.n).toBe(3);
  });

  it('recovery_window → subline_recovery_window', () => {
    const out = composeInsight({ ...BASE, phase: 'recovery_window', daysSinceInjection: 6 });
    expect(out?.sublineKey).toBe('subline_recovery_window');
    expect(out?.sublineVars.n).toBe(6);
  });

  it('overdue → subline_overdue', () => {
    const out = composeInsight({ ...BASE, phase: 'overdue', daysSinceInjection: 9 });
    expect(out?.sublineKey).toBe('subline_overdue');
  });

  it('null daysSinceInjection → n falls back to 0', () => {
    const out = composeInsight({ ...BASE, phase: 'peak_suppression', daysSinceInjection: null });
    expect(out?.sublineVars.n).toBe(0);
  });

  it('negative daysSinceInjection is clamped at 0', () => {
    const out = composeInsight({ ...BASE, phase: 'injection_day', daysSinceInjection: -1 });
    expect(out?.sublineVars.n).toBe(0);
  });
});
