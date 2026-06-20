import type { CardioInput, CardioLog } from './api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useResistanceWeekly } from '@/features/resistance/hooks';
import { analytics, EVENTS } from '@/lib/analytics';
import {
  deleteCardioLog,
  fetchRecentCardioLogs,
  logCardioSession,
} from './api';
import { cardioInterference, computeCardioFrequency } from './frequency';

const QUERY_KEY = 'cardio-logs';

/** Recent cardio logs (desc by performed_at). Powers the weekly count + interference check. */
export function useCardioLogs() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data: logs = [], isLoading } = useQuery<CardioLog[]>({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => fetchRecentCardioLogs(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { logs, isLoading };
}

/**
 * Log a cardio session. Invalidates the cardio-log cache. Does NOT touch the
 * muscle score (cardio is never a score input).
 */
export function useLogCardioSession() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CardioInput) => logCardioSession(userId!, input),
    onSuccess: () => {
      analytics.capture(EVENTS.CARDIO_LOGGED);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
  });
}

/** Delete a logged cardio session. Refreshes the cardio cache. */
export function useDeleteCardioLog() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => deleteCardioLog(userId!, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
  });
}

/**
 * Derived weekly cardio count for the current week. Reads the cached logs and runs
 * the pure `computeCardioFrequency` against today's local date.
 */
export function useCardioWeekly() {
  const { logs, isLoading } = useCardioLogs();
  const today = format(new Date(), 'yyyy-MM-dd');
  const frequency = computeCardioFrequency(
    logs.map(l => l.performedAt),
    today,
  );
  return { frequency, isLoading };
}

/**
 * The muscle-vs-cardio interference signal for the current week: true when cardio
 * outpaces resistance (past the floor). Reads both the cardio and resistance weekly
 * counts. Pure decision lives in `cardioInterference`.
 */
export function useCardioInterference() {
  const { frequency: cardio } = useCardioWeekly();
  const { frequency: resistance } = useResistanceWeekly();
  return cardioInterference({
    cardioThisWeek: cardio.currentWeekSessions,
    resistanceThisWeek: resistance.currentWeekSessions,
  });
}
