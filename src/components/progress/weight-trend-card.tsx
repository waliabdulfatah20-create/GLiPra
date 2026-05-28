/**
 * WeightTrendCard — wraps the existing EwmaChart in a Progress-tab card shell.
 * The underlying chart already handles the "needs at least 2 weights" empty
 * state, so we just slice the user's logs to the requested window and pass
 * them through.
 */

import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EwmaChart } from '@/components/weight/ewma-chart';
import { useWeightLogs } from '@/features/weight/hooks';
import { useInjectionAdherence } from '@/features/progress/hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { useTheme } from '@/lib/ThemeContext';
import { useWeightUnit } from '@/lib/unit-preference';
import type { GlipraTokens } from '@/theme/tokens';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

interface WeightTrendCardProps {
  days: number;
  width: number;
}

export function WeightTrendCard({ days, width }: WeightTrendCardProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );
  const { logs, isLoading } = useWeightLogs(days);
  const { windowDates: injectionDates } = useInjectionAdherence(days);
  const { unit: weightUnit } = useWeightUnit();

  return (
    <CardShell label={t('progress.weight_card.label')} accentColor={colors.primary}>
      {isLoading ? (
        <View style={[styles.placeholder, { width, height: 160 }]}>
          <Text style={styles.placeholderText}>{t('progress.loading')}</Text>
        </View>
      ) : logs.length === 0 ? (
        <View style={[styles.placeholder, { width, height: 160 }]}>
          <Text style={styles.placeholderText}>{t('progress.weight_card.empty')}</Text>
        </View>
      ) : logs.length < 3 ? (
        <View style={styles.sparseState}>
          <Text style={styles.sparseIcon}>⚖️</Text>
          <Text style={styles.sparseTitle}>Keep logging to see your trend</Text>
          <Text style={styles.sparseBody}>
            Log your weight a few more times and your smoothed trend line will appear here.
          </Text>
        </View>
      ) : (
        <EwmaChart
          logs={logs}
          width={width}
          height={160}
          unit={weightUnit}
          injectionDates={injectionDates}
        />
      )}
      <PharmacistTip>{t(tipI18nKey('weight'))}</PharmacistTip>
    </CardShell>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
}

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    placeholderText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sparseState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    sparseIcon: {
      fontSize: 28,
    },
    sparseTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    sparseBody: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: spacing.lg,
    },
  });
}
