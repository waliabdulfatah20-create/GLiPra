// AiCaptureHero — the combined "Log with AI" hero on the Nutrition Log screen.
// Voice + photo share ONE navy card with two halves (Speak | Snap). Tapping Speak
// flips the whole card to VoiceCaptureButton's full-width recording morph; Snap
// launches the camera. Both gate on tap via the imperative RevenueCat paywall
// (entitlement 'GLiPra Pro') — the card renders for free + Pro users alike.
//
// Reuses VoiceCaptureButton (recorder untouched) via its `autoStart` prop, and the
// photo camera-launch logic from the old PhotoCaptureButton.

import type { PermissionKind } from '@/features/permissions/use-permission-disclosure';
import type { GlipraTokens } from '@/theme/tokens';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Camera, Crown, Microphone } from '@/components/ui/icons';
import { PermissionDisclosureModal } from '@/components/ui/permission-disclosure-modal';
import { usePermissionDisclosure } from '@/features/permissions/use-permission-disclosure';
import { presentPaywall } from '@/features/subscription/present-paywall';
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

export function AiCaptureHero({
  onAudioCaptured,
  onImageSelected,
  isLoadingVoice,
  isLoadingPhoto,
  onBeforeRecord,
}: AiCaptureHeroProps) {
  const { t } = useTranslation();
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const { isPro } = useSubscription();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const [recording, setRecording] = React.useState(false);

  // Prominent permission disclosure (Google Play): show a one-time rationale
  // BEFORE the OS camera/mic prompt fires. `gate` runs the action immediately if
  // already seen, else opens the disclosure and runs it only on Continue.
  const { hasSeen, markSeen } = usePermissionDisclosure();
  const [disclosure, setDisclosure] = React.useState<
    { kind: PermissionKind; onProceed: () => void } | null
  >(null);

  function gate(kind: PermissionKind, onProceed: () => void) {
    if (hasSeen(kind)) {
      onProceed();
      return;
    }
    setDisclosure({ kind, onProceed });
  }

  function handleDisclosureContinue() {
    if (!disclosure)
      return;
    void markSeen(disclosure.kind);
    const proceed = disclosure.onProceed;
    setDisclosure(null);
    proceed();
  }

  function handleDisclosureCancel() {
    setDisclosure(null);
  }

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
      presentPaywall('Voice logging');
      return;
    }
    gate('microphone', () => setRecording(true));
  }

  function handleSnap() {
    if (isLoadingPhoto)
      return;
    haptics.medium();
    if (!isPro) {
      presentPaywall('AI photo recognition');
      return;
    }
    gate('camera', () => void launchCamera());
  }

  // Loading (transcribing voice / recognizing photo) — full-width spinner card.
  if (isLoadingVoice || isLoadingPhoto) {
    return (
      <View style={styles.card}>
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, styles.loadingInner]}
        >
          <ActivityIndicator color={colors.white} size="small" />
          <Text style={styles.loadingText}>{t('log.voice_processing')}</Text>
        </LinearGradient>
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
    <>
      <View style={styles.card}>
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.headerRow}>
            <Text style={styles.heroLabel}>{t('log.ai_hero_label')}</Text>
            <View style={styles.proPill}>
              <Crown color={colors.white} width={12} height={12} />
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
              <View style={styles.iconChip}>
                <Microphone color={colors.white} width={25} height={25} />
              </View>
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
              <View style={styles.iconChip}>
                <Camera color={colors.white} width={25} height={25} />
              </View>
              <Text style={styles.halfTitle}>{t('log.photo_action')}</Text>
              <Text style={styles.halfSub}>{t('log.photo_action_sub')}</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <PermissionDisclosureModal
        visible={disclosure != null}
        kind={disclosure?.kind ?? 'camera'}
        onContinue={handleDisclosureContinue}
        onCancel={handleDisclosureCancel}
      />
    </>
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
    card: {
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      overflow: 'hidden',
      ...shadows.md,
    },
    gradient: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    loadingInner: {
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
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
      marginBottom: spacing.md,
    },
    heroLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.92)',
    },
    proPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderColor: 'rgba(255,255,255,0.4)',
      borderWidth: 1,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    proPillText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    halvesRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    half: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.13)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.24)',
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: spacing.xs,
    },
    halfPressed: {
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    iconChip: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    halfTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.white,
    },
    halfSub: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.82)',
    },
  });
}
