// ThemeContext — Glipra light/dark mode system.
//
// Usage:
//   const { colors, spacing, radius, shadows, isDark } = useTheme();
//   const { selectedTheme, setSelectedTheme } = useThemeSelector(); // Settings only
//
// All 83 files that still import from '@/theme/colors' continue to work
// during incremental migration (D2–D10). useTheme() falls back to lightTokens
// when called outside the provider, preventing crashes in unmigrated screens.

import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useColorScheme } from 'react-native';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { darkTokens, lightTokens } from '@/theme/tokens';

// ─── Context ─────────────────────────────────────────────────────────────────

type ThemeContextValue = {
  tokens: GlipraTokens;
  selectedTheme: ColorSchemeType;
  setSelectedTheme: (t: ColorSchemeType) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function GlipraThemeProvider({ children }: { children: React.ReactNode }) {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null

  const resolvedScheme
    = selectedTheme === 'system' ? (systemScheme ?? 'light') : selectedTheme;

  const tokens = resolvedScheme === 'dark' ? darkTokens : lightTokens;

  return (
    <ThemeContext value={{ tokens, selectedTheme, setSelectedTheme }}>
      {children}
    </ThemeContext>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Primary theme hook. Returns the full Direction B token set for the current mode.
 *
 * Safe to call outside the provider — falls back to lightTokens so screens
 * that haven't been migrated yet don't crash.
 *
 * @example
 *   const { colors, spacing, radius, shadows, isDark } = useTheme();
 *   const styles = React.useMemo(() => makeStyles({ colors, spacing }), [colors, spacing]);
 */
export function useTheme(): GlipraTokens {
  const ctx = React.use(ThemeContext);
  return ctx?.tokens ?? lightTokens;
}

/**
 * Settings-only hook. Exposes the persisted theme preference ('light' | 'dark' | 'system')
 * and a setter. Throws if called outside GlipraThemeProvider.
 */
export function useThemeSelector(): {
  selectedTheme: ColorSchemeType;
  setSelectedTheme: (t: ColorSchemeType) => void;
} {
  const ctx = React.use(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeSelector must be used inside GlipraThemeProvider');
  }
  return { selectedTheme: ctx.selectedTheme, setSelectedTheme: ctx.setSelectedTheme };
}
