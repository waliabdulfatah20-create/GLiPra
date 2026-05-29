import * as React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { MAINTENANCE_GUIDES } from '@/features/medication-status/maintenance-guidance';
import { useTodayProfile } from '@/features/today/hooks';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

// MAINTENANCE_MULTIPLIER from CLAUDE.md: 10% reduction during maintenance
const MAINTENANCE_MULTIPLIER = 0.9;

export default function MaintenanceModeScreen() {
  const { data: profile, isLoading } = useTodayProfile();

  const baseProteinFloor = profile?.proteinFloorG ?? 0;
  const adjustedProteinFloor = Math.round(baseProteinFloor * MAINTENANCE_MULTIPLIER);

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows]
  );

  function handleSwitchToActive() {
    Alert.alert(
      'Switch to Active Phase?',
      'This will update your medication status back to active. Your prescriber should guide any changes to your treatment phase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Active',
          onPress: () => {
            // Navigate to settings where the user can update their status
            router.push('/settings');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>✅</Text>
          <Text style={styles.headerTitle}>Maintenance Mode</Text>
        </View>

        {/* Disclaimer — Rule 8: tier 1 on clinical screens */}
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerText}>
            The guidance on this screen is designed by a licensed pharmacist for
            educational purposes only. It does not constitute medical advice. Always
            consult your prescriber before making changes to your treatment.
          </Text>
        </DisclaimerBanner>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>You've reached your maintenance phase</Text>
          <Text style={styles.heroBody}>
            You've done the hard work. Now the goal is protecting what you've built:
            lean mass, healthy habits, and a sustainable weight.
          </Text>
          <Text style={styles.heroCredit}>Designed by a licensed pharmacist</Text>
        </View>

        {/* Adjusted protein floor */}
        <View style={styles.proteinCard}>
          <Text style={styles.proteinLabel}>MAINTENANCE PROTEIN FLOOR</Text>
          {isLoading ? (
            <Text style={styles.proteinLoadingText}>Loading…</Text>
          ) : (
            <>
              <View style={styles.proteinRow}>
                <Text style={styles.proteinValue}>{adjustedProteinFloor}</Text>
                <Text style={styles.proteinUnit}>g / day</Text>
              </View>
              {baseProteinFloor > 0 && (
                <Text style={styles.proteinNote}>
                  Adjusted to 90% of your active-phase floor ({baseProteinFloor} g).
                  This supports lean mass at your current weight while aligning with
                  a lower maintenance calorie target.
                </Text>
              )}
            </>
          )}
        </View>

        {/* Guidance cards */}
        <Text style={styles.sectionTitle}>Pharmacist Guidance</Text>
        {MAINTENANCE_GUIDES.map((guide) => (
          <View key={guide.id} style={styles.guideCard}>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.guideBody}>{guide.body}</Text>
          </View>
        ))}

        {/* Switch back CTA */}
        <TouchableOpacity
          style={styles.switchButton}
          onPress={handleSwitchToActive}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Switch back to active weight loss phase"
        >
          <Text style={styles.switchButtonText}>Switch back to active phase</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    headerIcon: {
      fontSize: 26,
      marginRight: spacing.sm,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // Disclaimer
    disclaimerText: {
      fontSize: 13,
      color: colors.disclaimerText,
      lineHeight: 20,
    },

    // Hero card
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      ...shadows.md,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.white,
      marginBottom: spacing.sm,
    },
    heroBody: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      lineHeight: 22,
      marginBottom: spacing.sm,
    },
    heroCredit: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.65)',
      fontStyle: 'italic',
    },

    // Protein floor card
    proteinCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    proteinLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    proteinRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing.sm,
    },
    proteinValue: {
      fontSize: 48,
      fontWeight: '800',
      color: colors.textPrimary,
      marginRight: spacing.xs,
    },
    proteinUnit: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    proteinNote: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    proteinLoadingText: {
      fontSize: 14,
      color: colors.textDisabled,
      paddingVertical: spacing.md,
    },

    // Section heading
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },

    // Guidance cards
    guideCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      ...shadows.sm,
    },
    guideTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    guideBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    // Switch back button
    switchButton: {
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    switchButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
