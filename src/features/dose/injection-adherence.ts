/**
 * Injection adherence — pure on-time-streak + rate logic.
 *
 * The injection counterpart to the oral `computeDoseAdherenceStreak`. From a list
 * of logged injection dates and the dosing interval, it derives an expected
 * schedule (first dose + k·interval) and scores each expected dose-day as on-time
 * (a log within a +/- 1 day grace), missed, or still-open (the current period,
 * never penalized). Returns a consecutive-on-time streak (in expected-dose units,
 * i.e. weeks for a weekly regimen) plus an on-time rate.
 *
 * Safety-adjacent: feeds the user-facing adherence view the user may show a
 * prescriber, so it carries thorough branch tests. Pure functions only — no
 * Supabase, no side effects. date-fns for all date math (Rule 6).
 */

import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** Days of slack on either side of an expected dose-day that still count as on-time. */
const GRACE_DAYS = 1;

export type InjectionAdherenceResult = {
  /** Consecutive most-recent RESOLVED expected doses hit on-time. */
  currentStreak: number;
  /** Longest run of consecutive on-time expected doses across all history. */
  longestStreak: number;
  /** onTime / expectedCount in [0, 1]; 0 when expectedCount is 0. */
  onTimeRate: number;
  /** Resolved expected dose-days (hits + misses; excludes the open current slot). */
  expectedCount: number;
  /** Distinct logged dose-days on or before today. */
  loggedCount: number;
};

const EMPTY: InjectionAdherenceResult = {
  currentStreak: 0,
  longestStreak: 0,
  onTimeRate: 0,
  expectedCount: 0,
  loggedCount: 0,
};

/** Normalize an ISO or date string to its 'YYYY-MM-DD' calendar-day prefix. */
function toDay(s: string): string {
  return s.slice(0, 10);
}

/**
 * Infer the dosing interval (days) from logged dates. Looks at the gap between
 * the two most recent distinct calendar days: <=2 -> daily, <=10 -> weekly, else
 * biweekly. Falls back to weekly (7) when there are fewer than 2 distinct days.
 * Mirrors the private deriveIntervalDays in medication-level/hooks.ts so the
 * adherence view stays independent of the PK curve hook.
 */
export function deriveInjectionIntervalDays(dates: string[]): number {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of dates) {
    const d = toDay(raw);
    if (!seen.has(d)) {
      seen.add(d);
      unique.push(d);
    }
  }
  if (unique.length < 2)
    return 7;

  // Sort descending so [0] and [1] are the two most recent distinct days.
  unique.sort((a, b) => b.localeCompare(a));
  const gap = Math.abs(
    differenceInCalendarDays(parseISO(unique[0]!), parseISO(unique[1]!)),
  );
  if (gap <= 2)
    return 1;
  if (gap <= 10)
    return 7;
  return 14;
}

/**
 * Score injection adherence against an expected schedule.
 *
 * Expected dose-days are `firstDose + k·interval` for k = 0, 1, ... while the day
 * is on or before today. Each expected day resolves to:
 *  - hit:     a logged dose exists within +/- GRACE_DAYS of it.
 *  - missed:  no nearby log AND its grace window has fully passed (today is more
 *             than GRACE_DAYS past it).
 *  - pending: no nearby log but the grace window is still open (the current
 *             period) — skipped entirely so an in-progress period never breaks the
 *             streak or dents the rate.
 *
 * Streaks count consecutive on-time hits over the resolved (hit/miss) slots.
 */
export function computeInjectionAdherence(
  injectedDates: string[],
  intervalDays: number,
  today: string,
): InjectionAdherenceResult {
  if (intervalDays <= 0)
    return EMPTY;

  const todayDate = parseISO(today);

  // Distinct logged calendar days on or before today.
  const loggedSet = new Set<string>();
  for (const raw of injectedDates) {
    const d = toDay(raw);
    if (differenceInCalendarDays(todayDate, parseISO(d)) >= 0)
      loggedSet.add(d);
  }
  if (loggedSet.size === 0)
    return { ...EMPTY };

  const loggedCount = loggedSet.size;
  const loggedDays = Array.from(loggedSet)
    .map(d => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  const firstDose = loggedDays[0]!;

  // Resolve each expected slot in chronological order.
  const resolved: boolean[] = []; // true = on-time hit, false = missed
  for (let k = 0; ; k++) {
    const expected = addDays(firstDose, k * intervalDays);
    const diffFromToday = differenceInCalendarDays(todayDate, expected);
    if (diffFromToday < 0)
      break; // expected day is in the future — stop

    const hit = loggedDays.some(
      log => Math.abs(differenceInCalendarDays(log, expected)) <= GRACE_DAYS,
    );
    if (hit) {
      resolved.push(true);
    }
    else if (diffFromToday > GRACE_DAYS) {
      resolved.push(false); // grace window fully passed with no log -> missed
    }
    // else: pending (current open slot) -> skip
  }

  const expectedCount = resolved.length;
  if (expectedCount === 0)
    return { ...EMPTY, loggedCount };

  const onTimeCount = resolved.filter(Boolean).length;
  const onTimeRate = onTimeCount / expectedCount;

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

  // Current streak = trailing consecutive hits ending at the last resolved slot.
  let currentStreak = 0;
  for (let i = resolved.length - 1; i >= 0; i--) {
    if (resolved[i])
      currentStreak += 1;
    else break;
  }

  return { currentStreak, longestStreak, onTimeRate, expectedCount, loggedCount };
}

// Re-exported for callers that want to format the most recent logged day.
export function deriveLastInjectionDate(dates: string[]): string | null {
  let latest: string | null = null;
  for (const raw of dates) {
    const d = toDay(raw);
    if (latest === null || d > latest)
      latest = d;
  }
  return latest ? format(parseISO(latest), 'yyyy-MM-dd') : null;
}
