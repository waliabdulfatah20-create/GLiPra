// Resistance-training log — Muscle-First MVP, Phase A.
//
// The new muscle-preservation signal: a lightweight weekly log. Records distinct
// training days; the weekly-frequency metric (computeResistanceFrequency) treats
// the current week as in-progress and never penalizes it. Optional type + duration
// keep logging one tap.
//
// Lives in features/ (not app/) so its co-located test never enters Expo Router's
// require.context over src/app. The route file is a thin re-export wrapper.

import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { ResistanceSessionType } from './api';
import type { GlipraTokens } from '@/theme/tokens';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, setHours, setMinutes, setSeconds } from 'date-fns';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
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

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import {
  useDeleteResistanceLog,
  useLogResistanceSession,
  useResistanceLogs,
  useResistanceWeekly,
} from './hooks';

const TYPE_OPTIONS: { value: ResistanceSessionType; labelKey: string }[] = [
  { value: 'full_body', labelKey: 'resistance.type_full_body' },
  { value: 'upper', labelKey: 'resistance.type_upper' },
  { value: 'lower', labelKey: 'resistance.type_lower' },
  { value: 'other', labelKey: 'resistance.type_other' },
];

/** Merge a date (y/m/d) and a time (h/m) into one Date. date-fns only (Rule 6). */
function combineDateAndTime(date: Date, time: Date): Date {
  let merged = setHours(date, time.getHours());
  merged = setMinutes(merged, time.getMinutes());
  merged = setSeconds(merged, 0);
  return merged;
}

export function ResistanceScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const { frequency } = useResistanceWeekly();
  const { logs } = useResistanceLogs();
  const { mutate: logSession, isPending } = useLogResistanceSession();
  const { mutate: removeSession } = useDeleteResistanceLog();

  const [date, setDate] = React.useState<Date>(new Date());
  const [time, setTime] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [sessionType, setSessionType] = React.useState<ResistanceSessionType | null>(null);
  const [durationText, setDurationText] = React.useState('');

  const met = frequency.currentWeekSessions >= frequency.weeklyTarget;

  function onDateChange(_e: DateTimePickerEvent, selected?: Date) {
    setShowDatePicker(false);
    if (selected)
      setDate(selected);
  }

  function onTimeChange(_e: DateTimePickerEvent, selected?: Date) {
    setShowTimePicker(false);
    if (selected)
      setTime(selected);
  }

  function handleLog() {
    if (isPending)
      return;
    haptics.medium();
    const performedAt = combineDateAndTime(date, time).toISOString();
    const parsed = Number.parseInt(durationText, 10);
    const durationMin = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

    logSession(
      { performedAt, sessionType, durationMin },
      {
        onSuccess: () => {
          // Reset the optional fields; keep the screen open so the weekly count
          // and recent list update in place.
          setSessionType(null);
          setDurationText('');
          setDate(new Date());
          setTime(new Date());
        },
        onError: (err: Error) => {
          Alert.alert(t('resistance.error_title'), err.message ?? t('resistance.error_body'));
        },
      },
    );
  }

  function confirmRemove(logId: string) {
    Alert.alert(
      t('resistance.delete_confirm_title'),
      t('resistance.delete_confirm_msg'),
      [
        { text: t('resistance.cancel'), style: 'cancel' },
        {
          text: t('resistance.delete'),
          style: 'destructive',
          onPress: () => { haptics.tap(); removeSession(logId); },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('resistance.back')}
        >
          <Text style={styles.back}>{`‹ ${t('resistance.back')}`}</Text>
        </Pressable>
        <Text style={styles.title}>{t('resistance.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly progress */}
        <View style={[styles.weekCard, met && styles.weekCardMet]}>
          <View style={styles.weekTop}>
            <Text style={[styles.weekCount, met && styles.weekCountMet]}>
              {frequency.currentWeekSessions}
            </Text>
            {frequency.currentStreak > 0 && (
              <View style={styles.streakPill}>
                <Text style={styles.streakPillText}>
                  {t('resistance.week_streak', { weeks: frequency.currentStreak })}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.weekLabel}>{t('resistance.sessions_this_week')}</Text>
          <Text style={styles.weekAim}>
            {met ? t('resistance.met') : t('resistance.aim')}
          </Text>
        </View>

        {/* Log a session */}
        <Text style={styles.sectionLabel}>{t('resistance.log_section')}</Text>

        <Pressable
          style={styles.fieldRow}
          onPress={() => setShowDatePicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`${t('resistance.date')}: ${format(date, 'MMMM d, yyyy')}`}
        >
          <View style={styles.fieldLabelCol}>
            <Text style={styles.fieldLabel}>{t('resistance.date')}</Text>
            <Text style={styles.fieldValue}>{format(date, 'MMMM d, yyyy')}</Text>
          </View>
          <Text style={styles.fieldNote}>{t('resistance.tap_change')}</Text>
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
          accessibilityLabel={`${t('resistance.time')}: ${format(time, 'h:mm a')}`}
        >
          <View style={styles.fieldLabelCol}>
            <Text style={styles.fieldLabel}>{t('resistance.time')}</Text>
            <Text style={styles.fieldValue}>{format(time, 'h:mm a')}</Text>
          </View>
          <Text style={styles.fieldNote}>{t('resistance.tap_change')}</Text>
        </Pressable>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* Type (optional) */}
        <Text style={styles.fieldLabel}>{t('resistance.type_label')}</Text>
        <View style={styles.chipRow}>
          {TYPE_OPTIONS.map((opt) => {
            const active = sessionType === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => {
                  haptics.selection();
                  setSessionType(active ? null : opt.value);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(opt.labelKey)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t(opt.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Duration (optional) */}
        <Text style={styles.fieldLabel}>{t('resistance.duration_label')}</Text>
        <TextInput
          style={styles.durationInput}
          value={durationText}
          onChangeText={v => setDurationText(v.replace(/\D/g, ''))}
          placeholder={t('resistance.duration_placeholder')}
          placeholderTextColor={colors.textDisabled}
          keyboardType="number-pad"
          maxLength={3}
          accessibilityLabel={t('resistance.duration_label')}
        />

        <Pressable
          style={[styles.logButton, isPending && styles.logButtonDisabled]}
          onPress={handleLog}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel={t('resistance.log_button')}
        >
          <Text style={styles.logButtonText}>
            {isPending ? t('resistance.logging') : t('resistance.log_button')}
          </Text>
        </Pressable>

        {/* Recent sessions */}
        <Text style={styles.sectionLabel}>{t('resistance.recent')}</Text>
        {logs.length === 0
          ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{t('resistance.empty_title')}</Text>
                <Text style={styles.emptyBody}>{t('resistance.empty_body')}</Text>
              </View>
            )
          : (
              logs.map(log => (
                <View key={log.id} style={styles.recentRow}>
                  <View style={styles.recentTextCol}>
                    <Text style={styles.recentDate}>
                      {format(new Date(log.performedAt), 'EEE, MMM d')}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {[
                        log.sessionType ? t(`resistance.type_${log.sessionType}`) : null,
                        log.durationMin ? `${log.durationMin} ${t('resistance.minutes_short')}` : null,
                      ].filter(Boolean).join(' · ') || t('resistance.session')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => confirmRemove(log.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t('resistance.delete')}
                  >
                    <Text style={styles.removeText}>{t('resistance.delete')}</Text>
                  </Pressable>
                </View>
              ))
            )}

        {/* Rule 8: clinical-adjacent screen — Tier 2 educational disclaimer */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>{t('resistance.disclaimer')}</Text>
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
    back: { fontSize: 17, color: colors.primary, width: 70 },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    headerSpacer: { width: 70 },

    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },

    // Weekly progress card
    weekCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 3,
      borderTopColor: colors.primary,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    weekCardMet: { borderTopColor: colors.success },
    weekTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    weekCount: { fontSize: 40, fontWeight: '800', color: colors.primary, lineHeight: 44 },
    weekCountMet: { color: colors.success },
    streakPill: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    streakPillText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    weekLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    weekAim: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },

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
    fieldLabelCol: { gap: 2 },
    fieldLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
    fieldValue: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
    fieldNote: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: colors.primary },

    durationInput: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },

    logButton: {
      marginTop: spacing.md,
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    logButtonDisabled: { backgroundColor: colors.gray200 },
    logButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },

    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
    },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    emptyBody: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

    recentRow: {
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
    recentTextCol: { gap: 2, flex: 1 },
    recentDate: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    recentMeta: { fontSize: 12, color: colors.textSecondary },
    removeText: { fontSize: 13, color: colors.error, fontWeight: '500' },

    disclaimerText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  });
}
