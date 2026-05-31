/**
 * health-link.ts — Wrapper for react-native-health-link
 *
 * react-native-health-link is a native module that requires an EAS dev build.
 * It is NOT available in Expo Go. All functions gracefully return null/empty
 * when the package is unavailable.
 *
 * CLAUDE.md: use react-native-health-link (unified iOS + Android — ONE package)
 */

import { startOfDay, subDays } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HealthWeightReading = {
  weightKg: number;
  loggedAt: string; // ISO 8601
};

// ─── Module load (graceful stub) ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let HealthLink: any = null;

try {
  // Dynamic require so bundler doesn't hard-fail in Expo Go
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  HealthLink = require('react-native-health-link').default ?? require('react-native-health-link');
}
catch {
  // Package not installed or native module not linked — run in stub mode
  HealthLink = null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if the health platform (Apple Health / Google Fit) is available
 * on this device and accessible through react-native-health-link.
 * Returns false if the package is not installed or unavailable.
 */
export async function isHealthAvailable(): Promise<boolean> {
  if (HealthLink === null)
    return false;
  try {
    const result = await HealthLink.isAvailable();
    return result === true;
  }
  catch {
    return false;
  }
}

/**
 * Request read permissions for Weight and Steps.
 * Returns true if permissions were granted, false otherwise.
 * Returns false immediately if health-link is unavailable.
 */
export async function requestHealthPermissions(): Promise<boolean> {
  if (HealthLink === null)
    return false;
  try {
    const granted = await HealthLink.requestPermissions({
      permissions: {
        read: ['Weight', 'Steps'],
        write: [],
      },
    });
    return granted === true;
  }
  catch {
    return false;
  }
}

/**
 * Fetch weight readings from the last N days (default 90).
 * Returns an empty array if health-link is unavailable or permission is denied.
 *
 * react-native-health-link returns weights in kg by default.
 * If the library returns pounds (lb), we convert: kg = lb * 0.453592.
 */
export async function fetchHealthWeightLogs(
  days = 90,
): Promise<HealthWeightReading[]> {
  if (HealthLink === null)
    return [];

  try {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const results = await HealthLink.getHealthData({
      type: 'Weight',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: true,
    });

    if (!Array.isArray(results))
      return [];

    return results.map((reading: { value: number; unit?: string; startDate?: string; date?: string; timestamp?: string }) => {
      const rawValue: number = reading.value ?? 0;
      const unit: string = (reading.unit ?? 'kg').toLowerCase();

      // Convert to kg if the library returned pounds
      const weightKg = unit === 'lb' || unit === 'lbs' || unit === 'pound' || unit === 'pounds'
        ? rawValue * 0.453592
        : rawValue;

      // Normalise the date field — library may use startDate, date, or timestamp
      const rawDate: string
        = reading.startDate ?? reading.date ?? reading.timestamp ?? new Date().toISOString();

      return {
        weightKg: Math.round(weightKg * 100) / 100,
        loggedAt: new Date(rawDate).toISOString(),
      };
    });
  }
  catch {
    return [];
  }
}

/**
 * Fetch total step count for today.
 * Returns null if health-link is unavailable or permission is denied.
 */
export async function fetchTodaySteps(): Promise<number | null> {
  if (HealthLink === null)
    return null;

  try {
    const now = new Date();
    const todayStart = startOfDay(now);

    const results = await HealthLink.getHealthData({
      type: 'Steps',
      startDate: todayStart.toISOString(),
      endDate: now.toISOString(),
      ascending: false,
    });

    if (!Array.isArray(results) || results.length === 0)
      return null;

    // Sum all step readings for today
    const total = results.reduce(
      (sum: number, r: { value: number }) => sum + (r.value ?? 0),
      0,
    );
    return Math.round(total);
  }
  catch {
    return null;
  }
}
