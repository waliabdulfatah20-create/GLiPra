// Route: /progress
// Progress dashboard — registered as a permanent bottom-nav tab.
// Five metric cards (weight EWMA, protein hit-rate, streak calendar,
// injection adherence, check-in symptoms) sharing one 7D/30D/90D selector.
//
// Rule 8: clinical screen — Tier-2 DisclaimerBanner is rendered at the bottom.

import { useTranslation } from 'react-i18next';
import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckInSymptomCard } from '@/components/progress/check-in-symptom-card';
import { InjectionAdherenceCard } from '@/components/progress/injection-adherence-card';
import { ProteinHitRateCard } from '@/components/progress/protein-hit-rate-card';
import { StreakCalendarCard } from '@/components/progress/streak-calendar-card';
import { WeightResultsCard } from '@/components/progress/weight-results-card';
import { WeightTrendCard } from '@/components/progress/weight-trend-card';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useTodayProfile } from '@/features/today/hooks';
import { useWeightLogs } from '@/features/weight/hooks';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

type Range = '7D' | '30D' | '90D' | 'All';
const RANGES: Range[] = ['7D', '30D', '90D', 'All'];
const RANGE_DAYS: Record<Range, number> = { '7D': 7, '30D': 30, '90D': 90, 'All': 9999 };

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors, spacing }), [colors, spacing]);

  const { width: screenWidth } = useWindowDimensions();
  const [range, setRange] = React.useState<Range>('30D');
  const days = RANGE_DAYS[range];

  // Data for WeightResultsCard — hook fetches the correct window server-side.
  const { data: profile } = useTodayProfile();
  const { logs: weightLogsInRange } = useWeightLogs(days);

  // Available width inside a card: screen − scroll padding (lg × 2) − card padding (md × 2)
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.md * 2;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header — tab root, no back button */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('progress.title')}</Text>
        <Text style={styles.subtitle}>{t('progress.subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Range selector — drives every card */}
        <View style={styles.rangeRow}>
          <SegmentedControl
            options={RANGES}
            active={range}
            onSelect={(v) => setRange(v as Range)}
          />
        </View>

        {/* Cards — order chosen for at-a-glance: results → trend → hit-rate → calendar → adherence → symptoms */}
        <WeightResultsCard
          logs={weightLogsInRange}
          goalWeightKg={profile?.goalWeightKg ?? null}
          heightCm={profile?.heightCm ?? null}
        />
        <WeightTrendCard days={days} width={chartWidth} />
        <ProteinHitRateCard days={days} width={chartWidth} />
        <StreakCalendarCard days={days} width={chartWidth} />
        <InjectionAdherenceCard days={days} width={chartWidth} />
        <CheckInSymptomCard days={days} width={chartWidth} />

        {/* Rule 8: Tier-2 disclaimer covers all metrics on this screen */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>{t('progress.disclaimer')}</Text>
        </DisclaimerBanner>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
}

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    rangeRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },
  });
}
