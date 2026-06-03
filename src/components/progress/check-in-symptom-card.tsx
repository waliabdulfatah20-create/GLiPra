/**
 * CheckInSymptomCard — two SeverityHeatStrip rows (Nausea, Energy) showing
 * daily severity over the selected window. Replaces the previous dual-polyline
 * SVG chart that became unreadable on sparse data (a 2 → 4 jump across
 * missed days rendered as a vertical wall).
 *
 * Design language: each metric has a header row (label + avg + direction
 * cue), a heat strip below it, and shares an inline legend at the bottom of
 * the card. The pharmacist tip footer ("℞") stays put.
 *
 * Future work (Direction C): show the same data grouped by injection-cycle
 * phase once users have ≥2 full cycles of history. See plan file
 * .claude/plans/ethereal-munching-lemon.md for the design.
 */

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useCheckInTrend } from '@/features/progress/hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { useTheme } from '@/lib/ThemeContext';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';
import { SeverityHeatStrip } from './severity-heat-strip';

type CheckInSymptomCardProps = {
  /** Days back to plot. Driven by the Progress screen's range selector. */
  days: number;
  /** Card width, used to choose row size. */
  width: number;
};

const MIN_SCORE = 1;
const MAX_SCORE = 5;

/**
 * Choose how many cells per row based on the available width. Aim for cells
 * around 12–18px so they're tappable-feeling without dominating the card.
 */
function cellsPerRowFor(width: number, days: number): number {
  // 30 → 15 (2 rows), 14 → 14 (1 row), 7 → 7, 90 → 18 (5 rows)
  if (days <= 14)
    return days;
  if (days <= 30)
    return 15;
  if (days <= 60)
    return 20;
  return 18; // 90+
}

export function CheckInSymptomCard({ days, width }: CheckInSymptomCardProps) {
  const { t } = useTranslation();
  const { colors, scales, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );
  const { days: trend, avgNausea, avgEnergy, hasData, isLoading }
    = useCheckInTrend(days);

  const nauseaValues = React.useMemo(() => trend.map(d => d.nausea), [trend]);
  const energyValues = React.useMemo(() => trend.map(d => d.energy), [trend]);
  const cellsPerRow = cellsPerRowFor(width, trend.length || days);

  return (
    <CardShell
      label={t('progress.symptoms_card.label')}
      accentColor={colors.warning}
    >
      {isLoading
        ? (
            <Text style={styles.placeholder}>{t('progress.loading')}</Text>
          )
        : !hasData
            ? (
                <Text style={styles.placeholder}>
                  {t('progress.symptoms_card.empty')}
                </Text>
              )
            : (
                <View style={styles.body}>
                  {/* ── Nausea row ────────────────────────────────────────── */}
                  <View style={styles.row}>
                    <View style={styles.rowHeader}>
                      <View style={styles.rowLabelGroup}>
                        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
                        <Text style={styles.rowLabel}>
                          {t('progress.symptoms_card.nausea')}
                        </Text>
                      </View>
                      <Text style={styles.rowMeta}>
                        <Text style={styles.metaLead}>
                          {t('progress.symptoms_card.avg')}
                          {' '}
                          <Text style={[styles.metaValue, { color: colors.warning }]}>
                            {avgNausea == null ? '-' : avgNausea.toFixed(1)}
                          </Text>
                        </Text>
                        <Text style={styles.metaCue}>
                          {'  '}
                          ·
                          {' '}
                          {t('progress.symptoms_card.lower_is_better')}
                        </Text>
                      </Text>
                    </View>
                    <SeverityHeatStrip
                      values={nauseaValues}
                      max={MAX_SCORE}
                      palette="warningScale"
                      cellsPerRow={cellsPerRow}
                      accessibilityLabel={`Nausea over the last ${trend.length} days. Average ${avgNausea?.toFixed(1) ?? 'unknown'}.`}
                    />
                  </View>

                  {/* ── Energy row ────────────────────────────────────────── */}
                  <View style={[styles.row, styles.rowSpaced]}>
                    <View style={styles.rowHeader}>
                      <View style={styles.rowLabelGroup}>
                        <View style={[styles.dot, { backgroundColor: colors.success }]} />
                        <Text style={styles.rowLabel}>
                          {t('progress.symptoms_card.energy')}
                        </Text>
                      </View>
                      <Text style={styles.rowMeta}>
                        <Text style={styles.metaLead}>
                          {t('progress.symptoms_card.avg')}
                          {' '}
                          <Text style={[styles.metaValue, { color: colors.success }]}>
                            {avgEnergy == null ? '-' : avgEnergy.toFixed(1)}
                          </Text>
                        </Text>
                        <Text style={styles.metaCue}>
                          {'  '}
                          ·
                          {' '}
                          {t('progress.symptoms_card.higher_is_better')}
                        </Text>
                      </Text>
                    </View>
                    <SeverityHeatStrip
                      values={energyValues}
                      max={MAX_SCORE}
                      palette="successScale"
                      cellsPerRow={cellsPerRow}
                      accessibilityLabel={`Energy over the last ${trend.length} days. Average ${avgEnergy?.toFixed(1) ?? 'unknown'}.`}
                    />
                  </View>

                  {/* ── Legend ────────────────────────────────────────────── */}
                  <View style={styles.legend}>
                    <Text style={styles.legendLabel}>
                      {t('progress.symptoms_card.legend_mild')}
                    </Text>
                    <View style={styles.legendSwatches}>
                      <View style={[styles.legendSwatch, { backgroundColor: colors.border }]} />
                      {scales.warningScale.map(c => (
                        <View
                          key={c}
                          style={[styles.legendSwatch, { backgroundColor: c }]}
                        />
                      ))}
                    </View>
                    <Text style={styles.legendLabel}>
                      {t('progress.symptoms_card.legend_severe')}
                    </Text>
                    <View style={styles.legendSpacer} />
                    <View style={[styles.legendSwatch, { backgroundColor: colors.border }]} />
                    <Text style={styles.legendLabel}>
                      {t('progress.symptoms_card.legend_no_data')}
                    </Text>
                  </View>
                </View>
              )}
      <PharmacistTip>{t(tipI18nKey('symptoms'))}</PharmacistTip>
    </CardShell>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
};

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    placeholder: {
      fontSize: 13,
      color: colors.textSecondary,
      paddingVertical: spacing.md,
      textAlign: 'center',
    },
    body: {
      gap: spacing.sm,
    },
    row: {
      gap: spacing.xs,
    },
    rowSpaced: {
      marginTop: spacing.sm,
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 6,
    },
    rowLabelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    rowLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    rowMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    metaLead: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    metaValue: {
      fontSize: 13,
      fontWeight: '700',
    },
    metaCue: {
      fontSize: 11,
      color: colors.textDisabled,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      flexWrap: 'wrap',
    },
    legendLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    legendSwatches: {
      flexDirection: 'row',
      gap: 2,
    },
    legendSwatch: {
      width: 9,
      height: 9,
      borderRadius: 2,
    },
    legendSpacer: {
      flex: 1,
    },
  });
}
