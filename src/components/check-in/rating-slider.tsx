// RatingSlider — a 1-5 self-report scale rendered as a row of 5 tappable segments
// whose bar heights ascend with the level (signal-strength metaphor). Emoji-free,
// premium, dark-mode safe. The selected segment is highlighted and its bar is tinted
// by a gentle semantic ramp via the `tone` prop (severity = green->red, positive =
// amber->green); unselected bars stay a calm gray.

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type RatingTone = 'severity' | 'positive';

type RatingSliderProps = {
  label: string;
  value: number; // 1-5
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  /** Tints the selected bar. 'severity' (green->red) for nausea, 'positive' (amber->green) for energy. */
  tone?: RatingTone;
};

// Bar height per level (1-5), ascending.
const BAR_HEIGHTS = [10, 16, 22, 28, 34] as const;

function barColor(level: number, tone: RatingTone | undefined, colors: GlipraTokens['colors']): string {
  if (tone === 'severity')
    return level <= 2 ? colors.success : level === 3 ? colors.warning : colors.error;
  if (tone === 'positive')
    return level <= 2 ? colors.warning : level === 3 ? colors.primary : colors.success;
  return colors.primary;
}

export function RatingSlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  tone,
}: RatingSliderProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        {BAR_HEIGHTS.map((height, index) => {
          const ratingValue = index + 1;
          const isSelected = value === ratingValue;
          return (
            <Pressable
              key={ratingValue}
              style={({ pressed }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                pressed && !isSelected && styles.cellPressed,
              ]}
              onPress={() => { haptics.selection(); onChange(ratingValue); }}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${ratingValue} of 5`}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isSelected
                      ? barColor(ratingValue, tone, colors)
                      : colors.gray300,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>{lowLabel}</Text>
        <Text style={styles.scaleLabel}>{highLabel}</Text>
      </View>
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
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.xs + 2,
    },
    cell: {
      flex: 1,
      height: 52,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: spacing.sm + 1,
      borderRadius: radius.md,
      backgroundColor: colors.gray100,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    cellSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    cellPressed: {
      backgroundColor: colors.gray200,
    },
    bar: {
      width: 10,
      borderRadius: 3,
    },
    scaleLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs + 2,
    },
    scaleLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
