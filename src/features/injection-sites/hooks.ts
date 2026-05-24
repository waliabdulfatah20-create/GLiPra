import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/use-auth-store';

import {
  fetchRecentInjectionLogs,
  insertInjectionLog,
  type InjectionLogInput,
} from './api';
import { computeNextSite } from './calculator';
import type { InjectionLog } from './types';

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

export function useLogInjectionSite() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InjectionLogInput) =>
      insertInjectionLog(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
    },
  });
}
