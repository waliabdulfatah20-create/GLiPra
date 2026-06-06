import type { GlipraTokens } from '@/theme/tokens';
import type { InjectionPhase, OralPhase } from '@/types';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity } from '@/components/ui/icons';
import { useMedicationLevelCurve } from '@/features/medication-level/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

// Brand tokens for Clean Clinical design
const BRAND = '#5b21b6';
const MED_BLUE = '#60a5fa';
const MED_BLUE_BG = 'rgba(37,99,235,0.12)';

// Route-aware: injection users key off InjectionPhase + med_banner.*; oral users
// off OralPhase + med_banner_oral.*. The curve hook is itself route-aware.
type MedLevelBannerProps
  = | { route: 'injection'; phase: InjectionPhase | null }
    | { route: 'oral'; phase: OralPhase | null };

export function MedLevelBanner({ route, phase }: MedLevelBannerProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const { curve, isLoading } = useMedicationLevelCurve();

  const isOral = route === 'oral';
  const namespace = isOral ? 'med_banner_oral' : 'med_banner';
  const emptyCta = isOral
    ? 'Log your dose to view your curve'
    : 'Log your injection to view your curve';

  // Still loading — don't flash a card yet
  if (isLoading)
    return null;

  // No dose data yet — show a persistent setup CTA
  if (!curve || !phase) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => { haptics.tap(); router.push('/medication-level'); }}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Set up medication level"
      >
        <View style={styles.textRow}>
          <View style={styles.iconCircle}>
            <Activity color={MED_BLUE} width={20} height={20} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.headline} numberOfLines={1}>
              Medication level estimator
            </Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{emptyCta}</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const headline = t(`${namespace}.${phase}_headline`);
  const pill = t(`${namespace}.${phase}_pill`);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => { haptics.tap(); router.push('/medication-level'); }}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="View medication level curve"
    >
      {/* Headline + pill */}
      <View style={styles.textRow}>
        <View style={styles.iconCircle}>
          <Activity color={MED_BLUE} width={20} height={20} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.headline} numberOfLines={1}>{headline}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{pill}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
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
      padding: spacing.md,
      gap: spacing.sm,
      borderTopWidth: 2,
      borderTopColor: BRAND,
      ...shadows.sm,
    },
    textRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: MED_BLUE_BG,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    headline: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    pill: {
      alignSelf: 'flex-start',
      backgroundColor: `rgba(91,33,182,0.08)`,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    pillText: {
      fontSize: 11,
      fontWeight: '600',
      color: BRAND,
    },
    chevron: {
      fontSize: 22,
      color: colors.textDisabled,
      fontWeight: '300',
    },
  });
}
