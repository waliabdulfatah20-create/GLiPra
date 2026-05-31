import type { GlipraTokens } from '@/theme/tokens';
import type { InjectionPhase } from '@/types';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Line, Polyline, Svg } from 'react-native-svg';
import { Activity } from '@/components/ui/icons';
import { useMedicationLevelCurve } from '@/features/medication-level/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

// Brand tokens for Clean Clinical design
const BRAND = '#5b21b6';
const AMBER = '#d97706';
const MED_BLUE = '#60a5fa';
const MED_BLUE_BG = 'rgba(37,99,235,0.12)';

const PHASE_HEADLINE: Record<InjectionPhase, string> = {
  injection_day: 'Injection day: dose administered',
  peak_suppression: 'Peak suppression: appetite well-controlled',
  adjustment: 'Adjustment phase: monitor for GI symptoms',
  recovery_window: 'Recovery window: appetite may return',
  overdue: 'Injection overdue: contact prescriber',
};

const PHASE_PILL: Record<InjectionPhase, string> = {
  injection_day: 'Log your injection site',
  peak_suppression: 'High protein priority',
  adjustment: 'Stay hydrated',
  recovery_window: 'Increase meal frequency if needed',
  overdue: 'Contact prescriber',
};

type MedLevelBannerProps = {
  /** Current injection cycle phase — from useTodayData() */
  phase: InjectionPhase | null;
};

const SPARKLINE_W = 200;
const SPARKLINE_H = 36;

/** Mini SVG sparkline of the steady-state concentration curve */
function CurveSparkline({
  curve,
  todayOffset,
  injectionIntervalDays,
}: {
  curve: Array<{ dayOffset: number; levelMg: number }>;
  todayOffset: number;
  injectionIntervalDays: number;
}) {
  const windowEnd = injectionIntervalDays * 2;
  const visible = curve.filter(p => p.dayOffset <= windowEnd);
  if (visible.length < 2)
    return null;

  const minOffset = visible[0].dayOffset;
  const maxOffset = visible[visible.length - 1].dayOffset;
  const maxLevel = Math.max(...visible.map(p => p.levelMg));

  function toX(offset: number): number {
    if (maxOffset === minOffset)
      return 0;
    return ((offset - minOffset) / (maxOffset - minOffset)) * SPARKLINE_W;
  }
  function toY(level: number): number {
    return maxLevel > 0 ? SPARKLINE_H - (level / maxLevel) * SPARKLINE_H : SPARKLINE_H;
  }

  const points = visible.map(p => `${toX(p.dayOffset)},${toY(p.levelMg)}`).join(' ');
  const todayX = toX(todayOffset);
  const todayY = toY(visible.find(p => p.dayOffset === todayOffset)?.levelMg ?? maxLevel * 0.5);

  return (
    <Svg width={SPARKLINE_W} height={SPARKLINE_H} viewBox={`0 0 ${SPARKLINE_W} ${SPARKLINE_H}`}>
      {/* Curve line */}
      <Polyline
        points={points}
        fill="none"
        stroke={BRAND}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
      {/* Today marker */}
      <Line
        x1={todayX}
        y1={0}
        x2={todayX}
        y2={SPARKLINE_H}
        stroke={AMBER}
        strokeWidth={1}
        strokeDasharray="2 2"
        opacity={0.8}
      />
      <Circle cx={todayX} cy={todayY} r={3} fill={AMBER} />
    </Svg>
  );
}

export function MedLevelBanner({ phase }: MedLevelBannerProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const { curve, todayOffset, injectionIntervalDays, isLoading } = useMedicationLevelCurve();

  // Still loading — don't flash a card yet
  if (isLoading)
    return null;

  // No injection data yet — show a persistent setup CTA
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
              <Text style={styles.pillText}>Log your injection to view your curve</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const headline = t(`med_banner.${phase}_headline`);
  const pill = t(`med_banner.${phase}_pill`);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => { haptics.tap(); router.push('/medication-level'); }}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="View medication level curve"
    >
      {/* Sparkline row */}
      <View style={styles.sparklineRow}>
        <CurveSparkline
          curve={curve}
          todayOffset={todayOffset}
          injectionIntervalDays={injectionIntervalDays}
        />
      </View>

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
    sparklineRow: {
      alignItems: 'flex-start',
      overflow: 'hidden',
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
