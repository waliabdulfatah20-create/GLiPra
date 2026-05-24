import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, shadows, spacing } from '@/theme/colors';

export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.flame}>🔥</Text>
        {currentStreak === 0 ? (
          <Text style={styles.emptyText}>{t('today.streak_empty')}</Text>
        ) : (
          <>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>{t('today.streak_day')}</Text>
          </>
        )}
      </View>
      <View style={styles.right}>
        <Text style={styles.bestLabel}>{t('today.streak_best')}</Text>
        <Text style={styles.bestValue}>{longestStreak}d</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flame: {
    fontSize: 32,
  },
  streakNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 44,
  },
  streakLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  bestLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bestValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
