// src/components/safety/escalation-card.tsx
// Rule 8: Tier 1 disclaimer required on clinical warning screens
// Rule 9: EscalationCard shows NO medical condition names or pattern types.
// Locked copy — do not modify without attorney sign-off.

import type { RedFlagDetection } from '@/features/safety/redFlagDetector';
import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useTheme } from '@/lib/ThemeContext';

// ─── Locked attorney-approved copy ───────────────────────────────────────────
const COPY = {
  label: 'Important',
  // Rule 9: No condition names, no pattern types — locked generic copy only
  body: 'You\'ve logged symptoms that may need medical attention. Please contact your prescriber today.',
  nextStep: 'Call your prescriber today. If your symptoms feel severe or you think this may be an emergency, call 911.',
  dismiss: 'Dismiss',
  footer: 'This is a symptom pattern alert, not a diagnosis.',
} as const;

// ─── Props ────────────────────────────────────────────────────────────────────
type EscalationCardProps = {
  detection: RedFlagDetection;
  onDismiss?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function EscalationCard({ detection: _detection, onDismiss }: EscalationCardProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={styles.container}>
      {/* Top section: Icon + Label */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🚨</Text>
        <Text style={styles.headerLabel}>{COPY.label}</Text>
      </View>

      {/* Main copy — LOCKED, never change without attorney review */}
      <Text style={styles.body}>{COPY.body}</Text>

      {/* Rule 8: Tier 1 disclaimer banner */}
      <View style={styles.disclaimerWrapper}>
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerText}>
            This is a symptom pattern alert based on your logged symptoms.
          </Text>
        </DisclaimerBanner>
      </View>

      {/* Actionable next-step guidance — plain text, no false affordance */}
      <Text style={styles.nextStep}>{COPY.nextStep}</Text>

      {/* Dismiss action */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={COPY.dismiss}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {COPY.dismiss}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer disclaimer — tiny gray text */}
      <Text style={styles.footerText}>{COPY.footer}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.disclaimerBg,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.disclaimerBorder,
      ...shadows.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    headerIcon: {
      fontSize: 20,
      marginRight: spacing.sm,
    },
    headerLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.warning,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    disclaimerWrapper: {
      marginBottom: spacing.md,
    },
    disclaimerText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textPrimary,
    },
    nextStep: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    button: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButton: {
      backgroundColor: colors.gray200,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: colors.textPrimary,
    },
    footerText: {
      fontSize: 10,
      color: colors.textDisabled,
      textAlign: 'center',
    },
  });
}
