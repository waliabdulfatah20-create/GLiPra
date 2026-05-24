/**
 * /journey — Journey Cards screen.
 * Shows all milestones the user has earned, plus locked teasers.
 * Not a visible tab — navigated to from the Today screen.
 */

import * as React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MilestoneCard, LockedMilestoneCard } from '@/components/journey/milestone-card';
import { useJourneyCards } from '@/features/journey-cards/hooks';
import { MILESTONES, type MilestoneId } from '@/features/journey-cards/milestones';
import { colors, radius, shadows, spacing } from '@/theme/colors';

// All milestone IDs in display order
const ALL_MILESTONE_IDS: MilestoneId[] = [
  'week_1_complete',
  'first_checkin',
  'protein_streak_7',
  'protein_streak_30',
  'weight_logged_10x',
  'injection_day_warrior',
  'coach_conversation',
  '3_months_strong',
];

// A card is "new" if it was unlocked in the past 24 hours
const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export default function JourneyScreen() {
  const { width } = useWindowDimensions();
  // Use 2-column grid when screen is wide enough (tablet / large phone landscape)
  const useTwoColumns = width >= 600;

  const { entries, unlockedIds, isLoading } = useJourneyCards();
  const now = Date.now();

  const unlockedSet = new Set(unlockedIds);

  const unlockedEntries = entries; // already sorted by unlocked_at ASC from API

  const lockedMilestones = ALL_MILESTONE_IDS.filter((id) => !unlockedSet.has(id));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.heading}>Your Journey</Text>
        <Text style={styles.subheading}>Milestones you've earned</Text>

        {/* Empty state */}
        {!isLoading && unlockedEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>Your journey has begun</Text>
            <Text style={styles.emptyBody}>
              Your first milestone is just around the corner. Keep logging!
            </Text>
          </View>
        )}

        {/* Unlocked milestone cards */}
        {unlockedEntries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>EARNED</Text>
            <View style={[styles.grid, useTwoColumns && styles.gridTwoCol]}>
              {unlockedEntries.map((entry) => {
                const milestone = MILESTONES[entry.milestoneId];
                if (!milestone) return null;
                const isNew = now - entry.unlockedAt.getTime() < NEW_THRESHOLD_MS;
                return (
                  <View
                    key={entry.milestoneId}
                    style={useTwoColumns ? styles.gridItemTwo : styles.gridItemOne}
                  >
                    <MilestoneCard
                      milestone={milestone}
                      unlockedAt={entry.unlockedAt}
                      isNew={isNew}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Locked / upcoming milestone teasers */}
        {lockedMilestones.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelLocked]}>
              UPCOMING
            </Text>
            <View style={[styles.grid, useTwoColumns && styles.gridTwoCol]}>
              {lockedMilestones.map((id) => {
                const milestone = MILESTONES[id];
                if (!milestone) return null;
                return (
                  <View
                    key={id}
                    style={useTwoColumns ? styles.gridItemTwo : styles.gridItemOne}
                  >
                    <LockedMilestoneCard title={milestone.title} />
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  backButton: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },

  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  sectionLabelLocked: {
    marginTop: spacing.xl,
    color: colors.gray400,
  },

  // Grid layout
  grid: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  gridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItemOne: {
    width: '100%',
  },
  gridItemTwo: {
    // Each item gets ~half the width minus half the gap
    flexBasis: '47%',
    flexGrow: 1,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
});
