// Muscle Preservation Score — Today hero card (Muscle-First MVP, Phase B).
//
// The app's core promise made visible: a 0-100 trailing-window estimate of how
// well the user is honoring the two levers that protect lean mass on a GLP-1
// (protein consistency + resistance training, weighted 70/30). Transparent
// factor rows mirror the Readiness card. Self-contained via useMuscleScore().
//
// Educational estimate of HABITS, not a measurement of muscle mass -> Tier-2
// disclaimer (Rule 8). Copy defers to the prescriber; joins the attorney queue.

import type { MuscleSentiment } from '@/features/muscle-score/card';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useMuscleScore } from '@/features/muscle-score/hooks';
import { useTheme } from '@/lib/ThemeContext';

const STRONG_MIN = 80;
const SOLID_MIN = 55;

export function MuscleScoreCard() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const { card, isLoading } = useMuscleScore();

  if (isLoading)
    return null;

  const scoreColor = !card.hasEnoughData
    ? colors.textSecondary
    : card.score >= STRONG_MIN
      ? colors.success
      : card.score >= SOLID_MIN
        ? colors.primary
        : colors.warning;

  function dotColor(sentiment: MuscleSentiment, tracked: boolean): string {
    if (!tracked)
      return colors.gray300;
    if (sentiment === 'positive')
      return colors.success;
    if (sentiment === 'negative')
      return colors.warning;
    return colors.textSecondary;
  }

  return (
    <View style={[styles.card, { borderTopColor: scoreColor }]}>
      <Text style={styles.sectionLabel}>{t('muscle_score.label')}</Text>

      {/* Hero: big score + headline */}
      <View style={styles.heroRow}>
        <Text style={[styles.score, { color: scoreColor }]}>
          {card.hasEnoughData ? card.score : '--'}
        </Text>
        <Text style={styles.scoreUnit}>{t('muscle_score.out_of')}</Text>
      </View>
      <Text style={styles.headline}>{card.headline}</Text>

      <View style={styles.divider} />

      {/* Factor rows */}
      {card.factors.map(factor => (
        <View key={factor.id} style={styles.factorRow}>
          <View
            style={[
              styles.factorDot,
              { backgroundColor: dotColor(factor.sentiment, factor.tracked) },
            ]}
          />
          <Text style={styles.factorLabel}>{factor.label}</Text>
          <Text
            style={[
              styles.factorValue,
              !factor.tracked && styles.factorValueMuted,
            ]}
          >
            {factor.value}
          </Text>
        </View>
      ))}

      {/* Tip */}
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>{card.tip}</Text>
      </View>

      {/* Rule 8: educational habits estimate, not a muscle measurement -> Tier 2 */}
      <DisclaimerBanner tier={2}>
        <Text style={styles.disclaimerText}>{t('muscle_score.disclaimer')}</Text>
      </DisclaimerBanner>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 3,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    score: {
      fontSize: 44,
      fontWeight: '800',
      lineHeight: 48,
    },
    scoreUnit: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    headline: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    factorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 3,
    },
    factorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    factorLabel: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
    },
    factorValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    factorValueMuted: {
      color: colors.textSecondary,
      fontWeight: '500',
    },
    tipBox: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      padding: spacing.sm,
      marginTop: spacing.sm,
    },
    tipText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 18,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
