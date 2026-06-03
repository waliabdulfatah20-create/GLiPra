/**
 * useAiPrivacyAck — one-time AsyncStorage gate for the AI Data & Privacy
 * disclaimer modal. Shown on the first AI scan (photo OR voice), acked
 * forever after.
 *
 * Pattern matches `daily-guidance-card.tsx`'s disclaimer-seen flag.
 *
 * Behavior:
 *   - Mount → reads the flag; while reading, `needsAck` is true (so we
 *     don't accidentally let a scan through during the brief load window).
 *   - `acknowledge()` writes the flag and flips `needsAck` to false.
 *   - Cancel does NOT call acknowledge() — user is re-prompted next time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

export const AI_PRIVACY_ACK_KEY = 'glipra_ai_scan_data_privacy_ack';

export type UseAiPrivacyAckOutput = {
  /** True if the user hasn't acked yet (or while still loading). */
  needsAck: boolean;
  /** Mark the ack as set — call this from the "I understand" button. */
  acknowledge: () => Promise<void>;
  /** Initial AsyncStorage read in flight. */
  isLoading: boolean;
};

export function useAiPrivacyAck(): UseAiPrivacyAckOutput {
  const [acked, setAcked] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(AI_PRIVACY_ACK_KEY)
      .then((v) => {
        if (cancelled)
          return;
        setAcked(v === 'true');
        setIsLoading(false);
      })
      .catch(() => {
        // Defensive: if AsyncStorage errors, default to "needs ack" so the
        // user sees the disclaimer rather than silently skipping it.
        if (cancelled)
          return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const acknowledge = React.useCallback(async () => {
    await AsyncStorage.setItem(AI_PRIVACY_ACK_KEY, 'true');
    setAcked(true);
  }, []);

  return {
    needsAck: !acked,
    acknowledge,
    isLoading,
  };
}
