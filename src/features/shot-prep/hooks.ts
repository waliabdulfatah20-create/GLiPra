import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

import { CHECKLIST_ITEMS } from '@/features/shot-prep/checklist-data';

const TOTAL_ITEMS = CHECKLIST_ITEMS.length;

function storageKey(injectionDate: string): string {
  return `SHOT_PREP_${injectionDate}`;
}

export function useShotPrepChecklist(injectionDate: string): {
  checkedIds: Set<string>;
  toggleItem: (id: string) => void;
  allChecked: boolean;
  completedCount: number;
} {
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());

  // Load persisted state on mount / when injection date changes
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const raw = await AsyncStorage.getItem(storageKey(injectionDate));
        if (!cancelled && raw) {
          const parsed: string[] = JSON.parse(raw);
          setCheckedIds(new Set(parsed));
        }
      } catch {
        // Non-fatal: start with empty set
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [injectionDate]);

  const toggleItem = React.useCallback(
    (id: string) => {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        // Persist asynchronously — fire and forget
        void AsyncStorage.setItem(
          storageKey(injectionDate),
          JSON.stringify(Array.from(next)),
        ).catch(() => {
          // Non-fatal persistence failure — UI state is still correct
        });
        return next;
      });
    },
    [injectionDate],
  );

  const completedCount = checkedIds.size;
  const allChecked = completedCount >= TOTAL_ITEMS;

  return { checkedIds, toggleItem, allChecked, completedCount };
}
