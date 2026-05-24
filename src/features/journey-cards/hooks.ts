/**
 * React Query hooks for the Journey Cards feature.
 *
 * useJourneyCards        — fetch all unlocked milestone cards for the current user
 * useCheckAndUnlockMilestones — run on app load / Today mount to auto-unlock any
 *                          newly-earned milestones based on current app state
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, parseISO } from 'date-fns';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useStreak } from '@/features/streaks/hooks';
import {
  fetchUnlockedMilestonesWithDates,
  unlockMilestone,
  type UnlockedMilestone,
} from '@/features/journey-cards/api';
import type { MilestoneId } from '@/features/journey-cards/milestones';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JourneyCardEntry {
  milestoneId: MilestoneId;
  unlockedAt: Date;
}

// ---------------------------------------------------------------------------
// useJourneyCards
// ---------------------------------------------------------------------------

/**
 * Fetch all milestones unlocked by the current user.
 * Returns the milestone IDs and unlock timestamps for card rendering.
 */
export function useJourneyCards(): {
  unlockedIds: MilestoneId[];
  entries: JourneyCardEntry[];
  isLoading: boolean;
  refetch: () => void;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading, refetch } = useQuery<UnlockedMilestone[]>({
    queryKey: ['journey-cards', userId],
    queryFn: () => fetchUnlockedMilestonesWithDates(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });

  const entries: JourneyCardEntry[] = (data ?? []).map((m) => ({
    milestoneId: m.milestoneId,
    unlockedAt: parseISO(m.unlockedAt),
  }));

  const unlockedIds = entries.map((e) => e.milestoneId);

  return { unlockedIds, entries, isLoading, refetch };
}

// ---------------------------------------------------------------------------
// useCheckAndUnlockMilestones
// ---------------------------------------------------------------------------

/**
 * Call once on app load or Today screen mount.
 * Checks the user's current state against milestone criteria and unlocks any
 * newly-earned milestones. Stubs that can be extended as more features land.
 *
 * Checks implemented:
 *   - week_1_complete     : days since profile created_at >= 7
 *   - 3_months_strong     : days since profile created_at >= 90
 *   - protein_streak_7    : currentStreak >= 7
 *   - protein_streak_30   : currentStreak >= 30
 */
export function useCheckAndUnlockMilestones(
  profileCreatedAt: string | null | undefined,
  onUnlock?: (ids: MilestoneId[]) => void,
) {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const { streak } = useStreak();
  const { unlockedIds } = useJourneyCards();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !profileCreatedAt) return;

    const today = new Date();
    const createdAt = parseISO(profileCreatedAt);
    const daysSinceCreation = differenceInCalendarDays(today, createdAt);
    const currentStreak = streak?.currentStreak ?? 0;

    const toUnlock: MilestoneId[] = [];

    if (daysSinceCreation >= 7 && !unlockedIds.includes('week_1_complete')) {
      toUnlock.push('week_1_complete');
    }
    if (daysSinceCreation >= 90 && !unlockedIds.includes('3_months_strong')) {
      toUnlock.push('3_months_strong');
    }
    if (currentStreak >= 7 && !unlockedIds.includes('protein_streak_7')) {
      toUnlock.push('protein_streak_7');
    }
    if (currentStreak >= 30 && !unlockedIds.includes('protein_streak_30')) {
      toUnlock.push('protein_streak_30');
    }

    if (toUnlock.length === 0) return;

    // Fire-and-forget unlock calls — invalidate the cache when done so the
    // journey screen re-renders with the new cards.
    Promise.all(toUnlock.map((id) => unlockMilestone(userId, id)))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['journey-cards', userId] });
        onUnlock?.(toUnlock);
      })
      .catch(
        // Silently swallow — milestone unlock is best-effort and non-critical
        () => {},
      );
  }, [userId, profileCreatedAt, streak, unlockedIds, queryClient]);
}
