import { format } from 'date-fns';
import { router } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { EscalationCard } from '@/components/safety/escalation-card';
import { CardsCarousel } from '@/components/today/cards-carousel';
import { MedLevelBanner } from '@/components/today/med-level-banner';
import { PhaseBadge } from '@/components/today/phase-badge';
import { ProteinRing } from '@/components/today/protein-ring';
import { StreakCard } from '@/components/today/streak-card';
import { MilestoneToast } from '@/components/ui/milestone-toast';
import { useTodayCheckIn } from '@/features/check-in/hooks';
import { getActiveCards } from '@/features/content-cards/data';
import { useCheckAndUnlockMilestones } from '@/features/journey-cards/hooks';
import { MILESTONES, type Milestone, type MilestoneId } from '@/features/journey-cards/milestones';
import { useTodayData } from '@/features/today/hooks';
import { colors, radius, shadows, spacing } from '@/theme/colors';
import type { InjectionPhase } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PHASE_ACCENT: Record<InjectionPhase, string> = {
  injection_day: colors.phaseInjectionDay,
  peak_suppression: colors.phasePeakSuppression,
  adjustment: colors.phaseAdjustment,
  recovery_window: colors.phaseRecoveryWindow,
  overdue: colors.phaseOverdue,
};

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TodayScreen() {
  const { t } = useTranslation();
  const {
    isLoading,
    profile,
    injectionCycle,
    proteinFloorG,
    proteinConsumedG,
    readiness,
    hourOfDay,
    streak,
    isStreakLoading,
    redFlagDetection,
  } = useTodayData();

  const { checkIn } = useTodayCheckIn();
  const hasCheckedInToday = checkIn !== null;

  // Milestone toast state — shows the first newly unlocked milestone.
  const [toastMilestone, setToastMilestone] = React.useState<Milestone | null>(null);

  const handleMilestonesUnlocked = React.useCallback((ids: MilestoneId[]) => {
    const first = ids[0];
    if (first) {
      const m = MILESTONES[first];
      if (m) setToastMilestone(m);
    }
  }, []);

  // Auto-check and unlock time-based milestones (week_1, 3_months, streak).
  useCheckAndUnlockMilestones(profile?.createdAt, handleMilestonesUnlocked);

  const dateLabel = format(new Date(), 'EEEE, MMMM d');
  const phaseAccentColor = injectionCycle
    ? (PHASE_ACCENT[injectionCycle.phase] ?? colors.primary)
    : colors.primary;

  const greeting = hourOfDay < 12
    ? t('today.greeting_morning')
    : hourOfDay < 17
      ? t('today.greeting_afternoon')
      : t('today.greeting_evening');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('today.setup_title')}</Text>
          <Text style={styles.emptyBody}>{t('today.setup_body')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Milestone unlock toast — floats above content, auto-dismisses */}
      <MilestoneToast
        milestone={toastMilestone}
        onDismiss={() => setToastMilestone(null)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.greetingDate}>{dateLabel}</Text>
          </View>
          <View style={styles.rxBadge}>
            <Text style={styles.rxBadgeText}>Rx</Text>
          </View>
        </View>

        {/* ── Conditional banners ───────────────────────────────── */}
        {profile?.phase === 'maintenance' && (
          <View style={styles.maintenanceBanner}>
            <Text style={styles.maintenanceBannerText}>
              {t('today.maintenance_banner')}
            </Text>
          </View>
        )}

        {profile?.medicationStatus === 'discontinued' && (
          <TouchableOpacity
            style={styles.discontinuedBanner}
            onPress={() => router.push('/discontinuation-mode')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open Life After GLP-1 guidance"
          >
            <Text style={styles.discontinuedBannerText}>
              {t('today.discontinued_banner')}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Readiness Score ───────────────────────────────────── */}
        {readiness && (
          <View style={styles.readinessCard}>
            <Text style={styles.readinessLabel}>{t('today.readiness_title')}</Text>
            <Text style={styles.readinessScore}>{readiness.score}</Text>
            <View style={styles.readinessDivider} />
            <Text style={styles.readinessGuidance}>{readiness.guidance}</Text>
            <View style={styles.readinessTrustBadge}>
              <Text style={styles.readinessTrustText}>
                {t('today.readiness_trust')}
              </Text>
            </View>
          </View>
        )}

        {/* ── Safety escalation ─────────────────────────────────── */}
        {redFlagDetection?.triggered && (
          <EscalationCard
            detection={redFlagDetection}
            onDismiss={() => {}}
          />
        )}

        {/* ── Today's Metrics ───────────────────────────────────── */}
        <SectionLabel label={t('today.metrics_title')} />
        <View style={styles.metricsRow}>
          {/* Protein ring — top accent in primary blue */}
          <View style={[styles.ringCard, { borderTopColor: colors.primary }]}>
            <Text style={styles.cardLabel}>{t('today.protein_label')}</Text>
            <View style={styles.ringWrapper}>
              <ProteinRing
                proteinConsumedG={proteinConsumedG}
                proteinFloorG={proteinFloorG}
                size={130}
              />
            </View>
          </View>

          {/* Injection phase — top accent in current phase color */}
          <View style={[styles.phaseCard, { borderTopColor: phaseAccentColor }]}>
            <Text style={styles.cardLabel}>{t('today.injection_label')}</Text>
            {injectionCycle ? (
              <>
                <PhaseBadge
                  phase={injectionCycle.phase}
                  daysSinceInjection={injectionCycle.daysSinceInjection}
                />
                {injectionCycle.daysUntilNextInjection !== null && (
                  <Text style={styles.nextInjection}>
                    {t('today.next_injection')}{'\n'}
                    <Text style={styles.nextInjectionDays}>
                      {injectionCycle.daysUntilNextInjection}d
                    </Text>
                  </Text>
                )}
                {injectionCycle.isOverdue && (
                  <Text style={styles.overdueText}>{t('today.injection_overdue_inline')}</Text>
                )}
              </>
            ) : (
              <Text style={styles.noDataText}>
                {t('today.no_injection_data')}
              </Text>
            )}
          </View>
        </View>

        {/* ── Shot Day Prep (injection day only) ────────────────── */}
        {injectionCycle?.phase === 'injection_day' && (
          <TouchableOpacity
            style={styles.shotDayCard}
            onPress={() => router.push('/shot-prep')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open injection day checklist"
          >
            <View style={styles.shotDayLeft}>
              <Text style={styles.shotDayEmoji}>💉</Text>
            </View>
            <View style={styles.shotDayContent}>
              <Text style={styles.shotDayTitle}>{t('today.shot_day_title')}</Text>
              <Text style={styles.shotDayBody}>{t('today.shot_day_body')}</Text>
            </View>
            <Text style={[styles.rowChevron, { color: colors.phaseInjectionDay }]}>›</Text>
          </TouchableOpacity>
        )}

        {/* ── Daily Actions ─────────────────────────────────────── */}
        <SectionLabel label={t('today.daily_actions')} />

        {/* Check-in */}
        <TouchableOpacity
          style={styles.checkInCard}
          onPress={() => router.push('/check-in')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={
            hasCheckedInToday ? "Edit today's check-in" : 'Start daily check-in'
          }
        >
          <View
            style={[
              styles.actionIconCircle,
              hasCheckedInToday
                ? styles.actionIconCircleDone
                : styles.actionIconCirclePending,
            ]}
          >
            {hasCheckedInToday ? (
              <Text style={styles.actionCheckmark}>✓</Text>
            ) : (
              <Text style={styles.actionEmoji}>📋</Text>
            )}
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{t('today.checkin_title')}</Text>
            <Text style={styles.actionBody}>
              {hasCheckedInToday
                ? t('today.checkin_logged')
                : t('today.checkin_action')}
            </Text>
          </View>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        {/* Medication Level */}
        <MedLevelBanner phase={injectionCycle?.phase ?? null} />

        {/* Streak */}
        {!isStreakLoading && (
          <StreakCard
            currentStreak={streak?.currentStreak ?? 0}
            longestStreak={streak?.longestStreak ?? 0}
          />
        )}

        {/* Journey */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push('/journey')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="View your journey milestones"
        >
          <View style={styles.actionIconCircle}>
            <Text style={styles.actionEmoji}>🏆</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{t('today.journey_title')}</Text>
            <Text style={styles.actionBody}>{t('today.journey_subtitle')}</Text>
          </View>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        {/* Nutrition Coach */}
        <TouchableOpacity
          style={[styles.ctaCard, styles.ctaCardCoach]}
          onPress={() => router.push('/coach')}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Open Nutrition Coach"
        >
          <View style={[styles.actionIconCircle, styles.actionIconCircleCoach]}>
            <Text style={styles.actionEmoji}>💬</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{t('coach.title')}</Text>
            <Text style={styles.actionBody}>{t('today.coach_subtitle')}</Text>
          </View>
          <Text style={[styles.rowChevron, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>

        {/* ── Pharmacist Content ────────────────────────────────── */}
        <SectionLabel label={t('today.pharmacist_content')} />
        <CardsCarousel cards={getActiveCards()} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // ── Section label ───────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingDate: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  rxBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    marginTop: 4,
  },
  rxBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  // ── Readiness card ──────────────────────────────────────────
  readinessCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  readinessLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  readinessScore: {
    fontSize: 80,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 88,
    letterSpacing: -2,
  },
  readinessDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'stretch',
    marginVertical: spacing.sm,
  },
  readinessGuidance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  readinessTrustBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  readinessTrustText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Metrics row ─────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ringCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  phaseCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  ringWrapper: {
    marginTop: spacing.xs,
  },
  nextInjection: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  nextInjectionDays: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  overdueText: {
    fontSize: 12,
    color: colors.phaseOverdue,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  noDataText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Shot Day card ────────────────────────────────────────────
  shotDayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F0FF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.phaseInjectionDay + '40',
    ...shadows.sm,
  },
  shotDayLeft: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.phaseInjectionDay + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  shotDayEmoji: {
    fontSize: 20,
  },
  shotDayContent: {
    flex: 1,
  },
  shotDayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.phaseInjectionDay,
  },
  shotDayBody: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ── Shared action row styles ─────────────────────────────────
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  ctaCardCoach: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '30',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  actionIconCircleDone: {
    backgroundColor: colors.success,
  },
  actionIconCirclePending: {
    backgroundColor: colors.primaryLight,
  },
  actionIconCircleCoach: {
    backgroundColor: colors.primary + '18',
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionCheckmark: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 20,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionBody: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowChevron: {
    fontSize: 22,
    color: colors.gray300,
    lineHeight: 26,
  },

  // ── Banners ──────────────────────────────────────────────────
  maintenanceBanner: {
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  maintenanceBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  discontinuedBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  discontinuedBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // ── Empty state ──────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
