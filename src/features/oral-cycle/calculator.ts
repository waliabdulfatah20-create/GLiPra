import type { OralPhase } from '@/types';

import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * Oral daily-dosing phase calculator.
 *
 * Safety-adjacent: this feeds the Readiness Score (Rule 4 — 90%+ coverage),
 * the same bar as the injection-cycle calculator.
 *
 * Oral GLP-1s do not have a weekly peak/trough. They reach steady state over
 * ~4 weeks of daily dosing, so the model is "titration position + daily
 * adherence" rather than days-since-a-discrete-event. Pure functions only:
 * no Supabase, no side effects, date-fns for all date math (Rule 6).
 */

/** Days of daily dosing before oral semaglutide is treated as at steady state (~4 weeks). */
export const ORAL_STEADY_STATE_DAYS = 28;

export type OralPhaseInput = {
  /** ISO date the user started this oral medication (titration anchor). Null if unknown. */
  startDate: string | null;
  /** ISO date of the most recent logged oral dose. Null if none logged yet. */
  lastDoseDate: string | null;
  /** ISO date string representing today. */
  today: string;
};

export type OralPhaseResult = {
  phase: OralPhase;
  /** Calendar days since startDate (0 when startDate is unknown or in the future). */
  daysOnMed: number;
  /** True once daysOnMed has reached the steady-state threshold. */
  isSteadyState: boolean;
};

export function calculateOralPhase(input: OralPhaseInput): OralPhaseResult {
  const { startDate, lastDoseDate, today } = input;
  const todayDate = parseISO(today);

  const daysOnMed = startDate
    ? Math.max(0, differenceInCalendarDays(todayDate, parseISO(startDate)))
    : 0;
  const isSteadyState = daysOnMed >= ORAL_STEADY_STATE_DAYS;

  // Adherence overlay takes priority: if the user needs to act today, surface that.
  if (lastDoseDate === null) {
    // No dose ever logged. Default to the gentle "time for your dose" prompt
    // rather than the alarming "missed" state — absence of a log is not proof
    // of a skipped dose, and we never want to falsely accuse the user.
    return { phase: 'dose_due', daysOnMed, isSteadyState };
  }

  const daysSinceLastDose = differenceInCalendarDays(todayDate, parseISO(lastDoseDate));

  if (daysSinceLastDose >= 2) {
    // Skipped at least one full day — the daily analog of "overdue".
    return { phase: 'dose_missed', daysOnMed, isSteadyState };
  }
  if (daysSinceLastDose === 1) {
    // Took it yesterday, today's dose still pending.
    return { phase: 'dose_due', daysOnMed, isSteadyState };
  }

  // daysSinceLastDose <= 0 → today's dose is logged. Show titration position.
  return {
    phase: isSteadyState ? 'steady_state' : 'building',
    daysOnMed,
    isSteadyState,
  };
}
