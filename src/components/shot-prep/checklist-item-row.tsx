import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ChecklistItem } from '@/features/shot-prep/checklist-data';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isChecked: boolean;
  onToggle: () => void;
}

export function ChecklistItemRow({
  item,
  isChecked,
  onToggle,
}: ChecklistItemRowProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}
      accessibilityLabel={item.title}
    >
      {/* Custom circle checkbox */}
      <View
        style={[
          styles.checkbox,
          isChecked && styles.checkboxChecked,
        ]}
      >
        {isChecked && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title row: optional pharmacist badge + title */}
        <View style={styles.titleRow}>
          {item.isPharmacistNote && (
            <View style={styles.pharmacistBadge}>
              <Text style={styles.pharmacistBadgeText}>Pharmacist note</Text>
            </View>
          )}
          <Text
            style={[
              styles.title,
              isChecked && styles.titleChecked,
            ]}
          >
            {item.title}
          </Text>
        </View>

        {/* Detail — collapsed when checked */}
        {!isChecked && (
          <Text style={styles.detail}>{item.detail}</Text>
        )}
      </View>
    </Pressable>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowPressed: {
      opacity: 0.7,
    },

    // Checkbox
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      borderWidth: 2,
      borderColor: colors.phaseInjectionDay,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      marginTop: 1,
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: colors.phaseInjectionDay,
      borderColor: colors.phaseInjectionDay,
    },
    checkmark: {
      color: colors.white,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 16,
    },

    // Content area
    content: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },

    // Pharmacist note pill badge
    pharmacistBadge: {
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    pharmacistBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    // Title
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    titleChecked: {
      textDecorationLine: 'line-through',
      color: colors.textDisabled,
      fontWeight: '400',
    },

    // Detail
    detail: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
}
