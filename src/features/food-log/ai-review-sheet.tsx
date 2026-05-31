// AIReviewSheet — slides up after AI food recognition (photo or voice).
// Displays all identified nutrients as editable fields so users can correct
// the AI output before confirming.
//
// Learning behaviour:
//   - If the user changes the food name → a FoodCorrection is saved so future
//     AI scans of similar foods benefit from the context.
//   - On every confirm → the confirmed values are upserted as personal defaults,
//     so repeat scans of the same food pre-fill with the saved values.

import type { RecognitionResult } from './photo-recognition';
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
import { useTheme } from '@/lib/ThemeContext';
import { useConfirmPhotoLog, useUserFoodDefault } from './hooks';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AIReviewSheetProps = {
  result: RecognitionResult | null;
  onClose: () => void;
  /** Populated on voice entries — the Whisper transcript spoken by the user. */
  transcript?: string;
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
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIReviewSheet({ result, onClose, transcript }: AIReviewSheetProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Track the original AI name separately — used to detect corrections
  const originalAiName = React.useRef<string>('');
  const [form, setForm] = React.useState<FormState | null>(null);

  // Look up personal defaults for this food name (pre-fills on repeat scans)
  const { defaults } = useUserFoodDefault(result?.name ?? '');
  const { confirm, isLoading: confirming } = useConfirmPhotoLog();

  // Initialize form when a new recognition result arrives
  React.useEffect(() => {
    if (!result) {
      setForm(null);
      return;
    }
    originalAiName.current = result.name;
    // If we have saved personal defaults for this food, use them
    // (they represent the user's preferred portions, not the AI guess)
    if (defaults) {
      setForm(defaultsToForm({ ...defaults, name: result.name }));
    }
    else {
      setForm(resultToForm(result));
    }
  }, [result, defaults]);

  function handleField(field: keyof FormState, value: string) {
    setForm(prev => (prev ? { ...prev, [field]: value } : prev));
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

  const confidenceColor
    = result?.confidence === 'high'
      ? colors.proteinGood
      : result?.confidence === 'medium'
        ? colors.warning
        : colors.proteinLow;

  const confidenceLabel
    = result?.confidence === 'high'
      ? 'High confidence'
      : result?.confidence === 'medium'
        ? 'Medium confidence'
        : 'Low confidence - please verify';

  const hasMicroData
    = form
      && (form.b12Mcg !== '' || form.vitaminDIu !== '' || form.magnesiumMg !== '' || form.zincMg !== '');

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
            <FieldRow label="Serving" unit="">
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

            {/* Macros */}
            <SectionHeader title="MACROS PER SERVING" />
            <View style={styles.macroGrid}>
              <MacroInput
                label="Protein"
                unit="g"
                value={form.proteinG}
                onChangeText={v => handleField('proteinG', v)}
                highlight
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
                </View>
              </>
            )}

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
};

function FieldRow({ label, children }: FieldRowProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
};

function MacroInput({ label, unit, value, onChangeText, highlight = false }: MacroInputProps) {
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
    scroll: {
      flexGrow: 0,
    },
    macroGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.xs,
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
