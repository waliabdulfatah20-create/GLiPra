/**
 * Data hooks for the Progress dashboard.
 *
 * - useProteinHistoryPerDay  → daily protein totals over N days, with hitFloor flags
 * - useInjectionAdherence    → adherence % derived from injection_logs
 * - useCheckInTrend          → nausea + energy series for the symptom chart
 *
 * All date math via date-fns (Rule 6).
 */

import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useCheckInHistory } from '@/features/check-in/hooks';
import { fetchFoodLogsInRange } from '@/features/food-log/api';
import { useMedicationLevelCurve } from '@/features/medication-level/hooks';
import { useTodayData } from '@/features/today/hooks';

import {
  buildHitHistory,
  calculateAdherence,
  calculateAverageSymptom,
  calculateHitRate,
  type DayHit,
  type DayProteinEntry,
} from './calculator';

// ---------------------------------------------------------------------------
// useProteinHistoryPerDay
//
// Returns per-day protein totals and hit-floor flags for the last N days.
// Also computes overall hitRate over the same window — saves the cards from
// re-running the reducer.
// ---------------------------------------------------------------------------
export interface ProteinHistoryResult {
  history: DayHit[];
  hitRate: number;
  proteinFloorG: number;
  isLoading: boolean;
}

export function useProteinHistoryPerDay(days: number): ProteinHistoryResult {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const { proteinFloorG, isLoading: profileLoading } = useTodayData();

  const today = new Date();
  const startDate = format(subDays(today, days - 1), 'yyyy-MM-dd');
  const endDate = format(today, 'yyyy-MM-dd');

  const { data, isLoading: logsLoading } = useQuery({
    queryKey: ['protein-history', userId, days],
    queryFn: () => fetchFoodLogsInRange(userId!, startDate, endDate),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute — food logs change frequently
  });

  // Aggregate raw logs into per-day protein entries (local-date slice).
  const entries: DayProteinEntry[] = (data ?? []).map((log) => ({
    date: log.loggedAt.slice(0, 10), // 'YYYY-MM-DD' from ISO 8601 prefix
    proteinG: log.proteinG,
  }));

  const history = buildHitHistory(entries, proteinFloorG, days, today);
  const hitRate = calculateHitRate(history);

  return {
    history,
    hitRate,
    proteinFloorG,
    isLoading: profileLoading || logsLoading,
  };
}

// ---------------------------------------------------------------------------
// useInjectionAdherence
//
// Reuses useMedicationLevelCurve() — that hook already exposes
// `injectionDates` (deduplicated, most-recent-first) and `injectionIntervalDays`
// (derived from the gap between the last two distinct injections).
// ---------------------------------------------------------------------------
export interface AdherenceResult {
  /** 0..1 adherence over the window */
  rate: number;
  /** Logged injection dates that fall inside the window (most-recent-first) */
  windowDates: string[];
  intervalDays: number;
  isLoading: boolean;
  hasData: boolean;
}

export function useInjectionAdherence(days: number): AdherenceResult {
  const { injectionDates, injectionIntervalDays, isLoading } =
    useMedicationLevelCurve();

  const today = new Date();
  const rate = calculateAdherence(
    injectionDates,
    injectionIntervalDays,
    days,
    today,
  );

  const cutoff = format(subDays(today, days - 1), 'yyyy-MM-dd');
  const windowDates = injectionDates.filter((d) => d >= cutoff);

  return {
    rate,
    windowDates,
    intervalDays: injectionIntervalDays,
    isLoading,
    hasData: injectionDates.length > 0,
  };
}

// ---------------------------------------------------------------------------
// useCheckInTrend
//
// Wraps useCheckInHistory(days) and pre-computes both averages for the cards.
// Returns per-day nausea + energy series (null when no check-in that day).
// ---------------------------------------------------------------------------
export interface SymptomDay {
  date: string;
  nausea: number | null;
  energy: number | null;
}

export interface CheckInTrendResult {
  days: SymptomDay[];
  avgNausea: number | null;
  avgEnergy: number | null;
  hasData: boolean;
  isLoading: boolean;
}

export function useCheckInTrend(days: number): CheckInTrendResult {
  const { history, isLoading } = useCheckInHistory(days);
  const today = new Date();

  // Build an oldest→newest sequence covering every day in the window.
  const byDate = new Map(history.map((h) => [h.date, h]));
  const window: SymptomDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const entry = byDate.get(date);
    window.push({
      date,
      nausea: entry?.nausea ?? null,
      energy: entry?.energy ?? null,
    });
  }

  const avgNausea = calculateAverageSymptom(
    window.map((d) => ({ date: d.date, score: d.nausea })),
    days,
    today,
  );
  const avgEnergy = calculateAverageSymptom(
    window.map((d) => ({ date: d.date, score: d.energy })),
    days,
    today,
  );

  return {
    days: window,
    avgNausea,
    avgEnergy,
    hasData: history.length > 0,
    isLoading,
  };
}
