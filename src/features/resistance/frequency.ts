/**
 * Resistance-training frequency — pure weekly-cadence logic.
 *
 * Resistance training for muscle preservation is a WEEKLY-FREQUENCY behavior
 * (2 to 3 sessions/week), so this is the weekly counterpart to the daily protein
 * streak. From a list of logged session timestamps it buckets distinct training
 * DAYS into Monday-aligned calendar weeks and scores each RESOLVED past week as a
 * hit (>= target distinct days) or miss. The current (in-progress) week is never
 * scored as a miss. It is surfaced as `currentWeekSessions` only, so an incomplete
 * week never breaks the streak or dents the rate. Mirrors the resolved-vs-pending
 * discipline of computeInjectionAdherence.
 *
 * Two sessions on the same calendar day count as ONE training day (distinct-day
 * dedupe), so a double-log can never inflate a week.
 *
 * Safety-adjacent: feeds the Muscle Preservation Score (Phase B) and a user-facing
 * consistency view, so it carries thorough branch tests. Pure functions only, no
 * Supabase, no side effects. date-fns for all date math (Rule 6).
 */

import { addWeeks, format, parseISO, startOfWeek } from 'date-fns';

/** Distinct training days per week that count as adherent for muscle preservation (2 to 3x/week). */
export const RESISTANCE_WEEKLY_TARGET = 2;

export type ResistanceFrequencyResult = {
  /** Distinct training days in the current (Monday-aligned) week, on or before today. */
  currentWeekSessions: number;
  /** The weekly target used for hit/miss scoring. */
  weeklyTarget: number;
  /** Consecutive most-recent RESOLVED weeks that hit target (current week pending, never penalized). */
  currentStreak: number;
  /** Longest run of consecutive target-hitting weeks across all history. */
  longestStreak: number;
  /** Resolved weeks (hits + misses) from the first session's week through the week before the current. */
  weeksTracked: number;
  /** hitWeeks / weeksTracked in [0, 1]; 0 when weeksTracked is 0. */
  hitRate: number;
  /** Distinct training days on or before today. */
  loggedCount: number;
};

const EMPTY: ResistanceFrequencyResult = {
  currentWeekSessions: 0,
  weeklyTarget: RESISTANCE_WEEKLY_TARGET,
  currentStreak: 0,
  longestStreak: 0,
  weeksTracked: 0,
  hitRate: 0,
  loggedCount: 0,
};

/** Normalize an ISO or date string to its LOCAL 'yyyy-MM-dd' calendar day. */
function toLocalDay(s: string): string {
  return format(parseISO(s), 'yyyy-MM-dd');
}

/** Monday-aligned week-start key ('yyyy-MM-dd') for a local 'yyyy-MM-dd' day. */
function weekKey(day: string): string {
  return format(startOfWeek(parseISO(day), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

/**
 * Score resistance-training consistency as a weekly cadence.
 *
 * Distinct training days are bucketed into Monday-aligned weeks. Each week from
 * the first session's week up to (but not including) the current week resolves to:
 *  - hit:  distinct training days in the week >= target.
 *  - miss: fewer than target (including zero-session weeks).
 * The current week is pending (surfaced as `currentWeekSessions`), never a miss,
 * so an in-progress week never breaks the streak or dents the rate.
 */
export function computeResistanceFrequency(
  sessionDates: string[],
  today: string,
  weeklyTarget: number = RESISTANCE_WEEKLY_TARGET,
): ResistanceFrequencyResult {
  const target = weeklyTarget > 0 ? weeklyTarget : 1;
  const todayKey = toLocalDay(today);

  // Distinct training days on or before today.
  const daySet = new Set<string>();
  for (const raw of sessionDates) {
    const d = toLocalDay(raw);
    if (d <= todayKey)
      daySet.add(d);
  }
  if (daySet.size === 0)
    return { ...EMPTY, weeklyTarget: target };

  const loggedCount = daySet.size;

  // Count distinct training days per Monday-aligned week.
  const countByWeek = new Map<string, number>();
  for (const d of daySet) {
    const wk = weekKey(d);
    countByWeek.set(wk, (countByWeek.get(wk) ?? 0) + 1);
  }

  const currentWeekStart = startOfWeek(parseISO(todayKey), { weekStartsOn: 1 });
  const currentWeekSessions = countByWeek.get(format(currentWeekStart, 'yyyy-MM-dd')) ?? 0;

  // Resolved past weeks: iterate every week from the first session's week up to
  // (but not including) the current week, so zero-session weeks count as misses.
  const sortedDays = Array.from(daySet).sort();
  let cursor = startOfWeek(parseISO(sortedDays[0]!), { weekStartsOn: 1 });

  const resolved: boolean[] = []; // true = hit (>= target distinct days)
  while (cursor < currentWeekStart) {
    const sessions = countByWeek.get(format(cursor, 'yyyy-MM-dd')) ?? 0;
    resolved.push(sessions >= target);
    cursor = addWeeks(cursor, 1);
  }

  const weeksTracked = resolved.length;
  const hitWeeks = resolved.filter(Boolean).length;
  const hitRate = weeksTracked > 0 ? hitWeeks / weeksTracked : 0;

  // Longest consecutive-hit run.
  let longestStreak = 0;
  let run = 0;
  for (const ok of resolved) {
    if (ok) {
      run += 1;
      if (run > longestStreak)
        longestStreak = run;
    }
    else {
      run = 0;
    }
  }

  // Current streak = trailing consecutive hits ending at the last resolved week.
  let currentStreak = 0;
  for (let i = resolved.length - 1; i >= 0; i--) {
    if (resolved[i])
      currentStreak += 1;
    else break;
  }

  return {
    currentWeekSessions,
    weeklyTarget: target,
    currentStreak,
    longestStreak,
    weeksTracked,
    hitRate,
    loggedCount,
  };
}
