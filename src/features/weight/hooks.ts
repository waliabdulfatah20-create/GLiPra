import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchWeightLogs, insertWeightLog } from '@/features/weight/api';
import type { WeightLogEntry } from '@/features/weight/api';
import { analytics, EVENTS } from '@/lib/analytics';
import { applyEwma } from '@/utils/ewma';

const WEIGHT_LOGS_KEY = 'weight-logs';

/**
 * Fetch the last 90 days of weight logs for the current user.
 */
export function useWeightLogs(): {
  logs: WeightLogEntry[];
  isLoading: boolean;
  refetch: () => void;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: [WEIGHT_LOGS_KEY, userId],
    queryFn: () => fetchWeightLogs(userId!),
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

      // Get the latest EWMA from the query cache (if available).
      const cached = queryClient.getQueryData<WeightLogEntry[]>([
        WEIGHT_LOGS_KEY,
        userId,
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
    },
  });

  return {
    mutate: mutation.mutate,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
}
