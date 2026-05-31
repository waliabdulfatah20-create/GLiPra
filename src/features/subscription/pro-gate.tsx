import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

import { useSubscription } from './use-subscription';

type ProGateProps = {
  children: React.ReactNode;
  featureName: string;
  fallback?: React.ReactNode;
};

export function ProGate({ children, featureName, fallback }: ProGateProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );
  const { isPro, isLoading } = useSubscription();

  // Still loading — render children optimistically to avoid flash
  if (isLoading)
    return <>{children}</>;

  // Pro or mock dev mode — render feature as normal
  if (isPro)
    return <>{children}</>;

  // Non-Pro — show custom fallback or default paywall card
  if (fallback)
    return <>{fallback}</>;

  return (
    <View style={styles.card}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.title}>Pro Feature</Text>
      <Text style={styles.body}>
        {featureName}
        {' '}
        is available on Glipra Pro
      </Text>
      <Text style={styles.price}>$9.99/month · $79.99/year</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { RevenueCatUI } = require('react-native-purchases-ui');
            RevenueCatUI.presentPaywallIfNeeded({
              requiredEntitlementIdentifier: 'GLiPra Pro',
            });
          }
          catch {
            // Native module not available in Expo Go — silent no-op
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Upgrade to Pro"
      >
        <Text style={styles.buttonText}>Upgrade to Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    lock: {
      fontSize: 32,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    body: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    price: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.xl,
      marginTop: spacing.xs,
    },
    buttonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
