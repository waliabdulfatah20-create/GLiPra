// Compact 2-option segmented toggle for unit selection (kg/lbs, cm/ft·in).
// Active option: primary background + white text.
// Inactive option: bordered + secondary text.

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

type UnitToggleProps = {
  options: [string, string];
  active: string;
  onToggle: () => void;
};

export function UnitToggle({ options, active, onToggle }: UnitToggleProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const isActive = opt === active;
        return (
          <Pressable
            key={opt}
            style={[styles.btn, isActive && styles.btnActive]}
            onPress={() => { haptics.selection(); onToggle(); }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${opt} unit`}
          >
            <Text style={[styles.btnText, isActive && styles.btnTextActive]}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
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
    row: {
      flexDirection: 'row',
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    btn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 36,
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
}
