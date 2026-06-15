// Pure logic for switching a user's GLP-1 medication / route in-app.
//
// A doctor switching a patient (Rybelsus tablet <-> Ozempic injection, or
// Ozempic -> Mounjaro) must never cost the user their account or subscription.
// `administration_route` on `profiles` is the single switch that re-routes the
// whole app, so this helper maps a chosen medication + schedule into:
//   - the profile patch (new route's fields set, old route's fields cleared),
//   - the medication_changes history row (from -> to),
//   - which notifications to cancel (the opposite route's reminders).
// Everything route-agnostic (food, weight, check-ins, resistance, streaks,
// muscle score, protein floor, subscription) is untouched by design.
//
// Pure: no React, no Supabase, no Date. Fully branch-tested.

import type { MedicationStatus } from '@/features/today/api';
import type { NotificationId } from '@/lib/notifications';
import type { GLP1MedicationId } from '@/types';
import { getMedicationRoute } from '@/features/medication/medications';

export type SwitchRoute = 'injection' | 'oral';

export type CurrentMedication = {
  medicationId: string | null;
  route: SwitchRoute | null;
};

export type InjectionSchedule = {
  route: 'injection';
  frequency: 'weekly' | 'biweekly' | 'daily';
  dayOfWeek: number | null; // null for daily
  lastInjectionDate: string; // ISO 'yyyy-MM-dd'
};

export type OralSchedule = {
  route: 'oral';
  doseTimeLocal: string; // 'HH:00'
  medicationStartDate: string; // ISO 'yyyy-MM-dd'
};

export type MedicationSelection = {
  medicationId: GLP1MedicationId;
  status: MedicationStatus; // 'starting' | 'active'
  schedule: InjectionSchedule | OralSchedule;
};

/** The exact columns to write to `profiles` on a switch. */
export type ProfilePatch = {
  medication_id: string;
  administration_route: SwitchRoute;
  medication_status: MedicationStatus;
  phase: 'weight_loss';
  dose_frequency: string | null;
  injection_day_of_week: number | null;
  last_injection_date: string | null;
  dose_time_local: string | null;
  medication_start_date: string | null;
};

export type MedicationHistoryRow = {
  from_medication_id: string | null;
  from_route: string | null;
  to_medication_id: string;
  to_route: SwitchRoute;
};

export type MedicationSwitch = {
  profilePatch: ProfilePatch;
  historyRow: MedicationHistoryRow;
  /** All route-specific reminders to cancel (the schedule changed). The NEW route's
   *  reminder is (re)scheduled by the hook, gated on the user's stored notification
   *  pref. The route-agnostic protein + check-in nudges are left alone. */
  cancelNotifications: NotificationId[];
};

/**
 * Build the deterministic parts of a medication switch. The route is derived from
 * the chosen medication so the picker and the profile can never disagree.
 */
export function buildMedicationSwitch(
  current: CurrentMedication,
  selection: MedicationSelection,
): MedicationSwitch {
  const toRoute: SwitchRoute = getMedicationRoute(selection.medicationId) as SwitchRoute;

  // Start from a fully-cleared route-field set, then fill only the new route's fields.
  const profilePatch: ProfilePatch = {
    medication_id: selection.medicationId,
    administration_route: toRoute,
    medication_status: selection.status,
    phase: 'weight_loss',
    dose_frequency: null,
    injection_day_of_week: null,
    last_injection_date: null,
    dose_time_local: null,
    medication_start_date: null,
  };

  if (selection.schedule.route === 'injection') {
    profilePatch.dose_frequency = selection.schedule.frequency;
    profilePatch.injection_day_of_week
      = selection.schedule.frequency === 'daily' ? null : selection.schedule.dayOfWeek;
    profilePatch.last_injection_date = selection.schedule.lastInjectionDate;
  }
  else {
    // Oral GLP-1s are once-daily; mirror onboarding which stores frequency 'daily'.
    profilePatch.dose_frequency = 'daily';
    profilePatch.dose_time_local = selection.schedule.doseTimeLocal;
    profilePatch.medication_start_date = selection.schedule.medicationStartDate;
  }

  const historyRow: MedicationHistoryRow = {
    from_medication_id: current.medicationId,
    from_route: current.route,
    to_medication_id: selection.medicationId,
    to_route: toRoute,
  };

  // Clear every route-specific reminder; the schedule changed on a switch. The hook
  // reschedules the new route's reminder when its pref is enabled. Cancelling a
  // reminder that was never scheduled is a harmless no-op.
  const cancelNotifications: NotificationId[] = [
    'injection-reminder',
    'oral-dose-reminder',
    'oral-absorption-clear',
  ];

  return { profilePatch, historyRow, cancelNotifications };
}
