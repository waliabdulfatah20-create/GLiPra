import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { GlipraTokens } from '@/theme/tokens';

import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isValid, parse } from 'date-fns';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useUpdateDoseTime } from '@/features/dose/api';
import { useTodayData } from '@/features/today/hooks';
import { notifications } from '@/lib/notifications';
import { useTheme } from '@/lib/ThemeContext';
import { useNotificationSettings } from '@/lib/use-notification-settings';

/**
 * Route-aware reminders panel for the Dose hub.
 *
 * Oral: oral-dose-reminder toggle + editable reminder time + absorption info
 *       + protein-nudge toggle.
 * Injection: injection-reminder toggle + protein-nudge toggle.
 *
 * Reuses the existing useNotificationSettings() hook (AsyncStorage-backed)
 * and schedules/cancels notifications through the notifications helper.
 * On oral time change, writes profiles.dose_time_local and reschedules
 * the daily reminder if enabled.
 *
 * Rule 8: Reminders = educational content -> Tier-2 only. The Dose hub
 * already carries the Tier-1 top banner; no extra banner inside this panel.
 */
export function RemindersPanel() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const { injectionEnabled, proteinEnabled, oralDoseEnabled, isOral, toggle }
    = useNotificationSettings();
  const { profile } = useTodayData();
  const updateDoseTimeMutation = useUpdateDoseTime();

  const [showPicker, setShowPicker] = React.useState(false);

  /**
   * Parse profiles.dose_time_local ('HH:mm:ss') into a JS Date for the picker.
   * Falls back to 8:00 AM if null or malformed.
   */
  const timeDate = React.useMemo(() => {
    const str = profile?.doseTimeLocal;
    if (str) {
      const parsed = parse(str, 'HH:mm:ss', new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    }
    const fallback = new Date();
    fallback.setHours(8, 0, 0, 0);
    return fallback;
  }, [profile?.doseTimeLocal]);

  function onTimeChange(_event: DateTimePickerEvent, selected?: Date) {
    setShowPicker(false);
    if (!selected) {
      return;
    }
    // Format back to Postgres TIME string (Rule 6: date-fns only, no raw Date math)
    const formatted = format(selected, 'HH:mm:ss');
    updateDoseTimeMutation.mutate(formatted, {
      onSuccess: () => {
        // Reschedule so the daily trigger fires at the new time immediately
        if (oralDoseEnabled) {
          void notifications.scheduleOralDoseReminder(formatted);
        }
      },
    });
  }

  return (
    <View>
      {/* Section label — same visual weight as other Dose hub section labels */}
      <Text style={styles.sectionLabel}>{t('dose.reminders_title')}</Text>

      <View style={styles.card}>
        {/* Intro copy */}
        <Text style={styles.introText}>{t('dose.reminders_intro')}</Text>

        <View style={styles.divider} />

        {/* Route-aware primary reminder toggle */}
        {isOral ? (
          <NotificationRow
            label={t('settings.notif_oral_dose')}
            subtitle={t('settings.notif_oral_dose_subtitle')}
            value={oralDoseEnabled}
            onToggle={() => { void toggle('oral-dose-reminder'); }}
          />
        ) : (
          <NotificationRow
            label={t('settings.notif_injection')}
            subtitle={t('settings.notif_injection_subtitle')}
            value={injectionEnabled}
            onToggle={() => { void toggle('injection-reminder'); }}
          />
        )}

        {/* Oral only: editable reminder time (visible when reminder is on) */}
        {isOral && oralDoseEnabled && (
          <>
            <View style={styles.divider} />
            <Pressable
              style={styles.timeRow}
              onPress={() => { setShowPicker(true); }}
              accessibilityRole="button"
              accessibilityLabel={`${t('dose.reminders_time_label')}: ${format(timeDate, 'h:mm a')}. ${t('dose.reminders_time_tap')}`}
              testID="time-picker-row"
            >
              <View style={styles.timeRowLeft}>
                <Text style={styles.timeRowLabel}>{t('dose.reminders_time_label')}</Text>
                <Text style={styles.timeRowValue}>{format(timeDate, 'h:mm a')}</Text>
              </View>
              <Text style={styles.timeRowTap}>{t('dose.reminders_time_tap')}</Text>
            </Pressable>
            {showPicker && (
              <DateTimePicker
                value={timeDate}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </>
        )}

        {/* Oral only: absorption-clear info (non-interactive, informational) */}
        {isOral && (
          <>
            <View style={styles.divider} />
            <View style={styles.absorbRow}>
              <Text style={styles.absorbText}>{t('dose.reminders_absorption_info')}</Text>
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* Protein nudge — shown for both routes */}
        <NotificationRow
          label={t('settings.notif_protein')}
          subtitle={t('settings.notif_protein_subtitle')}
          value={proteinEnabled}
          onToggle={() => { void toggle('daily-protein-nudge'); }}
          isLast
        />
      </View>
    </View>
  );
}

// ─── NotificationRow (local — mirrors the pattern from settings-screen.tsx) ──

type NotificationRowProps = {
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
};

function NotificationRow({
  label,
  subtitle,
  value,
  onToggle,
  isLast = false,
}: NotificationRowProps) {
  const { colors, spacing } = useTheme();
  const rowStyles = React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
        },
        textBlock: { flex: 1 },
        labelText: {
          fontSize: 15,
          color: colors.textPrimary,
          fontWeight: '500',
        },
        subtitleText: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },
      }),
    [colors, spacing, isLast],
  );

  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.textBlock}>
        <Text style={rowStyles.labelText}>{label}</Text>
        <Text style={rowStyles.subtitleText}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={() => { onToggle(); }}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    introText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      padding: spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
    },
    timeRowLeft: { gap: 2 },
    timeRowLabel: {
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    timeRowValue: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    timeRowTap: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    absorbRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
    },
    absorbText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      fontStyle: 'italic',
    },
  });
}
