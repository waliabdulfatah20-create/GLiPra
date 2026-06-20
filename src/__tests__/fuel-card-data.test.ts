import type { MicronutrientData } from '@/features/food-log/micronutrient-constants';
import { describe, expect, it } from 'vitest';

import {
  FIBER_TARGET_G,
  MICRO_ORDER,
  summarizeFiber,
  summarizeMicros,
} from '@/features/today/fuel-card-data';

// Builds a MicronutrientData object, defaulting every nutrient to 0.
function micros(overrides: Partial<MicronutrientData> = {}): MicronutrientData {
  return { magnesiumMg: 0, zincMg: 0, b12Mcg: 0, vitaminDIu: 0, ironMg: 0, calciumMg: 0, ...overrides };
}

describe('fiber target constant', () => {
  it('is the documented 28 g general guidance value', () => {
    expect(FIBER_TARGET_G).toBe(28);
  });
});

describe('summarizeFiber', () => {
  it('returns low + zero for no fiber logged', () => {
    expect(summarizeFiber(0)).toEqual({ grams: 0, target: 28, pct: 0, status: 'low' });
  });

  it('sanitizes negative and non-finite intake to 0', () => {
    expect(summarizeFiber(-5).grams).toBe(0);
    expect(summarizeFiber(Number.NaN).grams).toBe(0);
    expect(summarizeFiber(Number.POSITIVE_INFINITY).grams).toBe(0);
  });

  it('marks exactly 50% of target as amber', () => {
    const r = summarizeFiber(14); // 14 / 28 = 0.5
    expect(r.pct).toBe(50);
    expect(r.status).toBe('amber');
  });

  it('marks below 50% as low', () => {
    const r = summarizeFiber(13); // 13 / 28 = 0.464
    expect(r.pct).toBe(46);
    expect(r.status).toBe('low');
  });

  it('marks exactly 80% of target as green', () => {
    const r = summarizeFiber(22.4); // 22.4 / 28 = 0.8
    expect(r.pct).toBe(80);
    expect(r.status).toBe('green');
  });

  it('caps pct at 100 but preserves the real grams when over target', () => {
    const r = summarizeFiber(40);
    expect(r.pct).toBe(100);
    expect(r.status).toBe('green');
    expect(r.grams).toBe(40);
  });

  it('honors a custom target', () => {
    const r = summarizeFiber(10, 20); // 50%
    expect(r.target).toBe(20);
    expect(r.pct).toBe(50);
    expect(r.status).toBe('amber');
  });

  it('falls back to the default target when target is non-positive', () => {
    expect(summarizeFiber(14, 0).target).toBe(28);
  });
});

describe('summarizeMicros', () => {
  it('returns 6 red dots and onTrack 0 when nothing is logged', () => {
    const r = summarizeMicros(micros(), false);
    expect(r.total).toBe(6);
    expect(r.onTrack).toBe(0);
    expect(r.hasMicros).toBe(false);
    expect(r.statuses.every(s => s.status === 'red')).toBe(true);
  });

  it('orders the dots B12, Vitamin D, Magnesium, Zinc, Iron, Calcium', () => {
    const r = summarizeMicros(micros(), true);
    expect(r.statuses.map(s => s.key)).toEqual([
      'b12Mcg',
      'vitaminDIu',
      'magnesiumMg',
      'zincMg',
      'ironMg',
      'calciumMg',
    ]);
    expect(MICRO_ORDER).toEqual(['b12Mcg', 'vitaminDIu', 'magnesiumMg', 'zincMg', 'ironMg', 'calciumMg']);
  });

  it('counts only green nutrients as on track', () => {
    // b12 100% green, vitD 100% green, mg 100% green, zinc 45% red, iron 50% amber, calcium 0% red
    const r = summarizeMicros(
      micros({ b12Mcg: 2.4, vitaminDIu: 600, magnesiumMg: 420, zincMg: 5, ironMg: 9 }),
      true,
    );
    expect(r.onTrack).toBe(3);
    expect(r.statuses.map(s => s.status)).toEqual(['green', 'green', 'green', 'red', 'amber', 'red']);
    expect(r.hasMicros).toBe(true);
  });

  it('treats exactly 80% of RDA as green (on track)', () => {
    const r = summarizeMicros(micros({ ironMg: 14.4 }), true); // 14.4 / 18 = 0.8
    expect(r.statuses.find(s => s.key === 'ironMg')?.status).toBe('green');
    expect(r.onTrack).toBe(1);
  });
});
