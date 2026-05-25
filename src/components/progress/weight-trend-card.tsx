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
import { colors, spacing } from '@/theme/colors';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

interface WeightTrendCardProps {
  days: number;
  width: number;
}

export function WeightTrendCard({ days, width }: WeightTrendCardProps) {
  const { t } = useTranslation();
  const { logs, isLoading } = useWeightLogs(days);
  const { windowDates: injectionDates } = useInjectionAdherence(days);

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
      ) : (
        <EwmaChart logs={logs} width={width} height={160} injectionDates={injectionDates} />
      )}
      <PharmacistTip>{t(tipI18nKey('weight'))}</PharmacistTip>
    </CardShell>
  );
}

const styles = StyleSheet.create({
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
});
