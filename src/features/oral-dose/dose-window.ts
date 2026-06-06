/**
 * Oral dose window — pure timing + adherence logic.
 *
 * The oral GLP-1 differentiator: oral semaglutide (Rybelsus / oral Wegovy) must
 * be taken on an empty stomach with a small sip of water, then nothing else by
 * mouth for ~30 minutes or absorption craters. This module derives the live
 * "absorption window" state and the daily-dosing adherence streak.
 *
 * Safety-adjacent: feeds user-facing timing guidance and the adherence streak,
 * so it carries the Rule 4 test bar. Pure functions only — no Supabase, no side
 * effects. date-fns for all date/time math (Rule 6).
 */

import {
  differenceInCalendarDays,
  differenceInSeconds,
  format,
  isSameDay,
  parseISO,
} from 'date-fns';

/** Minutes the user should wait after an oral dose before eating or drinking. */
export const ABSORPTION_WINDOW_MIN = 30;
const ABSORPTION_WINDOW_SEC = ABSORPTION_WINDOW_MIN * 60;

export type DoseWindowState
  = | 'not_taken' // today's dose not logged yet
    | 'absorbing' // dose taken, still inside the 30-minute wait
    | 'clear'; // dose taken today and the wait has elapsed

export type DoseWindowInput = {
  /** ISO timestamp of the most recent logged oral dose, or null if none. */
  lastDoseTakenAt: string | null;
  /** ISO timestamp representing "now". */
  now: string;
};

export type DoseWindowResult = {
  state: DoseWindowState;
  /** Whole seconds left in the absorption window (0 unless absorbing). */
  secondsRemaining: number;
  /** Ceil of secondsRemaining to whole minutes (0 unless absorbing). */
  minutesRemaining: number;
};

/**
 * Derive the live dose-window state from the latest dose timestamp and now.
 *
 * Priority order is deliberate for safety:
 *  1. No dose ever → not_taken.
 *  2. Inside the absorption window (elapsed < 30 min) → absorbing, ALWAYS —
 *     even if the clock has rolled past midnight. Never imply a second dose
 *     while the previous one is still absorbing.
 *  3. Past the window AND taken on today's calendar date → clear (done today).
 *  4. Past the window AND taken on an earlier day → not_taken (today's pending).
 */
export function computeDoseWindow(input: DoseWindowInput): DoseWindowResult {
  const { lastDoseTakenAt, now } = input;

  if (lastDoseTakenAt === null) {
    return { state: 'not_taken', secondsRemaining: 0, minutesRemaining: 0 };
  }

  const nowDate = parseISO(now);
  const takenDate = parseISO(lastDoseTakenAt);

  // Clamp negative elapsed (future timestamp / clock skew) to 0 so a bad clock
  // never produces a negative countdown — treat it as "just taken".
  const elapsedSec = Math.max(0, differenceInSeconds(nowDate, takenDate));

  if (elapsedSec < ABSORPTION_WINDOW_SEC) {
    const secondsRemaining = ABSORPTION_WINDOW_SEC - elapsedSec;
    return {
      state: 'absorbing',
      secondsRemaining,
      minutesRemaining: Math.ceil(secondsRemaining / 60),
    };
  }

  if (isSameDay(takenDate, nowDate)) {
    return { state: 'clear', secondsRemaining: 0, minutesRemaining: 0 };
  }

  return { state: 'not_taken', secondsRemaining: 0, minutesRemaining: 0 };
}

/**
 * Most recent dose's calendar date ('YYYY-MM-DD'), or null when no doses.
 * Feeds calculateOralPhase's `lastDoseDate` argument. Robust to unsorted input.
 */
export function deriveLastDoseDate(takenAtList: string[]): string | null {
  if (takenAtList.length === 0)
    return null;

  let latest: Date | null = null;
  for (const iso of takenAtList) {
    const d = parseISO(iso);
    if (latest === null || d.getTime() > latest.getTime())
      latest = d;
  }
  return latest ? format(latest, 'yyyy-MM-dd') : null;
}

export type DoseAdherenceResult = {
  currentStreak: number;
  longestStreak: number;
  lastDoseDate: string | null; // 'YYYY-MM-DD' or null
};

/** One logged oral dose — timestamp plus whether the empty-stomach window was respected. */
export type DoseDay = {
  takenAt: string; // ISO 8601
  windowRespected: boolean | null;
};

/**
 * Technique-aware daily-dosing adherence streak.
 *
 * A calendar day counts toward the streak when it has at least one logged dose
 * AND the empty-stomach window was not broken that day. A day is "technique
 * broken" only when a dose that day is explicitly windowRespected === false
 * (the user reported eating or drinking early); such a day acts like a missing
 * day and breaks the run. Unanswered (null) and respected (true) days both
 * count — so with all-null data this behaves identically to a pure dosing
 * streak. Mirrors the protein streak engine: longest = max unbroken run;
 * current is live only when the most recent counting day is today or yesterday.
 * Future-dated logs are ignored.
 */
export function computeDoseAdherenceStreak(
  doses: DoseDay[],
  today: string,
): DoseAdherenceResult {
  const empty: DoseAdherenceResult = {
    currentStreak: 0,
    longestStreak: 0,
    lastDoseDate: null,
  };

  if (doses.length === 0)
    return empty;

  const todayDate = parseISO(today);

  // Group doses by calendar day. A day is technique-broken if ANY dose that day
  // was explicitly reported as not respecting the window. Future days dropped.
  const dayBroken = new Map<string, boolean>();
  for (const dose of doses) {
    const day = format(parseISO(dose.takenAt), 'yyyy-MM-dd');
    if (differenceInCalendarDays(parseISO(day), todayDate) > 0)
      continue;
    const wasBroken = dayBroken.get(day) ?? false;
    dayBroken.set(day, wasBroken || dose.windowRespected === false);
  }

  // Counting days = days with a dose that were not technique-broken, sorted asc.
  const dates = Array.from(dayBroken.entries())
    .filter(([, broken]) => !broken)
    .map(([day]) => day)
    .sort((a, b) => a.localeCompare(b));

  if (dates.length === 0)
    return empty;

  const lastDoseDate = dates[dates.length - 1]!;

  // Longest unbroken run across all dose days.
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const gap = differenceInCalendarDays(parseISO(dates[i]!), parseISO(dates[i - 1]!));
    if (gap === 1) {
      run += 1;
      if (run > longestStreak)
        longestStreak = run;
    }
    else {
      run = 1;
    }
  }

  // Current streak is live only if the last dose day is today or yesterday.
  let currentStreak = 0;
  if (differenceInCalendarDays(todayDate, parseISO(lastDoseDate)) <= 1) {
    currentStreak = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const gap = differenceInCalendarDays(parseISO(dates[i + 1]!), parseISO(dates[i]!));
      if (gap === 1)
        currentStreak += 1;
      else break;
    }
  }

  return { currentStreak, longestStreak, lastDoseDate };
}
