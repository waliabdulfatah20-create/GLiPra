// Visit-prep label maps + small derivations, extracted as pure functions so the
// route-aware branching (injection vs oral) is unit-testable. Used by the
// visit-prep hooks/screen and mirrored by the PDF edge function.

import type { MedicationChangeRecord } from '@/features/medication-change/api';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';

import { getMedicationBrand } from '@/features/medication/medications';

/** Convert internal medication ID to a display name for the screen + PDF. */
export function medicationIdToName(id: string | undefined | null): string | null {
  if (!id)
    return null;
  const map: Record<string, string> = {
    semaglutide_ozempic: 'Semaglutide (Ozempic)',
    semaglutide_wegovy: 'Semaglutide (Wegovy)',
    tirzepatide_mounjaro: 'Tirzepatide (Mounjaro)',
    tirzepatide_zepbound: 'Tirzepatide (Zepbound)',
    liraglutide_saxenda: 'Liraglutide (Saxenda)',
    dulaglutide_trulicity: 'Dulaglutide (Trulicity)',
    semaglutide_compounded: 'Compounded Semaglutide',
    tirzepatide_compounded: 'Compounded Tirzepatide',
    // Oral GLP-1s
    semaglutide_rybelsus: 'Semaglutide (Rybelsus)',
    orforglipron: 'Orforglipron',
  };
  return map[id] ?? id;
}

/** Convert internal injection phase key to a human-readable label. */
export function injectionPhaseLabel(phase: string | null | undefined): string | null {
  if (!phase)
    return null;
  const map: Record<string, string> = {
    injection_day: 'Injection Day',
    peak_suppression: 'Peak Suppression (Days 1–2)',
    adjustment: 'Adjustment (Days 3–4)',
    recovery_window: 'Recovery Window (Days 5–7)',
    overdue: 'Overdue',
  };
  return map[phase] ?? phase;
}

/** Convert internal oral phase key to a human-readable treatment-status label. */
export function oralPhaseLabel(phase: string | null | undefined): string | null {
  if (!phase)
    return null;
  const map: Record<string, string> = {
    building: 'Building to steady state',
    steady_state: 'At steady state',
    dose_due: 'Today\'s dose due',
    dose_missed: 'Dose missed',
  };
  return map[phase] ?? phase;
}

/**
 * Whole calendar days between the last oral dose and today (Rule 6 — date-fns).
 * Returns null when there is no dose on record. Same calendar day = 0.
 */
export function daysSinceLastDose(
  takenAtIso: string | null | undefined,
  todayIso: string,
): number | null {
  if (!takenAtIso)
    return null;
  return differenceInCalendarDays(parseISO(todayIso), parseISO(takenAtIso));
}

/**
 * Display-ready row for one medication switch, as rendered in the visit-prep
 * PDF. Single source of truth for the row text — mirrors the on-screen
 * MEDICATION CHANGES card so the exported PDF matches the screen exactly.
 * `from` falls back to 'Unknown' (a first medication has no prior); `to`
 * falls back to its raw id via getMedicationBrand.
 */
export function medicationChangeToPdfRow(
  change: MedicationChangeRecord,
): { date: string; transition: string } {
  return {
    date: format(parseISO(change.changedAt), 'MMM d, yyyy'),
    transition: `${getMedicationBrand(change.fromMedicationId) || 'Unknown'} -> ${getMedicationBrand(change.toMedicationId)}`,
  };
}
