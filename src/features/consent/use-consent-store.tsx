import { useCallback, useEffect, useState } from 'react';

import { getItem, setItem } from '@/lib/storage';

const HAS_AGREED_TO_CONSENTS = 'HAS_AGREED_TO_CONSENTS';
const CONSENT_AGREED_AT = 'CONSENT_AGREED_AT';

export function useConsentStore() {
  const [hasAgreed, setHasAgreedState] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    getItem<boolean>(HAS_AGREED_TO_CONSENTS).then((value) => {
      setHasAgreedState(value ?? false);
    });
  }, []);

  const setHasAgreed = useCallback((value: boolean) => {
    setHasAgreedState(value);
    setItem(HAS_AGREED_TO_CONSENTS, value);
    if (value) {
      setItem(CONSENT_AGREED_AT, new Date().toISOString());
    }
  }, []);

  // undefined = still loading from AsyncStorage; caller should not redirect until resolved
  return [hasAgreed, setHasAgreed] as const;
}
