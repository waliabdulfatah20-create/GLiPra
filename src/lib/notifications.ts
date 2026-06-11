/**
 * Push notification scheduling — wraps expo-notifications with semantically
 * named functions.
 *
 * Local notifications managed:
 *   'injection-reminder'    — fires at 8 AM on the user's next injection date
 *   'daily-protein-nudge'   — fires every day at 7 PM
 *   'daily-checkin-reminder'— fires every day at 9 AM to log symptoms
 *   'oral-dose-reminder'    — fires daily at the user's chosen oral-dose time
 *   'oral-absorption-clear' — one-shot 30 min after a logged oral dose
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

import { isFuture, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';
import * as Notifications from 'expo-notifications';

// Show alerts even when the app is in the foreground.
// Wrapped in try/catch: if the native module isn't initialized (e.g. during
// Expo Router route discovery before the native layer is ready), this fails
// silently instead of crashing the entire module import chain.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}
catch {
  // no-op — handler will be registered on next render cycle
}

export type NotificationId
  = | 'injection-reminder'
    | 'daily-protein-nudge'
    | 'daily-checkin-reminder'
    | 'oral-dose-reminder'
    | 'oral-absorption-clear';

/** Minutes to wait after an oral dose before eating/drinking. Mirrors ABSORPTION_WINDOW_MIN. */
const ORAL_ABSORPTION_MIN = 30;

/**
 * Parse a Postgres TIME string ('HH:MM' or 'HH:MM:SS') into hour + minute.
 * Returns null when the string is missing or malformed.
 */
function parseLocalTime(time: string | null | undefined): { hour: number; minute: number } | null {
  if (!time)
    return null;
  const parts = time.split(':');
  const hour = Number(parts[0]);
  const minute = Number(parts[1] ?? '0');
  if (!Number.isInteger(hour) || hour < 0 || hour > 23)
    return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59)
    return null;
  return { hour, minute };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requestPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted')
      return 'granted';
    const { status } = await Notifications.requestPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  }
  catch {
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

    if (!isFuture(fireDate))
      return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'injection-reminder',
      content: {
        title: 'Injection day',
        body: 'Time for your GLP-1 dose. Log your injection site in GLiPra after.',
        data: { type: 'injection-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
  }
  catch {
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
  }
  catch {
    // Silent fail
  }
}

/**
 * Schedule (or replace) a repeating daily reminder at `hourOfDay` (default
 * 9 AM) to nudge the user to do their Daily Check-in (symptoms log).
 * Copy is general wellness only, never clinical (Rule 8 spirit).
 */
async function scheduleDailyCheckInReminder(hourOfDay = 9): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('daily-checkin-reminder');

    await Notifications.scheduleNotificationAsync({
      identifier: 'daily-checkin-reminder',
      content: {
        title: 'Daily check-in',
        body: 'How are you feeling today? Take a moment to log your symptoms.',
        data: { type: 'daily-checkin-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hourOfDay,
        minute: 0,
      },
    });
  }
  catch {
    // Silent fail
  }
}

/**
 * Schedule (or replace) a repeating daily reminder at the user's chosen oral
 * dose time. `doseTimeLocal` is the profiles.dose_time_local TIME string
 * ('HH:MM' or 'HH:MM:SS'). No-op if the time string is malformed.
 *
 * Copy is educational only (oral dosing joins the attorney-review gate).
 * English-only, matching the existing injection/protein notifications — the
 * native scheduler fires outside React so it cannot read i18next.
 */
async function scheduleOralDoseReminder(doseTimeLocal: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('oral-dose-reminder');

    const parsed = parseLocalTime(doseTimeLocal);
    if (!parsed)
      return;

    await Notifications.scheduleNotificationAsync({
      identifier: 'oral-dose-reminder',
      content: {
        title: 'Time for your tablet',
        body: 'Take it on an empty stomach with a small sip of water, then wait 30 minutes before food or drinks.',
        data: { type: 'oral-dose-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
      },
    });
  }
  catch {
    // Silent fail — notifications are non-critical
  }
}

/**
 * Schedule a one-shot "you're clear to eat" notification 30 minutes from now,
 * called right after a dose is logged. Cancels any pending clear notification
 * first so re-logging restarts the single timer.
 */
async function scheduleAbsorptionClear(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('oral-absorption-clear');

    await Notifications.scheduleNotificationAsync({
      identifier: 'oral-absorption-clear',
      content: {
        title: 'You\'re clear to eat',
        body: 'Your 30-minute absorption window is done. Food and drinks are fine now.',
        data: { type: 'oral-absorption-clear' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: ORAL_ABSORPTION_MIN * 60,
        repeats: false,
      },
    });
  }
  catch {
    // Silent fail
  }
}

/** Cancel a specific notification by its fixed identifier. */
async function cancel(id: NotificationId): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  catch {
    // Silent fail
  }
}

/** Cancel all pending Glipra notifications. */
async function cancelAll(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  catch {
    // Silent fail
  }
}

/** Return all currently scheduled notifications (for debugging). */
async function getScheduled(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
  catch {
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const notifications = {
  requestPermission,
  scheduleInjectionReminder,
  scheduleDailyProteinNudge,
  scheduleDailyCheckInReminder,
  scheduleOralDoseReminder,
  scheduleAbsorptionClear,
  cancel,
  cancelAll,
  getScheduled,
};
