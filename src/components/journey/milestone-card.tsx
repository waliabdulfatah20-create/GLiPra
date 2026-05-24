/**
 * MilestoneCard — shareable journey artifact card.
 * Displayed in the /journey screen grid. Designed to look great as a screenshot.
 */

import * as React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';

import { colors, radius, shadows, spacing } from '@/theme/colors';
import type { Milestone } from '@/features/journey-cards/milestones';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MilestoneCardProps {
  milestone: Milestone;
  unlockedAt: Date;
  isNew?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MilestoneCard({ milestone, unlockedAt, isNew = false }: MilestoneCardProps) {
  const tintBg = `${milestone.accentColor}15`;
  const unlockedDateStr = format(unlockedAt, 'MMM d, yyyy');

  return (
    <View style={[styles.card, { backgroundColor: tintBg, borderLeftColor: milestone.accentColor }]}>
      {/* NEW badge */}
      {isNew && (
        <View style={[styles.newBadge, { backgroundColor: milestone.accentColor }]}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      )}

      {/* Emoji */}
      <Text style={styles.emoji}>{milestone.emoji}</Text>

      {/* Text content */}
      <Text style={styles.title}>{milestone.title}</Text>
      <Text style={styles.subtitle}>{milestone.subtitle}</Text>

      {/* Footer */}
      <Text style={styles.unlockedDate}>Unlocked on {unlockedDateStr}</Text>

      {/* Share button */}
      <Pressable
        style={styles.shareBtn}
        onPress={() => Share.share({ message: milestone.shareText })}
        accessibilityRole="button"
        accessibilityLabel="Share this milestone"
      >
        <Text style={styles.shareBtnText}>Share</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Locked placeholder card (teaser for milestones not yet earned)
// ---------------------------------------------------------------------------

interface LockedMilestoneCardProps {
  title: string;
}

export function LockedMilestoneCard({ title }: LockedMilestoneCardProps) {
  return (
    <View style={styles.lockedCard}>
      <Text style={styles.lockedEmoji}>🔒</Text>
      <Text style={styles.lockedTitle}>{title}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    width: 280,
    minHeight: 180,
    borderRadius: radius.xl,
    borderLeftWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
    ...shadows.md,
  },

  // NEW badge
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  // Content
  emoji: {
    fontSize: 48,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  unlockedDate: {
    fontSize: 11,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xs,
  },

  // Share button
  shareBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },

  // Locked card
  lockedCard: {
    width: 280,
    minHeight: 180,
    borderRadius: radius.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.gray300,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
    ...shadows.sm,
  },
  lockedEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
