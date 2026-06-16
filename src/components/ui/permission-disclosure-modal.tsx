// PermissionDisclosureModal — wraps PermissionDisclosureBody in a one-time modal
// shown BEFORE the OS camera / microphone prompt (Google Play prominent disclosure).
// Continue = affirmative consent (the caller then fires the OS prompt); Not now =
// dismiss without requesting. Modal chrome mirrors AiPrivacyDisclaimerModal.

import type { PermissionKind } from '@/features/permissions/use-permission-disclosure';
import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PermissionDisclosureBody } from '@/components/ui/permission-disclosure-body';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type PermissionDisclosureModalProps = {
  visible: boolean;
  kind: PermissionKind;
  onContinue: () => void;
  onCancel: () => void;
};

export function PermissionDisclosureModal({
  visible,
  kind,
  onContinue,
  onCancel,
}: PermissionDisclosureModalProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const handleContinue = () => {
    haptics.tap();
    onContinue();
  };

  const handleCancel = () => {
    haptics.tap();
    onCancel();
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
        <View style={styles.sheet} testID="permission-disclosure">
          <PermissionDisclosureBody kind={kind} />

          <View style={styles.footer}>
            <Pressable
              testID="perm-disclosure-continue"
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
              onPress={handleContinue}
              accessibilityRole="button"
              accessibilityLabel={t('permissions.continue')}
            >
              <Text style={styles.btnPrimaryText}>{t('permissions.continue')}</Text>
            </Pressable>
            <Pressable
              testID="perm-disclosure-cancel"
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={t('permissions.not_now')}
            >
              <Text style={styles.btnSecondaryText}>{t('permissions.not_now')}</Text>
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
      ...shadows.lg,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
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
