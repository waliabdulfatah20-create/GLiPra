import { useCallback, useEffect, useState } from 'react';

import { getItem, setItem } from '@/lib/storage';

const SELECTED_THEME = 'SELECTED_THEME';
export type ColorSchemeType = 'light' | 'dark' | 'system';
/**
 * this hooks should only be used while selecting the theme
 * This hooks will return the selected theme which is stored in AsyncStorage
 * selectedTheme should be one of the following values 'light', 'dark' or 'system'
 */
export function useSelectedTheme() {
  const [theme, setThemeState] = useState<ColorSchemeType | undefined>(undefined);

  useEffect(() => {
    getItem<ColorSchemeType>(SELECTED_THEME).then((value) => {
      setThemeState(value ?? 'system');
    });
  }, []);

  const setSelectedTheme = useCallback((t: ColorSchemeType) => {
    setThemeState(t);
    setItem(SELECTED_THEME, t);
  }, []);

  const selectedTheme = theme ?? 'system';
  return { selectedTheme, setSelectedTheme } as const;
}

// to be used in the root file to load the selected theme from AsyncStorage
export async function loadSelectedTheme() {
  const theme = await getItem<ColorSchemeType>(SELECTED_THEME);
  if (theme !== null) {
    console.log('theme', theme);
  }
}
