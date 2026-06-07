import type { SiteCode } from '@/features/injection-sites/constants';
import type { InjectionLog } from '@/features/injection-sites/types';
import type { GlipraTokens } from '@/theme/tokens';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SkeletonBox } from '@/components/ui/skeleton-box';
import { SITE_LABELS } from '@/features/injection-sites/constants';
import {
  useInjectionLogs,
  useInjectionSiteRecommendation,
} from '@/features/injection-sites/hooks';
import { useTheme } from '@/lib/ThemeContext';

// Pharmacist-authored rotation tips (no condition names — Rule 9 compliant).
// Copy lives in i18n (dose.tip_*) so the Dose hub renders EN/ES in parity.
const TIP_KEYS = [
  ['dose.tip_rotate_title', 'dose.tip_rotate_body'],
  ['dose.tip_navel_title', 'dose.tip_navel_body'],
  ['dose.tip_pinch_title', 'dose.tip_pinch_body'],
  ['dose.tip_check_title', 'dose.tip_check_body'],
] as const;

/**
 * Site-rotation module: next-site recommendation, recent shots, and pharmacist
 * tips. Extracted from the former injection-sites screen so the Dose hub and the
 * (now hidden) injection-sites route can share the exact same UI.
 */
export function DoseInjectionRotation() {
  const { t } = useTranslation();
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
    [colors, spacing, radius, shadows],
  );

  const isLoading = logsLoading || recLoading;

  return (
    <View style={styles.wrap}>
      {/* Active Rotation card */}
      {isLoading
        ? (
            <View style={styles.loadingCard}>
              <SkeletonBox style={{ height: 9, width: '40%', marginBottom: spacing.sm }} />
              <SkeletonBox style={{ height: 17, width: '60%', marginBottom: spacing.sm }} />
              <SkeletonBox style={{ height: 34, width: 88, borderRadius: radius.md, alignSelf: 'flex-end' }} />
            </View>
          )
        : (
            <View style={styles.rotationCard}>
              <View style={styles.rotationLeft}>
                <Text style={styles.rotationLabel}>{t('dose.rotation_active_label')}</Text>
                <Text style={styles.rotationValue}>
                  {SITE_LABELS[recommendation]}
                </Text>
                {allResting && (
                  <Text style={styles.restingWarning}>
                    {`⚠ ${t('dose.all_sites_resting')}`}
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
                accessibilityLabel={t('dose.add_shot')}
              >
                <Text style={styles.addBtnText}>{t('dose.add_shot')}</Text>
              </Pressable>
            </View>
          )}

      {/* Recent shots */}
      <View style={styles.recentCard}>
        <Text style={styles.cardLabel}>{t('dose.rotation_recent_label')}</Text>
        {logs.length === 0
          ? (
              <Text style={styles.empty}>{t('dose.rotation_empty')}</Text>
            )
          : (
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
        <Text style={styles.cardLabel}>{t('dose.rotation_tips_label')}</Text>
        {TIP_KEYS.map(([titleKey, bodyKey], i) => (
          <View key={titleKey} style={styles.tipRow}>
            <View style={styles.tipBullet}>
              <Text style={styles.tipBulletText}>{i + 1}</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{t(titleKey)}</Text>
              <Text style={styles.tipBody}>{t(bodyKey)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ShotRow({ log, isLast }: { log: InjectionLog; isLast: boolean }) {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const shotStyles = React.useMemo(
    () => makeShotRowStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
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
          {format(parseISO(log.injected_at), 'MMM d, yyyy · h:mm a')}
          {' '}
          ·
          {' '}
          {log.medication_name}
        </Text>
        {log.notes
          ? (
              <Text style={shotStyles.shotNotes} numberOfLines={2}>
                {log.notes}
              </Text>
            )
          : null}
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

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    wrap: { gap: spacing.md },

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

    // Rotation tips card
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
