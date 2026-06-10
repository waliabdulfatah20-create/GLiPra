import type { Language } from '@/lib/i18n/resources';
import { router } from 'expo-router';
import * as React from 'react';

import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { changeLanguage, LOCAL } from '@/lib/i18n/utils';
import { setItem } from '@/lib/storage';

type LangOption = { code: Language; label: string; sublabel: string };

// Hardcoded EN/ES labels — the user has not picked a language yet (per CLAUDE.md).
const LANGS: LangOption[] = [
  { code: 'en', label: 'English', sublabel: 'Continue in English' },
  { code: 'es', label: 'Español', sublabel: 'Continuar en español' },
];

export default function LanguageScreen() {
  const [selected, setSelected] = React.useState<Language>('en');

  const handleContinue = () => {
    setItem(LOCAL, selected);
    changeLanguage(selected);
    router.push('/onboarding/medication');
  };

  return (
    <OnboardingScaffold
      title="Choose your language"
      subtitle="Elige tu idioma"
      footer={(
        <StepFooter primaryLabel="Continue / Continuar" onPrimary={handleContinue} />
      )}
    >
      {LANGS.map(lang => (
        <OptionCard
          key={lang.code}
          title={lang.label}
          subtitle={lang.sublabel}
          selected={selected === lang.code}
          onPress={() => setSelected(lang.code)}
        />
      ))}
    </OnboardingScaffold>
  );
}
