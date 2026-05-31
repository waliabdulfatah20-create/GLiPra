/**
 * Pure logic for the Progress tab dashboard.
 *
 * All functions are pure (no Supabase, no React, no Date.now()).
 * All date math via date-fns (Rule 6).
 * Reuses STREAK_THRESHOLD = 0.8 from src/features/streaks/calculator.ts —
 * do NOT redeclare here.
 */

import {
  differenceInCalendarDays,
  format,
  parseISO,
  subDays,
} from 'date-fns';

import { STREAK_THRESHOLD } from '@/features/streaks/calculator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayProteinEntry = {
  /** 'YYYY-MM-DD' local-date string */
  date: string;
  proteinG: number;
};

export type DayHit = {
  /** 'YYYY-MM-DD' local-date string */
  date: string;
  proteinG: number;
  /** True when proteinG ≥ STREAK_THRESHOLD × proteinFloorG and floor > 0 */
  hitFloor: boolean;
  /** True when the user logged any food this day (proteinG > 0 OR explicit entry) */
  hasData: boolean;
};

export type SymptomEntry = {
  date: string;
  /** 1-5 scale; null when not recorded */
  score: number | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns 'YYYY-MM-DD' strings for the last N days (oldest first, asOf last).
 */
function lastNDays(days: number, asOf: Date): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(format(subDays(asOf, i), 'yyyy-MM-dd'));
  }
  return out;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a per-day hit array for the last N days (oldest → newest).
 *
 * - Missing days get a zero-protein, hitFloor=false, hasData=false entry.
 * - Entries from before the window or in the future are excluded.
 * - Multiple entries for the same date are summed.
 * - proteinFloorG <= 0 yields hitFloor=false for every day (guard against
 *   misconfigured profiles producing NaN/Infinity progress ratios).
 */
export function buildHitHistory(
  entries: DayProteinEntry[],
  proteinFloorG: number,
  days: number,
  asOf: Date,
): DayHit[] {
  const window = lastNDays(days, asOf);
  const windowSet = new Set(window);

  // Sum protein per date, excluding entries outside the window.
  const sums = new Map<string, number>();
  for (const e of entries) {
    if (!windowSet.has(e.date))
      continue;
    sums.set(e.date, (sums.get(e.date) ?? 0) + e.proteinG);
  }

  return window.map((date) => {
    const proteinG = sums.get(date) ?? 0;
    const hasData = sums.has(date);
    const hitFloor
      = proteinFloorG > 0 && proteinG / proteinFloorG >= STREAK_THRESHOLD;
    return { date, proteinG, hitFloor, hasData };
  });
}

/**
 * Fraction (0..1) of days in `history` that hit the floor.
 * Returns 0 for an empty array (no days to compute against).
 */
export function calculateHitRate(history: DayHit[]): number {
  if (history.length === 0)
    return 0;
  const hits = history.filter(d => d.hitFloor).length;
  return hits / history.length;
}

/**
 * Injection adherence over the last N days.
 *
 * expected = floor(days / intervalDays)
 *   - For weekly (interval 7) over 30 days: expected = 4 shots
 *   - For daily (interval 1): expected = 30 shots
 * actual   = count of distinct injection dates within the window
 *
 * Returns adherence in [0, 1], capped at 1 (over-injecting is a clinical
 * concern, not a data-completeness concern — don't penalize on the chart).
 *
 * Returns 0 when expected = 0 (avoids divide-by-zero — happens if interval >
 * window, e.g. biweekly with 7-day window).
 */
export function calculateAdherence(
  injectionDates: string[],
  intervalDays: number,
  days: number,
  asOf: Date,
): number {
  if (intervalDays <= 0 || days <= 0)
    return 0;
  const expected = Math.floor(days / intervalDays);
  if (expected === 0)
    return 0;

  const windowStart = subDays(asOf, days - 1);
  const seen = new Set<string>();
  for (const raw of injectionDates) {
    const d = parseISO(raw);
    const diff = differenceInCalendarDays(asOf, d);
    // Within window: 0 <= diff <= days - 1 (inclusive). Also exclude future dates.
    if (diff < 0)
      continue;
    if (diff > days - 1)
      continue;
    // Use the same YYYY-MM-DD slice the date string already starts with
    seen.add(raw.slice(0, 10));
  }

  // Belt: also discard dates older than windowStart computed via date-fns
  // (defensive — already covered above, but keeps the intent obvious)
  const inWindow = Array.from(seen).filter(
    d => differenceInCalendarDays(asOf, parseISO(d)) <= days - 1,
  );

  const actual = inWindow.length;
  return Math.min(actual / expected, 1);
}

/**
 * Average of all non-null symptom scores in the window.
 * Returns null when no scored entries exist — UI shows an empty state rather
 * than a misleading "0".
 */
export function calculateAverageSymptom(
  entries: SymptomEntry[],
  days: number,
  asOf: Date,
): number | null {
  const windowSet = new Set(lastNDays(days, asOf));
  const scores: number[] = [];
  for (const e of entries) {
    if (!windowSet.has(e.date))
      continue;
    if (e.score == null)
      continue;
    scores.push(e.score);
  }
  if (scores.length === 0)
    return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
