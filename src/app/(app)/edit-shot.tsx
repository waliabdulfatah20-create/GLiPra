import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PainLevelSlider } from '@/components/injection-sites/pain-level-slider';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { Select } from '@/components/ui/select';
import {
  SITE_OPTIONS,
  type SiteCode,
} from '@/features/injection-sites/constants';
import {
  useDeleteInjectionSite,
  useInjectionLogs,
  useUpdateInjectionSite,
} from '@/features/injection-sites/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';
import type { GLP1MedicationId } from '@/types';

const MEDICATION_DISPLAY_NAMES: Record<GLP1MedicationId, string> = {
  semaglutide_ozempic: 'Ozempic',
  semaglutide_wegovy: 'Wegovy',
  tirzepatide_mounjaro: 'Mounjaro',
  tirzepatide_zepbound: 'Zepbound',
  liraglutide_saxenda: 'Saxenda',
  liraglutide_victoza: 'Victoza',
  dulaglutide_trulicity: 'Trulicity',
  compounded_semaglutide: 'Compounded Semaglutide',
  compounded_tirzepatide: 'Compounded Tirzepatide',
  compounded_glp1_gip: 'Compounded GLP-1/GIP',
};

const MEDICATION_OPTIONS = Object.values(MEDICATION_DISPLAY_NAMES).map(
  (name) => ({ label: name, value: name }),
);

const DOSAGE_OPTIONS_BY_MEDICATION: Record<string, string[]> = {
  'Ozempic':                ['0.25 mg', '0.5 mg', '1 mg', '2 mg'],
  'Wegovy':                 ['0.25 mg', '0.5 mg', '1 mg', '1.7 mg', '2.4 mg'],
  'Mounjaro':               ['2.5 mg', '5 mg', '7.5 mg', '10 mg', '12.5 mg', '15 mg'],
  'Zepbound':               ['2.5 mg', '5 mg', '7.5 mg', '10 mg', '12.5 mg', '15 mg'],
  'Saxenda':                ['0.6 mg', '1.2 mg', '1.8 mg', '2.4 mg', '3 mg'],
  'Victoza':                ['0.6 mg', '1.2 mg', '1.8 mg'],
  'Trulicity':              ['0.75 mg', '1.5 mg', '3 mg', '4.5 mg'],
  'Compounded Semaglutide': ['0.25 mg', '0.5 mg', '1 mg', '1.5 mg', '2 mg', '2.5 mg'],
  'Compounded Tirzepatide': ['2.5 mg', '5 mg', '7.5 mg', '10 mg', '12.5 mg', '15 mg'],
  'Compounded GLP-1/GIP':   ['2.5 mg', '5 mg', '7.5 mg', '10 mg'],
};

/**
 * Merge a date (year/month/day) and a separate time (hours/minutes) into a
 * single Date. Uses date-fns setters — no raw Date arithmetic (Rule 6).
 */
function combineDateAndTime(date: Date, time: Date): Date {
  let merged = setHours(date, time.getHours());
  merged = setMinutes(merged, time.getMinutes());
  merged = setSeconds(merged, 0);
  return merged;
}

export default function EditShotScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logs, isLoading } = useInjectionLogs();
  const log = logs.find((l) => l.id === id) ?? null;

  const { mutate: updateShot, isPending: isUpdating } = useUpdateInjectionSite();
  const { mutate: deleteShot, isPending: isDeleting } = useDeleteInjectionSite();
  const isPending = isUpdating || isDeleting;

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Form state — defaults, filled once the log arrives from cache
  const [date, setDate] = React.useState<Date>(new Date());
  const [time, setTime] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [medication, setMedication] = React.useState('');
  const [dosageStrength, setDosageStrength] = React.useState('');
  const [siteCode, setSiteCode] = React.useState<SiteCode | ''>('');
  const [painLevel, setPainLevel] = React.useState(0);
  const [notes, setNotes] = React.useState('');
  const [initialized, setInitialized] = React.useState(false);

  // Pre-fill once the log arrives (usually from React Query cache — no network call)
  React.useEffect(() => {
    if (log && !initialized) {
      const parsed = parseISO(log.injected_at);
      setDate(parsed);
      setTime(parsed);
      setMedication(log.medication_name ?? '');
      setDosageStrength(log.dosage_strength ?? '');
      setSiteCode((log.site_code as SiteCode) ?? '');
      setPainLevel(log.pain_level ?? 0);
      setNotes(log.notes ?? '');
      setInitialized(true);
    }
  }, [log, initialized]);

  const dosageOptions = React.useMemo(
    () =>
      (DOSAGE_OPTIONS_BY_MEDICATION[medication] ?? []).map((d) => ({
        label: d,
        value: d,
      })),
    [medication],
  );

  function onDateChange(_event: DateTimePickerEvent, selected?: Date) {
    setShowDatePicker(false);
    if (selected) setDate(selected);
  }

  function onTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    setShowTimePicker(false);
    if (selected) setTime(selected);
  }

  const canSave = !!medication && !!siteCode && !isPending;

  function handleSave() {
    if (!canSave || !siteCode || !id) return;
    haptics.medium();
    const injectedAt = combineDateAndTime(date, time).toISOString();
    updateShot(
      {
        logId: id,
        input: {
          siteCode: siteCode as SiteCode,
          medicationName: medication,
          dosageStrength: dosageStrength || undefined,
          painLevel,
          notes: notes.trim() || undefined,
          injectedAt,
        },
      },
      {
        onSuccess: () => router.back(),
        onError: (err) => {
          Alert.alert('Could not save', err.message ?? 'Please try again.');
        },
      },
    );
  }

  function handleDelete() {
    if (!id) return;
    haptics.warning();
    Alert.alert('Delete Shot', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteShot(id, {
            onSuccess: () => router.back(),
            onError: (err) => {
              Alert.alert(
                'Could not delete',
                err.message ?? 'Please try again.',
              );
            },
          });
        },
      },
    ]);
  }

  // Loading state — logs still resolving from cache
  if (isLoading && !log) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Edit Shot</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>
    );
  }

  // Log not found guard (deep-link to a deleted/unknown ID)
  if (!isLoading && !log) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.cancel}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Edit Shot</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Shot not found</Text>
          <Text style={styles.notFoundBody}>
            This shot may have already been deleted.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header — Cancel | Edit Shot | Save */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Edit Shot</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Save changes"
        >
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>
            {isUpdating ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TIME TAKEN */}
        <Text style={styles.sectionLabel}>TIME TAKEN</Text>

        <Pressable
          style={styles.fieldRow}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Date: ${format(date, 'MMMM d, yyyy')}. Tap to change.`}
        >
          <View style={styles.fieldLabelCol}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={styles.fieldValue}>{format(date, 'MMMM d, yyyy')}</Text>
          </View>
          <Text style={styles.fieldNote}>Tap to change</Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <Pressable
          style={styles.fieldRow}
          onPress={() => setShowTimePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Time: ${format(time, 'h:mm a')}. Tap to change.`}
        >
          <View style={styles.fieldLabelCol}>
            <Text style={styles.fieldLabel}>Time</Text>
            <Text style={styles.fieldValue}>{format(time, 'h:mm a')}</Text>
          </View>
          <Text style={styles.fieldNote}>Tap to change</Text>
        </Pressable>

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* DETAILS */}
        <Text style={styles.sectionLabel}>DETAILS</Text>

        <Select
          label="Medication Name"
          value={medication}
          options={MEDICATION_OPTIONS}
          onSelect={(v) => setMedication(String(v))}
          placeholder="Select medication"
          testID="edit-shot-medication"
        />

        <Select
          label="Dosage Strength"
          value={dosageStrength}
          options={dosageOptions}
          onSelect={(v) => setDosageStrength(String(v))}
          placeholder={medication ? 'Select dose' : 'Select medication first'}
          disabled={!medication || dosageOptions.length === 0}
          testID="edit-shot-dosage"
        />

        <Select
          label="Injection Site"
          value={siteCode}
          options={SITE_OPTIONS}
          onSelect={(v) => setSiteCode(v as SiteCode)}
          placeholder="Select injection site"
          testID="edit-shot-site"
        />

        <PainLevelSlider value={painLevel} onChange={setPainLevel} />

        {/* SHOT NOTES */}
        <Text style={styles.sectionLabel}>SHOT NOTES</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes (optional)"
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
          accessibilityLabel="Shot notes"
        />

        {/* Delete Shot — destructive action with confirmation */}
        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && styles.deleteBtnPressed,
          ]}
          onPress={handleDelete}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel="Delete this shot"
        >
          <Text style={styles.deleteBtnText}>
            {isDeleting ? 'Deleting…' : 'Delete Shot'}
          </Text>
        </Pressable>

        {/* Rule 8: clinical screen — Tier 2 disclaimer */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            Rotate injection sites at least 1 inch apart. Avoid sites that are
            bruised, tender, or have scar tissue. Always follow your prescriber's
            instructions.
          </Text>
        </DisclaimerBanner>
      </ScrollView>
    </SafeAreaView>
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
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerSpacer: {
      width: 48,
    },
    cancel: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    save: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    saveDisabled: {
      color: colors.textDisabled,
    },

    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },

    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.textSecondary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },

    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    fieldLabelCol: {
      gap: 2,
    },
    fieldLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    fieldValue: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    fieldNote: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      fontStyle: 'italic',
    },

    notesInput: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      minHeight: 96,
      fontSize: 15,
      color: colors.textPrimary,
      ...shadows.sm,
    },

    deleteBtn: {
      backgroundColor: colors.errorLight,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    deleteBtnPressed: {
      opacity: 0.7,
    },
    deleteBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.error,
    },

    notFound: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    notFoundTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    notFoundBody: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
