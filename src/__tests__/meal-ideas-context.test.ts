import { describe, expect, it } from 'vitest';
import { buildMealIdeasContext } from '@/features/meal-ideas/context';

const base = {
  mealType: 'breakfast' as const,
  proteinFloorG: 120,
  proteinConsumedG: 40,
  phaseLabel: 'peak_suppression',
  nauseaScore: 4,
  dietaryPattern: 'vegan',
  hasKidneyDisease: false,
  language: 'en' as const,
};

describe('buildMealIdeasContext', () => {
  it('computes protein remaining from floor minus consumed', () => {
    const r = buildMealIdeasContext(base);
    expect(r.proteinFloorG).toBe(120);
    expect(r.proteinRemainingG).toBe(80);
  });

  it('clamps remaining at 0 when over target', () => {
    expect(buildMealIdeasContext({ ...base, proteinConsumedG: 200 }).proteinRemainingG).toBe(0);
  });

  it('omits protein fields when the floor is missing or zero', () => {
    const r = buildMealIdeasContext({ ...base, proteinFloorG: 0 });
    expect(r.proteinFloorG).toBeUndefined();
    expect(r.proteinRemainingG).toBeUndefined();
  });

  it('keeps only constraining dietary patterns', () => {
    expect(buildMealIdeasContext({ ...base, dietaryPattern: 'vegan' }).dietaryPattern).toBe('vegan');
    expect(buildMealIdeasContext({ ...base, dietaryPattern: 'omnivore' }).dietaryPattern).toBeUndefined();
    expect(buildMealIdeasContext({ ...base, dietaryPattern: null }).dietaryPattern).toBeUndefined();
  });

  it('passes nausea only when in the 1-5 range', () => {
    expect(buildMealIdeasContext({ ...base, nauseaScore: 4 }).nauseaScore).toBe(4);
    expect(buildMealIdeasContext({ ...base, nauseaScore: 0 }).nauseaScore).toBeUndefined();
    expect(buildMealIdeasContext({ ...base, nauseaScore: 6 }).nauseaScore).toBeUndefined();
    expect(buildMealIdeasContext({ ...base, nauseaScore: null }).nauseaScore).toBeUndefined();
  });

  it('includes the kidney flag only when true', () => {
    expect(buildMealIdeasContext({ ...base, hasKidneyDisease: true }).hasKidneyDisease).toBe(true);
    expect(buildMealIdeasContext({ ...base, hasKidneyDisease: false }).hasKidneyDisease).toBeUndefined();
    expect(buildMealIdeasContext({ ...base, hasKidneyDisease: null }).hasKidneyDisease).toBeUndefined();
  });

  it('passes through meal type, phase, and language', () => {
    const r = buildMealIdeasContext({ ...base, mealType: 'snack', language: 'es' });
    expect(r.mealType).toBe('snack');
    expect(r.phase).toBe('peak_suppression');
    expect(r.language).toBe('es');
  });

  it('sends no PII fields (only the allowed anonymized keys)', () => {
    const r = buildMealIdeasContext(base);
    expect(Object.keys(r).sort()).toEqual(
      ['dietaryPattern', 'language', 'mealType', 'nauseaScore', 'phase', 'proteinFloorG', 'proteinRemainingG'].sort(),
    );
  });
});
