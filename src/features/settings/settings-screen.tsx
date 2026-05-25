// SettingsScreen — rebuilt with StyleSheet API (no NativeWind).
// The Obytes template version used className props from @/components/ui
// which silently had no effect after NativeWind was stripped.

import Env from 'env';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useTodayProfile } from '@/features/today/hooks';
import { formatWeight, useWeightUnit } from '@/lib/unit-preference';
import { useNotificationSettings } from '@/lib/use-notification-settings';
import { colors, spacing } from '@/theme/colors';

import { SettingsSection } from './components/settings-container';
import { SettingsRow } from './components/settings-item';
import { LanguagePicker } from './language-picker';

// ─── Notification toggle row ──────────────────────────────────────────────────
// A settings row variant with a Switch on the right instead of a chevron.

interface NotificationRowProps {
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
}

function NotificationRow({ label, subtitle, value, onToggle, isLast = false }: NotificationRowProps) {
  return (
    <View style={[notifStyles.row, !isLast && notifStyles.rowBorder]}>
      <View style={notifStyles.textBlock}>
        <Text style={notifStyles.label}>{label}</Text>
        <Text style={notifStyles.subtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      />
    </View>
  );
}

const notifStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

// ─── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  starting: 'Starting',
  active: 'Active',
  tapering: 'Tapering',
  maintenance: 'Maintenance',
  discontinued: 'Discontinued',
};

export function SettingsScreen() {
  const signOut = useAuthStore.use.signOut();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: profile } = useTodayProfile();
  const { unit: weightUnit } = useWeightUnit();

  const { injectionEnabled, proteinEnabled, toggle } = useNotificationSettings();

  const goalWeightValue =
    profile?.goalWeightKg != null
      ? formatWeight(profile.goalWeightKg, weightUnit)
      : undefined;

  const currentStatusLabel = profile?.medicationStatus
    ? (STATUS_LABELS[profile.medicationStatus] ?? undefined)
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('settings.title')}</Text>

        {/* ── Body Metrics ──────────────────────────────────────────── */}
        <SettingsSection title={t('settings.body_metrics')}>
          <SettingsRow
            label={t('settings.goal_weight')}
            value={goalWeightValue}
            onPress={() => router.push('/goal-weight')}
            isLast
          />
        </SettingsSection>

        {/* ── Health & tracking ─────────────────────────────────────── */}
        <SettingsSection title={t('settings.health')}>
          <SettingsRow
            label={t('settings.visit_prep')}
            onPress={() => router.push('/visit-prep')}
          />
          <SettingsRow
            label={t('settings.health_import')}
            onPress={() => router.push('/health-import')}
            isLast
          />
        </SettingsSection>

        {/* ── Preferences ───────────────────────────────────────────── */}
        <SettingsSection title={t('settings.preferences')}>
          <SettingsRow
            label={t('settings.medication_status')}
            value={currentStatusLabel}
            onPress={() => router.push('/update-status')}
          />
          <SettingsRow
            label={t('settings.maintenance_mode')}
            onPress={() => router.push('/maintenance-mode')}
          />
          <SettingsRow
            label={t('settings.life_after_glp1')}
            onPress={() => router.push('/discontinuation-mode')}
            isLast
          />
        </SettingsSection>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <SettingsSection title={t('settings.notifications')}>
          <NotificationRow
            label={t('settings.notif_injection')}
            subtitle={t('settings.notif_injection_subtitle')}
            value={injectionEnabled}
            onToggle={() => void toggle('injection-reminder')}
          />
          <NotificationRow
            label={t('settings.notif_protein')}
            subtitle={t('settings.notif_protein_subtitle')}
            value={proteinEnabled}
            onToggle={() => void toggle('daily-protein-nudge')}
            isLast
          />
        </SettingsSection>

        {/* ── Language ──────────────────────────────────────────────── */}
        <SettingsSection title={t('settings.language')}>
          <LanguagePicker />
        </SettingsSection>

        {/* ── About ─────────────────────────────────────────────────── */}
        <SettingsSection title={t('settings.about')}>
          <SettingsRow label={t('settings.app_name')} value={Env.EXPO_PUBLIC_NAME} />
          <SettingsRow label={t('settings.version')} value={Env.EXPO_PUBLIC_VERSION} />
          <SettingsRow label={t('settings.privacy')} onPress={() => {}} />
          <SettingsRow label={t('settings.terms')} onPress={() => {}} isLast />
        </SettingsSection>

        {/* ── Account ───────────────────────────────────────────────── */}
        <SettingsSection title={t('settings.account')}>
          <SettingsRow label={t('settings.logout')} onPress={signOut} destructive isLast />
        </SettingsSection>

        <View style={styles.bottomSpacer} />
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
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
