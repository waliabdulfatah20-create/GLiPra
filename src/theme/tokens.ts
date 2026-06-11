// Direction B token system — light and dark palettes.
// Import via: const { colors, spacing, radius, shadows, isDark } = useTheme();
// Never import directly into components — use the useTheme() hook.
// The static colors.ts export remains for backward-compat during incremental migration.

import { radius, spacing } from './colors';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type GlipraColorTokens = {
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
  disclaimerText: string;
  // Voice capture hero (always-dark surface, same in light + dark like the hero gradient)
  voiceHeroBg: string;
  voiceHeroBadgeBg: string;
  voiceHeroBadgeBorder: string;
  voiceHeroCtaBg: string;
  voiceHeroWave: string;
  voiceHeroTextMuted: string;
  recordingBg: string;
  recordingWave: string;
  // Hydration (water intake)
  water: string;
};

export type GlipraShadowTokens = {
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
};

export type GlipraGradients = {
  /** Hero header gradient — purple → blue → teal. Always dark; text on top should be white. */
  hero: readonly [string, string, string];
  /** Warning gradient — amber → deep amber. For tier-1 content cards. Text on top should be white. */
  warning: readonly [string, string, string];
};

/**
 * 5-step severity ramps for heat-strip / heatmap visualizations.
 * Index 0 = mildest / lowest value; index 4 = most severe / highest value.
 * Used by SeverityHeatStrip for nausea (warning) and energy (success).
 */
export type GlipraSeverityScales = {
  warningScale: readonly [string, string, string, string, string];
  successScale: readonly [string, string, string, string, string];
};

export type GlipraTokens = {
  colors: GlipraColorTokens;
  gradients: GlipraGradients;
  scales: GlipraSeverityScales;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: GlipraShadowTokens;
  isDark: boolean;
};

// ─── Light (Direction B) ──────────────────────────────────────────────────────

export const lightTokens: GlipraTokens = {
  isDark: false,
  spacing,
  radius,
  gradients: {
    hero: ['#6d28d9', '#2563eb', '#0284c7'],
    warning: ['#d97706', '#b45309', '#92400e'],
  },
  scales: {
    // Amber ramp — mild → severe (Tailwind amber 100→700)
    warningScale: ['#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#b45309'],
    // Emerald ramp — low → high (Tailwind emerald 200→700)
    successScale: ['#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#047857'],
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
    disclaimerText: '#9a3412',
    voiceHeroBg: '#1e1b4b',
    voiceHeroBadgeBg: 'rgba(124,58,237,0.25)',
    voiceHeroBadgeBorder: 'rgba(167,139,250,0.5)',
    voiceHeroCtaBg: 'rgba(124,58,237,0.35)',
    voiceHeroWave: '#a78bfa',
    voiceHeroTextMuted: 'rgba(255,255,255,0.65)',
    recordingBg: '#7f1d1d',
    recordingWave: '#fca5a5',
    water: '#0ea5e9',
  },
};

// ─── Dark (Direction B) ───────────────────────────────────────────────────────

export const darkTokens: GlipraTokens = {
  isDark: true,
  spacing,
  radius,
  gradients: {
    // Hero is only a header band (the body uses `background`), so it can stay
    // richly saturated to pop against the neutral-dark body.
    hero: ['#5b21b6', '#1d4ed8', '#0369a1'],
    warning: ['#92400e', '#78350f', '#451a03'],
  },
  scales: {
    warningScale: ['#451a03', '#78350f', '#b45309', '#d97706', '#fbbf24'],
    successScale: ['#064e3b', '#065f46', '#047857', '#10b981', '#34d399'],
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
    primaryLight: 'rgba(196, 181, 253, 0.16)',
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
    // Neutral dark slate scale (gray50 darkest -> gray900 lightest). NOT purple:
    // the old purple-remapped grays made the whole dark UI an oversaturated mess.
    gray50: '#111827',
    gray100: '#1f2937',
    gray200: '#374151',
    gray300: '#4b5563',
    gray400: '#6b7280',
    gray500: '#9ca3af',
    gray600: '#d1d5db',
    gray700: '#e5e7eb',
    gray800: '#f3f4f6',
    gray900: '#f9fafb',
    background: '#0f1419',
    surface: '#1b222e',
    surfaceElevated: '#252e3d',
    textPrimary: '#f3f4f6',
    textSecondary: '#9aa4b2',
    textDisabled: '#6b7280',
    textInverse: '#0f1419',
    border: '#2a3344',
    borderFocus: '#c4b5fd',
    escalationBg: 'rgba(248, 113, 113, 0.12)',
    escalationBorder: '#f87171',
    escalationText: '#fca5a5',
    disclaimerBg: 'rgba(251, 191, 36, 0.12)',
    disclaimerBorder: '#fbbf24',
    disclaimerText: '#fdba74',
    // Always-dark voice hero — identical to light so the card stays navy in both modes
    voiceHeroBg: '#1e1b4b',
    voiceHeroBadgeBg: 'rgba(124,58,237,0.25)',
    voiceHeroBadgeBorder: 'rgba(167,139,250,0.5)',
    voiceHeroCtaBg: 'rgba(124,58,237,0.35)',
    voiceHeroWave: '#a78bfa',
    voiceHeroTextMuted: 'rgba(255,255,255,0.65)',
    recordingBg: '#7f1d1d',
    recordingWave: '#fca5a5',
    water: '#38bdf8',
  },
};
