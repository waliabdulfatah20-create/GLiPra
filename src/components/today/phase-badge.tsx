import type { GlipraTokens } from '@/theme/tokens';
import type { InjectionPhase } from '@/types';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

type PhaseBadgeProps = {
  phase: InjectionPhase;
  daysSinceInjection: number;
};

export function PhaseBadge({ phase, daysSinceInjection }: PhaseBadgeProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const PHASE_COLORS: Record<InjectionPhase, string> = {
    injection_day: colors.phaseInjectionDay,
    peak_suppression: colors.phasePeakSuppression,
    adjustment: colors.phaseAdjustment,
    recovery_window: colors.phaseRecoveryWindow,
    overdue: colors.phaseOverdue,
  };

  const color = PHASE_COLORS[phase];
  // Reuse existing medication.* keys: injection_day, peak_suppression, adjustment, recovery_window, overdue
  const label = t(`medication.${phase}`);

  return (
    <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
        {label}
        {' '}
        · Day
        {daysSinceInjection}
      </Text>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.full,
      borderWidth: 1,
      gap: spacing.xs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  });
}
