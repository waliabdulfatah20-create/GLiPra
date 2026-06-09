import type { GlipraTokens } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { UnitToggle } from '@/components/ui/unit-toggle';
import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { useTheme } from '@/lib/ThemeContext';
import { ftInToCm, lbsToKg, useHeightUnit, useWeightUnit } from '@/lib/unit-preference';

function parsePositiveNumber(value: string): number | null {
  const num = Number.parseFloat(value);
  if (Number.isNaN(num) || num <= 0)
    return null;
  return num;
}

export default function BodyScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();

  const { unit: weightUnit, toggle: toggleWeightUnit } = useWeightUnit();
  const { unit: heightUnit, toggle: toggleHeightUnit } = useHeightUnit();

  const [weightText, setWeightText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [ftText, setFtText] = useState('');
  const [inText, setInText] = useState('');
  const [goalWeightText, setGoalWeightText] = useState('');

  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing, radius }), [colors, spacing, radius]);

  const weightRaw = parsePositiveNumber(weightText);
  const isMetricHeight = heightUnit === 'metric';
  const heightCmParsed = isMetricHeight ? parsePositiveNumber(heightText) : null;
  const ftParsed = !isMetricHeight ? parsePositiveNumber(ftText) : null;
  const inParsed = !isMetricHeight
    ? inText === '' || inText === '0' ? 0 : parsePositiveNumber(inText)
    : null;

  const isHeightValid = isMetricHeight
    ? heightCmParsed !== null
    : ftParsed !== null && inParsed !== null;

  const canProceed = weightRaw !== null && isHeightValid;

  const handleNext = () => {
    if (!canProceed || weightRaw === null)
      return;
    const weightKg = weightUnit === 'lbs' ? lbsToKg(weightRaw) : weightRaw;

    let heightCm: number;
    if (isMetricHeight) {
      heightCm = heightCmParsed!;
    }
    else {
      const ft = ftParsed!;
      const inches = typeof inParsed === 'number' ? inParsed : 0;
      heightCm = ftInToCm(ft, inches);
    }

    const goalWeightRaw = parsePositiveNumber(goalWeightText);
    const goalWeightKg
      = goalWeightRaw !== null
        ? weightUnit === 'lbs' ? lbsToKg(goalWeightRaw) : goalWeightRaw
        : undefined;

    setFormData({ weightKg, heightCm, goalWeightKg });
    router.push('/onboarding/safety');
  };

  const showWeightError = weightText.length > 0 && weightRaw === null;
  const showHeightError = isMetricHeight
    ? heightText.length > 0 && heightCmParsed === null
    : ftText.length > 0 && ftParsed === null;

  return (
    <OnboardingScaffold
      step={{ current: 3, total: 10 }}
      title="About your body"
      subtitle="Used to calculate your personalized protein target. All data stays on your device."
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
      {/* Weight */}
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>WEIGHT</Text>
        <UnitToggle options={['lbs', 'kg']} active={weightUnit} onToggle={toggleWeightUnit} />
      </View>
      <TextInput
        style={[styles.textInput, showWeightError && styles.textInputError]}
        value={weightText}
        onChangeText={setWeightText}
        placeholder={weightUnit === 'lbs' ? 'e.g. 182' : 'e.g. 82.5'}
        placeholderTextColor={colors.textDisabled}
        keyboardType="decimal-pad"
        returnKeyType="next"
        accessibilityLabel={`Weight in ${weightUnit}`}
      />
      {showWeightError && <Text style={styles.errorText}>Enter a valid weight greater than 0</Text>}

      {/* Height */}
      <View style={[styles.labelRow, styles.labelRowTop]}>
        <Text style={styles.fieldLabel}>HEIGHT</Text>
        <UnitToggle
          options={['ft · in', 'cm']}
          active={heightUnit === 'metric' ? 'cm' : 'ft · in'}
          onToggle={toggleHeightUnit}
        />
      </View>

      {isMetricHeight
        ? (
            <>
              <TextInput
                style={[styles.textInput, showHeightError && styles.textInputError]}
                value={heightText}
                onChangeText={setHeightText}
                placeholder="e.g. 170"
                placeholderTextColor={colors.textDisabled}
                keyboardType="decimal-pad"
                returnKeyType="done"
                accessibilityLabel="Height in centimeters"
              />
              {showHeightError && <Text style={styles.errorText}>Enter a valid height greater than 0</Text>}
            </>
          )
        : (
            <>
              <View style={styles.imperialRow}>
                <View style={styles.imperialInputGroup}>
                  <TextInput
                    style={[styles.textInput, styles.imperialInput, ftText.length > 0 && ftParsed === null && styles.textInputError]}
                    value={ftText}
                    onChangeText={setFtText}
                    placeholder="5"
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="number-pad"
                    returnKeyType="next"
                    accessibilityLabel="Feet"
                  />
                  <Text style={styles.imperialUnit}>ft</Text>
                </View>
                <View style={styles.imperialInputGroup}>
                  <TextInput
                    style={[styles.textInput, styles.imperialInput]}
                    value={inText}
                    onChangeText={(t) => {
                      const n = Number.parseInt(t, 10);
                      if (t === '' || (n >= 0 && n <= 11))
                        setInText(t);
                    }}
                    placeholder="9"
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    accessibilityLabel="Inches"
                  />
                  <Text style={styles.imperialUnit}>in</Text>
                </View>
              </View>
              {showHeightError && <Text style={styles.errorText}>Enter a valid height (feet must be greater than 0)</Text>}
            </>
          )}

      {/* Goal weight (optional) */}
      <View style={[styles.labelRow, styles.labelRowTop]}>
        <Text style={styles.fieldLabel}>GOAL WEIGHT</Text>
        <Text style={styles.optionalLabel}>Optional</Text>
      </View>
      <TextInput
        style={styles.textInput}
        value={goalWeightText}
        onChangeText={setGoalWeightText}
        placeholder={weightUnit === 'lbs' ? 'e.g. 160' : 'e.g. 72'}
        placeholderTextColor={colors.textDisabled}
        keyboardType="decimal-pad"
        returnKeyType="done"
        accessibilityLabel={`Goal weight in ${weightUnit}`}
      />
      <Text style={styles.hintText}>Helps track your progress toward your goal</Text>
    </OnboardingScaffold>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    labelRowTop: {
      marginTop: spacing.lg,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.8,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },
    textInputError: {
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: spacing.xs,
    },
    imperialRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    imperialInputGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    imperialInput: {
      flex: 1,
    },
    imperialUnit: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 18,
    },
    optionalLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textDisabled,
      letterSpacing: 0.4,
    },
    hintText: {
      fontSize: 12,
      color: colors.textDisabled,
      marginTop: spacing.xs,
    },
  });
}
