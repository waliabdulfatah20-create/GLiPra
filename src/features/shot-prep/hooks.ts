import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { fetchShotPrepLog, upsertShotPrepLog } from './api';
import { CHECKLIST_ITEMS, type ChecklistItemId } from './checklist-data';

export function useShotDayPrep(injectionDate: string) {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = ['shot-prep-log', userId, injectionDate];

  const { data: log, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchShotPrepLog(userId!, injectionDate),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  // Optimistic local state — initialized once from DB when data first loads.
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isLoading && !initialized.current) {
      setLocalCompleted(log?.completedItems ?? []);
      initialized.current = true;
    }
  }, [isLoading, log]);

  const { mutate: doUpsert } = useMutation({
    mutationFn: (items: string[]) => upsertShotPrepLog(userId!, injectionDate, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggleItem = useCallback(
    (id: ChecklistItemId) => {
      setLocalCompleted((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        doUpsert(next);
        return next;
      });
    },
    [doUpsert],
  );

  const completedCount = localCompleted.length;
  const totalCount = CHECKLIST_ITEMS.length;
  const isDone = completedCount >= totalCount;

  return { completedItems: localCompleted, completedCount, totalCount, isDone, isLoading, toggleItem };
}
