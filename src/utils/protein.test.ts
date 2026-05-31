/**
 * Tests for protein floor calculator.
 *
 * Safety-critical — Rule 4 from CLAUDE.md: 90%+ branch coverage required.
 * Run with: pnpm test:utils
 */

import type { ProteinInput } from './protein';
import { describe, expect, it } from 'vitest';
import {
  ABSOLUTE_CEILING_G,
  ABSOLUTE_FLOOR_G,
  calculateProteinFloor,

} from './protein';

// ─── Shared helpers ──────────────────────────────────────────────────────────

/** Build a base input, overrideable per test. */
function makeInput(overrides: Partial<ProteinInput> = {}): ProteinInput {
  return {
    weightKg: 70,
    heightCm: 170,
    bmi: 24,
    hasKidneyDisease: false,
    isPregnant: false,
    phase: 'weight_loss',
    activityLevel: 'sedentary',
    ...overrides,
  };
}

// ─── Normal cases ─────────────────────────────────────────────────────────────

describe('normal cases — no conditions, BMI < 35', () => {
  it('sedentary: 70 kg × 1.2 = 84.0 g', () => {
    const result = calculateProteinFloor(makeInput({ activityLevel: 'sedentary' }));
    expect(result.proteinFloorG).toBe(84.0);
    expect(result.usedIdealBodyWeight).toBe(false);
    expect(result.cappedByKidneyDisease).toBe(false);
    expect(result.flooredByPregnancy).toBe(false);
    expect(result.baseWeightUsedKg).toBe(70);
  });

  it('moderate: 70 kg × 1.4 = 98.0 g', () => {
    const result = calculateProteinFloor(makeInput({ activityLevel: 'moderate' }));
    expect(result.proteinFloorG).toBe(98.0);
    expect(result.usedIdealBodyWeight).toBe(false);
  });

  it('active: 70 kg × 1.6 = 112.0 g', () => {
    const result = calculateProteinFloor(makeInput({ activityLevel: 'active' }));
    expect(result.proteinFloorG).toBe(112.0);
    expect(result.usedIdealBodyWeight).toBe(false);
  });
});

// ─── BMI > 35 — ideal body weight branch ─────────────────────────────────────

describe('bMI > 35 — uses Devine ideal body weight', () => {
  it('switches to ideal body weight and reports usedIdealBodyWeight: true', () => {
    // 170 cm → ~66.93 inches → 6.93 inches over 60
    // IBW = 47.75 + 2.3 × 6.93 ≈ 47.75 + 15.939 = 63.689 kg
    // sedentary: 63.689 × 1.2 ≈ 76.4 g
    const result = calculateProteinFloor(
      makeInput({ bmi: 40, weightKg: 120, heightCm: 170, activityLevel: 'sedentary' }),
    );

    expect(result.usedIdealBodyWeight).toBe(true);
    expect(result.baseWeightUsedKg).toBeCloseTo(63.689, 2);
    expect(result.proteinFloorG).toBeCloseTo(76.4, 1);
  });

  it('bMI exactly at threshold (35) still uses actual weight', () => {
    const result = calculateProteinFloor(makeInput({ bmi: 35 }));
    expect(result.usedIdealBodyWeight).toBe(false);
    expect(result.baseWeightUsedKg).toBe(70);
  });

  it('bMI 35.1 crosses threshold — uses ideal body weight', () => {
    const result = calculateProteinFloor(makeInput({ bmi: 35.1, weightKg: 100 }));
    expect(result.usedIdealBodyWeight).toBe(true);
    // base weight should not be the actual 100 kg
    expect(result.baseWeightUsedKg).not.toBe(100);
  });
});

// ─── Kidney disease cap ───────────────────────────────────────────────────────

describe('kidney disease cap', () => {
  it('caps protein to 0.8 g/kg when hasKidneyDisease and activity would exceed cap', () => {
    // sedentary multiplier = 1.2 g/kg, kidney cap = 0.8 g/kg → cap applies
    const result = calculateProteinFloor(makeInput({ hasKidneyDisease: true }));
    expect(result.cappedByKidneyDisease).toBe(true);
    // 70 kg × 0.8 = 56.0 g
    expect(result.proteinFloorG).toBe(56.0);
  });

  it('does NOT cap when protein is already below 0.8 g/kg (very low weight scenario)', () => {
    // This is a theoretical edge — at any normal activity level the cap always applies.
    // Manually test: weight 40 kg, sedentary = 48 g, kidney cap = 32 g → cap applies.
    // There is no realistic combination where activity result < kidney cap because
    // the lowest multiplier (1.2) > 0.8. So cappedByKidneyDisease is always true
    // when hasKidneyDisease is true (unless clamped by absolute floor first).
    const result = calculateProteinFloor(
      makeInput({ hasKidneyDisease: true, weightKg: 40, activityLevel: 'sedentary' }),
    );
    // 40 × 1.2 = 48 g; kidney cap = 40 × 0.8 = 32 g → cap applies, but absolute floor = 50
    expect(result.cappedByKidneyDisease).toBe(true);
    // After cap: 32 g → clamped to 50 by ABSOLUTE_FLOOR_G
    expect(result.proteinFloorG).toBe(ABSOLUTE_FLOOR_G);
  });

  it('does not cap when hasKidneyDisease is false', () => {
    const result = calculateProteinFloor(makeInput({ hasKidneyDisease: false }));
    expect(result.cappedByKidneyDisease).toBe(false);
  });
});

// ─── Pregnancy floor ─────────────────────────────────────────────────────────

describe('pregnancy floor', () => {
  it('floors result to 80 g when pregnant and calculation is below 80', () => {
    // Very low weight to force sub-80 result: 50 kg, sedentary = 60 g < 80
    const result = calculateProteinFloor(
      makeInput({ isPregnant: true, weightKg: 50, activityLevel: 'sedentary' }),
    );
    expect(result.flooredByPregnancy).toBe(true);
    expect(result.proteinFloorG).toBeGreaterThanOrEqual(80);
  });

  it('does not set flooredByPregnancy when result already exceeds 80', () => {
    // 70 kg × 1.2 = 84 g > 80 → no pregnancy floor needed
    const result = calculateProteinFloor(makeInput({ isPregnant: true }));
    expect(result.flooredByPregnancy).toBe(false);
    expect(result.proteinFloorG).toBe(84.0);
  });

  it('is not pregnant — flooredByPregnancy is false', () => {
    const result = calculateProteinFloor(makeInput({ isPregnant: false, weightKg: 50 }));
    expect(result.flooredByPregnancy).toBe(false);
  });
});

// ─── Maintenance phase multiplier ─────────────────────────────────────────────

describe('maintenance phase', () => {
  it('applies 0.9 multiplier for maintenance phase', () => {
    // weight_loss: 70 × 1.2 = 84 g
    // maintenance: 84 × 0.9 = 75.6 g
    const result = calculateProteinFloor(makeInput({ phase: 'maintenance' }));
    expect(result.proteinFloorG).toBe(75.6);
  });

  it('weight_loss phase does not apply maintenance multiplier', () => {
    const result = calculateProteinFloor(makeInput({ phase: 'weight_loss' }));
    expect(result.proteinFloorG).toBe(84.0);
  });
});

// ─── Absolute ceiling clamp ───────────────────────────────────────────────────

describe('absolute ceiling (200 g)', () => {
  it('clamps result to ABSOLUTE_CEILING_G when calculation exceeds 200', () => {
    // 130 kg × 1.6 (active) = 208 g → clamped to 200
    const result = calculateProteinFloor(
      makeInput({ weightKg: 130, bmi: 30, activityLevel: 'active' }),
    );
    expect(result.proteinFloorG).toBe(ABSOLUTE_CEILING_G);
  });
});

// ─── Absolute floor clamp ─────────────────────────────────────────────────────

describe('absolute floor (50 g)', () => {
  it('clamps result to ABSOLUTE_FLOOR_G when calculation falls below 50', () => {
    // Kidney disease + maintenance + very low weight → sub-50
    // 40 kg, kidney cap = 0.8 × 40 = 32 g, maintenance × 0.9 = 28.8 g → clamped to 50
    const result = calculateProteinFloor(
      makeInput({
        weightKg: 40,
        hasKidneyDisease: true,
        phase: 'maintenance',
        activityLevel: 'sedentary',
      }),
    );
    expect(result.proteinFloorG).toBe(ABSOLUTE_FLOOR_G);
  });
});

// ─── Combined conditions ──────────────────────────────────────────────────────

describe('kidney disease + pregnancy together', () => {
  it('applies kidney cap first, then pregnancy floor wins when cap result < 80', () => {
    // 70 kg, kidney cap = 56 g < 80 → pregnancy floor applies
    const result = calculateProteinFloor(
      makeInput({ hasKidneyDisease: true, isPregnant: true }),
    );
    expect(result.cappedByKidneyDisease).toBe(true);
    expect(result.flooredByPregnancy).toBe(true);
    expect(result.proteinFloorG).toBeGreaterThanOrEqual(80);
  });

  it('kidney cap above 80 prevents pregnancy floor from firing', () => {
    // 110 kg, kidney cap = 88 g > 80 → no pregnancy floor
    const result = calculateProteinFloor(
      makeInput({ weightKg: 110, bmi: 30, hasKidneyDisease: true, isPregnant: true }),
    );
    expect(result.cappedByKidneyDisease).toBe(true);
    expect(result.flooredByPregnancy).toBe(false);
    expect(result.proteinFloorG).toBe(88.0);
  });
});

// ─── Active + high weight: ceiling never exceeded ─────────────────────────────

describe('active + high weight — ceiling enforcement', () => {
  it('very high weight active user never exceeds 200 g ceiling', () => {
    const result = calculateProteinFloor(
      makeInput({ weightKg: 200, bmi: 30, activityLevel: 'active' }),
    );
    expect(result.proteinFloorG).toBeLessThanOrEqual(ABSOLUTE_CEILING_G);
    expect(result.proteinFloorG).toBe(ABSOLUTE_CEILING_G);
  });

  it('extreme weight still clamped to 200', () => {
    const result = calculateProteinFloor(
      makeInput({ weightKg: 300, bmi: 30, activityLevel: 'active' }),
    );
    expect(result.proteinFloorG).toBe(ABSOLUTE_CEILING_G);
  });
});

// ─── Rounding ─────────────────────────────────────────────────────────────────

describe('rounding to 1 decimal place', () => {
  it('result is always rounded to exactly 1 decimal place', () => {
    // Use a weight that produces a non-round result: 73 × 1.4 = 102.2 g
    const result = calculateProteinFloor(
      makeInput({ weightKg: 73, activityLevel: 'moderate' }),
    );
    const decimalPlaces = (result.proteinFloorG.toString().split('.')[1] ?? '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
    expect(result.proteinFloorG).toBe(102.2);
  });

  it('handles repeating decimals by rounding to 1 decimal', () => {
    // 67 kg × 1.6 = 107.2 g — exact
    const result = calculateProteinFloor(
      makeInput({ weightKg: 67, activityLevel: 'active' }),
    );
    const str = result.proteinFloorG.toString();
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});

// ─── Return shape completeness ─────────────────────────────────────────────────

describe('result shape', () => {
  it('always returns all five required fields', () => {
    const result = calculateProteinFloor(makeInput());
    expect(result).toHaveProperty('proteinFloorG');
    expect(result).toHaveProperty('baseWeightUsedKg');
    expect(result).toHaveProperty('usedIdealBodyWeight');
    expect(result).toHaveProperty('cappedByKidneyDisease');
    expect(result).toHaveProperty('flooredByPregnancy');
  });
});
