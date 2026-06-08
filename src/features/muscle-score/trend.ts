/**
 * Muscle Preservation Score — weekly TREND (Muscle-First MVP, Phase C).
 *
 * Builds a series of weekly snapshots of the 0-100 score for the Progress tab,
 * so the user can see whether their muscle protection is trending up over time.
 * Each snapshot recomputes the same composite as the Today hero, but "as of" the
 * end of that week: protein adherence over the trailing 28 days ending that week,
 * and resistance adherence over the weeks resolved by that week.
 *
 * Known approximation (documented): every historical day is scored against the
 * user's CURRENT protein floor (we do not store per-day floor history). Reusing
 * the live floor as the reference is good enough for a trend line.
 *
 * Pure functions only: no Supabase, no React, no Date. date-fns for all date math
 * (Rule 6). Named `trend.ts` (not `calculator.ts`) to stay out of the vitest
 * Rule-4 coverage-threshold globs while being fully tested in src/__tests__.
 */

import type { DayHit } from '@/features/progress/calculator';
import {
  addDays,
  addWeeks,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns';

import { computeResistanceFrequency } from '@/features/resistance/frequency';
import { calculateMuscleScore } from './score';

const DEFAULT_WEEKS = 10;
const DEFAULT_PROTEIN_WINDOW_DAYS = 28;

export type MuscleScoreTrendPoint = {
  /** Monday of the snapshot week, 'yyyy-MM-dd'. */
  weekStart: string;
  /** 0-100 muscle score as of the end of that week (capped at today for the current week). */
  score: number;
  /** False when neither lever was tracked yet that week (rendered as a gap). */
  hasEnoughData: boolean;
};

export type MuscleScoreTrendInput = {
  /** Per-day protein over at least `weeks*7 + proteinWindowDays` days. */
  history: DayHit[];
  /** ISO (or 'yyyy-MM-dd') resistance session timestamps. */
  resistanceDates: string[];
  proteinFloorG: number;
  /** 'yyyy-MM-dd' local today. */
  today: string;
  weeks?: number;
  proteinWindowDays?: number;
};

export function buildMuscleScoreTrend(
  input: MuscleScoreTrendInput,
): MuscleScoreTrendPoint[] {
  const weeks = input.weeks ?? DEFAULT_WEEKS;
  const windowDays = input.proteinWindowDays ?? DEFAULT_PROTEIN_WINDOW_DAYS;
  const hasFloor = input.proteinFloorG > 0;
  const todayDate = parseISO(input.today);

  const byDate = new Map<string, DayHit>();
  for (const d of input.history)
    byDate.set(d.date, d);

  const currentMonday = startOfWeek(todayDate, { weekStartsOn: 1 });
  const firstMonday = subWeeks(currentMonday, weeks - 1);

  const points: MuscleScoreTrendPoint[] = [];
  for (let i = 0; i < weeks; i++) {
    const weekMonday = addWeeks(firstMonday, i);
    const weekSunday = addDays(weekMonday, 6);
    // Snapshot as of the end of the week, capped at today for the in-progress week.
    const refDate = weekSunday > todayDate ? input.today : format(weekSunday, 'yyyy-MM-dd');
    const refDateObj = parseISO(refDate);

    // Protein adherence over the trailing window ending at refDate.
    let hits = 0;
    let daysWithData = 0;
    for (let k = 0; k < windowDays; k++) {
      const day = format(subDays(refDateObj, k), 'yyyy-MM-dd');
      const dh = byDate.get(day);
      if (dh?.hasData) {
        daysWithData += 1;
        if (dh.hitFloor)
          hits += 1;
      }
    }
    const proteinAdherence = hasFloor && daysWithData > 0 ? hits / daysWithData : null;

    const rf = computeResistanceFrequency(input.resistanceDates, refDate);

    const result = calculateMuscleScore({
      proteinAdherence,
      proteinDaysTracked: hasFloor ? daysWithData : 0,
      resistanceAdherence: rf.weeksTracked > 0 ? rf.hitRate : null,
      resistanceWeeksTracked: rf.weeksTracked,
    });

    points.push({
      weekStart: format(weekMonday, 'yyyy-MM-dd'),
      score: result.score,
      hasEnoughData: result.hasEnoughData,
    });
  }

  return points;
}
