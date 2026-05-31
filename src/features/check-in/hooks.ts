import type { CheckInEntry, CheckInHistoryEntry, CheckInRecord } from '@/features/check-in/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { format } from 'date-fns';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchCheckInHistory, fetchTodayCheckIn, upsertCheckIn } from '@/features/check-in/api';
import { unlockMilestone } from '@/features/journey-cards/api';

import { analytics, EVENTS } from '@/lib/analytics';

const CHECK_IN_QUERY_KEY = 'today-check-in';

export function useTodayCheckIn(): {
  checkIn: CheckInRecord | null;
  isLoading: boolean;
  refetch: () => void;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading, refetch } = useQuery({
    queryKey: [CHECK_IN_QUERY_KEY, userId, today],
    queryFn: () => fetchTodayCheckIn(userId!, today),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    checkIn: data ?? null,
    isLoading,
    refetch,
  };
}

export function useUpsertCheckIn(): {
  mutate: (entry: CheckInEntry) => void;
  isLoading: boolean;
  isSuccess: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (entry: CheckInEntry) => {
      if (!userId)
        throw new Error('Not authenticated');
      return upsertCheckIn(userId, entry);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.CHECKIN_COMPLETED);
      queryClient.invalidateQueries({
        queryKey: [CHECK_IN_QUERY_KEY, userId, today],
      });
      // Also invalidate today data so readiness score refreshes
      queryClient.invalidateQueries({
        queryKey: ['today-profile', userId],
      });
      // Unlock first_checkin milestone (idempotent — safe to call every time)
      if (userId) {
        unlockMilestone(userId, 'first_checkin')
          .then(() => queryClient.invalidateQueries({ queryKey: ['journey-cards', userId] }))
          .catch(() => {});
      }
    },
  });

  return {
    mutate,
    isLoading: isPending,
    isSuccess,
  };
}

/**
 * Fetch check-in history for red-flag detection.
 * Returns the last N days of check-ins (default 30).
 * Used to analyze symptom patterns over time.
 */
export function useCheckInHistory(days: number = 30): {
  history: CheckInHistoryEntry[];
  isLoading: boolean;
  error: Error | null;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['check-in-history', userId, days],
    queryFn: () => fetchCheckInHistory(userId!, days),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    history: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
