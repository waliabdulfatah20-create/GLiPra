import { router } from 'expo-router';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LOCAL, changeLanguage } from '@/lib/i18n/utils';
import { setItem } from '@/lib/storage';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';
import type { Language } from '@/lib/i18n/resources';

type LangOption = { code: Language; label: string; sublabel: string };

const LANGS: LangOption[] = [
  { code: 'en', label: 'English', sublabel: 'Continue in English' },
  { code: 'es', label: 'Español', sublabel: 'Continuar en español' },
];

export default function LanguageScreen() {
  const [selected, setSelected] = React.useState<Language>('en');

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows]
  );

  const handleContinue = () => {
    haptics.medium();
    setItem(LOCAL, selected);
    changeLanguage(selected);
    router.push('/onboarding/medication');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Choose your language</Text>
          <Text style={styles.subheading}>Elige tu idioma</Text>
        </View>

        <View style={styles.options}>
          {LANGS.map(lang => {
            const isSelected = selected === lang.code;
            return (
              <Pressable
                key={lang.code}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => setSelected(lang.code)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {lang.label}
                  </Text>
                  <Text style={styles.optionSub}>{lang.sublabel}</Text>
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
          <Text style={styles.continueBtnText}>Continue / Continuar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    header: {
      marginTop: spacing.xl,
      marginBottom: spacing.xl,
    },
    heading: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: spacing.xs,
    },
    subheading: {
      fontSize: 18,
      fontWeight: '400',
      color: colors.textSecondary,
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
