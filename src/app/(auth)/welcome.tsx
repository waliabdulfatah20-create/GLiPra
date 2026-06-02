import type { GlipraTokens } from '@/theme/tokens';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/ThemeContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors }),
    [colors],
  );

  const handleGetStarted = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(auth)/sign-up');
  };

  const handleSignIn = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/sign-in');
  };

  return (
    <View style={styles.container}>
      {/* Radial blue glow overlay — New Architecture only */}
      <View style={styles.glow} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Logo + tagline — FadeInDown on mount */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.logoSection}>
            <View style={styles.logoBox} />
            <Text style={styles.appName}>GLiPra</Text>
            <Text style={styles.tagline}>{t('auth.welcome_tagline')}</Text>
          </Animated.View>

          {/* Buttons — FadeInUp with delay */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.buttonSection}
          >
            <Pressable
              onPress={handleGetStarted}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              testID="welcome-get-started"
            >
              <View style={styles.primaryButtonGradient}>
                <Text style={styles.primaryButtonText}>{t('auth.get_started')}</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleSignIn}
              style={({ pressed }) => [
                styles.ghostButton,
                pressed && styles.ghostButtonPressed,
              ]}
              testID="welcome-sign-in"
            >
              <Text style={styles.ghostButtonText}>{t('auth.sign_in')}</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Pharmacist badge — bottom */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.badgeContainer}
        >
          <Text style={styles.badgeText}>{t('auth.pharmacist_badge')}</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
};

function makeStyles({ colors }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.gray900,
    },
    glow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      experimental_backgroundImage:
        'radial-gradient(ellipse at 50% 25%, rgba(45,107,228,0.45) 0%, transparent 65%)',
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 48,
    },
    logoSection: {
      alignItems: 'center',
      gap: 16,
    },
    logoBox: {
      width: 56,
      height: 56,
      borderRadius: 16,
      borderCurve: 'continuous',
      experimental_backgroundImage: 'linear-gradient(135deg, #2D6BE4, #1A4FB5)',
      boxShadow: '0 8px 24px rgba(45,107,228,0.4)',
    },
    appName: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.textInverse,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
    },
    buttonSection: {
      width: '100%',
      gap: 12,
    },
    primaryButton: {
      borderRadius: 14,
      borderCurve: 'continuous',
      overflow: 'hidden',
    },
    primaryButtonGradient: {
      experimental_backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
      boxShadow: '0 4px 16px rgba(45,107,228,0.5)',
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    ghostButton: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      borderRadius: 14,
      borderCurve: 'continuous',
      paddingVertical: 16,
      alignItems: 'center',
    },
    ghostButtonPressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    ghostButtonText: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 16,
      fontWeight: '500',
    },
    badgeContainer: {
      paddingHorizontal: 24,
      paddingBottom: 8,
      alignItems: 'center',
    },
    badgeText: {
      color: 'rgba(255,255,255,0.3)',
      fontSize: 12,
      textAlign: 'center',
    },
  });
}
