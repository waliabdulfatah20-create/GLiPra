import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme/colors';

// ─── SettingsRow ──────────────────────────────────────────────────────────────
// Replaces the Obytes SettingsItem (which used NativeWind className).
// A single pressable row inside a SettingsSection card.

interface SettingsRowProps {
  label: string;
  /** Static value displayed on the right (e.g. version number). */
  value?: string;
  /** Navigation or action handler. Omit for non-interactive info rows. */
  onPress?: () => void;
  /** Renders label in error red — used for destructive actions like Sign Out. */
  destructive?: boolean;
  /** Suppresses the bottom separator on the last row in a section. */
  isLast?: boolean;
}

export function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
  isLast = false,
}: SettingsRowProps) {
  const isPressable = onPress !== undefined;

  return (
    <Pressable
      onPress={() => { if (isPressable) { haptics.tap(); onPress?.(); } }}
      disabled={!isPressable}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && isPressable && styles.rowPressed,
      ]}
      accessibilityRole={isPressable ? 'button' : 'text'}
      accessibilityLabel={label}
    >
      <Text style={[styles.label, destructive && styles.labelDestructive]}>
        {label}
      </Text>
      <View style={styles.right}>
        {value !== undefined && (
          <Text style={styles.value}>{value}</Text>
        )}
        {isPressable && value === undefined && (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </Pressable>
  );
}

// Keep old name exported for backward compatibility.
export { SettingsRow as SettingsItem };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.gray50,
  },
  label: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  labelDestructive: {
    color: colors.error,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 22,
    color: colors.gray300,
    lineHeight: 26,
  },
});
