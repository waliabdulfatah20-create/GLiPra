// src/features/daily-guidance/hooks.ts

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { generateDailyGuidance, type GuidanceContext } from './api';

export const DAILY_GUIDANCE_KEY = 'daily-guidance';

/**
 * Fetches (or generates) today's AI nutrition tip.
 * staleTime: Infinity — never re-fetches within the same day/session.
 * context: null disables the query until Today screen data is ready.
 */
export function useDailyGuidance(context: GuidanceContext | null) {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: [DAILY_GUIDANCE_KEY, userId, today],
    queryFn: () => generateDailyGuidance(context!),
    enabled: !!userId && context !== null,
    staleTime: Infinity,
    retry: 1,
    retryDelay: 2000,
  });
}
