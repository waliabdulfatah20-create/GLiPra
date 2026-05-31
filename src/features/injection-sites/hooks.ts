import type { InjectionLogInput } from './api';
import type { InjectionLog } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { unlockMilestone } from '@/features/journey-cards/api';
import { analytics, EVENTS } from '@/lib/analytics';
import { notifications } from '@/lib/notifications';
import {
  deleteInjectionLog,
  fetchRecentInjectionLogs,

  insertInjectionLog,
  updateInjectionLog,
} from './api';
import { computeNextSite } from './calculator';

const QUERY_KEY = 'injection-logs';

export function useInjectionLogs() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data: logs = [], isLoading } = useQuery<InjectionLog[]>({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => fetchRecentInjectionLogs(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  return { logs, isLoading };
}

/**
 * Returns the rotation state derived from the user's logs:
 *   - `recommendation`: next site to inject (always defined when logs available)
 *   - `allResting`: true when every site is within REST_DAYS rest window —
 *      UI should warn the user but the recommendation is still usable
 *      (least recently used site).
 */
export function useInjectionSiteRecommendation() {
  const { logs, isLoading } = useInjectionLogs();
  const { recommendation, allResting } = computeNextSite(logs);
  return { recommendation, allResting, isLoading };
}

export function useUpdateInjectionSite() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ logId, input }: { logId: string; input: InjectionLogInput }) =>
      updateInjectionLog(userId!, logId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ['injection-logs-curve', userId] });
      queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });
    },
  });
}

export function useDeleteInjectionSite() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => deleteInjectionLog(userId!, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ['injection-logs-curve', userId] });
      queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });
    },
  });
}

export function useLogInjectionSite(lastInjectionDate?: string) {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InjectionLogInput) =>
      insertInjectionLog(userId!, input),
    onSuccess: (_data, input) => {
      analytics.capture(EVENTS.INJECTION_LOGGED);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      // Refresh the curve and phase banner caches so both update immediately
      queryClient.invalidateQueries({ queryKey: ['injection-logs-curve', userId] });
      queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });
      // Reschedule the injection day reminder for the next cycle (fire-and-forget).
      // Uses the gap between the new shot and the previous shot as the interval.
      if (lastInjectionDate) {
        const gapDays = differenceInCalendarDays(
          parseISO(input.injectedAt),
          parseISO(lastInjectionDate),
        );
        if (gapDays > 0) {
          AsyncStorage.getItem('NOTIF_INJECTION_ENABLED')
            .then((enabled) => {
              if (enabled === 'true') {
                const nextDate = addDays(parseISO(input.injectedAt), gapDays);
                return notifications.scheduleInjectionReminder(nextDate.toISOString());
              }
            })
            .catch(() => {}); // non-critical — silent fail
        }
      }

      // Unlock injection_day_warrior if the user logged on their scheduled injection day
      if (userId && lastInjectionDate) {
        const injectedDay = input.injectedAt.slice(0, 10);
        const injectionDay = lastInjectionDate.slice(0, 10);
        if (injectedDay === injectionDay) {
          unlockMilestone(userId, 'injection_day_warrior')
            .then(() =>
              queryClient.invalidateQueries({ queryKey: ['journey-cards', userId] }),
            )
            .catch(() => {});
        }
      }
    },
  });
}
