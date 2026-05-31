import { describe, expect, it } from 'vitest';

import { applyEwma, computeEwmaSeries, EWMA_ALPHA } from '@/utils/ewma';

// ─── applyEwma ────────────────────────────────────────────────────────────────

describe('applyEwma', () => {
  it('returns the new value unchanged when previousEwma is null (first reading)', () => {
    expect(applyEwma(100, null)).toBe(100);
  });

  it('returns the new value unchanged for any first reading value', () => {
    expect(applyEwma(75.5, null)).toBe(75.5);
    expect(applyEwma(0, null)).toBe(0);
  });

  it('applies the EWMA formula: α × new + (1−α) × previous', () => {
    // 0.1 × 100 + 0.9 × 90 = 10 + 81 = 91
    expect(applyEwma(100, 90)).toBe(91);
  });

  it('smooths a value lower than the previous EWMA', () => {
    // 0.1 × 80 + 0.9 × 100 = 8 + 90 = 98
    expect(applyEwma(80, 100)).toBe(98);
  });

  it('returns the same value when new and previous are equal', () => {
    expect(applyEwma(85, 85)).toBe(85);
  });

  it('rounds result to at most 2 decimal places', () => {
    // 0.1 × 101 + 0.9 × 100 = 10.1 + 90 = 100.1  → 100.1 (exact)
    const result = applyEwma(101, 100);
    const decimalPart = result.toString().split('.')[1] ?? '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  it('handles fractional weights without excessive precision', () => {
    // 0.1 × 82.3 + 0.9 × 80.1 = 8.23 + 72.09 = 80.32
    expect(applyEwma(82.3, 80.1)).toBe(80.32);
  });

  it('handles a new value of 0 with a positive previous EWMA', () => {
    // 0.1 × 0 + 0.9 × 100 = 90
    expect(applyEwma(0, 100)).toBe(90);
  });
});

// ─── computeEwmaSeries ───────────────────────────────────────────────────────

describe('computeEwmaSeries', () => {
  it('returns 0 for an empty array', () => {
    expect(computeEwmaSeries([])).toBe(0);
  });

  it('returns the single element unchanged for a one-element array', () => {
    expect(computeEwmaSeries([100])).toBe(100);
    expect(computeEwmaSeries([73.2])).toBe(73.2);
  });

  it('returns a value within the range of inputs for a typical series (smoothing property)', () => {
    const result = computeEwmaSeries([100, 110, 90]);
    expect(result).toBeGreaterThanOrEqual(90);
    expect(result).toBeLessThanOrEqual(110);
  });

  it('applies applyEwma iteratively across the array', () => {
    // Step 1: ewma = 100 (seed)
    // Step 2: 0.1 × 110 + 0.9 × 100 = 11 + 90 = 101
    // Step 3: 0.1 × 90  + 0.9 × 101 = 9 + 90.9 = 99.9
    expect(computeEwmaSeries([100, 110, 90])).toBe(99.9);
  });

  it('converges toward a stable weight over many identical readings', () => {
    const readings = Array.from({ length: 20 }).fill(80) as number[];
    const result = computeEwmaSeries(readings);
    expect(result).toBe(80);
  });

  it('produces a smoothed result across a longer realistic series', () => {
    // Realistic weight journey: initial heavier, trending down
    const readings = [95, 94.5, 94, 93.8, 93.5, 93.2, 93, 92.8];
    const result = computeEwmaSeries(readings);
    // Should be between the lowest and highest values in the series
    expect(result).toBeGreaterThanOrEqual(92.8);
    expect(result).toBeLessThanOrEqual(95);
  });

  it('result has at most 2 decimal places for a multi-step series', () => {
    const result = computeEwmaSeries([100, 110, 90]);
    const decimalPart = result.toString().split('.')[1] ?? '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });
});

// ─── EWMA_ALPHA constant ──────────────────────────────────────────────────────

describe('eWMA_ALPHA', () => {
  it('is exported and equals 0.1', () => {
    expect(EWMA_ALPHA).toBe(0.1);
  });
});
