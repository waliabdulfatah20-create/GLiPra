/**
 * InjectionAdherenceCard — % on-time over the window plus a tiny timeline
 * with dots at each logged injection date.
 *
 * Empty state: shown when the user has logged zero injections (useful nudge
 * during onboarding before they have any data).
 */

import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Line, Svg } from 'react-native-svg';

import { useInjectionAdherence } from '@/features/progress/hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { colors, spacing } from '@/theme/colors';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

interface InjectionAdherenceCardProps {
  days: number;
  width: number;
}

const TIMELINE_H = 36;

export function InjectionAdherenceCard({
  days,
  width,
}: InjectionAdherenceCardProps) {
  const { t } = useTranslation();
  const { rate, windowDates, intervalDays, hasData, isLoading } =
    useInjectionAdherence(days);

  const today = new Date();
  const startDate = subDays(today, days - 1);

  // Map each injection date to its X position on the timeline
  const dots = windowDates
    .map((d) => {
      const offset = differenceInCalendarDays(today, parseISO(d));
      const xRatio = 1 - offset / (days - 1);
      return { date: d, x: xRatio * width };
    })
    .filter((d) => d.x >= 0 && d.x <= width);

  return (
    <CardShell
      label={t('progress.adherence_card.label')}
      accentColor={colors.primary}
    >
      {isLoading ? (
        <Text style={styles.placeholder}>{t('progress.loading')}</Text>
      ) : !hasData ? (
        <Text style={styles.placeholder}>{t('progress.adherence_card.empty')}</Text>
      ) : (
        <>
          <View style={styles.headlineRow}>
            <Text style={styles.bigValue}>{Math.round(rate * 100)}%</Text>
            <Text style={styles.bigCaption}>
              {t('progress.adherence_card.subtitle', {
                count: windowDates.length,
                interval: intervalLabel(intervalDays, t),
              })}
            </Text>
          </View>

          <Svg width={width} height={TIMELINE_H}>
            {/* Baseline */}
            <Line
              x1={0}
              y1={TIMELINE_H / 2}
              x2={width}
              y2={TIMELINE_H / 2}
              stroke={colors.border}
              strokeWidth={1}
            />
            {/* Injection dots */}
            {dots.map((d) => (
              <Circle
                key={d.date}
                cx={d.x}
                cy={TIMELINE_H / 2}
                r={5}
                fill={colors.primary}
              />
            ))}
          </Svg>

          <View style={styles.axisRow}>
            <Text style={styles.axisLabel}>{format(startDate, 'MMM d')}</Text>
            <Text style={styles.axisLabel}>{format(today, 'MMM d')}</Text>
          </View>
        </>
      )}
      <PharmacistTip>{t(tipI18nKey('injection'))}</PharmacistTip>
    </CardShell>
  );
}

function intervalLabel(intervalDays: number, t: (k: string) => string): string {
  if (intervalDays === 1) return t('progress.adherence_card.daily');
  if (intervalDays === 7) return t('progress.adherence_card.weekly');
  if (intervalDays === 14) return t('progress.adherence_card.biweekly');
  return t('progress.adherence_card.custom');
}

const styles = StyleSheet.create({
  placeholder: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bigValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  bigCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
