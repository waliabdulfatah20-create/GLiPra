// Nutrition Log Screen — food logging entry point.
// Route: /(app)/log
//
// Layout (top to bottom):
//   1. Header — "Nutrition Log" title + compact protein ring
//   2. DailyMacroCard (when entries exist)
//   2b. MicronutrientWatchCard — Pro-gated, always rendered
//   3. MealChipRow — Breakfast / Lunch / Dinner / Snack time-based filter
//   4. VoiceCaptureButton — full-width navy AI hero card (Pro-gated internally)
//      + PhotoCaptureButton — compact AI action row (Pro-gated internally)
//   5. 2-tab toggle — Manual | Barcode, with a "free" caption underneath
//   6. ManualEntryForm (when mode === 'manual')
//   7. Today's log / filtered section header
//   8. FoodLogRow list (filtered by selectedMeal)
//
// Barcode scanning is always free (never paywalled).
// AI Photo Recognition is Pro-only (gated via PhotoCaptureButton internally).
// DisclaimerBanner tier={2} required per Rule 8 (clinical screen).

import type { MealSlot } from '@/components/log/meal-chip-row';
import type { BarcodeProduct } from '@/features/food-log/barcode-lookup';
import type { RecognitionResult } from '@/features/food-log/photo-recognition';

import type { FoodLogEntry, ManualFoodEntry } from '@/features/food-log/types';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BarcodeScannerSheet } from '@/components/log/barcode-scanner-sheet';
import { ManualEntryForm } from '@/components/log/manual-entry-form';
import { MealChipRow } from '@/components/log/meal-chip-row';
import { NutritionHeaderRing } from '@/components/log/nutrition-header-ring';
import { PhotoCaptureButton } from '@/components/log/photo-capture-button';
import { PhotoCommentSheet } from '@/components/log/photo-comment-sheet';
import { VoiceCaptureButton } from '@/components/log/voice-capture-button';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { AIReviewSheet } from '@/features/food-log/ai-review-sheet';
import { DailyMacroCard } from '@/features/food-log/daily-macro-card';
import { useInsertBarcodeFoodLog, useInsertFoodLog, usePhotoFoodLog, useTodayFoodLogs } from '@/features/food-log/hooks';
import { MicronutrientWatchCard } from '@/features/food-log/micronutrient-watch-card';
import { transcribeVoice } from '@/features/food-log/voice-recognition';
import { useTodayData } from '@/features/today/hooks';
import { useTheme } from '@/lib/ThemeContext';

// ---------------------------------------------------------------------------
// Meal slot helper — client-side time-based filter, no DB column needed.
// ---------------------------------------------------------------------------
function getMealSlot(loggedAt: string): MealSlot {
  const hour = new Date(loggedAt).getHours(); // local time
  if (hour >= 5 && hour < 11)
    return 'breakfast';
  if (hour >= 11 && hour < 15)
    return 'lunch';
  if (hour >= 15 && hour < 21)
    return 'dinner';
  return 'snack';
}

type LogMode = 'manual' | 'barcode';

export default function LogScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<LogMode>('manual');
  const [scannerVisible, setScannerVisible] = React.useState(false);
  const [selectedMeal, setSelectedMeal] = React.useState<MealSlot | null>(null);
  // Holds the captured image until the user fills in optional comment context.
  const [pendingCapture, setPendingCapture] = React.useState<{
    base64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  } | null>(null);

  const { logs, isLoading: logsLoading } = useTodayFoodLogs();
  const { mutate: insertManual, isLoading: insertingManual } = useInsertFoodLog();
  const { mutate: insertBarcode, isLoading: insertingBarcode } = useInsertBarcodeFoodLog();
  const {
    recognize,
    pendingResult,
    clearPending,
    isLoading: recognizing,
  } = usePhotoFoodLog();
  const { proteinFloorG } = useTodayData();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleManualSubmit(entry: ManualFoodEntry) {
    insertManual(entry);
  }

  function handleBarcodeMode() {
    setMode('barcode');
    setScannerVisible(true);
  }

  function handleProductFound(product: BarcodeProduct) {
    insertBarcode({
      name: product.name,
      servingDescription: product.servingDescription,
      barcodeEan: product.ean,
      proteinG: product.proteinG,
      carbsG: product.carbsG,
      fatG: product.fatG,
      fiberG: product.fiberG,
      caloriesKcal: product.caloriesKcal,
      magnesiumMg: product.magnesiumMg,
      zincMg: product.zincMg,
      b12Mcg: product.b12Mcg,
      vitaminDIu: product.vitaminDIu,
    });
  }

  function handleScannerClose() {
    setScannerVisible(false);
    setMode('manual');
  }

  function handlePhotoReviewClose() {
    clearPending();
    // Stay on the log screen so user can take another photo if needed
  }

  function handleAnalyze(comment?: string) {
    if (!pendingCapture)
      return;
    recognize(pendingCapture.base64, pendingCapture.mimeType, comment);
    setPendingCapture(null);
  }

  const [isVoiceLoading, setIsVoiceLoading] = React.useState(false);
  const [voiceResult, setVoiceResult] = React.useState<RecognitionResult | null>(null);

  const handleAudioCaptured = React.useCallback(
    async (base64: string, mimeType: string) => {
      setIsVoiceLoading(true);
      const result = await transcribeVoice({ audioBase64: base64, mimeType });
      setIsVoiceLoading(false);
      setVoiceResult(result);
    },
    [],
  );

  function handleVoiceReviewClose() {
    setVoiceResult(null);
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const totalProteinToday = logs.reduce((sum, entry) => sum + entry.proteinG, 0);

  const filteredLogs = selectedMeal
    ? logs.filter(log => getMealSlot(log.loggedAt) === selectedMeal)
    : logs;

  const sectionLabel = selectedMeal
    ? selectedMeal.toUpperCase()
    : t('log.todays_log').toUpperCase();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.id}
        ListHeaderComponent={(
          <>
            {/* 1. Header — title + compact protein ring */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>{t('log.title')}</Text>
                {logs.length > 0 && (
                  <Text style={styles.headerSubtitle}>
                    {t('log.protein_today', { amount: totalProteinToday.toFixed(1) })}
                  </Text>
                )}
              </View>
              <NutritionHeaderRing consumed={totalProteinToday} floor={proteinFloorG} />
            </View>

            {/* 2. Daily macro summary card — shown when there are entries today */}
            {logs.length > 0 && <DailyMacroCard />}

            {/* 2b. Micronutrient Watch — Pro-gated, always rendered (handles empty state internally) */}
            <MicronutrientWatchCard />

            {/* 3. Meal context chips */}
            <MealChipRow active={selectedMeal} onSelect={setSelectedMeal} />

            {/* 4. AI logging — voice hero card, then compact photo row (each full-width) */}
            <VoiceCaptureButton
              onAudioCaptured={handleAudioCaptured}
              isLoading={isVoiceLoading}
            />
            <PhotoCaptureButton
              onImageSelected={(base64, mimeType) =>
                setPendingCapture({ base64, mimeType })}
              isLoading={recognizing}
            />

            {/* 5. 2-tab toggle — Manual | Barcode */}
            <View style={styles.modeToggleRow}>
              <Pressable
                style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
                onPress={() => setMode('manual')}
                accessibilityRole="button"
                accessibilityLabel="Manual entry mode"
                accessibilityState={{ selected: mode === 'manual' }}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'manual' && styles.modeButtonTextActive,
                  ]}
                >
                  {t('log.mode_manual')}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modeButton, mode === 'barcode' && styles.modeButtonActive]}
                onPress={handleBarcodeMode}
                accessibilityRole="button"
                accessibilityLabel="Barcode scanner mode"
                accessibilityState={{ selected: mode === 'barcode' }}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'barcode' && styles.modeButtonTextActive,
                  ]}
                >
                  {t('log.mode_barcode')}
                </Text>
              </Pressable>
            </View>

            {/* 5b. Free-logging caption — barcode + manual are never paywalled */}
            <Text style={styles.freeNote}>{t('log.free_logging_note')}</Text>

            {/* 6. Manual entry form (mode === 'manual') */}
            {mode === 'manual' && (
              <ManualEntryForm
                onSubmit={handleManualSubmit}
                isLoading={insertingManual || insertingBarcode}
              />
            )}

            {/* 7. Today's log section header — label reflects active meal chip */}
            {logs.length > 0 && (
              <Text style={styles.sectionTitle}>{sectionLabel}</Text>
            )}

            {logsLoading && logs.length === 0 && (
              <Text style={styles.emptyText}>{t('log.loading')}</Text>
            )}

            {/* 8. Empty state */}
            {!logsLoading && filteredLogs.length === 0 && logs.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🍽</Text>
                <Text style={styles.emptyStateTitle}>{t('log.nothing_logged')}</Text>
                <Text style={styles.emptyStateBody}>{t('log.nothing_logged_body')}</Text>
              </View>
            )}

            {/* 8b. Empty state for filtered view with entries */}
            {!logsLoading && filteredLogs.length === 0 && logs.length > 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateBody}>
                  No entries for
                  {' '}
                  {selectedMeal}
                  {' '}
                  yet
                </Text>
              </View>
            )}
          </>
        )}
        renderItem={({ item }) => <FoodLogRow entry={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={(
          <View style={styles.footer}>
            <DisclaimerBanner tier={2}>
              <Text style={styles.disclaimerText}>{t('log.disclaimer')}</Text>
            </DisclaimerBanner>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Barcode scanner sheet */}
      <BarcodeScannerSheet
        visible={scannerVisible}
        onClose={handleScannerClose}
        onProductFound={handleProductFound}
      />

      {/* Comment sheet — slides up immediately after capture, before AI call */}
      <PhotoCommentSheet
        visible={!!pendingCapture}
        onAnalyze={handleAnalyze}
        onDismiss={() => setPendingCapture(null)}
      />

      {/* Photo review sheet — slides up after AI recognition */}
      <AIReviewSheet
        result={pendingResult}
        onClose={handlePhotoReviewClose}
      />

      {/* Voice review sheet — slides up after voice transcription */}
      <AIReviewSheet
        result={voiceResult}
        transcript={voiceResult?.transcript}
        onClose={handleVoiceReviewClose}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: FoodLogRow
// ---------------------------------------------------------------------------
type FoodLogRowProps = {
  entry: FoodLogEntry;
};

function FoodLogRow({ entry }: FoodLogRowProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const rowStyles = React.useMemo(
    () => makeFoodLogRowStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const sourceBadgeStyle
    = entry.source === 'barcode'
      ? rowStyles.sourceBadgeBarcode
      : entry.source === 'photo'
        ? rowStyles.sourceBadgePhoto
        : rowStyles.sourceBadgeManual;
  const sourceBadgeTextStyle
    = entry.source === 'barcode'
      ? rowStyles.sourceBadgeTextBarcode
      : entry.source === 'photo'
        ? rowStyles.sourceBadgeTextPhoto
        : rowStyles.sourceBadgeTextManual;

  return (
    <View style={rowStyles.logRow}>
      <View style={rowStyles.logRowLeft}>
        <Text style={rowStyles.logRowName} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={rowStyles.logRowServing} numberOfLines={1}>
          {entry.servingDescription}
        </Text>
        <View style={rowStyles.logRowBadgeRow}>
          <View style={[rowStyles.sourceBadge, sourceBadgeStyle]}>
            <Text style={[rowStyles.sourceBadgeText, sourceBadgeTextStyle]}>
              {entry.source === 'photo' ? t('log.source_ai') : entry.source === 'barcode' ? t('log.source_barcode') : t('log.source_manual')}
            </Text>
          </View>
          {/* Show carbs + fat inline if available */}
          {(entry.carbsG != null || entry.fatG != null) && (
            <Text style={rowStyles.logRowMacroHint}>
              {[
                entry.carbsG != null && `${entry.carbsG.toFixed(0)}g carbs`,
                entry.fatG != null && `${entry.fatG.toFixed(0)}g fat`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
        </View>
      </View>

      <View style={rowStyles.logRowRight}>
        <Text style={rowStyles.logRowProtein}>
          {entry.proteinG.toFixed(1)}
          g
        </Text>
        <Text style={rowStyles.logRowProteinLabel}>protein</Text>
        {entry.caloriesKcal != null && (
          <Text style={rowStyles.logRowCalories}>
            {entry.caloriesKcal.toFixed(0)}
            {' '}
            kcal
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
    freeNote: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '600',
      textAlign: 'center',
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    modeToggleRow: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.gray100,
      borderRadius: radius.lg,
      padding: 4,
      gap: 4,
    },
    modeButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    modeButtonActive: {
      backgroundColor: colors.surface,
      ...shadows.sm,
    },
    modeButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    modeButtonTextActive: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 1,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.md,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textDisabled,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    emptyStateIcon: {
      fontSize: 40,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptyStateBody: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: spacing.md,
    },
    footer: {
      marginTop: spacing.lg,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },
  });
}

function makeFoodLogRowStyles({ colors, spacing, radius }: Pick<GlipraTokens, 'colors' | 'spacing' | 'radius'>) {
  return StyleSheet.create({
    logRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
    },
    logRowLeft: {
      flex: 1,
      gap: 2,
    },
    logRowName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    logRowServing: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    logRowBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 4,
    },
    sourceBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    sourceBadgeManual: {
      backgroundColor: colors.gray100,
    },
    sourceBadgeBarcode: {
      backgroundColor: colors.primaryLight,
    },
    sourceBadgePhoto: {
      backgroundColor: `${colors.primary}18`,
      borderWidth: 1,
      borderColor: `${colors.primary}40`,
    },
    sourceBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    sourceBadgeTextManual: {
      color: colors.textSecondary,
    },
    sourceBadgeTextBarcode: {
      color: colors.primary,
    },
    sourceBadgeTextPhoto: {
      color: colors.primary,
    },
    logRowMacroHint: {
      fontSize: 11,
      color: colors.textDisabled,
    },
    logRowRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    logRowProtein: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.proteinGood,
    },
    logRowProteinLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    logRowCalories: {
      fontSize: 12,
      color: colors.textDisabled,
      marginTop: 2,
    },
  });
}
