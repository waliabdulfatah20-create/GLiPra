import type { InjectionCycleResult } from '@/features/injection-cycle/calculator';

// Decision for the injection "smart dose row" on Today and the status line in the
// Dose hub. Keeps the de-duplicated dose UX in one tested place rather than spread
// across screens. Pure: no UI, no i18n resolution (callers translate pillKey).
export type InjectionDoseRow = {
  /** i18n key for the pill text. */
  pillKey: 'today.dose_row_log_shot' | 'today.dose_row_overdue' | 'today.dose_row_next';
  /** Days until the next scheduled dose; only meaningful for the "next" pill. */
  days: number | null;
  /** Navigation target when the row is tapped. */
  target: '/add-shot' | '/dose';
  /** True when the row is the actionable "log today's shot" affordance. */
  isLogShot: boolean;
};

/**
 * Pick the single injection dose row from the weekly cycle.
 *   - no cycle (no shots yet) or injection day  → log today's shot (→ /add-shot)
 *   - overdue                                    → overdue, review (→ /dose)
 *   - otherwise                                  → next dose in N days (→ /dose)
 */
export function selectInjectionDoseRow(cycle: InjectionCycleResult | null): InjectionDoseRow {
  // No cycle yet, injection day, or the scheduled dose day has arrived (0 days left,
  // not yet logged) -> the actionable "log today's shot" affordance. The null guard
  // keeps overdue (daysUntilNextInjection === null) out of this branch.
  if (
    !cycle
    || cycle.phase === 'injection_day'
    || (cycle.daysUntilNextInjection !== null && cycle.daysUntilNextInjection <= 0)
  ) {
    return { pillKey: 'today.dose_row_log_shot', days: null, target: '/add-shot', isLogShot: true };
  }
  if (cycle.isOverdue) {
    return { pillKey: 'today.dose_row_overdue', days: null, target: '/dose', isLogShot: false };
  }
  return {
    pillKey: 'today.dose_row_next',
    days: cycle.daysUntilNextInjection,
    target: '/dose',
    isLogShot: false,
  };
}
