import type { ContentCard } from '@/features/content-cards/data';
import type { Milestone, MilestoneId } from '@/features/journey-cards/milestones';
import type { GlipraTokens } from '@/theme/tokens';
import type { InjectionPhase } from '@/types';
import { differenceInCalendarDays, format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EscalationCard } from '@/components/safety/escalation-card';
import { CardsCarousel } from '@/components/today/cards-carousel';
import { ContentCardSheet } from '@/components/today/content-card-sheet';
import { DailyGuidanceCard } from '@/components/today/daily-guidance-card';
import { DoseWindowCard } from '@/components/today/dose-window-card';
import { FuelCard } from '@/components/today/fuel-card';
import { PharmacistSpotlightCard } from '@/components/today/pharmacist-spotlight-card';
import { StreakCard } from '@/components/today/streak-card';
import {
  Activity,
  ClipboardCheck,
  Dumbbell,
  ProgressPath,
  Settings as SettingsIcon,
  Syringe,
  TrendingUp,
  Utensils,
} from '@/components/ui/icons';
import { MilestoneToast } from '@/components/ui/milestone-toast';
import { TodaySkeleton } from '@/components/ui/today-skeleton';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useCardioInterference, useCardioWeekly } from '@/features/cardio/hooks';
import { markRedFlagTriggered } from '@/features/check-in/api';
import { useTodayCheckIn } from '@/features/check-in/hooks';
import { getActiveCardsForRoute } from '@/features/content-cards/data';
import { useDailyGuidance } from '@/features/daily-guidance/hooks';
import { selectInjectionDoseRow } from '@/features/dose/smart-dose-row';
import { useCheckAndUnlockMilestones } from '@/features/journey-cards/hooks';
import { MILESTONES } from '@/features/journey-cards/milestones';
import { useLogOralDose, useSetDoseWindowRespected } from '@/features/oral-dose/hooks';
import { useResistanceWeekly } from '@/features/resistance/hooks';
import { useRedFlagSnooze } from '@/features/safety/hooks';
import { useTodayData } from '@/features/today/hooks';
import { analytics, EVENTS } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PHASE_LABELS: Partial<Record<InjectionPhase, string>> = {
  injection_day: 'For your injection day',
  peak_suppression: 'For your peak suppression days',
  adjustment: 'For your adjustment phase',
  recovery_window: 'For your recovery window',
};

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  const { colors, spacing } = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      {label}
    </Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TodayScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const {
    isLoading,
    profile,
    administrationRoute,
    injectionCycle,
    oralLastDoseTakenAt,
    oralLastDoseId,
    oralLastDoseWindowRespected,
    oralAdherenceStreak,
    hourOfDay,
    streak,
    isStreakLoading,
    redFlagDetection,
    guidanceContext,
  } = useTodayData();

  const isOral = administrationRoute === 'oral';
  // Single de-duplicated dose row for injection users (status moved to the Dose tab).
  const injectionDoseRow = isOral ? null : selectInjectionDoseRow(injectionCycle);
  const logOralDose = useLogOralDose();
  const setWindowRespected = useSetDoseWindowRespected();

  const handleTakeOralDose = React.useCallback(() => {
    logOralDose.mutate({ takenAt: new Date().toISOString() });
  }, [logOralDose]);

  const handleConfirmWindow = React.useCallback(
    (respected: boolean) => {
      if (oralLastDoseId)
        setWindowRespected.mutate({ logId: oralLastDoseId, windowRespected: respected });
    },
    [setWindowRespected, oralLastDoseId],
  );

  const { checkIn } = useTodayCheckIn();
  const hasCheckedInToday = checkIn !== null;

  const { frequency: resistanceWeekly } = useResistanceWeekly();
  const resistanceMet
    = resistanceWeekly.currentWeekSessions >= resistanceWeekly.weeklyTarget;
  // Cardio is a SECONDARY tracker — it never enters the muscle score. The
  // interference flag warns when weekly cardio outpaces weekly resistance.
  const { frequency: cardioWeekly } = useCardioWeekly();
  const cardioInterferes = useCardioInterference();

  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { isSnoozed, isLoading: snoozeLoading, snooze } = useRedFlagSnooze();

  const {
    data: dailyGuidance,
    isLoading: isGuidanceLoading,
    isError: isGuidanceError,
  } = useDailyGuidance(guidanceContext);

  // isTriggered: detection fired AND snooze has loaded AND snooze is not active
  const isTriggered
    = !!redFlagDetection?.triggered && !snoozeLoading && !isSnoozed;

  // Write audit flag to DB when triggered (non-blocking, non-fatal)
  React.useEffect(() => {
    if (redFlagDetection?.triggered && userId) {
      // Rule 2: no flag type codes — only aggregate count
      analytics.capture(EVENTS.RED_FLAG_DETECTED, {
        flag_count: redFlagDetection.patterns?.length ?? 1,
      });
      markRedFlagTriggered(userId, today).catch(() => {});
    }
  }, [redFlagDetection?.triggered, userId, today]);

  const handleDismiss = React.useCallback(async () => {
    await snooze();
  }, [snooze]);

  // Milestone toast state — shows the first newly unlocked milestone.
  const [toastMilestone, setToastMilestone] = React.useState<Milestone | null>(null);

  // Pharmacist spotlight state
  const [sheetCard, setSheetCard] = React.useState<ContentCard | null>(null);
  const [showCarousel, setShowCarousel] = React.useState(false);

  // Phase-aware spotlight card selection — phase match first, then daily rotation.
  // Route-filtered so oral-only cards never surface for injection users (and v.v.).
  const currentPhase = injectionCycle?.phase ?? null;
  const cardRoute = isOral ? 'oral' : 'injection';
  const spotlightCard = React.useMemo(() => {
    const all = getActiveCardsForRoute(cardRoute);
    if (currentPhase) {
      const phaseMatch = all.find(
        c => c.phases?.includes(currentPhase as InjectionPhase),
      );
      if (phaseMatch)
        return phaseMatch;
    }
    // Fallback: rotate universal cards by day-of-year so it changes daily
    const universal = all.filter(c => !c.phases?.length);
    const dayOfYear = differenceInCalendarDays(
      new Date(),
      new Date(new Date().getFullYear(), 0, 0),
    );
    return universal[dayOfYear % universal.length] ?? all[0];
  }, [currentPhase, cardRoute]);
  const spotlightPhaseLabel = currentPhase
    ? (PHASE_LABELS[currentPhase as InjectionPhase] ?? undefined)
    : undefined;

  const handleMilestonesUnlocked = React.useCallback((ids: MilestoneId[]) => {
    const first = ids[0];
    if (first) {
      const m = MILESTONES[first];
      if (m)
        setToastMilestone(m);
    }
  }, []);

  // Auto-check and unlock time-based milestones (week_1, 3_months, streak).
  useCheckAndUnlockMilestones(profile?.createdAt, handleMilestonesUnlocked);

  const dateLabel = format(new Date(), 'EEEE, MMMM d');

  const greeting = hourOfDay < 12
    ? t('today.greeting_morning')
    : hourOfDay < 17
      ? t('today.greeting_afternoon')
      : t('today.greeting_evening');

  // Escalation override — replaces all content when triggered
  if (isTriggered && redFlagDetection) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.escalationContent}
          showsVerticalScrollIndicator={false}
        >
          <EscalationCard detection={redFlagDetection} onDismiss={handleDismiss} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: gradients.hero[0] }]}
        edges={['top']}
      >
        <TodaySkeleton />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('today.setup_title')}</Text>
          <Text style={styles.emptyBody}>{t('today.setup_body')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    // SafeAreaView background = gradient start so the status-bar area matches the hero.
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top']}
    >
      {/* Milestone unlock toast — floats above content, auto-dismisses */}
      <MilestoneToast
        milestone={toastMilestone}
        onDismiss={() => setToastMilestone(null)}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      >
        {/* ── Gradient hero ────────────────────────────────────── */}
        {/* Full-bleed: negative margins cancel the scroll padding, internal padding re-adds it. */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.greetingDate}>{dateLabel}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => { haptics.tap(); router.push('/settings'); }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('today.settings_button_label')}
                style={styles.gearButton}
              >
                <SettingsIcon color="#ffffff" />
              </Pressable>
              <View style={styles.rxBadge}>
                <Text style={styles.rxBadgeText}>Rx</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Content area — padded, sits below the gradient hero ─ */}
        <View style={styles.contentArea}>

          {/* ── Muscle Preservation hero: muscle score + protein + readiness + fiber + micros ── */}
          <FuelCard />

          {/* ── Daily Actions ─────────────────────────────────────── */}
          <SectionLabel label={t('today.daily_actions')} />

          {/* Dose Window — oral GLP-1 only, and only while actively dosing. */}
          {isOral && (
            <DoseWindowCard
              lastDoseTakenAt={oralLastDoseTakenAt}
              currentStreak={oralAdherenceStreak}
              onTake={handleTakeOralDose}
              isLogging={logOralDose.isPending}
              lastDoseId={oralLastDoseId}
              lastDoseWindowRespected={oralLastDoseWindowRespected}
              onConfirmWindow={handleConfirmWindow}
              isConfirming={setWindowRespected.isPending}
            />
          )}

          {/* Dose — injection users get one row that deep-links to the Dose tab. */}
          {!isOral && injectionDoseRow && (
            <TouchableOpacity
              testID="today-dose-row"
              style={[styles.actionCard, { borderTopColor: colors.primary }]}
              onPress={() => { haptics.tap(); router.push(injectionDoseRow.target); }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('today.dose_row_title')}
            >
              <View style={[styles.actionIconCircle, styles.actionIconCirclePending]}>
                <Syringe color={colors.primary} width={20} height={20} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionHeadline}>{t('today.dose_row_title')}</Text>
                <View style={styles.actionPill}>
                  <Text style={styles.actionPillText}>
                    {injectionDoseRow.pillKey === 'today.dose_row_next'
                      ? t('today.dose_row_next', { days: injectionDoseRow.days ?? 0 })
                      : t(injectionDoseRow.pillKey)}
                  </Text>
                </View>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          )}

          {/* Eating-style nudge — shown until the user sets their dietary pattern */}
          {profile && profile.dietaryPattern === null && (
            <TouchableOpacity
              style={[styles.actionCard, { borderTopColor: colors.primary }]}
              onPress={() => { haptics.tap(); router.push('/dietary-preference'); }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('today.dietary_nudge_title')}
            >
              <View style={[styles.actionIconCircle, styles.actionIconCirclePending]}>
                <Utensils color={colors.primary} width={20} height={20} />
              </View>
              <View style={styles.actionTextBlock}>
                <Text style={styles.actionHeadline}>{t('today.dietary_nudge_title')}</Text>
                <View style={styles.actionPill}>
                  <Text style={styles.actionPillText}>{t('today.dietary_nudge_subtitle')}</Text>
                </View>
              </View>
              <Text style={styles.rowChevron}>›</Text>
            </TouchableOpacity>
          )}

          {/* Check-in */}
          <TouchableOpacity
            style={[
              styles.actionCard,
              { borderTopColor: hasCheckedInToday ? colors.success : colors.primary },
            ]}
            onPress={() => { haptics.tap(); router.push('/check-in'); }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={
              hasCheckedInToday ? 'Edit today\'s check-in' : 'Start daily check-in'
            }
          >
            <View
              style={[
                styles.actionIconCircle,
                hasCheckedInToday ? styles.actionIconCircleDone : styles.actionIconCirclePending,
              ]}
            >
              <ClipboardCheck
                color={hasCheckedInToday ? colors.white : colors.primary}
                width={20}
                height={20}
              />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionHeadline}>{t('today.checkin_title')}</Text>
              <View style={[styles.actionPill, hasCheckedInToday && styles.actionPillDone]}>
                <Text style={[styles.actionPillText, hasCheckedInToday && styles.actionPillTextDone]}>
                  {hasCheckedInToday ? t('today.checkin_logged') : t('today.checkin_action')}
                </Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Track Weight */}
          <TouchableOpacity
            style={[styles.actionCard, { borderTopColor: colors.primary }]}
            onPress={() => { haptics.tap(); router.push('/weight'); }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Track your weight"
          >
            <View style={[styles.actionIconCircle, styles.actionIconCirclePending]}>
              <TrendingUp color={colors.primary} width={20} height={20} />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionHeadline}>{t('today.weight_title')}</Text>
              <View style={styles.actionPill}>
                <Text style={styles.actionPillText}>{t('today.weight_subtitle')}</Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Resistance training — the muscle-preservation signal */}
          <TouchableOpacity
            style={[
              styles.actionCard,
              { borderTopColor: resistanceMet ? colors.success : colors.primary },
            ]}
            onPress={() => { haptics.tap(); router.push('/resistance'); }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('resistance.title')}
          >
            <View
              style={[
                styles.actionIconCircle,
                resistanceMet ? styles.actionIconCircleDone : styles.actionIconCirclePending,
              ]}
            >
              <Dumbbell
                color={resistanceMet ? colors.white : colors.primary}
                width={20}
                height={20}
              />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionHeadline}>{t('today.resistance_title')}</Text>
              <View style={[styles.actionPill, resistanceMet && styles.actionPillDone]}>
                <Text style={[styles.actionPillText, resistanceMet && styles.actionPillTextDone]}>
                  {resistanceWeekly.currentWeekSessions > 0
                    ? t('today.resistance_subtitle', { sessions: resistanceWeekly.currentWeekSessions })
                    : t('today.resistance_cta')}
                </Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Cardio — a SECONDARY tracker (muted accent so muscle stays #1).
              Never enters the muscle score; shows an interference hint when
              this week's cardio outpaces resistance. */}
          <TouchableOpacity
            style={[styles.actionCard, { borderTopColor: colors.border }]}
            onPress={() => { haptics.tap(); router.push('/cardio'); }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('today.cardio_title')}
          >
            <View style={[styles.actionIconCircle, styles.actionIconCirclePending]}>
              <Activity color={colors.textSecondary} width={20} height={20} />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionHeadline}>{t('today.cardio_title')}</Text>
              <View style={[styles.actionPill, cardioInterferes && styles.actionPillWarn]}>
                <Text style={[styles.actionPillText, cardioInterferes && styles.actionPillWarnText]}>
                  {cardioInterferes
                    ? t('today.cardio_interference_hint')
                    : cardioWeekly.currentWeekSessions > 0
                      ? t('today.cardio_subtitle', { sessions: cardioWeekly.currentWeekSessions })
                      : t('today.cardio_cta')}
                </Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Streak — only once a streak is active (no empty-state nag) */}
          {!isStreakLoading && (streak?.currentStreak ?? 0) > 0 && (
            <StreakCard
              currentStreak={streak?.currentStreak ?? 0}
              longestStreak={streak?.longestStreak ?? 0}
            />
          )}

          {/* Journey */}
          <TouchableOpacity
            style={[styles.actionCard, { borderTopColor: colors.primary }]}
            onPress={() => { haptics.tap(); router.push('/journey'); }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="View your journey milestones"
          >
            <View style={[styles.actionIconCircle, styles.actionIconCirclePending]}>
              <ProgressPath color={colors.primary} width={20} height={20} />
            </View>
            <View style={styles.actionTextBlock}>
              <Text style={styles.actionHeadline}>{t('today.journey_title')}</Text>
              <View style={styles.actionPill}>
                <Text style={styles.actionPillText}>{t('today.journey_subtitle')}</Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          {/* Nutrition Coach moved to its own bottom-nav tab — CTA removed 2026-05-24 */}

          {/* ── Daily AI Guidance ─────────────────────────────────── */}
          <SectionLabel label={t('today.daily_guidance_section')} />
          <DailyGuidanceCard
            guidance={dailyGuidance}
            isLoading={isGuidanceLoading}
            isError={isGuidanceError}
          />

          {/* ── Pharmacist Content ────────────────────────────────── */}
          <SectionLabel label={t('today.pharmacist_content')} />
          {spotlightCard && (
            <PharmacistSpotlightCard
              card={spotlightCard}
              phaseLabel={spotlightPhaseLabel}
              onReadMore={() => setSheetCard(spotlightCard)}
            />
          )}
          <Pressable
            style={({ pressed }) => [styles.browseAllLink, pressed && { opacity: 0.6 }]}
            onPress={() => setShowCarousel(v => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ expanded: showCarousel }}
            accessibilityLabel={t('today.browse_all_tips')}
          >
            <Text style={styles.browseAllText}>{t('today.browse_all_tips')}</Text>
          </Pressable>
          {showCarousel && <CardsCarousel cards={getActiveCardsForRoute(cardRoute)} onCardPress={setSheetCard} />}
          <ContentCardSheet card={sheetCard} onClose={() => setSheetCard(null)} />

        </View>
        {/* end contentArea */}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      // backgroundColor is set inline to gradients.hero[0] so the status-bar
      // area behind the notch matches the gradient start color.
    },
    contentArea: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    scroll: {
      // No top/horizontal padding — the gradient hero is full-bleed.
      // Individual content sections apply their own padding.
      paddingBottom: spacing.xxl,
    },
    escalationContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },

    // ── Gradient hero ────────────────────────────────────────────
    // Negative margins bleed past the ScrollView's zero padding to fill edge-to-edge.
    heroGradient: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl + spacing.sm,
    },

    // ── Header (lives inside the gradient) ──────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: 30,
      fontWeight: '800',
      color: '#ffffff', // always white — sits on dark gradient
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    greetingDate: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.75)',
      fontWeight: '400',
    },
    rxBadge: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    rxBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 0.5,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 4,
    },
    gearButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },

    phaseCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderTopWidth: 3,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.md,
    },
    phaseAccentBg: {
      backgroundColor: colors.primaryLight,
    },
    nextInjection: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      lineHeight: 18,
    },
    nextInjectionDays: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.textPrimary,
      lineHeight: 36,
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
      backgroundColor: colors.primaryLight,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: `${colors.phaseInjectionDay}40`,
      ...shadows.sm,
    },
    shotDayLeft: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.phaseInjectionDay}20`,
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
      marginBottom: spacing.md,
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
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    bannerWrapper: {
      marginBottom: spacing.md,
    },

    // ── Unified action card (headline + pill pattern) ────────────
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderTopWidth: 2,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
      ...shadows.sm,
    },
    actionTextBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    actionHeadline: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    actionPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    actionPillDone: {
      backgroundColor: colors.successLight,
    },
    actionPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    actionPillTextDone: {
      color: colors.success,
    },
    actionPillWarn: {
      backgroundColor: colors.warningLight,
    },
    actionPillWarnText: {
      color: colors.warning,
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

    // ── Browse all tips link ─────────────────────────────────────
    browseAllLink: {
      paddingVertical: spacing.sm,
      alignItems: 'flex-start',
    },
    browseAllText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
