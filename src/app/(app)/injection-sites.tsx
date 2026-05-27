import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { SITE_LABELS, type SiteCode } from '@/features/injection-sites/constants';
import {
  useInjectionLogs,
  useInjectionSiteRecommendation,
} from '@/features/injection-sites/hooks';
import type { InjectionLog } from '@/features/injection-sites/types';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

// Pharmacist-authored rotation tips (no condition names — Rule 9 compliant)
const INJECTION_TIPS = [
  {
    title: 'Rotate every injection',
    body: 'Use a different spot each time to allow tissue to recover and maintain consistent absorption.',
  },
  {
    title: 'Stay 2 inches from your navel',
    body: 'The area around the belly button absorbs medication unevenly.',
  },
  {
    title: 'Pinch and inject',
    body: 'Pinch 1-2 inches of skin and inject at 90 degrees. Release the pinch before withdrawing the pen.',
  },
  {
    title: 'Check before you inject',
    body: 'Avoid areas that feel firm, lumpy, or tender — these sites need more rest time.',
  },
];

export default function InjectionSitesScreen() {
  const router = useRouter();
  const { logs, isLoading: logsLoading } = useInjectionLogs();
  const {
    recommendation,
    allResting,
    isLoading: recLoading,
  } = useInjectionSiteRecommendation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows]
  );

  const isLoading = logsLoading || recLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Injection Sites</Text>
          <Text style={styles.subtitle}>Log a shot or review your rotation</Text>
        </View>

        {/* Rule 8: clinical screen — Tier 2 disclaimer */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            Rotate injection sites at least 1 inch apart. Avoid sites that are
            bruised, tender, or have scar tissue. Always follow your prescriber's
            instructions.
          </Text>
        </DisclaimerBanner>

        {/* Active Rotation card */}
        {isLoading ? (
          <View style={styles.loadingCard}>
            <SkeletonBox style={{ height: 9, width: '40%', marginBottom: spacing.sm }} />
            <SkeletonBox style={{ height: 17, width: '60%', marginBottom: spacing.sm }} />
            <SkeletonBox style={{ height: 34, width: 88, borderRadius: radius.md, alignSelf: 'flex-end' }} />
          </View>
        ) : (
          <View style={styles.rotationCard}>
            <View style={styles.rotationLeft}>
              <Text style={styles.rotationLabel}>ACTIVE ROTATION</Text>
              <Text style={styles.rotationValue}>
                {SITE_LABELS[recommendation]}
              </Text>
              {allResting && (
                <Text style={styles.restingWarning}>
                  ⚠ All sites used within 7 days — rotate with care
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.addBtnPressed,
              ]}
              onPress={() => router.push('/add-shot')}
              accessibilityRole="button"
              accessibilityLabel="Add a new shot"
            >
              <Text style={styles.addBtnText}>+ Add Shot</Text>
            </Pressable>
          </View>
        )}

        {/* Recent shots */}
        <View style={styles.recentCard}>
          <Text style={styles.cardLabel}>RECENT SHOTS</Text>
          {logs.length === 0 ? (
            <Text style={styles.empty}>No shots logged yet. Tap "+ Add Shot" to log your first one.</Text>
          ) : (
            <View style={styles.shotList}>
              {logs.slice(0, 10).map((log, idx) => (
                <ShotRow
                  key={log.id}
                  log={log}
                  isLast={idx === Math.min(logs.length, 10) - 1}
                />
              ))}
            </View>
          )}
        </View>

        {/* Rotation tips (pharmacist-authored) */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardLabel}>ROTATION TIPS</Text>
          {INJECTION_TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipBullet}>
                <Text style={styles.tipBulletText}>{i + 1}</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipBody}>{tip.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ShotRow({ log, isLast }: { log: InjectionLog; isLast: boolean }) {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const shotStyles = React.useMemo(
    () => makeShotRowStyles({ colors, spacing, radius }),
    [colors, spacing, radius]
  );

  return (
    <Pressable
      style={({ pressed }) => [
        shotStyles.shotRow,
        !isLast && shotStyles.shotRowBorder,
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => router.push(`/edit-shot?id=${log.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Edit shot at ${SITE_LABELS[log.site_code as SiteCode] ?? log.site_code}`}
    >
      <View style={shotStyles.shotMain}>
        <Text style={shotStyles.shotSite}>
          {SITE_LABELS[log.site_code as SiteCode] ?? log.site_code}
        </Text>
        <Text style={shotStyles.shotMeta}>
          {format(parseISO(log.injected_at), 'MMM d, yyyy · h:mm a')} ·{' '}
          {log.medication_name}
        </Text>
        {log.notes ? (
          <Text style={shotStyles.shotNotes} numberOfLines={2}>
            {log.notes}
          </Text>
        ) : null}
      </View>
      <View style={shotStyles.painBadge}>
        <Text style={shotStyles.painBadgeLabel}>PAIN</Text>
        <Text style={shotStyles.painBadgeValue}>{log.pain_level}</Text>
      </View>
      <Text style={shotStyles.chevron}>›</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },

    // Header block
    headerBlock: { gap: spacing.xs },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    loadingCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.sm,
    },

    // Active rotation card
    rotationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadows.sm,
    },
    rotationLeft: { flex: 1, gap: 2 },
    rotationLabel: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.textSecondary,
    },
    rotationValue: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    restingWarning: {
      fontSize: 10,
      color: colors.warning,
      fontWeight: '600',
      marginTop: 2,
    },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    addBtnPressed: { opacity: 0.85 },
    addBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: 0.2,
    },

    // Recent shots card + rows
    recentCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.sm,
    },
    cardLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: spacing.xs,
    },
    empty: {
      fontSize: 13,
      color: colors.textSecondary,
      paddingVertical: spacing.sm,
      textAlign: 'center',
    },
    shotList: { gap: 0 },

    // Rotation tips card (carried over from previous version)
    tipsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.sm,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    tipBullet: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    tipBulletText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryDark,
    },
    tipContent: { flex: 1 },
    tipTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    tipBody: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}

function makeShotRowStyles({ colors, spacing, radius }: Pick<GlipraTokens, 'colors' | 'spacing' | 'radius'>) {
  return StyleSheet.create({
    shotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 2,
      gap: spacing.md,
    },
    shotRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    shotMain: { flex: 1, gap: 2 },
    shotSite: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    shotMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    shotNotes: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    painBadge: {
      alignItems: 'center',
      minWidth: 44,
      paddingVertical: 4,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: colors.primaryLight,
    },
    painBadgeLabel: {
      fontSize: 8,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: colors.primaryDark,
    },
    painBadgeValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primaryDark,
      lineHeight: 20,
    },
    chevron: { fontSize: 18, color: colors.textSecondary, fontWeight: '300' },
  });
}
