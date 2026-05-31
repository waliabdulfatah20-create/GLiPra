// All design tokens for DosePath.
// Usage: import { colors, spacing, radius, shadows } from '@/theme/colors';
// Never use hardcoded color strings or spacing numbers in components.

export const colors = {
  // Brand — Direction B deep purple
  primary: '#6d28d9', // Main CTA, active states
  primaryDark: '#5b21b6', // Pressed state
  primaryLight: 'rgba(109, 40, 217, 0.08)', // Tinted backgrounds

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Protein / Readiness score arc colors
  proteinLow: '#EF4444', // Below 60% of floor
  proteinMid: '#F59E0B', // 60-89% of floor
  proteinGood: '#22C55E', // 90%+ of floor

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
  background: '#FAF8F5', // warm cream — clinical warmth, not cold gray
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E8E4DD', // warm border — matches cream background
  borderFocus: '#6d28d9',

  // Clinical / Safety
  escalationBg: '#FEF2F2',
  escalationBorder: '#FCA5A5',
  escalationText: '#991B1B',
  disclaimerBg: '#FFF7ED',
  disclaimerBorder: '#FED7AA',
  disclaimerText: '#9A3412',
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
    shadowColor: '#2A1F0F', // warm-tinted black for natural shadows
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // slightly stronger — more definition
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#2A1F0F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2A1F0F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
