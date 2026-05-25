// Direction B token system — light and dark palettes.
// Import via: const { colors, spacing, radius, shadows, isDark } = useTheme();
// Never import directly into components — use the useTheme() hook.
// The static colors.ts export remains for backward-compat during incremental migration.

import { radius, spacing } from './colors';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface GlipraColorTokens {
  // Brand
  primary: string;
  primaryDark: string;
  primaryLight: string;
  // Semantic
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  // Protein arc
  proteinLow: string;
  proteinMid: string;
  proteinGood: string;
  // Injection phase badges
  phaseInjectionDay: string;
  phasePeakSuppression: string;
  phaseAdjustment: string;
  phaseRecoveryWindow: string;
  phaseOverdue: string;
  // Neutrals (gray scale — remapped per mode)
  white: string;
  black: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  // Backgrounds / surfaces
  background: string;
  surface: string;
  surfaceElevated: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  textInverse: string;
  // Borders
  border: string;
  borderFocus: string;
  // Clinical / Safety
  escalationBg: string;
  escalationBorder: string;
  escalationText: string;
  disclaimerBg: string;
  disclaimerBorder: string;
}

export interface GlipraShadowTokens {
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface GlipraGradients {
  /** Hero header gradient — purple → blue → teal. Always dark; text on top should be white. */
  hero: readonly [string, string, string];
}

export interface GlipraTokens {
  colors: GlipraColorTokens;
  gradients: GlipraGradients;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: GlipraShadowTokens;
  isDark: boolean;
}

// ─── Light (Direction B) ──────────────────────────────────────────────────────

export const lightTokens: GlipraTokens = {
  isDark: false,
  spacing,
  radius,
  gradients: {
    hero: ['#6d28d9', '#2563eb', '#0284c7'],
  },
  shadows: {
    sm: {
      shadowColor: '#3b1f8f',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#3b1f8f',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.11,
      shadowRadius: 10,
      elevation: 4,
    },
    lg: {
      shadowColor: '#3b1f8f',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 8,
    },
  },
  colors: {
    primary: '#6d28d9',
    primaryDark: '#5b21b6',
    primaryLight: 'rgba(109, 40, 217, 0.08)',
    success: '#059669',
    successLight: '#d1fae5',
    warning: '#d97706',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    proteinLow: '#ef4444',
    proteinMid: '#d97706',
    proteinGood: '#059669',
    phaseInjectionDay: '#7c3aed',
    phasePeakSuppression: '#2563eb',
    phaseAdjustment: '#059669',
    phaseRecoveryWindow: '#d97706',
    phaseOverdue: '#ef4444',
    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    background: '#faf8f5',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textDisabled: '#9ca3af',
    textInverse: '#ffffff',
    border: '#e8e4dd',
    borderFocus: '#6d28d9',
    escalationBg: '#fef2f2',
    escalationBorder: '#fca5a5',
    escalationText: '#991b1b',
    disclaimerBg: '#fff7ed',
    disclaimerBorder: '#fed7aa',
  },
};

// ─── Dark (Direction B) ───────────────────────────────────────────────────────

export const darkTokens: GlipraTokens = {
  isDark: true,
  spacing,
  radius,
  gradients: {
    hero: ['#3b0764', '#1e3a8a', '#0c4a6e'],
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 8,
    },
  },
  colors: {
    primary: '#c4b5fd',
    primaryDark: '#a78bfa',
    primaryLight: 'rgba(196, 181, 253, 0.12)',
    success: '#34d399',
    successLight: 'rgba(52, 211, 153, 0.15)',
    warning: '#fbbf24',
    warningLight: 'rgba(251, 191, 36, 0.15)',
    error: '#f87171',
    errorLight: 'rgba(248, 113, 113, 0.15)',
    proteinLow: '#f87171',
    proteinMid: '#fbbf24',
    proteinGood: '#34d399',
    phaseInjectionDay: '#c4b5fd',
    phasePeakSuppression: '#93c5fd',
    phaseAdjustment: '#6ee7b7',
    phaseRecoveryWindow: '#fcd34d',
    phaseOverdue: '#f87171',
    white: '#ffffff',
    black: '#000000',
    // Neutrals remapped to dark-purple scale in dark mode
    gray50: '#1e1533',
    gray100: '#2d2047',
    gray200: '#3d2d5e',
    gray300: '#4c3a75',
    gray400: '#7c5cbf',
    gray500: '#a78bfa',
    gray600: '#c4b5fd',
    gray700: '#ddd6fe',
    gray800: '#ede9fe',
    gray900: '#f5f3ff',
    background: '#0d0920',
    surface: '#1e1533',
    surfaceElevated: '#2d2047',
    textPrimary: '#f5f3ff',
    textSecondary: '#a78bfa',
    textDisabled: '#7c5cbf',
    textInverse: '#0d0920',
    border: '#2d2047',
    borderFocus: '#c4b5fd',
    escalationBg: 'rgba(248, 113, 113, 0.12)',
    escalationBorder: '#f87171',
    escalationText: '#fca5a5',
    disclaimerBg: 'rgba(251, 191, 36, 0.12)',
    disclaimerBorder: '#fbbf24',
  },
};
