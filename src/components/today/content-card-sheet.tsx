import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import type { ContentCard } from '@/features/content-cards/data';
import { colors, radius, spacing } from '@/theme/colors';

export interface ContentCardSheetProps {
  card: ContentCard | null;
  onClose: () => void;
}

export function ContentCardSheet({ card, onClose }: ContentCardSheetProps) {
  const { t } = useTranslation();

  if (!card) return null;

  const accentColor = card.tier === 1 ? colors.warning : colors.primary;
  const badgeBg = card.tier === 1 ? colors.warningLight : colors.primaryLight;

  return (
    <Modal
      visible={card !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {/* Backdrop — tap to dismiss */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close pharmacist note"
      />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

          {/* Disclaimer (Rule 8 — required for all clinical cards) */}
          <DisclaimerBanner tier={card.tier}>
            <Text style={styles.disclaimerText}>
              {t('content_card.disclaimer')}
            </Text>
          </DisclaimerBanner>
        </ScrollView>

        {/* Close button */}
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close pharmacist note"
        >
          <Text style={styles.closeButtonText}>{t('common.close')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.gray300,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },

  // ── Badge ────────────────────────────────────────────────────────────────
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

  // ── Title + body ─────────────────────────────────────────────────────────
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 28,
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },

  // ── Disclaimer ───────────────────────────────────────────────────────────
  disclaimerText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Close button ─────────────────────────────────────────────────────────
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
