import type { SeededFood, SeededFoodRow } from '@/features/food-log/food-search';
import { describe, expect, it } from 'vitest';

import {
  rowToSeededFood,
  sanitizeFoodQuery,
  seededFoodDisplayName,
  seededFoodRowSchema,
  seededFoodToFormPatch,
  seededFoodToLogEntry,
} from '@/features/food-log/food-search';

const ROW: SeededFoodRow = {
  id: 'curated-greek-yogurt-nonfat-plain',
  name: 'Greek yogurt, plain, nonfat',
  name_es: 'Yogur griego natural descremado',
  brand: null,
  barcode: null,
  serving_description: '1 cup (245 g)',
  serving_size_g: 245,
  calories: 130,
  protein_g: 23,
  carbs_g: 9,
  fat_g: 0.5,
  fiber_g: 0,
  b12_mcg: 1.3,
  iron_mg: 0.1,
  magnesium_mg: 27,
  vitamin_d_iu: 0,
  zinc_mg: 1.2,
};

const FOOD: SeededFood = rowToSeededFood(ROW);

describe('seededFoodRowSchema', () => {
  it('accepts a valid row', () => {
    expect(seededFoodRowSchema.safeParse(ROW).success).toBe(true);
  });

  it('rejects a row without protein', () => {
    const { protein_g: _dropped, ...rest } = ROW;
    expect(seededFoodRowSchema.safeParse(rest).success).toBe(false);
  });
});

describe('rowToSeededFood', () => {
  it('maps snake_case to camelCase and calories to caloriesKcal', () => {
    expect(FOOD.id).toBe(ROW.id);
    expect(FOOD.nameEs).toBe(ROW.name_es);
    expect(FOOD.servingDescription).toBe('1 cup (245 g)');
    expect(FOOD.caloriesKcal).toBe(130);
    expect(FOOD.proteinG).toBe(23);
    expect(FOOD.vitaminDIu).toBe(0);
  });

  it('preserves nulls', () => {
    const sparse = rowToSeededFood({
      ...ROW,
      brand: null,
      carbs_g: null,
      fat_g: null,
      b12_mcg: null,
    });
    expect(sparse.brand).toBeNull();
    expect(sparse.carbsG).toBeNull();
    expect(sparse.fatG).toBeNull();
    expect(sparse.b12Mcg).toBeNull();
  });
});

describe('sanitizeFoodQuery', () => {
  it('strips ILIKE and .or() breaking characters', () => {
    expect(sanitizeFoodQuery('100% whey (vanilla), low_fat')).toBe('100 whey vanilla low fat');
  });

  it('strips double-quotes and backslashes (PostgREST .or() / ILIKE reserved)', () => {
    expect(sanitizeFoodQuery('"organic" yogurt\\')).toBe('organic yogurt');
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeFoodQuery('  greek   yogurt  ')).toBe('greek yogurt');
  });

  it('returns empty string for symbol-only input', () => {
    expect(sanitizeFoodQuery('%()_,')).toBe('');
  });
});

describe('seededFoodDisplayName', () => {
  it('uses name_es for Spanish locales', () => {
    expect(seededFoodDisplayName(FOOD, 'es')).toBe('Yogur griego natural descremado');
    expect(seededFoodDisplayName(FOOD, 'es-MX')).toBe('Yogur griego natural descremado');
  });

  it('falls back to English when name_es is missing', () => {
    expect(seededFoodDisplayName({ ...FOOD, nameEs: null }, 'es')).toBe(FOOD.name);
  });

  it('uses English for non-Spanish locales', () => {
    expect(seededFoodDisplayName(FOOD, 'en')).toBe(FOOD.name);
  });

  it('falls back to English when the locale is undefined', () => {
    expect(seededFoodDisplayName(FOOD, undefined)).toBe(FOOD.name);
  });
});

describe('seededFoodToLogEntry', () => {
  it('builds a full DatabaseFoodEntry with the locale name', () => {
    const entry = seededFoodToLogEntry(FOOD, 'en');
    expect(entry).toEqual({
      name: 'Greek yogurt, plain, nonfat',
      servingDescription: '1 cup (245 g)',
      proteinG: 23,
      carbsG: 9,
      fatG: 0.5,
      fiberG: 0,
      caloriesKcal: 130,
      b12Mcg: 1.3,
      vitaminDIu: 0,
      magnesiumMg: 27,
      zincMg: 1.2,
      ironMg: 0.1,
      barcodeEan: null,
    });
  });

  it('uses the Spanish name for es locales', () => {
    expect(seededFoodToLogEntry(FOOD, 'es').name).toBe('Yogur griego natural descremado');
  });
});

describe('seededFoodToFormPatch', () => {
  it('formats exactly like the AI review sheet form', () => {
    const patch = seededFoodToFormPatch(FOOD, 'en');
    expect(patch.proteinG).toBe('23.0');
    expect(patch.carbsG).toBe('9.0');
    expect(patch.fatG).toBe('0.5');
    expect(patch.fiberG).toBe('0.0');
    expect(patch.caloriesKcal).toBe('130');
    expect(patch.b12Mcg).toBe('1.3');
    expect(patch.vitaminDIu).toBe('0');
    expect(patch.magnesiumMg).toBe('27');
    expect(patch.zincMg).toBe('1.2');
    expect(patch.ironMg).toBe('0.1');
  });

  it('maps nulls to empty strings', () => {
    const patch = seededFoodToFormPatch(
      { ...FOOD, carbsG: null, caloriesKcal: null, vitaminDIu: null },
      'en',
    );
    expect(patch.carbsG).toBe('');
    expect(patch.caloriesKcal).toBe('');
    expect(patch.vitaminDIu).toBe('');
  });
});
