// src/features/food-log/micronutrient-watch-card.tsx
// Pro-gated card. Direction C design: gradient header, gaps chip, 2x2 tile grid, gap banner.
// Rule 8: DisclaimerBanner tier={2}. Rule 9/10: food-strategy copy only, no condition names.

import type { TFunction } from 'i18next';
import type { NutrientKey, NutrientStatus } from './micronutrient-constants';
import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { ProGate } from '@/features/subscription/pro-gate';

import { useTheme } from '@/lib/ThemeContext';
import { useDailyMacros } from './hooks';
import {
  getGapBannerText,
  getGapCount,
  getNutrientPct,
  getNutrientStatus,
  MICRONUTRIENT_RDAS,

} from './micronutrient-constants';

type NutrientConfig = {
  key: NutrientKey;
  labelKey: string;
  value: number;
  unit: string;
};

export function MicronutrientWatchCard() {
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const { t } = useTranslation();
  const { magnesiumMg, zincMg, b12Mcg, vitaminDIu, hasMicronutrients, isLoading }
    = useDailyMacros();

  if (isLoading)
    return null;

  const microData = { magnesiumMg, zincMg, b12Mcg, vitaminDIu };
  const gapCount = hasMicronutrients ? getGapCount(microData) : 0;
  const gapText = hasMicronutrients ? getGapBannerText(microData) : null;

  const nutrients: NutrientConfig[] = [
    { key: 'magnesiumMg', labelKey: 'log.nutrient_magnesium', value: magnesiumMg, unit: 'mg' },
    { key: 'zincMg', labelKey: 'log.nutrient_zinc', value: zincMg, unit: 'mg' },
    { key: 'b12Mcg', labelKey: 'log.nutrient_b12', value: b12Mcg, unit: 'mcg' },
    { key: 'vitaminDIu', labelKey: 'log.nutrient_vitd', value: vitaminDIu, unit: 'IU' },
  ];

  return (
    <ProGate featureName={t('log.micronutrient_watch')}>
      <View style={styles.card}>
        {/* Gradient header — uses hero gradient from tokens.ts, auto-adapts light/dark */}
        <LinearGradient
          colors={[...gradients.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>{t('log.micronutrient_watch')}</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
          {hasMicronutrients && (
            <View style={[styles.gapsChip, gapCount === 0 && styles.gapsChipGood]}>
              <View style={[styles.gapsDot, gapCount === 0 && styles.gapsDotGood]} />
              <Text style={[styles.gapsText, gapCount === 0 && styles.gapsTextGood]}>
                {gapCount === 0
                  ? t('log.all_on_track')
                  : t('log.gaps_today', { count: gapCount })}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Body */}
        <View style={styles.body}>
          {!hasMicronutrients
            ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🔬</Text>
                  <Text style={styles.emptyText}>{t('log.no_micro_data')}</Text>
                </View>
              )
            : (
                <>
                  <View style={styles.grid}>
                    {nutrients.map(n => (
                      <NutrientTile
                        key={n.key}
                        label={t(n.labelKey)}
                        value={n.value}
                        unit={n.unit}
                        rda={MICRONUTRIENT_RDAS[n.key]}
                        styles={styles}
                        t={t}
                      />
                    ))}
                  </View>
                  {gapText && (
                    <View style={styles.gapBanner}>
                      <Text style={styles.gapBannerText}>{gapText}</Text>
                    </View>
                  )}
                </>
              )}
          <DisclaimerBanner tier={2}>
            <Text style={styles.disclaimerText}>{t('log.micronutrient_disclaimer')}</Text>
          </DisclaimerBanner>
        </View>
      </View>
    </ProGate>
  );
}

type NutrientTileProps = {
  label: string;
  value: number;
  unit: string;
  rda: number;
  styles: ReturnType<typeof makeStyles>;
  t: TFunction;
};

function NutrientTile({ label, value, unit, rda, styles, t }: NutrientTileProps) {
  const pct = getNutrientPct(value, rda);
  const status: NutrientStatus = getNutrientStatus(value, rda);
  const safe = Number.isFinite(value) ? value : 0;
  const display = unit === 'mcg' ? safe.toFixed(1) : Math.round(safe).toString();

  const dotColorStyle = {
    green: styles.statusDotGreen,
    amber: styles.statusDotAmber,
    red: styles.statusDotRed,
  }[status];
  const barColorStyle = {
    green: styles.barFillGreen,
    amber: styles.barFillAmber,
    red: styles.barFillRed,
  }[status];

  return (
    <View style={styles.tile}>
      <View style={[styles.statusDot, dotColorStyle]} />
      <Text style={styles.tileName}>{label}</Text>
      <Text style={styles.tileValue}>
        {display}
        <Text style={styles.tileUnit}>
          {' '}
          {unit}
        </Text>
      </Text>
      <Text style={styles.tilePct}>
        {pct >= 100 ? t('log.goal_met') : t('log.pct_of_goal', { pct })}
      </Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            barColorStyle,
            { width: `${pct}%` as `${number}%` },
          ]}
        />
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
    card: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm + 4,
      paddingBottom: spacing.md,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#f5f3ff',
    },
    proBadge: {
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    proBadgeText: {
      fontSize: 8,
      fontWeight: '800',
      color: '#f5f3ff',
      letterSpacing: 0.5,
    },
    gapsChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(248,113,113,0.25)',
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    gapsChipGood: {
      backgroundColor: 'rgba(52,211,153,0.25)',
    },
    gapsDot: {
      width: 5,
      height: 5,
      borderRadius: 99,
      backgroundColor: '#f87171',
    },
    gapsDotGood: {
      backgroundColor: '#34d399',
    },
    gapsText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#fca5a5',
    },
    gapsTextGood: {
      color: '#6ee7b7',
    },
    body: {
      backgroundColor: colors.surface,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    emptyIcon: {
      fontSize: 24,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
      padding: spacing.md,
      paddingBottom: 0,
    },
    tile: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.gray50,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      position: 'relative',
    },
    statusDot: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusDotGreen: { backgroundColor: colors.success },
    statusDotAmber: { backgroundColor: colors.warning },
    statusDotRed: { backgroundColor: colors.error },
    tileName: {
      fontSize: 8,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    tileValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      lineHeight: 22,
    },
    tileUnit: {
      fontSize: 9,
      fontWeight: '500',
      color: colors.textDisabled,
    },
    tilePct: {
      fontSize: 9,
      color: colors.textDisabled,
      marginBottom: 6,
    },
    barBg: {
      height: 3,
      backgroundColor: colors.gray200,
      borderRadius: 2,
      overflow: 'hidden',
    },
    barFill: {
      height: 3,
      borderRadius: 2,
    },
    barFillGreen: { backgroundColor: colors.success },
    barFillAmber: { backgroundColor: colors.warning },
    barFillRed: { backgroundColor: colors.error },
    gapBanner: {
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      borderRadius: radius.sm,
      backgroundColor: colors.warningLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    gapBannerText: {
      fontSize: 12,
      color: colors.disclaimerText,
      lineHeight: 18,
    },
    disclaimerText: {
      fontSize: 11,
      color: colors.textDisabled,
      lineHeight: 16,
    },
  });
}
