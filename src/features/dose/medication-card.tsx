// MedicationCard — the consolidated "YOUR MEDICATION" card for oral GLP-1 users.
// Replaces the old PhaseBadge pill + MedLevelBanner tile + building info card (which all
// said the same thing) with one themed card: a phase headline + a "Day N" chip + a short
// educational line + a "View medication level" CTA. Dark-mode safe (themed icon, no
// hardcoded blue). Educational copy defers to the prescriber (covered by the Dose hub's
// Tier-1 top + Tier-2 footer disclaimers).

import type { GlipraTokens } from '@/theme/tokens';
import type { OralPhase } from '@/types';

import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Activity } from '@/components/ui/icons';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export function MedicationCard({ phase, daysOnMed }: { phase: OralPhase; daysOnMed: number }) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const phaseColor: Record<OralPhase, string> = {
    building: colors.phaseAdjustment,
    steady_state: colors.phaseRecoveryWindow,
    dose_due: colors.phaseInjectionDay,
    dose_missed: colors.phaseOverdue,
  };
  const accent = phaseColor[phase];

  const headline = t(`med_banner_oral.${phase}_headline`);
  const body = phase === 'building'
    ? t('dose.building_body')
    : t(`med_banner_oral.${phase}_pill`);

  return (
    <TouchableOpacity
      testID="medication-card"
      style={styles.card}
      onPress={() => { haptics.tap(); router.push('/medication-level'); }}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('dose.view_level')}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Activity color={colors.primary} width={20} height={20} />
        </View>
        <Text style={styles.headline} numberOfLines={2}>{headline}</Text>
        {daysOnMed > 0 && (
          <View style={[styles.dayChip, { backgroundColor: `${accent}22`, borderColor: accent }]}>
            <View style={[styles.dayDot, { backgroundColor: accent }]} />
            <Text style={[styles.dayChipText, { color: accent }]}>{`Day ${daysOnMed}`}</Text>
          </View>
        )}
      </View>

      <Text style={styles.body}>{body}</Text>

      <View style={styles.divider} />

      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>{t('dose.view_level')}</Text>
        <Text style={styles.ctaChevron}>›</Text>
      </View>
    </TouchableOpacity>
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
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderTopWidth: 2,
      borderTopColor: colors.primary,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headline: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    dayChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: radius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.sm + 1,
      paddingVertical: 3,
      flexShrink: 0,
    },
    dayDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    dayChipText: {
      fontSize: 11,
      fontWeight: '600',
    },
    body: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
      marginTop: spacing.md,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
    ctaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    ctaText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    ctaChevron: {
      fontSize: 18,
      color: colors.primary,
    },
  });
}
