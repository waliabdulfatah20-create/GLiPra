// MealIdeasCard — renders 2-3 AI-generated meal/snack ideas in the Coach tab.
// Rule 8: Tier-1 DisclaimerBanner (full visual weight) — these are educational
// ideas, NOT a meal plan or medical nutrition therapy.

import type { MealIdeasResult } from './context';
import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useTheme } from '@/lib/ThemeContext';

export function MealIdeasCard({ result }: { result: MealIdeasResult }) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={styles.card} accessibilityLabel={t('coach.meal_ideas_title')}>
      <Text style={styles.title}>{t('coach.meal_ideas_title')}</Text>

      {result.ideas.map((idea, i) => (
        <View key={`${idea.name}-${i}`} style={styles.idea}>
          <View style={styles.ideaHead}>
            <Text style={styles.ideaName}>{idea.name}</Text>
            <View style={styles.proteinPill}>
              <Text style={styles.proteinPillText}>
                {`~${Math.round(idea.approxProteinG)} ${t('coach.meal_ideas_protein_unit')}`}
              </Text>
            </View>
          </View>
          <Text style={styles.ideaDesc}>{idea.description}</Text>
        </View>
      ))}

      {result.note ? <Text style={styles.note}>{result.note}</Text> : null}

      <View style={styles.disclaimerWrap}>
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerText}>{t('coach.meal_ideas_disclaimer')}</Text>
        </DisclaimerBanner>
      </View>
    </View>
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
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.sm,
    },
    title: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textSecondary,
    },
    idea: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
      gap: 4,
    },
    ideaHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    ideaName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    proteinPill: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    proteinPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    ideaDesc: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    note: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    disclaimerWrap: {
      marginTop: spacing.xs,
    },
    disclaimerText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.disclaimerText,
    },
  });
}
