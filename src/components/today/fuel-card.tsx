// src/components/today/fuel-card.tsx
// Today "Fuel" hero card (the screen's main attraction): merges the Readiness score
// (compact dial + tip, with a "Why?" toggle for the factor breakdown) and the Protein
// ring, and adds Fiber + Micronutrient "spots".
//
// Reuses ProteinRing, the readinessCard model (useTodayData), and the micronutrient
// status helpers. Educational estimate -> Tier-2 disclaimer (Rule 8). No condition
// names (Rule 9). No em dashes in copy. Colors from tokens; the only literals are the
// white / translucent-white overlays on the gradient header (same pattern as the
// Micronutrient Watch card, theme-independent because the gradient reads dark in both).

import type { NutrientStatus } from '@/features/food-log/micronutrient-constants';
import type { MuscleDisplayFactor } from '@/features/muscle-score/card';
import type { FiberStatus } from '@/features/today/fuel-card-data';
import type { GlipraTokens } from '@/theme/tokens';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { ProteinRing } from '@/components/today/protein-ring';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useDailyMacros } from '@/features/food-log/hooks';
import { useMuscleScore } from '@/features/muscle-score/hooks';
import { summarizeFiber, summarizeMicros } from '@/features/today/fuel-card-data';
import { useTodayData } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Compact score dial rendered on the gradient header (white arc + score).
// Shows "--" when the score is null (not enough data yet).
function ScoreDial({ score }: { score: number | null }) {
  const size = 60;
  const strokeWidth = 6;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const center = size / 2;
  const progress = score == null ? 0 : Math.max(0, Math.min(1, score / 100));

  const dashOffset = useSharedValue(circumference);
  React.useEffect(() => {
    dashOffset.value = withSpring(circumference * (1 - progress), { damping: 18, stiffness: 80 });
  }, [progress, circumference]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: dashOffset.value }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={r}
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#ffffff' }}>
          {score == null ? '--' : score}
        </Text>
      </View>
    </View>
  );
}

export function FuelCard() {
  const { t } = useTranslation();
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const { readinessCard, proteinConsumedG, proteinFloorG, isLoading } = useTodayData();
  const { card: muscleCard } = useMuscleScore();
  const { fiber, magnesiumMg, zincMg, b12Mcg, vitaminDIu, ironMg, hasMicronutrients }
    = useDailyMacros();

  const [expanded, setExpanded] = React.useState(false);

  if (isLoading)
    return null;

  const fiberSummary = summarizeFiber(fiber);
  const microSummary = summarizeMicros(
    { magnesiumMg, zincMg, b12Mcg, vitaminDIu, ironMg },
    hasMicronutrients,
  );

  const hasFloor = proteinFloorG > 0;
  const proteinPct = hasFloor
    ? Math.min(100, Math.round((proteinConsumedG / proteinFloorG) * 100))
    : 0;
  const proteinToGo = hasFloor ? Math.max(0, Math.round(proteinFloorG - proteinConsumedG)) : 0;

  const muscleScore = muscleCard.hasEnoughData ? muscleCard.score : null;
  const readinessScore = readinessCard?.score ?? null;
  const tip = muscleCard.tip;
  const factors = muscleCard.factors;

  function fiberColor(status: FiberStatus): string {
    if (status === 'green')
      return colors.success;
    if (status === 'amber')
      return colors.warning;
    return colors.gray300; // 'low' stays calm gray (fiber is not a safety floor)
  }

  function microColor(status: NutrientStatus): string {
    if (status === 'green')
      return colors.success;
    if (status === 'amber')
      return colors.warning;
    return colors.error;
  }

  function muscleFactorColor(factor: MuscleDisplayFactor): string {
    if (!factor.tracked)
      return colors.gray300;
    if (factor.sentiment === 'positive')
      return colors.success;
    if (factor.sentiment === 'negative')
      return colors.warning;
    return colors.textSecondary;
  }

  return (
    <View style={styles.card}>
      {/* Gradient hero header — readiness headline + dial + trust pill */}
      <LinearGradient
        colors={[...gradients.hero]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLabel}>{t('muscle_score.label')}</Text>
            <Text style={styles.headerHeadline}>{muscleCard.headline}</Text>
            <View style={styles.pillRow}>
              <View style={styles.trustPill}>
                <Text style={styles.trustPillText}>{t('today.readiness_trust')}</Text>
              </View>
              {readinessScore != null && (
                <View style={styles.readinessPill}>
                  <View style={styles.readinessDot} />
                  <Text style={styles.readinessPillText}>
                    {t('today.fuel_readiness_pill', { score: readinessScore })}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.dialWrap}>
            <ScoreDial score={muscleScore} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Protein hero row — tap anywhere to edit the target */}
        <Pressable
          style={styles.proteinRow}
          onPress={() => { haptics.tap(); router.push('/protein-target'); }}
          accessibilityRole="button"
          accessibilityLabel={t('today.protein_edit_a11y')}
        >
          <ProteinRing
            proteinConsumedG={proteinConsumedG}
            proteinFloorG={proteinFloorG}
            size={128}
            emptyLabel={t('today.protein_no_target')}
          />
          <View style={styles.proteinText}>
            <Text style={styles.metricLabel}>{t('today.protein_label')}</Text>
            {hasFloor
              ? (
                  <>
                    <Text style={styles.proteinPct}>
                      {t('today.fuel_protein_to_floor', { pct: proteinPct })}
                    </Text>
                    <Text style={styles.proteinToGo}>
                      {t('today.fuel_protein_to_go', { grams: proteinToGo })}
                    </Text>
                  </>
                )
              : (
                  <Text style={styles.proteinToGo}>{t('today.protein_no_target')}</Text>
                )}
          </View>
        </Pressable>

        {/* "Why?" toggle -> readiness factor breakdown */}
        {factors.length > 0 && (
          <Animated.View layout={LinearTransition.duration(180)} style={styles.whyWrap}>
            <Pressable
              style={styles.whyToggle}
              onPress={() => { haptics.tap(); setExpanded(e => !e); }}
              accessibilityRole="button"
              accessibilityLabel={t('today.fuel_why_toggle')}
            >
              <Text style={styles.whyToggleText}>{t('today.fuel_why_toggle')}</Text>
              <Text style={[styles.whyChevron, expanded && styles.whyChevronOpen]}>›</Text>
            </Pressable>
            {expanded && (
              <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)}>
                <Text style={styles.whyLabel}>{t('today.fuel_why_label')}</Text>
                {factors.map(factor => (
                  <View key={factor.id} style={styles.factorRow}>
                    <View
                      style={[
                        styles.factorDot,
                        { backgroundColor: muscleFactorColor(factor) },
                      ]}
                    />
                    <Text style={styles.factorLabel}>{factor.label}</Text>
                    <Text style={[styles.factorValue, !factor.tracked && styles.factorValueMuted]}>
                      {factor.value}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </Animated.View>
        )}

        {/* Spots row: Fiber + Micronutrients */}
        <View style={styles.spotsRow}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>{t('today.fuel_fiber_label')}</Text>
            <View style={styles.tileValueRow}>
              <Text style={styles.tileValue}>
                {Math.round(fiberSummary.grams)}
                {' '}
                g
              </Text>
              <Text style={styles.tileSub}>
                {t('today.fuel_fiber_of', { target: fiberSummary.target })}
              </Text>
            </View>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${fiberSummary.pct}%` as `${number}%`,
                    backgroundColor: fiberColor(fiberSummary.status),
                  },
                ]}
              />
            </View>
          </View>

          <Pressable
            style={styles.tile}
            onPress={() => { haptics.tap(); router.push('/log'); }}
            accessibilityRole="button"
            accessibilityLabel={t('today.fuel_micros_label')}
          >
            <View style={styles.tileHeaderRow}>
              <Text style={styles.tileLabel}>{t('today.fuel_micros_label')}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
            {microSummary.hasMicros
              ? (
                  <>
                    <View style={styles.dotsRow}>
                      {microSummary.statuses.map(s => (
                        <View
                          key={s.key}
                          style={[styles.microDot, { backgroundColor: microColor(s.status) }]}
                        />
                      ))}
                    </View>
                    <Text style={styles.microsCount}>
                      {t('today.fuel_micros_on_track', {
                        count: microSummary.onTrack,
                        total: microSummary.total,
                      })}
                    </Text>
                  </>
                )
              : (
                  <Text style={styles.microsEmpty}>{t('today.fuel_micros_empty')}</Text>
                )}
          </Pressable>
        </View>

        {/* Tip (the distilled readiness nudge) */}
        {tip && (
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        )}

        {/* Rule 8: educational estimate, defers to the prescriber -> Tier 2 */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>{t('today.fuel_disclaimer')}</Text>
        </DisclaimerBanner>
      </View>
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
      overflow: 'hidden',
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerLeft: {
      flex: 1,
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.75)',
    },
    headerHeadline: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginTop: 3,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
    },
    trustPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      borderRadius: radius.full,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    trustPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#ffffff',
    },
    readinessPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      borderRadius: radius.full,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    readinessDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#ffffff',
    },
    readinessPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#ffffff',
    },
    dialWrap: {
      alignItems: 'center',
    },
    body: {
      padding: spacing.lg,
    },
    proteinRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    proteinText: {
      flex: 1,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    proteinPct: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
    },
    proteinToGo: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 3,
      lineHeight: 18,
    },
    whyWrap: {
      marginTop: spacing.md,
    },
    whyToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
    },
    whyToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    whyChevron: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    whyChevronOpen: {
      transform: [{ rotate: '90deg' }],
    },
    whyLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      marginTop: spacing.sm,
      marginBottom: 4,
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
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    spotsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    tile: {
      flex: 1,
      backgroundColor: colors.gray50,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
    },
    tileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tileLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    tileValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginTop: 4,
    },
    tileValue: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    tileSub: {
      fontSize: 11,
      color: colors.textDisabled,
    },
    barBg: {
      height: 5,
      backgroundColor: colors.gray200,
      borderRadius: 99,
      marginTop: 8,
      overflow: 'hidden',
    },
    barFill: {
      height: 5,
      borderRadius: 99,
    },
    chevron: {
      fontSize: 16,
      color: colors.textDisabled,
    },
    dotsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 8,
    },
    microDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    microsCount: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 8,
    },
    microsEmpty: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      lineHeight: 16,
    },
    tipBox: {
      backgroundColor: colors.warningLight,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: spacing.md,
    },
    tipText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 18,
    },
    disclaimerText: {
      fontSize: 11,
      color: colors.textDisabled,
      lineHeight: 16,
    },
  });
}
