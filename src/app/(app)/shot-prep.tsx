import { router } from 'expo-router';
import { format } from 'date-fns';
import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { ChecklistItemRow } from '@/components/shot-prep/checklist-item-row';
import { CHECKLIST_ITEMS } from '@/features/shot-prep/checklist-data';
import { useShotDayPrep } from '@/features/shot-prep/hooks';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

/** Use today's date as the injection date key so the checklist resets daily. */
function todayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export default function ShotPrepScreen() {
  const injectionDate = todayDateString();
  const { completedItems, completedCount, totalCount, isDone, toggleItem } =
    useShotDayPrep(injectionDate);

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows]
  );

  const progressFraction = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>💉</Text>
          <Text style={styles.headerTitle}>Shot Day Prep</Text>
          <Text style={styles.headerSubtitle}>Your injection day checklist</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            {completedCount}/{totalCount} items
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progressFraction * 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Rule 8: Tier-2 disclaimer */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            This checklist is for general preparation guidance only. Always
            follow your prescriber's specific instructions for your medication.
          </Text>
        </DisclaimerBanner>

        {/* Checklist items */}
        <View style={styles.listCard}>
          {CHECKLIST_ITEMS.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              isChecked={completedItems.includes(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </View>

        {/* Injection site tracker CTA */}
        <TouchableOpacity
          style={styles.siteTrackerRow}
          onPress={() => router.push('/injection-sites')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open injection site tracker"
        >
          <View style={styles.siteTrackerLeft}>
            <Text style={styles.siteTrackerTitle}>Injection Site Tracker</Text>
            <Text style={styles.siteTrackerBody}>Log where you injected today</Text>
          </View>
          <Text style={styles.siteTrackerChevron}>›</Text>
        </TouchableOpacity>

        {/* Completion banner */}
        {isDone && (
          <View style={styles.completionBanner}>
            <Text style={styles.completionText}>
              You're ready for your injection!
            </Text>
          </View>
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
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    // Back button
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: spacing.md,
    },
    backButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },

    // Header
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    headerIcon: {
      fontSize: 40,
      marginBottom: spacing.sm,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Progress
    progressSection: {
      marginBottom: spacing.md,
    },
    progressLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.gray200,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.phaseInjectionDay,
      borderRadius: radius.full,
    },

    // Disclaimer text child
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // Checklist card
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      marginTop: spacing.md,
      ...shadows.sm,
    },

    // Injection site tracker row
    siteTrackerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      ...shadows.sm,
    },
    siteTrackerLeft: { flex: 1 },
    siteTrackerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    siteTrackerBody: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    siteTrackerChevron: {
      fontSize: 22,
      color: colors.phaseInjectionDay,
      fontWeight: '300',
    },

    // Completion banner
    completionBanner: {
      marginTop: spacing.lg,
      backgroundColor: colors.phaseInjectionDay,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      ...shadows.md,
    },
    completionText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
      textAlign: 'center',
    },
  });
}
