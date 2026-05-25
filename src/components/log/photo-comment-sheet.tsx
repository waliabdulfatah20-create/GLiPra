// PhotoCommentSheet
// Slides up after the camera captures a photo, before AI analysis runs.
// Lets the user add optional free-text context (portion size, preparation,
// additions) so GPT-4o has richer input for a more accurate estimate.
//
// Rule 2: the comment describes food only — never user identity or health
// conditions. The 300-char limit guards against prompt injection.

import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, spacing } from '@/theme/colors';

const MAX_CHARS = 300;

interface Props {
  visible: boolean;
  /** Called when user taps Analyze. `comment` is undefined when skipped. */
  onAnalyze: (comment?: string) => void;
  onDismiss: () => void;
}

export function PhotoCommentSheet({ visible, onAnalyze, onDismiss }: Props) {
  const { t } = useTranslation();
  const [comment, setComment] = React.useState('');

  // Reset comment text whenever the sheet opens for a fresh capture.
  React.useEffect(() => {
    if (visible) setComment('');
  }, [visible]);

  function handleAnalyze() {
    const trimmed = comment.trim();
    onAnalyze(trimmed.length > 0 ? trimmed : undefined);
  }

  function handleSkip() {
    onAnalyze(undefined);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {/* Tap backdrop to dismiss without analyzing */}
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <Text style={styles.title}>{t('log.photo_comment_title')}</Text>
          <Text style={styles.subtitle}>{t('log.photo_comment_subtitle')}</Text>

          {/* Comment input */}
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={(v) => setComment(v.slice(0, MAX_CHARS))}
            placeholder={t('log.photo_comment_placeholder')}
            placeholderTextColor={colors.textDisabled}
            multiline
            autoFocus
            returnKeyType="default"
            accessibilityLabel={t('log.photo_comment_title')}
          />

          {/* Char counter */}
          <Text style={styles.charCount}>
            {comment.length}/{MAX_CHARS}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel={t('log.photo_comment_skip')}
            >
              <Text style={styles.skipText}>{t('log.photo_comment_skip')}</Text>
            </Pressable>

            <Pressable
              style={styles.analyzeButton}
              onPress={handleAnalyze}
              accessibilityRole="button"
              accessibilityLabel={t('log.photo_comment_analyze')}
            >
              <Text style={styles.analyzeText}>
                {t('log.photo_comment_analyze')} →
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    color: colors.textDisabled,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  analyzeButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  analyzeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
