import type { ChecklistItemId } from './checklist-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchShotPrepLog, upsertShotPrepLog } from './api';
import { getChecklistStatus } from './checklist-data';

export function useShotDayPrep(injectionDate: string) {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  // Key by userId to avoid cross-user cache collision; sentinel for unauthenticated state.
  const queryKey = userId
    ? (['shot-prep-log', userId, injectionDate] as const)
    : (['shot-prep-log', '__no_user__'] as const);

  const { data: log, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchShotPrepLog(userId!, injectionDate),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  // Optimistic local state — initialized once from DB when data first loads.
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);

  // Keyed by injectionDate so we re-initialize when the date changes.
  const initializedForDate = useRef<string | null>(null);
  const committedItems = useRef<string[]>([]);

  useEffect(() => {
    if (!isLoading && initializedForDate.current !== injectionDate) {
      const items = log?.completedItems ?? [];
      setLocalCompleted(items);
      committedItems.current = items;
      initializedForDate.current = injectionDate;
    }
  }, [isLoading, log, injectionDate]);

  const { mutate: doUpsert } = useMutation({
    mutationFn: (items: string[]) => upsertShotPrepLog(userId!, injectionDate, items),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      return { previousItems: committedItems.current };
    },
    onError: (_err, _items, context) => {
      if (context?.previousItems !== undefined) {
        setLocalCompleted(context.previousItems);
      }
    },
    onSuccess: (_data, items) => {
      committedItems.current = items;
      queryClient.setQueryData(queryKey, {
        completedItems: items,
        fullyCompleted: getChecklistStatus(items).isDone,
      });
    },
  });

  const toggleItem = useCallback(
    (id: ChecklistItemId) => {
      if (!userId)
        return;
      setLocalCompleted((prev) => {
        const next = prev.includes(id)
          ? prev.filter(x => x !== id)
          : [...prev, id];
        doUpsert(next);
        return next;
      });
    },
    [doUpsert, userId],
  );

  const { completedCount, totalCount, isDone } = getChecklistStatus(localCompleted);

  return { completedItems: localCompleted, completedCount, totalCount, isDone, isLoading, toggleItem };
}
