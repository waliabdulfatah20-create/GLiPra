import { useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';
import { calculateProteinFloor } from '@/utils/protein';
import type { ProteinResult } from '@/utils/protein';

export default function ProteinTargetScreen() {
  const router = useRouter();
  const formData = useOnboardingStore.use.formData();
  const setFormData = useOnboardingStore.use.setFormData();

  const [acknowledged, setAcknowledged] = useState(false);

  const { colors, spacing, radius, shadows, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows, gradients]
  );

  const result = useMemo<ProteinResult | null>(() => {
    const { weightKg, heightCm, hasKidneyDisease, isPregnant, activityLevel, medicationStatus } =
      formData;

    if (
      weightKg === undefined ||
      heightCm === undefined ||
      hasKidneyDisease === undefined ||
      isPregnant === undefined ||
      activityLevel === undefined
    ) {
      return null;
    }

    const bmi = weightKg / ((heightCm / 100) * (heightCm / 100));

    const phase: 'weight_loss' | 'maintenance' =
      medicationStatus === 'maintenance' || medicationStatus === 'tapering'
        ? 'maintenance'
        : 'weight_loss';

    return calculateProteinFloor({
      weightKg,
      heightCm,
      bmi,
      hasKidneyDisease,
      isPregnant,
      phase,
      activityLevel,
    });
  }, [formData]);

  const canProceed = acknowledged && result !== null;

  const handleNext = () => {
    if (!canProceed || result === null) return;
    haptics.medium();
    setFormData({ proteinFloorG: result.proteinFloorG, proteinFloorAcknowledged: true });
    router.push('/onboarding/import');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <StepProgress current={8} total={10} onDark />

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
          <Text style={styles.heading}>Your protein target</Text>
          <Text style={styles.subheading}>
            Based on your body metrics and health information.
          </Text>
        </LinearGradient>

        {/* Result card */}
        <View style={styles.resultCard}>
          <Text style={styles.proteinNumber}>
            {result !== null ? `${result.proteinFloorG}g` : '—'}
          </Text>
          <Text style={styles.proteinLabel}>daily protein floor</Text>

          {result !== null && (result.usedIdealBodyWeight || result.cappedByKidneyDisease || result.flooredByPregnancy) && (
            <View style={styles.badgeRow}>
              {result.usedIdealBodyWeight && (
                <View style={styles.badgeNeutral}>
                  <Text style={styles.badgeNeutralText}>Adjusted for BMI</Text>
                </View>
              )}
              {result.cappedByKidneyDisease && (
                <View style={styles.badgeWarning}>
                  <Text style={styles.badgeWarningText}>Kidney-safe limit</Text>
                </View>
              )}
              {result.flooredByPregnancy && (
                <View style={styles.badgeWarning}>
                  <Text style={styles.badgeWarningText}>Pregnancy minimum</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Tier-1 disclaimer — same visual weight as result card, Rule 8 */}
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerText}>
            This estimate is based on the information you provided. Inaccurate inputs will produce
            inaccurate estimates. Always confirm your protein target with your prescriber, especially
            if you have kidney disease, are pregnant, or have other health conditions.
          </Text>
        </DisclaimerBanner>

        {/* Acknowledgment checkbox */}
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAcknowledged((prev) => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acknowledged }}
          accessibilityLabel="I understand this is an estimate. I will confirm with my prescriber."
        >
          <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
            {acknowledged && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand this is an estimate. I will confirm with my prescriber.
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed}
          accessibilityRole="button"
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
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
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

    // Result card
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.md,
      ...shadows.md,
    },
    proteinNumber: {
      fontSize: 56,
      fontWeight: '800',
      color: colors.primary,
      lineHeight: 64,
    },
    proteinLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },

    // Badges
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      justifyContent: 'center',
    },
    badgeNeutral: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    badgeNeutralText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    badgeWarning: {
      backgroundColor: colors.warningLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    badgeWarningText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.warning,
    },

    disclaimerText: {
      fontSize: 14,
      color: colors.disclaimerText,
      lineHeight: 20,
    },

    // Acknowledgment checkbox
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 1,
    },
    checkboxChecked: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    checkmark: {
      color: colors.white,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 16,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 22,
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
}
