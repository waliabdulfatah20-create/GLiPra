/**
 * CardShell — shared chrome for every Progress card.
 *
 * Visual: white surface, 3px colored top accent (per-metric), shadows.sm,
 * uppercase 11px section label, child content beneath. The PharmacistTip
 * is rendered separately by the consumer so layout decisions stay with
 * the card.
 */

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

type CardShellProps = {
  label: string;
  accentColor: string;
  children: React.ReactNode;
};

export function CardShell({ label, accentColor, children }: CardShellProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={[styles.card, { borderTopColor: accentColor }]}>
      <Text style={styles.label}>{label}</Text>
      {children}
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
      padding: spacing.md,
      borderTopWidth: 3,
      ...shadows.sm,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
  });
}
