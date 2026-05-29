import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LevelChart } from '@/components/medication-level/level-chart';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { PhaseBadge } from '@/components/today/phase-badge';
import { generateSteadyStateCurve } from '@/features/medication-level/calculator';
import { useMedicationLevelCurve } from '@/features/medication-level/hooks';
import { useTodayData } from '@/features/today/hooks';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';
import type { GLP1MedicationId } from '@/types';

const MEDICATION_DISPLAY_NAMES: Record<GLP1MedicationId, string> = {
  semaglutide_ozempic: 'Ozempic',
  semaglutide_wegovy: 'Wegovy',
  tirzepatide_mounjaro: 'Mounjaro',
  tirzepatide_zepbound: 'Zepbound',
  liraglutide_saxenda: 'Saxenda',
  liraglutide_victoza: 'Victoza',
  dulaglutide_trulicity: 'Trulicity',
  compounded_semaglutide: 'Compounded Semaglutide',
  compounded_tirzepatide: 'Compounded Tirzepatide',
  compounded_glp1_gip: 'Compounded GLP-1/GIP',
};

function formatFrequency(days: number): string {
  if (days === 1) return 'daily';
  if (days === 7) return 'weekly';
  if (days === 14) return 'biweekly';
  return `every ${days} days`;
}

type ViewRange = '7D' | '30D';

const VIEW_RANGES: ViewRange[] = ['7D', '30D'];

const VIEW_CONFIG: Record<ViewRange, {
  pastDays: number;
  projectDays: number;
  labelIntervalDays: number;
}> = {
  '7D':  { pastDays: 3,  projectDays: 7,  labelIntervalDays: 2 },
  '30D': { pastDays: 30, projectDays: 14, labelIntervalDays: 7 },
};

export default function MedicationLevelScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { profile, isLoading: profileLoading, injectionCycle } = useTodayData();
  const {
    curve,
    todayOffset,
    isLoading: curveLoading,
    medicationId,
    doseMg,
    injectionIntervalDays,
    lastInjectionDate,
    injectionDates,
  } = useMedicationLevelCurve();

  const isLoading = profileLoading || curveLoading;

  const [viewRange, setViewRange] = React.useState<ViewRange>('30D');

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows]
  );

  const chartWidth = width - spacing.lg * 2 - spacing.md * 2;
  const config = VIEW_CONFIG[viewRange];

  const today = format(new Date(), 'yyyy-MM-dd');

  // Recompute the visible curve whenever the view range changes.
  // lastInjectionDate comes from real injection logs (via useMedicationLevelCurve),
  // not from the profiles table, so it always reflects the actual last shot.
  const displayCurve = React.useMemo(() => {
    if (!lastInjectionDate) return null;
    const med = (medicationId ?? profile?.medicationId ?? 'semaglutide_ozempic') as GLP1MedicationId;
    const dose = doseMg ?? 1.0;

    // Anchor the past window to actual injection history so the chart doesn't
    // show synthetic pre-history peaks before the user's first logged shot.
    // Start 7 days before the oldest logged injection (visual breathing room),
    // capped at config.pastDays so the toggle still controls the max window.
    let effectivePastDays = config.pastDays;
    if (injectionDates.length > 0) {
      const oldestDate = injectionDates[injectionDates.length - 1]; // least recent
      const daysSinceOldest = differenceInCalendarDays(parseISO(today), parseISO(oldestDate));
      effectivePastDays = Math.min(config.pastDays, daysSinceOldest + 7);
    }

    return generateSteadyStateCurve(
      dose,
      med,
      lastInjectionDate,
      injectionIntervalDays,
      today,
      config.projectDays,
      effectivePastDays,
      injectionDates,   // actual logged dates; no phantom history
    );
  }, [lastInjectionDate, medicationId, profile?.medicationId, doseMg, injectionIntervalDays, injectionDates, today, config]);

  const displayTodayOffset = displayCurve?.find((p) => p.date === today)?.dayOffset ?? 0;
  // Derive current level from displayCurve (which falls back to doseMg ?? 1.0),
  // so the card always renders when the chart renders.
  const currentLevelMg = displayCurve?.find((p) => p.date === today)?.levelMg ?? null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  const hasData = !!lastInjectionDate;
  const medId = medicationId ?? ((profile?.medicationId ?? 'semaglutide_ozempic') as GLP1MedicationId);
  const medName = MEDICATION_DISPLAY_NAMES[medId] ?? 'GLP-1 Medication';
  const doseLabel = doseMg ? `${doseMg}mg` : '-';
  const freqLabel = formatFrequency(injectionIntervalDays);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>{'‹ Back'}</Text>
          </Pressable>
          <Text style={styles.title}>Medication Level Estimator</Text>
          <View style={styles.backButton} />
        </View>

        {!hasData ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No medication data</Text>
            <Text style={styles.emptyBody}>
              Set up your medication in Settings to see your level chart.
            </Text>
          </View>
        ) : (
          <>
            {/* Medication + dose badge */}
            <View style={styles.medicationBadgeRow}>
              <View style={styles.medicationBadge}>
                <Text style={styles.medicationBadgeText}>
                  {medName} · {doseLabel} {freqLabel}
                </Text>
              </View>
            </View>

            {/* Chart card */}
            <View style={styles.chartCard}>
              <View style={styles.chartCardHeader}>
                <Text style={styles.chartCardTitle}>CONCENTRATION CURVE</Text>
              </View>
              <View style={styles.chartRangeRow}>
                <SegmentedControl
                  options={VIEW_RANGES}
                  active={viewRange}
                  onSelect={(v) => setViewRange(v as ViewRange)}
                />
              </View>
              {displayCurve ? (
                <LevelChart
                  curve={displayCurve}
                  todayOffset={displayTodayOffset}
                  injectionDates={injectionDates}
                  labelIntervalDays={config.labelIntervalDays}
                  width={chartWidth}
                  height={220}
                />
              ) : (
                <View style={[styles.emptyChart, { width: chartWidth, height: 220 }]}>
                  <Text style={styles.emptyChartText}>Not enough data</Text>
                </View>
              )}
            </View>

            {/* Current level summary card */}
            {currentLevelMg !== null && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>ESTIMATED IN SYSTEM</Text>
                <Text style={styles.summaryValue}>
                  ~{currentLevelMg.toFixed(1)}mg
                </Text>
              </View>
            )}

            {/* Rule 8: Tier-1 DisclaimerBanner — locked copy */}
            <DisclaimerBanner tier={1}>
              <Text style={styles.disclaimerText}>
                Estimated based on half-life. Actual levels vary by individual
                metabolism, body composition, and other factors. Not a substitute
                for serum drug level testing.
              </Text>
            </DisclaimerBanner>

            {/* Phase context */}
            {injectionCycle && (
              <View style={styles.phaseCard}>
                <Text style={styles.phaseLabel}>CURRENT PHASE</Text>
                <PhaseBadge
                  phase={injectionCycle.phase}
                  daysSinceInjection={injectionCycle.daysSinceInjection}
                />
              </View>
            )}

            {/* Bottom disclaimer — Rule 8 footer */}
            <DisclaimerBanner tier={1}>
              <Text style={styles.disclaimerText}>
                Estimated based on half-life. Actual levels vary by individual
                metabolism, body composition, and other factors. Not a substitute
                for serum drug level testing.
              </Text>
            </DisclaimerBanner>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loader: {
      flex: 1,
      alignSelf: 'center',
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    backButton: {
      width: 60,
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      flex: 1,
    },

    // Empty state
    emptyState: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      ...shadows.sm,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    emptyBody: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Medication badge
    medicationBadgeRow: {
      alignItems: 'flex-start',
    },
    medicationBadge: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    medicationBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryDark,
    },

    // Chart card
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    chartCardHeader: {
      marginBottom: spacing.xs,
    },
    chartCardTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
    },
    chartRangeRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: spacing.sm,
    },
    emptyChart: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyChartText: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    // Summary card
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      ...shadows.md,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: spacing.xs,
    },
    summaryValue: {
      fontSize: 48,
      fontWeight: '800',
      color: colors.textPrimary,
      lineHeight: 56,
    },

    // Phase card
    phaseCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    phaseLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
    },

    // Disclaimer
    disclaimerText: {
      fontSize: 12,
      color: colors.disclaimerText,
      lineHeight: 18,
    },
  });
}
