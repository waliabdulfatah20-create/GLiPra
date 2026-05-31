import type { ContentCard } from '@/features/content-cards/data';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useTheme } from '@/lib/ThemeContext';

export type ContentCardViewProps = {
  card: ContentCard;
};

export function ContentCardView({ card }: ContentCardViewProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );
  const accentColor = card.tier === 1 ? colors.warning : colors.primary;
  const badgeBg = card.tier === 1 ? colors.warningLight : colors.primaryLight;

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      {/* Type badge */}
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: accentColor }]}>
          {t(`content_card.${card.cardType}`)}
        </Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{card.title}</Text>

      {/* Body */}
      <Text style={styles.body}>{card.body}</Text>

      {/* Tier-1 disclaimer below body — clinical warning card */}
      {card.tier === 1 && (
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerText}>
            {t('content_card.disclaimer')}
          </Text>
        </DisclaimerBanner>
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
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderLeftWidth: 4,
    },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      marginBottom: spacing.sm,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      lineHeight: 20,
    },
    body: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
