/**
 * StreakCalendarCard — calendar grid of the last N days.
 *
 * - Green = hit floor (≥ 80% of protein target)
 * - Amber = logged but missed
 * - Gray  = no log
 * - Today gets a purple outline
 *
 * Data source: useProteinHistoryPerDay — same hook the bar sparkline uses,
 * so the two cards are always consistent on the same window.
 */

import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useProteinHistoryPerDay } from '@/features/progress/hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { colors, radius, spacing } from '@/theme/colors';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

interface StreakCalendarCardProps {
  days: number;
  width: number;
}

const GAP = 4;

export function StreakCalendarCard({ days, width }: StreakCalendarCardProps) {
  const { t } = useTranslation();
  const { history, isLoading } = useProteinHistoryPerDay(days);

  // Auto-size cells to fit width. Target ~14 columns max for readability;
  // 7 cols for a weekly grid feels too tall on 30/90D.
  const COLS = days <= 14 ? days : 14;
  const cellSize = Math.floor((width - GAP * (COLS - 1)) / COLS);
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <CardShell
      label={t('progress.streak_card.label')}
      accentColor={colors.warning}
    >
      {isLoading ? (
        <Text style={styles.placeholder}>{t('progress.loading')}</Text>
      ) : (
        <>
          <View style={[styles.grid, { gap: GAP }]}>
            {history.map((d) => {
              let bg: string;
              if (!d.hasData) bg = colors.gray200;
              else if (d.hitFloor) bg = colors.success;
              else bg = colors.warning;
              return (
                <View
                  key={d.date}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: bg,
                      borderColor: d.date === today ? colors.primary : 'transparent',
                    },
                  ]}
                  accessibilityLabel={`${d.date}: ${
                    d.hitFloor ? 'hit' : d.hasData ? 'missed' : 'no log'
                  }`}
                />
              );
            })}
          </View>

          <View style={styles.legend}>
            <LegendDot color={colors.success} label={t('progress.streak_card.legend_hit')} />
            <LegendDot color={colors.warning} label={t('progress.streak_card.legend_miss')} />
            <LegendDot color={colors.gray200} label={t('progress.streak_card.legend_none')} />
          </View>
        </>
      )}
      <PharmacistTip>{t(tipI18nKey('streak'))}</PharmacistTip>
    </CardShell>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    borderRadius: radius.sm,
    borderWidth: 1.5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
