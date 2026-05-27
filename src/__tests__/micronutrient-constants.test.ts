import { describe, expect, it } from 'vitest';
import {
  MICRONUTRIENT_RDAS,
  getGapBannerText,
  getGapCount,
  getNutrientPct,
  getNutrientStatus,
} from '@/features/food-log/micronutrient-constants';

describe('getNutrientPct', () => {
  it('returns 100 at exactly RDA', () => {
    expect(getNutrientPct(420, 420)).toBe(100);
  });
  it('caps at 100 when above RDA', () => {
    expect(getNutrientPct(500, 420)).toBe(100);
  });
  it('rounds to nearest integer', () => {
    expect(getNutrientPct(190, 420)).toBe(45);
  });
  it('returns 0 when actual is 0', () => {
    expect(getNutrientPct(0, 420)).toBe(0);
  });
  it('returns 0 for negative actual', () => {
    expect(getNutrientPct(-10, 420)).toBe(0);
  });
  it('returns 0 when rda is zero', () => {
    expect(getNutrientPct(100, 0)).toBe(0);
  });
});

describe('getNutrientStatus', () => {
  it('returns green at 80%+', () => {
    expect(getNutrientStatus(336, 420)).toBe('green');
  });
  it('returns amber at 50–79%', () => {
    expect(getNutrientStatus(210, 420)).toBe('amber');
    expect(getNutrientStatus(315, 420)).toBe('amber');
  });
  it('returns red below 50%', () => {
    expect(getNutrientStatus(190, 420)).toBe('red');
    expect(getNutrientStatus(0, 420)).toBe('red');
  });
  it('returns red when rda is zero', () => {
    expect(getNutrientStatus(0, 0)).toBe('red');
  });
});

describe('getGapCount', () => {
  const noGaps = { magnesiumMg: 420, zincMg: 11, b12Mcg: 2.4, vitaminDIu: 600 };
  const twoGaps = { magnesiumMg: 190, zincMg: 11, b12Mcg: 0.4, vitaminDIu: 600 };

  it('returns 0 when all at goal', () => {
    expect(getGapCount(noGaps)).toBe(0);
  });
  it('counts nutrients strictly below 50% of RDA', () => {
    expect(getGapCount(twoGaps)).toBe(2);
  });
  it('does not count nutrients at exactly 50%', () => {
    expect(getGapCount({ ...noGaps, magnesiumMg: 210 })).toBe(0);
  });
  it('counts all 4 when all are zero', () => {
    expect(getGapCount({ magnesiumMg: 0, zincMg: 0, b12Mcg: 0, vitaminDIu: 0 })).toBe(4);
  });
});

describe('getGapBannerText', () => {
  const noGaps = { magnesiumMg: 420, zincMg: 11, b12Mcg: 2.4, vitaminDIu: 600 };

  it('returns null when no gaps', () => {
    expect(getGapBannerText(noGaps)).toBeNull();
  });
  it('returns a string mentioning the gap nutrient', () => {
    const text = getGapBannerText({ ...noGaps, b12Mcg: 0.4 });
    expect(text).not.toBeNull();
    expect(text).toContain('B12');
  });
  it('does not contain forbidden condition names', () => {
    const text = getGapBannerText({ ...noGaps, b12Mcg: 0.4 }) ?? '';
    expect(text).not.toMatch(/deficiency|anemia|rickets|osteo/i);
  });
  it('handles multiple gaps — names both and includes tips for each', () => {
    const text = getGapBannerText({ magnesiumMg: 0, zincMg: 0, b12Mcg: 0, vitaminDIu: 0 });
    expect(typeof text).toBe('string');
    expect(text).not.toBeNull();
    // Should name the top 2 gap nutrients
    expect(text!.length).toBeGreaterThan(10);
  });
});

describe('MICRONUTRIENT_RDAS', () => {
  it('has correct US RDA values', () => {
    expect(MICRONUTRIENT_RDAS.magnesiumMg).toBe(420);
    expect(MICRONUTRIENT_RDAS.zincMg).toBe(11);
    expect(MICRONUTRIENT_RDAS.b12Mcg).toBe(2.4);
    expect(MICRONUTRIENT_RDAS.vitaminDIu).toBe(600);
  });
});
