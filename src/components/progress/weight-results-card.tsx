/**
 * WeightResultsCard — four headline metrics derived from the user's weight log:
 *   Total Lost · Weekly Avg · BMI · To Goal
 *
 * Shown above the EWMA trend chart in the Progress tab.
 * Requires at least 2 weight entries to compute meaningful stats.
 */

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CardShell } from './card-shell';
import type { WeightLogEntry } from '@/features/weight/api';
import { useWeightUnit, kgToLbs } from '@/lib/unit-preference';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface WeightResultsCardProps {
  /** All weight logs for the current range (or all-time). */
  logs: WeightLogEntry[];
  /** User's goal weight in kg, or null if not set. */
  goalWeightKg: number | null;
  /** User's height in cm, used to compute BMI. */
  heightCm: number | null;
}

interface MetricCellProps {
  label: string;
  value: string;
  unit?: string;
  dimmed?: boolean;
}

function MetricCell({ label, value, unit, dimmed = false }: MetricCellProps) {
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );
  return (
    <View style={styles.cell}>
      <View style={styles.cellValueRow}>
        <Text style={[styles.cellValue, dimmed && styles.cellValueDimmed]}>{value}</Text>
        {unit ? <Text style={styles.cellUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );
}

export function WeightResultsCard({ logs, goalWeightKg, heightCm }: WeightResultsCardProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );
  const { unit: weightUnit } = useWeightUnit();

  if (logs.length < 2) {
    return (
      <CardShell label={t('progress.results_card.label')} accentColor={colors.success}>
        <Text style={styles.empty}>{t('progress.results_card.empty')}</Text>
      </CardShell>
    );
  }

  const first = logs[0];
  const latest = logs[logs.length - 1];

  // ── Total lost ─────────────────────────────────────────────────────────────
  const totalLostKg = first.weightKg - latest.weightKg;
  const totalLostDisplay =
    weightUnit === 'lbs'
      ? kgToLbs(Math.abs(totalLostKg)).toFixed(1)
      : Math.abs(totalLostKg).toFixed(1);
  const totalLostSign = totalLostKg >= 0 ? '-' : '+';
  const totalLostUnit = weightUnit === 'lbs' ? 'lbs' : 'kg';

  // ── Weekly average change ──────────────────────────────────────────────────
  const totalDays = differenceInCalendarDays(parseISO(latest.loggedAt), parseISO(first.loggedAt));
  const weeks = Math.max(1, Math.floor(totalDays / 7));
  const weeklyAvgKg = Math.abs(totalLostKg) / weeks;
  const weeklyAvgDisplay =
    weightUnit === 'lbs'
      ? kgToLbs(weeklyAvgKg).toFixed(1)
      : weeklyAvgKg.toFixed(1);

  // ── BMI ───────────────────────────────────────────────────────────────────
  let bmiDisplay = '--';
  if (heightCm && heightCm > 0) {
    const heightM = heightCm / 100;
    const bmi = latest.weightKg / (heightM * heightM);
    bmiDisplay = bmi.toFixed(1);
  }

  // ── To goal ───────────────────────────────────────────────────────────────
  let toGoalDisplay = '--';
  let toGoalUnit: string | undefined;
  let toGoalDimmed = true;
  if (goalWeightKg != null) {
    const diffKg = latest.weightKg - goalWeightKg;
    if (weightUnit === 'lbs') {
      toGoalDisplay = Math.abs(kgToLbs(diffKg)).toFixed(1);
      toGoalUnit = diffKg <= 0 ? 'lbs done' : 'lbs to go';
    } else {
      toGoalDisplay = Math.abs(diffKg).toFixed(1);
      toGoalUnit = diffKg <= 0 ? 'kg done' : 'kg to go';
    }
    toGoalDimmed = false;
  }

  return (
    <CardShell label={t('progress.results_card.label')} accentColor={colors.success}>
      <View style={styles.grid}>
        <MetricCell
          label={t('progress.results_card.total_lost')}
          value={`${totalLostSign}${totalLostDisplay}`}
          unit={totalLostUnit}
        />
        <MetricCell
          label={t('progress.results_card.weekly_avg')}
          value={weeklyAvgDisplay}
          unit={`${weightUnit}/wk`}
        />
        <MetricCell
          label={t('progress.results_card.bmi')}
          value={bmiDisplay}
        />
        <MetricCell
          label={t('progress.results_card.to_goal')}
          value={toGoalDisplay}
          unit={toGoalUnit}
          dimmed={toGoalDimmed}
        />
      </View>
    </CardShell>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
}

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    empty: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: '50%',
      paddingVertical: spacing.sm,
      paddingRight: spacing.sm,
    },
    cellValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 3,
    },
    cellValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    cellValueDimmed: {
      color: colors.textDisabled,
    },
    cellUnit: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    cellLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.4,
      marginTop: 2,
    },
  });
}
