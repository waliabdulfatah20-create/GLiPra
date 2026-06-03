/**
 * AiPrivacyDisclaimerModal — one-time data & privacy disclosure shown
 * before the user's first AI scan (photo or voice).
 *
 * Visual matches the AnalyzingModal that opens right after — same
 * gradient hero palette, same surface tokens — so the flow
 *   [disclaimer modal] → [AnalyzingModal] → [AIReviewSheet]
 * feels like one continuous experience.
 *
 * Copy is em-dash-free per CLAUDE.md and goes through the same
 * attorney-review gate as `ai-coach` prompts before preview/production.
 */

import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

const OPENAI_API_POLICY_URL = 'https://openai.com/policies/api-data-usage-policies';

export type AiPrivacyDisclaimerModalProps = {
  visible: boolean;
  onAcknowledge: () => void;
  onCancel: () => void;
};

export function AiPrivacyDisclaimerModal({
  visible,
  onAcknowledge,
  onCancel,
}: AiPrivacyDisclaimerModalProps) {
  const { t } = useTranslation();
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const handleAcknowledge = () => {
    haptics.tap();
    onAcknowledge();
  };

  const handleCancel = () => {
    haptics.tap();
    onCancel();
  };

  const openGlipraPrivacy = () => router.push('/legal/privacy-policy');
  const openOpenAiPolicy = () => Linking.openURL(OPENAI_API_POLICY_URL);

  // Stable list of 4 numbered "what happens" bullets — pulled from i18n.
  const bullets = React.useMemo(
    () => [
      t('ai_privacy.bullet_1'),
      t('ai_privacy.bullet_2'),
      t('ai_privacy.bullet_3'),
      t('ai_privacy.bullet_4'),
    ],
    [t],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      accessibilityViewIsModal
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Gradient hero — matches AnalyzingModal for visual continuity */}
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{t('ai_privacy.eyebrow')}</Text>
            </View>
            <Text style={styles.heroTitle}>{t('ai_privacy.title')}</Text>
          </LinearGradient>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section: What happens when you scan */}
            <Text style={styles.sectionLabel}>{t('ai_privacy.section_what_happens')}</Text>
            <View style={styles.bulletList}>
              {bullets.map((text, i) => (
                <View
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  style={styles.bulletRow}
                >
                  <View style={styles.bulletNum}>
                    <Text style={styles.bulletNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.bulletText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Green "Data not used" trust callout */}
            <View style={styles.trustCallout}>
              <View style={[styles.trustIcon, { backgroundColor: colors.success }]}>
                <Text style={styles.trustIconText}>✓</Text>
              </View>
              <View style={styles.calloutBody}>
                <Text style={[styles.calloutTitle, { color: colors.success }]}>
                  {t('ai_privacy.trust_title')}
                </Text>
                <Text style={styles.calloutText}>
                  {t('ai_privacy.trust_body')}
                </Text>
              </View>
            </View>

            {/* Amber "Not medical advice" Rule-8 reminder */}
            <View style={styles.warningCallout}>
              <View style={[styles.trustIcon, { backgroundColor: colors.warning }]}>
                <Text style={styles.trustIconText}>!</Text>
              </View>
              <View style={styles.calloutBody}>
                <Text style={[styles.calloutTitle, { color: colors.warning }]}>
                  {t('ai_privacy.warning_title')}
                </Text>
                <Text style={styles.calloutText}>
                  {t('ai_privacy.warning_body')}
                </Text>
              </View>
            </View>

            {/* Privacy policy links */}
            <View style={styles.linkRow}>
              <Pressable
                onPress={openGlipraPrivacy}
                accessibilityRole="link"
                hitSlop={8}
              >
                <Text style={styles.linkText}>{t('ai_privacy.link_glipra')}</Text>
              </Pressable>
              <Text style={styles.linkSeparator}>•</Text>
              <Pressable
                onPress={openOpenAiPolicy}
                accessibilityRole="link"
                hitSlop={8}
              >
                <Text style={styles.linkText}>{t('ai_privacy.link_openai')}</Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
              onPress={handleAcknowledge}
              accessibilityRole="button"
              accessibilityLabel={t('ai_privacy.acknowledge')}
            >
              <Text style={styles.btnPrimaryText}>{t('ai_privacy.acknowledge')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={t('ai_privacy.cancel')}
            >
              <Text style={styles.btnSecondaryText}>{t('ai_privacy.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      overflow: 'hidden',
      maxHeight: '88%',
      ...shadows.lg,
    },

    // ── Hero ────────────────────────────────────────────────────────────────
    hero: {
      paddingTop: spacing.lg + 4,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'flex-start',
    },
    heroBadge: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      marginBottom: spacing.sm,
    },
    heroBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: colors.white,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
      lineHeight: 28,
    },

    // ── Scroll body ─────────────────────────────────────────────────────────
    scroll: {
      maxHeight: 460, // keeps the modal from filling the entire screen
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: spacing.sm + 2,
    },

    // ── Numbered bullet list ────────────────────────────────────────────────
    bulletList: {
      gap: spacing.sm + 4,
      marginBottom: spacing.md,
    },
    bulletRow: {
      flexDirection: 'row',
      gap: spacing.sm + 2,
    },
    bulletNum: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      flexShrink: 0,
    },
    bulletNumText: {
      color: colors.primaryDark,
      fontSize: 11,
      fontWeight: '800',
      lineHeight: 14,
    },
    bulletText: {
      flex: 1,
      fontSize: 13.5,
      color: colors.textPrimary,
      lineHeight: 19,
    },

    // ── Trust + warning callouts ────────────────────────────────────────────
    trustCallout: {
      flexDirection: 'row',
      gap: spacing.sm + 2,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.successLight,
      marginBottom: spacing.sm + 2,
    },
    warningCallout: {
      flexDirection: 'row',
      gap: spacing.sm + 2,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.warningLight,
      marginBottom: spacing.md,
    },
    trustIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
      flexShrink: 0,
    },
    trustIconText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 16,
    },
    calloutBody: {
      flex: 1,
      gap: 2,
    },
    calloutTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      letterSpacing: -0.1,
    },
    calloutText: {
      fontSize: 12.5,
      color: colors.textPrimary,
      lineHeight: 18,
    },

    // ── Privacy policy links ────────────────────────────────────────────────
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    linkText: {
      color: colors.primary,
      fontSize: 12.5,
      fontWeight: '700',
      textDecorationLine: 'underline',
      letterSpacing: -0.1,
    },
    linkSeparator: {
      color: colors.textDisabled,
      fontSize: 12,
    },

    // ── Footer ──────────────────────────────────────────────────────────────
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.sm + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    btnPrimary: {
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      ...shadows.sm,
    },
    btnPrimaryText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.1,
    },
    btnSecondary: {
      paddingVertical: 13,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    btnSecondaryText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    btnPressed: {
      opacity: 0.88,
    },
  });
}
