import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { haptics } from '@/lib/haptics';
import { colors, radius, spacing } from '@/theme/colors';
import type { GLP1MedicationId } from '@/types';

type MedicationOption = {
  id: GLP1MedicationId;
  brand: string;
  molecule: string;
};

const MEDICATIONS: MedicationOption[] = [
  { id: 'semaglutide_wegovy', brand: 'Wegovy', molecule: 'Semaglutide' },
  { id: 'semaglutide_ozempic', brand: 'Ozempic', molecule: 'Semaglutide' },
  { id: 'tirzepatide_zepbound', brand: 'Zepbound', molecule: 'Tirzepatide' },
  { id: 'tirzepatide_mounjaro', brand: 'Mounjaro', molecule: 'Tirzepatide' },
  { id: 'liraglutide_saxenda', brand: 'Saxenda', molecule: 'Liraglutide' },
  { id: 'liraglutide_victoza', brand: 'Victoza', molecule: 'Liraglutide' },
  { id: 'dulaglutide_trulicity', brand: 'Trulicity', molecule: 'Dulaglutide' },
  { id: 'compounded_semaglutide', brand: 'Compounded Semaglutide', molecule: 'Semaglutide' },
  { id: 'compounded_tirzepatide', brand: 'Compounded Tirzepatide', molecule: 'Tirzepatide' },
  { id: 'compounded_glp1_gip', brand: 'Compounded GLP-1/GIP', molecule: 'GLP-1 / GIP' },
];

export default function MedicationScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();

  const [selectedId, setSelectedId] = useState<GLP1MedicationId | null>(null);

  const canProceed = selectedId !== null;

  const handleNext = () => {
    if (!selectedId) return;
    haptics.medium();
    setFormData({
      medicationId: selectedId,
      isCompounded: selectedId.startsWith('compounded'),
    });
    router.push('/onboarding/injection-day');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StepProgress current={1} total={10} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Which GLP-1 are you on?</Text>
        <Text style={styles.subheading}>
          Select your medication. Your guidance is personalized to your specific medication.
        </Text>

        {MEDICATIONS.map((med) => {
          const isSelected = selectedId === med.id;
          return (
            <Pressable
              key={med.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedId(med.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[styles.cardBrand, isSelected && styles.cardBrandSelected]}>
                {med.brand}
              </Text>
              <Text style={[styles.cardMolecule, isSelected && styles.cardMoleculeSelected]}>
                {med.molecule}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
            Next
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardBrandSelected: {
    color: colors.primary,
  },
  cardMolecule: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardMoleculeSelected: {
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  nextButtonTextDisabled: {
    color: colors.textDisabled,
  },
});
