/**
 * StreakCalendarCard — fixed 4-week calendar grid (7 cols × 4 rows).
 *
 * Always shows the last 4 complete weeks starting from Monday,
 * regardless of the time-range selector. Day-of-week headers (M–S)
 * let users spot weekly patterns at a glance.
 *
 * - Green = hit floor (≥ 80% of protein target)
 * - Amber = logged but missed
 * - Gray  = no log / future
 * - Today gets a purple outline
 */

import type { GlipraTokens } from '@/theme/tokens';
import { addDays, format, startOfWeek, subWeeks } from 'date-fns';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { StyleSheet, Text, View } from 'react-native';
import { useProteinHistoryPerDay } from '@/features/progress/hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { useTheme } from '@/lib/ThemeContext';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

// Always fixed: 7 columns (Mon–Sun), 4 rows, 28 days
const COLS = 7;
const WEEKS = 4;
const TOTAL_DAYS = COLS * WEEKS;
const GAP = 4;
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type StreakCalendarCardProps = {
  /** Passed by parent for the time-range selector — ignored here, we always show 4 weeks. */
  days: number;
  width: number;
};

export function StreakCalendarCard({ width }: StreakCalendarCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  // Always fetch 28 days — enough to back-fill from the Monday 3 weeks ago
  const { history, isLoading } = useProteinHistoryPerDay(TOTAL_DAYS);

  // Build a date-keyed lookup from the hook data
  const historyMap = React.useMemo(() => {
    const m: Record<string, { hasData: boolean; hitFloor: boolean }> = {};
    for (const d of history) m[d.date] = d;
    return m;
  }, [history]);

  // Grid starts on Monday of the week 3 weeks ago
  const gridStart = React.useMemo(() => {
    const mondayThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    return subWeeks(mondayThisWeek, WEEKS - 1);
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const cellSize = Math.floor((width - GAP * (COLS - 1)) / COLS);

  // Build all 28 date slots
  const slots = React.useMemo(
    () =>
      Array.from({ length: TOTAL_DAYS }, (_, i) => {
        const dateObj = addDays(gridStart, i);
        const date = format(dateObj, 'yyyy-MM-dd');
        const dayNum = format(dateObj, 'd');
        return { date, dayNum, ...historyMap[date] };
      }),
    [gridStart, historyMap],
  );

  return (
    <CardShell
      label={t('progress.streak_card.label')}
      accentColor={colors.warning}
    >
      {isLoading ? (
        <Text style={styles.placeholder}>{t('progress.loading')}</Text>
      ) : (
        <>
          {/* Day-of-week headers */}
          <View style={styles.headerRow}>
            {DAY_HEADERS.map((h, i) => (
              <Text
                key={i}
                style={[styles.dayHeader, { width: cellSize }]}
              >
                {h}
              </Text>
            ))}
          </View>

          {/* 4-week grid — one row per week */}
          {Array.from({ length: WEEKS }, (_, week) => (
            <View key={week} style={[styles.weekRow, { gap: GAP }]}>
              {slots.slice(week * COLS, week * COLS + COLS).map((d) => {
                const isFuture = d.date > today;
                let bg: string;
                if (isFuture || !d.hasData)
                  bg = colors.gray200;
                else if (d.hitFloor)
                  bg = colors.success;
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
                        borderColor:
                          d.date === today ? colors.primary : 'transparent',
                      },
                    ]}
                    accessibilityLabel={`${d.date}: ${
                      isFuture
                        ? 'future'
                        : d.hitFloor
                          ? 'hit'
                          : d.hasData
                            ? 'missed'
                            : 'no log'
                    }`}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        {
                          color:
                            !d.hasData || isFuture
                              ? colors.textDisabled
                              : colors.white,
                        },
                      ]}
                    >
                      {d.dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.legend}>
            <LegendDot
              color={colors.success}
              label={t('progress.streak_card.legend_hit')}
              styles={styles}
            />
            <LegendDot
              color={colors.warning}
              label={t('progress.streak_card.legend_miss')}
              styles={styles}
            />
            <LegendDot
              color={colors.gray200}
              label={t('progress.streak_card.legend_none')}
              styles={styles}
            />
          </View>
        </>
      )}
      <PharmacistTip>{t(tipI18nKey('streak'))}</PharmacistTip>
    </CardShell>
  );
}

function LegendDot({
  color,
  label,
  styles,
}: {
  color: string;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    placeholder: {
      fontSize: 13,
      color: colors.textSecondary,
      paddingVertical: spacing.md,
      textAlign: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      gap: GAP,
      marginBottom: 4,
    },
    dayHeader: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textDisabled,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: GAP,
    },
    cell: {
      borderRadius: radius.sm,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNum: {
      fontSize: 9,
      fontWeight: '700',
      lineHeight: 11,
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
}
