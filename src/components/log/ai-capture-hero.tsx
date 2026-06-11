// AiCaptureHero — the combined "Log with AI" hero on the Nutrition Log screen.
// Voice + photo share ONE navy card with two halves (Speak | Snap). Tapping Speak
// flips the whole card to VoiceCaptureButton's full-width recording morph; Snap
// launches the camera. Both gate on tap via the imperative RevenueCat paywall
// (entitlement 'GLiPra Pro') — the card renders for free + Pro users alike.
//
// Reuses VoiceCaptureButton (recorder untouched) via its `autoStart` prop, and the
// photo camera-launch logic from the old PhotoCaptureButton.

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

import { VoiceCaptureButton } from '@/components/log/voice-capture-button';
import { useSubscription } from '@/features/subscription/use-subscription';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

type AiCaptureHeroProps = {
  onAudioCaptured: (base64: string, mimeType: string) => void;
  onImageSelected: (base64: string, mimeType: 'image/jpeg' | 'image/png') => void;
  isLoadingVoice: boolean;
  isLoadingPhoto: boolean;
  onBeforeRecord?: () => Promise<boolean>;
};

function openPaywall() {
  try {
    const { RevenueCatUI } = require('react-native-purchases-ui');
    RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: 'GLiPra Pro' });
  }
  catch {
    // Native module not available in Expo Go — silent no-op.
  }
}

export function AiCaptureHero({
  onAudioCaptured,
  onImageSelected,
  isLoadingVoice,
  isLoadingPhoto,
  onBeforeRecord,
}: AiCaptureHeroProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const { isPro } = useSubscription();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );
  const [recording, setRecording] = React.useState(false);

  async function launchCamera() {
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

  function handleSpeak() {
    haptics.medium();
    if (!isPro) {
      openPaywall();
      return;
    }
    setRecording(true);
  }

  function handleSnap() {
    if (isLoadingPhoto)
      return;
    haptics.medium();
    if (!isPro) {
      openPaywall();
      return;
    }
    void launchCamera();
  }

  // Loading (transcribing voice / recognizing photo) — full-width spinner card.
  if (isLoadingVoice || isLoadingPhoto) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator color={colors.white} size="small" />
        <Text style={styles.loadingText}>{t('log.voice_processing')}</Text>
      </View>
    );
  }

  // Recording — hand the full-width card to VoiceCaptureButton's recording morph.
  if (recording) {
    return (
      <VoiceCaptureButton
        autoStart
        isLoading={false}
        onBeforeRecord={onBeforeRecord}
        onClose={() => setRecording(false)}
        onAudioCaptured={(base64, mimeType) => {
          setRecording(false);
          onAudioCaptured(base64, mimeType);
        }}
      />
    );
  }

  // Idle — the combined "Log with AI" card with two equal halves.
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.heroLabel}>{t('log.ai_hero_label')}</Text>
        <View style={styles.proPill}>
          <Text style={styles.proPillText}>PRO</Text>
        </View>
      </View>
      <View style={styles.halvesRow}>
        <Pressable
          testID="ai-hero-speak"
          style={({ pressed }) => [styles.half, pressed && styles.halfPressed]}
          onPress={handleSpeak}
          accessibilityRole="button"
          accessibilityLabel={t('log.voice_action')}
        >
          <Text style={styles.halfIcon}>🎙</Text>
          <Text style={styles.halfTitle}>{t('log.voice_action')}</Text>
          <Text style={styles.halfSub}>{t('log.voice_action_sub')}</Text>
        </Pressable>
        <Pressable
          testID="ai-hero-snap"
          style={({ pressed }) => [styles.half, pressed && styles.halfPressed]}
          onPress={handleSnap}
          accessibilityRole="button"
          accessibilityLabel={t('log.photo_action')}
        >
          <Text style={styles.halfIcon}>📷</Text>
          <Text style={styles.halfTitle}>{t('log.photo_action')}</Text>
          <Text style={styles.halfSub}>{t('log.photo_action_sub')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.voiceHeroBg,
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    loadingCard: {
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      opacity: 0.85,
    },
    loadingText: {
      fontSize: 11,
      color: colors.white,
      marginTop: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    heroLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.voiceHeroTextMuted,
    },
    proPill: {
      backgroundColor: colors.voiceHeroBadgeBg,
      borderColor: colors.voiceHeroBadgeBorder,
      borderWidth: 1,
      borderRadius: radius.full,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    proPillText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    halvesRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    half: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: spacing.xs,
    },
    halfPressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    halfIcon: {
      fontSize: 26,
    },
    halfTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.white,
    },
    halfSub: {
      fontSize: 11,
      color: colors.voiceHeroTextMuted,
    },
  });
}
