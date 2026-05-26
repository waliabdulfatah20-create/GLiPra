/**
 * CheckInSymptomCard — dual-line chart of nausea (warning) and energy (success)
 * scores over the window. Skips days the user didn't check in.
 *
 * Both metrics live on the same 1-5 axis so they're directly comparable.
 */

import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Line, Polyline, Svg } from 'react-native-svg';

import { useCheckInTrend } from '@/features/progress/hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

interface CheckInSymptomCardProps {
  days: number;
  width: number;
}

const CHART_HEIGHT = 100;
const MIN_SCORE = 1;
const MAX_SCORE = 5;

export function CheckInSymptomCard({ days, width }: CheckInSymptomCardProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );
  const { days: trend, avgNausea, avgEnergy, hasData, isLoading } =
    useCheckInTrend(days);

  function buildPolyline(values: (number | null)[]): string {
    // Each contiguous run of non-null values becomes a polyline segment.
    // For simplicity v1: skip nulls; render one polyline of all defined points.
    const defined = values
      .map((v, i) => ({ v, i }))
      .filter((p): p is { v: number; i: number } => p.v != null);
    if (defined.length === 0) return '';
    const stepX = trend.length > 1 ? width / (trend.length - 1) : 0;
    return defined
      .map((p) => {
        const x = p.i * stepX;
        const y =
          CHART_HEIGHT -
          ((p.v - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * CHART_HEIGHT;
        return `${x},${y}`;
      })
      .join(' ');
  }

  const nauseaPoints = buildPolyline(trend.map((d) => d.nausea));
  const energyPoints = buildPolyline(trend.map((d) => d.energy));

  return (
    <CardShell
      label={t('progress.symptoms_card.label')}
      accentColor={colors.warning}
    >
      {isLoading ? (
        <Text style={styles.placeholder}>{t('progress.loading')}</Text>
      ) : !hasData ? (
        <Text style={styles.placeholder}>
          {t('progress.symptoms_card.empty')}
        </Text>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <SummaryStat
              color={colors.warning}
              label={t('progress.symptoms_card.nausea')}
              value={avgNausea}
            />
            <SummaryStat
              color={colors.success}
              label={t('progress.symptoms_card.energy')}
              value={avgEnergy}
            />
          </View>

          <Svg width={width} height={CHART_HEIGHT + 8}>
            {/* Horizontal guide at score 3 (midpoint) */}
            <Line
              x1={0}
              y1={CHART_HEIGHT / 2}
              x2={width}
              y2={CHART_HEIGHT / 2}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {nauseaPoints && (
              <Polyline
                points={nauseaPoints}
                fill="none"
                stroke={colors.warning}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            {energyPoints && (
              <Polyline
                points={energyPoints}
                fill="none"
                stroke={colors.success}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
          </Svg>
        </>
      )}
      <PharmacistTip>{t(tipI18nKey('symptoms'))}</PharmacistTip>
    </CardShell>
  );
}

function SummaryStat({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number | null;
}) {
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );
  return (
    <View style={styles.statItem}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>
        {value == null ? '—' : value.toFixed(1)}
      </Text>
    </View>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
}

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    placeholder: {
      fontSize: 13,
      color: colors.textSecondary,
      paddingVertical: spacing.md,
      textAlign: 'center',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginBottom: spacing.sm,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
