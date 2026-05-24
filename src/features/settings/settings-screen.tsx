// SettingsScreen — rebuilt with StyleSheet API (no NativeWind).
// The Obytes template version used className props from @/components/ui
// which silently had no effect after NativeWind was stripped.

import Env from 'env';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { colors, spacing } from '@/theme/colors';

import { SettingsSection } from './components/settings-container';
import { SettingsRow } from './components/settings-item';
import { LanguagePicker } from './language-picker';

export function SettingsScreen() {
  const signOut = useAuthStore.use.signOut();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('settings.title')}</Text>

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
            label={t('settings.maintenance_mode')}
            onPress={() => router.push('/maintenance-mode')}
          />
          <SettingsRow
            label={t('settings.life_after_glp1')}
            onPress={() => router.push('/discontinuation-mode')}
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
