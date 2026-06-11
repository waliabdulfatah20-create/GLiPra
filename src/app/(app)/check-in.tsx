import type { GlipraTokens } from '@/theme/tokens';
import { format } from 'date-fns';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { RatingSlider } from '@/components/check-in/rating-slider';
import { WaterGlass } from '@/components/check-in/water-glass';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useTodayCheckIn, useUpsertCheckIn } from '@/features/check-in/hooks';
import { useInsertWeightLog, useWeightLogs } from '@/features/weight/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import { kgToLbs, lbsToKg, useWeightUnit } from '@/lib/unit-preference';

const WATER_DROPS = 8; // 8 × 250 ml = 2000 ml max (easy UI)
const WATER_DROP_ML = 250;

export default function CheckInScreen() {
  const { t } = useTranslation();
  const { checkIn, isLoading: checkInLoading } = useTodayCheckIn();
  const { mutate, isLoading: submitting, isSuccess } = useUpsertCheckIn();
  const { mutate: logWeight } = useInsertWeightLog();
  const { logs: weightLogs } = useWeightLogs();
  const { unit: weightUnit } = useWeightUnit();

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const [nausea, setNausea] = React.useState<number>(1);
  const [energy, setEnergy] = React.useState<number>(3);
  const [waterDrops, setWaterDrops] = React.useState<number>(0);
  const [notes, setNotes] = React.useState<string>('');
  const [weightInput, setWeightInput] = React.useState<string>('');
  const [hydrated, setHydrated] = React.useState(false);

  // Pre-fill with existing check-in when loaded
  React.useEffect(() => {
    if (checkIn && !hydrated) {
      setNausea(checkIn.nausea);
      setEnergy(checkIn.energy);
      setWaterDrops(Math.round(checkIn.waterMl / WATER_DROP_ML));
      setNotes(checkIn.notes ?? '');
      setHydrated(true);
    }
  }, [checkIn, hydrated]);

  // Navigate back after successful save
  React.useEffect(() => {
    if (isSuccess) {
      haptics.success();
      router.back();
    }
  }, [isSuccess]);

  const waterMl = waterDrops * WATER_DROP_ML;
  const lastWeightKg = weightLogs.length > 0
    ? weightLogs[weightLogs.length - 1].weightKg
    : null;

  function incWater() {
    haptics.selection();
    setWaterDrops(d => Math.min(WATER_DROPS, d + 1));
  }
  function decWater() {
    haptics.selection();
    setWaterDrops(d => Math.max(0, d - 1));
  }

  function handleSubmit() {
    haptics.medium();
    // Log weight first if a valid value was entered (optional field)
    const parsedWeight = Number.parseFloat(weightInput);
    if (!Number.isNaN(parsedWeight) && parsedWeight > 0) {
      // Always store in kg — convert if user entered lbs
      const weightKg = weightUnit === 'lbs' ? lbsToKg(parsedWeight) : parsedWeight;
      logWeight({ weightKg });
    }
    mutate({ nausea, energy, waterMl, notes: notes.trim() || undefined });
  }

  const todayLabel = format(new Date(), 'MMMM d');
  const isUpdate = checkIn !== null;

  if (checkInLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>{t('checkin.back')}</Text>
          </Pressable>
          <Text style={styles.title}>{t('checkin.title')}</Text>
          <Text style={styles.dateLabel}>{todayLabel}</Text>
        </View>

        {/* Nausea rating */}
        <View style={styles.card}>
          <RatingSlider
            label={t('checkin.nausea_label')}
            value={nausea}
            onChange={setNausea}
            lowLabel={t('checkin.nausea_low')}
            highLabel={t('checkin.nausea_high')}
            tone="severity"
          />

          {/* Energy rating */}
          <RatingSlider
            label={t('checkin.energy_label')}
            value={energy}
            onChange={setEnergy}
            lowLabel={t('checkin.energy_low')}
            highLabel={t('checkin.energy_high')}
            tone="positive"
          />
        </View>

        {/* Water intake */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('checkin.water_label')}</Text>
          <Text style={styles.waterTotal}>
            {t('checkin.water_count', { ml: waterMl, drops: waterDrops, total: WATER_DROPS })}
          </Text>
          <View style={styles.waterRow}>
            <Pressable
              style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
              onPress={decWater}
              disabled={waterDrops <= 0}
              accessibilityRole="button"
              accessibilityLabel="Remove a glass of water"
            >
              <Text style={[styles.stepperText, waterDrops <= 0 && styles.stepperTextDisabled]}>−</Text>
            </Pressable>
            <WaterGlass filled={waterDrops} total={WATER_DROPS} />
            <Pressable
              style={({ pressed }) => [styles.stepperButton, pressed && styles.stepperButtonPressed]}
              onPress={incWater}
              disabled={waterDrops >= WATER_DROPS}
              accessibilityRole="button"
              accessibilityLabel="Add a glass of water"
            >
              <Text style={[styles.stepperText, waterDrops >= WATER_DROPS && styles.stepperTextDisabled]}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Morning weight (optional) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Morning weight (optional,
            {' '}
            {weightUnit}
            )
          </Text>
          <View style={styles.weightRow}>
            <TextInput
              style={styles.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder={
                lastWeightKg != null
                  ? weightUnit === 'lbs'
                    ? `${kgToLbs(lastWeightKg).toFixed(1)}`
                    : `${lastWeightKg.toFixed(1)}`
                  : weightUnit === 'lbs'
                    ? '154.0'
                    : '70.0'
              }
              placeholderTextColor={colors.textDisabled}
              keyboardType="decimal-pad"
              returnKeyType="done"
              accessibilityLabel={`Morning weight in ${weightUnit}`}
            />
            <Text style={styles.weightUnit}>{weightUnit}</Text>
          </View>
          {lastWeightKg != null && !weightInput && (
            <Text style={styles.weightHint}>
              Last logged:
              {' '}
              {weightUnit === 'lbs'
                ? `${kgToLbs(lastWeightKg).toFixed(1)} lbs`
                : `${lastWeightKg.toFixed(1)} kg`}
            </Text>
          )}
        </View>

        {/* Optional notes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('checkin.notes_label')}</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('checkin.notes_placeholder')}
            placeholderTextColor={colors.textDisabled}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Check-in notes"
          />
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={isUpdate ? 'Update check-in' : 'Save check-in'}
        >
          {submitting
            ? (
                <ActivityIndicator color={colors.white} />
              )
            : (
                <Text style={styles.submitButtonText}>
                  {isUpdate ? t('checkin.submit_update') : t('checkin.submit_save')}
                </Text>
              )}
        </Pressable>

        {/* Disclaimer */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>{t('checkin.disclaimer')}</Text>
        </DisclaimerBanner>
      </ScrollView>
    </SafeAreaView>
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
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    // Header
    header: {
      marginBottom: spacing.lg,
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
    },
    backButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    dateLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Cards
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },

    // Water drops
    waterTotal: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    waterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xl,
      marginTop: spacing.xs,
    },
    stepperButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.gray100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepperButtonPressed: {
      backgroundColor: colors.gray200,
    },
    stepperText: {
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '500',
      color: colors.primary,
    },
    stepperTextDisabled: {
      color: colors.textDisabled,
    },

    // Weight
    weightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 48,
      backgroundColor: colors.gray50,
      gap: spacing.xs,
    },
    weightInput: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      height: 48,
    },
    weightUnit: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    weightHint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },

    // Notes
    notesInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 14,
      color: colors.textPrimary,
      minHeight: 90,
      backgroundColor: colors.gray50,
    },

    // Submit
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
      ...shadows.md,
    },
    submitButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },

    // Disclaimer
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
