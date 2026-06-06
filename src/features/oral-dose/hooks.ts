import type { OralDoseInput, OralDoseLog } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { analytics, EVENTS } from '@/lib/analytics';
import { notifications } from '@/lib/notifications';
import { fetchRecentOralDoseLogs, logOralDose, updateOralDoseWindowRespected } from './api';

const QUERY_KEY = 'oral-dose-logs';

/** Recent oral dose logs (desc by taken_at). Powers the dose window + adherence streak. */
export function useOralDoseLogs() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data: logs = [], isLoading } = useQuery<OralDoseLog[]>({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => fetchRecentOralDoseLogs(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute — the window state ticks client-side anyway
  });

  return { logs, isLoading };
}

/**
 * Log an oral dose. Invalidates the dose-log cache and the Today profile so the
 * dose-window card and oral phase banner refresh immediately. When the oral
 * dose reminder is enabled, schedules the one-shot "clear to eat" notification
 * 30 minutes out (fire-and-forget; non-critical).
 */
export function useLogOralDose() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: OralDoseInput) => logOralDose(userId!, input),
    onSuccess: () => {
      analytics.capture(EVENTS.ORAL_DOSE_LOGGED);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });

      AsyncStorage.getItem('NOTIF_ORAL_DOSE_ENABLED')
        .then((enabled) => {
          if (enabled === 'true')
            return notifications.scheduleAbsorptionClear();
        })
        .catch(() => {}); // non-critical — silent fail
    },
  });
}

/**
 * Capture whether the empty-stomach window was respected for a logged dose,
 * after the absorption window clears. Invalidates the dose-log cache and the
 * Today profile so the technique-aware adherence streak refreshes.
 */
export function useSetDoseWindowRespected() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logId, windowRespected }: { logId: string; windowRespected: boolean }) =>
      updateOralDoseWindowRespected(userId!, logId, windowRespected),
    onSuccess: () => {
      analytics.capture(EVENTS.ORAL_WINDOW_CONFIRMED);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });
    },
  });
}
