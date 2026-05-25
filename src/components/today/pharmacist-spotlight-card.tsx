import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ContentCard } from '@/features/content-cards/data';
import { haptics } from '@/lib/haptics';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export interface PharmacistSpotlightCardProps {
  card: ContentCard;
  onReadMore: () => void;
  phaseLabel?: string; // e.g. "For your peak suppression days"
}

export function PharmacistSpotlightCard({
  card,
  onReadMore,
  phaseLabel,
}: PharmacistSpotlightCardProps) {
  const { t } = useTranslation();

  function handlePress() {
    haptics.tap();
    onReadMore();
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {/* Rx badge */}
          <View style={styles.rxBadge}>
            <Text style={styles.rxBadgeText}>Rx</Text>
          </View>

          {/* Tier 1 warning icon */}
          {card.tier === 1 && (
            <Text style={styles.warningIcon}>⚠</Text>
          )}

          {/* "PHARMACIST'S NOTE" label */}
          <Text style={styles.noteLabel}>{t('today.pharmacist_note_label')}</Text>
        </View>

        {/* Phase pill (optional) */}
        {phaseLabel != null && (
          <View style={styles.phasePill}>
            <Text style={styles.phasePillText}>{phaseLabel}</Text>
          </View>
        )}
      </View>

      {/* Key takeaway */}
      <Text style={styles.takeaway} numberOfLines={2}>
        {card.keyTakeaway}
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Read more CTA */}
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.readMoreRow, pressed && styles.readMorePressed]}
        accessibilityRole="button"
        accessibilityLabel={`Read the full pharmacist note: ${card.title}`}
      >
        <Text style={styles.readMoreText}>{t('today.read_full_note')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },

  // ── Header row ───────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  rxBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  rxBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  warningIcon: {
    fontSize: 12,
    color: colors.warning,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Phase pill ───────────────────────────────────────────────────────────
  phasePill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginLeft: spacing.sm,
    flexShrink: 0,
  },
  phasePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.2,
  },

  // ── Key takeaway ─────────────────────────────────────────────────────────
  takeaway: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
    marginBottom: spacing.md,
  },

  // ── Divider ──────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },

  // ── Read more ────────────────────────────────────────────────────────────
  readMoreRow: {
    paddingTop: spacing.xs,
  },
  readMorePressed: {
    opacity: 0.6,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
