// src/features/safety/hooks.ts
// Snooze state for the red-flag escalation card.
// 24-hour snooze persisted in AsyncStorage — card reappears after expiry.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const SNOOZE_KEY = 'glipra_red_flag_snooze_until';
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Manages the 24-hour snooze for the escalation card.
 * isSnoozed: true  → card is hidden.
 * isLoading: true  → AsyncStorage read in progress; treat as snoozed to avoid flash.
 * snooze()         → writes a 24h expiry timestamp and updates state immediately.
 */
export function useRedFlagSnooze(): {
  isSnoozed: boolean;
  isLoading: boolean;
  snooze: () => Promise<void>;
} {
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SNOOZE_KEY)
      .then(value => setSnoozedUntil(value !== null ? Number.parseInt(value, 10) : null))
      .catch(() => setSnoozedUntil(null))
      .finally(() => setIsLoading(false));
  }, []);

  const snooze = useCallback(async () => {
    const until = Date.now() + SNOOZE_DURATION_MS;
    await AsyncStorage.setItem(SNOOZE_KEY, String(until));
    setSnoozedUntil(until);
  }, []);

  return {
    isSnoozed: snoozedUntil !== null && Date.now() < snoozedUntil,
    isLoading,
    snooze,
  };
}
