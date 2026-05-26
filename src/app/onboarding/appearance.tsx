// Onboarding step 2 — appearance picker (Light / Dark / System).
// Inserted between language.tsx and medication.tsx.
// useThemeSelector() writes to AsyncStorage immediately — the user gets
// live preview as they tap (app re-renders via ThemeContext).

import { router } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '@/lib/haptics';
import { useTheme, useThemeSelector } from '@/lib/ThemeContext';
import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import type { GlipraTokens } from '@/theme/tokens';

// ─── Data ────────────────────────────────────────────────────────────────────

type ThemeOption = {
  value: ColorSchemeType;
  labelKey: string;
  subKey: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    labelKey: 'onboarding.appearance_light',
    subKey: 'onboarding.appearance_light_sub',
  },
  {
    value: 'dark',
    labelKey: 'onboarding.appearance_dark',
    subKey: 'onboarding.appearance_dark_sub',
  },
  {
    value: 'system',
    labelKey: 'onboarding.appearance_system',
    subKey: 'onboarding.appearance_system_sub',
  },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, gradients } = useTheme();
  // useThemeSelector() is safe here — onboarding screens render inside GlipraThemeProvider.
  const { selectedTheme, setSelectedTheme } = useThemeSelector();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const handleContinue = () => {
    haptics.medium();
    router.push('/onboarding/medication');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heading}>{t('onboarding.appearance_title')}</Text>
          <Text style={styles.subheading}>{t('onboarding.appearance_subtitle')}</Text>
        </LinearGradient>

        <View style={styles.options}>
          {THEME_OPTIONS.map((option) => {
            const isSelected = selectedTheme === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => {
                  haptics.tap();
                  setSelectedTheme(option.value);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={t(option.labelKey)}
              >
                <View style={styles.optionLeft}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                  <Text style={styles.optionSub}>{t(option.subKey)}</Text>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.continueBtn}
          onPress={handleContinue}
          accessibilityRole="button"
        >
          <Text style={styles.continueBtnText}>{t('common.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Mirrors language.tsx exactly — same card-picker visual pattern.

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    heroGradient: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl + spacing.sm,
      marginTop: -spacing.lg,
      marginHorizontal: -spacing.lg,
      marginBottom: spacing.lg,
    },
    heading: {
      fontSize: 28,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: -0.5,
      marginBottom: spacing.xs,
    },
    subheading: {
      fontSize: 16,
      fontWeight: '400',
      color: 'rgba(255,255,255,0.8)',
    },
    options: {
      gap: spacing.sm,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      ...shadows.sm,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    optionLeft: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    optionLabelSelected: {
      color: colors.primary,
    },
    optionSub: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.gray300,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.md,
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    footer: {
      padding: spacing.lg,
      paddingBottom: spacing.lg,
    },
    continueBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      ...shadows.sm,
    },
    continueBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: 0.2,
    },
  });
}
