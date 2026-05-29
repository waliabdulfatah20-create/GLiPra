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

type YesNo = boolean;

type SafetyQuestion = {
  id: 'hasKidneyDisease' | 'isPregnant';
  question: string;
  helperText: string;
};

const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 'hasKidneyDisease',
    question: 'Do you have kidney disease or reduced kidney function?',
    helperText: 'Includes CKD, dialysis, or any condition affecting your kidneys',
  },
  {
    id: 'isPregnant',
    question: 'Are you currently pregnant?',
    helperText: 'Including early pregnancy',
  },
];

type Answers = {
  hasKidneyDisease: YesNo | undefined;
  isPregnant: YesNo | undefined;
};

export default function SafetyScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();

  const [answers, setAnswers] = useState<Answers>({
    hasKidneyDisease: undefined,
    isPregnant: undefined,
  });

  const { colors, spacing, radius, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius, gradients]
  );

  const setAnswer = (id: keyof Answers, value: YesNo) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const canProceed =
    answers.hasKidneyDisease !== undefined && answers.isPregnant !== undefined;

  const handleNext = () => {
    if (!canProceed) return;
    haptics.medium();
    setFormData({
      hasKidneyDisease: answers.hasKidneyDisease,
      isPregnant: answers.isPregnant,
    });
    router.push('/onboarding/dietary');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <StepProgress current={4} total={10} onDark />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heading}>Safety check</Text>
          <Text style={styles.subheading}>
            These questions affect your protein target calculation. Answer honestly: your safety
            depends on it.
          </Text>
        </LinearGradient>

        {SAFETY_QUESTIONS.map((q) => {
          const answer = answers[q.id];
          return (
            <View key={q.id} style={styles.questionCard}>
              <Text style={styles.questionText}>{q.question}</Text>
              <Text style={styles.helperText}>{q.helperText}</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[
                    styles.toggleButton,
                    answer === true && styles.toggleButtonSelected,
                  ]}
                  onPress={() => setAnswer(q.id, true)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: answer === true }}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      answer === true && styles.toggleButtonTextSelected,
                    ]}
                  >
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton,
                    answer === false && styles.toggleButtonSelected,
                  ]}
                  onPress={() => setAnswer(q.id, false)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: answer === false }}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      answer === false && styles.toggleButtonTextSelected,
                    ]}
                  >
                    No
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
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

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.sm,
    },
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
    questionCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    questionText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: spacing.xs,
    },
    helperText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    toggleRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    toggleButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    toggleButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    toggleButtonTextSelected: {
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
}
