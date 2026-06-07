import type { RecentDoseStatus } from '@/features/dose/recent-doses';
import type { GlipraTokens } from '@/theme/tokens';
import { format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DoseInjectionRotation } from '@/components/dose/dose-injection-rotation';
import { DoseWindowCard } from '@/components/today/dose-window-card';
import { InjectionCycleCard } from '@/components/today/injection-cycle-card';
import { MedLevelBanner } from '@/components/today/med-level-banner';
import { PhaseBadge } from '@/components/today/phase-badge';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import {
  ClipboardCheck,
  Syringe,
} from '@/components/ui/icons';
import { TodaySkeleton } from '@/components/ui/today-skeleton';
import { buildRecentDoseStrip } from '@/features/dose/recent-doses';
import { RemindersPanel } from '@/features/dose/reminders-panel';
import { useLogOralDose, useOralDoseLogs, useSetDoseWindowRespected } from '@/features/oral-dose/hooks';
import { useTodayData } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

// ─── Small building blocks ─────────────────────────────────────────────────────

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

// ─── Screen ─────────────────────────────────────────────────────────────────

export function DoseScreen() {
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
    oralCycle,
    oralLastDoseTakenAt,
    oralLastDoseId,
    oralLastDoseWindowRespected,
    oralAdherenceStreak,
  } = useTodayData();

  const isOral = administrationRoute === 'oral';
  const logOralDose = useLogOralDose();
  const setWindowRespected = useSetDoseWindowRespected();
  const { logs: oralDoseLogs } = useOralDoseLogs();

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

  const today = format(new Date(), 'yyyy-MM-dd');
  const recentStrip = React.useMemo(
    () =>
      buildRecentDoseStrip(
        oralDoseLogs.map(l => ({ takenAt: l.takenAt, windowRespected: l.windowRespected })),
        today,
        7,
      ),
    [oralDoseLogs, today],
  );

  function dotColor(status: RecentDoseStatus): string {
    if (status === 'taken')
      return colors.success;
    if (status === 'broken')
      return colors.warning;
    if (status === 'missed')
      return colors.error;
    return colors.gray200;
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

  const isDiscontinued = profile?.medicationStatus === 'discontinued';
  const hasOralDoses = oralDoseLogs.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
        testID="dose-screen"
      >
        {/* Hero header */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.header}>
            <Text style={styles.heroTitle}>{t('dose.title')}</Text>
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentArea}>
          {/* Rule 8: medication content → Tier 1 disclaimer */}
          <DisclaimerBanner tier={1}>
            <Text style={styles.tier1Text}>{t('dose.disclaimer_top')}</Text>
          </DisclaimerBanner>

          {isDiscontinued
            ? (
                <TouchableOpacity
                  testID="dose-discontinued"
                  style={styles.infoCard}
                  onPress={() => { haptics.tap(); router.push('/discontinuation-mode'); }}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={t('dose.discontinued_title')}
                >
                  <Text style={styles.infoTitle}>{t('dose.discontinued_title')}</Text>
                  <Text style={styles.infoBody}>{t('dose.discontinued_body')}</Text>
                </TouchableOpacity>
              )
            : isOral
              ? (
                  <View testID="dose-oral">
                    {/* Today's dose — the action */}
                    <SectionLabel label={t('dose.today_label')} />
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

                    {/* Phase + level */}
                    <SectionLabel label={t('dose.medication_label')} />
                    {oralCycle && (
                      <View style={styles.badgeCard}>
                        <PhaseBadge
                          route="oral"
                          phase={oralCycle.phase}
                          daysOnMed={oralCycle.daysOnMed}
                        />
                      </View>
                    )}
                    <MedLevelBanner route="oral" phase={oralCycle?.phase ?? null} />

                    {/* Building / titration educational card */}
                    {oralCycle?.phase === 'building' && (
                      <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>{t('dose.building_title')}</Text>
                        <Text style={styles.infoBody}>{t('dose.building_body')}</Text>
                      </View>
                    )}

                    {/* Recent doses strip */}
                    <SectionLabel label={t('dose.recent_label')} />
                    {hasOralDoses
                      ? (
                          <View style={styles.stripCard}>
                            <View style={styles.stripRow}>
                              {recentStrip.map(day => (
                                <View key={day.date} style={styles.stripCell}>
                                  <Text style={styles.stripDayLabel}>
                                    {format(parseISO(day.date), 'EEEEE')}
                                  </Text>
                                  <View style={[styles.stripDot, { backgroundColor: dotColor(day.status) }]} />
                                </View>
                              ))}
                            </View>
                          </View>
                        )
                      : (
                          <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>{t('dose.empty_oral_title')}</Text>
                            <Text style={styles.infoBody}>{t('dose.empty_oral_body')}</Text>
                          </View>
                        )}

                    {/* Reminders */}
                    <RemindersPanel />
                  </View>
                )
              : (
                  <View testID="dose-injection">
                    {/* Cycle */}
                    <SectionLabel label={t('dose.injection_cycle_label')} />
                    {injectionCycle
                      ? (
                          <>
                            <View style={styles.badgeCard}>
                              <PhaseBadge
                                route="injection"
                                phase={injectionCycle.phase}
                                daysSinceInjection={injectionCycle.daysSinceInjection}
                              />
                              {injectionCycle.isOverdue
                                ? (
                                    <Text style={styles.overdueText}>{t('dose.overdue')}</Text>
                                  )
                                : injectionCycle.daysUntilNextInjection !== null
                                  ? (
                                      <Text style={styles.nextDoseText}>
                                        {`${t('dose.next_dose_label')}: ${injectionCycle.daysUntilNextInjection}d`}
                                      </Text>
                                    )
                                  : null}
                            </View>
                            {profile?.lastInjectionDate && (
                              <InjectionCycleCard
                                lastInjectionDate={profile.lastInjectionDate}
                                injectionCycle={injectionCycle}
                              />
                            )}
                          </>
                        )
                      : (
                          <View style={styles.infoCard}>
                            <Text style={styles.infoTitle}>{t('dose.empty_injection_title')}</Text>
                            <Text style={styles.infoBody}>{t('dose.empty_injection_body')}</Text>
                          </View>
                        )}

                    {/* Log a shot */}
                    <ActionRow
                      testID="dose-log-shot"
                      icon={<Syringe color={colors.primary} width={20} height={20} />}
                      title={t('dose.log_shot_title')}
                      subtitle={t('dose.log_shot_sub')}
                      onPress={() => { haptics.tap(); router.push('/add-shot'); }}
                      styles={styles}
                      colors={colors}
                    />
                    {injectionCycle?.phase === 'injection_day' && (
                      <ActionRow
                        icon={<ClipboardCheck color={colors.primary} width={20} height={20} />}
                        title={t('dose.shot_prep_title')}
                        subtitle={t('dose.shot_prep_sub')}
                        onPress={() => { haptics.tap(); router.push('/shot-prep'); }}
                        styles={styles}
                        colors={colors}
                      />
                    )}

                    {/* Site rotation */}
                    <SectionLabel label={t('dose.site_rotation_label')} />
                    <DoseInjectionRotation />

                    {/* Level */}
                    <SectionLabel label={t('dose.medication_label')} />
                    <MedLevelBanner route="injection" phase={injectionCycle?.phase ?? null} />

                    {/* Reminders */}
                    <RemindersPanel />
                  </View>
                )}

          {/* Footer disclaimer */}
          <View style={styles.footer}>
            <DisclaimerBanner tier={2}>
              <Text style={styles.tier2Text}>{t('dose.disclaimer_footer')}</Text>
            </DisclaimerBanner>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Reusable rows ─────────────────────────────────────────────────────────────

type RowStyles = ReturnType<typeof makeStyles>;
type ThemeColors = GlipraTokens['colors'];

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  styles,
  colors,
  testID,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  styles: RowStyles;
  colors: ThemeColors;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.actionCard, { borderTopColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.actionIconCircle}>{icon}</View>
      <View style={styles.actionTextBlock}>
        <Text style={styles.actionHeadline}>{title}</Text>
        <View style={styles.actionPill}>
          <Text style={styles.actionPillText}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingBottom: spacing.xxl },
    contentArea: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },

    // Hero
    heroGradient: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    heroTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: -0.5,
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

    tier1Text: {
      fontSize: 13,
      color: colors.disclaimerText,
      lineHeight: 19,
    },
    tier2Text: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    footer: {
      marginTop: spacing.lg,
    },

    // Badge card
    badgeCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      gap: spacing.sm,
      ...shadows.sm,
    },
    nextDoseText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    overdueText: {
      fontSize: 13,
      color: colors.phaseOverdue,
      fontWeight: '600',
    },

    // Info card (building / empty / discontinued)
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    infoBody: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },

    // Recent dose strip
    stripCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    stripRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    stripCell: {
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
    },
    stripDayLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    stripDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
    },

    // Action rows
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
    actionIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      flexShrink: 0,
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
    actionPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },
    rowChevron: {
      fontSize: 22,
      color: colors.gray300,
      lineHeight: 26,
    },
  });
}
