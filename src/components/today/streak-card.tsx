import { router } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { Bolt } from '@/components/ui/icons';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const hasStreak = currentStreak > 0;

  // Pop-in: scale 0.85 → 1.0 (spring) + opacity 0 → 1 on mount
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 280 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => { haptics.tap(); router.push('/log'); }}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={
          hasStreak
            ? `${currentStreak} day streak — view nutrition log`
            : 'Start your streak — open nutrition log'
        }
      >
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Bolt color={colors.warning} width={20} height={20} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.headline}>
              {hasStreak
                ? `🔥 ${currentStreak} ${t('today.streak_day')}`
                : t('today.streak_empty')}
            </Text>
            <View style={[styles.pill, hasStreak && styles.pillActive]}>
              <Text style={[styles.pillText, hasStreak && styles.pillTextActive]}>
                {hasStreak
                  ? `${t('today.streak_best')}: ${longestStreak}d`
                  : t('today.streak_start')}
              </Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderTopWidth: 2,
      borderTopColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.warningLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    headline: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    pill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    pillActive: {
      backgroundColor: colors.warningLight,
    },
    pillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    pillTextActive: {
      color: colors.warning,
    },
    chevron: {
      fontSize: 22,
      color: colors.textDisabled,
      fontWeight: '300',
    },
  });
}
