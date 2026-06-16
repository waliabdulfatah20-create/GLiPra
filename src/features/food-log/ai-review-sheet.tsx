// AIReviewSheet — slides up after AI food recognition (photo or voice).
// Displays all identified nutrients as editable fields so users can correct
// the AI output before confirming.
//
// Learning behaviour:
//   - If the user changes the food name → a FoodCorrection is saved so future
//     AI scans of similar foods benefit from the context.
//   - On every confirm → the confirmed values are upserted as personal defaults,
//     so repeat scans of the same food pre-fill with the saved values.

import type { SeededFood } from './food-search';
import type { RecognitionResult } from './photo-recognition';
import type { MacroBase, PortionMultiplier as PortionMultiplierValue } from './portion-multiplier-helpers';
import type { PhotoFoodEntry } from './types';
import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FoodSearchSheet } from '@/components/log/food-search-sheet';
import { PhotoCommentSheet } from '@/components/log/photo-comment-sheet';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useTheme } from '@/lib/ThemeContext';
import { seededFoodToFormPatch, seededFoodToLogEntry } from './food-search';
import { useConfirmPhotoLog, useUserFoodDefault } from './hooks';
import { shouldShowLowConfidenceNudge } from './low-confidence-nudge';
import { bucketToPercent } from './photo-recognition';
import { PortionMultiplier } from './portion-multiplier';
import {
  deriveFieldBase,

  scaleMacros,
} from './portion-multiplier-helpers';
import { ProInsightCard } from './pro-insight-card';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AIReviewSheetProps = {
  result: RecognitionResult | null;
  onClose: () => void;
  /** Populated on voice entries — the Whisper transcript spoken by the user. */
  transcript?: string;
  /**
   * Photo entries only — re-runs recognition on the same photo. Tapping the
   * Rescan link opens a comment sheet so the user can add a hint first; the
   * (possibly empty) hint is handed back here.
   */
  onRescan?: (comment?: string) => void;
  /** Pre-fills the rescan comment sheet with the hint from the original scan. */
  rescanInitialComment?: string;
};

// ---------------------------------------------------------------------------
// Editable form state (all macro fields stored as strings for TextInput)
// ---------------------------------------------------------------------------

type FormState = {
  name: string;
  servingDescription: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  caloriesKcal: string;
  b12Mcg: string;
  vitaminDIu: string;
  magnesiumMg: string;
  zincMg: string;
  ironMg: string;
};

function resultToForm(r: RecognitionResult): FormState {
  return {
    name: r.name,
    servingDescription: r.servingDescription,
    proteinG: r.proteinG.toFixed(1),
    carbsG: r.carbsG != null ? r.carbsG.toFixed(1) : '',
    fatG: r.fatG != null ? r.fatG.toFixed(1) : '',
    fiberG: r.fiberG != null ? r.fiberG.toFixed(1) : '',
    caloriesKcal: r.caloriesKcal != null ? Math.round(r.caloriesKcal).toString() : '',
    b12Mcg: r.b12Mcg != null ? r.b12Mcg.toFixed(1) : '',
    vitaminDIu: r.vitaminDIu != null ? Math.round(r.vitaminDIu).toString() : '',
    magnesiumMg: r.magnesiumMg != null ? Math.round(r.magnesiumMg).toString() : '',
    zincMg: r.zincMg != null ? r.zincMg.toFixed(1) : '',
    ironMg: r.ironMg != null ? r.ironMg.toFixed(1) : '',
  };
}

function defaultsToForm(d: PhotoFoodEntry): FormState {
  return {
    name: d.name,
    servingDescription: d.servingDescription,
    proteinG: d.proteinG.toFixed(1),
    carbsG: d.carbsG != null ? d.carbsG.toFixed(1) : '',
    fatG: d.fatG != null ? d.fatG.toFixed(1) : '',
    fiberG: d.fiberG != null ? d.fiberG.toFixed(1) : '',
    caloriesKcal: d.caloriesKcal != null ? Math.round(d.caloriesKcal).toString() : '',
    b12Mcg: d.b12Mcg != null ? d.b12Mcg.toFixed(1) : '',
    vitaminDIu: d.vitaminDIu != null ? Math.round(d.vitaminDIu).toString() : '',
    magnesiumMg: d.magnesiumMg != null ? Math.round(d.magnesiumMg).toString() : '',
    zincMg: d.zincMg != null ? d.zincMg.toFixed(1) : '',
    ironMg: d.ironMg != null ? d.ironMg.toFixed(1) : '',
  };
}

/**
 * Snapshot the numeric macro fields off either source so the portion
 * multiplier has a stable base to scale from.
 */
function extractMacroBase(src: RecognitionResult | (PhotoFoodEntry & { name: string })): MacroBase {
  return {
    proteinG: src.proteinG,
    carbsG: src.carbsG,
    fatG: src.fatG,
    fiberG: src.fiberG,
    caloriesKcal: src.caloriesKcal,
    b12Mcg: src.b12Mcg,
    vitaminDIu: src.vitaminDIu,
    magnesiumMg: src.magnesiumMg,
    zincMg: src.zincMg,
    ironMg: src.ironMg,
  };
}

function parseEntry(form: FormState): PhotoFoodEntry {
  return {
    name: form.name.trim(),
    servingDescription: form.servingDescription.trim(),
    proteinG: Math.max(0, Number.parseFloat(form.proteinG) || 0),
    carbsG: form.carbsG !== '' ? Math.max(0, Number.parseFloat(form.carbsG) || 0) : null,
    fatG: form.fatG !== '' ? Math.max(0, Number.parseFloat(form.fatG) || 0) : null,
    fiberG: form.fiberG !== '' ? Math.max(0, Number.parseFloat(form.fiberG) || 0) : null,
    caloriesKcal:
      form.caloriesKcal !== '' ? Math.max(0, Number.parseFloat(form.caloriesKcal) || 0) : null,
    b12Mcg: form.b12Mcg !== '' ? Math.max(0, Number.parseFloat(form.b12Mcg) || 0) : null,
    vitaminDIu: form.vitaminDIu !== '' ? Math.max(0, Number.parseFloat(form.vitaminDIu) || 0) : null,
    magnesiumMg: form.magnesiumMg !== '' ? Math.max(0, Number.parseFloat(form.magnesiumMg) || 0) : null,
    zincMg: form.zincMg !== '' ? Math.max(0, Number.parseFloat(form.zincMg) || 0) : null,
    ironMg: form.ironMg !== '' ? Math.max(0, Number.parseFloat(form.ironMg) || 0) : null,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIReviewSheet({ result, onClose, transcript, onRescan, rescanInitialComment }: AIReviewSheetProps) {
  const { t, i18n } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Track the original AI name separately — used to detect corrections
  const originalAiName = React.useRef<string>('');
  const [form, setForm] = React.useState<FormState | null>(null);

  // Portion multiplier — scales the AI's macro estimate. `aiBase` is the
  // current 1× snapshot; the form's numeric fields are always rendered as
  // `aiBase × multiplier`. Manual edits to a field re-derive that field's
  // base via `deriveFieldBase()` so subsequent multiplier moves scale from
  // the user's correction.
  const [aiBase, setAiBase] = React.useState<MacroBase | null>(null);
  const [multiplier, setMultiplier] = React.useState<PortionMultiplierValue>(1);

  // Look up personal defaults for this food name (pre-fills on repeat scans)
  const { defaults } = useUserFoodDefault(result?.name ?? '');
  const { confirm, isLoading: confirming } = useConfirmPhotoLog();

  // Tracks which recognition result the form was initialized for, and whether
  // the user has started editing — so the personal-defaults query (which
  // resolves asynchronously AFTER the result arrives) can prefill saved portions
  // on a repeat scan, but can NEVER overwrite in-progress corrections.
  const appliedForResultRef = React.useRef<RecognitionResult | null>(null);
  const userEditedRef = React.useRef(false);

  // "Wrong food?" seeded-database search (Cascade D). Picking a food patches
  // the form fields; the normal confirm flow then proceeds unchanged, so the
  // original AI name still drives correction-learning.
  const [searchVisible, setSearchVisible] = React.useState(false);

  // "Rescan photo" hint sheet — photo entries only (gated on onRescan).
  const [rescanVisible, setRescanVisible] = React.useState(false);

  const applyFood = React.useCallback((food: SeededFood) => {
    // Block the late-resolving personal-defaults effect from clobbering the patch.
    userEditedRef.current = true;
    const entry = seededFoodToLogEntry(food, i18n.language);
    setForm(prev => (prev ? { ...prev, ...seededFoodToFormPatch(food, i18n.language) } : prev));
    // Rebase the portion multiplier on the seeded food's values at 1x.
    setAiBase(extractMacroBase(entry));
    setMultiplier(1);
  }, [i18n.language]);

  // Initialize form when a new recognition result arrives. Re-running when
  // `defaults` resolves later is allowed only if the user hasn't edited yet.
  React.useEffect(() => {
    if (!result) {
      setForm(null);
      setAiBase(null);
      setMultiplier(1);
      appliedForResultRef.current = null;
      userEditedRef.current = false;
      return;
    }
    const isNewResult = appliedForResultRef.current !== result;
    if (!isNewResult && userEditedRef.current)
      return; // defaults arrived after the user started editing — do not clobber
    originalAiName.current = result.name;
    // If we have saved personal defaults for this food, use them
    // (they represent the user's preferred portions, not the AI guess)
    const source = defaults ? { ...defaults, name: result.name } : result;
    setForm(defaults ? defaultsToForm({ ...defaults, name: result.name }) : resultToForm(result));
    setAiBase(extractMacroBase(source));
    setMultiplier(1);
    appliedForResultRef.current = result;
    if (isNewResult)
      userEditedRef.current = false;
  }, [result, defaults]);

  // Numeric macro fields — manual edits to these re-derive aiBase.
  const NUMERIC_FIELDS = React.useMemo(
    () => new Set<keyof FormState>([
      'proteinG',
      'carbsG',
      'fatG',
      'fiberG',
      'caloriesKcal',
      'b12Mcg',
      'vitaminDIu',
      'magnesiumMg',
      'zincMg',
      'ironMg',
    ]),
    [],
  );

  function handleField(field: keyof FormState, value: string) {
    userEditedRef.current = true; // lock out late-arriving defaults from clobbering edits
    setForm(prev => (prev ? { ...prev, [field]: value } : prev));
    if (NUMERIC_FIELDS.has(field)) {
      // Re-derive this field's base so subsequent multiplier moves scale
      // around the user's correction, not the AI's original.
      const newBase = deriveFieldBase(value, multiplier);
      setAiBase((prev) => {
        if (!prev)
          return prev;
        // proteinG is required (number, not nullable). If the user clears it,
        // treat it as 0 in the base rather than null to keep the type honest.
        if (field === 'proteinG')
          return { ...prev, proteinG: newBase ?? 0 };
        return { ...prev, [field]: newBase } as MacroBase;
      });
    }
  }

  function handleMultiplierChange(next: PortionMultiplierValue) {
    if (!aiBase || !form)
      return;
    userEditedRef.current = true; // a portion change is a user edit too
    setMultiplier(next);
    const scaled = scaleMacros(aiBase, next);
    setForm(prev => (prev ? { ...prev, ...scaled } : prev));
  }

  async function handleConfirm() {
    if (!form || confirming)
      return;
    const entry = parseEntry(form);
    if (!entry.name)
      return;
    confirm(entry, originalAiName.current);
    onClose();
  }

  // Prefer the new numeric percent from the edge function; fall back to
  // bucket-derived percent if the response predates the schema change.
  const confidencePercent
    = result?.confidencePercent
      ?? (result ? bucketToPercent(result.confidence) : 0);

  // Bucket thresholds keep the chip-color hierarchy stable across the
  // bucket-vs-percent transition. Same green/amber/red the chip used before.
  const confidenceColor
    = confidencePercent >= 80
      ? colors.proteinGood
      : confidencePercent >= 50
        ? colors.warning
        : colors.proteinLow;

  // Leading "~" signals AI self-report, not a calibrated probability.
  const confidenceLabel = `~${confidencePercent}%`;

  // Below the threshold, actively nudge the user to verify the two fields that
  // most affect their protein-floor tracking (protein + serving). Microcopy
  // only, not clinical — see low-confidence-nudge.ts.
  const showNudge = shouldShowLowConfidenceNudge(confidencePercent);

  const hasMicroData
    = form
      && (form.b12Mcg !== '' || form.vitaminDIu !== '' || form.magnesiumMg !== '' || form.zincMg !== '' || form.ironMg !== '');

  if (!result || !form)
    return null;

  return (
    <Modal
      visible={!!result}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close review sheet"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>AI identified</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {confidenceLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            Edit any field before logging. Corrections improve future scans.
          </Text>

          {/* Tier-2 disclaimer — Rule 8. AI macro estimates are not clinical
              advice; the user should verify and confirm with their prescriber. */}
          <DisclaimerBanner tier={2}>
            <Text style={styles.disclaimerText}>
              AI-generated estimate, not medical advice. Confirm with your prescriber.
            </Text>
          </DisclaimerBanner>

          {/* Low-confidence nudge — appears below ~55% to push the user to
              verify protein + serving before logging. Microcopy, not clinical. */}
          {showNudge && (
            <View
              style={styles.nudgeBanner}
              accessibilityRole="alert"
              accessibilityLabel={`${t('low_confidence.banner_title')}. ${t('low_confidence.banner_body')}`}
            >
              <Text style={styles.nudgeTitle}>{t('low_confidence.banner_title')}</Text>
              <Text style={styles.nudgeBody}>{t('low_confidence.banner_body')}</Text>
            </View>
          )}

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Transcript block — visible on voice entries only */}
            {transcript
              ? (
                  <View style={styles.transcriptBlock}>
                    <Text style={styles.transcriptLabel}>{t('log.voice_transcript_label')}</Text>
                    <Text style={styles.transcriptText}>
                      "
                      {transcript}
                      "
                    </Text>
                  </View>
                )
              : null}

            {/* Food name + serving */}
            <SectionHeader title="FOOD" />
            <FieldRow label="Food name" unit="">
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={v => handleField('name', v)}
                placeholder="Food name"
                placeholderTextColor={colors.textDisabled}
                returnKeyType="next"
                accessibilityLabel="Food name"
              />
            </FieldRow>
            <FieldRow label="Serving" unit="" flag={showNudge}>
              <TextInput
                style={styles.textInput}
                value={form.servingDescription}
                onChangeText={v => handleField('servingDescription', v)}
                placeholder="e.g. 1 cup, 150g"
                placeholderTextColor={colors.textDisabled}
                returnKeyType="next"
                accessibilityLabel="Serving description"
              />
            </FieldRow>

            {/* Wrong food? — search the seeded database and patch the form */}
            <Pressable
              onPress={() => setSearchVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('log.wrong_food_link')}
            >
              <Text style={styles.wrongFoodLink}>{t('log.wrong_food_link')}</Text>
            </Pressable>

            {/* Rescan photo — re-run the AI on the same photo with an optional
                new hint. Photo entries only (the voice instance passes no onRescan). */}
            {onRescan && (
              <Pressable
                onPress={() => setRescanVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={t('log.rescan_link')}
              >
                <Text style={styles.wrongFoodLink}>{t('log.rescan_link')}</Text>
              </Pressable>
            )}

            <PortionMultiplier
              value={multiplier}
              onChange={handleMultiplierChange}
              scaledKcal={form.caloriesKcal !== '' ? Number.parseFloat(form.caloriesKcal) || 0 : null}
              scaledProteinG={Number.parseFloat(form.proteinG) || 0}
            />

            {/* Macros */}
            <SectionHeader title="MACROS PER SERVING" />
            <View style={styles.macroGrid}>
              <MacroInput
                label="Protein"
                unit="g"
                value={form.proteinG}
                onChangeText={v => handleField('proteinG', v)}
                highlight
                flag={showNudge}
              />
              <MacroInput
                label="Carbs"
                unit="g"
                value={form.carbsG}
                onChangeText={v => handleField('carbsG', v)}
              />
              <MacroInput
                label="Fat"
                unit="g"
                value={form.fatG}
                onChangeText={v => handleField('fatG', v)}
              />
              <MacroInput
                label="Calories"
                unit="kcal"
                value={form.caloriesKcal}
                onChangeText={v => handleField('caloriesKcal', v)}
              />
              <MacroInput
                label="Fiber"
                unit="g"
                value={form.fiberG}
                onChangeText={v => handleField('fiberG', v)}
              />
            </View>

            {/* GLP-1 Watch — only shown when AI provided estimates */}
            {hasMicroData && (
              <>
                <View style={styles.glpHeader}>
                  <SectionHeader title="GLP-1 WATCH" />
                  <Text style={styles.glpNote}>AI estimates - verify for precision</Text>
                </View>
                <View style={styles.macroGrid}>
                  <MacroInput
                    label="B-12"
                    unit="mcg"
                    value={form.b12Mcg}
                    onChangeText={v => handleField('b12Mcg', v)}
                  />
                  <MacroInput
                    label="Vit D"
                    unit="IU"
                    value={form.vitaminDIu}
                    onChangeText={v => handleField('vitaminDIu', v)}
                  />
                  <MacroInput
                    label="Mg"
                    unit="mg"
                    value={form.magnesiumMg}
                    onChangeText={v => handleField('magnesiumMg', v)}
                  />
                  <MacroInput
                    label="Zinc"
                    unit="mg"
                    value={form.zincMg}
                    onChangeText={v => handleField('zincMg', v)}
                  />
                  <MacroInput
                    label="Iron"
                    unit="mg"
                    value={form.ironMg}
                    onChangeText={v => handleField('ironMg', v)}
                  />
                </View>
              </>
            )}

            <ProInsightCard mealProteinG={Number.parseFloat(form.proteinG) || 0} />

            <View style={styles.buttonRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.confirmButtonPressed,
                  confirming && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={confirming || !form.name.trim()}
                accessibilityRole="button"
                accessibilityLabel="Log this food"
              >
                <Text style={styles.confirmText}>
                  {confirming ? 'Logging…' : 'Log It'}
                </Text>
              </Pressable>
            </View>

            {/* Bottom padding for keyboard */}
            <View style={styles.bottomPad} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Wrong food? seeded-database search — nested inside this Modal's
          content tree so it stacks correctly on iOS. Select mode patches the
          form via applyFood; nothing is inserted from here. */}
      <FoodSearchSheet
        visible={searchVisible}
        mode="select"
        onClose={() => setSearchVisible(false)}
        onSelect={applyFood}
      />

      {/* Rescan hint sheet — nested inside this Modal's content tree so it
          stacks correctly on iOS (same pattern as FoodSearchSheet). Analyze
          hands the hint to onRescan; dismiss keeps the review form intact. */}
      {onRescan && (
        <PhotoCommentSheet
          visible={rescanVisible}
          initialComment={rescanInitialComment}
          onAnalyze={(comment) => {
            setRescanVisible(false);
            onRescan(comment);
          }}
          onDismiss={() => setRescanVisible(false)}
        />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  const { colors, spacing } = useTheme();
  return (
    <Text style={{
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    }}
    >
      {title}
    </Text>
  );
}

type FieldRowProps = {
  label: string;
  unit: string;
  children: React.ReactNode;
  /** When true, draw an amber bottom border to flag the field for review. */
  flag?: boolean;
};

function FieldRow({ label, children, flag = false }: FieldRowProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: flag ? 1.5 : 1,
      borderBottomColor: flag ? colors.warning : colors.border,
      gap: spacing.sm,
    }}
    >
      <Text style={{ fontSize: 14, color: colors.textSecondary, width: 80 }}>{label}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

type MacroInputProps = {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  highlight?: boolean;
  /** When true, override the border to amber to flag the field for review. */
  flag?: boolean;
};

function MacroInput({ label, unit, value, onChangeText, highlight = false, flag = false }: MacroInputProps) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={[
      {
        width: '30%',
        minWidth: 80,
        backgroundColor: colors.gray50,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.sm,
        alignItems: 'center',
      },
      highlight && { backgroundColor: colors.primaryLight, borderColor: `${colors.primary}60` },
      // Flag overrides only the border (amber ring), keeping any highlight bg/text.
      flag && { borderWidth: 1.5, borderColor: colors.warning },
    ]}
    >
      <TextInput
        style={[
          { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', padding: 0, width: '100%' },
          highlight && { color: colors.primary },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="-"
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel={`${label} in ${unit}`}
      />
      <Text style={[
        { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
        highlight && { color: colors.primary },
      ]}
      >
        {unit}
      </Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
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
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    keyboardAvoid: {
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      maxHeight: '92%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.gray300,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    confidenceBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    confidenceDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    confidenceText: {
      fontSize: 12,
      fontWeight: '600',
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    nudgeBanner: {
      backgroundColor: colors.warningLight,
      borderRadius: radius.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    nudgeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.warning,
      marginBottom: 2,
    },
    nudgeBody: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    scroll: {
      flexGrow: 0,
    },
    macroGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    wrongFoodLink: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 2,
      marginBottom: spacing.sm,
    },
    textInput: {
      fontSize: 15,
      color: colors.textPrimary,
      fontWeight: '500',
      padding: 0,
    },
    glpHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    glpNote: {
      fontSize: 11,
      color: colors.textDisabled,
      fontStyle: 'italic',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    cancelButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    confirmButton: {
      flex: 2,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      ...shadows.sm,
    },
    confirmButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
    confirmButtonDisabled: {
      backgroundColor: colors.gray300,
    },
    confirmText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },
    bottomPad: {
      height: spacing.xl,
    },
    // ── Voice transcript block ──────────────────────────────────────────────
    transcriptBlock: {
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    transcriptLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    transcriptText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontStyle: 'italic',
      lineHeight: 20,
    },
  });
}
