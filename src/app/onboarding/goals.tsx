import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';

type Goal = 'muscle_preservation' | 'weight_management' | 'both';

const OPTIONS: { value: Goal; title: string; description: string }[] = [
  {
    value: 'muscle_preservation',
    title: 'Preserve muscle',
    description: 'I want to protect lean muscle while GLP-1 reduces my appetite',
  },
  {
    value: 'weight_management',
    title: 'Lose fat',
    description: 'I want to maximize fat loss while staying nourished',
  },
  {
    value: 'both',
    title: 'Both',
    description: 'I want to lose fat AND protect muscle',
  },
];

export default function GoalsScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const existing = useOnboardingStore.use.formData().goal;
  const [selected, setSelected] = useState<Goal | undefined>(existing);

  const handleNext = () => {
    if (selected === undefined)
      return;
    setFormData({ goal: selected });
    router.push('/onboarding/status');
  };

  return (
    <OnboardingScaffold
      step={{ current: 6, total: 10 }}
      title="What's your main goal?"
      subtitle="This shapes your protein target and daily guidance."
      footer={(
        <StepFooter
          primaryLabel="Continue"
          onPrimary={handleNext}
          primaryDisabled={selected === undefined}
          secondaryLabel="Back"
          onSecondary={() => router.back()}
        />
      )}
    >
      {OPTIONS.map(option => (
        <OptionCard
          key={option.value}
          title={option.title}
          subtitle={option.description}
          selected={selected === option.value}
          onPress={() => setSelected(option.value)}
        />
      ))}
    </OnboardingScaffold>
  );
}
