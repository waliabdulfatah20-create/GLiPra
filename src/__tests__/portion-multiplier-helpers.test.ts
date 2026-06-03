import { describe, expect, it } from 'vitest';
import {
  deriveFieldBase,
  PORTION_MULTIPLIERS,
  scaleMacros,
  snapToMultiplier,
} from '@/features/food-log/portion-multiplier-helpers';

const FULL_BASE = {
  proteinG: 38,
  carbsG: 52,
  fatG: 9,
  fiberG: 4,
  caloriesKcal: 432,
  b12Mcg: 2.1,
  vitaminDIu: 40,
  magnesiumMg: 60,
  zincMg: 3.5,
};

const SPARSE_BASE = {
  proteinG: 20,
  carbsG: null,
  fatG: null,
  fiberG: null,
  caloriesKcal: 110,
  b12Mcg: null,
  vitaminDIu: null,
  magnesiumMg: null,
  zincMg: null,
};

describe('scaleMacros — multiplier = 1', () => {
  it('returns identity strings with correct precision (decimals)', () => {
    const out = scaleMacros(FULL_BASE, 1);
    expect(out.proteinG).toBe('38.0');
    expect(out.carbsG).toBe('52.0');
    expect(out.fatG).toBe('9.0');
    expect(out.fiberG).toBe('4.0');
    expect(out.b12Mcg).toBe('2.1');
    expect(out.zincMg).toBe('3.5');
  });

  it('returns identity strings with correct precision (integers)', () => {
    const out = scaleMacros(FULL_BASE, 1);
    expect(out.caloriesKcal).toBe('432');
    expect(out.vitaminDIu).toBe('40');
    expect(out.magnesiumMg).toBe('60');
  });
});

describe('scaleMacros — multiplier = 0.5', () => {
  it('halves all fields with correct precision', () => {
    const out = scaleMacros(FULL_BASE, 0.5);
    expect(out.proteinG).toBe('19.0');
    expect(out.carbsG).toBe('26.0');
    expect(out.fatG).toBe('4.5');
    expect(out.fiberG).toBe('2.0');
    expect(out.caloriesKcal).toBe('216');
    expect(out.b12Mcg).toBe('1.1'); // 2.1 / 2 = 1.05 → "1.1"
    expect(out.vitaminDIu).toBe('20');
    expect(out.magnesiumMg).toBe('30');
    expect(out.zincMg).toBe('1.8'); // 3.5 / 2 = 1.75 → "1.8"
  });
});

describe('scaleMacros — multiplier = 1.5 and 2', () => {
  it('scales correctly at 1.5x', () => {
    const out = scaleMacros(FULL_BASE, 1.5);
    expect(out.proteinG).toBe('57.0');
    expect(out.caloriesKcal).toBe('648');
    expect(out.fatG).toBe('13.5');
  });

  it('scales correctly at 2x', () => {
    const out = scaleMacros(FULL_BASE, 2);
    expect(out.proteinG).toBe('76.0');
    expect(out.caloriesKcal).toBe('864');
    expect(out.b12Mcg).toBe('4.2');
  });
});

describe('scaleMacros — null base fields stay empty', () => {
  it('keeps unknown fields as empty strings regardless of multiplier', () => {
    const out = scaleMacros(SPARSE_BASE, 1.5);
    expect(out.proteinG).toBe('30.0');
    expect(out.caloriesKcal).toBe('165');
    // The AI didn't return these — scaling unknown is still unknown.
    expect(out.carbsG).toBe('');
    expect(out.fatG).toBe('');
    expect(out.fiberG).toBe('');
    expect(out.b12Mcg).toBe('');
    expect(out.vitaminDIu).toBe('');
    expect(out.magnesiumMg).toBe('');
    expect(out.zincMg).toBe('');
  });
});

describe('scaleMacros — defensive cases', () => {
  it('multiplier of 0 produces all zeros, not empties', () => {
    const out = scaleMacros(FULL_BASE, 0);
    expect(out.proteinG).toBe('0.0');
    expect(out.caloriesKcal).toBe('0');
  });

  it('negative base values clamp to 0', () => {
    // Defensive — shouldn't happen, but if a bad AI return slips through.
    const out = scaleMacros({ ...FULL_BASE, proteinG: -5 }, 1);
    expect(out.proteinG).toBe('0.0');
  });
});

describe('deriveFieldBase', () => {
  it('returns null for empty input', () => {
    expect(deriveFieldBase('', 1)).toBeNull();
    expect(deriveFieldBase('', 1.5)).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(deriveFieldBase('abc', 1)).toBeNull();
  });

  it('divides parsed value by multiplier', () => {
    expect(deriveFieldBase('40', 1.5)).toBeCloseTo(40 / 1.5);
    expect(deriveFieldBase('30', 1)).toBe(30);
    expect(deriveFieldBase('80', 2)).toBe(40);
    expect(deriveFieldBase('10', 0.5)).toBe(20);
  });

  it('clamps negative input to 0', () => {
    expect(deriveFieldBase('-5', 1)).toBe(0);
  });

  it('returns null when multiplier is zero (avoids div-by-zero)', () => {
    expect(deriveFieldBase('40', 0)).toBeNull();
  });

  it('round-trips: scale then derive returns original base', () => {
    // User had base = 38g protein at 1.5x → form shows "57.0"
    // User doesn't touch field, but a unit test would re-derive
    const scaledStr = '57.0';
    const derived = deriveFieldBase(scaledStr, 1.5);
    expect(derived).toBeCloseTo(38);
  });
});

describe('snapToMultiplier', () => {
  it('snaps to nearest legal multiplier', () => {
    expect(snapToMultiplier(0.3)).toBe(0.5);
    expect(snapToMultiplier(0.7)).toBe(0.5);
    expect(snapToMultiplier(0.8)).toBe(1);
    expect(snapToMultiplier(1.2)).toBe(1);
    expect(snapToMultiplier(1.3)).toBe(1.5);
    expect(snapToMultiplier(1.8)).toBe(2);
    expect(snapToMultiplier(99)).toBe(2);
    expect(snapToMultiplier(-3)).toBe(0.5);
  });

  it('returns exact match unchanged', () => {
    expect(snapToMultiplier(0.5)).toBe(0.5);
    expect(snapToMultiplier(1)).toBe(1);
    expect(snapToMultiplier(1.5)).toBe(1.5);
    expect(snapToMultiplier(2)).toBe(2);
  });
});

describe('PORTION_MULTIPLIERS constant', () => {
  it('has exactly the four expected snap points in ascending order', () => {
    expect(PORTION_MULTIPLIERS).toEqual([0.5, 1, 1.5, 2]);
  });
});
