/**
 * Exponential Weighted Moving Average (EWMA) for body weight smoothing.
 *
 * Safety-critical file — Rule 4 from CLAUDE.md requires 90%+ test coverage.
 * Pure functions only: no Supabase, no OpenAI, no side effects.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Slow smoothing factor appropriate for daily body-weight readings. */
export const EWMA_ALPHA = 0.1;

// ─── Core functions ───────────────────────────────────────────────────────────

/**
 * Apply one EWMA step.
 *
 * If `previousEwma` is null (first reading), the new value is returned as-is
 * (it becomes the seed for subsequent readings).
 *
 * Formula: EWMA = α × newValue + (1 − α) × previousEwma
 * Result is rounded to 2 decimal places.
 */
export function applyEwma(
  newValue: number,
  previousEwma: number | null,
): number {
  if (previousEwma === null) {
    return newValue;
  }
  const raw = EWMA_ALPHA * newValue + (1 - EWMA_ALPHA) * previousEwma;
  return Math.round(raw * 100) / 100;
}

/**
 * Compute the final EWMA value across a chronological series of readings.
 *
 * - Returns `0` for an empty array.
 * - Returns the single value unchanged for a one-element array.
 * - Otherwise applies `applyEwma` iteratively from the first reading.
 */
export function computeEwmaSeries(readings: number[]): number {
  if (readings.length === 0) return 0;

  let ewma: number | null = null;
  for (const reading of readings) {
    ewma = applyEwma(reading, ewma);
  }
  // ewma is guaranteed non-null here because readings.length > 0
  return ewma as number;
}
