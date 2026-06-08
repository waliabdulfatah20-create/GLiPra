import type { ResistanceInput, ResistanceLog } from './api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { analytics, EVENTS } from '@/lib/analytics';
import {
  deleteResistanceLog,
  fetchRecentResistanceLogs,
  logResistanceSession,
} from './api';
import { computeResistanceFrequency } from './frequency';

const QUERY_KEY = 'resistance-logs';

/** Recent resistance logs (desc by performed_at). Powers the weekly-frequency metric. */
export function useResistanceLogs() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data: logs = [], isLoading } = useQuery<ResistanceLog[]>({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => fetchRecentResistanceLogs(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { logs, isLoading };
}

/**
 * Log a resistance-training session. Invalidates the resistance-log cache and the
 * Today profile so the weekly-frequency row (and the Phase B muscle score) refresh.
 */
export function useLogResistanceSession() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ResistanceInput) => logResistanceSession(userId!, input),
    onSuccess: () => {
      analytics.capture(EVENTS.RESISTANCE_LOGGED);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });
    },
  });
}

/** Delete a logged resistance session. Refreshes the same caches as logging. */
export function useDeleteResistanceLog() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId: string) => deleteResistanceLog(userId!, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });
    },
  });
}

/**
 * Derived weekly-frequency view for the current week. Reads the cached logs and
 * runs the pure `computeResistanceFrequency` against today's local date.
 */
export function useResistanceWeekly() {
  const { logs, isLoading } = useResistanceLogs();
  const today = format(new Date(), 'yyyy-MM-dd');
  const frequency = computeResistanceFrequency(
    logs.map(l => l.performedAt),
    today,
  );
  return { frequency, isLoading };
}
