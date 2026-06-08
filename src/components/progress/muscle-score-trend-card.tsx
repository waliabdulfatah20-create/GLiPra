/**
 * MuscleScoreTrendCard — the hero of the reframed Progress tab (Phase C).
 *
 * Plots weekly snapshots of the 0-100 Muscle Preservation Score over the trailing
 * ~10 weeks so the user can see whether their muscle protection is trending up.
 * Compact SVG line on a fixed 0-100 axis; only weeks with data are plotted.
 * Educational (Tier-2 disclaimer lives on the Progress screen footer).
 */

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { useMuscleScoreTrend } from '@/features/muscle-score/trend-hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { useTheme } from '@/lib/ThemeContext';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

const STRONG_MIN = 80;
const SOLID_MIN = 55;
const CHART_HEIGHT = 140;
const PAD = { top: 10, right: 10, bottom: 18, left: 26 };

type Props = { width: number };

export function MuscleScoreTrendCard({ width }: Props) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing }), [colors, spacing]);

  const { points, currentScore, trackedCount, isLoading } = useMuscleScoreTrend();

  const bandColor = (s: number): string =>
    s >= STRONG_MIN ? colors.success : s >= SOLID_MIN ? colors.primary : colors.warning;

  function body() {
    if (isLoading) {
      return (
        <View style={[styles.placeholder, { width, height: CHART_HEIGHT }]}>
          <Text style={styles.placeholderText}>{t('progress.loading')}</Text>
        </View>
      );
    }
    if (trackedCount < 2) {
      return (
        <View style={styles.sparseState}>
          <Text style={styles.sparseTitle}>{t('progress.muscle_card.empty_title')}</Text>
          <Text style={styles.sparseBody}>{t('progress.muscle_card.empty_body')}</Text>
        </View>
      );
    }

    const plotW = width - PAD.left - PAD.right;
    const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
    const lastIndex = points.length - 1;
    const toX = (i: number): number =>
      PAD.left + (lastIndex === 0 ? 0 : (i / lastIndex) * plotW);
    const toY = (score: number): number => PAD.top + ((100 - score) / 100) * plotH;

    const tracked = points
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.hasEnoughData);
    const polyPoints = tracked.map(({ p, i }) => `${toX(i)},${toY(p.score)}`).join(' ');
    const last = tracked.at(-1)!;

    return (
      <View>
        <View style={styles.scoreRow}>
          <Text style={[styles.score, { color: bandColor(currentScore ?? 0) }]}>
            {currentScore}
          </Text>
          <Text style={styles.scoreUnit}>{t('progress.muscle_card.current')}</Text>
        </View>

        <Svg width={width} height={CHART_HEIGHT}>
          {/* Gridlines + y labels at 0 / 50 / 100 */}
          {[0, 50, 100].map(g => (
            <React.Fragment key={g}>
              <Line
                x1={PAD.left}
                y1={toY(g)}
                x2={width - PAD.right}
                y2={toY(g)}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={PAD.left - 6}
                y={toY(g) + 3}
                fontSize={9}
                fill={colors.textSecondary}
                textAnchor="end"
              >
                {String(g)}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Trend line */}
          {tracked.length >= 2 && (
            <Polyline
              points={polyPoints}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {/* Dots */}
          {tracked.map(({ p, i }) => (
            <Circle
              key={p.weekStart}
              cx={toX(i)}
              cy={toY(p.score)}
              r={i === last.i ? 4 : 2.5}
              fill={i === last.i ? bandColor(p.score) : colors.primary}
            />
          ))}

          {/* x-axis end labels */}
          <SvgText
            x={PAD.left}
            y={CHART_HEIGHT - 4}
            fontSize={9}
            fill={colors.textSecondary}
            textAnchor="start"
          >
            {t('progress.muscle_card.weeks_ago', { weeks: points.length })}
          </SvgText>
          <SvgText
            x={width - PAD.right}
            y={CHART_HEIGHT - 4}
            fontSize={9}
            fill={colors.textSecondary}
            textAnchor="end"
          >
            {t('progress.muscle_card.now')}
          </SvgText>
        </Svg>
      </View>
    );
  }

  return (
    <CardShell label={t('progress.muscle_card.label')} accentColor={colors.primary}>
      {body()}
      <PharmacistTip>{t(tipI18nKey('muscle'))}</PharmacistTip>
    </CardShell>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
};

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
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
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    score: {
      fontSize: 32,
      fontWeight: '800',
      lineHeight: 34,
    },
    scoreUnit: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 5,
    },
  });
}
