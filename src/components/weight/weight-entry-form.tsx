import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { WeightUnit, kgToLbs, lbsToKg } from '@/lib/unit-preference';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

export interface WeightEntryFormProps {
  onSubmit: (entry: { weightKg: number; notes?: string }) => void;
  isLoading: boolean;
  lastWeightKg?: number;
  /** Display + input unit. Input is converted to kg before calling onSubmit. */
  weightUnit?: WeightUnit;
}

/**
 * Simple form for logging a new weight entry.
 * Numeric decimal input for weight (kg) + optional notes.
 */
export function WeightEntryForm({
  onSubmit,
  isLoading,
  lastWeightKg,
  weightUnit = 'kg',
}: WeightEntryFormProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );
  const [weightInput, setWeightInput] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const parsedInput = parseFloat(weightInput);
  const isValid = !isNaN(parsedInput) && parsedInput > 0;

  function handleSubmit() {
    if (!isValid) return;
    haptics.medium();
    // Always store in kg — convert if user entered lbs
    const weightKg = weightUnit === 'lbs' ? lbsToKg(parsedInput) : parsedInput;
    onSubmit({
      weightKg,
      notes: notes.trim() || undefined,
    });
    setWeightInput('');
    setNotes('');
  }

  // Show placeholder in the user's preferred unit
  const placeholder =
    lastWeightKg != null
      ? weightUnit === 'lbs'
        ? String(kgToLbs(lastWeightKg))
        : String(lastWeightKg)
      : weightUnit === 'lbs'
        ? '154.0'
        : '70.0';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>LOG WEIGHT</Text>

      <View style={styles.row}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder={placeholder}
            placeholderTextColor={colors.textDisabled}
            keyboardType="decimal-pad"
            returnKeyType="done"
            accessibilityLabel={`Weight in ${weightUnit}`}
          />
          <Text style={styles.unit}>{weightUnit}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!isValid || isLoading) && styles.buttonDisabled,
            pressed && isValid && !isLoading && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Log weight"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Log Weight</Text>
          )}
        </Pressable>
      </View>

      <TextInput
        style={styles.notesInput}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes (optional)"
        placeholderTextColor={colors.textDisabled}
        returnKeyType="done"
        accessibilityLabel="Notes"
      />
    </View>
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
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 44,
      backgroundColor: colors.gray50,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
      height: 44,
    },
    unit: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 100,
    },
    buttonDisabled: {
      backgroundColor: colors.gray300,
    },
    buttonPressed: {
      backgroundColor: colors.primaryDark,
    },
    buttonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
    notesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
      color: colors.textPrimary,
      backgroundColor: colors.gray50,
      minHeight: 40,
    },
  });
}
