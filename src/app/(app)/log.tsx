// Nutrition Log Screen — food logging entry point.
// Route: /(app)/log
//
// Layout (top to bottom) — logging-first, results below:
//   1. Header — "Nutrition Log" title + compact protein ring
//   2. VoiceCaptureButton — full-width navy AI hero card (Pro-gated internally)
//      + PhotoCaptureButton — compact AI action row (Pro-gated internally)
//   3. RecentFoodsRow — one-tap re-log of staples (free; renders null when no history)
//   4. 2-tab toggle — Manual | Barcode, with a "free" caption underneath
//   5. ManualEntryForm (when mode === 'manual')
//   6. Results cluster — DailyMacroCard (when entries exist) + MicronutrientWatchCard
//      (free; renders the grid when micros are logged, null otherwise)
//   7. Today's log section header
//   8. FoodLogRow list
//
// Barcode scanning is always free (never paywalled).
// AI Photo Recognition is Pro-only (gated via PhotoCaptureButton internally).
// DisclaimerBanner tier={2} required per Rule 8 (clinical screen).

import type { BarcodeProduct } from '@/features/food-log/barcode-lookup';
import type { NutrientKey } from '@/features/food-log/micronutrient-constants';
import type { RecognitionResult } from '@/features/food-log/photo-recognition';
import type { RecentFood } from '@/features/food-log/recent-foods';

import type { FoodLogEntry, ManualFoodEntry, SupplementEntry } from '@/features/food-log/types';
import type { GlipraTokens } from '@/theme/tokens';
import { router, useLocalSearchParams } from 'expo-router';
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
import { AbsorptionWindowNote } from '@/components/log/absorption-window-note';
import { AiCaptureHero } from '@/components/log/ai-capture-hero';
import { BarcodeScannerSheet } from '@/components/log/barcode-scanner-sheet';
import { FoodSearchRow } from '@/components/log/food-search-row';
import { FoodSearchSheet } from '@/components/log/food-search-sheet';
import { ManualEntryForm } from '@/components/log/manual-entry-form';
import { NutritionHeaderRing } from '@/components/log/nutrition-header-ring';
import { PhotoCommentSheet } from '@/components/log/photo-comment-sheet';
import { RecentFoodsRow } from '@/components/log/recent-foods-row';
import { SupplementPanel } from '@/components/log/supplement-panel';
import { SupplementQuickAddSheet } from '@/components/log/supplement-quick-add-sheet';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { AiPrivacyDisclaimerModal } from '@/features/food-log/ai-privacy-disclaimer-modal';
import { AIReviewSheet } from '@/features/food-log/ai-review-sheet';
import { AnalyzingModal } from '@/features/food-log/analyzing-modal';
import { DailyMacroCard } from '@/features/food-log/daily-macro-card';
import { useInsertBarcodeFoodLog, useInsertFoodLog, useInsertSupplementLog, usePhotoFoodLog, useRecentFoods, useRelogFoodEntry, useTodayFoodLogs } from '@/features/food-log/hooks';
import { MicronutrientWatchCard } from '@/features/food-log/micronutrient-watch-card';
import { getSupplementNutrient } from '@/features/food-log/supplement';
import { useAiPrivacyAck } from '@/features/food-log/use-ai-privacy-ack';
import { transcribeVoice } from '@/features/food-log/voice-recognition';
import { useTodayData } from '@/features/today/hooks';
import { analytics, EVENTS } from '@/lib/analytics';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

type LogMode = 'manual' | 'barcode' | 'supplement';

export default function LogScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<LogMode>('manual');
  const [scannerVisible, setScannerVisible] = React.useState(false);
  // Seeded foods search sheet (Cascade D) — free, zero AI cost.
  const [searchVisible, setSearchVisible] = React.useState(false);
  // Per-nutrient supplement quick-add — the tapped nutrient (null = sheet closed).
  const [supplementKey, setSupplementKey] = React.useState<NutrientKey | null>(null);
  // Holds the captured image until the user fills in optional comment context.
  const [pendingCapture, setPendingCapture] = React.useState<{
    base64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  } | null>(null);

  const { logs, isLoading: logsLoading } = useTodayFoodLogs();
  const { items: recentItems } = useRecentFoods();
  const { mutate: relog } = useRelogFoodEntry();
  const { mutate: insertManual, isLoading: insertingManual } = useInsertFoodLog();
  const { mutate: insertBarcode, isLoading: insertingBarcode } = useInsertBarcodeFoodLog();
  const { mutate: insertSupplement } = useInsertSupplementLog();
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

  // ── Deep-link scroll to the Micronutrient Watch ────────────────────────────
  // The Today Fuel card's Micronutrients tile pushes `/log?scrollTo=micros`. We
  // capture the micro card's content offset via onLayout and scroll the list to
  // it, then consume the param (setParams undefined) so a later tab focus does
  // not re-scroll. microYRef stays 0 when the card is absent (no micros logged),
  // in which case we leave the user at the top.
  const { scrollTo } = useLocalSearchParams<{ scrollTo?: string }>();
  const listRef = React.useRef<FlatList<FoodLogEntry>>(null);
  const microYRef = React.useRef(0);

  const scrollToMicros = React.useCallback(() => {
    if (scrollTo !== 'micros' || microYRef.current <= 0)
      return;
    listRef.current?.scrollToOffset({
      offset: Math.max(0, microYRef.current - spacing.lg),
      animated: true,
    });
    router.setParams({ scrollTo: undefined });
  }, [scrollTo, spacing.lg]);

  React.useEffect(scrollToMicros, [scrollToMicros]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  // One-tap re-log from the Recent Foods quick-add bar. Free, no AI.
  const handleRelog = React.useCallback(
    (item: RecentFood) => {
      haptics.success();
      relog(item);
    },
    [relog],
  );

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
      ironMg: product.ironMg,
    });
  }

  function handleScannerClose() {
    setScannerVisible(false);
    setMode('manual');
  }

  // Supplement quick-add — both entry points (watch-card tile + Supplement mode
  // panel) open the same single-nutrient sheet; the sheet hands back the entry.
  function handleSupplementAdd(entry: SupplementEntry) {
    haptics.success();
    insertSupplement(entry);
    setSupplementKey(null);
  }

  // ── AI Data & Privacy disclaimer ───────────────────────────────────────────
  // One-time gate shown before the first AI scan (photo or voice). The pending
  // action is captured so we can resume after the user taps "I understand".
  // Cancel does NOT set the ack — user is re-prompted next time.
  const { needsAck, acknowledge } = useAiPrivacyAck();
  const [disclaimerVisible, setDisclaimerVisible] = React.useState(false);
  // For photo: stash the capture so we can replay handleAnalyze post-ack.
  // For voice: a promise resolver the VoiceCaptureButton awaits.
  const pendingPhotoRef = React.useRef<
    | { base64: string; mime: 'image/jpeg' | 'image/png' | 'image/webp'; comment: string | undefined }
    | null
  >(null);
  const pendingVoiceResolverRef = React.useRef<((ok: boolean) => void) | null>(null);
  // Rescan: the last photo sent to recognition, kept alive until the review
  // sheet closes so "Rescan photo" can re-run on the same bytes with a new
  // hint. A ref (not state) so it never interacts with the AnalyzingModal's
  // visibility logic and triggers no re-renders.
  const lastPhotoRef = React.useRef<{
    base64: string;
    mime: 'image/jpeg' | 'image/png' | 'image/webp';
  } | null>(null);

  // ── Analyzing modal state ─────────────────────────────────────────────────
  // Tracks which capture flow is currently being analyzed so a single modal can
  // service both photo and voice. The result hook (pendingResult / voiceResult)
  // is set INSIDE the modal flow; the AIReviewSheet only opens after the modal
  // fires onComplete (which gives the user the green-check beat).
  const [analyzingSource, setAnalyzingSource] = React.useState<'photo' | 'voice' | null>(null);
  const [analyzingImage, setAnalyzingImage]
    = React.useState<{ base64: string; mime: string } | null>(null);
  const [analyzingError, setAnalyzingError] = React.useState<string | null>(null);
  const [analyzingComment, setAnalyzingComment] = React.useState<string | undefined>(undefined);
  // Voice retry needs the original audio bytes — capture is one-shot otherwise.
  const [analyzingAudio, setAnalyzingAudio]
    = React.useState<{ base64: string; mime: string } | null>(null);
  // Local "modal-complete" gate so AIReviewSheet doesn't open until the modal's
  // drain animation finishes.
  const [modalComplete, setModalComplete] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  function newAbortController(): AbortController {
    if (abortControllerRef.current)
      abortControllerRef.current.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;
    return ac;
  }

  function runPhotoRecognize(
    base64: string,
    mime: 'image/jpeg' | 'image/png' | 'image/webp',
    comment: string | undefined,
  ) {
    lastPhotoRef.current = { base64, mime };
    setAnalyzingSource('photo');
    setAnalyzingImage({ base64, mime });
    setAnalyzingError(null);
    setModalComplete(false);
    const ac = newAbortController();
    void (async () => {
      const result = await recognize(base64, mime, comment, ac.signal);
      if (ac.signal.aborted)
        return; // user cancelled
      if (!result) {
        setAnalyzingError('photo');
      }
    })();
  }

  function handleAnalyze(comment?: string) {
    if (!pendingCapture)
      return;
    setAnalyzingComment(comment);
    if (needsAck) {
      // First-ever scan — gate behind the disclaimer modal. Stash the
      // capture; we'll resume in handleDisclaimerAck. Pre-clear pendingCapture
      // so the comment sheet doesn't reopen behind the disclaimer.
      pendingPhotoRef.current = {
        base64: pendingCapture.base64,
        mime: pendingCapture.mimeType,
        comment,
      };
      setPendingCapture(null);
      setDisclaimerVisible(true);
      return;
    }
    runPhotoRecognize(pendingCapture.base64, pendingCapture.mimeType, comment);
    setPendingCapture(null);
  }

  // Voice gate — returns a promise the VoiceCaptureButton awaits. If the user
  // taps "I understand" → resolve(true) → recording proceeds. Cancel → resolve(false).
  const handleVoiceBeforeRecord = React.useCallback(async (): Promise<boolean> => {
    if (!needsAck)
      return true;
    return new Promise<boolean>((resolve) => {
      pendingVoiceResolverRef.current = resolve;
      setDisclaimerVisible(true);
    });
  }, [needsAck]);

  const handleDisclaimerAck = React.useCallback(() => {
    void acknowledge();
    setDisclaimerVisible(false);
    // Resume whichever flow triggered the gate.
    if (pendingPhotoRef.current) {
      const { base64, mime, comment } = pendingPhotoRef.current;
      pendingPhotoRef.current = null;
      runPhotoRecognize(base64, mime, comment);
    }
    else if (pendingVoiceResolverRef.current) {
      pendingVoiceResolverRef.current(true);
      pendingVoiceResolverRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acknowledge]);

  const handleDisclaimerCancel = React.useCallback(() => {
    setDisclaimerVisible(false);
    pendingPhotoRef.current = null;
    if (pendingVoiceResolverRef.current) {
      pendingVoiceResolverRef.current(false);
      pendingVoiceResolverRef.current = null;
    }
  }, []);

  const [voiceResult, setVoiceResult] = React.useState<RecognitionResult | null>(null);

  function runVoiceTranscribe(base64: string, mime: string) {
    setAnalyzingSource('voice');
    setAnalyzingAudio({ base64, mime });
    setAnalyzingError(null);
    setModalComplete(false);
    const ac = newAbortController();
    void (async () => {
      const result = await transcribeVoice({ audioBase64: base64, mimeType: mime }, ac.signal);
      if (ac.signal.aborted)
        return;
      if (!result) {
        setAnalyzingError('voice');
        return;
      }
      setVoiceResult(result);
    })();
  }

  const handleAudioCaptured = React.useCallback(
    async (base64: string, mimeType: string) => {
      runVoiceTranscribe(base64, mimeType);
    },
    // runVoiceTranscribe captures setters which are stable; safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // useCallback wrappers so AnalyzingModal's onComplete useEffect doesn't
  // re-schedule the 350ms timer on every parent re-render (B1 from code review).
  const handleAnalyzingCancel = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAnalyzingSource(null);
    setAnalyzingImage(null);
    setAnalyzingAudio(null);
    setAnalyzingError(null);
    setModalComplete(false);
    clearPending();
    setVoiceResult(null);
    lastPhotoRef.current = null;
  }, [clearPending]);

  const handleAnalyzingRetry = React.useCallback(() => {
    if (analyzingSource === 'photo' && analyzingImage) {
      runPhotoRecognize(
        analyzingImage.base64,
        analyzingImage.mime as 'image/jpeg' | 'image/png' | 'image/webp',
        analyzingComment,
      );
    }
    else if (analyzingSource === 'voice' && analyzingAudio) {
      runVoiceTranscribe(analyzingAudio.base64, analyzingAudio.mime);
    }
    // runPhotoRecognize/runVoiceTranscribe close over setters which are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzingSource, analyzingImage, analyzingAudio, analyzingComment]);

  const handleAnalyzingComplete = React.useCallback(() => {
    setModalComplete(true);
    setAnalyzingSource(null);
    setAnalyzingImage(null);
    setAnalyzingAudio(null);
    setAnalyzingError(null);
  }, []);

  function handlePhotoReviewClose() {
    clearPending();
    setModalComplete(false);
    lastPhotoRef.current = null;
  }

  // "Rescan photo" from the review sheet — re-run recognition on the same
  // bytes with an optional new hint. Closes the sheet WITHOUT clearing
  // lastPhotoRef (not handlePhotoReviewClose) so a second rescan still works.
  // User-initiated, one AI call per tap; the server-side daily cap applies.
  function handleRescan(comment?: string) {
    const photo = lastPhotoRef.current;
    if (!photo)
      return;
    analytics.capture(EVENTS.PHOTO_RESCANNED, { source: 'photo' });
    clearPending();
    setModalComplete(false);
    setAnalyzingComment(comment);
    runPhotoRecognize(photo.base64, photo.mime, comment);
  }

  function handleVoiceReviewClose() {
    setVoiceResult(null);
    setModalComplete(false);
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const totalProteinToday = logs.reduce((sum, entry) => sum + entry.proteinG, 0);

  const sectionLabel = t('log.todays_log').toUpperCase();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ref={listRef}
        data={logs}
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

            {/* 2. AI logging — voice + photo share one "Log with AI" hero */}
            <AiCaptureHero
              onAudioCaptured={handleAudioCaptured}
              onImageSelected={(base64, mimeType) =>
                setPendingCapture({ base64, mimeType })}
              isLoadingVoice={analyzingSource === 'voice'}
              isLoadingPhoto={analyzingSource === 'photo' || recognizing}
              onBeforeRecord={handleVoiceBeforeRecord}
            />

            {/* 3. Recent Foods quick-add — one-tap re-log of staples (free, no AI).
                Sits in the logging zone right under the AI surfaces. Renders nothing
                when there is no history. */}
            <RecentFoodsRow items={recentItems} onRelog={handleRelog} />

            {/* 3c. Seeded food database search (Cascade D) — pharmacist-curated
                verified foods, free, zero AI cost. */}
            <FoodSearchRow onPress={() => setSearchVisible(true)} />

            {/* 3b. Absorption window note — shown only for oral users inside the
                30-min empty-stomach window. Non-blocking, dismissible for the session.
                Renders null for injection users or when the window is not absorbing. */}
            <AbsorptionWindowNote />

            {/* 4. 2-tab toggle — Manual | Barcode */}
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

              <Pressable
                style={[styles.modeButton, mode === 'supplement' && styles.modeButtonActive]}
                onPress={() => setMode('supplement')}
                accessibilityRole="button"
                accessibilityLabel={t('log.supplement_mode')}
                accessibilityState={{ selected: mode === 'supplement' }}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'supplement' && styles.modeButtonTextActive,
                  ]}
                >
                  {t('log.supplement_mode')}
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

            {/* 6c. Supplement quick-add panel (mode === 'supplement') — tap a
                nutrient to add an amount from your supplement label. Always free. */}
            {mode === 'supplement' && <SupplementPanel onAdd={setSupplementKey} />}

            {/* 6b. Results cluster — daily macro summary + Micronutrient Watch.
                DailyMacroCard shows only when entries exist; MicronutrientWatchCard
                self-manages (Pro+data -> grid, Pro+empty -> null, free -> upsell teaser). */}
            {logs.length > 0 && <DailyMacroCard />}
            <View
              onLayout={(e) => {
                const { y, height } = e.nativeEvent.layout;
                // height 0 == card rendered null (no micros) -> leave the user at the top.
                microYRef.current = height > 0 ? y : 0;
                scrollToMicros();
              }}
            >
              <MicronutrientWatchCard onAddSupplement={setSupplementKey} />
            </View>

            {/* 5. Today's log section header */}
            {logs.length > 0 && (
              <Text style={styles.sectionTitle}>{sectionLabel}</Text>
            )}

            {logsLoading && logs.length === 0 && (
              <Text style={styles.emptyText}>{t('log.loading')}</Text>
            )}

            {/* 6. Empty state */}
            {!logsLoading && logs.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🍽</Text>
                <Text style={styles.emptyStateTitle}>{t('log.nothing_logged')}</Text>
                <Text style={styles.emptyStateBody}>{t('log.nothing_logged_body')}</Text>
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

      {/* Seeded foods search sheet (Cascade D) — log mode inserts directly */}
      <FoodSearchSheet
        visible={searchVisible}
        mode="log"
        onClose={() => setSearchVisible(false)}
      />

      {/* Supplement quick-add sheet — driven by the tapped nutrient (watch-card
          tile or Supplement-mode panel). One amount per add. */}
      <SupplementQuickAddSheet
        nutrient={supplementKey ? getSupplementNutrient(supplementKey) : null}
        onAdd={handleSupplementAdd}
        onClose={() => setSupplementKey(null)}
      />

      {/* Comment sheet — slides up immediately after capture, before AI call */}
      <PhotoCommentSheet
        visible={!!pendingCapture}
        onAnalyze={handleAnalyze}
        onDismiss={() => setPendingCapture(null)}
      />

      {/* AI Data & Privacy disclaimer — one-time gate before first scan */}
      <AiPrivacyDisclaimerModal
        visible={disclaimerVisible}
        onAcknowledge={handleDisclaimerAck}
        onCancel={handleDisclaimerCancel}
      />

      {/* Analyzing modal — full-screen staged checklist while AI runs */}
      <AnalyzingModal
        visible={analyzingSource != null}
        source={analyzingSource ?? 'photo'}
        isLoading={analyzingSource != null && (recognizing || (analyzingSource === 'voice' && voiceResult == null && analyzingError == null))}
        hasResult={
          analyzingSource === 'photo'
            ? pendingResult != null
            : voiceResult != null
        }
        error={analyzingError}
        imageBase64={analyzingSource === 'photo' ? analyzingImage?.base64 : null}
        imageMimeType={analyzingSource === 'photo' ? analyzingImage?.mime : null}
        onCancel={handleAnalyzingCancel}
        onRetry={handleAnalyzingRetry}
        onComplete={handleAnalyzingComplete}
      />

      {/* Photo review sheet — opens AFTER analyzing modal finishes */}
      <AIReviewSheet
        result={modalComplete && analyzingSource == null ? pendingResult : null}
        onClose={handlePhotoReviewClose}
        onRescan={handleRescan}
        rescanInitialComment={analyzingComment}
      />

      {/* Voice review sheet — opens AFTER analyzing modal finishes */}
      <AIReviewSheet
        result={modalComplete && analyzingSource == null ? voiceResult : null}
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

  // Voice shares the manual badge (pre-existing behavior).
  const badgeBySource = {
    barcode: { badge: rowStyles.sourceBadgeBarcode, text: rowStyles.sourceBadgeTextBarcode, labelKey: 'log.source_barcode' },
    photo: { badge: rowStyles.sourceBadgePhoto, text: rowStyles.sourceBadgeTextPhoto, labelKey: 'log.source_ai' },
    voice: { badge: rowStyles.sourceBadgeManual, text: rowStyles.sourceBadgeTextManual, labelKey: 'log.source_manual' },
    database: { badge: rowStyles.sourceBadgeDatabase, text: rowStyles.sourceBadgeTextDatabase, labelKey: 'log.source_database' },
    supplement: { badge: rowStyles.sourceBadgeDatabase, text: rowStyles.sourceBadgeTextDatabase, labelKey: 'log.source_supplement' },
    manual: { badge: rowStyles.sourceBadgeManual, text: rowStyles.sourceBadgeTextManual, labelKey: 'log.source_manual' },
  } as const;
  const sourceBadge = badgeBySource[entry.source] ?? badgeBySource.manual;

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
          <View style={[rowStyles.sourceBadge, sourceBadge.badge]}>
            <Text style={[rowStyles.sourceBadgeText, sourceBadge.text]}>
              {t(sourceBadge.labelKey)}
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

      {/* Supplements carry no macros — the amount reads on the serving line, so
          the protein column is suppressed (no misleading "0g protein"). */}
      {entry.source !== 'supplement' && (
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
      )}
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
    sourceBadgeDatabase: {
      backgroundColor: colors.gray100,
      borderWidth: 1,
      borderColor: colors.border,
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
    sourceBadgeTextDatabase: {
      color: colors.textSecondary,
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
