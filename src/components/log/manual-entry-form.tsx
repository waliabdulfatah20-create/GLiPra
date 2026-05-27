// Manual food entry form component.
// Simple controlled-input form — no third-party form library.
// All styling uses colors.ts tokens only; no inline colors.

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';
import type { ManualFoodEntry } from '@/features/food-log/types';

export interface ManualEntryFormProps {
  onSubmit: (entry: ManualFoodEntry) => void;
  isLoading: boolean;
}

interface FormState {
  name: string;
  servingDescription: string;
  proteinG: string;
  fiberG: string;
  caloriesKcal: string;
}

const INITIAL_STATE: FormState = {
  name: '',
  servingDescription: '',
  proteinG: '',
  fiberG: '',
  caloriesKcal: '',
};

export function ManualEntryForm({ onSubmit, isLoading }: ManualEntryFormProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const [form, setForm] = React.useState<FormState>(INITIAL_STATE);
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const proteinValue = parseFloat(form.proteinG);
  const hasProtein = !isNaN(proteinValue) && proteinValue > 0;
  const isValid = form.name.trim().length > 0 && hasProtein;

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    if (!isValid || isLoading) return;

    const entry: ManualFoodEntry = {
      name: form.name.trim(),
      servingDescription: form.servingDescription.trim() || '1 serving',
      proteinG: proteinValue,
      fiberG: form.fiberG ? parseFloat(form.fiberG) : undefined,
      caloriesKcal: form.caloriesKcal ? parseFloat(form.caloriesKcal) : undefined,
    };

    onSubmit(entry);
    setForm(INITIAL_STATE);
  }

  function inputStyle(field: string) {
    return [
      styles.input,
      focusedField === field && styles.inputFocused,
    ];
  }

  return (
    <View style={styles.container}>
      {/* Food name — required */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Food name *</Text>
        <TextInput
          style={inputStyle('name')}
          placeholder="e.g. Greek yogurt"
          placeholderTextColor={colors.textDisabled}
          value={form.name}
          onChangeText={(v) => handleChange('name', v)}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
          returnKeyType="next"
          autoCapitalize="sentences"
          accessibilityLabel="Food name"
        />
      </View>

      {/* Serving size */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Serving size</Text>
        <TextInput
          style={inputStyle('servingDescription')}
          placeholder="e.g. 1 cup, 100g"
          placeholderTextColor={colors.textDisabled}
          value={form.servingDescription}
          onChangeText={(v) => handleChange('servingDescription', v)}
          onFocus={() => setFocusedField('servingDescription')}
          onBlur={() => setFocusedField(null)}
          returnKeyType="next"
          autoCapitalize="none"
          accessibilityLabel="Serving size"
        />
      </View>

      {/* Numeric row: protein (required), fiber, calories */}
      <View style={styles.numericRow}>
        <View style={[styles.fieldGroup, styles.numericFieldRequired]}>
          <Text style={styles.label}>Protein (g) *</Text>
          <TextInput
            style={inputStyle('proteinG')}
            placeholder="0"
            placeholderTextColor={colors.textDisabled}
            value={form.proteinG}
            onChangeText={(v) => handleChange('proteinG', v)}
            onFocus={() => setFocusedField('proteinG')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
            returnKeyType="next"
            accessibilityLabel="Protein in grams"
          />
        </View>

        <View style={[styles.fieldGroup, styles.numericField]}>
          <Text style={styles.label}>Fiber (g)</Text>
          <TextInput
            style={inputStyle('fiberG')}
            placeholder="—"
            placeholderTextColor={colors.textDisabled}
            value={form.fiberG}
            onChangeText={(v) => handleChange('fiberG', v)}
            onFocus={() => setFocusedField('fiberG')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
            returnKeyType="next"
            accessibilityLabel="Fiber in grams (optional)"
          />
        </View>

        <View style={[styles.fieldGroup, styles.numericField]}>
          <Text style={styles.label}>Cal (kcal)</Text>
          <TextInput
            style={inputStyle('caloriesKcal')}
            placeholder="—"
            placeholderTextColor={colors.textDisabled}
            value={form.caloriesKcal}
            onChangeText={(v) => handleChange('caloriesKcal', v)}
            onFocus={() => setFocusedField('caloriesKcal')}
            onBlur={() => setFocusedField(null)}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Calories in kcal (optional)"
          />
        </View>
      </View>

      {/* Submit button */}
      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          !hasProtein && styles.submitButtonEmpty,
          pressed && isValid && !isLoading && styles.submitButtonPressed,
        ]}
        onPress={handleSubmit}
        disabled={!isValid || isLoading}
        accessibilityRole="button"
        accessibilityLabel="Add food entry"
        accessibilityState={{ disabled: !isValid || isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>Add to log</Text>
        )}
      </Pressable>
    </View>
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
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      ...shadows.sm,
    },
    fieldGroup: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      letterSpacing: 0.2,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.gray50,
    },
    inputFocused: {
      borderColor: colors.borderFocus,
      backgroundColor: colors.surface,
    },
    numericRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    numericField: {
      flex: 1,
    },
    numericFieldRequired: {
      flex: 1.2,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    submitButtonEmpty: {
      backgroundColor: colors.gray200,
    },
    submitButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
    submitButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
