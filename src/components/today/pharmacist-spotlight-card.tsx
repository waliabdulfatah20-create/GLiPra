import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ContentCard } from '@/features/content-cards/data';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

export interface PharmacistSpotlightCardProps {
  card: ContentCard;
  onReadMore: () => void;
  phaseLabel?: string;
}

// Height of one ruled line — must match takeaway lineHeight exactly.
const LINE_HEIGHT = 28;
// Number of horizontal rules rendered behind the takeaway text.
const RULE_COUNT = 3;

export function PharmacistSpotlightCard({
  card,
  onReadMore,
  phaseLabel,
}: PharmacistSpotlightCardProps) {
  const { t } = useTranslation();
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  function handlePress() {
    haptics.tap();
    onReadMore();
  }

  return (
    // Outer View carries the shadow. Inner View clips gradient corners.
    // Splitting the two is the Android workaround: overflow:'hidden' kills elevation.
    <View style={styles.outer}>
      <View style={styles.inner}>

        {/* ── Gradient header ────────────────────────────────────── */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.rxGlyph}>℞</Text>
              <View>
                <Text style={styles.noteLabel}>
                  {t('today.pharmacist_note_label')}
                </Text>
                {phaseLabel != null && (
                  <Text style={styles.phaseLabel}>{phaseLabel}</Text>
                )}
              </View>
            </View>
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Body ───────────────────────────────────────────────── */}
        <View style={styles.body}>

          {/* Tier 1 clinical warning stripe — Rule 8 */}
          {card.tier === 1 && (
            <View style={styles.warningStripe}>
              <Text style={styles.warningText}>
                ⚠ Clinical note — read before injection
              </Text>
            </View>
          )}

          {/* Sig: label */}
          <Text style={styles.sigLabel}>Sig:</Text>

          {/* Key takeaway with ruled lines behind it */}
          <View style={styles.ruledContainer}>
            {Array.from({ length: RULE_COUNT }).map((_, i) => (
              <View
                key={i}
                style={[styles.rule, { top: LINE_HEIGHT * (i + 1) - 1 }]}
              />
            ))}
            <Text style={styles.takeaway}>{card.keyTakeaway}</Text>
          </View>

          {/* ── Footer: CTA + stamp ────────────────────────────── */}
          <View style={styles.footer}>
            <Pressable
              onPress={handlePress}
              style={({ pressed }) => pressed && styles.pressed}
              accessibilityRole="button"
              accessibilityLabel={`Read the full pharmacist note: ${card.title}`}
            >
              <Text style={styles.readMoreText}>
                {t('today.read_full_note')}
              </Text>
            </Pressable>

            {/* Rotated RPh credential stamp */}
            <View style={styles.stamp}>
              <Text style={styles.stampText}>✦ LICENSED RPh ✦</Text>
            </View>
          </View>

        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    // Outer: shadow only. Inner: clips rounded corners.
    outer: {
      marginBottom: spacing.sm,
      borderRadius: radius.lg,
      ...shadows.md,
    },
    inner: {
      borderRadius: radius.lg,
      overflow: 'hidden',
    },

    // ── Header ──────────────────────────────────────────────────
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    rxGlyph: {
      fontSize: 28,
      fontStyle: 'italic',
      color: '#ffffff',
      lineHeight: 32,
    },
    noteLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 2,
      color: 'rgba(255,255,255,0.70)',
    },
    phaseLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.92)',
      marginTop: 1,
    },
    rxBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.30)',
      borderRadius: 5,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    rxBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: 0.5,
    },

    // ── Body ────────────────────────────────────────────────────
    body: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },

    // Tier 1 warning stripe
    warningStripe: {
      backgroundColor: colors.warningLight,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      borderRadius: 3,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      marginBottom: spacing.sm,
    },
    warningText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.warning,
    },

    // Sig: label
    sigLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.2,
      marginBottom: spacing.xs,
    },

    // Ruled lines container
    ruledContainer: {
      position: 'relative',
      minHeight: LINE_HEIGHT * 2,
      overflow: 'hidden',
    },
    rule: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.border,
    },
    takeaway: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: LINE_HEIGHT,
    },

    // ── Footer ──────────────────────────────────────────────────
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
    },
    pressed: {
      opacity: 0.6,
    },
    readMoreText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    stamp: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 3,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      opacity: 0.65,
      transform: [{ rotate: '-2deg' }],
    },
    stampText: {
      fontSize: 7,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.2,
    },
  });
}
