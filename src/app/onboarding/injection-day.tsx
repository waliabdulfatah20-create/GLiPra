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
import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { haptics } from '@/lib/haptics';
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

/**
 * Auto-format a raw digit string into MM/DD/YYYY as the user types.
 * Strips non-digits first, then inserts slashes at positions 2 and 4.
 */
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2)
    return digits;
  if (digits.length <= 4)
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Convert MM/DD/YYYY display string to ISO YYYY-MM-DD.
 * Returns null if the value is incomplete or invalid.
 */
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

  // ── Injectable state ─────────────────────────────────────────────────────────
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [lastInjectionDate, setLastInjectionDate] = useState('');

  // ── Oral state ───────────────────────────────────────────────────────────────
  // doseHour: "HH" string 00-23 (we build HH:mm from this for storage)
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const [doseHour, setDoseHour] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');

  const { colors, spacing, radius, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  // ── Injectable validation ────────────────────────────────────────────────────
  const needsDayPicker = frequency === 'weekly' || frequency === 'biweekly';
  const isoDate = parseMdyToIso(lastInjectionDate);
  const injCanProceed
    = frequency !== null
      && (frequency === 'daily' || dayOfWeek !== null)
      && isoDate !== null;

  // ── Oral validation ──────────────────────────────────────────────────────────
  const isoStartDate = parseMdyToIso(startDate);
  const oralCanProceed = doseHour !== null && isoStartDate !== null;

  const canProceed = isOral ? oralCanProceed : injCanProceed;

  const handleNext = () => {
    if (!canProceed)
      return;
    haptics.medium();
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <StepProgress current={2} total={10} onDark />
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
          <Text style={styles.heading}>
            {isOral ? 'When do you take your tablet?' : 'When do you inject?'}
          </Text>
          <Text style={styles.subheading}>
            {isOral
              ? 'We use this to send your daily dose reminder and track your progress.'
              : 'We use this to track your injection cycle and personalize daily guidance.'}
          </Text>
        </LinearGradient>

        {isOral
          ? (
              <>
                {/* Oral: preferred dose hour */}
                <Text style={styles.sectionLabel}>PREFERRED DOSE TIME</Text>
                <Text style={styles.helperText}>
                  Choose the time you plan to take your tablet each morning. Your prescriber may have given you a specific time.
                </Text>
                <View style={styles.hoursGrid}>
                  {HOURS.map((h) => {
                    const isSelected = doseHour === h;
                    const label = `${String(h).padStart(2, '0')}:00`;
                    return (
                      <Pressable
                        key={h}
                        style={[styles.hourPill, isSelected && styles.hourPillSelected]}
                        onPress={() => setDoseHour(h)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Text style={[styles.hourPillText, isSelected && styles.hourPillTextSelected]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Oral: start date */}
                <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                  DATE YOU STARTED THIS MEDICATION
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    startDate.length > 0 && isoStartDate === null && styles.textInputError,
                  ]}
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
                {/* Injectable: frequency selector */}
                <Text style={styles.sectionLabel}>INJECTION FREQUENCY</Text>
                <View style={styles.frequencyRow}>
                  {FREQUENCIES.map((f) => {
                    const isSelected = frequency === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        style={[styles.frequencyCard, isSelected && styles.frequencyCardSelected]}
                        onPress={() => {
                          setFrequency(f.id);
                          if (f.id === 'daily')
                            setDayOfWeek(null);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Text
                          style={[
                            styles.frequencyCardText,
                            isSelected && styles.frequencyCardTextSelected,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Injectable: day-of-week picker */}
                {needsDayPicker && (
                  <>
                    <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                      INJECTION DAY
                    </Text>
                    <View style={styles.daysRow}>
                      {DAYS.map((d) => {
                        const isSelected = dayOfWeek === d.value;
                        return (
                          <Pressable
                            key={d.value}
                            style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                            onPress={() => setDayOfWeek(d.value)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: isSelected }}
                          >
                            <Text
                              style={[styles.dayPillText, isSelected && styles.dayPillTextSelected]}
                            >
                              {d.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Injectable: last injection date */}
                <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                  LAST INJECTION DATE
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    lastInjectionDate.length > 0 && isoDate === null && styles.textInputError,
                  ]}
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
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: spacing.sm,
    },
    frequencyRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    frequencyCard: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    frequencyCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    frequencyCardText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    frequencyCardTextSelected: {
      color: colors.primary,
    },
    daysRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    dayPill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      minWidth: 40,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    dayPillSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    dayPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    dayPillTextSelected: {
      color: colors.white,
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
    helperText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    hoursGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    hourPill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      minWidth: 52,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    hourPillSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    hourPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    hourPillTextSelected: {
      color: colors.primary,
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
