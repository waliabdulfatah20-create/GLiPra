import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { colors, radius, spacing } from '@/theme/colors';

type DietaryPattern = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'other';

const OPTIONS: { value: DietaryPattern; label: string; description: string }[] = [
  { value: 'omnivore', label: 'Omnivore', description: 'Eats everything' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat, eats dairy/eggs' },
  { value: 'vegan', label: 'Vegan', description: 'Plant-based only' },
  { value: 'pescatarian', label: 'Pescatarian', description: 'Fish + plant-based' },
  { value: 'other', label: 'Other / Not sure', description: '' },
];

export default function DietaryScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const existing = useOnboardingStore.use.formData().dietaryPattern;

  const [selected, setSelected] = useState<DietaryPattern | undefined>(existing);

  const canProceed = selected !== undefined;

  const handleNext = () => {
    if (!canProceed) return;
    setFormData({ dietaryPattern: selected });
    router.push('/onboarding/goals');
  };

  // Split into rows of 2
  const rows: (typeof OPTIONS)[] = [];
  for (let i = 0; i < OPTIONS.length; i += 2) {
    rows.push(OPTIONS.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StepProgress current={5} total={10} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your eating style</Text>
        <Text style={styles.subheading}>
          Helps us suggest protein sources that fit your diet.
        </Text>

        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((option) => {
              const isSelected = selected === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => setSelected(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={option.label}
                >
                  <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                    {option.label}
                  </Text>
                  {option.description ? (
                    <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                      {option.description}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            {/* Fill empty slot if odd number of items in last row */}
            {row.length === 1 && <View style={styles.cardSpacer} />}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
          accessibilityRole="button"
        >
          <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.sm },
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 80,
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardSpacer: { flex: 1 },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardLabelSelected: {
    color: colors.primary,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  cardDescriptionSelected: {
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
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  nextButtonDisabled: { backgroundColor: colors.gray200 },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
  nextButtonTextDisabled: { color: colors.textDisabled },
});
