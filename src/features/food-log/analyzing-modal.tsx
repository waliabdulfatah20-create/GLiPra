/**
 * AnalyzingModal — full-screen loading modal shown between Photo/Voice button
 * press and the AIReviewSheet open. Replaces the previous inline spinner.
 *
 * - Gradient hero header (purple→blue→teal for photo, dark for voice) with a
 *   captured-image thumbnail or animated waveform glyph
 * - 5-stage vertical checklist that ticks down at adaptive cadence
 * - Slow-connection hint after ~8s stuck on the last stage
 * - Error block + retry button when the call rejects
 * - Cancel button that aborts the in-flight call via AbortSignal
 *
 * Visual language matches the new content-card / Pro Insight design:
 * brand-purple, cream pills inside the gradient, no em dashes anywhere.
 */

import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

import { type AnalyzingSource, type StageKey } from './analyzing-stages';
import { useAnalyzingStages } from './use-analyzing-stages';

export type AnalyzingModalProps = {
  /** Whether the modal is visible at all. */
  visible: boolean;
  /** photo vs voice — drives gradient palette + stage labels + thumb content. */
  source: AnalyzingSource;
  /** True while the recognize/transcribe call is in flight. */
  isLoading: boolean;
  /** True if the call resolved (used to drain remaining stages). */
  hasResult: boolean;
  /** Error message if the call failed; non-null triggers error UI. */
  error: string | null;
  /** Base64 data URI for the photo thumb (photo source only). */
  imageBase64?: string | null;
  /** Mime type to build the data URI. */
  imageMimeType?: string | null;
  /** Whisper transcript snippet (voice source, populated when transcribing finishes). */
  transcript?: string | null;
  /** User taps Cancel — aborts the call and closes. */
  onCancel: () => void;
  /** User taps Try again in the error state. */
  onRetry?: () => void;
  /** Modal can self-close once the success drain completes. */
  onComplete?: () => void;
};

export function AnalyzingModal({
  visible,
  source,
  isLoading,
  hasResult,
  error,
  imageBase64,
  imageMimeType,
  transcript,
  onCancel,
  onRetry,
  onComplete,
}: AnalyzingModalProps) {
  const { t } = useTranslation();
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const { stages, activeIndex, isComplete, showSlowHint } = useAnalyzingStages({
    source,
    isLoading,
    hasResult,
    hasError: error != null,
  });

  // When isComplete flips true, fire onComplete (parent closes modal + opens
  // AIReviewSheet). Brief delay lets the green-check pulse render.
  React.useEffect(() => {
    if (isComplete && hasResult && onComplete) {
      const timer = setTimeout(onComplete, 350);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasResult, onComplete]);

  const isVoice = source === 'voice';
  const heroGradient = isVoice
    // Always-dark for voice — matches the existing voice-hero card
    ? (['#1e1b4b', '#312e81', '#1e3a8a'] as const)
    : gradients.hero;

  const imageUri = imageBase64 && imageMimeType
    ? `data:${imageMimeType};base64,${imageBase64}`
    : null;

  const handleCancel = () => {
    haptics.tap();
    onCancel();
  };

  const handleRetry = () => {
    if (!onRetry)
      return;
    haptics.tap();
    onRetry();
  };

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
          {/* Gradient hero */}
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.thumb}>
              {imageUri
                ? (
                    <Image source={{ uri: imageUri }} style={styles.thumbImage} />
                  )
                : (
                    <WaveformGlyph />
                  )}
            </View>
            <Text style={styles.heroSub}>
              {error
                ? t('analyzing.hero_sub_error')
                : isVoice
                  ? t('analyzing.hero_sub_voice')
                  : t('analyzing.hero_sub_photo')}
            </Text>
            <Text style={styles.heroTitle}>
              {error
                ? isVoice
                  ? t('analyzing.hero_title_error_voice')
                  : t('analyzing.hero_title_error_photo')
                : isVoice
                  ? t('analyzing.hero_title_voice')
                  : t('analyzing.hero_title_photo')}
            </Text>
            {transcript && !error && (
              <View style={styles.transcriptBlock}>
                <Text style={styles.transcriptText} numberOfLines={3}>
                  {`"${transcript}"`}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Checklist */}
          <View style={styles.checklist}>
            {stages.map((stageKey, index) => (
              <StageRow
                key={stageKey}
                stageKey={stageKey}
                index={index}
                activeIndex={activeIndex}
                hasError={error != null}
                styles={styles}
                t={t}
              />
            ))}
          </View>

          {/* Slow-connection hint */}
          {showSlowHint && !error && (
            <View style={styles.slowHint}>
              <Text style={styles.slowHintText}>
                {t('analyzing.slow_hint')}
              </Text>
            </View>
          )}

          {/* Error block */}
          {error && (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>
                {isVoice ? t('analyzing.error_voice') : t('analyzing.error_photo')}
              </Text>
            </View>
          )}

          {/* Footer buttons */}
          <View style={styles.footer}>
            {error
              ? (
                  <View style={styles.errorActions}>
                    <Pressable
                      style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                      onPress={handleCancel}
                      accessibilityRole="button"
                      accessibilityLabel={t('analyzing.close')}
                    >
                      <Text style={styles.btnSecondaryText}>{t('analyzing.close')}</Text>
                    </Pressable>
                    {onRetry && (
                      <Pressable
                        style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
                        onPress={handleRetry}
                        accessibilityRole="button"
                        accessibilityLabel={t('analyzing.retry')}
                      >
                        <Text style={styles.btnPrimaryText}>{t('analyzing.retry')}</Text>
                      </Pressable>
                    )}
                  </View>
                )
              : (
                  <Pressable
                    style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
                    onPress={handleCancel}
                    accessibilityRole="button"
                    accessibilityLabel={t('analyzing.cancel')}
                  >
                    <Text style={styles.btnSecondaryText}>{t('analyzing.cancel')}</Text>
                  </Pressable>
                )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Stage row
// ---------------------------------------------------------------------------

type StageRowProps = {
  stageKey: StageKey;
  index: number;
  activeIndex: number;
  hasError: boolean;
  styles: ReturnType<typeof makeStyles>;
  t: ReturnType<typeof useTranslation>['t'];
};

function StageRow({ stageKey, index, activeIndex, hasError, styles, t }: StageRowProps) {
  const isDone = index < activeIndex;
  const isActive = index === activeIndex;
  const isPending = index > activeIndex;
  const showError = hasError && isActive;

  const label = t(`analyzing.stage.${stageKey}`);
  const stateLabel = showError
    ? t('analyzing.a11y_failed')
    : isDone
      ? t('analyzing.a11y_done')
      : isActive
        ? t('analyzing.a11y_in_progress')
        : t('analyzing.a11y_pending');

  return (
    <View
      style={[
        styles.stage,
        isActive && !hasError ? styles.stageActive : null,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${label}, ${stateLabel}`}
      accessibilityLiveRegion={isActive ? 'polite' : 'none'}
    >
      <View
        style={[
          styles.stageIcon,
          isDone ? styles.stageIconDone : null,
          isActive && !showError ? styles.stageIconActive : null,
          showError ? styles.stageIconError : null,
          isPending ? styles.stageIconPending : null,
        ]}
      >
        {isDone && (
          <Text style={styles.stageIconText}>✓</Text>
        )}
        {isActive && !showError && (
          <ActivityIndicator size="small" color="white" />
        )}
        {showError && (
          <Text style={styles.stageIconText}>!</Text>
        )}
      </View>
      <Text
        style={[
          styles.stageLabel,
          isDone ? styles.stageLabelDone : null,
          isActive && !showError ? styles.stageLabelActive : null,
          showError ? styles.stageLabelError : null,
          isPending ? styles.stageLabelPending : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Waveform glyph (voice variant)
// ---------------------------------------------------------------------------

function WaveformGlyph() {
  const { colors } = useTheme();
  // Five static bars — could animate but the modal is already busy; subtle wins.
  const heights = [16, 28, 22, 32, 18];
  return (
    <View style={waveformStyles.container}>
      {heights.map((h, i) => (
        <View
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={[
            waveformStyles.bar,
            {
              height: h,
              backgroundColor: colors.primary,
              opacity: 0.55 + (i % 2) * 0.25,
            },
          ]}
        />
      ))}
    </View>
  );
}

const waveformStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  bar: {
    width: 5,
    borderRadius: 2,
  },
});

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
      ...shadows.lg,
    },

    // ── Hero ────────────────────────────────────────────────────────────────
    hero: {
      paddingTop: spacing.lg + 4,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    thumb: {
      width: 110,
      height: 110,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    heroSub: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    heroTitle: {
      color: colors.white,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    transcriptBlock: {
      marginTop: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.10)',
      borderLeftWidth: 2,
      borderLeftColor: 'rgba(255, 255, 255, 0.55)',
      borderRadius: radius.sm,
      maxWidth: 300,
    },
    transcriptText: {
      color: 'rgba(255, 255, 255, 0.92)',
      fontSize: 12.5,
      lineHeight: 18,
      fontStyle: 'italic',
    },

    // ── Checklist ───────────────────────────────────────────────────────────
    checklist: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    stage: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 10,
      borderRadius: radius.md,
    },
    stageActive: {
      backgroundColor: colors.primaryLight,
    },
    stageIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stageIconDone: {
      backgroundColor: colors.success,
    },
    stageIconActive: {
      backgroundColor: colors.primary,
    },
    stageIconPending: {
      backgroundColor: colors.border,
    },
    stageIconError: {
      backgroundColor: colors.error,
    },
    stageIconText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 14,
    },
    stageLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.15,
    },
    stageLabelDone: {
      color: colors.textSecondary,
      fontWeight: '500',
    },
    stageLabelActive: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    stageLabelPending: {
      color: colors.textDisabled,
      fontWeight: '500',
    },
    stageLabelError: {
      color: colors.error,
      fontWeight: '700',
    },

    // ── Slow hint ───────────────────────────────────────────────────────────
    slowHint: {
      marginHorizontal: spacing.md,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      backgroundColor: colors.warningLight,
      borderRadius: radius.md,
    },
    slowHintText: {
      color: colors.warning,
      fontSize: 12,
      lineHeight: 17,
      textAlign: 'center',
      fontWeight: '600',
    },

    // ── Error block ─────────────────────────────────────────────────────────
    errorBlock: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      backgroundColor: colors.errorLight,
      borderRadius: radius.md,
    },
    errorText: {
      color: colors.error,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      fontWeight: '600',
    },

    // ── Footer buttons ──────────────────────────────────────────────────────
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    errorActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    btnSecondary: {
      flex: 1,
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
      letterSpacing: -0.15,
    },
    btnPrimary: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    btnPrimaryText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.15,
    },
    btnPressed: {
      opacity: 0.85,
    },
  });
}
