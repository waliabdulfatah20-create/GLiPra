/**
 * PharmacistTip — small advisory bubble rendered at the bottom of each
 * Progress card. Visually distinct from the chart so the pharmacist
 * credential reads as the value-add layer over raw data.
 *
 * Tone: warm-clinical. Copy lives in `progress.tips.*` i18n keys; this
 * component just renders whatever's passed in.
 *
 * The Rx badge ("Rx") signals "pharmacist note" without making any
 * personalized clinical claim — pairs with the Tier-2 disclaimer on the
 * screen.
 */

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface PharmacistTipProps {
  children: React.ReactNode;
}

export function PharmacistTip({ children }: PharmacistTipProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <View style={styles.container} accessibilityRole="text">
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Rx</Text>
      </View>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      marginTop: spacing.sm,
    },
    badge: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 1,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: 0.5,
    },
    body: {
      flex: 1,
      fontSize: 12,
      color: colors.primaryDark,
      lineHeight: 17,
    },
  });
}
