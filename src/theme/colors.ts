// All design tokens for DosePath.
// Usage: import { colors, spacing, radius, shadows } from '@/theme/colors';
// Never use hardcoded color strings or spacing numbers in components.

export const colors = {
  // Brand
  primary: '#2D6BE4',       // Main CTA, active states
  primaryDark: '#1A4FB5',   // Pressed state
  primaryLight: '#EBF1FD',  // Tinted backgrounds

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Protein / Readiness score arc colors
  proteinLow: '#EF4444',    // Below 60% of floor
  proteinMid: '#F59E0B',    // 60-89% of floor
  proteinGood: '#22C55E',   // 90%+ of floor

  // Injection phase badge colors
  phaseInjectionDay: '#8B5CF6',
  phasePeakSuppression: '#3B82F6',
  phaseAdjustment: '#10B981',
  phaseRecoveryWindow: '#F59E0B',
  phaseOverdue: '#EF4444',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#2D6BE4',

  // Clinical / Safety
  escalationBg: '#FEF2F2',
  escalationBorder: '#FCA5A5',
  escalationText: '#991B1B',
  disclaimerBg: '#FFF7ED',
  disclaimerBorder: '#FED7AA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
