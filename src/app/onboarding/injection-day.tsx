import type { GlipraTokens } from '@/theme/tokens';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ChoiceChip } from '@/features/onboarding/components/choice-chip';
import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { useTheme } from '@/lib/ThemeContext';

type Frequency = 'weekly' | 'biweekly' | 'daily';

const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Biweekly' },
  { id: 'daily', label: 'Daily' },
];

const DAYS: { label: string; value: number }[] = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** 12-hour AM/PM label for an hour 0-23. Stored value stays 24h "HH:00". */
function hourLabel(h: number): string {
  return format(new Date(2000, 0, 1, h, 0), 'h:mm a');
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2)
    return digits;
  if (digits.length <= 4)
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function parseMdyToIso(mdy: string): string | null {
  const parts = mdy.split('/');
  if (parts.length !== 3)
    return null;
  const [mm, dd, yyyy] = parts;
  if (!mm || !dd || !yyyy || yyyy.length < 4)
    return null;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    return null;
  return iso;
}

export default function InjectionDayScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();
  const formData = useOnboardingStore.use.formData();
  const isOral = formData.administrationRoute === 'oral';

  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [lastInjectionDate, setLastInjectionDate] = useState('');
  const [doseHour, setDoseHour] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');

  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing, radius }), [colors, spacing, radius]);

  const needsDayPicker = frequency === 'weekly' || frequency === 'biweekly';
  const isoDate = parseMdyToIso(lastInjectionDate);
  const injCanProceed
    = frequency !== null && (frequency === 'daily' || dayOfWeek !== null) && isoDate !== null;

  const isoStartDate = parseMdyToIso(startDate);
  const oralCanProceed = doseHour !== null && isoStartDate !== null;
  const canProceed = isOral ? oralCanProceed : injCanProceed;

  const handleNext = () => {
    if (!canProceed)
      return;
    if (isOral) {
      const hh = String(doseHour).padStart(2, '0');
      setFormData({
        injectionFrequency: 'daily',
        doseTimeLocal: `${hh}:00`,
        medicationStartDate: isoStartDate ?? undefined,
      });
    }
    else {
      if (!frequency || !isoDate)
        return;
      setFormData({
        injectionFrequency: frequency,
        injectionDayOfWeek: needsDayPicker && dayOfWeek !== null ? dayOfWeek : undefined,
        lastInjectionDate: isoDate,
      });
    }
    router.push('/onboarding/body');
  };

  return (
    <OnboardingScaffold
      step={{ current: 2, total: 7 }}
      title={isOral ? 'When do you take your tablet?' : 'When do you inject?'}
      subtitle={isOral
        ? 'We use this to send your daily dose reminder and track your progress.'
        : 'We use this to track your injection cycle and personalize daily guidance.'}
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
      {isOral
        ? (
            <>
              <Text style={styles.sectionLabel}>PREFERRED DOSE TIME</Text>
              <Text style={styles.helperText}>
                Choose the time you plan to take your tablet each morning. Your prescriber may have given you a specific time.
              </Text>
              <View style={styles.grid}>
                {HOURS.map(h => (
                  <ChoiceChip
                    key={h}
                    label={hourLabel(h)}
                    selected={doseHour === h}
                    onPress={() => setDoseHour(h)}
                  />
                ))}
              </View>

              <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>DATE YOU STARTED THIS MEDICATION</Text>
              <TextInput
                style={[styles.textInput, startDate.length > 0 && isoStartDate === null && styles.textInputError]}
                value={startDate}
                onChangeText={text => setStartDate(formatDateInput(text))}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                maxLength={10}
                accessibilityLabel="Medication start date"
              />
              {startDate.length > 0 && isoStartDate === null && (
                <Text style={styles.errorText}>Enter a valid date (MM/DD/YYYY)</Text>
              )}
            </>
          )
        : (
            <>
              <Text style={styles.sectionLabel}>INJECTION FREQUENCY</Text>
              <View style={styles.row}>
                {FREQUENCIES.map(f => (
                  <ChoiceChip
                    key={f.id}
                    label={f.label}
                    selected={frequency === f.id}
                    onPress={() => {
                      setFrequency(f.id);
                      if (f.id === 'daily')
                        setDayOfWeek(null);
                    }}
                  />
                ))}
              </View>

              {needsDayPicker && (
                <>
                  <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>INJECTION DAY</Text>
                  <View style={styles.grid}>
                    {DAYS.map(d => (
                      <ChoiceChip
                        key={d.value}
                        label={d.label}
                        selected={dayOfWeek === d.value}
                        onPress={() => setDayOfWeek(d.value)}
                      />
                    ))}
                  </View>
                </>
              )}

              <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>LAST INJECTION DATE</Text>
              <TextInput
                style={[styles.textInput, lastInjectionDate.length > 0 && isoDate === null && styles.textInputError]}
                value={lastInjectionDate}
                onChangeText={text => setLastInjectionDate(formatDateInput(text))}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                maxLength={10}
                accessibilityLabel="Last injection date"
              />
              {lastInjectionDate.length > 0 && isoDate === null && (
                <Text style={styles.errorText}>Enter a valid date (MM/DD/YYYY)</Text>
              )}
            </>
          )}
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
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    sectionLabelTop: {
      marginTop: spacing.lg,
    },
    helperText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
      marginTop: -spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
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
  });
}
