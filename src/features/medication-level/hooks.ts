import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchTodayProfile } from '@/features/today/api';
import { generateSteadyStateCurve } from '@/features/medication-level/calculator';
import type { GLP1MedicationId } from '@/types';

/**
 * Maps the onboarding injectionFrequency string to a number of days.
 */
function frequencyToDays(frequency: string | null | undefined): number {
  switch (frequency) {
    case 'daily':
      return 1;
    case 'biweekly':
      return 14;
    case 'weekly':
    default:
      return 7;
  }
}

export interface MedicationLevelCurveResult {
  curve: Array<{ date: string; dayOffset: number; levelMg: number }> | null;
  todayOffset: number;
  isLoading: boolean;
  medicationId: GLP1MedicationId | null;
  doseMg: number | null;
  injectionIntervalDays: number;
}

/**
 * React Query hook that derives the steady-state pharmacokinetic level curve
 * from the user's profile data.
 *
 * Returns null curve when required fields (lastInjectionDate, doseMg) are missing.
 */
export function useMedicationLevelCurve(): MedicationLevelCurveResult {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['today-profile', userId],
    queryFn: () => fetchTodayProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  // Required fields check
  if (
    !profile ||
    !profile.lastInjectionDate ||
    !(profile as Record<string, unknown>)['doseMg']
  ) {
    // Try to extract doseMg and injectionFrequency from the profile with loose access
    // The profile type from today/api.ts doesn't include doseMg — we use it if present.
    return {
      curve: null,
      todayOffset: 0,
      isLoading,
      medicationId: null,
      doseMg: null,
      injectionIntervalDays: 7,
    };
  }

  const rawProfile = profile as Record<string, unknown>;
  const doseMg = typeof rawProfile['doseMg'] === 'number' ? rawProfile['doseMg'] : null;
  const injectionFrequency =
    typeof rawProfile['injectionFrequency'] === 'string'
      ? rawProfile['injectionFrequency']
      : null;

  const medicationId = (profile.medicationId ?? null) as GLP1MedicationId | null;

  if (!doseMg || !medicationId || !profile.lastInjectionDate) {
    return {
      curve: null,
      todayOffset: 0,
      isLoading,
      medicationId,
      doseMg,
      injectionIntervalDays: 7,
    };
  }

  const injectionIntervalDays = frequencyToDays(injectionFrequency);

  const curve = generateSteadyStateCurve(
    doseMg,
    medicationId,
    profile.lastInjectionDate,
    injectionIntervalDays,
    today,
  );

  const todayIndex = curve.findIndex((p) => p.date === today);
  const todayOffset = todayIndex !== -1 ? curve[todayIndex].dayOffset : 0;

  return {
    curve,
    todayOffset,
    isLoading,
    medicationId,
    doseMg,
    injectionIntervalDays,
  };
}
