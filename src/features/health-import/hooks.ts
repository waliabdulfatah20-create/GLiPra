/**
 * hooks.ts — React hooks for Apple Health / Google Fit import
 *
 * importWeights():
 *   1. Fetch weight readings from health-link (last 90 days)
 *   2. For each reading, check if a log already exists for that date in Supabase
 *   3. Insert new ones via insertWeightLog from @/features/weight/api
 *   4. Compute EWMA using applyEwma from @/utils/ewma
 *   5. Return { imported, skipped }
 */

import { isSameDay, parseISO } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchWeightLogs, insertWeightLog } from '@/features/weight/api';
import { applyEwma } from '@/utils/ewma';
import {
  fetchHealthWeightLogs,
  fetchTodaySteps,
  isHealthAvailable,
  requestHealthPermissions,
} from './health-link';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface HealthImportResult {
  imported: number;
  skipped: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useHealthImport(): {
  isAvailable: boolean;
  isLoading: boolean;
  requestPermissions: () => Promise<boolean>;
  importWeights: () => Promise<HealthImportResult>;
  todaySteps: number | null;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id ?? null;

  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todaySteps, setTodaySteps] = useState<number | null>(null);

  // Check availability once on mount
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const available = await isHealthAvailable();
      if (!cancelled) {
        setIsAvailable(available);

        if (available) {
          const steps = await fetchTodaySteps();
          if (!cancelled) setTodaySteps(steps);
        }

        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const granted = await requestHealthPermissions();
    if (granted) {
      // Re-fetch steps after permissions are granted
      const steps = await fetchTodaySteps();
      setTodaySteps(steps);
    }
    return granted;
  }, []);

  const importWeights = useCallback(async (): Promise<HealthImportResult> => {
    if (!isAvailable || !userId) {
      return { imported: 0, skipped: 0 };
    }

    // 1. Fetch health readings
    const healthReadings = await fetchHealthWeightLogs(90);
    if (healthReadings.length === 0) {
      return { imported: 0, skipped: 0 };
    }

    // 2. Fetch existing Supabase logs to detect duplicates (last 90 days)
    const existingLogs = await fetchWeightLogs(userId, 90);

    let imported = 0;
    let skipped = 0;

    // Compute the latest EWMA from existing logs as the starting point
    let latestEwma: number | null =
      existingLogs.length > 0
        ? (existingLogs[existingLogs.length - 1]?.ewmaWeightKg ?? null)
        : null;

    // Health readings are already sorted ascending by fetchHealthWeightLogs
    for (const reading of healthReadings) {
      const readingDate = parseISO(reading.loggedAt);

      // 3. Check for duplicate: same calendar day already logged in Supabase
      const alreadyExists = existingLogs.some((log) =>
        isSameDay(parseISO(log.loggedAt), readingDate),
      );

      if (alreadyExists) {
        skipped++;
        continue;
      }

      // 4. Compute EWMA for this new reading
      const ewmaWeightKg = applyEwma(reading.weightKg, latestEwma);
      latestEwma = ewmaWeightKg;

      // 5. Insert into Supabase
      try {
        await insertWeightLog(userId, {
          weightKg: reading.weightKg,
          ewmaWeightKg,
        });
        imported++;
      } catch {
        // Silently skip failed insertions — don't abort the whole import
        skipped++;
      }
    }

    return { imported, skipped };
  }, [isAvailable, userId]);

  return {
    isAvailable,
    isLoading,
    requestPermissions,
    importWeights,
    todaySteps,
  };
}
