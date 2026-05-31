/**
 * Streak calculator for DosePath protein-logging streaks.
 *
 * Safety-critical file — Rule 4 from CLAUDE.md requires 90%+ test coverage.
 * Pure functions only: no Supabase, no OpenAI, no side effects.
 * Date math uses date-fns only (Rule 6).
 */

import { differenceInCalendarDays, parseISO } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fraction of protein floor required to count as a streak day. */
export const STREAK_THRESHOLD = 0.8;

// ─── Types ────────────────────────────────────────────────────────────────────

export type StreakDayInput = {
  date: string; // 'YYYY-MM-DD'
  proteinConsumedG: number;
  proteinFloorG: number;
};

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null; // 'YYYY-MM-DD' or null
  todayCountsAsStreak: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if a day's protein intake meets or exceeds the threshold.
 * A day with proteinFloorG === 0 never counts (avoids divide-by-zero).
 */
function dayCountsAsStreak(day: StreakDayInput): boolean {
  if (day.proteinFloorG <= 0)
    return false;
  return day.proteinConsumedG / day.proteinFloorG >= STREAK_THRESHOLD;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Calculate streak statistics from a list of daily protein log entries.
 *
 * @param days  - Array of daily entries (any order; duplicates ignored — first wins).
 * @param today - Reference date in 'YYYY-MM-DD' format.
 * @returns     StreakResult
 *
 * Algorithm:
 *  1. Sort days chronologically ascending.
 *  2. Discard entries with date > today.
 *  3. A day "counts" when proteinFloorG > 0 AND consumed/floor >= STREAK_THRESHOLD.
 *  4. currentStreak: walk backwards from the most recent streak day.
 *     The streak is still "live" if the last streak day was today OR yesterday.
 *     If 2+ days ago with no streak day in between, currentStreak = 0.
 *  5. longestStreak: max unbroken run in any part of history.
 *  6. lastStreakDate: ISO date of most recent day that counted, or null.
 *  7. todayCountsAsStreak: true only if today has an entry that counts.
 */
export function calculateStreaks(
  days: StreakDayInput[],
  today: string,
): StreakResult {
  const empty: StreakResult = {
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    todayCountsAsStreak: false,
  };

  if (days.length === 0)
    return empty;

  const todayDate = parseISO(today);

  // Filter out future entries, then sort chronologically ascending.
  const sorted = days
    .filter(d => differenceInCalendarDays(parseISO(d.date), todayDate) <= 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0)
    return empty;

  // ── Pass 1: build an array of "qualifying" dates (days that count) ──────────
  const streakDates: string[] = sorted
    .filter(dayCountsAsStreak)
    .map(d => d.date);

  const lastStreakDate = streakDates.length > 0
    ? streakDates[streakDates.length - 1]!
    : null;

  // ── todayCountsAsStreak ───────────────────────────────────────────────────
  const todayEntry = sorted.find(d => d.date === today);
  const todayCountsAsStreak = todayEntry !== undefined && dayCountsAsStreak(todayEntry);

  if (streakDates.length === 0) {
    return { ...empty, todayCountsAsStreak };
  }

  // ── Pass 2: compute longest streak across all qualifying dates ────────────
  let longestStreak = 1;
  let runLength = 1;

  for (let i = 1; i < streakDates.length; i++) {
    const prev = parseISO(streakDates[i - 1]!);
    const curr = parseISO(streakDates[i]!);
    const gap = differenceInCalendarDays(curr, prev);

    if (gap === 1) {
      runLength += 1;
      if (runLength > longestStreak)
        longestStreak = runLength;
    }
    else {
      runLength = 1;
    }
  }

  // ── Pass 3: compute currentStreak (backwards from last streak date) ────────
  // The streak is "live" if the last streak day is today or yesterday.
  const lastDate = parseISO(lastStreakDate!);
  const daysSinceLast = differenceInCalendarDays(todayDate, lastDate);

  let currentStreak = 0;

  if (daysSinceLast <= 1) {
    // Walk backwards through streakDates to count the unbroken tail.
    currentStreak = 1;
    for (let i = streakDates.length - 2; i >= 0; i--) {
      const laterDate = parseISO(streakDates[i + 1]!);
      const earlierDate = parseISO(streakDates[i]!);
      const gap = differenceInCalendarDays(laterDate, earlierDate);
      if (gap === 1) {
        currentStreak += 1;
      }
      else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastStreakDate,
    todayCountsAsStreak,
  };
}
