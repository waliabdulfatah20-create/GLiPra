// N-option segmented control — same visual style as UnitToggle but supports
// any number of options and an onSelect(value) callback.

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';

interface SegmentedControlProps {
  options: string[];
  active: string;
  onSelect: (value: string) => void;
}

export function SegmentedControl({ options, active, onSelect }: SegmentedControlProps) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const isActive = opt === active;
        return (
          <Pressable
            key={opt}
            style={[styles.btn, isActive && styles.btnActive]}
            onPress={() => onSelect(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${opt} view`}
          >
            <Text style={[styles.btnText, isActive && styles.btnTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: colors.primary,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  btnTextActive: {
    color: colors.white,
  },
});
