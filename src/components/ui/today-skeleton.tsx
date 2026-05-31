/**
 * TodaySkeleton — ghost layout shown while Today screen data loads.
 *
 * Mimics the shape of Today's actual content so the transition from
 * skeleton → real content is smooth and unsurprising. Replaces the
 * blank-screen ActivityIndicator.
 */

import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';

import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { useTheme } from '@/lib/ThemeContext';

export function TodaySkeleton() {
  const { colors, spacing, radius, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      {/* ── Gradient hero (matches heroGradient style) ── */}
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        {/* Ghost greeting text */}
        <SkeletonBox style={styles.ghostGreeting} />
        {/* Ghost date text */}
        <SkeletonBox style={styles.ghostDate} />
      </LinearGradient>

      {/* ── Content area (matches contentArea padding) ── */}
      <View style={styles.content}>

        {/* Readiness card ghost */}
        <SkeletonBox style={styles.readinessGhost} />

        {/* Metrics row ghost — two side-by-side cards */}
        <View style={styles.metricsRow}>
          <SkeletonBox style={styles.metricCard} />
          <SkeletonBox style={styles.metricCard} />
        </View>

        {/* Section label ghost */}
        <SkeletonBox style={styles.sectionLabel} />

        {/* Action card ghosts */}
        <SkeletonBox style={styles.actionCard} />
        <SkeletonBox style={styles.actionCard} />
        <SkeletonBox style={styles.actionCard} />
      </View>
    </ScrollView>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },

    // Hero — matches heroGradient in today-screen.tsx
    heroGradient: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl + spacing.sm,
    },
    // Ghost boxes on gradient need some opacity so they read against the dark bg
    ghostGreeting: {
      height: 28,
      width: '55%',
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
      opacity: 0.35,
    },
    ghostDate: {
      height: 14,
      width: '35%',
      borderRadius: radius.sm,
      opacity: 0.25,
    },

    // Content — matches contentArea padding
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },

    // Readiness ghost — approximates readinessCard height
    readinessGhost: {
      height: 200,
      borderRadius: radius.xl,
      marginBottom: spacing.md,
    },

    // Metrics row — two equal cards side by side
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    metricCard: {
      flex: 1,
      height: 180,
      borderRadius: radius.lg,
    },

    // Section label ghost
    sectionLabel: {
      height: 12,
      width: '35%',
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
    },

    // Action card ghosts — matches actionCard height (padding.md × 2 + icon 40px)
    actionCard: {
      height: 72,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    },
  });
}
