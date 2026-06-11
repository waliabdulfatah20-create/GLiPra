// FoodSearchRow — Log-screen entry point for the seeded foods search (Cascade D).
// Compact action row (photo-row anatomy): icon circle + title/subtitle + chevron.
// Always free — zero AI cost.

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Search } from '@/components/ui/icons';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type FoodSearchRowProps = {
  onPress: () => void;
};

export function FoodSearchRow({ onPress }: FoodSearchRowProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.93 }]}
      onPress={() => { haptics.tap(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={t('log.search_row_title')}
    >
      <View style={styles.iconCircle}>
        <Search color={colors.primary} width={20} height={20} />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>{t('log.search_row_title')}</Text>
        <Text style={styles.subtitle}>{t('log.search_row_subtitle')}</Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      ...shadows.sm,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    chevron: {
      fontSize: 22,
      color: colors.textSecondary,
      marginLeft: 2,
    },
  });
}
