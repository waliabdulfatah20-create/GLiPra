// Eating-style (dietary pattern) editor — reachable from the Today "Set your
// eating style" nudge and Settings > Preferences. Deferred out of onboarding in
// Phase G. Mirrors the update-status-screen pattern: direct Supabase update +
// React Query cache invalidation.
//
// Lives in features/ (not app/) so its co-located test never gets pulled into
// Expo Router's require.context over src/app. The app route is a thin re-export.

import type { GlipraTokens } from '@/theme/tokens';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

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

type DietaryPattern = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'other';

const DIETARY_OPTIONS: { value: DietaryPattern; labelKey: string; descKey: string }[] = [
  { value: 'omnivore', labelKey: 'dietary.opt_omnivore', descKey: 'dietary.opt_omnivore_desc' },
  { value: 'vegetarian', labelKey: 'dietary.opt_vegetarian', descKey: 'dietary.opt_vegetarian_desc' },
  { value: 'vegan', labelKey: 'dietary.opt_vegan', descKey: 'dietary.opt_vegan_desc' },
  { value: 'pescatarian', labelKey: 'dietary.opt_pescatarian', descKey: 'dietary.opt_pescatarian_desc' },
  { value: 'other', labelKey: 'dietary.opt_other', descKey: 'dietary.opt_other_desc' },
];

export function DietaryPreferenceScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const { data: profile } = useTodayProfile();

  const [selected, setSelected] = React.useState<DietaryPattern | undefined>(
    (profile?.dietaryPattern as DietaryPattern | null) ?? undefined,
  );
  const [isSaving, setIsSaving] = React.useState(false);

  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  // Sync initial selection once the profile loads.
  React.useEffect(() => {
    if (profile?.dietaryPattern && selected === undefined) {
      setSelected(profile.dietaryPattern as DietaryPattern);
    }
  }, [profile?.dietaryPattern]);

  const canSave = selected !== undefined && !isSaving;

  async function handleSave() {
    if (!canSave || !session?.user.id)
      return;
    haptics.medium();
    setIsSaving(true);

    await supabase
      .from('profiles')
      .update({ dietary_pattern: selected })
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
        <Text style={styles.title}>{t('dietary.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subheading}>{t('dietary.subtitle')}</Text>

        {DIETARY_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => { haptics.selection(); setSelected(option.value); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={t(option.labelKey)}
            >
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {t(option.labelKey)}
              </Text>
              <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                {t(option.descKey)}
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
          accessibilityLabel={t('dietary.save')}
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            {isSaving ? t('dietary.saving') : t('dietary.save')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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
