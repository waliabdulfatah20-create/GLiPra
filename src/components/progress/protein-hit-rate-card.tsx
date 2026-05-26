/**
 * ProteinHitRateCard — big % over the window plus a daily-bar sparkline.
 *
 * Each bar represents one day; height = min(proteinG / floor, 1) of the
 * available chart height. Bars hit the floor (≥ 80%) render in success
 * green; missed days render in warning amber; no-data days render in
 * neutral gray.
 */

import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Rect, Svg } from 'react-native-svg';

import { useProteinHistoryPerDay } from '@/features/progress/hooks';
import { tipI18nKey } from '@/features/progress/pharmacist-tips';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

import { CardShell } from './card-shell';
import { PharmacistTip } from './pharmacist-tip';

interface ProteinHitRateCardProps {
  days: number;
  width: number;
}

const CHART_HEIGHT = 56;
const GAP = 2;

export function ProteinHitRateCard({ days, width }: ProteinHitRateCardProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );
  const { history, hitRate, proteinFloorG, isLoading } =
    useProteinHistoryPerDay(days);

  // Available width inside the card (already padded by CardShell)
  const chartW = width;
  const barW = Math.max(2, (chartW - GAP * (history.length - 1)) / history.length);

  const ratio = (h: { proteinG: number }) =>
    proteinFloorG > 0 ? Math.min(h.proteinG / proteinFloorG, 1) : 0;

  return (
    <CardShell
      label={t('progress.protein_card.label')}
      accentColor={colors.success}
    >
      {isLoading ? (
        <Text style={styles.placeholder}>{t('progress.loading')}</Text>
      ) : proteinFloorG <= 0 ? (
        <Text style={styles.placeholder}>
          {t('progress.protein_card.no_floor')}
        </Text>
      ) : (
        <>
          <View style={styles.headlineRow}>
            <Text style={styles.bigValue}>{Math.round(hitRate * 100)}%</Text>
            <Text style={styles.bigCaption}>
              {t('progress.protein_card.subtitle', { days })}
            </Text>
          </View>

          <Svg width={chartW} height={CHART_HEIGHT}>
            {history.map((d, i) => {
              const h = ratio(d) * CHART_HEIGHT;
              const x = i * (barW + GAP);
              const y = CHART_HEIGHT - h;
              let fill: string;
              if (!d.hasData) fill = colors.gray200;
              else if (d.hitFloor) fill = colors.success;
              else fill = colors.warning;
              return (
                <Rect
                  key={d.date}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 1)} // 1px floor so 0g days are visible
                  fill={fill}
                  rx={1}
                />
              );
            })}
          </Svg>
        </>
      )}
      <PharmacistTip>{t(tipI18nKey('protein'))}</PharmacistTip>
    </CardShell>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
}

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
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
  });
}
