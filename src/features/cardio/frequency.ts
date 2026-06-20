/**
 * Cardio frequency + the muscle-vs-cardio interference check — pure logic.
 *
 * Cardio is a SECONDARY tracker. Unlike resistance, it has NO weekly target and no
 * "aim higher" framing: the message is moderation, not a goal. This module only
 * counts distinct cardio DAYS in the current Monday-aligned week, and decides when
 * to surface the educational interference warning.
 *
 * Clinical basis (concurrent-training interference effect, amplified in a GLP-1
 * caloric deficit): a lot of cardio relative to resistance can compete with muscle
 * retention. The warning fires when this week's cardio sessions OUTPACE this week's
 * resistance sessions, with a small floor so a single early-week cardio log does not
 * trip a scary warning. The Muscle Preservation Score is NOT affected by any of this.
 *
 * Pure functions only, no Supabase, no side effects. date-fns for all date math (Rule 6).
 */

import { format, parseISO, startOfWeek } from 'date-fns';

/**
 * Minimum cardio sessions this week before the interference warning can fire.
 * Floor stops a lone Monday cardio (1 vs 0 resistance) from tripping a warning.
 * Pharmacist-confirmable (joins attorney/pharmacist queue #89).
 */
export const CARDIO_INTERFERENCE_FLOOR = 3;

export type CardioFrequencyResult = {
  /** Distinct cardio days in the current (Monday-aligned) week, on or before today. */
  currentWeekSessions: number;
  /** Distinct cardio days on or before today (all history). */
  loggedCount: number;
};

const EMPTY: CardioFrequencyResult = {
  currentWeekSessions: 0,
  loggedCount: 0,
};

/** Normalize an ISO or date string to its LOCAL 'yyyy-MM-dd' calendar day. */
function toLocalDay(s: string): string {
  return format(parseISO(s), 'yyyy-MM-dd');
}

/**
 * Count distinct cardio days, bucketing the current Monday-aligned week.
 * Two sessions on the same calendar day count as ONE cardio day (distinct-day
 * dedupe), so a double-log can never inflate the week. There is no hit/miss or
 * streak: cardio is secondary, surfaced as a count only.
 */
export function computeCardioFrequency(
  sessionDates: string[],
  today: string,
): CardioFrequencyResult {
  const todayKey = toLocalDay(today);

  const daySet = new Set<string>();
  for (const raw of sessionDates) {
    const d = toLocalDay(raw);
    if (d <= todayKey)
      daySet.add(d);
  }
  if (daySet.size === 0)
    return { ...EMPTY };

  const currentWeekStart = format(
    startOfWeek(parseISO(todayKey), { weekStartsOn: 1 }),
    'yyyy-MM-dd',
  );

  let currentWeekSessions = 0;
  for (const d of daySet) {
    const wk = format(startOfWeek(parseISO(d), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (wk === currentWeekStart)
      currentWeekSessions += 1;
  }

  return { currentWeekSessions, loggedCount: daySet.size };
}

/**
 * Whether to show the muscle-vs-cardio interference warning.
 *
 * True only when this week's cardio sessions exceed this week's resistance sessions
 * AND cardio has reached the floor. Relative + self-adjusting: the user clears the
 * warning by keeping resistance at least even with cardio (the muscle-first message),
 * not by capping cardio at a fixed number.
 */
export function cardioInterference(input: {
  cardioThisWeek: number;
  resistanceThisWeek: number;
}): boolean {
  return (
    input.cardioThisWeek >= CARDIO_INTERFERENCE_FLOOR
    && input.cardioThisWeek > input.resistanceThisWeek
  );
}
