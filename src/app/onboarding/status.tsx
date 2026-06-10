import type { GlipraTokens } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { useTheme } from '@/lib/ThemeContext';

type MedicationStatus = 'starting' | 'active';
type ActivityLevel = 'sedentary' | 'moderate' | 'active';

const MEDICATION_OPTIONS: { value: MedicationStatus; title: string; description: string }[] = [
  { value: 'starting', title: 'Just starting out', description: 'I\'m new to GLP-1 or just got my prescription' },
  { value: 'active', title: 'Active & doing well', description: 'I\'ve been on it a few weeks or months' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Low activity', description: 'Desk job, little exercise' },
  { value: 'moderate', label: 'Moderate activity', description: 'Some exercise, active lifestyle' },
  { value: 'active', label: 'High activity', description: 'Regular gym, very active' },
];

export default function StatusScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const formData = useOnboardingStore.use.formData();
  const [medicationStatus, setMedicationStatus] = useState<MedicationStatus | undefined>(formData.medicationStatus);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(formData.activityLevel);

  const { colors, spacing } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing }), [colors, spacing]);

  const canProceed = medicationStatus !== undefined && activityLevel !== undefined;

  const handleNext = () => {
    if (!canProceed)
      return;
    setFormData({ medicationStatus, activityLevel });
    router.push('/onboarding/protein-target');
  };

  return (
    <OnboardingScaffold
      step={{ current: 5, total: 7 }}
      title="Where are you in your journey?"
      subtitle="Your protein target is adjusted based on where you are with your medication."
      footer={(
        <StepFooter
          primaryLabel="Continue"
          onPrimary={handleNext}
          primaryDisabled={!canProceed}
          secondaryLabel="Back"
          onSecondary={() => router.back()}
        />
      )}
    >
      <Text style={styles.sectionLabel}>Medication status</Text>
      {MEDICATION_OPTIONS.map(option => (
        <OptionCard
          key={option.value}
          title={option.title}
          subtitle={option.description}
          selected={medicationStatus === option.value}
          onPress={() => setMedicationStatus(option.value)}
        />
      ))}

      <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>Activity level</Text>
      {ACTIVITY_OPTIONS.map(option => (
        <OptionCard
          key={option.value}
          title={option.label}
          subtitle={option.description}
          selected={activityLevel === option.value}
          onPress={() => setActivityLevel(option.value)}
        />
      ))}
    </OnboardingScaffold>
  );
}

type StyleTokens = { colors: GlipraTokens['colors']; spacing: GlipraTokens['spacing'] };

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    sectionLabelTop: {
      marginTop: spacing.md,
    },
  });
}
