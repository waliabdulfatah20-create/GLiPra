import type { GLP1MedicationId } from '@/types';

import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

// Half-lives in days — pharmacist-verified values
export const HALF_LIVES: Record<string, number> = {
  semaglutide_ozempic: 7,
  semaglutide_wegovy: 7,
  tirzepatide_mounjaro: 5,
  tirzepatide_zepbound: 5,
  liraglutide_saxenda: 0.5, // daily injection, ~13 hours
  liraglutide_victoza: 0.5,
  dulaglutide_trulicity: 4.5,
  rybelsus: 0.04, // oral, ~1 hour — included for completeness
  compounded_semaglutide: 7,
  compounded_tirzepatide: 5,
  compounded_glp1_gip: 5,
};

export const FALLBACK_HALF_LIFE = 7; // days

/**
 * Estimate the medication level at a given point in time using first-order elimination.
 * Formula: doseMg * 0.5^(daysSinceInjection / halfLife)
 *
 * @param doseMg - dose in milligrams
 * @param daysSinceInjection - days elapsed since injection (may be fractional)
 * @param medicationId - GLP-1 medication identifier
 * @returns estimated level in mg
 */
export function estimateLevel(
  doseMg: number,
  daysSinceInjection: number,
  medicationId: GLP1MedicationId | string,
): number {
  if (doseMg === 0)
    return 0;
  const halfLife = HALF_LIVES[medicationId] ?? FALLBACK_HALF_LIFE;
  return doseMg * 0.5 ** (daysSinceInjection / halfLife);
}

/**
 * Generate a curve of estimated levels over daysToProject days (default 14).
 * Returns daysToProject + 1 data points: days 0 through daysToProject.
 *
 * @param doseMg - dose in milligrams
 * @param medicationId - GLP-1 medication identifier
 * @param daysToProject - number of days to project (default 14)
 * @returns array of { day, levelMg }
 */
export function generateLevelCurve(
  doseMg: number,
  medicationId: GLP1MedicationId | string,
  daysToProject = 14,
): Array<{ day: number; levelMg: number }> {
  const curve: Array<{ day: number; levelMg: number }> = [];
  for (let day = 0; day <= daysToProject; day++) {
    curve.push({ day, levelMg: estimateLevel(doseMg, day, medicationId) });
  }
  return curve;
}

/**
 * Generate a multi-dose accumulation curve (steady-state modeling).
 * Models past injection cycles plus a forward projection.
 * At each point, sums contributions from all doses that have been administered.
 *
 * @param doseMg - dose in milligrams
 * @param medicationId - GLP-1 medication identifier
 * @param lastInjectionDate - ISO date of the most recent injection
 * @param injectionIntervalDays - interval between injections (7=weekly, 14=biweekly, 1=daily)
 * @param today - ISO date string representing today
 * @param projectDays - number of days to project into the future (default 14)
 * @param pastDays - how far back to start the chart window (default: 4 × injectionIntervalDays)
 * @param actualInjectionDates - optional YYYY-MM-DD strings of real logged shots.
 *   When provided, only those dates contribute to the curve — no synthetic pre-history.
 *   When omitted, falls back to extrapolating past cycles for steady-state modelling.
 * @returns array of { date, dayOffset, levelMg }
 */
export function generateSteadyStateCurve(
  doseMg: number,
  medicationId: GLP1MedicationId | string,
  lastInjectionDate: string,
  injectionIntervalDays: number,
  today: string,
  projectDays = 14,
  pastDays?: number,
  actualInjectionDates?: string[],
): Array<{ date: string; dayOffset: number; levelMg: number }> {
  const todayDate = parseISO(today);
  const lastInjectionParsed = parseISO(lastInjectionDate);

  // Minimum 4 past cycles for pharmacological accuracy (semaglutide half-life = 7d;
  // doses within 5 half-lives ≈35d still contribute >3%). For wider views, extend.
  const NUM_PAST_CYCLES = 4;
  const resolvedPastDays = pastDays ?? (NUM_PAST_CYCLES * injectionIntervalDays);

  // When actual logged dates are provided, use only those (no phantom history).
  // Otherwise fall back to synthetic extrapolation for backward compatibility.
  const injectionDates: Date[] = actualInjectionDates
    ? [...actualInjectionDates]
        .map(d => parseISO(d))
        .sort((a, b) => a.getTime() - b.getTime())
    : (() => {
        const numHistoricDoses
          = Math.max(NUM_PAST_CYCLES, Math.ceil(resolvedPastDays / injectionIntervalDays)) + 1;
        const dates: Date[] = [];
        for (let i = numHistoricDoses - 1; i >= 0; i--) {
          dates.push(addDays(lastInjectionParsed, -i * injectionIntervalDays));
        }
        return dates;
      })();

  // dayOffset 0 = today. Compute start day relative to today.
  const startDate = addDays(todayDate, -resolvedPastDays);

  const totalDays = resolvedPastDays + projectDays;
  const curve: Array<{ date: string; dayOffset: number; levelMg: number }> = [];

  for (let i = 0; i <= totalDays; i++) {
    const pointDate = addDays(startDate, i);
    const dayOffset = differenceInCalendarDays(pointDate, todayDate);
    const dateStr = format(pointDate, 'yyyy-MM-dd');

    // Sum contributions from all administered doses at this point in time
    let totalLevel = 0;
    for (const injDate of injectionDates) {
      const daysSinceDose = differenceInCalendarDays(pointDate, injDate);
      // Only include dose if it has been administered (daysSinceDose >= 0)
      if (daysSinceDose >= 0) {
        totalLevel += estimateLevel(doseMg, daysSinceDose, medicationId);
      }
    }

    curve.push({ date: dateStr, dayOffset, levelMg: totalLevel });
  }

  return curve;
}
