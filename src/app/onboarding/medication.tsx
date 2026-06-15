import type { GLP1MedicationId } from '@/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { MEDICATIONS } from '@/features/medication/medications';
import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';

export default function MedicationScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const [selectedId, setSelectedId] = useState<GLP1MedicationId | null>(null);

  const handleNext = () => {
    if (!selectedId)
      return;
    const selected = MEDICATIONS.find(m => m.id === selectedId);
    setFormData({
      medicationId: selectedId,
      administrationRoute: selected?.route ?? 'injection',
      isCompounded: selectedId.startsWith('compounded'),
    });
    router.push('/onboarding/injection-day');
  };

  return (
    <OnboardingScaffold
      step={{ current: 1, total: 7 }}
      title="Which GLP-1 are you on?"
      subtitle="Select your medication. Your guidance is personalized to your specific medication."
      footer={(
        <StepFooter
          primaryLabel="Next"
          onPrimary={handleNext}
          primaryDisabled={selectedId === null}
        />
      )}
    >
      {MEDICATIONS.map(med => (
        <OptionCard
          key={med.id}
          title={med.brand}
          subtitle={med.molecule}
          selected={selectedId === med.id}
          onPress={() => setSelectedId(med.id)}
        />
      ))}
    </OnboardingScaffold>
  );
}
