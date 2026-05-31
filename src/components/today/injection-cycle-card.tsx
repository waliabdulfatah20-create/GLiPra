import type { InjectionCycleResult } from '@/features/injection-cycle/calculator';
import type { GlipraTokens } from '@/theme/tokens';
import type { InjectionPhase } from '@/types';
import { addDays, format, parseISO } from 'date-fns';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

type InjectionCycleCardProps = {
  lastInjectionDate: string;
  injectionCycle: InjectionCycleResult;
};

function getPhaseForDay(dayIndex: number): InjectionPhase {
  if (dayIndex === 0)
    return 'injection_day';
  if (dayIndex <= 2)
    return 'peak_suppression';
  if (dayIndex <= 4)
    return 'adjustment';
  return 'recovery_window';
}

const PHASE_LABELS: Record<InjectionPhase, string> = {
  injection_day: '💉',
  peak_suppression: 'PEAK',
  adjustment: 'ADJ',
  recovery_window: 'REC',
  overdue: 'OD',
};

export function InjectionCycleCard({ lastInjectionDate, injectionCycle }: InjectionCycleCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const phaseAccent = React.useMemo<Record<InjectionPhase, string>>(
    () => ({
      injection_day: colors.phaseInjectionDay,
      peak_suppression: colors.phasePeakSuppression,
      adjustment: colors.phaseAdjustment,
      recovery_window: colors.phaseRecoveryWindow,
      overdue: colors.phaseOverdue,
    }),
    [colors],
  );

  // Clamp to 7 for overdue so all cells render as past
  const effectiveDaySince = injectionCycle.isOverdue ? 7 : injectionCycle.daysSinceInjection;

  const cells = Array.from({ length: 7 }, (_, i) => {
    const cellDate = addDays(parseISO(lastInjectionDate), i);
    const dayLabel = format(cellDate, 'EEE');
    const isPast = i < effectiveDaySince;
    const isToday = !injectionCycle.isOverdue && i === effectiveDaySince;
    const cellPhase = getPhaseForDay(i);
    const phaseColor = phaseAccent[cellPhase];
    return { dayLabel, isPast, isToday, phaseColor, cellPhase };
  });

  const footerText = injectionCycle.isOverdue
    ? t('today.cycle_overdue_label')
    : injectionCycle.nextInjectionDate
      ? t('today.cycle_next_dose', {
          date: format(parseISO(injectionCycle.nextInjectionDate), 'EEE, MMM d'),
        })
      : null;

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>{t('today.cycle_title')}</Text>
        </View>

        <View style={styles.stripRow}>
          {cells.map(({ dayLabel, isPast, isToday, phaseColor, cellPhase }) => (
            <View key={dayLabel} style={styles.cellUnit}>
              <Text style={[styles.todayBadge, isToday && styles.todayBadgeVisible]}>
                {t('today.cycle_today_badge')}
              </Text>
              <View
                style={[
                  styles.dome,
                  isPast || isToday
                    ? { backgroundColor: phaseColor }
                    : styles.domeFuture,
                  isToday && styles.domeToday,
                ]}
              >
                {(isPast || isToday) && (
                  <Text style={styles.domeLabel} numberOfLines={1} adjustsFontSizeToFit>
                    {PHASE_LABELS[cellPhase]}
                  </Text>
                )}
              </View>
              <Text style={[styles.dayLabel, (isPast || isToday) && styles.dayLabelActive]}>
                {dayLabel}
              </Text>
            </View>
          ))}
        </View>

        {footerText && (
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                injectionCycle.isOverdue && { color: colors.phaseOverdue },
              ]}
            >
              {footerText}
            </Text>
          </View>
        )}
      </View>
    </View>
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
    outer: {
      marginBottom: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.md,
    },
    inner: {
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    stripRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    cellUnit: {
      flex: 1,
      alignItems: 'center',
    },
    todayBadge: {
      fontSize: 7,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.8,
      marginBottom: 2,
      opacity: 0,
    },
    todayBadgeVisible: {
      opacity: 1,
    },
    dome: {
      width: '100%',
      height: 64,
      borderTopLeftRadius: 999,
      borderTopRightRadius: 999,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    domeFuture: {
      backgroundColor: colors.gray100,
    },
    domeToday: {
      borderWidth: 2.5,
      borderColor: colors.white,
    },
    domeLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    dayLabel: {
      marginTop: 4,
      fontSize: 9,
      fontWeight: '500',
      color: colors.textDisabled,
    },
    dayLabelActive: {
      color: colors.textSecondary,
      fontWeight: '600',
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
