/**
 * Adapts weekly resistance frequency into the Muscle Preservation Score's
 * resistance lever, COUNTING THE CURRENT (in-progress) week.
 *
 * `computeResistanceFrequency` deliberately resolves only PAST weeks (so a
 * mid-week can never be scored a miss), surfacing the live week as
 * `currentWeekSessions`. The muscle score, however, must treat current-week
 * training as real: a user who logs sessions this week should see resistance
 * "tracked", not "log a resistance session this week". So:
 *   - the current week is added as one scored week whenever it has >= 1 session;
 *   - it contributes a FULL hit (1.0) once it meets the weekly target, or
 *     partial progress (sessions / target, capped at 1) while still building;
 *   - resolved past weeks keep their binary hit/miss.
 * Resistance stays untracked (null) only when there is no logged session at all.
 *
 * Pure: no React, no Date, no Supabase. Safety-adjacent — fully branch-tested.
 */

import type { ResistanceFrequencyResult } from '@/features/resistance/frequency';

export type ResistanceScoreInput = {
  /** 0..1 resistance adherence for the score, or null when there is no data. */
  adherence: number | null;
  /** Scored weeks (resolved + the current week when it has sessions). */
  weeksTracked: number;
};

export function deriveResistanceInput(freq: ResistanceFrequencyResult): ResistanceScoreInput {
  const { weeksTracked, hitRate, currentWeekSessions, weeklyTarget } = freq;
  const target = weeklyTarget > 0 ? weeklyTarget : 1;
  const hasCurrent = currentWeekSessions > 0;
  const scoredWeeks = weeksTracked + (hasCurrent ? 1 : 0);

  if (scoredWeeks === 0)
    return { adherence: null, weeksTracked: 0 };

  // hitRate * weeksTracked recovers the integer hit-week count; round off float error.
  const resolvedHits = Math.round(hitRate * weeksTracked);
  const currentContribution = hasCurrent ? Math.min(1, currentWeekSessions / target) : 0;
  const adherence = (resolvedHits + currentContribution) / scoredWeeks;

  return { adherence, weeksTracked: scoredWeeks };
}
