// Onboarding step — appearance picker (Light / Dark / System).
// useThemeSelector() writes to AsyncStorage immediately, so tapping gives a live
// preview: the whole app (onboarding included) re-renders via ThemeContext.

import type { ColorSchemeType } from '@/lib/hooks/use-selected-theme';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useThemeSelector } from '@/lib/ThemeContext';

type ThemeOption = { value: ColorSchemeType; labelKey: string; subKey: string };

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', labelKey: 'onboarding.appearance_light', subKey: 'onboarding.appearance_light_sub' },
  { value: 'dark', labelKey: 'onboarding.appearance_dark', subKey: 'onboarding.appearance_dark_sub' },
  { value: 'system', labelKey: 'onboarding.appearance_system', subKey: 'onboarding.appearance_system_sub' },
];

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { selectedTheme, setSelectedTheme } = useThemeSelector();

  return (
    <OnboardingScaffold
      title={t('onboarding.appearance_title')}
      subtitle={t('onboarding.appearance_subtitle')}
      footer={(
        <StepFooter
          primaryLabel={t('common.continue')}
          onPrimary={() => router.push('/onboarding/medication')}
        />
      )}
    >
      {THEME_OPTIONS.map(option => (
        <OptionCard
          key={option.value}
          title={t(option.labelKey)}
          subtitle={t(option.subKey)}
          selected={selectedTheme === option.value}
          onPress={() => setSelectedTheme(option.value)}
        />
      ))}
    </OnboardingScaffold>
  );
}
