/**
 * Push notification scheduling — wraps expo-notifications with semantically
 * named functions.
 *
 * Two local notifications are managed:
 *   'injection-reminder'   — fires at 8 AM on the user's next injection date
 *   'daily-protein-nudge'  — fires every day at 7 PM
 *
 * Fixed identifiers let callers cancel by type without storing dynamic IDs.
 * All functions are wrapped in try/catch — silently no-op in environments
 * where the module is unavailable or permissions are not granted.
 *
 * Usage:
 *   import { notifications } from '@/lib/notifications';
 *   await notifications.requestPermission();
 *   await notifications.scheduleDailyProteinNudge(128);
 */

import * as Notifications from 'expo-notifications';
import { addDays, isFuture, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';

// Show alerts even when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type NotificationId = 'injection-reminder' | 'daily-protein-nudge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return 'granted';
    const { status } = await Notifications.requestPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/**
 * Schedule a one-time notification at `hourOfDay` (default 8 AM) on the given
 * ISO date. Cancels any existing injection reminder first. Silently skips
 * if the fire time is already in the past.
 */
async function scheduleInjectionReminder(
  nextInjectionIsoDate: string,
  hourOfDay = 8,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('injection-reminder');

    const base = parseISO(nextInjectionIsoDate);
    const fireDate = setSeconds(setMinutes(setHours(base, hourOfDay), 0), 0);

    if (!isFuture(fireDate)) return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'injection-reminder',
      content: {
        title: 'Injection day',
        body: 'Time for your GLP-1 dose. Log your injection site in Glipra after.',
        data: { type: 'injection-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  } catch {
    // Silent fail — notifications are non-critical
  }
}

/**
 * Schedule (or replace) a repeating daily notification at `hourOfDay` (default
 * 7 PM) with the user's protein floor embedded in the body copy.
 */
async function scheduleDailyProteinNudge(
  proteinFloorG: number,
  hourOfDay = 19,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('daily-protein-nudge');

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-protein-nudge',
      content: {
        title: 'Protein check-in',
        body: `Have you hit your ${Math.round(proteinFloorG)}g protein goal today?`,
        data: { type: 'daily-protein-nudge' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hourOfDay,
        minute: 0,
      },
    });
  } catch {
    // Silent fail
  }
}

/** Cancel a specific notification by its fixed identifier. */
async function cancel(id: NotificationId): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Silent fail
  }
}

/** Cancel all pending Glipra notifications. */
async function cancelAll(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Silent fail
  }
}

/** Return all currently scheduled notifications (for debugging). */
async function getScheduled(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const notifications = {
  requestPermission,
  scheduleInjectionReminder,
  scheduleDailyProteinNudge,
  cancel,
  cancelAll,
  getScheduled,
};
