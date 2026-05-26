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

type Goal = 'muscle_preservation' | 'weight_management' | 'both';

const OPTIONS: { value: Goal; title: string; description: string }[] = [
  {
    value: 'muscle_preservation',
    title: 'Preserve muscle',
    description: "I want to protect lean muscle while GLP-1 reduces my appetite",
  },
  {
    value: 'weight_management',
    title: 'Lose fat',
    description: "I want to maximize fat loss while staying nourished",
  },
  {
    value: 'both',
    title: 'Both',
    description: "I want to lose fat AND protect muscle",
  },
];

export default function GoalsScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const existing = useOnboardingStore.use.formData().goal;

  const [selected, setSelected] = useState<Goal | undefined>(existing);

  const { colors, spacing, radius, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius, gradients]
  );

  const canProceed = selected !== undefined;

  const handleNext = () => {
    if (!canProceed) return;
    haptics.medium();
    setFormData({ goal: selected });
    router.push('/onboarding/status');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <StepProgress current={6} total={10} onDark />

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
          <Text style={styles.heading}>What's your main goal?</Text>
          <Text style={styles.subheading}>
            This shapes your protein target and daily guidance.
          </Text>
        </LinearGradient>

        {OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelected(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${option.title}: ${option.description}`}
            >
              {/* Left accent bar — only visible when selected */}
              <View style={[styles.accentBar, isSelected && styles.accentBarVisible]} />
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                  {option.title}
                </Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
            </Pressable>
          );
        })}
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
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    cardSelected: {
      borderColor: colors.primary,
    },
    accentBar: {
      width: 4,
      backgroundColor: 'transparent',
    },
    accentBarVisible: {
      backgroundColor: colors.primary,
    },
    cardContent: {
      flex: 1,
      padding: spacing.md,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    cardTitleSelected: {
      color: colors.primary,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
