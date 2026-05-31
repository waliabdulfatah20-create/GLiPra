// MealChipRow
// Horizontal scrollable chips for filtering Today's Log by meal time slot.
// Client-side only — no DB column, no migration needed.
// Time windows: Breakfast 5–11am | Lunch 11am–3pm | Dinner 3–9pm | Snack = rest
// Tapping an active chip clears the filter.

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type Props = {
  active: MealSlot | null;
  onSelect: (slot: MealSlot | null) => void;
};

const CHIPS: { slot: MealSlot; label: string }[] = [
  { slot: 'breakfast', label: 'Breakfast' },
  { slot: 'lunch', label: 'Lunch' },
  { slot: 'dinner', label: 'Dinner' },
  { slot: 'snack', label: 'Snack' },
];

export function MealChipRow({ active, onSelect }: Props) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  function handlePress(slot: MealSlot) {
    // Tapping the active chip clears the filter
    onSelect(active === slot ? null : slot);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CHIPS.map(({ slot, label }) => (
        <Pressable
          key={slot}
          style={[styles.chip, active === slot && styles.chipActive]}
          onPress={() => { haptics.tap(); handlePress(slot); }}
          accessibilityRole="button"
          accessibilityState={{ selected: active === slot }}
          accessibilityLabel={`${label} filter`}
        >
          <Text style={[styles.chipText, active === slot && styles.chipTextActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: colors.gray100,
      borderRadius: radius.full,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    chipActive: {
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.white,
    },
  });
}
