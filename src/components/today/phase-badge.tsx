import type { GlipraTokens } from '@/theme/tokens';
import type { InjectionPhase, OralPhase } from '@/types';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

type PhaseBadgeProps
  = | { route: 'injection'; phase: InjectionPhase; daysSinceInjection: number }
    | { route: 'oral'; phase: OralPhase; daysOnMed: number };

export function PhaseBadge(props: PhaseBadgeProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const INJECTION_COLORS: Record<InjectionPhase, string> = {
    injection_day: colors.phaseInjectionDay,
    peak_suppression: colors.phasePeakSuppression,
    adjustment: colors.phaseAdjustment,
    recovery_window: colors.phaseRecoveryWindow,
    overdue: colors.phaseOverdue,
  };

  const ORAL_COLORS: Record<OralPhase, string> = {
    building: colors.phaseAdjustment,
    steady_state: colors.phaseRecoveryWindow,
    dose_due: colors.phaseInjectionDay,
    dose_missed: colors.phaseOverdue,
  };

  let color: string;
  let label: string;
  let subLabel: string;

  if (props.route === 'injection') {
    color = INJECTION_COLORS[props.phase];
    label = t(`medication.${props.phase}`);
    subLabel = `Day ${props.daysSinceInjection}`;
  }
  else {
    color = ORAL_COLORS[props.phase];
    label = t(`oral_phase.${props.phase}`);
    subLabel = props.daysOnMed > 0 ? `Day ${props.daysOnMed}` : '';
  }

  return (
    <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
        {label}
        {subLabel ? ` · ${subLabel}` : ''}
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
