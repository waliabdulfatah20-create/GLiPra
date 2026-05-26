import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

// ─── SettingsSection ─────────────────────────────────────────────────────────
// Replaces the Obytes SettingsContainer (which used NativeWind className).
// Renders a labelled card group matching the app's StyleSheet-only design system.

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={styles.wrapper}>
      {title !== undefined && (
        <Text style={styles.sectionTitle}>{title}</Text>
      )}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

// Keep old name exported so any other files that import SettingsContainer
// don't break immediately.
export { SettingsSection as SettingsContainer };

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
      marginLeft: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
  });
}
