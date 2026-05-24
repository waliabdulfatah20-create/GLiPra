import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { calculateInjectionPhase } from '@/features/injection-cycle/calculator';
import { fetchTodayProfile } from '@/features/today/api';
import { calculateReadinessScore } from '@/features/today/readiness-calculator';
import { useTodayCheckIn, useCheckInHistory } from '@/features/check-in/hooks';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useDailyMacros } from '@/features/food-log/hooks';
import { useStreak } from '@/features/streaks/hooks';
import { detectRedFlags } from '@/features/safety/redFlagDetector';
import type { RedFlagDetection } from '@/features/safety/redFlagDetector';

export function useTodayProfile() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['today-profile', userId],
    queryFn: () => fetchTodayProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTodayData() {
  const { data: profile, isLoading, error } = useTodayProfile();
  const { checkIn } = useTodayCheckIn();
  const { history: checkInHistory } = useCheckInHistory(30);
  const streakData = useStreak();

  const today = format(new Date(), 'yyyy-MM-dd');
  const hourOfDay = new Date().getHours();

  const injectionCycle =
    profile?.lastInjectionDate
      ? calculateInjectionPhase({
          lastInjectionDate: profile.lastInjectionDate,
          today,
        })
      : null;

  const proteinFloorG = profile?.proteinFloorG ?? 0;
  const { protein: proteinConsumedG } = useDailyMacros();
  const proteinProgress = proteinFloorG > 0 ? proteinConsumedG / proteinFloorG : 0;

  const readiness =
    injectionCycle
      ? calculateReadinessScore({
          injectionPhase: injectionCycle.phase,
          proteinProgress,
          hourOfDay,
          nausea: checkIn?.nausea,
          energy: checkIn?.energy,
        })
      : null;

  // Run red-flag detection on check-in history
  let redFlagDetection: RedFlagDetection | null = null;
  if (checkInHistory.length > 0) {
    redFlagDetection = detectRedFlags({
      checkIns: checkInHistory,
      today,
    });
  }

  return {
    isLoading,
    error,
    profile,
    injectionCycle,
    proteinFloorG,
    proteinConsumedG,
    proteinProgress,
    readiness,
    hourOfDay,
    streak: streakData.streak,
    isStreakLoading: streakData.isLoading,
    redFlagDetection,
  };
}
