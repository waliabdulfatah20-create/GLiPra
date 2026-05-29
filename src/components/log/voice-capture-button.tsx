// VoiceCaptureButton — Pro-gated mic button for the Log screen.
// Mirrors photo-capture-button.tsx structure.
//
// Flow: tap → Pro check → mic permission → recording state →
//       tap to stop → base64 encode → onAudioCaptured callback

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import { useSubscription } from '@/features/subscription/use-subscription';
import type { GlipraTokens } from '@/theme/tokens';

// RevenueCat paywall — same import as photo-capture-button.tsx
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VoiceCaptureButtonProps {
  onAudioCaptured: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VoiceCaptureButton({ onAudioCaptured, isLoading }: VoiceCaptureButtonProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const { isPro } = useSubscription();
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  // Tick elapsed time while recording
  React.useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePress = async () => {
    haptics.tap();

    // Already recording — stop
    if (isRecording && recording) {
      await stopRecording(recording);
      return;
    }

    // Pro gate — show paywall for non-Pro users
    if (!isPro) {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: 'glipra_pro',
      });
      if (result === PAYWALL_RESULT.NOT_PRESENTED || result === PAYWALL_RESULT.ERROR) return;
      // User just subscribed — fall through to start recording
    }

    // Mic permission
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('log.voice_permission_denied_title'),
        t('log.voice_permission_denied_body'),
        [{ text: 'OK' }],
      );
      return;
    }

    await startRecording();
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('[VoiceCaptureButton] startRecording error:', err);
      Alert.alert('Recording failed', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async (rec: Audio.Recording) => {
    try {
      setIsRecording(false);
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = rec.getURI();
      if (!uri) throw new Error('No recording URI');

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setRecording(null);
      onAudioCaptured(base64, 'audio/m4a');
    } catch (err) {
      console.error('[VoiceCaptureButton] stopRecording error:', err);
      setRecording(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.button, styles.loadingState]}>
        <ActivityIndicator color={colors.white} size="small" />
        <Text style={styles.loadingText}>{t('log.voice_processing')}</Text>
      </View>
    );
  }

  if (isRecording) {
    return (
      <Pressable
        style={[styles.button, styles.recordingState]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={t('log.voice_stop')}
      >
        {/* Static waveform bars — visual affordance for active recording */}
        <View style={styles.waveform}>
          {[8, 16, 10, 20, 6, 14, 18, 8, 12].map((h, i) => (
            <View key={i} style={[styles.waveBar, { height: h }]} />
          ))}
        </View>
        <Text style={styles.recordingTimer}>{formatTime(elapsedSeconds)}</Text>
        <Text style={styles.recordingHint}>{t('log.voice_stop')}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.button}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t('log.voice_button_label')}
    >
      <Text style={styles.icon}>🎙</Text>
      <Text style={styles.label}>{t('log.voice_button_label')}</Text>
      <Text style={styles.subtitle}>{t('log.voice_button_subtitle')}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    button: {
      flex: 1,
      backgroundColor: '#0F172A',
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: 80,
    },
    loadingState: {
      opacity: 0.8,
    },
    recordingState: {
      backgroundColor: '#7f1d1d',
    },
    icon: {
      fontSize: 22,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.white,
    },
    subtitle: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.65)',
    },
    loadingText: {
      fontSize: 11,
      color: colors.white,
      marginTop: 4,
    },
    waveform: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginBottom: 4,
    },
    waveBar: {
      width: 3,
      backgroundColor: '#fca5a5',
      borderRadius: 2,
    },
    recordingTimer: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.white,
    },
    recordingHint: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.7)',
    },
  });
}
