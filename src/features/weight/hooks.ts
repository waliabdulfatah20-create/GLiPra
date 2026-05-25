import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchWeightLogs, fetchWeightLogCount, insertWeightLog } from '@/features/weight/api';
import type { WeightLogEntry } from '@/features/weight/api';
import { analytics, EVENTS } from '@/lib/analytics';
import { applyEwma } from '@/utils/ewma';
import { unlockMilestone } from '@/features/journey-cards/api';

const WEIGHT_LOGS_KEY = 'weight-logs';

/**
 * Fetch weight logs for the current user.
 * @param days How many days back to fetch. Defaults to 90.
 *             Pass 9999 to get all-time data (used by the "All" range selector).
 */
export function useWeightLogs(days = 90): {
  logs: WeightLogEntry[];
  isLoading: boolean;
  refetch: () => void;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [WEIGHT_LOGS_KEY, userId, days],
    queryFn: () => fetchWeightLogs(userId!, days),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    logs: data ?? [],
    isLoading,
    refetch,
  };
}

/**
 * Mutation to log a new weight entry.
 * Reads the latest EWMA from the query cache, computes the new EWMA,
 * then inserts the entry.
 */
export function useInsertWeightLog(): {
  mutate: (entry: { weightKg: number; notes?: string }) => void;
  isLoading: boolean;
  isSuccess: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (entry: { weightKg: number; notes?: string }) => {
      if (!userId) throw new Error('Not authenticated');

      // Get the latest EWMA from the 90-day cache (if available).
      // Always read the default-window key — that cache is always populated
      // by the weight logging screen regardless of which range the user has
      // selected in Progress.
      const cached = queryClient.getQueryData<WeightLogEntry[]>([
        WEIGHT_LOGS_KEY,
        userId,
        90,
      ]);
      const latestEwma = cached?.length
        ? (cached[cached.length - 1]?.ewmaWeightKg ?? null)
        : null;

      const ewmaWeightKg = applyEwma(entry.weightKg, latestEwma);

      await insertWeightLog(userId, {
        weightKg: entry.weightKg,
        ewmaWeightKg,
        notes: entry.notes,
      });
    },
    onSuccess: () => {
      // No weight value in properties — Rule 2 (no health metrics in analytics)
      analytics.capture(EVENTS.WEIGHT_LOGGED);
      queryClient.invalidateQueries({ queryKey: [WEIGHT_LOGS_KEY, userId] });
      // Check weight_logged_10x milestone (idempotent unlock)
      if (userId) {
        fetchWeightLogCount(userId).then((count) => {
          if (count >= 10) {
            unlockMilestone(userId, 'weight_logged_10x')
              .then(() => queryClient.invalidateQueries({ queryKey: ['journey-cards', userId] }))
              .catch(() => {});
          }
        }).catch(() => {});
      }
    },
  });

  return {
    mutate: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}
