/**
 * usePermissionDisclosure — one-time AsyncStorage gate for the prominent
 * permission disclosure shown BEFORE the OS camera / microphone prompt.
 *
 * Google Play requires an in-app rationale (what data, why) with affirmative
 * consent before requesting a sensitive permission. We show the disclosure on
 * the first camera use and the first microphone use, then mark it seen forever.
 *
 * Pattern mirrors `useAiPrivacyAck`. Two independent keys (camera, microphone)
 * so each permission's disclosure appears the first time that permission is
 * actually needed.
 *
 * Behavior:
 *   - Mount → reads both flags; while loading, `hasSeen` returns false so we
 *     never skip the disclosure (showing it once extra is safe; skipping is not).
 *   - `markSeen(kind)` writes the flag — call from the "Continue" button.
 *   - Cancel does NOT mark seen — the user is re-prompted next time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

export type PermissionKind = 'camera' | 'microphone';

export const PERM_DISCLOSURE_CAMERA_KEY = 'glipra_perm_disclosure_camera';
export const PERM_DISCLOSURE_MIC_KEY = 'glipra_perm_disclosure_microphone';

const KEY_BY_KIND: Record<PermissionKind, string> = {
  camera: PERM_DISCLOSURE_CAMERA_KEY,
  microphone: PERM_DISCLOSURE_MIC_KEY,
};

export type UsePermissionDisclosureOutput = {
  /** Initial AsyncStorage read in flight. */
  isLoading: boolean;
  /** True once the user has seen the disclosure for this permission. False while loading. */
  hasSeen: (kind: PermissionKind) => boolean;
  /** Mark the disclosure seen — call from the "Continue" button. */
  markSeen: (kind: PermissionKind) => Promise<void>;
};

export function usePermissionDisclosure(): UsePermissionDisclosureOutput {
  const [seen, setSeen] = React.useState<Record<PermissionKind, boolean>>({
    camera: false,
    microphone: false,
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      AsyncStorage.getItem(PERM_DISCLOSURE_CAMERA_KEY),
      AsyncStorage.getItem(PERM_DISCLOSURE_MIC_KEY),
    ])
      .then(([camera, microphone]) => {
        if (cancelled)
          return;
        setSeen({ camera: camera === 'true', microphone: microphone === 'true' });
        setIsLoading(false);
      })
      .catch(() => {
        // Defensive: if AsyncStorage errors, leave both false so the user sees
        // the disclosure rather than silently skipping it.
        if (cancelled)
          return;
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasSeen = React.useCallback((kind: PermissionKind) => seen[kind], [seen]);

  const markSeen = React.useCallback(async (kind: PermissionKind) => {
    await AsyncStorage.setItem(KEY_BY_KIND[kind], 'true');
    setSeen(prev => ({ ...prev, [kind]: true }));
  }, []);

  return { isLoading, hasSeen, markSeen };
}
