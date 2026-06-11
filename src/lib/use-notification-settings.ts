/**
 * useNotificationSettings — manages the enable/disable lifecycle for Glipra's
 * local notifications.
 *
 * Persists preferences to AsyncStorage so they survive app restarts:
 *   NOTIF_INJECTION_ENABLED  → 'injection-reminder'  (injectable route)
 *   NOTIF_PROTEIN_ENABLED    → 'daily-protein-nudge'
 *   NOTIF_ORAL_DOSE_ENABLED  → 'oral-dose-reminder'  (oral route)
 *
 * The hook handles permission requests, scheduling, and cancellation.
 * Callers only need to render a switch and call toggle(type). The route-aware
 * reminder (injection vs oral) is chosen by the Settings screen via `isOral`.
 */

import type { NotificationId } from './notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import * as React from 'react';

import { Alert } from 'react-native';
import { useMedicationLevelCurve } from '@/features/medication-level/hooks';
import { useTodayProfile } from '@/features/today/hooks';
import { notifications } from './notifications';

const STORAGE_KEYS: Record<NotificationId, string> = {
  'injection-reminder': 'NOTIF_INJECTION_ENABLED',
  'daily-protein-nudge': 'NOTIF_PROTEIN_ENABLED',
  'daily-checkin-reminder': 'NOTIF_CHECKIN_ENABLED',
  'oral-dose-reminder': 'NOTIF_ORAL_DOSE_ENABLED',
  // Auto-scheduled on dose log (gated by NOTIF_ORAL_DOSE_ENABLED), not a toggle.
  'oral-absorption-clear': 'NOTIF_ORAL_ABSORPTION_ENABLED',
};

export type NotificationSettingsState = {
  injectionEnabled: boolean;
  proteinEnabled: boolean;
  checkInEnabled: boolean;
  oralDoseEnabled: boolean;
  isOral: boolean;
  toggle: (type: NotificationId) => Promise<void>;
};

export function useNotificationSettings(): NotificationSettingsState {
  const [injectionEnabled, setInjectionEnabled] = React.useState(false);
  const [proteinEnabled, setProteinEnabled] = React.useState(false);
  const [checkInEnabled, setCheckInEnabled] = React.useState(false);
  const [oralDoseEnabled, setOralDoseEnabled] = React.useState(false);

  const { data: profile } = useTodayProfile();
  const curve = useMedicationLevelCurve();
  const isOral = profile?.administrationRoute === 'oral';

  // Restore persisted preferences on mount.
  React.useEffect(() => {
    AsyncStorage.multiGet([
      STORAGE_KEYS['injection-reminder'],
      STORAGE_KEYS['daily-protein-nudge'],
      STORAGE_KEYS['daily-checkin-reminder'],
      STORAGE_KEYS['oral-dose-reminder'],
    ]).then(([inj, prot, checkin, oral]) => {
      setInjectionEnabled(inj[1] === 'true');
      setProteinEnabled(prot[1] === 'true');
      setCheckInEnabled(checkin[1] === 'true');
      setOralDoseEnabled(oral[1] === 'true');
    });
  }, []);

  const toggle = React.useCallback(
    async (type: NotificationId) => {
      const current
        = type === 'injection-reminder'
          ? injectionEnabled
          : type === 'oral-dose-reminder'
            ? oralDoseEnabled
            : type === 'daily-checkin-reminder'
              ? checkInEnabled
              : proteinEnabled;
      const next = !current;

      if (next) {
        // Enabling — request permission first.
        const status = await notifications.requestPermission();
        if (status !== 'granted') {
          Alert.alert(
            'Notifications disabled',
            'To receive reminders, go to device Settings and allow notifications for GLiPra.',
            [{ text: 'OK' }],
          );
          return; // Don't persist — user hasn't actually enabled it.
        }

        if (type === 'injection-reminder') {
          // Schedule for the computed next injection date (needs 2+ logged shots
          // to derive the interval). If unavailable, the preference is saved now
          // and the reminder is scheduled after the next shot log (hooks.ts).
          const dates = curve?.injectionDates;
          const lastDate = curve?.lastInjectionDate;
          if (lastDate && dates && dates.length >= 2) {
            const intervalDays = Math.abs(
              differenceInCalendarDays(parseISO(dates[0]), parseISO(dates[1])),
            );
            if (intervalDays > 0) {
              const nextDate = addDays(parseISO(lastDate), intervalDays);
              await notifications.scheduleInjectionReminder(nextDate.toISOString());
            }
          }
        }
        else if (type === 'oral-dose-reminder') {
          // Daily reminder at the user's chosen oral dose time (set at onboarding).
          // If no time is stored, the preference persists and scheduling no-ops.
          if (profile?.doseTimeLocal)
            await notifications.scheduleOralDoseReminder(profile.doseTimeLocal);
        }
        else if (type === 'daily-checkin-reminder') {
          // Daily symptom-log nudge at a fixed 9 AM.
          await notifications.scheduleDailyCheckInReminder();
        }
        else {
          await notifications.scheduleDailyProteinNudge(profile?.proteinFloorG ?? 100);
        }
      }
      else {
        // Disabling — cancel the notification (and any pending absorption-clear
        // one-shot when turning off the oral reminder).
        await notifications.cancel(type);
        if (type === 'oral-dose-reminder')
          await notifications.cancel('oral-absorption-clear');
      }

      // Persist preference and update UI.
      await AsyncStorage.setItem(STORAGE_KEYS[type], String(next));
      if (type === 'injection-reminder')
        setInjectionEnabled(next);
      else if (type === 'oral-dose-reminder')
        setOralDoseEnabled(next);
      else if (type === 'daily-checkin-reminder')
        setCheckInEnabled(next);
      else setProteinEnabled(next);
    },
    [injectionEnabled, proteinEnabled, checkInEnabled, oralDoseEnabled, profile, curve],
  );

  return { injectionEnabled, proteinEnabled, checkInEnabled, oralDoseEnabled, isOral, toggle };
}
