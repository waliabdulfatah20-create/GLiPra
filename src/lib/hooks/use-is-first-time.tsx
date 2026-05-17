import { useCallback, useEffect, useState } from 'react';

import { getItem, setItem } from '@/lib/storage';

const IS_FIRST_TIME = 'IS_FIRST_TIME';

export function useIsFirstTime() {
  const [isFirstTime, setIsFirstTimeState] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    getItem<boolean>(IS_FIRST_TIME).then((value) => {
      // null means key not set — treat as first time
      setIsFirstTimeState(value ?? true);
    });
  }, []);

  const setIsFirstTime = useCallback((value: boolean) => {
    setIsFirstTimeState(value);
    setItem(IS_FIRST_TIME, value);
  }, []);

  // While loading from storage, default to `true` so no redirect fires prematurely
  return [isFirstTime ?? true, setIsFirstTime] as const;
}
