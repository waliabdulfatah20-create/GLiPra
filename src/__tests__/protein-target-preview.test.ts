import { describe, expect, it } from 'vitest';

import { previewProteinFloor } from '@/features/protein-target/preview';

const BASE = {
  weightKg: 80,
  heightCm: 175,
  activityLevel: 'moderate' as const,
  hasKidneyDisease: false,
  phase: 'weight_loss' as const,
};

describe('previewProteinFloor', () => {
  it('returns null when weight is missing', () => {
    expect(previewProteinFloor({ ...BASE, weightKg: null })).toBeNull();
  });

  it('returns null when height is missing', () => {
    expect(previewProteinFloor({ ...BASE, heightCm: null })).toBeNull();
  });

  it('returns null when activity level is missing', () => {
    expect(previewProteinFloor({ ...BASE, activityLevel: null })).toBeNull();
  });

  it('returns null for a non-positive weight', () => {
    expect(previewProteinFloor({ ...BASE, weightKg: 0 })).toBeNull();
    expect(previewProteinFloor({ ...BASE, weightKg: -5 })).toBeNull();
  });

  it('returns null for a non-positive height', () => {
    expect(previewProteinFloor({ ...BASE, heightCm: 0 })).toBeNull();
  });

  it('computes a normal floor: 80kg × 1.4 (moderate) = 112g', () => {
    const r = previewProteinFloor(BASE);
    expect(r).not.toBeNull();
    expect(r!.proteinFloorG).toBe(112);
    expect(r!.baseWeightUsedKg).toBe(80);
    expect(r!.usedIdealBodyWeight).toBe(false);
    expect(r!.cappedByKidneyDisease).toBe(false);
  });

  it('uses ideal body weight when BMI > 35 (high weight, short height)', () => {
    // 120kg @ 160cm → BMI ~46.9 → Devine ideal weight used instead of actual.
    const r = previewProteinFloor({ ...BASE, weightKg: 120, heightCm: 160 });
    expect(r).not.toBeNull();
    expect(r!.usedIdealBodyWeight).toBe(true);
    expect(r!.baseWeightUsedKg).toBeLessThan(120);
  });

  it('applies the kidney-disease cap (0.8 g/kg)', () => {
    const r = previewProteinFloor({ ...BASE, hasKidneyDisease: true });
    expect(r).not.toBeNull();
    expect(r!.cappedByKidneyDisease).toBe(true);
    // 80kg × 0.8 = 64g (below the normal 112g).
    expect(r!.proteinFloorG).toBe(64);
  });

  it('applies the maintenance multiplier (0.9)', () => {
    const r = previewProteinFloor({ ...BASE, phase: 'maintenance' });
    expect(r).not.toBeNull();
    // 80 × 1.4 × 0.9 = 100.8g
    expect(r!.proteinFloorG).toBe(100.8);
  });
});
