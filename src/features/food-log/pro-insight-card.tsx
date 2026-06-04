/**
 * Pro Insight card — shown on the AI Review Sheet between the macro grid
 * and the Cancel / Log It buttons.
 *
 * Pro user: full card with a protein-floor headline and a phase-aware subline.
 * Free user: one-line teaser that opens the paywall.
 *
 * The card is suppressed entirely when:
 *   - The user has no protein floor yet (pre-onboarding)
 *   - medicationStatus === 'discontinued' (cycle nudges no longer apply)
 *   - Both consumed and meal protein are zero (no data yet)
 *
 * All copy goes through i18n. No em dashes (CLAUDE.md rule).
 * No medication advice in subline copy (CLAUDE.md Liability Rule 2).
 */

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDailyMacros } from '@/features/food-log/hooks';
import { composeInsight } from '@/features/food-log/pro-insight-helpers';
import { useSubscription } from '@/features/subscription/use-subscription';
import { useTodayData } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type ProInsightCardProps = {
  /** Protein in this meal (from the AI review form, live as the user edits). */
  mealProteinG: number;
};

function openPaywall() {
  try {
    const { RevenueCatUI } = require('react-native-purchases-ui');
    RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: 'GLiPra Pro',
    });
  }
  catch {
    // Native module not available in Expo Go — silent no-op.
  }
}

export function ProInsightCard({ mealProteinG }: ProInsightCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const { isPro } = useSubscription();
  const { proteinFloorG, profile, injectionCycle } = useTodayData();
  const { protein: proteinConsumedG } = useDailyMacros();

  // Cycle nudges no longer apply once the user has stopped GLP-1.
  if (profile?.medicationStatus === 'discontinued')
    return null;

  const insight = composeInsight({
    proteinConsumedG,
    mealProteinG,
    proteinFloorG: proteinFloorG > 0 ? proteinFloorG : null,
    phase: injectionCycle?.phase ?? null,
    daysSinceInjection: injectionCycle?.daysSinceInjection ?? null,
  });
  if (!insight)
    return null;

  if (!isPro) {
    return (
      <Pressable
        onPress={() => {
          haptics.tap();
          openPaywall();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('pro_insight.teaser')}
        style={({ pressed }) => [styles.teaser, pressed && styles.teaserPressed]}
      >
        <View style={styles.teaserLeft}>
          <View style={styles.teaserDot} />
          <Text style={styles.teaserText} numberOfLines={2}>
            {t('pro_insight.teaser')}
          </Text>
        </View>
        <Text style={styles.teaserChev}>›</Text>
      </Pressable>
    );
  }

  const headline = t(`pro_insight.${insight.headlineKey}`, insight.headlineVars);
  const subline = insight.sublineKey
    ? t(`pro_insight.${insight.sublineKey}`, insight.sublineVars)
    : null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.cardHead}>
        <View style={styles.cardDot} />
        <Text style={styles.cardLabel}>{t('pro_insight.label')}</Text>
      </View>
      <Text style={styles.cardHeadline}>{headline}</Text>
      {subline && (
        <Text style={styles.cardSubline}>{subline}</Text>
      )}
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
    // ── Pro variant: full insight card ────────────────────────────────────────
    card: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryLight,
      borderTopWidth: 2,
      borderTopColor: colors.primary,
    },
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    cardDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    cardLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.primaryDark,
      textTransform: 'uppercase',
    },
    cardHeadline: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryDark,
      lineHeight: 21,
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    cardSubline: {
      fontSize: 12.5,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // ── Free variant: paywall teaser ──────────────────────────────────────────
    teaser: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryLight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    teaserPressed: { opacity: 0.85 },
    teaserLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    teaserDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    teaserText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryDark,
      lineHeight: 18,
    },
    teaserChev: {
      fontSize: 20,
      fontWeight: '300',
      color: colors.primary,
    },
  });
}
