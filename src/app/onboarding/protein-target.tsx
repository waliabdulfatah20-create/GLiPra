import type { GlipraTokens } from '@/theme/tokens';
import type { ProteinResult } from '@/utils/protein';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { useTheme } from '@/lib/ThemeContext';
import {
  ACTIVITY_MULTIPLIERS,
  calculateProteinFloor,
  KIDNEY_DISEASE_MAX_G_PER_KG,
} from '@/utils/protein';

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
    const { weightKg, heightCm, hasKidneyDisease, isPregnant, activityLevel } = formData;

    if (
      weightKg === undefined
      || heightCm === undefined
      || hasKidneyDisease === undefined
      || isPregnant === undefined
      || activityLevel === undefined
    ) {
      return null;
    }

    const bmi = weightKg / ((heightCm / 100) * (heightCm / 100));

    return calculateProteinFloor({
      weightKg,
      heightCm,
      bmi,
      hasKidneyDisease,
      isPregnant,
      phase: 'weight_loss',
      activityLevel,
    });
  }, [formData]);

  // Formula line: "82.5 kg × 1.6 g/kg" — hidden when floored by pregnancy
  // (pregnancy minimum 80g doesn't fit a weight × multiplier explanation)
  const formulaText = React.useMemo(() => {
    if (!result || !formData.activityLevel || result.flooredByPregnancy)
      return null;

    const activityMultiplier = ACTIVITY_MULTIPLIERS[formData.activityLevel];
    let displayMultiplier: number;

    if (result.cappedByKidneyDisease) {
      displayMultiplier = KIDNEY_DISEASE_MAX_G_PER_KG; // 0.8
    }
    else {
      displayMultiplier = activityMultiplier;
    }

    const weight = result.baseWeightUsedKg.toFixed(1);
    // Trim trailing zeros: 1.40 → 1.4, 1.44 → 1.44, 0.80 → 0.8
    const mult = displayMultiplier.toFixed(2).replace(/\.?0+$/, '');
    return `${weight} kg × ${mult} g/kg`;
  }, [result, formData.activityLevel]);

  const canProceed = acknowledged && result !== null;

  const handleNext = () => {
    if (!canProceed || result === null)
      return;
    setFormData({ proteinFloorG: result.proteinFloorG, proteinFloorAcknowledged: true });
    router.push('/onboarding/reveal');
  };

  return (
    <OnboardingScaffold
      step={{ current: 6, total: 7 }}
      title="Your protein target"
      subtitle="Based on your body metrics and health information."
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
          {result !== null
            && (result.usedIdealBodyWeight
              || result.cappedByKidneyDisease
              || result.flooredByPregnancy) && (
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
        onPress={() => setAcknowledged(prev => !prev)}
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
    // Outer wrapper — iOS shadow host, opaque background required
    resultCardOuter: {
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
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

    // Frosted-glass badges
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
      marginTop: spacing.sm,
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
  });
}
