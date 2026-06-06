import type { InjectionLog } from '@/features/injection-sites/types';
import type { AdministrationRoute, GLP1MedicationId } from '@/types';

import { useQuery } from '@tanstack/react-query';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchRecentInjectionLogs } from '@/features/injection-sites/api';
import { generateSteadyStateCurve } from '@/features/medication-level/calculator';
import { fetchRecentOralDoseLogs } from '@/features/oral-dose/api';
import { fetchTodayProfile } from '@/features/today/api';

// Oral users have no recorded dose amount, so the oral curve is built with a
// normalized unit dose and the chart shows a RELATIVE level (not mg). The
// half-lives are correct, so the curve shape (accumulation + daily rhythm) is
// real; only the absolute scale is normalized.
const NORMALIZED_ORAL_DOSE = 1;

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
  administrationRoute: AdministrationRoute;
  medicationId: GLP1MedicationId | null;
  doseMg: number | null;
  injectionIntervalDays: number;
  /** YYYY-MM-DD of the most recent dose event (injection or oral) */
  lastInjectionDate: string | null;
  /**
   * Deduplicated YYYY-MM-DD dose-event dates, most-recent-first. For injection
   * users these are injection dates; for oral users they are oral dose dates.
   * (Field name kept for chart-prop compatibility.)
   */
  injectionDates: string[];
  /** True when the curve is normalized/relative (oral) rather than mg-scaled. */
  isRelative: boolean;
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

  const administrationRoute: AdministrationRoute
    = profile?.administrationRoute === 'oral' ? 'oral' : 'injection';
  const isOral = administrationRoute === 'oral';

  // Injection logs — curve inputs for injection users
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['injection-logs-curve', userId],
    queryFn: () => fetchRecentInjectionLogs(userId!, 10), // 10 shots covers ~4 weekly cycles
    enabled: !!userId && !isOral,
    staleTime: 5 * 60 * 1000,
  });

  // Oral dose logs — curve inputs for oral users (90 doses ≈ a full titration history)
  const { data: oralLogs = [], isLoading: oralLoading } = useQuery({
    queryKey: ['oral-dose-logs', userId],
    queryFn: () => fetchRecentOralDoseLogs(userId!),
    enabled: !!userId && isOral,
    staleTime: 60 * 1000,
  });

  const isLoading = profileLoading || (isOral ? oralLoading : logsLoading);
  const today = format(new Date(), 'yyyy-MM-dd');
  const medicationId = (profile?.medicationId ?? null) as GLP1MedicationId | null;

  // Deduplicate dose-event dates (most-recent-first) for chart dots + curve input.
  const seenDates = new Set<string>();
  const doseDates: string[] = [];
  const rawDates = isOral
    ? oralLogs.map(l => l.takenAt.slice(0, 10))
    : logs.map(l => l.injected_at.slice(0, 10));
  for (const d of rawDates) {
    if (!seenDates.has(d)) { seenDates.add(d); doseDates.push(d); }
  }

  // Route-specific curve inputs. Oral: daily interval + normalized unit dose
  // (no recorded dose amount → relative curve). Injection: parsed dose + derived interval.
  const lastInjectionDate = doseDates[0] ?? null;
  const injectionIntervalDays = isOral ? 1 : deriveIntervalDays(logs);
  const doseMg = isOral
    ? NORMALIZED_ORAL_DOSE
    : parseDoseMg(logs[0]?.dosage_strength ?? null);

  if (!lastInjectionDate || !doseMg || !medicationId) {
    return {
      curve: null,
      todayOffset: 0,
      isLoading,
      administrationRoute,
      medicationId,
      doseMg,
      injectionIntervalDays,
      lastInjectionDate,
      injectionDates: doseDates,
      isRelative: isOral,
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
    doseDates, // actual logged dates; no phantom history
  );

  const todayIndex = curve.findIndex(p => p.date === today);
  const todayOffset = todayIndex !== -1 ? curve[todayIndex].dayOffset : 0;

  return {
    curve,
    todayOffset,
    isLoading,
    administrationRoute,
    medicationId,
    doseMg,
    injectionIntervalDays,
    lastInjectionDate,
    injectionDates: doseDates,
    isRelative: isOral,
  };
}
