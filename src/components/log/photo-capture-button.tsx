// PhotoCaptureButton — AI hero card
// Always visible above the mode toggle on the Nutrition Log screen.
// Renders identically for free and Pro users; free users see the paywall on tap.
// Props interface intentionally unchanged so the log.tsx call site needs no update.
//
// Visual: deep violet→indigo gradient card with AI + PRO badges, camera icon
// with sparkle dots, and a white CTA pill.

import type { GlipraTokens } from '@/theme/tokens';
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSubscription } from '@/features/subscription/use-subscription';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type PhotoCaptureButtonProps = {
  onImageSelected: (
    base64: string,
    mimeType: 'image/jpeg' | 'image/png',
  ) => void;
  isLoading: boolean;
};

export function PhotoCaptureButton({
  onImageSelected,
  isLoading,
}: PhotoCaptureButtonProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const { isPro } = useSubscription();

  async function handleCameraPress() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera permission required',
        'GLiPra needs camera access to recognise food from photos.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0])
      return;

    const asset = result.assets[0];
    if (!asset.base64)
      return;

    const mimeType: 'image/jpeg' | 'image/png'
      = asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';

    onImageSelected(asset.base64, mimeType);
  }

  function handleCardPress() {
    if (isLoading)
      return;

    haptics.medium();
    if (!isPro) {
      // Open RevenueCat paywall for non-Pro users
      try {
        // eslint-disable-next-line ts/no-require-imports
        const { RevenueCatUI } = require('react-native-purchases-ui');
        RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: 'GLiPra Pro',
        });
      }
      catch {
        // Native module not available in Expo Go — silent no-op
      }
      return;
    }

    void handleCameraPress();
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.93 }]}
      onPress={handleCardPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={
        isPro ? 'Snap your meal with AI camera' : 'Upgrade to Pro for AI photo recognition'
      }
    >
      {/* Leading icon circle */}
      <View style={styles.iconCircle}>
        <Text style={styles.cameraIcon}>📷</Text>
      </View>

      {/* Title + subtitle */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t('log.photo_row_title')}</Text>
        <Text style={styles.subtitle}>{t('log.photo_row_subtitle')}</Text>
      </View>

      {/* Trailing: AI + PRO pills + chevron, or spinner while analyzing */}
      {isLoading
        ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.analyzingText}>{t('log.voice_processing')}</Text>
            </View>
          )
        : (
            <View style={styles.trailing}>
              <View style={styles.aiPill}>
                <Text style={styles.aiPillText}>AI</Text>
              </View>
              <View style={styles.proPill}>
                <Text style={styles.proPillText}>PRO</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          )}
    </Pressable>
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      ...shadows.sm,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraIcon: {
      fontSize: 20,
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    aiPill: {
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderColor: '#F59E0B',
      borderWidth: 1,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    aiPillText: {
      color: '#F59E0B',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    proPill: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
      borderWidth: 1,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    proPillText: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    chevron: {
      fontSize: 22,
      color: colors.textSecondary,
      marginLeft: 2,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    analyzingText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
