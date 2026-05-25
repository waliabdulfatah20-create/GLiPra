import { router } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/lib/haptics';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  const { t } = useTranslation();
  const hasStreak = currentStreak > 0;

  return (
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
  );
}

const styles = StyleSheet.create({
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
