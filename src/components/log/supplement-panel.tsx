// SupplementPanel
// The "Supplement" logging mode on the Nutrition screen. Lists the 5 tracked
// micronutrients with today's total vs goal; tapping a row opens the per-nutrient
// quick-add. Always available (even with zero micros logged), unlike the
// Micronutrient Watch card which hides until something is logged.

import type { NutrientKey } from '@/features/food-log/micronutrient-constants';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDailyMacros } from '@/features/food-log/hooks';
import {
  getNutrientPct,
  getNutrientStatus,
  MICRONUTRIENT_RDAS,
} from '@/features/food-log/micronutrient-constants';
import { SUPPLEMENT_NUTRIENTS } from '@/features/food-log/supplement';
import { useTheme } from '@/lib/ThemeContext';

type Props = {
  onAdd: (key: NutrientKey) => void;
};

export function SupplementPanel({ onAdd }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );
  const macros = useDailyMacros();

  return (
    <View style={styles.panel}>
      <Text style={styles.hint}>{t('log.supplement_panel_hint')}</Text>
      {SUPPLEMENT_NUTRIENTS.map((n) => {
        const value = macros[n.key];
        const rda = MICRONUTRIENT_RDAS[n.key];
        const pct = getNutrientPct(value, rda);
        const status = getNutrientStatus(value, rda);
        const dotStyle
          = status === 'green'
            ? styles.dotGreen
            : status === 'amber'
              ? styles.dotAmber
              : styles.dotRed;
        const display = n.unit === 'mcg' ? value.toFixed(1) : Math.round(value).toString();
        const totalLabel = `${display} / ${rda} ${n.unit}`;
        const pctLabel = pct >= 100 ? t('log.goal_met') : t('log.pct_of_goal', { pct });

        return (
          <Pressable
            key={n.key}
            testID={`supplement-row-${n.key}`}
            style={styles.row}
            onPress={() => onAdd(n.key)}
            accessibilityRole="button"
            accessibilityLabel={t('log.supplement_sheet_title', { nutrient: t(n.labelKey) })}
          >
            <View style={[styles.dot, dotStyle]} />
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{t(n.labelKey)}</Text>
              <Text style={styles.rowTotal}>{`${totalLabel} · ${pctLabel}`}</Text>
            </View>
            <View style={styles.plusCircle}>
              <Text style={styles.plus}>+</Text>
            </View>
          </Pressable>
        );
      })}
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
    panel: {
      marginTop: spacing.sm,
    },
    hint: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginBottom: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    dotGreen: { backgroundColor: colors.success },
    dotAmber: { backgroundColor: colors.warning },
    dotRed: { backgroundColor: colors.error },
    rowText: {
      flex: 1,
    },
    rowName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    rowTotal: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    plusCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plus: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      lineHeight: 20,
    },
  });
}
