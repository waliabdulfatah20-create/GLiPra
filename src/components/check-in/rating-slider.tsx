import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface RatingSliderProps {
  label: string;
  value: number; // 1-5
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  emojis: [string, string, string, string, string];
}

export function RatingSlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  emojis,
}: RatingSliderProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.buttonRow}>
        {emojis.map((emoji, index) => {
          const ratingValue = index + 1;
          const isSelected = value === ratingValue;
          return (
            <Pressable
              key={ratingValue}
              style={({ pressed }) => [
                styles.emojiButton,
                isSelected && styles.emojiButtonSelected,
                pressed && !isSelected && styles.emojiButtonPressed,
              ]}
              onPress={() => { haptics.selection(); onChange(ratingValue); }}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${ratingValue} of 5`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={styles.emoji}>{emoji}</Text>
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

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

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
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    emojiButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.gray100,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiButtonSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    emojiButtonPressed: {
      backgroundColor: colors.gray200,
    },
    emoji: {
      fontSize: 26,
    },
    scaleLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    scaleLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
