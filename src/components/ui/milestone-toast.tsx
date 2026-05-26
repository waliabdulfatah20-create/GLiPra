/**
 * MilestoneToast — slide-in banner shown when a milestone unlocks.
 * Sits above the screen content (position: absolute), auto-dismisses after 3 s.
 * Uses the Direction B purple-blue gradient to match unlocked MilestoneCard.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { colors, spacing, radius, shadows, gradients } = useTheme();
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
    // Outer View: shadow carrier + absolute positioning.
    // iOS requires an opaque backgroundColor on the shadow-hosting View.
    <View
      style={styles.toastOuter}
      accessibilityRole="alert"
      accessibilityLabel={`Milestone unlocked: ${milestone.title}`}
    >
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.toastInner}
      >
        <Text style={styles.emoji}>{milestone.emoji}</Text>
        <View style={styles.textCol}>
          <Text style={styles.label}>Milestone Unlocked!</Text>
          <Text style={styles.title} numberOfLines={1}>
            {milestone.title}
          </Text>
        </View>
      </LinearGradient>
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
    // Outer wrapper: absolute positioning + shadow host (iOS needs opaque bg)
    toastOuter: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      right: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      zIndex: 1000,
      ...shadows.lg,
    },

    // Inner LinearGradient: visible face — clips gradient to rounded corners
    toastInner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.lg,
      overflow: 'hidden',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
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
      color: 'rgba(255,255,255,0.8)',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
}
