import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface StepProgressProps {
  current: number; // 1-based
  total: number;
  onDark?: boolean; // true when rendered on a dark/gradient background
}

export function StepProgress({ current, total, onDark }: StepProgressProps) {
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, onDark }),
    [colors, spacing, onDark],
  );
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
  onDark?: boolean;
}

function makeStyles({ colors, spacing, onDark }: StyleTokens) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: onDark ? 'transparent' : colors.surface,
      borderBottomWidth: onDark ? 0 : 1,
      borderBottomColor: onDark ? 'transparent' : colors.border,
    },
    row: {
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: 12,
      color: onDark ? 'rgba(255,255,255,0.75)' : colors.textSecondary,
      fontWeight: '500',
    },
    track: {
      height: 4,
      backgroundColor: onDark ? 'rgba(255,255,255,0.2)' : colors.gray200,
      borderRadius: 2,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: onDark ? 'rgba(255,255,255,0.9)' : colors.primary,
      borderRadius: 2,
    },
  });
}
