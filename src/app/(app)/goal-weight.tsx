// Goal Weight edit screen — accessible from Settings > Body Metrics.
// Saves goal_weight_kg to the profiles table. Optional field.

import type { GlipraTokens } from '@/theme/tokens';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useTodayProfile } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import { formatWeight, kgToLbs, lbsToKg, useWeightUnit } from '@/lib/unit-preference';

function parsePositiveNumber(value: string): number | null {
  const num = Number.parseFloat(value);
  if (Number.isNaN(num) || num <= 0)
    return null;
  return num;
}

export default function GoalWeightScreen() {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const { data: profile } = useTodayProfile();
  const { unit: weightUnit, toggle: toggleWeightUnit } = useWeightUnit();

  // Pre-populate from existing profile value
  const [goalText, setGoalText] = React.useState(() => {
    const kg = profile?.goalWeightKg;
    if (!kg)
      return '';
    const displayed = weightUnit === 'lbs' ? kgToLbs(kg) : kg;
    return String(displayed);
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const goalRaw = parsePositiveNumber(goalText);
  const showError = goalText.length > 0 && goalRaw === null;

  async function handleSave() {
    haptics.medium();
    if (!session?.user.id)
      return;
    setIsSaving(true);

    const goalWeightKg
      = goalRaw !== null
        ? weightUnit === 'lbs'
          ? lbsToKg(goalRaw)
          : goalRaw
        : null;

    await supabase
      .from('profiles')
      .update({ goal_weight_kg: goalWeightKg })
      .eq('user_id', session.user.id);

    await queryClient.invalidateQueries({ queryKey: ['today-profile'] });
    setIsSaving(false);
    router.back();
  }

  async function handleClear() {
    haptics.warning();
    if (!session?.user.id)
      return;
    setIsSaving(true);
    setGoalText('');

    await supabase
      .from('profiles')
      .update({ goal_weight_kg: null })
      .eq('user_id', session.user.id);

    await queryClient.invalidateQueries({ queryKey: ['today-profile'] });
    setIsSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Goal Weight</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.body}>
          {profile?.goalWeightKg != null && (
            <Text style={styles.currentValue}>
              Current:
              {' '}
              {formatWeight(profile.goalWeightKg, weightUnit)}
            </Text>
          )}

          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>GOAL WEIGHT</Text>
            <UnitToggle
              options={['lbs', 'kg']}
              active={weightUnit}
              onToggle={toggleWeightUnit}
            />
          </View>

          <TextInput
            style={[styles.input, showError && styles.inputError]}
            value={goalText}
            onChangeText={setGoalText}
            placeholder={weightUnit === 'lbs' ? 'e.g. 160' : 'e.g. 72'}
            placeholderTextColor={colors.textDisabled}
            keyboardType="decimal-pad"
            returnKeyType="done"
            autoFocus
            accessibilityLabel={`Goal weight in ${weightUnit}`}
          />
          {showError && (
            <Text style={styles.errorText}>Enter a valid weight greater than 0</Text>
          )}

          <Text style={styles.hint}>
            Used to calculate your "To Goal" metric in Progress. Optional.
          </Text>

          <Pressable
            style={[styles.saveButton, (!goalRaw || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!goalRaw || isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save goal weight"
          >
            <Text style={[styles.saveButtonText, (!goalRaw || isSaving) && styles.saveButtonTextDisabled]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>

          {profile?.goalWeightKg != null && (
            <Pressable
              style={styles.clearButton}
              onPress={handleClear}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Clear goal weight"
            >
              <Text style={styles.clearButtonText}>Clear goal weight</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
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
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
      minWidth: 60,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    headerSpacer: {
      minWidth: 60,
    },
    body: {
      padding: spacing.lg,
    },
    currentValue: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
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
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },
    inputError: {
      borderColor: colors.error,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: spacing.xs,
    },
    hint: {
      fontSize: 12,
      color: colors.textDisabled,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      lineHeight: 18,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    saveButtonDisabled: {
      backgroundColor: colors.gray200,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
    saveButtonTextDisabled: {
      color: colors.textDisabled,
    },
    clearButton: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    clearButtonText: {
      fontSize: 14,
      color: colors.error,
      fontWeight: '500',
    },
  });
}
