import type { GlipraTokens } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useConsentStore } from '@/features/consent/use-consent-store';
import { useTheme } from '@/lib/ThemeContext';

export default function ConsentScreen() {
  const router = useRouter();
  const [, setHasAgreed] = useConsentStore();
  const [agreed, setAgreed] = useState(false);
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const handleContinue = () => {
    setHasAgreed(true);
    router.replace('/(app)/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Before we begin</Text>
          <Text style={styles.subheading}>
            Please read and agree to the following before using GLiPra.
          </Text>
        </View>

        {/* Terms of Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms of Service</Text>
          <Text style={styles.sectionBody}>
            GLiPra provides nutrition tracking tools designed to support individuals on
            GLP-1 medications. By using this app, you agree to use it only for its
            intended purpose and to provide accurate information to receive appropriate
            guidance.
            {'\n\n'}
            You may not use GLiPra for any unlawful purpose. We reserve the right to
            suspend accounts that misuse the service. Your continued use constitutes
            acceptance of any updates to these terms.
          </Text>
        </View>

        {/* Medical Disclaimer — Tier 1, full content weight per Rule 8 */}
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerBody}>
            GLiPra is designed by a licensed pharmacist to support your nutrition while
            on GLP-1 medication. It is
            {' '}
            <Text style={styles.disclaimerBold}>not a substitute</Text>
            {' '}
            for professional
            medical advice, diagnosis, or treatment.
          </Text>
          <Text style={[styles.disclaimerBody, styles.disclaimerBodySpaced]}>
            Protein floor estimates and guidance are based on the information you provide.
            Inaccurate inputs will produce inaccurate estimates. Always consult your
            prescriber or a qualified healthcare provider before making changes to your
            diet, medication, or health routine.
          </Text>
          <Text style={[styles.disclaimerBody, styles.disclaimerBodySpaced]}>
            If you experience symptoms that concern you, contact your prescriber directly.
            Do not delay seeking medical attention based on anything in this app.
          </Text>
        </DisclaimerBanner>

        {/* Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.sectionBody}>
            Your health data is stored securely and never sold to third parties. We use
            anonymized, non-identifiable data to improve app guidance. You may export or
            delete all your data at any time from Settings.
            {'\n\n'}
            We may share aggregated, de-identified usage statistics for research purposes.
            Any AI features use anonymized context only. Your name, email, and identifying
            details are never included in AI prompts.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAgreed(v => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to the Terms of Service, Medical Disclaimer, and Privacy
            Policy.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.continueButton, !agreed && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!agreed}
          accessibilityRole="button"
          accessibilityLabel="Continue to GLiPra"
        >
          <Text style={[styles.continueButtonText, !agreed && styles.continueButtonTextDisabled]}>
            Continue
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
      paddingBottom: spacing.sm,
    },
    header: {
      marginBottom: spacing.lg,
    },
    heading: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subheading: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadows.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sectionBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
    },
    disclaimerBody: {
      fontSize: 14,
      color: colors.disclaimerText,
      lineHeight: 21,
    },
    disclaimerBold: {
      fontWeight: '700',
    },
    disclaimerBodySpaced: {
      marginTop: spacing.sm,
    },
    bottomSpacer: {
      height: spacing.md,
    },

    // Footer
    footer: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      ...shadows.md,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.gray300,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
      marginTop: 1,
      flexShrink: 0,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxTick: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 14,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    continueButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueButtonDisabled: {
      backgroundColor: colors.gray200,
    },
    continueButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    continueButtonTextDisabled: {
      color: colors.textDisabled,
    },
  });
}
