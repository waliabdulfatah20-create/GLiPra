// "Change medication" — in-app GLP-1 medication / route switch (tablets <-> injection).
// A doctor switching a patient must never be a reason to delete the app: this flow
// re-routes the whole app (administration_route) while keeping the account, the
// subscription, and ALL progress (streak, weight, food, check-ins, muscle score).
//
// Guided 3 steps in one screen: pick medication -> route-specific schedule ->
// confirm (starting/active + reassurance + Tier-2 disclaimer). Reuses the onboarding
// OptionCard / ChoiceChip and the standalone-editor header/footer pattern.
// Lives in features/ (co-located test); the app route is a thin re-export.

import type { MedicationStatus } from '@/features/today/api';
import type { GlipraTokens } from '@/theme/tokens';
import type { GLP1MedicationId } from '@/types';
import { format } from 'date-fns';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { formatDateInput, isNotFuture, parseMdyToIso } from '@/features/medication/date-input';
import { getMedicationBrand, getMedicationRoute, MEDICATIONS } from '@/features/medication/medications';
import { ChoiceChip } from '@/features/onboarding/components/choice-chip';
import { OptionCard } from '@/features/onboarding/components/option-card';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useTodayProfile } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import { useChangeMedication } from './hooks';

type Frequency = 'weekly' | 'biweekly' | 'daily';

const FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'daily'];
const DAYS = [0, 1, 2, 3, 4, 5, 6];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const STATUSES: MedicationStatus[] = ['starting', 'active'];

function hourLabel(h: number): string {
  return format(new Date(2000, 0, 1, h, 0), 'h:mm a');
}
function dayLabel(v: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][v] ?? '';
}

export function ChangeMedicationScreen() {
  const { t } = useTranslation();
  const { data: profile } = useTodayProfile();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing, radius }), [colors, spacing, radius]);
  const { mutate, isLoading, isSuccess } = useChangeMedication();

  // Today as ISO + MM/DD/YYYY — used to default the last-injection field and to
  // reject a future last-injection date (which would break the cycle phase math).
  const todayIso = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [medId, setMedId] = React.useState<GLP1MedicationId | null>(null);

  // Schedule (injection)
  const [frequency, setFrequency] = React.useState<Frequency | null>(null);
  const [dayOfWeek, setDayOfWeek] = React.useState<number | null>(null);
  const [lastInjectionDate, setLastInjectionDate] = React.useState(() => format(new Date(), 'MM/dd/yyyy'));
  // Schedule (oral)
  const [doseHour, setDoseHour] = React.useState<number | null>(null);
  const [startDate, setStartDate] = React.useState('');
  // Confirm
  const [status, setStatus] = React.useState<MedicationStatus | null>(null);

  // Prefill the current medication once the profile loads.
  React.useEffect(() => {
    if (profile?.medicationId && medId === null)
      setMedId(profile.medicationId as GLP1MedicationId);
  }, [profile?.medicationId]);

  // Close the screen once the switch has saved.
  React.useEffect(() => {
    if (isSuccess)
      router.back();
  }, [isSuccess]);

  const route = medId ? getMedicationRoute(medId) : 'injection';
  const isOral = route === 'oral';

  const needsDayPicker = frequency === 'weekly' || frequency === 'biweekly';
  const isoLast = parseMdyToIso(lastInjectionDate);
  const isoStart = parseMdyToIso(startDate);
  // A future last-injection date poisons the cycle phase math, so it is invalid.
  const lastInjectionValid = isoLast !== null && isNotFuture(isoLast, todayIso);
  const scheduleValid = isOral
    ? doseHour !== null && isoStart !== null
    : frequency !== null && (frequency === 'daily' || dayOfWeek !== null) && lastInjectionValid;

  function handleSave() {
    if (!medId || status === null || isLoading)
      return;
    haptics.medium();
    if (isOral) {
      if (doseHour === null || !isoStart)
        return;
      mutate({
        medicationId: medId,
        status,
        schedule: {
          route: 'oral',
          doseTimeLocal: `${String(doseHour).padStart(2, '0')}:00`,
          medicationStartDate: isoStart,
        },
      });
    }
    else {
      if (!frequency || isoLast === null || !lastInjectionValid)
        return;
      mutate({
        medicationId: medId,
        status,
        schedule: {
          route: 'injection',
          frequency,
          dayOfWeek: needsDayPicker ? dayOfWeek : null,
          lastInjectionDate: isoLast,
        },
      });
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (step === 1 ? router.back() : setStep(s => (s - 1) as 1 | 2 | 3))}
          accessibilityRole="button"
          accessibilityLabel={t('change_med.back')}
        >
          <Text style={styles.backText}>{`‹ ${t('change_med.back')}`}</Text>
        </Pressable>
        <Text style={styles.title}>{t('change_med.title')}</Text>
        <Text style={styles.stepText}>{`${step}/3`}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <>
            <Text style={styles.subheading}>{t('change_med.pick_subtitle')}</Text>
            {MEDICATIONS.map(med => (
              <OptionCard
                key={med.id}
                title={med.brand}
                subtitle={med.molecule}
                selected={medId === med.id}
                onPress={() => setMedId(med.id)}
                testID={`med-option-${med.id}`}
              />
            ))}
          </>
        )}

        {step === 2 && isOral && (
          <>
            <Text style={styles.sectionLabel}>{t('change_med.dose_time')}</Text>
            <View style={styles.grid}>
              {HOURS.map(h => (
                <ChoiceChip key={h} label={hourLabel(h)} selected={doseHour === h} onPress={() => setDoseHour(h)} />
              ))}
            </View>
            <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>{t('change_med.start_date')}</Text>
            <TextInput
              style={[styles.textInput, startDate.length > 0 && isoStart === null && styles.textInputError]}
              value={startDate}
              onChangeText={text => setStartDate(formatDateInput(text))}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numeric"
              maxLength={10}
              accessibilityLabel={t('change_med.start_date')}
            />
          </>
        )}

        {step === 2 && !isOral && (
          <>
            <Text style={styles.sectionLabel}>{t('change_med.frequency')}</Text>
            <View style={styles.row}>
              {FREQUENCIES.map(f => (
                <ChoiceChip
                  key={f}
                  label={t(`change_med.freq_${f}`)}
                  selected={frequency === f}
                  onPress={() => {
                    setFrequency(f);
                    if (f === 'daily')
                      setDayOfWeek(null);
                  }}
                />
              ))}
            </View>
            {needsDayPicker && (
              <>
                <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>{t('change_med.injection_day')}</Text>
                <View style={styles.grid}>
                  {DAYS.map(d => (
                    <ChoiceChip key={d} label={dayLabel(d)} selected={dayOfWeek === d} onPress={() => setDayOfWeek(d)} />
                  ))}
                </View>
              </>
            )}
            <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>{t('change_med.last_injection')}</Text>
            <TextInput
              style={[styles.textInput, lastInjectionDate.length > 0 && !lastInjectionValid && styles.textInputError]}
              value={lastInjectionDate}
              onChangeText={text => setLastInjectionDate(formatDateInput(text))}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numeric"
              maxLength={10}
              accessibilityLabel={t('change_med.last_injection')}
            />
            <Text style={styles.helperText}>{t('change_med.last_injection_help')}</Text>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.sectionLabel}>{t('change_med.status_q')}</Text>
            {STATUSES.map(s => (
              <OptionCard
                key={s}
                title={t(`change_med.status_${s}`)}
                subtitle={t(`change_med.status_${s}_desc`)}
                selected={status === s}
                onPress={() => setStatus(s)}
                testID={`status-option-${s}`}
              />
            ))}

            <View style={styles.reassureCard}>
              <Text style={styles.reassureTitle}>
                {t('change_med.keep_title', { brand: medId ? getMedicationBrand(medId) : '' })}
              </Text>
              <Text style={styles.reassureBody}>{t('change_med.keep_body')}</Text>
            </View>

            <DisclaimerBanner tier={2}>
              <Text style={styles.disclaimerText}>{t('change_med.disclaimer')}</Text>
            </DisclaimerBanner>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < 3
          ? (
              <StepFooter
                primaryLabel={t('change_med.next')}
                onPrimary={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                primaryDisabled={step === 1 ? medId === null : !scheduleValid}
              />
            )
          : (
              <Pressable
                style={[styles.saveButton, (status === null || isLoading) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={status === null || isLoading}
                accessibilityRole="button"
                accessibilityLabel={t('change_med.save')}
                testID="change-med-save"
              >
                <Text style={[styles.saveButtonText, (status === null || isLoading) && styles.saveButtonTextDisabled]}>
                  {isLoading ? t('change_med.saving') : t('change_med.save')}
                </Text>
              </Pressable>
            )}
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
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backText: { fontSize: 17, color: colors.primary, width: 70 },
    title: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
    stepText: { width: 70, fontSize: 13, color: colors.textSecondary, textAlign: 'right' },
    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    subheading: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    sectionLabelTop: { marginTop: spacing.lg },
    row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
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
    textInputError: { borderColor: colors.error },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      lineHeight: 17,
    },
    reassureCard: {
      backgroundColor: colors.successLight,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    reassureTitle: { fontSize: 14, fontWeight: '700', color: colors.success, marginBottom: 4 },
    reassureBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    disclaimerText: { fontSize: 11, color: colors.textDisabled, lineHeight: 16 },
    footer: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    saveButton: { paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
    saveButtonDisabled: { backgroundColor: colors.gray200 },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
    saveButtonTextDisabled: { color: colors.textDisabled },
  });
}
