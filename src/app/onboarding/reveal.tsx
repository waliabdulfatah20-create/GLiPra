import type { GlipraTokens } from '@/theme/tokens';
import type { GLP1MedicationId } from '@/types';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { saveOnboardingProfile } from '@/features/onboarding/api';
import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useOnboardingStore } from '@/features/onboarding/use-onboarding-store';
import { analytics, EVENTS } from '@/lib/analytics';
import { notifications } from '@/lib/notifications';
import { setItem } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';

// ─── Display maps ────────────────────────────────────────────────────────────

const MEDICATION_LABELS: Record<GLP1MedicationId, string> = {
  semaglutide_wegovy: 'Wegovy (Semaglutide)',
  semaglutide_ozempic: 'Ozempic (Semaglutide)',
  tirzepatide_zepbound: 'Zepbound (Tirzepatide)',
  tirzepatide_mounjaro: 'Mounjaro (Tirzepatide)',
  liraglutide_saxenda: 'Saxenda (Liraglutide)',
  liraglutide_victoza: 'Victoza (Liraglutide)',
  dulaglutide_trulicity: 'Trulicity (Dulaglutide)',
  semaglutide_rybelsus: 'Rybelsus (Oral Semaglutide)',
  orforglipron: 'Orforglipron (Oral GLP-1)',
  compounded_semaglutide: 'Compounded Semaglutide',
  compounded_tirzepatide: 'Compounded Tirzepatide',
  compounded_glp1_gip: 'Compounded GLP-1/GIP',
};

const GOAL_LABELS: Record<string, string> = {
  muscle_preservation: 'Preserve muscle',
  weight_management: 'Lose fat',
  both: 'Preserve muscle & lose fat',
};

const WHAT_HAPPENS_NEXT = [
  'Log your meals daily: 30 seconds with voice or barcode',
  'Track protein toward your daily floor',
  'Get injection-cycle-aware guidance every day',
  'Red-flag safety monitoring, always free',
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function RevealScreen() {
  const router = useRouter();
  const formData = useOnboardingStore.use.formData();
  // Auth store is the most reliable source — set reactively by onAuthStateChange
  // at sign-up time and stays in memory throughout onboarding.
  const storeSession = useAuthStore.use.session();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const medicationLabel
    = formData.medicationId !== undefined
      ? MEDICATION_LABELS[formData.medicationId]
      : 'Not specified';

  const goalLabel
    = formData.goal !== undefined ? (GOAL_LABELS[formData.goal] ?? 'Not specified') : 'Not specified';

  const handleStart = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Onboarding store — userId written immediately at sign-up, most reliable.
      let userId: string | undefined = formData.userId;

      // 2. Auth store — set by onAuthStateChange at sign-up, lives in memory.
      if (!userId)
        userId = storeSession?.user?.id;

      // 3. getSession() — reads AsyncStorage (may lag on first launch).
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData.session?.user?.id;
      }

      // 4. getUser() — live network call, last resort.
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData.user?.id;
      }

      if (!userId) {
        setErrorMessage('Your session was lost. Please sign in again.');
        router.replace('/(auth)/sign-in');
        return;
      }

      const { error } = await saveOnboardingProfile(userId, formData);
      if (error) {
        setErrorMessage(`Profile save failed: ${error}`);
        return;
      }

      // Await the AsyncStorage write BEFORE navigating so (app)/_layout
      // reads isFirstTime=false on its first render and does not redirect back.
      await setItem('IS_FIRST_TIME', false);

      analytics.capture(EVENTS.ONBOARDING_COMPLETED);

      // Request notification permission at the ideal moment — user has just
      // completed onboarding and understands the app's value proposition.
      // Fire-and-forget: no-op if denied. User can configure reminders in
      // Settings → Notifications.
      notifications.requestPermission().catch(() => {});

      router.replace('/(app)/');
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      step={{ current: 10, total: 10 }}
      title="You're all set"
      subtitle="Here's what GLiPra will do for you every day."
      footer={(
        <StepFooter
          primaryLabel={loading ? 'Setting up your profile…' : 'Start GLiPra →'}
          onPrimary={() => { void handleStart(); }}
          primaryDisabled={loading}
        />
      )}
    >
      {/* Summary cards */}
      <View style={styles.summarySection}>
        <SummaryCard
          label="Your protein floor"
          value={
            formData.proteinFloorG !== undefined ? `${formData.proteinFloorG}g/day` : '-'
          }
          accent
        />
        <SummaryCard label="Your medication" value={medicationLabel} />
        <SummaryCard label="Your goal" value={goalLabel} />
      </View>

      {/* What happens next */}
      <View style={styles.nextSection}>
        <Text style={styles.nextTitle}>What happens next</Text>
        {WHAT_HAPPENS_NEXT.map((item, index) => (
          <View key={index} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Inline error */}
      {errorMessage !== null && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </OnboardingScaffold>
  );
}

// ─── Summary card sub-component ──────────────────────────────────────────────

type SummaryCardProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function SummaryCard({ label, value, accent = false }: SummaryCardProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const summaryStyles = React.useMemo(
    () => makeSummaryStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={[summaryStyles.card, accent && summaryStyles.cardAccent]}>
      <Text style={[summaryStyles.label, accent && summaryStyles.labelAccent]}>{label}</Text>
      <Text style={[summaryStyles.value, accent && summaryStyles.valueAccent]}>{value}</Text>
    </View>
  );
}

// ─── Style interfaces ─────────────────────────────────────────────────────────

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeSummaryStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.sm,
    },
    cardAccent: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    labelAccent: {
      color: colors.primary,
    },
    value: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    valueAccent: {
      fontSize: 22,
      color: colors.primary,
    },
  });
}

// ─── Main styles ─────────────────────────────────────────────────────────────

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    summarySection: {
      marginBottom: spacing.md,
    },

    // What happens next
    nextSection: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      ...shadows.sm,
    },
    nextTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      marginTop: 7,
      flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 22,
    },

    // Error banner
    errorBanner: {
      backgroundColor: colors.errorLight,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.error,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      lineHeight: 20,
    },
  });
}
