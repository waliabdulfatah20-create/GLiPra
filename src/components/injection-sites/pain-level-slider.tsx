import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/colors';

interface PainLevelSliderProps {
  /** Integer 0–10 */
  value: number;
  onChange: (value: number) => void;
}

const VALUES = Array.from({ length: 11 }, (_, i) => i); // 0..10

/**
 * Horizontal pain-level scale, 0–10.
 *
 * Visual matches the reference Add Shot form: a label on the left,
 * a row of 11 small pressable dots in the middle (active = filled brand
 * color, inactive = outlined), and the current numeric value on the right.
 *
 * Pattern adapted from `src/components/check-in/rating-slider.tsx` (the
 * existing emoji-based 1–5 scale) but extended to 0–10 and using compact
 * dots instead of full-width emoji buttons.
 */
export function PainLevelSlider({ value, onChange }: PainLevelSliderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pain Level</Text>
      <View style={styles.dotsRow}>
        {VALUES.map((v) => {
          const isActive = value === v;
          return (
            <Pressable
              key={v}
              onPress={() => onChange(v)}
              style={[styles.dot, isActive && styles.dotActive]}
              accessibilityRole="adjustable"
              accessibilityLabel={`Pain level ${v}`}
              accessibilityValue={{ min: 0, max: 10, now: value }}
              hitSlop={8}
            />
          );
        })}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 84,
  },
  dotsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dotActive: {
    width: 12,
    height: 12,
    backgroundColor: colors.primary,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'right',
  },
});
