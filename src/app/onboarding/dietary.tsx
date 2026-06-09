import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';

type DietaryPattern = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'other';

const OPTIONS: { value: DietaryPattern; label: string; description: string }[] = [
  { value: 'omnivore', label: 'Omnivore', description: 'Eats everything' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat, eats dairy/eggs' },
  { value: 'vegan', label: 'Vegan', description: 'Plant-based only' },
  { value: 'pescatarian', label: 'Pescatarian', description: 'Fish + plant-based' },
  { value: 'other', label: 'Other / Not sure', description: 'We will keep suggestions general' },
];

export default function DietaryScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const existing = useOnboardingStore.use.formData().dietaryPattern;
  const [selected, setSelected] = useState<DietaryPattern | undefined>(existing);

  const handleNext = () => {
    if (selected === undefined)
      return;
    setFormData({ dietaryPattern: selected });
    router.push('/onboarding/goals');
  };

  return (
    <OnboardingScaffold
      step={{ current: 5, total: 10 }}
      title="Your eating style"
      subtitle="Helps us suggest protein sources that fit your diet."
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
          title={option.label}
          subtitle={option.description}
          selected={selected === option.value}
          onPress={() => setSelected(option.value)}
        />
      ))}
    </OnboardingScaffold>
  );
}
