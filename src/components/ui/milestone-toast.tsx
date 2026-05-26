/**
 * MilestoneToast — slide-in banner shown when a milestone unlocks.
 * Sits above the screen content (position: absolute), auto-dismisses after 3 s.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';
import type { Milestone } from '@/features/journey-cards/milestones';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MilestoneToastProps {
  /** The milestone to display. Pass null to hide the toast. */
  milestone: Milestone | null;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MilestoneToast({ milestone, onDismiss }: MilestoneToastProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Auto-dismiss after 3 seconds whenever a milestone is shown.
  React.useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [milestone, onDismiss]);

  if (!milestone) return null;

  return (
    <View
      style={styles.toast}
      accessibilityRole="alert"
      accessibilityLabel={`Milestone unlocked: ${milestone.title}`}
    >
      <Text style={styles.emoji}>{milestone.emoji}</Text>
      <View style={styles.textCol}>
        <Text style={styles.label}>Milestone Unlocked!</Text>
        <Text style={styles.title} numberOfLines={1}>
          {milestone.title}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      zIndex: 1000,
      ...shadows.lg,
    },
    emoji: {
      fontSize: 28,
      marginRight: spacing.sm,
    },
    textCol: {
      flex: 1,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
}
