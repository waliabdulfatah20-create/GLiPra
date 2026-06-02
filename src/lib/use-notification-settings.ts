/**
 * useNotificationSettings — manages the enable/disable lifecycle for Glipra's
 * two local notifications.
 *
 * Persists preferences to AsyncStorage so they survive app restarts:
 *   NOTIF_INJECTION_ENABLED  → 'injection-reminder'
 *   NOTIF_PROTEIN_ENABLED    → 'daily-protein-nudge'
 *
 * The hook handles permission requests, scheduling, and cancellation.
 * Callers only need to render a switch and call toggle(type).
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
};

export type NotificationSettingsState = {
  injectionEnabled: boolean;
  proteinEnabled: boolean;
  toggle: (type: NotificationId) => Promise<void>;
};

export function useNotificationSettings(): NotificationSettingsState {
  const [injectionEnabled, setInjectionEnabled] = React.useState(false);
  const [proteinEnabled, setProteinEnabled] = React.useState(false);

  const { data: profile } = useTodayProfile();
  const curve = useMedicationLevelCurve();

  // Restore persisted preferences on mount.
  React.useEffect(() => {
    AsyncStorage.multiGet([
      STORAGE_KEYS['injection-reminder'],
      STORAGE_KEYS['daily-protein-nudge'],
    ]).then(([inj, prot]) => {
      setInjectionEnabled(inj[1] === 'true');
      setProteinEnabled(prot[1] === 'true');
    });
  }, []);

  const toggle = React.useCallback(
    async (type: NotificationId) => {
      const isInjection = type === 'injection-reminder';
      const current = isInjection ? injectionEnabled : proteinEnabled;
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

        if (isInjection) {
          // Attempt to schedule for the computed next injection date.
          // Requires at least 2 logged shots to derive the interval.
          // If injection history is unavailable the preference is saved now;
          // the notification is scheduled automatically after the next shot log.
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
          // Single shot / no shots: reminder fires on next log (hooks.ts handles it).
        }
        else {
          await notifications.scheduleDailyProteinNudge(profile?.proteinFloorG ?? 100);
        }
      }
      else {
        // Disabling — cancel the notification.
        await notifications.cancel(type);
      }

      // Persist preference and update UI.
      await AsyncStorage.setItem(STORAGE_KEYS[type], String(next));
      if (isInjection)
        setInjectionEnabled(next);
      else setProteinEnabled(next);
    },
    [injectionEnabled, proteinEnabled, profile, curve],
  );

  return { injectionEnabled, proteinEnabled, toggle };
}
