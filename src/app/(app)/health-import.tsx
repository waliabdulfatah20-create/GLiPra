/**
 * health-import.tsx — /health-import route
 *
 * NOT a visible tab. Accessible from Settings → Health Import.
 * Requires an EAS dev build — react-native-health-link is a native module.
 *
 * Rule 8: DisclaimerBanner tier={2} — educational screen.
 */

import type { GlipraTokens } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useHealthImport } from '@/features/health-import/hooks';
import { useTheme } from '@/lib/ThemeContext';

export default function HealthImportScreen() {
  const router = useRouter();
  const { isAvailable, isLoading, requestPermissions, importWeights, todaySteps }
    = useHealthImport();

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const handleConnect = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermissions();
      setPermissionsGranted(granted);
      if (!granted) {
        Alert.alert(
          'Permission Denied',
          'Health access was not granted. You can enable it in your device Settings.',
        );
      }
    }
    finally {
      setIsRequesting(false);
    }
  };

  const handleImportWeights = async () => {
    setIsImporting(true);
    try {
      const { imported, skipped } = await importWeights();
      Alert.alert(
        'Import Complete',
        imported > 0
          ? `Imported ${imported} weight reading${imported === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} already existed)` : ''}.`
          : skipped > 0
            ? 'All readings already exist in Glipra - nothing new to import.'
            : 'No weight readings found in the last 90 days.',
      );
    }
    catch {
      Alert.alert('Import Failed', 'Something went wrong. Please try again.');
    }
    finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Health Import</Text>
          <View style={styles.backButton} />
        </View>

        {/* Expo Go notice */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeIcon}>ℹ</Text>
          <Text style={styles.noticeText}>
            Health import requires the full app build. Not available in Expo Go.
          </Text>
        </View>

        {/* Availability status card */}
        {isLoading
          ? (
              <View style={styles.statusCard}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.statusText}>Checking health platform…</Text>
              </View>
            )
          : (
              <View style={[styles.statusCard, isAvailable ? styles.statusAvailable : styles.statusUnavailable]}>
                <View style={[styles.statusDot, { backgroundColor: isAvailable ? colors.success : colors.gray300 }]} />
                <View style={styles.statusTextGroup}>
                  <Text style={styles.statusHeading}>
                    {isAvailable ? 'Health Platform Available' : 'Health Platform Unavailable'}
                  </Text>
                  <Text style={styles.statusSubtext}>
                    {isAvailable
                      ? 'Apple Health / Google Fit is accessible on this device.'
                      : 'Apple Health / Google Fit could not be found. Make sure you are using a full app build.'}
                  </Text>
                </View>
              </View>
            )}

        {/* Connect / Import actions — only shown when available */}
        {isAvailable && !isLoading && (
          <>
            {!permissionsGranted && (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  isRequesting && styles.primaryButtonDisabled,
                ]}
                onPress={handleConnect}
                disabled={isRequesting}
                accessibilityRole="button"
                accessibilityLabel="Connect to health platform"
              >
                {isRequesting
                  ? (
                      <ActivityIndicator color={colors.white} />
                    )
                  : (
                      <Text style={styles.primaryButtonText}>Connect</Text>
                    )}
              </Pressable>
            )}

            {permissionsGranted && (
              <View style={styles.connectedCard}>
                <View style={styles.connectedHeader}>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.connectedTitle}>Connected</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.importButton,
                    pressed && styles.importButtonPressed,
                    isImporting && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleImportWeights}
                  disabled={isImporting}
                  accessibilityRole="button"
                  accessibilityLabel="Import weight history from health platform"
                >
                  {isImporting
                    ? (
                        <ActivityIndicator color={colors.white} />
                      )
                    : (
                        <Text style={styles.primaryButtonText}>Import Weight History</Text>
                      )}
                </Pressable>

                <Text style={styles.importHint}>
                  Imports up to 90 days of weight readings. Duplicate dates are skipped automatically.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Step count card */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsLabel}>STEPS TODAY</Text>
          {isLoading
            ? (
                <ActivityIndicator color={colors.primary} />
              )
            : todaySteps !== null
              ? (
                  <Text style={styles.stepsValue}>
                    {todaySteps.toLocaleString()}
                    <Text style={styles.stepsUnit}> steps</Text>
                  </Text>
                )
              : (
                  <Text style={styles.stepsUnavailable}>Steps unavailable</Text>
                )}
          <Text style={styles.stepsNote}>
            Step count is used for activity-level context, not displayed on the main screen.
          </Text>
        </View>

        {/* Rule 8 — Tier-2 disclaimer */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            Health data is read-only and never shared. Imported weights are subject to the same
            inaccuracy disclaimers as manually logged entries.
          </Text>
        </DisclaimerBanner>
      </ScrollView>
    </SafeAreaView>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },

    // Header
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    backButton: {
      width: 60,
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },

    // Expo Go notice
    noticeCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.sm,
    },
    noticeIcon: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '700',
      marginTop: 1,
    },
    noticeText: {
      flex: 1,
      fontSize: 13,
      color: colors.primary,
      lineHeight: 18,
    },

    // Status card
    statusCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
      ...shadows.sm,
    },
    statusAvailable: {
      backgroundColor: colors.successLight,
    },
    statusUnavailable: {
      backgroundColor: colors.surface,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: 4,
      flexShrink: 0,
    },
    statusTextGroup: {
      flex: 1,
    },
    statusHeading: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    statusSubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    statusText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
    },

    // Buttons
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    primaryButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },

    // Connected + import
    connectedCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
      ...shadows.sm,
    },
    connectedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    connectedTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.success,
    },
    importButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    importButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
    importHint: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
      textAlign: 'center',
    },

    // Steps card
    stepsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.xs,
      ...shadows.sm,
    },
    stepsLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
    },
    stepsValue: {
      fontSize: 40,
      fontWeight: '800',
      color: colors.textPrimary,
      lineHeight: 48,
    },
    stepsUnit: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    stepsUnavailable: {
      fontSize: 14,
      color: colors.textDisabled,
      fontStyle: 'italic',
    },
    stepsNote: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 17,
      marginTop: spacing.xs,
    },

    // Disclaimer
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
