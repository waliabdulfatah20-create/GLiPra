// StepFooter — the onboarding footer action row. A primary button (Continue /
// Next) plus an optional secondary (Back). Consistent styling + disabled state
// across every screen. Render inside OnboardingScaffold's `footer` slot.

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

type StepFooterProps = {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function StepFooter({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
}: StepFooterProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={styles.row}>
      {secondaryLabel && onSecondary
        ? (
            <Pressable
              style={styles.secondary}
              onPress={() => { haptics.tap(); onSecondary(); }}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
            >
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </Pressable>
          )
        : null}
      <Pressable
        style={[
          styles.primary,
          secondaryLabel && onSecondary ? styles.primaryWithSecondary : styles.primaryFull,
          primaryDisabled && styles.primaryDisabled,
        ]}
        onPress={() => { if (!primaryDisabled) { haptics.medium(); onPrimary(); } }}
        disabled={primaryDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: primaryDisabled }}
        accessibilityLabel={primaryLabel}
      >
        <Text style={[styles.primaryText, primaryDisabled && styles.primaryTextDisabled]}>
          {primaryLabel}
        </Text>
      </Pressable>
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
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    secondary: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    primary: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    primaryFull: {
      flex: 1,
    },
    primaryWithSecondary: {
      flex: 2,
    },
    primaryDisabled: {
      backgroundColor: colors.gray200,
      ...({ shadowOpacity: 0, elevation: 0 }),
    },
    primaryText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: 0.2,
    },
    primaryTextDisabled: {
      color: colors.textDisabled,
    },
  });
}
