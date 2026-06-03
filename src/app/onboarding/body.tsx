import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import {
  ftInToCm,
  lbsToKg,
  useHeightUnit,
  useWeightUnit,
} from '@/lib/unit-preference';

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
  // Metric height
  const [heightText, setHeightText] = useState('');
  // Imperial height
  const [ftText, setFtText] = useState('');
  const [inText, setInText] = useState('');
  // Goal weight (optional)
  const [goalWeightText, setGoalWeightText] = useState('');

  const { colors, spacing, radius, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  // Parsed weight in the user's chosen unit (kg or lbs)
  const weightRaw = parsePositiveNumber(weightText);

  // Determine if height inputs are valid
  const isMetricHeight = heightUnit === 'metric';
  const heightCmParsed = isMetricHeight ? parsePositiveNumber(heightText) : null;
  const ftParsed = !isMetricHeight ? parsePositiveNumber(ftText) : null;
  const inParsed = !isMetricHeight
    ? inText === '' || inText === '0'
      ? 0
      : parsePositiveNumber(inText)
    : null;

  const isHeightValid = isMetricHeight
    ? heightCmParsed !== null
    : ftParsed !== null && inParsed !== null;

  const canProceed = weightRaw !== null && isHeightValid;

  const handleNext = () => {
    if (!canProceed || weightRaw === null)
      return;
    haptics.medium();

    // Convert to metric for storage
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
        ? weightUnit === 'lbs'
          ? lbsToKg(goalWeightRaw)
          : goalWeightRaw
        : undefined;

    setFormData({ weightKg, heightCm, goalWeightKg });
    router.push('/onboarding/safety');
  };

  // Validation display flags
  const showWeightError = weightText.length > 0 && weightRaw === null;
  const showHeightError = isMetricHeight
    ? heightText.length > 0 && heightCmParsed === null
    : ftText.length > 0 && ftParsed === null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <StepProgress current={3} total={10} onDark />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heading}>About your body</Text>
          <Text style={styles.subheading}>
            Used to calculate your personalized protein target. All data stays on your device.
          </Text>
        </LinearGradient>

        {/* Weight input */}
        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel}>WEIGHT</Text>
          <UnitToggle
            options={['lbs', 'kg']}
            active={weightUnit}
            onToggle={toggleWeightUnit}
          />
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
        {showWeightError && (
          <Text style={styles.errorText}>Enter a valid weight greater than 0</Text>
        )}

        {/* Height input */}
        <View style={[styles.labelRow, { marginTop: spacing.lg }]}>
          <Text style={styles.fieldLabel}>HEIGHT</Text>
          <UnitToggle
            options={['ft · in', 'cm']}
            active={heightUnit === 'metric' ? 'cm' : 'ft · in'}
            onToggle={toggleHeightUnit}
          />
        </View>

        {isMetricHeight ? (
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
            {showHeightError && (
              <Text style={styles.errorText}>Enter a valid height greater than 0</Text>
            )}
          </>
        ) : (
          <>
            <View style={styles.imperialRow}>
              <View style={styles.imperialInputGroup}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.imperialInput,
                    ftText.length > 0 && ftParsed === null && styles.textInputError,
                  ]}
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
                    // Clamp to 0-11 range
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
            {showHeightError && (
              <Text style={styles.errorText}>Enter a valid height (feet must be greater than 0)</Text>
            )}
          </>
        )}
        {/* Goal weight input (optional) */}
        <View style={[styles.labelRow, { marginTop: spacing.lg }]}>
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

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

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
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
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
