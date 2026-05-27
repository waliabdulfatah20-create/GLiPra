// Screen: /visit-prep
// Prescriber Visit Prep — Pro feature (PDF export gated).
// Shows a 4-week data summary and pharmacist-authored questions list.
// Rule 8: DisclaimerBanner tier={1} — this is a clinical screen.

import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { ProGate, useSubscription } from '@/features/subscription';
import {
  useVisitPrepData,
  useVisitPrep,
  useGeneratePdf,
} from '@/features/visit-prep/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

// Static fallback questions shown before AI generation runs.
const STATIC_QUESTIONS = [
  'Is my current dose appropriate for my weight?',
  'Should I adjust my injection day based on my schedule?',
  'Are my protein goals still appropriate?',
  'What symptoms should prompt me to call between visits?',
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeSectionCardStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      {children}
    </View>
  );
}

function DataRow({ name, value }: { name: string; value: string }) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeDataRowStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataRowLabel}>{name}</Text>
      <Text style={styles.dataRowValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function VisitPrepScreen() {
  const router = useRouter();
  const data = useVisitPrepData();
  const {
    questions: aiQuestions,
    isLoading: isQuestionsLoading,
    error: questionsError,
    generate: generateQuestions,
  } = useVisitPrep();
  const { generate, isLoading: isPdfLoading, error: pdfError } = useGeneratePdf();
  const { isPro } = useSubscription();

  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Active question list — AI-generated when available, static fallback otherwise.
  const activeQuestions: readonly string[] =
    aiQuestions !== null ? aiQuestions : STATIC_QUESTIONS;

  const handleGenerateQuestions = React.useCallback(async () => {
    haptics.medium();
    await generateQuestions(data);
  }, [data, generateQuestions]);

  const handleExport = React.useCallback(async () => {
    haptics.medium();
    if (!isPro) return;

    const pdfBase64 = await generate(data);

    if (!pdfBase64) {
      Alert.alert(
        'Export failed',
        pdfError ?? 'Could not generate PDF. Please try again.',
      );
      return;
    }

    // Attempt to share with expo-sharing if available.
    // expo-sharing is a native-only package — we require it lazily so the
    // module doesn't crash in environments where it isn't installed.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sharing = require('expo-sharing');
      const FileSystem = require('expo-file-system');
      if (await Sharing.isAvailableAsync()) {
        const fileUri = `${FileSystem.cacheDirectory}visit-prep.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Visit Prep Summary',
        });
        return;
      }
    } catch {
      // Sharing unavailable on this device/simulator — fall through to stub
    }

    // Stub: show a truncated base64 in an alert for local dev verification.
    Alert.alert(
      'PDF Ready',
      `PDF generated successfully.\nBase64 length: ${pdfBase64.length} chars.\n\nSharing is not available on this device.`,
    );
  }, [data, generate, pdfError]);

  if (data.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>{'‹ Back'}</Text>
          </Pressable>
          <Text style={styles.title}>Visit Prep</Text>
          <View style={styles.backButton} />
        </View>

        {/* Rule 8: Tier-1 disclaimer — clinical screen */}
        <DisclaimerBanner tier={1}>
          <Text style={styles.disclaimerText}>
            This summary is for informational purposes only and does not
            constitute medical advice. It is designed to help you have a more
            informed conversation with your prescriber. Designed by a licensed
            pharmacist. Always consult your healthcare provider for clinical
            decisions.
          </Text>
        </DisclaimerBanner>

        {/* Pro gate — ProGate renders a paywall CTA card when not Pro */}

        {/* === Data Summary — visible to all users === */}

        {/* Weight card */}
        <SectionCard label="WEIGHT TREND">
          <DataRow
            name="Current weight"
            value={
              data.currentWeightKg !== null
                ? `${data.currentWeightKg.toFixed(1)} kg`
                : 'Not recorded'
            }
          />
          <DataRow
            name="Smoothed trend (EWMA)"
            value={
              data.ewmaWeightKg !== null
                ? `${data.ewmaWeightKg.toFixed(1)} kg`
                : 'Not recorded'
            }
          />
        </SectionCard>

        {/* Nutrition card */}
        <SectionCard label="NUTRITION SUMMARY">
          <DataRow
            name="Avg protein (4 weeks)"
            value={
              data.avgProteinG > 0
                ? `${Math.round(data.avgProteinG)} g/day`
                : 'No food logs yet'
            }
          />
        </SectionCard>

        {/* Injection cycle card */}
        <SectionCard label="INJECTION CYCLE">
          <DataRow
            name="Medication"
            value={data.medicationName ?? 'Not specified'}
          />
          <DataRow
            name="Current phase"
            value={data.injectionPhase ?? 'Unknown'}
          />
          <DataRow
            name="Days since injection"
            value={
              data.daysSinceInjection !== null
                ? `${data.daysSinceInjection} days`
                : 'Unknown'
            }
          />
        </SectionCard>

        {/* Symptoms card */}
        <SectionCard label="RECENT SYMPTOMS (last 7 check-ins)">
          {data.avgNausea !== null && data.avgEnergy !== null ? (
            <>
              <DataRow
                name="Avg nausea (1–5)"
                value={data.avgNausea.toFixed(1)}
              />
              <DataRow
                name="Avg energy (1–5)"
                value={data.avgEnergy.toFixed(1)}
              />
            </>
          ) : (
            <Text style={styles.emptyText}>No check-ins yet</Text>
          )}
        </SectionCard>

        {/* Questions to ask prescriber */}
        <SectionCard label="QUESTIONS TO ASK YOUR PRESCRIBER">
          {activeQuestions.map((q, i) => (
            <View key={i} style={styles.questionRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.questionText}>{q}</Text>
            </View>
          ))}

          {/* AI generation error */}
          {questionsError !== null && (
            <Text style={styles.errorText}>{questionsError}</Text>
          )}

          {/* Generate AI questions button */}
          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              pressed && styles.generateButtonPressed,
              isQuestionsLoading && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerateQuestions}
            disabled={isQuestionsLoading}
            accessibilityRole="button"
            accessibilityLabel="Generate personalized questions with AI"
          >
            {isQuestionsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.generateButtonText}>
                {aiQuestions !== null
                  ? 'Regenerate Questions'
                  : 'Generate Personalized Questions'}
              </Text>
            )}
          </Pressable>

          {isQuestionsLoading && (
            <Text style={styles.questionsNote}>Analyzing your recent data...</Text>
          )}

          <Text style={styles.questionsNote}>
            {aiQuestions !== null
              ? 'AI-generated from your recent data. Add your own notes before your visit.'
              : 'Pharmacist-authored fallback. Tap above to generate personalized questions.'}
          </Text>
        </SectionCard>

        {/* Export button — Pro only; ProGate shows paywall CTA for free users */}
        <ProGate featureName="Visit Prep PDF">
          <Pressable
            style={({ pressed }) => [
              styles.exportButton,
              pressed && styles.exportButtonPressed,
            ]}
            onPress={handleExport}
            disabled={isPdfLoading}
            accessibilityRole="button"
            accessibilityLabel="Export visit prep PDF"
          >
            {isPdfLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.exportButtonText}>Export PDF</Text>
            )}
          </Pressable>
        </ProGate>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
    loader: {
      flex: 1,
      alignSelf: 'center',
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
      marginBottom: spacing.xs,
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

    // Disclaimer
    disclaimerText: {
      fontSize: 12,
      color: colors.disclaimerText,
      lineHeight: 18,
    },

    emptyText: {
      fontSize: 13,
      color: colors.textDisabled,
      fontStyle: 'italic',
    },

    // Questions
    questionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    bulletDot: {
      fontSize: 13,
      color: colors.primary,
      lineHeight: 20,
    },
    questionText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 20,
      flex: 1,
    },
    questionsNote: {
      fontSize: 11,
      color: colors.textDisabled,
      fontStyle: 'italic',
      marginTop: spacing.xs,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      lineHeight: 18,
      marginTop: spacing.xs,
    },

    // Generate questions button (outlined, secondary action)
    generateButton: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.sm,
      minHeight: 38,
      justifyContent: 'center',
    },
    generateButtonPressed: {
      backgroundColor: colors.primaryLight,
    },
    generateButtonDisabled: {
      borderColor: colors.border,
    },
    generateButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },

    // Export button
    exportButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      ...shadows.md,
    },
    exportButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
    exportButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },
  });
}

function makeSectionCardStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.sm,
    },
    cardLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      marginBottom: spacing.xs / 2,
    },
  });
}

function makeDataRowStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    dataRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dataRowLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    dataRowValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'right',
      flexShrink: 1,
      marginLeft: spacing.sm,
    },
  });
}
