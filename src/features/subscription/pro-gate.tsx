import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Crown } from '@/components/ui/icons';
import { useTheme } from '@/lib/ThemeContext';

import { presentPaywall } from './present-paywall';
import { useSubscription } from './use-subscription';

type ProGateProps = {
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode;
};

export function ProGate({ children, featureName, fallback }: ProGateProps) {
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const { isPro, isLoading } = useSubscription();

  // Still loading — render children optimistically to avoid flash
  if (isLoading)
    return <>{children}</>;

  // Pro or mock dev mode — render feature as normal
  if (isPro)
    return <>{children}</>;

  // Non-Pro — show custom fallback or the default premium upgrade card
  if (fallback)
    return <>{fallback}</>;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerBand}
      >
        <View style={styles.headerLeft}>
          <View style={styles.crownChip}>
            <Crown color={colors.white} width={16} height={16} />
          </View>
          <Text style={styles.brandLabel}>GLIPRA PRO</Text>
        </View>
        <View style={styles.proPill}>
          <Text style={styles.proPillText}>PRO</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.featureLine}>
          {featureName}
          {' '}
          is available on GLiPra Pro
        </Text>
        <Text style={styles.price}>$9.99/month · $79.99/year</Text>
        <Pressable
          onPress={() => presentPaywall(featureName)}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to Pro"
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Unlock Pro</Text>
          </LinearGradient>
        </Pressable>
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
      ...shadows.sm,
    },
    headerBand: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    crownChip: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
      color: colors.white,
    },
    proPill: {
      backgroundColor: colors.white,
      borderRadius: radius.full,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    proPillText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    body: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    featureLine: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 22,
    },
    price: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    cta: {
      borderRadius: radius.md,
      overflow: 'hidden',
      marginTop: spacing.xs,
    },
    ctaPressed: {
      opacity: 0.9,
    },
    ctaGradient: {
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
    },
    ctaText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
