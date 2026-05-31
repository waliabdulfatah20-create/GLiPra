// DeleteAccountModal
// Type-to-confirm guard for irreversible account deletion. The Delete button
// stays disabled until the user types the localized confirmation word.
// Built on React Native's Modal + StyleSheet + theme tokens (mirrors
// photo-comment-sheet.tsx — NOT the dead NativeWind ui/modal.tsx).

import * as React from 'react';
import {
  ActivityIndicator,
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

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface Props {
  visible: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAccountModal({ visible, isLoading, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const confirmWord = t('account.delete_confirm_word');
  const [input, setInput] = React.useState('');

  // Reset the field whenever the modal opens.
  React.useEffect(() => {
    if (visible) setInput('');
  }, [visible]);

  const matches = input.trim().toUpperCase() === confirmWord.toUpperCase();
  const canDelete = matches && !isLoading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={isLoading ? undefined : onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>{t('account.delete_title')}</Text>
          <Text style={styles.warning}>{t('account.delete_warning')}</Text>

          <Text style={styles.prompt}>
            {t('account.delete_confirm_prompt', { word: confirmWord })}
          </Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={confirmWord}
            placeholderTextColor={colors.textDisabled}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isLoading}
            accessibilityLabel={t('account.delete_confirm_prompt', { word: confirmWord })}
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={t('account.cancel')}
            >
              <Text style={styles.cancelText}>{t('account.cancel')}</Text>
            </Pressable>

            <Pressable
              style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
              onPress={onConfirm}
              disabled={!canDelete}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canDelete }}
              accessibilityLabel={t('account.delete_button')}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.deleteText}>{t('account.delete_button')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
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
    warning: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    prompt: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    deleteButton: {
      flex: 2,
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: colors.error,
      alignItems: 'center',
    },
    deleteButtonDisabled: {
      opacity: 0.4,
    },
    deleteText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.white,
    },
  });
}
