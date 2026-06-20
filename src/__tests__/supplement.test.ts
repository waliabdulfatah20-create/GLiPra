import { describe, expect, it } from 'vitest';
import { MICRONUTRIENT_RDAS } from '@/features/food-log/micronutrient-constants';
import {
  buildSupplementEntry,
  getSupplementAmount,
  getSupplementNutrient,
  SUPPLEMENT_NUTRIENTS,
} from '@/features/food-log/supplement';

describe('supplement quick-add helpers', () => {
  it('covers every tracked micronutrient', () => {
    const keys = SUPPLEMENT_NUTRIENTS.map(n => n.key).sort();
    expect(keys).toEqual(Object.keys(MICRONUTRIENT_RDAS).sort());
  });

  it('builds an entry with ONLY the target nutrient set', () => {
    const entry = buildSupplementEntry('vitaminDIu', 2000);
    expect(entry).not.toBeNull();
    expect(entry!.vitaminDIu).toBe(2000);
    expect(entry!.magnesiumMg).toBeNull();
    expect(entry!.zincMg).toBeNull();
    expect(entry!.b12Mcg).toBeNull();
    expect(entry!.ironMg).toBeNull();
    expect(entry!.calciumMg).toBeNull();
    expect(entry!.name).toBe('Vitamin D');
    expect(entry!.servingDescription).toBe('2000 IU');
  });

  it('rounds mg/IU to whole numbers and B12 (mcg) to one decimal', () => {
    expect(buildSupplementEntry('magnesiumMg', 399.6)!.magnesiumMg).toBe(400);
    expect(buildSupplementEntry('magnesiumMg', 399.6)!.servingDescription).toBe('400 mg');
    expect(buildSupplementEntry('calciumMg', 599.6)!.calciumMg).toBe(600);
    expect(buildSupplementEntry('calciumMg', 599.6)!.servingDescription).toBe('600 mg');
    expect(buildSupplementEntry('b12Mcg', 2.46)!.b12Mcg).toBe(2.5);
    expect(buildSupplementEntry('b12Mcg', 2.46)!.servingDescription).toBe('2.5 mcg');
  });

  it('rejects non-positive or non-finite amounts', () => {
    expect(buildSupplementEntry('ironMg', 0)).toBeNull();
    expect(buildSupplementEntry('ironMg', -5)).toBeNull();
    expect(buildSupplementEntry('ironMg', Number.NaN)).toBeNull();
  });

  it('resolves a nutrient config by key', () => {
    expect(getSupplementNutrient('zincMg').name).toBe('Zinc');
    expect(getSupplementNutrient('zincMg').unit).toBe('mg');
    expect(getSupplementNutrient('zincMg').rda).toBe(MICRONUTRIENT_RDAS.zincMg);
  });

  it('reads back the single logged micro for display', () => {
    const entry = buildSupplementEntry('ironMg', 18)!;
    expect(getSupplementAmount(entry)).toEqual({ value: 18, unit: 'mg' });
    expect(getSupplementAmount({
      magnesiumMg: null,
      zincMg: null,
      b12Mcg: null,
      vitaminDIu: null,
      ironMg: null,
      calciumMg: null,
    })).toBeNull();
  });
});
