import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, spacing } from '@/theme/colors';
import type { InjectionPhase } from '@/types';

const PHASE_COLORS: Record<InjectionPhase, string> = {
  injection_day: colors.phaseInjectionDay,
  peak_suppression: colors.phasePeakSuppression,
  adjustment: colors.phaseAdjustment,
  recovery_window: colors.phaseRecoveryWindow,
  overdue: colors.phaseOverdue,
};

interface PhaseBadgeProps {
  phase: InjectionPhase;
  daysSinceInjection: number;
}

export function PhaseBadge({ phase, daysSinceInjection }: PhaseBadgeProps) {
  const { t } = useTranslation();
  const color = PHASE_COLORS[phase];
  // Reuse existing medication.* keys: injection_day, peak_suppression, adjustment, recovery_window, overdue
  const label = t(`medication.${phase}`);

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>
        {label} · Day {daysSinceInjection}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
