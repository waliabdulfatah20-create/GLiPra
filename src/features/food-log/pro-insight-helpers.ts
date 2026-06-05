/**
 * Pro Insight helpers — pure functions that compute the headline + subline
 * shown on the AI Review Sheet after a meal is identified.
 *
 * Deterministic: no AI call, no fetch. Inputs come from `useTodayData()` and
 * the AI review form. Outputs are i18n keys + interpolation vars; the
 * component does the actual t(...) rendering.
 *
 * Pharmacist-credentialing rule (CLAUDE.md Liability Rule 2): this feature
 * MUST NOT invoke pharmacist authority. The label is "PRO INSIGHT" not
 * "PHARMACIST INSIGHT". Subline copy describes typical appetite patterns +
 * protein food suggestions only — no medication advice.
 */

import type { InjectionPhase } from '@/types';

export type InsightInput = {
  /** Protein already consumed today before this meal (from useDailyMacros). */
  proteinConsumedG: number;
  /** Protein the AI estimated for THIS meal (or what the user edited it to). */
  mealProteinG: number;
  /** User's daily protein floor. Null if pre-onboarding or discontinued. */
  proteinFloorG: number | null;
  /** Current injection cycle phase. Null if no injection logged yet. */
  phase: InjectionPhase | null;
  /** Days since last injection. Null if no injection logged. */
  daysSinceInjection: number | null;
};

export type InsightHeadlineKey
  = | 'headline_under_floor'
    | 'headline_at_floor'
    | 'headline_over_floor';

export type InsightSublineKey
  = | 'subline_injection_day'
    | 'subline_peak_suppression'
    | 'subline_adjustment'
    | 'subline_recovery_window'
    | 'subline_overdue';

export type InsightOutput = {
  headlineKey: InsightHeadlineKey;
  /** Interpolation values for the headline i18n template. */
  headlineVars: {
    projectedG: number;
    remainingG: number;
    overG: number;
    floorG: number;
  };
  /** i18n key for the contextual subline, or null when no injection logged. */
  sublineKey: InsightSublineKey | null;
  /** Interpolation value for sublines that reference a specific day count. */
  sublineVars: { day: number };
};

/** Margin (in grams) within which a meal is considered to "hit" the floor exactly. */
export const FLOOR_HIT_TOLERANCE_G = 2;

/**
 * Compose a Pro Insight from today's data + this meal's projected protein.
 *
 * Returns `null` to signal "suppress the card entirely". Callers should also
 * suppress when the user is in `medicationStatus === 'discontinued'`, since
 * the protein floor still exists but the phase nudges no longer apply; that
 * check lives in the component, not here.
 */
export function composeInsight(input: InsightInput): InsightOutput | null {
  const {
    proteinConsumedG,
    mealProteinG,
    proteinFloorG,
    phase,
    daysSinceInjection,
  } = input;

  // Suppression: no floor → nothing to compare against.
  if (proteinFloorG == null || proteinFloorG <= 0)
    return null;

  // Suppression: a zero-protein meal (e.g. plain water) still renders the card
  // but the math is a no-op. We allow it so the user sees their current
  // floor status, but skip if BOTH consumed and meal are zero (no data yet).
  if (proteinConsumedG <= 0 && mealProteinG <= 0)
    return null;

  const projectedG = Math.max(0, Math.round(proteinConsumedG + mealProteinG));
  const diff = projectedG - proteinFloorG;

  let headlineKey: InsightHeadlineKey;
  if (diff < -FLOOR_HIT_TOLERANCE_G)
    headlineKey = 'headline_under_floor';
  else if (diff > FLOOR_HIT_TOLERANCE_G)
    headlineKey = 'headline_over_floor';
  else
    headlineKey = 'headline_at_floor';

  const headlineVars = {
    projectedG,
    remainingG: Math.max(0, proteinFloorG - projectedG),
    overG: Math.max(0, projectedG - proteinFloorG),
    floorG: proteinFloorG,
  };

  const sublineKey = phaseSublineKey(phase);
  const sublineVars = { day: Math.max(0, daysSinceInjection ?? 0) };

  return { headlineKey, headlineVars, sublineKey, sublineVars };
}

function phaseSublineKey(phase: InjectionPhase | null): InsightSublineKey | null {
  if (phase == null)
    return null;
  switch (phase) {
    case 'injection_day':
      return 'subline_injection_day';
    case 'peak_suppression':
      return 'subline_peak_suppression';
    case 'adjustment':
      return 'subline_adjustment';
    case 'recovery_window':
      return 'subline_recovery_window';
    case 'overdue':
      return 'subline_overdue';
    default: {
      // Exhaustiveness check — TypeScript will error if a phase is added
      // without updating this switch.
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}
