import type { InjectionLog } from '@/features/injection-sites/types';
import type { GLP1MedicationId } from '@/types';

import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchRecentInjectionLogs } from '@/features/injection-sites/api';
import { generateSteadyStateCurve } from '@/features/medication-level/calculator';
import { fetchTodayProfile } from '@/features/today/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a dosage-strength string (e.g. "0.5 mg", "1 mg", "2.4mg") to a float.
 * Returns null if the string is absent or in an unrecognised format.
 */
function parseDoseMg(dosageStrength: string | null | undefined): number | null {
  if (!dosageStrength)
    return null;
  const match = dosageStrength.match(/^([\d.]+)\s*mg/i);
  return match ? Number.parseFloat(match[1]) : null;
}

/**
 * Derive injection interval from the calendar gap between the last two DISTINCT
 * injection dates. Deduplicates by calendar date first so that two entries
 * logged on the same day (e.g. a correction or a test shot) don't collapse the
 * gap to 0 and produce a spurious "daily" result.
 *
 * Uses date-fns differenceInCalendarDays (Rule 6 — no raw Date arithmetic).
 * Falls back to 7 (weekly) when fewer than 2 distinct dates exist.
 */
function deriveIntervalDays(logs: InjectionLog[]): number {
  // Deduplicate: keep only the first occurrence of each calendar date
  const seen = new Set<string>();
  const uniqueDates: string[] = [];
  for (const log of logs) {
    const d = log.injected_at.slice(0, 10);
    if (!seen.has(d)) { seen.add(d); uniqueDates.push(d); }
  }

  if (uniqueDates.length < 2)
    return 7;
  const gap = Math.abs(
    differenceInCalendarDays(parseISO(uniqueDates[0]), parseISO(uniqueDates[1])),
  );
  if (gap <= 2)
    return 1; // daily (liraglutide pattern)
  if (gap <= 10)
    return 7; // weekly
  return 14; // biweekly
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MedicationLevelCurveResult = {
  curve: Array<{ date: string; dayOffset: number; levelMg: number }> | null;
  todayOffset: number;
  isLoading: boolean;
  medicationId: GLP1MedicationId | null;
  doseMg: number | null;
  injectionIntervalDays: number;
  /** YYYY-MM-DD of the most recent injection (from logs, not profile) */
  lastInjectionDate: string | null;
  /** Deduplicated YYYY-MM-DD strings for all logged injection dates, most-recent-first */
  injectionDates: string[];
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React Query hook that derives the steady-state pharmacokinetic level curve
 * from the user's actual injection logs.
 *
 * Data flow:
 *   - `medicationId`         ← profiles table (set during onboarding)
 *   - `lastInjectionDate`    ← injection_logs[0].injected_at  (most recent shot)
 *   - `doseMg`               ← injection_logs[0].dosage_strength  (parsed to float)
 *   - `injectionIntervalDays`← gap between injection_logs[0] and [1], or 7 (default)
 *
 * Returns `curve: null` when required fields are absent (no logs, or no dosage_strength
 * on the most recent log). The UI renders a "Log your injection to view your curve" CTA
 * in that case.
 */
export function useMedicationLevelCurve(): MedicationLevelCurveResult {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  // Profile — needed only for medicationId
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['today-profile', userId],
    queryFn: () => fetchTodayProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Injection logs — primary data source for curve inputs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['injection-logs-curve', userId],
    queryFn: () => fetchRecentInjectionLogs(userId!, 10), // 10 shots covers ~4 weekly cycles
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = profileLoading || logsLoading;
  const today = format(new Date(), 'yyyy-MM-dd');

  // Deduplicated injection dates for dot placement on the chart (most-recent-first)
  const seenDates = new Set<string>();
  const injectionDates: string[] = [];
  for (const log of logs) {
    const d = log.injected_at.slice(0, 10);
    if (!seenDates.has(d)) { seenDates.add(d); injectionDates.push(d); }
  }

  // Derive curve inputs from real log data
  const mostRecentLog = logs[0] ?? null;
  const lastInjectionDate = injectionDates[0] ?? null;
  const doseMg = parseDoseMg(mostRecentLog?.dosage_strength ?? null);
  const medicationId = (profile?.medicationId ?? null) as GLP1MedicationId | null;
  const injectionIntervalDays = deriveIntervalDays(logs);

  if (!lastInjectionDate || !doseMg || !medicationId) {
    return {
      curve: null,
      todayOffset: 0,
      isLoading,
      medicationId,
      doseMg,
      injectionIntervalDays,
      lastInjectionDate,
      injectionDates,
    };
  }

  const curve = generateSteadyStateCurve(
    doseMg,
    medicationId,
    lastInjectionDate,
    injectionIntervalDays,
    today,
    14, // projectDays default
    undefined, // pastDays — use calculator default
    injectionDates, // actual logged dates; no phantom history
  );

  const todayIndex = curve.findIndex(p => p.date === today);
  const todayOffset = todayIndex !== -1 ? curve[todayIndex].dayOffset : 0;

  return {
    curve,
    todayOffset,
    isLoading,
    medicationId,
    doseMg,
    injectionIntervalDays,
    lastInjectionDate,
    injectionDates,
  };
}
