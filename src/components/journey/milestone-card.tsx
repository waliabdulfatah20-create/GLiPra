/**
 * MilestoneCard — shareable journey artifact card.
 * Displayed in the /journey screen grid. Designed to look great as a screenshot.
 *
 * Unlocked cards: Direction B purple-blue gradient (same hero gradient as Today
 * header and onboarding screens). Locked cards: muted gray placeholder.
 */

import type { Milestone } from '@/features/journey-cards/milestones';
import type { GlipraTokens } from '@/theme/tokens';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import * as React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MilestoneCardProps = {
  milestone: Milestone;
  unlockedAt: Date;
  isNew?: boolean;
};

// ---------------------------------------------------------------------------
// Unlocked card
// ---------------------------------------------------------------------------

export function MilestoneCard({ milestone, unlockedAt, isNew = false }: MilestoneCardProps) {
  const { colors, spacing, radius, shadows, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const unlockedDateStr = format(unlockedAt, 'MMM d, yyyy');

  return (
    // Outer View carries the shadow — iOS requires a non-transparent backgroundColor
    // on the shadow-hosting View. Inner LinearGradient clips with overflow:'hidden'.
    <View style={styles.cardOuter}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardInner}
      >
        {/* NEW badge */}
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        {/* Emoji */}
        <Text style={styles.emoji}>{milestone.emoji}</Text>

        {/* Text content */}
        <Text style={styles.title}>{milestone.title}</Text>
        <Text style={styles.subtitle}>{milestone.subtitle}</Text>

        {/* Footer */}
        <Text style={styles.unlockedDate}>
          Unlocked on
          {unlockedDateStr}
        </Text>

        {/* Share button */}
        <Pressable
          style={styles.shareBtn}
          onPress={() => Share.share({ message: milestone.shareText })}
          accessibilityRole="button"
          accessibilityLabel="Share this milestone"
        >
          <Text style={styles.shareBtnText}>Share</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Locked placeholder card (teaser for milestones not yet earned)
// ---------------------------------------------------------------------------

type LockedMilestoneCardProps = {
  title: string;
};

export function LockedMilestoneCard({ title }: LockedMilestoneCardProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

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

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    // Outer wrapper: shadow carrier (iOS needs opaque backgroundColor for shadows)
    cardOuter: {
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      ...shadows.md,
    },

    // Inner LinearGradient: the visible card face — clips gradient to rounded corners
    cardInner: {
      width: 280,
      minHeight: 180,
      borderRadius: radius.xl,
      overflow: 'hidden',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      position: 'relative',
    },

    // NEW badge — frosted glass pill on gradient bg
    newBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    newBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 0.5,
    },

    // Content — all white on gradient
    emoji: {
      fontSize: 48,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    unlockedDate: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      marginTop: 'auto',
      paddingTop: spacing.xs,
    },

    // Share button — frosted glass pill
    shareBtn: {
      marginTop: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    shareBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'center',
    },

    // Locked card — unchanged, muted gray
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
}
