import type { GuidanceContext } from '@/features/daily-guidance/api';
import type { RedFlagDetection } from '@/features/safety/redFlagDetector';
import { useQuery } from '@tanstack/react-query';

import { format, subDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useCheckInHistory, useTodayCheckIn } from '@/features/check-in/hooks';
import { fetchFoodLogsInRange } from '@/features/food-log/api';
import { useDailyMacros } from '@/features/food-log/hooks';
import { calculateInjectionPhase } from '@/features/injection-cycle/calculator';
import { detectRedFlags } from '@/features/safety/redFlagDetector';
import { useStreak } from '@/features/streaks/hooks';
import { fetchTodayProfile } from '@/features/today/api';
import { calculateReadinessScore } from '@/features/today/readiness-calculator';
import { buildReadinessCard } from '@/features/today/readiness-display';

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

function useYesterdayProtein(): { proteinG: number; isLoading: boolean } {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['food-logs-yesterday', userId, yesterday],
    queryFn: () => fetchFoodLogsInRange(userId!, yesterday, yesterday),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const proteinG = (data ?? []).reduce((sum, log) => sum + log.proteinG, 0);
  return { proteinG, isLoading };
}

export function useTodayData() {
  const { t, i18n } = useTranslation();
  const { data: profile, isLoading, error } = useTodayProfile();
  const { checkIn } = useTodayCheckIn();
  const { history: checkInHistory } = useCheckInHistory(30);
  const streakData = useStreak();
  const { proteinG: yesterdayProteinG } = useYesterdayProtein();

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const hourOfDay = new Date().getHours();

  const injectionCycle
    = profile?.lastInjectionDate
      ? calculateInjectionPhase({
          lastInjectionDate: profile.lastInjectionDate,
          today,
        })
      : null;

  const proteinFloorG = profile?.proteinFloorG ?? 0;
  const { protein: proteinConsumedG } = useDailyMacros();
  const proteinProgress = proteinFloorG > 0 ? proteinConsumedG / proteinFloorG : 0;

  const guidanceContext: GuidanceContext | null = profile
    ? {
        injectionPhase: injectionCycle?.phase ?? null,
        nauseaScore: checkIn?.nausea ?? null,
        energyScore: checkIn?.energy ?? null,
        proteinProgressPct:
          proteinFloorG > 0 ? Math.round((proteinConsumedG / proteinFloorG) * 100) : null,
        medicationStatus: profile.medicationStatus ?? null,
        language: (i18n.language === 'es' ? 'es' : 'en') as 'en' | 'es',
      }
    : null;

  const prevDayProteinRatio
    = proteinFloorG > 0 ? yesterdayProteinG / proteinFloorG : undefined;

  const streakActive
    = streakData.streak?.lastStreakDate === today
      || streakData.streak?.lastStreakDate === yesterday;

  const newDoseWeek = profile?.medicationStatus === 'starting';

  const readinessResult
    = injectionCycle
      ? calculateReadinessScore({
          injectionPhase: injectionCycle.phase,
          proteinProgress,
          hourOfDay,
          nausea: checkIn?.nausea,
          energy: checkIn?.energy,
          prevDayProteinRatio,
          newDoseWeek,
          streakActive,
        })
      : null;

  const readinessCard
    = readinessResult && injectionCycle
      ? buildReadinessCard(readinessResult, injectionCycle.phase, t)
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
    readinessCard,
    hourOfDay,
    streak: streakData.streak,
    isStreakLoading: streakData.isLoading,
    redFlagDetection,
    guidanceContext,
  };
}
