import type { FoodLogEntry } from '@/features/food-log/types';
import { describe, expect, it } from 'vitest';
import { deriveRecentFoods, normalizeFoodName } from '@/features/food-log/recent-foods';

// ---------------------------------------------------------------------------
// Fixture builder — a fully-populated FoodLogEntry with sensible defaults so
// each test only specifies the fields it cares about.
// ---------------------------------------------------------------------------
function makeLog(overrides: Partial<FoodLogEntry> = {}): FoodLogEntry {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    userId: 'user-1',
    loggedAt: '2026-06-01T08:00:00.000Z',
    name: 'Grilled chicken breast',
    servingDescription: '140g',
    proteinG: 42,
    carbsG: 0,
    fatG: 5,
    fiberG: 0,
    caloriesKcal: 230,
    b12Mcg: 0.3,
    vitaminDIu: 5,
    magnesiumMg: 28,
    zincMg: 1.2,
    ironMg: 1.1,
    calciumMg: 100,
    barcodeEan: null,
    source: 'photo',
    createdAt: '2026-06-01T08:00:00.000Z',
    ...overrides,
  };
}

describe('normalizeFoodName', () => {
  it('lowercases and trims', () => {
    expect(normalizeFoodName('  Greek Yogurt  ')).toBe('greek yogurt');
  });

  it('treats case/whitespace variants as equal keys', () => {
    expect(normalizeFoodName('FAIRLIFE')).toBe(normalizeFoodName('  fairlife '));
  });
});

describe('deriveRecentFoods', () => {
  it('returns empty array for empty input', () => {
    expect(deriveRecentFoods([])).toEqual([]);
  });

  it('dedupes by normalized name (case + whitespace insensitive)', () => {
    const result = deriveRecentFoods([
      makeLog({ name: 'Greek Yogurt', loggedAt: '2026-06-01T08:00:00.000Z' }),
      makeLog({ name: '  greek yogurt ', loggedAt: '2026-06-02T08:00:00.000Z' }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
    expect(result[0].key).toBe('greek yogurt');
  });

  it('keeps the MOST RECENT entry macros + display name on dedupe', () => {
    const result = deriveRecentFoods([
      makeLog({ name: 'oatmeal', loggedAt: '2026-06-01T08:00:00.000Z', proteinG: 5, servingDescription: '1 cup' }),
      makeLog({ name: 'Oatmeal', loggedAt: '2026-06-03T08:00:00.000Z', proteinG: 9, servingDescription: '1.5 cups' }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Oatmeal'); // most recent casing
    expect(result[0].proteinG).toBe(9); // most recent macros
    expect(result[0].servingDescription).toBe('1.5 cups');
    expect(result[0].lastLoggedAt).toBe('2026-06-03T08:00:00.000Z');
  });

  it('ranks by frequency descending', () => {
    const result = deriveRecentFoods([
      makeLog({ name: 'eggs', loggedAt: '2026-06-01T08:00:00.000Z' }),
      makeLog({ name: 'eggs', loggedAt: '2026-06-02T08:00:00.000Z' }),
      makeLog({ name: 'eggs', loggedAt: '2026-06-03T08:00:00.000Z' }),
      makeLog({ name: 'steak', loggedAt: '2026-06-04T08:00:00.000Z' }),
    ]);
    expect(result.map(r => r.key)).toEqual(['eggs', 'steak']);
    expect(result[0].count).toBe(3);
  });

  it('breaks frequency ties by recency (newest first)', () => {
    const result = deriveRecentFoods([
      makeLog({ name: 'apple', loggedAt: '2026-06-01T08:00:00.000Z' }),
      makeLog({ name: 'banana', loggedAt: '2026-06-05T08:00:00.000Z' }),
    ]);
    // Both count === 1, so the more recently logged (banana) ranks first.
    expect(result.map(r => r.key)).toEqual(['banana', 'apple']);
  });

  it('caps results at the limit (default 8)', () => {
    const logs = Array.from({ length: 12 }, (_, i) =>
      makeLog({ name: `food-${i}`, loggedAt: `2026-06-${String(i + 1).padStart(2, '0')}T08:00:00.000Z` }));
    expect(deriveRecentFoods(logs)).toHaveLength(8);
    expect(deriveRecentFoods(logs, { limit: 3 })).toHaveLength(3);
  });

  it('preserves source provenance from the most recent log', () => {
    const result = deriveRecentFoods([
      makeLog({ name: 'protein shake', loggedAt: '2026-06-01T08:00:00.000Z', source: 'photo' }),
      makeLog({ name: 'protein shake', loggedAt: '2026-06-02T08:00:00.000Z', source: 'barcode', barcodeEan: '12345' }),
    ]);
    expect(result[0].source).toBe('barcode');
    expect(result[0].barcodeEan).toBe('12345');
  });

  it('skips entries whose name is blank after normalization', () => {
    const result = deriveRecentFoods([
      makeLog({ name: '   ' }),
      makeLog({ name: 'real food' }),
    ]);
    expect(result.map(r => r.key)).toEqual(['real food']);
  });
});
