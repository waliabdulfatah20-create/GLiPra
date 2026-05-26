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

import { LinearGradient } from 'expo-linear-gradient';
import { StepProgress } from '@/features/onboarding/components/step-progress';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

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
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Convert MM/DD/YYYY display string to ISO YYYY-MM-DD.
 * Returns null if the value is incomplete or invalid.
 */
function parseMdyToIso(mdy: string): string | null {
  const parts = mdy.split('/');
  if (parts.length !== 3) return null;
  const [mm, dd, yyyy] = parts;
  if (!mm || !dd || !yyyy || yyyy.length < 4) return null;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  return iso;
}

export default function InjectionDayScreen() {
  const router = useRouter();
  const setFormData = useOnboardingStore.use.setFormData();

  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [lastInjectionDate, setLastInjectionDate] = useState('');

  const { colors, spacing, radius, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius]
  );

  const needsDayPicker = frequency === 'weekly' || frequency === 'biweekly';

  const isoDate = parseMdyToIso(lastInjectionDate);

  const canProceed =
    frequency !== null &&
    (frequency === 'daily' || dayOfWeek !== null) &&
    isoDate !== null;

  const handleNext = () => {
    if (!frequency || !isoDate) return;
    haptics.medium();
    setFormData({
      injectionFrequency: frequency,
      injectionDayOfWeek: needsDayPicker && dayOfWeek !== null ? dayOfWeek : undefined,
      lastInjectionDate: isoDate,
    });
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
          <Text style={styles.heading}>When do you inject?</Text>
          <Text style={styles.subheading}>
            We use this to track your injection cycle and personalize daily guidance.
          </Text>
        </LinearGradient>

        {/* Frequency selector */}
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
                  if (f.id === 'daily') setDayOfWeek(null);
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

        {/* Day-of-week picker */}
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

        {/* Last injection date */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
          LAST INJECTION DATE
        </Text>
        <TextInput
          style={[
            styles.textInput,
            lastInjectionDate.length > 0 && isoDate === null && styles.textInputError,
          ]}
          value={lastInjectionDate}
          onChangeText={(text) => setLastInjectionDate(formatDateInput(text))}
          placeholder="MM/DD/YYYY"
          placeholderTextColor={colors.textDisabled}
          keyboardType="numeric"
          maxLength={10}
          accessibilityLabel="Last injection date"
        />
        {lastInjectionDate.length > 0 && isoDate === null && (
          <Text style={styles.errorText}>Enter a valid date (MM/DD/YYYY)</Text>
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

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

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
