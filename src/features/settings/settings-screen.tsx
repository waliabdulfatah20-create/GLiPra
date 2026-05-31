// SettingsScreen — rebuilt with StyleSheet API (no NativeWind).
// The Obytes template version used className props from @/components/ui
// which silently had no effect after NativeWind was stripped.

import type { GlipraTokens } from '@/theme/tokens';
import Env from 'env';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { DeleteAccountModal } from '@/features/account/components/delete-account-modal';
import { useDeleteAccount, useExportData } from '@/features/account/hooks';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useTodayProfile } from '@/features/today/hooks';
import { analytics, EVENTS } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { useTheme, useThemeSelector } from '@/lib/ThemeContext';
import { formatWeight, useWeightUnit } from '@/lib/unit-preference';
import { useNotificationSettings } from '@/lib/use-notification-settings';

import { SettingsSection } from './components/settings-container';
import { SettingsRow } from './components/settings-item';
import { LanguagePicker } from './language-picker';

// ─── Notification toggle row ──────────────────────────────────────────────────

type NotificationRowProps = {
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  isLast?: boolean;
};

function NotificationRow({ label, subtitle, value, onToggle, isLast = false }: NotificationRowProps) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          backgroundColor: colors.surface,
        },
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={{ flex: 1, marginRight: spacing.md }}>
        <Text style={{ fontSize: 15, color: colors.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
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

// ─── Status labels ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  starting: 'Starting',
  active: 'Active',
  tapering: 'Tapering',
  maintenance: 'Maintenance',
  discontinued: 'Discontinued',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const signOut = useAuthStore.use.signOut();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: profile } = useTodayProfile();
  const { unit: weightUnit } = useWeightUnit();
  const { injectionEnabled, proteinEnabled, toggle } = useNotificationSettings();
  const { colors, spacing, radius } = useTheme();
  const { selectedTheme, setSelectedTheme } = useThemeSelector();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();
  const [deleteVisible, setDeleteVisible] = React.useState(false);

  const handleExport = async () => {
    const json = await exportData.run();
    if (!json) {
      Alert.alert(t('account.export_failed'), exportData.error ?? '');
      return;
    }
    try {
      const FileSystem = require('expo-file-system/legacy');
      const Sharing = require('expo-sharing');
      const fileUri = `${FileSystem.cacheDirectory}glipra-data-export.json`;
      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      analytics.capture(EVENTS.ACCOUNT_DATA_EXPORTED);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('settings.export_data'),
        });
      }
      else {
        Alert.alert(t('settings.export_data'), `${json.length} chars exported.`);
      }
    }
    catch {
      Alert.alert(t('account.export_failed'), '');
    }
  };

  const handleConfirmDelete = async () => {
    const ok = await deleteAccount.run();
    if (!ok) {
      Alert.alert(t('account.delete_failed'), deleteAccount.error ?? '');
      return;
    }
    analytics.capture(EVENTS.ACCOUNT_DELETED);
    setDeleteVisible(false);
    await signOut();
  };

  const goalWeightValue
    = profile?.goalWeightKg != null
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

        {/* ── Appearance ────────────────────────────────────────────── */}
        <SettingsSection title={t('settings.appearance_title')}>
          <View style={styles.themeRow}>
            {(['light', 'dark', 'system'] as const).map((option, i) => (
              <Pressable
                key={option}
                style={[
                  styles.themeOption,
                  selectedTheme === option && styles.themeOptionActive,
                  i < 2 && styles.themeOptionBorder,
                ]}
                onPress={() => { haptics.tap(); setSelectedTheme(option); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedTheme === option }}
                accessibilityLabel={`${option} mode`}
              >
                <Text
                  style={
                    selectedTheme === option
                      ? styles.themeOptionTextActive
                      : styles.themeOptionText
                  }
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </SettingsSection>

        {/* ── Language ──────────────────────────────────────────────── */}
        <SettingsSection title={t('settings.language')}>
          <LanguagePicker />
        </SettingsSection>

        {/* ── About ─────────────────────────────────────────────────── */}
        <SettingsSection title={t('settings.about')}>
          <SettingsRow label={t('settings.app_name')} value={Env.EXPO_PUBLIC_NAME} />
          <SettingsRow label={t('settings.version')} value={Env.EXPO_PUBLIC_VERSION} />
          <SettingsRow label={t('settings.privacy')} onPress={() => router.push('/legal/privacy-policy')} />
          <SettingsRow label={t('settings.terms')} onPress={() => router.push('/legal/terms-of-service')} isLast />
        </SettingsSection>

        {/* ── Account ───────────────────────────────────────────────── */}
        <SettingsSection title={t('settings.account')}>
          <SettingsRow
            label={t('settings.export_data')}
            value={exportData.isLoading ? '…' : undefined}
            onPress={exportData.isLoading ? undefined : handleExport}
          />
          <SettingsRow label={t('settings.logout')} onPress={signOut} />
          <SettingsRow
            label={t('settings.delete_account')}
            onPress={() => setDeleteVisible(true)}
            destructive
            isLast
          />
        </SettingsSection>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <DeleteAccountModal
        visible={deleteVisible}
        isLoading={deleteAccount.isLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
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

    // ── Appearance toggle ────────────────────────────────────────
    themeRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      overflow: 'hidden',
      marginHorizontal: spacing.md,
      marginVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeOption: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
    },
    themeOptionBorder: {
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    themeOptionActive: {
      backgroundColor: colors.primaryLight,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    themeOptionTextActive: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}
