// DailyMacroCard — shows today's running nutrition totals on the Log screen.
// Protein gets a progress bar vs the user's protein floor.
// GLP-1 Watch section (B12, vitamin D, magnesium, zinc) renders only when
// at least one food log entry today has micronutrient data.

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTodayProfile } from '@/features/today/hooks';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

import { useDailyMacros } from './hooks';

export function DailyMacroCard() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const {
    protein,
    carbs,
    fat,
    fiber,
    calories,
    b12Mcg,
    vitaminDIu,
    magnesiumMg,
    zincMg,
    hasMicronutrients,
    isLoading: macrosLoading,
  } = useDailyMacros();

  const { data: profile, isLoading: profileLoading } = useTodayProfile();
  const proteinFloor = profile?.proteinFloorG ?? 0;

  if (macrosLoading || profileLoading) return null;

  // Don't render the card if nothing has been logged yet
  if (protein === 0 && carbs === 0 && fat === 0 && calories === 0) return null;

  const proteinProgress = proteinFloor > 0 ? Math.min(1, protein / proteinFloor) : 0;
  const proteinColor =
    proteinProgress >= 0.9
      ? colors.proteinGood
      : proteinProgress >= 0.6
        ? colors.warning
        : colors.proteinLow;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>{t('log.nutrition_today')}</Text>
      <View style={styles.card}>
        {/* Primary row — Protein + Calories */}
        <View style={styles.primaryRow}>
          {/* Protein with progress bar */}
          <View style={styles.proteinBlock}>
            <View style={styles.primaryLabelRow}>
              <Text style={styles.primaryMetricLabel}>Protein</Text>
            </View>
            <Text style={[styles.primaryValue, { color: proteinColor }]}>
              {protein.toFixed(1)}g
              {proteinFloor > 0 && (
                <Text style={styles.proteinFloorText}> / {Math.round(proteinFloor)}g</Text>
              )}
            </Text>
            {/* Progress bar */}
            {proteinFloor > 0 && (
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(proteinProgress * 100)}%`, backgroundColor: proteinColor },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Calories */}
          {calories > 0 && (
            <View style={styles.caloriesBlock}>
              <Text style={styles.primaryMetricLabel}>Calories</Text>
              <Text style={styles.caloriesValue}>{Math.round(calories)}</Text>
              <Text style={styles.caloriesUnit}>kcal</Text>
            </View>
          )}
        </View>

        {/* Secondary row — Carbs, Fat, Fiber */}
        {(carbs > 0 || fat > 0 || fiber > 0) && (
          <>
            <View style={styles.divider} />
            <View style={styles.secondaryRow}>
              {carbs > 0 && (
                <View style={styles.secondaryBlock}>
                  <Text style={styles.secondaryValue}>{carbs.toFixed(1)}g</Text>
                  <Text style={styles.secondaryLabel}>Carbs</Text>
                </View>
              )}
              {fat > 0 && (
                <View style={styles.secondaryBlock}>
                  <Text style={styles.secondaryValue}>{fat.toFixed(1)}g</Text>
                  <Text style={styles.secondaryLabel}>Fat</Text>
                </View>
              )}
              {fiber > 0 && (
                <View style={styles.secondaryBlock}>
                  <Text style={styles.secondaryValue}>{fiber.toFixed(1)}g</Text>
                  <Text style={styles.secondaryLabel}>Fiber</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* GLP-1 Watch — micronutrients, only shown when data exists */}
        {hasMicronutrients && (
          <>
            <View style={styles.divider} />
            <View style={styles.glpWatchSection}>
              <Text style={styles.glpWatchLabel}>{t('log.glp1_watch')}</Text>
              <Text style={styles.glpWatchNote}>{t('log.estimated')}</Text>
            </View>
            <View style={styles.microRow}>
              {b12Mcg > 0 && (
                <View style={styles.microBlock}>
                  <Text style={styles.microValue}>{b12Mcg.toFixed(1)}</Text>
                  <Text style={styles.microUnit}>mcg B-12</Text>
                </View>
              )}
              {vitaminDIu > 0 && (
                <View style={styles.microBlock}>
                  <Text style={styles.microValue}>{Math.round(vitaminDIu)}</Text>
                  <Text style={styles.microUnit}>IU Vit D</Text>
                </View>
              )}
              {magnesiumMg > 0 && (
                <View style={styles.microBlock}>
                  <Text style={styles.microValue}>{Math.round(magnesiumMg)}</Text>
                  <Text style={styles.microUnit}>mg Mg</Text>
                </View>
              )}
              {zincMg > 0 && (
                <View style={styles.microBlock}>
                  <Text style={styles.microValue}>{zincMg.toFixed(1)}</Text>
                  <Text style={styles.microUnit}>mg Zinc</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    wrapper: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      marginLeft: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      ...shadows.sm,
    },
    primaryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    proteinBlock: {
      flex: 1,
    },
    primaryLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    primaryMetricLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    primaryValue: {
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    proteinFloorText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    progressTrack: {
      marginTop: 6,
      height: 5,
      backgroundColor: colors.gray100,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    caloriesBlock: {
      alignItems: 'flex-end',
      paddingTop: 2,
    },
    caloriesValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    caloriesUnit: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    secondaryRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    secondaryBlock: {
      alignItems: 'center',
      minWidth: 52,
    },
    secondaryValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    secondaryLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    glpWatchSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    glpWatchLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    glpWatchNote: {
      fontSize: 11,
      color: colors.textDisabled,
      fontStyle: 'italic',
    },
    microRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    microBlock: {
      alignItems: 'center',
      minWidth: 60,
    },
    microValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    microUnit: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
  });
}
