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
import {
  calculateProteinFloor,
  ACTIVITY_MULTIPLIERS,
  KIDNEY_DISEASE_MAX_G_PER_KG,
  MAINTENANCE_MULTIPLIER,
} from '@/utils/protein';
import type { ProteinResult } from '@/utils/protein';

export default function ProteinTargetScreen() {
  const router = useRouter();
  const formData = useOnboardingStore.use.formData();
  const setFormData = useOnboardingStore.use.setFormData();

  const [acknowledged, setAcknowledged] = useState(false);

  const { colors, spacing, radius, shadows, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
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

  // Formula line: "82.5 kg × 1.6 g/kg" — hidden when floored by pregnancy
  // (pregnancy minimum 80g doesn't fit a weight × multiplier explanation)
  const formulaText = React.useMemo(() => {
    if (!result || !formData.activityLevel || result.flooredByPregnancy) return null;

    const activityMultiplier = ACTIVITY_MULTIPLIERS[formData.activityLevel];
    let displayMultiplier: number;

    if (result.cappedByKidneyDisease) {
      displayMultiplier = KIDNEY_DISEASE_MAX_G_PER_KG; // 0.8
    } else {
      const phase: 'weight_loss' | 'maintenance' =
        formData.medicationStatus === 'maintenance' || formData.medicationStatus === 'tapering'
          ? 'maintenance'
          : 'weight_loss';
      displayMultiplier =
        phase === 'maintenance' ? activityMultiplier * MAINTENANCE_MULTIPLIER : activityMultiplier;
    }

    const weight = result.baseWeightUsedKg.toFixed(1);
    // Trim trailing zeros: 1.40 → 1.4, 1.44 → 1.44, 0.80 → 0.8
    const mult = displayMultiplier.toFixed(2).replace(/\.?0+$/, '');
    return `${weight} kg × ${mult} g/kg`;
  }, [result, formData.activityLevel, formData.medicationStatus]);

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

        {/* Result card — outer View carries shadow, inner LinearGradient is the visible face */}
        <View style={styles.resultCardOuter}>
          <LinearGradient
            colors={gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resultCardInner}
          >
            {/* ℞ watermark — absolute, faint, top-right */}
            <Text style={styles.rxWatermark}>℞</Text>

            {/* Hero number */}
            <Text style={styles.proteinNumber}>
              {result !== null ? `${result.proteinFloorG}g` : '-'}
            </Text>
            <Text style={styles.proteinLabel}>daily protein floor</Text>

            {/* Formula breakdown */}
            {formulaText !== null && (
              <Text style={styles.formulaLine}>{formulaText}</Text>
            )}

            {/* Adjustment badges — frosted-glass pills on gradient */}
            {result !== null &&
              (result.usedIdealBodyWeight ||
                result.cappedByKidneyDisease ||
                result.flooredByPregnancy) && (
                <View style={styles.badgeRow}>
                  {result.usedIdealBodyWeight && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Adjusted for BMI</Text>
                    </View>
                  )}
                  {result.cappedByKidneyDisease && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Kidney-safe limit</Text>
                    </View>
                  )}
                  {result.flooredByPregnancy && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Pregnancy minimum</Text>
                    </View>
                  )}
                </View>
              )}
          </LinearGradient>
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

    // Outer wrapper — iOS shadow host, opaque background required
    resultCardOuter: {
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      marginBottom: spacing.md,
      ...shadows.md,
    },

    // Inner gradient — visible card face, clips to rounded corners
    resultCardInner: {
      borderRadius: radius.xl,
      overflow: 'hidden',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      alignItems: 'center',
      position: 'relative',
    },

    // ℞ watermark — faint, top-right corner, absolute
    rxWatermark: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.md,
      fontSize: 64,
      fontWeight: '800',
      color: 'rgba(255,255,255,0.08)',
      lineHeight: 72,
    },

    proteinNumber: {
      fontSize: 52,
      fontWeight: '800',
      color: '#ffffff',
      lineHeight: 60,
      marginTop: spacing.sm,
    },
    proteinLabel: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.75)',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    formulaLine: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.65)',
      marginBottom: spacing.md,
      letterSpacing: 0.2,
    },

    // Frosted-glass badges (unified — replaces badgeNeutral + badgeWarning)
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    badge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#ffffff',
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
