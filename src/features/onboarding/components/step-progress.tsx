import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface StepProgressProps {
  current: number; // 1-based
  total: number;
}

export function StepProgress({ current, total }: StepProgressProps) {
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing }), [colors, spacing]);
  const progress = current / total;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>
          Step {current} of {total}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` as `${number}%` }]} />
      </View>
    </View>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
}

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    row: {
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    track: {
      height: 4,
      backgroundColor: colors.gray200,
      borderRadius: 2,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
  });
}
