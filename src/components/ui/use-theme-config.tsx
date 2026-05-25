import type { Theme } from '@react-navigation/native';
import {
  DarkTheme as RNDarkTheme,
  DefaultTheme as RNLightTheme,
} from '@react-navigation/native';

import { useTheme } from '@/lib/ThemeContext';

/**
 * Returns a React Navigation Theme wired to the current Glipra theme.
 * Must be called inside GlipraThemeProvider (see src/app/_layout.tsx).
 */
export function useThemeConfig(): Theme {
  const { colors, isDark } = useTheme();

  const base = isDark ? RNDarkTheme : RNLightTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      text: colors.textPrimary,
      border: colors.border,
      card: colors.surface,
      notification: colors.error,
    },
  };
}
