import { differenceInCalendarDays, format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
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
import { ContentCardSheet } from '@/components/today/content-card-sheet';
import { PharmacistSpotlightCard } from '@/components/today/pharmacist-spotlight-card';
import { MedLevelBanner } from '@/components/today/med-level-banner';
import { PhaseBadge } from '@/components/today/phase-badge';
import { ProteinRing } from '@/components/today/protein-ring';
import { InjectionCycleCard } from '@/components/today/injection-cycle-card';
import { StreakCard } from '@/components/today/streak-card';
import { MilestoneToast } from '@/components/ui/milestone-toast';
import {
  ClipboardCheck,
  ProgressPath,
  Settings as SettingsIcon,
} from '@/components/ui/icons';
import { useTodayCheckIn } from '@/features/check-in/hooks';
import type { ContentCard } from '@/features/content-cards/data';
import { getActiveCards } from '@/features/content-cards/data';
import { useCheckAndUnlockMilestones } from '@/features/journey-cards/hooks';
import { MILESTONES, type Milestone, type MilestoneId } from '@/features/journey-cards/milestones';
import { useTodayData } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';
import type { InjectionPhase } from '@/types';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { markRedFlagTriggered } from '@/features/check-in/api';
import { useRedFlagSnooze } from '@/features/safety/hooks';

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

  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { isSnoozed, isLoading: snoozeLoading, snooze } = useRedFlagSnooze();

  // isTriggered: detection fired AND snooze has loaded AND snooze is not active
  const isTriggered =
    !!redFlagDetection?.triggered && !snoozeLoading && !isSnoozed;

  // Write audit flag to DB when triggered (non-blocking, non-fatal)
  React.useEffect(() => {
    if (redFlagDetection?.triggered && userId) {
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

  // Phase accent colors — useMemo so they re-derive when theme changes
  const phaseAccent = React.useMemo<Record<InjectionPhase, string>>(
    () => ({
      injection_day: colors.phaseInjectionDay,
      peak_suppression: colors.phasePeakSuppression,
      adjustment: colors.phaseAdjustment,
      recovery_window: colors.phaseRecoveryWindow,
      overdue: colors.phaseOverdue,
    }),
    [colors],
  );

  // Phase-aware spotlight card selection — phase match first, then daily rotation
  const currentPhase = injectionCycle?.phase ?? null;
  const spotlightCard = React.useMemo(() => {
    const all = getActiveCards();
    if (currentPhase) {
      const phaseMatch = all.find(
        (c) => c.phases?.includes(currentPhase as InjectionPhase),
      );
      if (phaseMatch) return phaseMatch;
    }
    // Fallback: rotate universal cards by day-of-year so it changes daily
    const universal = all.filter((c) => !c.phases?.length);
    const dayOfYear = differenceInCalendarDays(
      new Date(),
      new Date(new Date().getFullYear(), 0, 0),
    );
    return universal[dayOfYear % universal.length] ?? all[0];
  }, [currentPhase]);
  const spotlightPhaseLabel = currentPhase
    ? (PHASE_LABELS[currentPhase as InjectionPhase] ?? undefined)
    : undefined;

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
    ? (phaseAccent[injectionCycle.phase] ?? colors.primary)
    : colors.primary;

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
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
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
            onPress={() => { haptics.tap(); router.push('/discontinuation-mode'); }}
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

        {/* ── Today's Metrics ───────────────────────────────────── */}
        <SectionLabel label={t('today.metrics_title')} />
        <View style={styles.metricsRow}>
          {/* Protein ring — top accent in primary */}
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

          {/* Injection phase — hidden when discontinued */}
          {profile?.medicationStatus === 'discontinued' ? (
            <View style={[styles.phaseCard, { borderTopColor: colors.textDisabled }]}>
              <Text style={styles.cardLabel}>{t('today.injection_label')}</Text>
              <Text style={styles.noDataText}>{t('today.injection_discontinued')}</Text>
            </View>
          ) : (
            <View style={[styles.phaseCard, styles.phaseAccentBg, { borderTopColor: phaseAccentColor }]}>
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
          )}
        </View>

        {/* ── Injection Cycle Strip (D4) ───────────────────────── */}
        {profile?.medicationStatus !== 'discontinued' &&
          profile?.lastInjectionDate &&
          injectionCycle && (
            <InjectionCycleCard
              lastInjectionDate={profile.lastInjectionDate}
              injectionCycle={injectionCycle}
            />
          )}

        {/* ── Shot Day Prep (injection day only) ────────────────── */}
        {injectionCycle?.phase === 'injection_day' && (
          <TouchableOpacity
            style={styles.shotDayCard}
            onPress={() => { haptics.tap(); router.push('/shot-prep'); }}
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
          style={[
            styles.actionCard,
            { borderTopColor: hasCheckedInToday ? colors.success : colors.primary },
          ]}
          onPress={() => { haptics.tap(); router.push('/check-in'); }}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={
            hasCheckedInToday ? "Edit today's check-in" : 'Start daily check-in'
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

        {/* Medication Level — hidden when discontinued */}
        {profile?.medicationStatus !== 'discontinued' && (
          <View style={styles.bannerWrapper}>
            <MedLevelBanner phase={injectionCycle?.phase ?? null} />
          </View>
        )}

        {/* Streak */}
        {!isStreakLoading && (
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
          style={styles.browseAllLink}
          onPress={() => setShowCarousel((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Browse all pharmacist tips"
        >
          <Text style={styles.browseAllText}>{t('today.browse_all_tips')}</Text>
        </Pressable>
        {showCarousel && <CardsCarousel cards={getActiveCards()} />}
        <ContentCardSheet card={sheetCard} onClose={() => setSheetCard(null)} />

        </View>{/* end contentArea */}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
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
      color: '#ffffff',          // always white — sits on dark gradient
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
      padding: spacing.lg,
      alignItems: 'center',
      borderTopWidth: 3,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.md,
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
