import type { GlipraTokens } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

type SafetyQuestion = {
  id: 'hasKidneyDisease';
  question: string;
  helperText: string;
};

const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 'hasKidneyDisease',
    question: 'Do you have kidney disease or reduced kidney function?',
    helperText: 'Includes CKD, dialysis, or any condition affecting your kidneys',
  },
];

type Answers = { hasKidneyDisease: boolean | undefined };

export default function SafetyScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const [answers, setAnswers] = useState<Answers>({
    hasKidneyDisease: undefined,
  });

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const setAnswer = (id: keyof Answers, value: boolean) => {
    haptics.selection();
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const canProceed = answers.hasKidneyDisease !== undefined;

  const handleNext = () => {
    if (!canProceed)
      return;
    setFormData({
      hasKidneyDisease: answers.hasKidneyDisease,
    });
    router.push('/onboarding/status');
  };

  return (
    <OnboardingScaffold
      step={{ current: 4, total: 7 }}
      title="Safety check"
      subtitle="This affects your protein target. Answer honestly: your safety depends on it."
      footer={(
        <StepFooter
          primaryLabel="Next"
          onPrimary={handleNext}
          primaryDisabled={!canProceed}
          secondaryLabel="Back"
          onSecondary={() => router.back()}
        />
      )}
    >
      {SAFETY_QUESTIONS.map((q) => {
        const answer = answers[q.id];
        return (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionText}>{q.question}</Text>
            <Text style={styles.helperText}>{q.helperText}</Text>
            <View style={styles.toggleRow}>
              {[true, false].map(val => (
                <Pressable
                  key={String(val)}
                  style={[styles.toggle, answer === val && styles.toggleSelected]}
                  onPress={() => setAnswer(q.id, val)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: answer === val }}
                  accessibilityLabel={val ? 'Yes' : 'No'}
                >
                  <Text style={[styles.toggleText, answer === val && styles.toggleTextSelected]}>
                    {val ? 'Yes' : 'No'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </OnboardingScaffold>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    questionCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.sm,
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
    toggle: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    toggleSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    toggleTextSelected: {
      color: colors.white,
    },
  });
}
