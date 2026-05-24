import * as React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { DISCONTINUATION_GUIDES } from '@/features/medication-status/discontinuation-guidance';
import { useTodayProfile } from '@/features/today/hooks';
import { useWeightLogs } from '@/features/weight/hooks';
import { colors, radius, shadows, spacing } from '@/theme/colors';

// Escalation copy — Rule 9: locked text, no condition names.
const ESCALATION_COPY =
  "You've logged symptoms that may need medical attention. Please contact your prescriber today.";

function WeightTrendSection() {
  const { logs, isLoading } = useWeightLogs();

  if (isLoading) {
    return (
      <View style={styles.weightCard}>
        <Text style={styles.weightLabel}>RECENT WEIGHT TREND</Text>
        <Text style={styles.weightLoadingText}>Loading weight data…</Text>
      </View>
    );
  }

  if (logs.length === 0) {
    return (
      <View style={styles.weightCard}>
        <Text style={styles.weightLabel}>RECENT WEIGHT TREND</Text>
        <Text style={styles.weightEmptyText}>
          No weight logs yet. Tap "Weight Tracking" in Settings to start logging.
        </Text>
        <Text style={styles.weightNote}>
          Regular weigh-ins are especially important after stopping GLP-1 therapy.
          Weekly tracking gives you the earliest signal of any rebound trend.
        </Text>
      </View>
    );
  }

  // Show last 3 entries
  const recent = logs.slice(-3);
  const latest = logs[logs.length - 1];
  const earliest = logs[logs.length - 4] ?? logs[0];
  const trendKg =
    logs.length >= 2
      ? (latest?.weightKg ?? 0) - (earliest?.weightKg ?? 0)
      : null;

  return (
    <View style={styles.weightCard}>
      <Text style={styles.weightLabel}>RECENT WEIGHT TREND</Text>
      {recent.map((entry) => (
        <View key={entry.id} style={styles.weightRow}>
          <Text style={styles.weightDate}>
            {format(parseISO(entry.loggedAt), 'MMM d')}
          </Text>
          <Text style={styles.weightValue}>{entry.weightKg.toFixed(1)} kg</Text>
          {entry.ewmaWeightKg !== null && (
            <Text style={styles.weightEwma}>
              smoothed {entry.ewmaWeightKg.toFixed(1)}
            </Text>
          )}
        </View>
      ))}
      {trendKg !== null && (
        <View style={styles.trendRow}>
          <Text
            style={[
              styles.trendText,
              trendKg > 0 ? styles.trendUp : styles.trendDown,
            ]}
          >
            {trendKg > 0 ? '+' : ''}{trendKg.toFixed(1)} kg over this period
          </Text>
        </View>
      )}
      <Text style={styles.weightNote}>
        Consistent tracking is your best early-warning system for rebound weight gain.
      </Text>
    </View>
  );
}

export default function DiscontinuationModeScreen() {
  const { data: profile, isLoading } = useTodayProfile();

  // Full protein floor — no maintenance reduction after discontinuation.
  // Muscle preservation is the highest priority (CLAUDE.md).
  const proteinFloorG = profile?.proteinFloorG ?? 0;

  function handleContactPrescriber() {
    Alert.alert(
      'Contact Your Prescriber',
      ESCALATION_COPY,
      [{ text: 'OK', style: 'default' }],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Life After GLP-1</Text>

        {/* Disclaimer — Rule 8: tier 1 on clinical screens */}
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerText}>
            The guidance on this screen is designed by a licensed pharmacist for
            educational purposes only. It does not constitute medical advice. Always
            consult your prescriber before making changes to your treatment or if
            you have concerns about your health.
          </Text>
        </DisclaimerBanner>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>
            You've completed your GLP-1 journey.
          </Text>
          <Text style={styles.heroBody}>
            Let's protect what you've built. Muscle mass, healthy habits, and a
            sustainable weight are yours to keep — with the right support.
          </Text>
          <Text style={styles.heroCredit}>Designed by a licensed pharmacist</Text>
        </View>

        {/* Protein floor — full value, no reduction */}
        <View style={styles.proteinCard}>
          <Text style={styles.proteinLabel}>YOUR PROTEIN FLOOR</Text>
          {isLoading ? (
            <Text style={styles.proteinLoadingText}>Loading…</Text>
          ) : (
            <>
              <View style={styles.proteinRow}>
                <Text style={styles.proteinValue}>{proteinFloorG || '—'}</Text>
                <Text style={styles.proteinUnit}>{proteinFloorG ? 'g / day' : ''}</Text>
              </View>
              <Text style={styles.proteinNote}>
                After discontinuing, your full protein floor applies — no reduction.
                Protecting lean muscle mass is the highest nutritional priority in
                the weeks and months following your last dose.
              </Text>
            </>
          )}
        </View>

        {/* Weight trend section */}
        <WeightTrendSection />

        {/* Guidance cards */}
        <Text style={styles.sectionTitle}>Pharmacist Guidance</Text>
        {DISCONTINUATION_GUIDES.map((guide) => (
          <View key={guide.id} style={styles.guideCard}>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.guideBody}>{guide.body}</Text>
          </View>
        ))}

        {/* Contact prescriber — voluntary prompt, not a red-flag card */}
        <TouchableOpacity
          style={styles.prescriberButton}
          onPress={handleContactPrescriber}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Contact your prescriber"
        >
          <Text style={styles.prescriberButtonText}>Contact your prescriber</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Header
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Disclaimer
  disclaimerText: {
    fontSize: 13,
    color: '#9A3412',
    lineHeight: 20,
  },

  // Hero card
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  heroBody: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  heroCredit: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontStyle: 'italic',
  },

  // Protein floor card
  proteinCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  proteinLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  proteinRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  proteinValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  proteinUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  proteinNote: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  proteinLoadingText: {
    fontSize: 14,
    color: colors.textDisabled,
    paddingVertical: spacing.md,
  },

  // Weight trend card
  weightCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  weightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  weightDate: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 52,
  },
  weightValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  weightEwma: {
    fontSize: 12,
    color: colors.textDisabled,
  },
  trendRow: {
    marginTop: spacing.sm,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trendUp: {
    color: colors.warning,
  },
  trendDown: {
    color: colors.success,
  },
  weightNote: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  weightLoadingText: {
    fontSize: 14,
    color: colors.textDisabled,
    paddingVertical: spacing.md,
  },
  weightEmptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },

  // Section heading
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  // Guidance cards
  guideCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
    ...shadows.sm,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  guideBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Contact prescriber button
  prescriberButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  prescriberButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
