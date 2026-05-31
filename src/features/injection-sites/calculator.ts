import type { SiteCode } from './constants';

import type { InjectionLog } from './types';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { REST_DAYS, SITE_ROTATION_ORDER } from './constants';

/**
 * Result of computing the rotation state.
 *  - `recommendation`: the SiteCode to recommend next (always defined).
 *  - `allResting`: true when every site has been used within REST_DAYS — UI
 *    should show a warning banner ("All sites within rest period") but still
 *    recommend the least-recently-used site so the user can proceed if needed.
 */
export type RotationState = {
  recommendation: SiteCode;
  allResting: boolean;
};

/**
 * Compute the next recommended injection site.
 *
 * Algorithm:
 *  1. Build a map: site_code → most recent log timestamp.
 *  2. Walk SITE_ROTATION_ORDER. Return the first site that is either
 *     never used OR whose most recent use is ≥ REST_DAYS ago.
 *  3. If every site is within its rest window, return the
 *     least-recently-used site and set `allResting = true`.
 *
 * Rule 4 (safety code): this function is exercised by calculator.test.ts at
 * ≥90% branch coverage. Do not change behavior without updating tests.
 *
 * @param logs — any-order list of injection logs (may be empty)
 * @param today — ISO timestamp used as "now" (default: current time). Exposed
 *                for deterministic testing.
 */
export function computeNextSite(
  logs: InjectionLog[],
  today: string = new Date().toISOString(),
): RotationState {
  const todayDate = parseISO(today);

  // Build lastUsedAt map: site_code → most recent ISO timestamp.
  // Using `?? ''` lets us collapse the "no entry yet" and "newer log" branches
  // into a single comparison — empty string sorts before any valid ISO string.
  const lastUsedAt = new Map<SiteCode, string>();
  for (const log of logs) {
    const code = log.site_code as SiteCode;
    if (!SITE_ROTATION_ORDER.includes(code))
      continue; // defensive: unknown code
    const existing = lastUsedAt.get(code) ?? '';
    if (log.injected_at > existing) {
      lastUsedAt.set(code, log.injected_at);
    }
  }

  // Pass 1 — first non-resting site in rotation order.
  for (const code of SITE_ROTATION_ORDER) {
    const last = lastUsedAt.get(code);
    if (!last)
      return { recommendation: code, allResting: false };
    const daysSince = differenceInCalendarDays(todayDate, parseISO(last));
    if (daysSince >= REST_DAYS) {
      return { recommendation: code, allResting: false };
    }
  }

  // Pass 2 — every site is resting. Return the least-recently-used.
  // Precondition (established by Pass 1 completing the loop): lastUsedAt
  // has an entry for every site in SITE_ROTATION_ORDER, so the `get` calls
  // below cannot return undefined.
  let oldestCode: SiteCode = SITE_ROTATION_ORDER[0];
  let oldestAt = lastUsedAt.get(oldestCode) as string;
  for (let i = 1; i < SITE_ROTATION_ORDER.length; i++) {
    const code = SITE_ROTATION_ORDER[i];
    const at = lastUsedAt.get(code) as string;
    if (at < oldestAt) {
      oldestAt = at;
      oldestCode = code;
    }
  }
  return { recommendation: oldestCode, allResting: true };
}
