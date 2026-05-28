import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EwmaChart } from '@/components/weight/ewma-chart';
import { WeightEntryForm } from '@/components/weight/weight-entry-form';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { useInsertWeightLog, useDeleteWeightLog, useWeightLogs } from '@/features/weight/hooks';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { formatWeight, useWeightUnit } from '@/lib/unit-preference';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

export default function WeightScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { logs, isLoading } = useWeightLogs();
  const { mutate: insertLog, isLoading: isSaving, isSuccess } = useInsertWeightLog();
  const { mutate: deleteLog } = useDeleteWeightLog();
  const { unit: weightUnit, toggle: toggleWeightUnit } = useWeightUnit();

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const chartWidth = width - spacing.lg * 2;

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const recentLogs = [...logs].reverse().slice(0, 10);

  const handleDelete = React.useCallback(
    (id: string, displayWeight: string) => {
      Alert.alert(
        'Delete entry?',
        `Remove ${displayWeight} from your log? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteLog(id),
          },
        ],
      );
    },
    [deleteLog],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>{'‹ Back'}</Text>
          </Pressable>
          <Text style={styles.title}>Weight</Text>
          <UnitToggle
            options={['kg', 'lbs']}
            active={weightUnit}
            onToggle={toggleWeightUnit}
          />
        </View>

        {/* Latest weight summary card */}
        <View style={styles.summaryCard}>
          {isLoading ? (
            <>
              <SkeletonBox style={{ height: 12, width: '30%', marginBottom: spacing.sm }} />
              <SkeletonBox style={{ height: 56, width: '55%', marginBottom: spacing.xs }} />
              <SkeletonBox style={{ height: 12, width: '40%' }} />
            </>
          ) : latestLog ? (
            <>
              <Text style={styles.summaryLabel}>LATEST</Text>
              <Text style={styles.summaryValue}>
                {weightUnit === 'lbs'
                  ? `${(latestLog.weightKg * 2.20462).toFixed(1)}`
                  : latestLog.weightKg.toFixed(1)}
                <Text style={styles.summaryUnit}> {weightUnit}</Text>
              </Text>
              {latestLog.ewmaWeightKg != null && (
                <Text style={styles.trendText}>
                  Trend: {formatWeight(latestLog.ewmaWeightKg, weightUnit)}
                </Text>
              )}
              <Text style={styles.summaryDate}>
                {format(parseISO(latestLog.loggedAt), 'MMM d, yyyy')}
              </Text>
            </>
          ) : (
            <Text style={styles.noDataText}>No weight logged yet</Text>
          )}
        </View>

        {/* Log new weight */}
        <WeightEntryForm
          onSubmit={insertLog}
          isLoading={isSaving}
          lastWeightKg={latestLog?.weightKg}
          weightUnit={weightUnit}
        />

        {isSuccess && (
          <Text style={styles.successText}>Weight logged successfully</Text>
        )}

        {/* EWMA trend chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionLabel}>30-DAY TREND</Text>
          <EwmaChart logs={logs} width={chartWidth} height={200} />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.textSecondary }]} />
              <Text style={styles.legendText}>Raw weight</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Trend line</Text>
            </View>
          </View>
        </View>

        {/* Recent entries list */}
        {recentLogs.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.sectionLabel}>RECENT ENTRIES</Text>
            {recentLogs.map((log) => {
              const displayWeight = formatWeight(log.weightKg, weightUnit);
              return (
                <View key={log.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>
                    {format(parseISO(log.loggedAt), 'MMM d')}
                  </Text>
                  <Text style={styles.historyWeight}>{displayWeight}</Text>
                  {log.ewmaWeightKg != null && (
                    <Text style={styles.historyEwma}>
                      Trend: {formatWeight(log.ewmaWeightKg, weightUnit)}
                    </Text>
                  )}
                  <Pressable
                    onPress={() => handleDelete(log.id, displayWeight)}
                    style={styles.deleteButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${displayWeight} entry`}
                    hitSlop={8}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Rule 8: Tier-2 disclaimer on clinical screens */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            Weight tracking is for informational purposes. Body weight naturally
            fluctuates. Consult your prescriber or pharmacist with any concerns.
          </Text>
        </DisclaimerBanner>
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
      marginBottom: spacing.sm,
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
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },

    // Summary card
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      ...shadows.sm,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: spacing.xs,
    },
    summaryValue: {
      fontSize: 56,
      fontWeight: '800',
      color: colors.textPrimary,
      lineHeight: 64,
    },
    summaryUnit: {
      fontSize: 22,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    trendText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
      marginTop: spacing.xs,
    },
    summaryDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    noDataText: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    successText: {
      fontSize: 13,
      color: colors.success,
      textAlign: 'center',
      fontWeight: '500',
    },

    // Chart
    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
    },
    chartLegend: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendLine: {
      width: 16,
      height: 2,
      borderRadius: 1,
    },
    legendText: {
      fontSize: 11,
      color: colors.textSecondary,
    },

    // History list
    historyCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.md,
    },
    historyDate: {
      fontSize: 13,
      color: colors.textSecondary,
      width: 50,
    },
    historyWeight: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    historyEwma: {
      fontSize: 12,
      color: colors.primary,
    },
    deleteButton: {
      marginLeft: 'auto',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    deleteButtonText: {
      fontSize: 14,
      color: colors.textDisabled,
      fontWeight: '600',
    },

    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
