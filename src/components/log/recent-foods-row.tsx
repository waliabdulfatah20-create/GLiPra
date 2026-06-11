// RecentFoodsRow — horizontal one-tap quick-add bar on the Nutrition Log screen.
//
// Surfaces the user's most-eaten foods (frequency-ranked, recency tiebreak) so a
// repeat meal logs in a single tap with no AI call. This is the cheap, accurate
// front of the logging cascade: re-logging a staple never hits OpenAI.
//
// Renders nothing when there are no recent foods (fresh accounts see no clutter).

import type { RecentFood } from '@/features/food-log/recent-foods';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

type RecentFoodsRowProps = {
  items: RecentFood[];
  onRelog: (item: RecentFood) => void;
};

export function RecentFoodsRow({ items, onRelog }: RecentFoodsRowProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Brief "Added" confirmation on the tapped card. Keyed by food name so only
  // the tapped card flips; clears itself after a short beat.
  const [justLoggedKey, setJustLoggedKey] = React.useState<string | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current)
        clearTimeout(timerRef.current);
    };
  }, []);

  const handlePress = React.useCallback(
    (item: RecentFood) => {
      onRelog(item);
      setJustLoggedKey(item.key);
      if (timerRef.current)
        clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setJustLoggedKey(null), 1100);
    },
    [onRelog],
  );

  // Nothing to show — render nothing (no empty-state clutter).
  if (items.length === 0)
    return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('log.recents_title')}</Text>
      <FlatList
        data={items}
        keyExtractor={item => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const added = justLoggedKey === item.key;
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${t('log.recents_relog')} ${item.name}`}
            >
              <Text style={styles.cardName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.cardServing} numberOfLines={1}>
                {item.servingDescription}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.proteinPill}>
                  <Text style={styles.proteinPillText}>
                    {item.proteinG.toFixed(0)}
                    g
                  </Text>
                </View>
                <Text style={[styles.cta, added && styles.ctaAdded]}>
                  {added ? `✓ ${t('log.recents_logged')}` : `+ ${t('log.recents_relog')}`}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.md,
    },
    listContent: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    card: {
      width: 150,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      justifyContent: 'space-between',
      minHeight: 104,
      ...shadows.sm,
    },
    cardPressed: {
      opacity: 0.9,
    },
    cardName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    cardServing: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    proteinPill: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    proteinPillText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primary,
    },
    cta: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    ctaAdded: {
      color: colors.success,
    },
  });
}
