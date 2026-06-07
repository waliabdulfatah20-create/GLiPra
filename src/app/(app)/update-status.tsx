// GLP-1 Status update screen — accessible from Settings > Preferences.
// Lets users change their medication_status after onboarding.
// Mirrors the goal-weight.tsx pattern: direct Supabase update + cache invalidation.

import type { MedicationStatus } from '@/features/today/api';
import type { GlipraTokens } from '@/theme/tokens';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useTodayProfile } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';

// ─── Options ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: MedicationStatus; label: string; description: string }[] = [
  { value: 'starting', label: 'Starting', description: 'New prescription or just starting' },
  { value: 'active', label: 'Active', description: 'Been on it a few weeks or months' },
  { value: 'tapering', label: 'Tapering', description: 'Dose decreasing or reducing frequency' },
  { value: 'maintenance', label: 'Maintenance', description: 'At goal dose, steady state' },
  { value: 'discontinued', label: 'Discontinued', description: 'No longer taking GLP-1 medication' },
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function UpdateStatusScreen() {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const { data: profile } = useTodayProfile();

  const [selected, setSelected] = React.useState<MedicationStatus | undefined>(
    profile?.medicationStatus,
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  // Sync initial selection once profile loads
  React.useEffect(() => {
    if (profile?.medicationStatus && selected === undefined) {
      setSelected(profile.medicationStatus);
    }
  }, [profile?.medicationStatus]);

  const isDirty = selected !== undefined && selected !== profile?.medicationStatus;
  const canSave = isDirty && !isSaving;

  async function handleSave() {
    if (!canSave || !session?.user.id)
      return;
    haptics.medium();
    setIsSaving(true);

    // Keep the derived `phase` column in sync with the new status (same
    // derivation as onboarding) so every reader of profile.phase — readiness,
    // protein guidance, etc. — never sees a stale value. The column is only
    // otherwise written at onboarding, so without this it would drift.
    const phase: 'maintenance' | 'weight_loss'
      = selected === 'maintenance' || selected === 'tapering' ? 'maintenance' : 'weight_loss';

    await supabase
      .from('profiles')
      .update({ medication_status: selected, phase })
      .eq('user_id', session.user.id);

    await queryClient.invalidateQueries({ queryKey: ['today-profile'] });
    setIsSaving(false);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>GLP-1 Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subheading}>
          Update your current medication status. This personalises your Today screen
          and protein guidance.
        </Text>

        {STATUS_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => { haptics.selection(); setSelected(option.value); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={option.label}
            >
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {option.label}
              </Text>
              <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Save status"
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            {isSaving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backText: {
      fontSize: 17,
      color: colors.primary,
      width: 60,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 60,
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },

    subheading: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },

    // Option cards
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    cardLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    cardLabelSelected: {
      color: colors.primary,
    },
    cardDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    cardDescriptionSelected: {
      color: colors.primary,
    },

    // Footer
    footer: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    saveButton: {
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: colors.gray200,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
    saveButtonTextDisabled: {
      color: colors.textDisabled,
    },
  });
}
