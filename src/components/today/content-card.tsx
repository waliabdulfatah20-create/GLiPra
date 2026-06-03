import type { ContentCard } from '@/features/content-cards/data';
import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type ContentCardViewProps = {
  card: ContentCard;
  onPress?: (card: ContentCard) => void;
};

// Average adult reading speed ≈ 200 wpm. Average word ≈ 5 chars. So ~1000 chars/min.
// Floor at 1 minute so even short tips show a value.
function estimateReadMinutes(body: string): number {
  return Math.max(1, Math.round(body.length / 1000));
}

/**
 * Pharmacist content card — carousel tile rendered on the Today screen.
 *
 * Premium "gradient hero + quiet body" design:
 * - LinearGradient band across the top carries the tier color (hero purple for
 *   tier-2 education/tip, amber for tier-1 warning) and hosts the category
 *   pill + read-time microcopy + the Rx monogram (brand signature).
 * - Pure white body holds the title and body copy without any chrome competing
 *   with the band.
 * - Hairline divider + text-only "Read the full note →" link signals the tap
 *   target without filling the footer with a button slab.
 *
 * Tap → calls onPress(card) to open the ContentCardSheet for the full note.
 */
export function ContentCardView({ card, onPress }: ContentCardViewProps) {
  const { t } = useTranslation();
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const isWarning = card.tier === 1;
  const bandGradient = isWarning ? gradients.warning : gradients.hero;
  const accentColor = isWarning ? colors.warning : colors.primary;
  const readMinutes = React.useMemo(() => estimateReadMinutes(card.body), [card.body]);

  const handlePress = () => {
    if (!onPress)
      return;
    haptics.tap();
    onPress(card);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${t(`content_card.${card.cardType}`)}: ${card.title}`}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}
    >
      {/* ── Gradient band ────────────────────────────────────────────── */}
      <LinearGradient
        colors={[bandGradient[0], bandGradient[1], bandGradient[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.band}
      >
        <View style={styles.bandLeft}>
          <View style={styles.pill}>
            <Text style={[styles.pillText, { color: accentColor }]} numberOfLines={1}>
              {t(`content_card.${card.cardType}`)}
            </Text>
          </View>
          <Text style={styles.readTime}>
            {readMinutes}
            {' '}
            {t('content_card.min')}
          </Text>
        </View>
        <View style={styles.rxPill} accessibilityElementsHidden>
          <Text style={[styles.rxMark, { color: accentColor }]}>℞</Text>
        </View>
      </LinearGradient>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={3}>{card.title}</Text>
        <Text style={styles.bodyText} numberOfLines={4}>{card.body}</Text>

        {/* Tier-1 cards carry a Rule-8 disclaimer inline */}
        {isWarning && (
          <View style={styles.disclaimerWrap}>
            <DisclaimerBanner tier={1}>
              <Text style={styles.disclaimerText}>
                {t('content_card.disclaimer')}
              </Text>
            </DisclaimerBanner>
          </View>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        {onPress && (
          <>
            <View style={styles.divider} />
            <View style={styles.ctaRow}>
              <Text style={[styles.ctaText, { color: accentColor }]}>
                {t('content_card.read_full_note')}
              </Text>
              <Text style={[styles.ctaArrow, { color: accentColor }]}>→</Text>
            </View>
          </>
        )}
      </View>
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...shadows.md,
    },
    cardPressed: {
      opacity: 0.92,
    },

    // ── Gradient band ─────────────────────────────────────────────────
    band: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bandLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    pill: {
      backgroundColor: colors.surface,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 3,
    },
    pillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    readTime: {
      color: colors.surface,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
      opacity: 0.92,
    },

    // ── Rx monogram (brand mark) ──────────────────────────────────────
    rxPill: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rxMark: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.5,
      // Use system serif feel where possible. Native fallback: bold default font.
      lineHeight: 20,
    },

    // ── Body ──────────────────────────────────────────────────────────
    body: {
      padding: spacing.md,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 21,
      letterSpacing: -0.2,
      marginBottom: spacing.sm,
    },
    bodyText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },

    // ── Disclaimer (tier-1) ───────────────────────────────────────────
    disclaimerWrap: {
      marginTop: spacing.sm,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // ── Footer ────────────────────────────────────────────────────────
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginTop: spacing.md,
      marginHorizontal: -spacing.md, // full-bleed through card padding
      marginBottom: spacing.sm + 2,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ctaText: {
      fontSize: 12.5,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    ctaArrow: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
