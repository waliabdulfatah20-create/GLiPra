import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

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

  const { colors, spacing, radius, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius, gradients]
  );

  const canProceed = selected !== undefined;

  const handleNext = () => {
    if (!canProceed) return;
    haptics.medium();
    setFormData({ dietaryPattern: selected });
    router.push('/onboarding/goals');
  };

  // Split into rows of 2
  const rows: (typeof OPTIONS)[] = [];
  for (let i = 0; i < OPTIONS.length; i += 2) {
    rows.push(OPTIONS.slice(i, i + 2));
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <StepProgress current={5} total={10} onDark />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heading}>Your eating style</Text>
          <Text style={styles.subheading}>
            Helps us suggest protein sources that fit your diet.
          </Text>
        </LinearGradient>

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

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.sm },
    heroGradient: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl + spacing.sm,
      marginTop: -spacing.lg,
      marginHorizontal: -spacing.lg,
      marginBottom: spacing.lg,
    },
    heading: {
      fontSize: 24,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: spacing.sm,
    },
    subheading: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.8)',
      lineHeight: 22,
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
}
