// PermissionDisclosureBody — the shared rationale shown before the OS camera /
// microphone permission prompt (Google Play prominent disclosure). Presentational
// only: a kind-specific icon, title, and 3 bullets (what we access, why, and that
// it runs only in-context). Used by PermissionDisclosureModal (photo + voice) and
// inline in the barcode scanner's pre-grant screen, so the copy stays identical
// across every camera/mic entry point.

import type { PermissionKind } from '@/features/permissions/use-permission-disclosure';
import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Camera, Microphone } from '@/components/ui/icons';
import { useTheme } from '@/lib/ThemeContext';

export function PermissionDisclosureBody({ kind }: { kind: PermissionKind }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing }), [colors, spacing]);

  const Icon = kind === 'camera' ? Camera : Microphone;
  const prefix = kind === 'camera' ? 'camera' : 'mic';
  const bullets = React.useMemo(
    () => [
      t(`permissions.${prefix}_b1`),
      t(`permissions.${prefix}_b2`),
      t(`permissions.${prefix}_b3`),
    ],
    [t, prefix],
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconChip}>
        <Icon color={colors.primary} width={26} height={26} />
      </View>
      <Text style={styles.title}>{t(`permissions.${kind}_title`)}</Text>
      <View style={styles.bulletList}>
        {bullets.map((text, i) => (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            style={styles.bulletRow}
          >
            <View style={styles.dot} />
            <Text style={styles.bulletText}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
};

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    container: {
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    iconChip: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    bulletList: {
      gap: spacing.sm + 2,
      alignSelf: 'stretch',
    },
    bulletRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 7,
      flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
    },
  });
}
