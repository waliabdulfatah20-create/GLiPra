// PhotoCaptureButton — AI hero card
// Always visible above the mode toggle on the Nutrition Log screen.
// Renders identically for free and Pro users; free users see the paywall on tap.
// Props interface intentionally unchanged so the log.tsx call site needs no update.
//
// Visual: deep violet→indigo gradient card with AI + PRO badges, camera icon
// with sparkle dots, and a white CTA pill.

import * as ImagePicker from 'expo-image-picker';
import React from 'react';
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
import type { GlipraTokens } from '@/theme/tokens';

export interface PhotoCaptureButtonProps {
  onImageSelected: (
    base64: string,
    mimeType: 'image/jpeg' | 'image/png',
  ) => void;
  isLoading: boolean;
}

export function PhotoCaptureButton({
  onImageSelected,
  isLoading,
}: PhotoCaptureButtonProps) {
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
        'Glipra needs camera access to recognise food from photos.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) return;

    const mimeType: 'image/jpeg' | 'image/png' =
      asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';

    onImageSelected(asset.base64, mimeType);
  }

  function handleCardPress() {
    if (isLoading) return;

    haptics.medium();
    if (!isPro) {
      // Open RevenueCat paywall for non-Pro users
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { RevenueCatUI } = require('react-native-purchases-ui');
        RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: 'GLiPra Pro',
        });
      } catch {
        // Native module not available in Expo Go — silent no-op
      }
      return;
    }

    void handleCameraPress();
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.cardWrapper, pressed && { opacity: 0.93 }]}
      onPress={handleCardPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={
        isPro ? 'Snap your meal with AI camera' : 'Upgrade to Pro for AI photo recognition'
      }
    >
      <View style={styles.card}>
        {/* Top row: AI POWERED pill + PRO chip */}
        <View style={styles.topRow}>
          <View style={styles.aiPill}>
            <Text style={styles.aiPillText}>✦ AI POWERED</Text>
          </View>
          <View style={styles.proPill}>
            <Text style={styles.proPillText}>👑 PRO</Text>
          </View>
        </View>

        {/* Camera icon with 4 sparkle dots */}
        <View style={styles.iconContainer}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={[styles.sparkle, styles.sparkleNE]}>✦</Text>
          <Text style={[styles.sparkle, styles.sparkleSE]}>✦</Text>
          <Text style={[styles.sparkle, styles.sparkleNW]}>✦</Text>
          <Text style={[styles.sparkle, styles.sparkleSW]}>✦</Text>
        </View>

        {/* Title + subtitle */}
        <Text style={styles.title}>Snap your meal</Text>
        <Text style={styles.subtitle}>AI estimates macros instantly</Text>

        {/* CTA — loading spinner while recognition is in flight */}
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.analyzingText}>Analyzing…</Text>
          </View>
        ) : (
          <View style={styles.ctaPill}>
            <Text style={styles.ctaText}>Open Camera →</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    cardWrapper: {
      marginHorizontal: spacing.md,
      borderRadius: radius.lg,
      ...shadows.lg,
    },
    card: {
      borderRadius: radius.lg,
      backgroundColor: '#4C1D95',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      alignItems: 'center',
      gap: spacing.xs,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginBottom: spacing.xs,
    },
    aiPill: {
      backgroundColor: 'rgba(245,158,11,0.2)',
      borderColor: '#F59E0B',
      borderWidth: 1,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    aiPillText: {
      color: '#F59E0B',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
    },
    proPill: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderColor: 'rgba(255,255,255,0.25)',
      borderWidth: 1,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    proPillText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '800',
    },
    iconContainer: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraIcon: {
      fontSize: 32,
    },
    sparkle: {
      position: 'absolute',
      fontSize: 8,
      color: 'rgba(255,255,255,0.7)',
    },
    sparkleNE: { top: 4, right: 4 },
    sparkleSE: { bottom: 4, right: 4 },
    sparkleNW: { top: 4, left: 4 },
    sparkleSW: { bottom: 4, left: 4 },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.white,
      marginTop: spacing.xs,
    },
    subtitle: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.65)',
      marginBottom: spacing.xs,
    },
    ctaPill: {
      backgroundColor: colors.white,
      borderRadius: radius.full,
      paddingHorizontal: 20,
      paddingVertical: 10,
      alignSelf: 'stretch',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    ctaText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 10,
    },
    analyzingText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.white,
    },
  });
}
