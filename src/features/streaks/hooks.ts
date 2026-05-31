/**
 * React Query hooks for the streaks feature.
 * Display only — streak computation happens separately in calculator.ts.
 */

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchStreak } from '@/features/streaks/api';

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
};

/**
 * Fetch the persisted streak row for the current user.
 * Returns null if no streak has been recorded yet.
 */
export function useStreak(): {
  streak: StreakData | null;
  isLoading: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading } = useQuery({
    queryKey: ['streak', userId],
    queryFn: () => fetchStreak(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    streak: data ?? null,
    isLoading,
  };
}
