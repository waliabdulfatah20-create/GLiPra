// N-option segmented control — same visual style as UnitToggle but supports
// any number of options and an onSelect(value) callback.

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface SegmentedControlProps {
  options: string[];
  active: string;
  onSelect: (value: string) => void;
}

export function SegmentedControl({ options, active, onSelect }: SegmentedControlProps) {
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
            onPress={() => { haptics.selection(); onSelect(opt); }}
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

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

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
}
