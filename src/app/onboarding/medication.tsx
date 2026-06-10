import type { AdministrationRoute, GLP1MedicationId } from '@/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';

type MedicationOption = {
  id: GLP1MedicationId;
  brand: string;
  molecule: string;
  route: AdministrationRoute;
};

const MEDICATIONS: MedicationOption[] = [
  { id: 'semaglutide_wegovy', brand: 'Wegovy', molecule: 'Semaglutide', route: 'injection' },
  { id: 'semaglutide_ozempic', brand: 'Ozempic', molecule: 'Semaglutide', route: 'injection' },
  { id: 'tirzepatide_zepbound', brand: 'Zepbound', molecule: 'Tirzepatide', route: 'injection' },
  { id: 'tirzepatide_mounjaro', brand: 'Mounjaro', molecule: 'Tirzepatide', route: 'injection' },
  { id: 'liraglutide_saxenda', brand: 'Saxenda', molecule: 'Liraglutide', route: 'injection' },
  { id: 'liraglutide_victoza', brand: 'Victoza', molecule: 'Liraglutide', route: 'injection' },
  { id: 'dulaglutide_trulicity', brand: 'Trulicity', molecule: 'Dulaglutide', route: 'injection' },
  { id: 'semaglutide_rybelsus', brand: 'Rybelsus / Oral Wegovy', molecule: 'Oral Semaglutide · daily tablet', route: 'oral' },
  { id: 'orforglipron', brand: 'Orforglipron', molecule: 'Oral GLP-1 · daily tablet', route: 'oral' },
  { id: 'compounded_semaglutide', brand: 'Compounded Semaglutide', molecule: 'Semaglutide', route: 'injection' },
  { id: 'compounded_tirzepatide', brand: 'Compounded Tirzepatide', molecule: 'Tirzepatide', route: 'injection' },
  { id: 'compounded_glp1_gip', brand: 'Compounded GLP-1/GIP', molecule: 'GLP-1 / GIP', route: 'injection' },
];

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
