import type { ContentCard } from '@/features/content-cards/data';
import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useTheme } from '@/lib/ThemeContext';

export type ContentCardSheetProps = {
  card: ContentCard | null;
  onClose: () => void;
};

function estimateReadMinutes(body: string): number {
  return Math.max(1, Math.round(body.length / 1000));
}

export function ContentCardSheet({ card, onClose }: ContentCardSheetProps) {
  const { t } = useTranslation();
  const { colors, gradients, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  if (!card)
    return null;

  const isWarning = card.tier === 1;
  const accentColor = isWarning ? colors.warning : colors.primary;
  const headerGradient = isWarning ? gradients.warning : gradients.hero;
  const readMinutes = estimateReadMinutes(card.body);

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
        {/* Gradient hero header — matches the carousel card language */}
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.pill}>
                <Text style={[styles.pillText, { color: accentColor }]}>
                  {t(`content_card.${card.cardType}`)}
                </Text>
              </View>
              <Text style={styles.readTime}>
                {readMinutes}
                {' '}
                {t('content_card.min')}
              </Text>
            </View>
            <View style={styles.rxPill}>
              <Text style={[styles.rxMark, { color: accentColor }]}>℞</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top disclaimer — tier-1 (clinical) cards carry a dual disclaimer,
              top AND bottom, per liability rule 4. Tier-2 keep bottom-only. */}
          {card.tier === 1 && (
            <View style={styles.topDisclaimer}>
              <DisclaimerBanner tier={1}>
                <Text style={styles.disclaimerText}>
                  {t('content_card.disclaimer')}
                </Text>
              </DisclaimerBanner>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{card.title}</Text>

          {/* Body */}
          <Text style={styles.body}>{card.body}</Text>

          {/* Bottom disclaimer (Rule 8 — required for all clinical cards) */}
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

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingBottom: spacing.xxl,
      maxHeight: '85%',
      overflow: 'hidden',
    },

    // ── Gradient header ──────────────────────────────────────────────────────
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      opacity: 0.5,
      alignSelf: 'center',
      marginBottom: spacing.md,
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
    rxPill: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rxMark: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.5,
      lineHeight: 24,
    },

    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },

    // ── Title + body ─────────────────────────────────────────────────────────
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
      lineHeight: 28,
      letterSpacing: -0.4,
    },
    body: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.md,
    },

    // ── Disclaimer ───────────────────────────────────────────────────────────
    topDisclaimer: {
      marginBottom: spacing.md,
    },
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
      marginHorizontal: spacing.lg,
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
}
