/**
 * PortionMultiplier — segmented pill control for scaling the AI's portion
 * estimate (½× / 1× / 1½× / 2×). Lives on the AI Review Sheet above the macro
 * grid. Free for all users; no Pro gating.
 *
 * Picked over a snap slider because every change is a single tap (vs find +
 * drag), tap targets are ~84px wide on a 380px sheet, and the discrete-only
 * snap behaviour is honest about what the control actually does. See
 * `.claude/plans/ethereal-munching-lemon.md` for the A-vs-B decision rationale.
 *
 * The scaling math (mapping multiplier → form field strings) lives in
 * `portion-multiplier-helpers.ts` so it's pure-testable. This file is the
 * presentation layer.
 */

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import { PORTION_MULTIPLIERS, type PortionMultiplier } from './portion-multiplier-helpers';

export type PortionMultiplierProps = {
  /** Current selection. */
  value: PortionMultiplier;
  /** Fires when the user picks a new multiplier. */
  onChange: (value: PortionMultiplier) => void;
  /** Live readout shown beside the multiplier — scaled kcal preview. */
  scaledKcal: number | null;
  /** Live readout shown beside the multiplier — scaled protein in grams. */
  scaledProteinG: number;
};

/** Human-readable label for a multiplier (½× / 1× / 1½× / 2×). */
function formatMultiplier(m: PortionMultiplier): string {
  switch (m) {
    case 0.5: return '½×';
    case 1: return '1×';
    case 1.5: return '1½×';
    case 2: return '2×';
  }
}

export function PortionMultiplier({
  value,
  onChange,
  scaledKcal,
  scaledProteinG,
}: PortionMultiplierProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const handlePress = React.useCallback(
    (m: PortionMultiplier) => {
      if (m === value)
        return;
      haptics.tap();
      onChange(m);
    },
    [value, onChange],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          {t('portion_multiplier.label')}
        </Text>
        <View style={styles.readout}>
          <Text style={styles.readoutX}>{formatMultiplier(value)}</Text>
          <Text style={styles.readoutSub} numberOfLines={1}>
            {scaledKcal != null
              ? t('portion_multiplier.readout_with_kcal', {
                  kcal: scaledKcal,
                  proteinG: scaledProteinG,
                })
              : t('portion_multiplier.readout_protein_only', {
                  proteinG: scaledProteinG,
                })}
          </Text>
        </View>
      </View>

      <View style={styles.pillRow} accessibilityRole="radiogroup">
        {PORTION_MULTIPLIERS.map((m) => {
          const isActive = m === value;
          return (
            <Pressable
              key={m}
              onPress={() => handlePress(m)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t('portion_multiplier.pill_a11y', {
                label: formatMultiplier(m),
              })}
              style={({ pressed }) => [
                styles.pill,
                isActive ? styles.pillActive : styles.pillInactive,
                pressed && !isActive ? styles.pillPressed : null,
              ]}
            >
              <Text style={isActive ? styles.pillTextActive : styles.pillText}>
                {formatMultiplier(m)}
              </Text>
            </Pressable>
          );
        })}
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
    container: {
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: spacing.sm + 2,
    },
    label: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    readout: {
      alignItems: 'flex-end',
    },
    readoutX: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.4,
      lineHeight: 22,
    },
    readoutSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    pillRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillInactive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillActive: {
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.primary,
      ...shadows.sm,
    },
    pillPressed: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    pillText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    pillTextActive: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.white,
      letterSpacing: -0.2,
    },
  });
}
