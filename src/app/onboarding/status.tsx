import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { colors, radius, spacing } from '@/theme/colors';

type MedicationStatus = 'starting' | 'active' | 'tapering' | 'maintenance' | 'discontinued';
type ActivityLevel = 'sedentary' | 'moderate' | 'active';

const MEDICATION_OPTIONS: { value: MedicationStatus; title: string; description: string }[] = [
  {
    value: 'starting',
    title: 'Just starting out',
    description: "I'm new to GLP-1 or just got my prescription",
  },
  {
    value: 'active',
    title: 'Active & doing well',
    description: "I've been on it a few weeks or months",
  },
  {
    value: 'tapering',
    title: 'Tapering down',
    description: 'My dose is decreasing or I\'m reducing frequency',
  },
  {
    value: 'maintenance',
    title: 'Maintenance / stable',
    description: "I'm at my goal dose and in steady state",
  },
  {
    value: 'discontinued',
    title: 'Recently stopped',
    description: "I've discontinued and am in maintenance mode",
  },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Low', description: 'Desk job, little exercise' },
  { value: 'moderate', label: 'Moderate', description: 'Some exercise, active lifestyle' },
  { value: 'active', label: 'High', description: 'Regular gym, very active' },
];

export default function StatusScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const formData = useOnboardingStore.use.formData();

  const [medicationStatus, setMedicationStatus] = useState<MedicationStatus | undefined>(
    formData.medicationStatus,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(
    formData.activityLevel,
  );

  const canProceed = medicationStatus !== undefined && activityLevel !== undefined;

  const handleNext = () => {
    if (!canProceed) return;
    setFormData({ medicationStatus, activityLevel });
    router.push('/onboarding/protein-target');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StepProgress current={7} total={10} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Where are you in your journey?</Text>
        <Text style={styles.subheading}>
          Your protein target is adjusted based on where you are with your medication.
        </Text>

        {/* Section 1 — Medication status */}
        <Text style={styles.sectionLabel}>Medication status</Text>

        {MEDICATION_OPTIONS.map((option) => {
          const isSelected = medicationStatus === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.listCard, isSelected && styles.listCardSelected]}
              onPress={() => setMedicationStatus(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${option.title}: ${option.description}`}
            >
              <View style={styles.radioCircle}>
                {isSelected && <View style={styles.radioFill} />}
              </View>
              <View style={styles.listCardContent}>
                <Text style={[styles.listCardTitle, isSelected && styles.listCardTitleSelected]}>
                  {option.title}
                </Text>
                <Text style={styles.listCardDescription}>{option.description}</Text>
              </View>
            </Pressable>
          );
        })}

        {/* Section 2 — Activity level */}
        <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>Activity level</Text>

        <View style={styles.activityRow}>
          {ACTIVITY_OPTIONS.map((option) => {
            const isSelected = activityLevel === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                onPress={() => setActivityLevel(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${option.label}: ${option.description}`}
              >
                <Text style={[styles.activityLabel, isSelected && styles.activityLabelSelected]}>
                  {option.label}
                </Text>
                <Text style={[styles.activityDescription, isSelected && styles.activityDescriptionSelected]}>
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  sectionLabelTop: {
    marginTop: spacing.lg,
  },
  // Medication status list cards
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  listCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  listCardContent: { flex: 1 },
  listCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  listCardTitleSelected: {
    color: colors.primary,
  },
  listCardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Activity level side-by-side cards
  activityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  activityCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  activityCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  activityLabelSelected: {
    color: colors.primary,
  },
  activityDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    textAlign: 'center',
  },
  activityDescriptionSelected: {
    color: colors.primary,
  },
  // Footer
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
