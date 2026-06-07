import type { CalendarCell, CalendarCellStatus } from '@/features/dose/adherence-calendar-data';
import type { GlipraTokens } from '@/theme/tokens';
import type { SiteCode } from '@/types';

import { format, parseISO } from 'date-fns';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { SkeletonBox } from '@/components/ui/skeleton-box';
import { buildAdherenceCalendar } from '@/features/dose/adherence-calendar-data';
import {
  computeInjectionAdherence,
  deriveInjectionIntervalDays,
} from '@/features/dose/injection-adherence';
import { SITE_LABELS } from '@/features/injection-sites/constants';
import { useInjectionLogs } from '@/features/injection-sites/hooks';
import { computeDoseAdherenceStreak } from '@/features/oral-dose/dose-window';
import { useOralDoseLogs } from '@/features/oral-dose/hooks';
import { useTodayData } from '@/features/today/hooks';
import { useTheme } from '@/lib/ThemeContext';

const COLS = 7;
const GAP = 4;
const ORAL_WEEKS = 4;
const INJECTION_WEEKS = 8;
const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
/** Below this many distinct logged days, injection adherence is too noisy to show. */
const MIN_INJECTION_LOGS = 2;

type StatBlock = { value: string; label: string };

/**
 * Route-aware trailing-week adherence calendar for the Dose hub.
 *
 * Oral: 4 weeks of daily status dots + a technique-aware day streak.
 * Injection: 8 weeks of weekly dose-day markers + an on-time week streak + rate.
 * Tapping a cell shows that day's status inline below the grid.
 *
 * Rule 8: educational adherence view, no extra DisclaimerBanner (the hub already
 * carries Tier-1 top + Tier-2 footer). All date math via date-fns (Rule 6).
 */
export function AdherenceCalendar() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const { width: screenWidth } = useWindowDimensions();

  const { administrationRoute, isLoading: profileLoading } = useTodayData();
  const isOral = administrationRoute === 'oral';
  const { logs: oralLogs, isLoading: oralLoading } = useOralDoseLogs();
  const { logs: injectionLogs, isLoading: injectionLoading } = useInjectionLogs();

  const [selected, setSelected] = React.useState<string | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Inner width = screen minus the hub content padding (lg) and the card padding (md), both sides.
  const innerWidth = screenWidth - spacing.lg * 2 - spacing.md * 2;
  const cellSize = Math.max(0, Math.floor((innerWidth - GAP * (COLS - 1)) / COLS));

  const isLoading = profileLoading || (isOral ? oralLoading : injectionLoading);

  // ── Route-aware derived data ────────────────────────────────────────────────
  const oralDoses = React.useMemo(
    () => oralLogs.map(l => ({ takenAt: l.takenAt, windowRespected: l.windowRespected })),
    [oralLogs],
  );
  const injectionDates = React.useMemo(
    () => injectionLogs.map(l => l.injected_at),
    [injectionLogs],
  );

  const { cells, stats, notEnough, isEmpty } = React.useMemo(() => {
    if (isOral) {
      const built = buildAdherenceCalendar({ route: 'oral', doses: oralDoses, today, weeks: ORAL_WEEKS });
      const streak = computeDoseAdherenceStreak(oralDoses, today);
      const blocks: StatBlock[] = [
        { value: `${streak.currentStreak} ${t('dose.calendar_unit_days')}`, label: t('dose.calendar_streak_current') },
        { value: `${streak.longestStreak} ${t('dose.calendar_unit_days')}`, label: t('dose.calendar_streak_best') },
      ];
      return { cells: built, stats: blocks, notEnough: false, isEmpty: oralDoses.length === 0 };
    }

    const interval = deriveInjectionIntervalDays(injectionDates);
    const built = buildAdherenceCalendar({
      route: 'injection',
      injectedDates: injectionDates,
      intervalDays: interval,
      today,
      weeks: INJECTION_WEEKS,
    });
    const adherence = computeInjectionAdherence(injectionDates, interval, today);
    const enough = adherence.loggedCount >= MIN_INJECTION_LOGS;
    const blocks: StatBlock[] = [
      { value: `${adherence.currentStreak} ${t('dose.calendar_unit_weeks')}`, label: t('dose.calendar_streak_current') },
      { value: `${adherence.longestStreak} ${t('dose.calendar_unit_weeks')}`, label: t('dose.calendar_streak_best') },
      { value: `${Math.round(adherence.onTimeRate * 100)}%`, label: t('dose.calendar_on_time') },
    ];
    return {
      cells: built,
      stats: blocks,
      notEnough: !enough,
      isEmpty: adherence.loggedCount === 0,
    };
  }, [isOral, oralDoses, injectionDates, today, t]);

  // ── Inline day detail ───────────────────────────────────────────────────────
  const detail = React.useMemo(() => {
    if (selected === null)
      return null;
    const cell = cells.find(c => c.date === selected);
    if (!cell)
      return null;

    const dateLabel = format(parseISO(selected), 'EEE, MMM d');
    if (cell.isFuture)
      return { dateLabel, text: t('dose.calendar_detail_future') };

    if (isOral) {
      const log = oralLogs.find(l => format(parseISO(l.takenAt), 'yyyy-MM-dd') === selected);
      if (cell.status === 'broken' && log)
        return { dateLabel, text: `${t('dose.calendar_detail_broken')} (${format(parseISO(log.takenAt), 'h:mm a')})` };
      if (log)
        return { dateLabel, text: `${t('dose.calendar_detail_taken')} (${format(parseISO(log.takenAt), 'h:mm a')})` };
      if (cell.status === 'missed')
        return { dateLabel, text: t('dose.calendar_detail_missed') };
      return { dateLabel, text: t('dose.calendar_detail_none') };
    }

    const shot = injectionLogs.find(l => format(parseISO(l.injected_at), 'yyyy-MM-dd') === selected);
    if (shot) {
      const site = SITE_LABELS[shot.site_code as SiteCode] ?? shot.site_code;
      return { dateLabel, text: `${t('dose.calendar_detail_taken')} (${site}, ${format(parseISO(shot.injected_at), 'h:mm a')})` };
    }
    if (cell.status === 'missed')
      return { dateLabel, text: t('dose.calendar_detail_missed') };
    return { dateLabel, text: t('dose.calendar_detail_none') };
  }, [selected, cells, isOral, oralLogs, injectionLogs, t]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.card}>
        <SkeletonBox style={{ height: 40, width: '60%', marginBottom: spacing.md }} />
        <SkeletonBox style={{ height: cellSize, width: '100%', marginBottom: GAP }} />
        <SkeletonBox style={{ height: cellSize, width: '100%' }} />
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyTitle}>{t('dose.calendar_empty_title')}</Text>
        <Text style={styles.emptyBody}>{t('dose.calendar_empty_body')}</Text>
      </View>
    );
  }

  const weeks = isOral ? ORAL_WEEKS : INJECTION_WEEKS;

  return (
    <View style={styles.card} testID="adherence-calendar">
      {/* Streak header / not-enough notice */}
      {notEnough
        ? (
            <Text style={styles.notEnough}>{t('dose.calendar_not_enough')}</Text>
          )
        : (
            <View style={styles.statsRow}>
              {stats.map(s => (
                <View key={s.label} style={styles.statBlock}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}

      {/* Day-of-week headers */}
      <View style={styles.headerRow}>
        {DAY_HEADERS.map((h, i) => (
          <Text key={i} style={[styles.dayHeader, { width: cellSize }]}>
            {h}
          </Text>
        ))}
      </View>

      {/* Week rows */}
      {Array.from({ length: weeks }, (_, week) => (
        <View key={week} style={styles.weekRow}>
          {cells.slice(week * COLS, week * COLS + COLS).map(c => (
            <CalendarDayCell
              key={c.date}
              cell={c}
              size={cellSize}
              isSelected={c.date === selected}
              onPress={() => setSelected(prev => (prev === c.date ? null : c.date))}
              colors={colors}
              styles={styles}
            />
          ))}
        </View>
      ))}

      {/* Inline day detail */}
      {detail && (
        <View style={styles.detailRow} testID="adherence-day-detail">
          <Text style={styles.detailDate}>{detail.dateLabel}</Text>
          <Text style={styles.detailText}>{detail.text}</Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <LegendDot color={colors.success} label={t('dose.calendar_legend_taken')} styles={styles} />
        {isOral && (
          <LegendDot color={colors.warning} label={t('dose.calendar_legend_broken')} styles={styles} />
        )}
        <LegendDot color={colors.error} label={t('dose.calendar_legend_missed')} styles={styles} />
        <LegendDot color={colors.gray200} label={t('dose.calendar_legend_none')} styles={styles} />
      </View>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function statusBg(status: CalendarCellStatus, colors: GlipraTokens['colors']): string {
  if (status === 'taken')
    return colors.success;
  if (status === 'broken')
    return colors.warning;
  if (status === 'missed')
    return colors.error;
  return colors.gray200;
}

function CalendarDayCell({
  cell,
  size,
  isSelected,
  onPress,
  colors,
  styles,
}: {
  cell: CalendarCell;
  size: number;
  isSelected: boolean;
  onPress: () => void;
  colors: GlipraTokens['colors'];
  styles: ReturnType<typeof makeStyles>;
}) {
  const bg = statusBg(cell.status, colors);
  const onColor = cell.status === 'none' || cell.isFuture;
  let borderColor = 'transparent';
  if (isSelected)
    borderColor = colors.textPrimary;
  else if (cell.isToday)
    borderColor = colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${cell.date}: ${cell.status}`}
      style={[
        styles.cell,
        { width: size, height: size, backgroundColor: bg, borderColor },
      ]}
    >
      <Text style={[styles.dayNum, { color: onColor ? colors.textDisabled : colors.white }]}>
        {cell.dayNum}
      </Text>
    </Pressable>
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

// ── Styles ──────────────────────────────────────────────────────────────────────

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginBottom: spacing.md,
    },
    statBlock: { gap: 2 },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    notEnough: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginBottom: spacing.md,
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
      gap: GAP,
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
    detailRow: {
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
      borderRadius: radius.md,
      gap: 2,
    },
    detailDate: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    detailText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
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
