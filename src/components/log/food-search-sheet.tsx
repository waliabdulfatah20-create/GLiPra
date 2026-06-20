// FoodSearchSheet — search the seeded pharmacist-curated foods table (Cascade D).
// Zero AI cost: a local Supabase query over ~200 verified GLP-1-friendly foods.
//
// Two modes:
//   'log'    — tap a result -> preview card -> "Log it" inserts a food_logs row
//              with source 'database' (used from the Log screen entry row).
//   'select' — tap a result -> preview card -> "Use this food" calls onSelect
//              and inserts nothing (used by the AI review sheet "Wrong food?" flow).
//
// Always free — never gated by subscription (CLAUDE.md).

import type { SeededFood } from '@/features/food-log/food-search';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  FlatList,
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
import { seededFoodDisplayName, seededFoodToLogEntry } from '@/features/food-log/food-search';
import { useInsertDatabaseFoodLog, useSearchFoods } from '@/features/food-log/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

const DEBOUNCE_MS = 300;

export type FoodSearchSheetProps = {
  visible: boolean;
  mode: 'log' | 'select';
  onClose: () => void;
  /** Required in 'select' mode — receives the chosen food, no insert happens. */
  onSelect?: (food: SeededFood) => void;
};

export function FoodSearchSheet({ visible, mode, onClose, onSelect }: FoodSearchSheetProps) {
  const { t, i18n } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const [query, setQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selected, setSelected] = React.useState<SeededFood | null>(null);

  // Gate on `visible` so a closed sheet's cached results can't flash on reopen
  // (an empty query disables the hook via its own length guard).
  const { results, isLoading } = useSearchFoods(visible ? debouncedQuery : '');
  const { mutate: insertDatabaseLog, isLoading: isLogging } = useInsertDatabaseFoodLog();

  // Reset each time the sheet opens.
  React.useEffect(() => {
    if (visible) {
      setQuery('');
      setDebouncedQuery('');
      setSelected(null);
    }
  }, [visible]);

  // Debounce the query so we fire one request per pause, not per keystroke.
  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const locale = i18n.language;

  function handleConfirm() {
    if (!selected || isLogging)
      return;
    if (mode === 'select') {
      // Only act when a handler exists; otherwise close cleanly (no pretense).
      if (onSelect) {
        haptics.medium();
        onSelect(selected);
      }
      onClose();
      return;
    }
    haptics.success();
    insertDatabaseLog(seededFoodToLogEntry(selected, locale));
    onClose();
  }

  const showMinCharsHint = debouncedQuery.trim().length < 2;
  const showNoResults = !showMinCharsHint && !isLoading && results.length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close search" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoider}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('log.search_modal_title')}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')}>
              <Text style={styles.closeText}>{t('common.close')}</Text>
            </Pressable>
          </View>

          {selected === null
            ? (
                <>
                  {/* Search input */}
                  <TextInput
                    style={styles.input}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('log.search_placeholder')}
                    placeholderTextColor={colors.textDisabled}
                    autoFocus
                    autoCorrect={false}
                    returnKeyType="search"
                    accessibilityLabel={t('log.search_placeholder')}
                  />

                  {showMinCharsHint && (
                    <Text style={styles.hintText}>{t('log.search_min_chars')}</Text>
                  )}
                  {isLoading && !showMinCharsHint && (
                    <ActivityIndicator color={colors.primary} style={styles.spinner} />
                  )}
                  {showNoResults && (
                    <Text style={styles.hintText}>{t('log.search_no_results')}</Text>
                  )}

                  <FlatList
                    data={results}
                    keyExtractor={item => item.id}
                    keyboardShouldPersistTaps="handled"
                    style={styles.list}
                    renderItem={({ item }) => (
                      <Pressable
                        style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}
                        onPress={() => { haptics.selection(); setSelected(item); }}
                        accessibilityRole="button"
                        accessibilityLabel={seededFoodDisplayName(item, locale)}
                      >
                        <View style={styles.resultTextBlock}>
                          <Text style={styles.resultName} numberOfLines={1}>
                            {seededFoodDisplayName(item, locale)}
                          </Text>
                          <Text style={styles.resultMeta} numberOfLines={1}>
                            {item.brand ? `${item.brand} · ${item.servingDescription}` : item.servingDescription}
                          </Text>
                        </View>
                        <Text style={styles.resultProtein}>
                          {`${Math.round(item.proteinG)}g`}
                        </Text>
                      </Pressable>
                    )}
                  />
                </>
              )
            : (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {/* Back to results */}
                  <Pressable
                    onPress={() => setSelected(null)}
                    accessibilityRole="button"
                    accessibilityLabel={t('log.search_back')}
                  >
                    <Text style={styles.backText}>{`‹ ${t('log.search_back')}`}</Text>
                  </Pressable>

                  {/* Preview card */}
                  <View style={styles.previewCard}>
                    <Text style={styles.previewName}>{seededFoodDisplayName(selected, locale)}</Text>
                    {selected.brand !== null && (
                      <Text style={styles.previewBrand}>{selected.brand}</Text>
                    )}
                    <Text style={styles.previewServing}>{selected.servingDescription}</Text>

                    <View style={styles.curatedChip}>
                      <Text style={styles.curatedChipText}>{t('log.search_curated_badge')}</Text>
                    </View>

                    {/* Macro grid */}
                    <View style={styles.macroGrid}>
                      <MacroCell label={t('log.search_macro_protein')} value={`${selected.proteinG}g`} highlight styles={styles} />
                      {selected.carbsG !== null && (
                        <MacroCell label={t('log.search_macro_carbs')} value={`${selected.carbsG}g`} styles={styles} />
                      )}
                      {selected.fatG !== null && (
                        <MacroCell label={t('log.search_macro_fat')} value={`${selected.fatG}g`} styles={styles} />
                      )}
                      {selected.fiberG !== null && (
                        <MacroCell label={t('log.search_macro_fiber')} value={`${selected.fiberG}g`} styles={styles} />
                      )}
                      {selected.caloriesKcal !== null && (
                        <MacroCell label={t('log.search_macro_calories')} value={`${Math.round(selected.caloriesKcal)}`} styles={styles} />
                      )}
                    </View>

                    {/* GLP-1 Watch micros (only when present) */}
                    {(selected.b12Mcg !== null || selected.vitaminDIu !== null
                      || selected.magnesiumMg !== null || selected.zincMg !== null
                      || selected.ironMg !== null || selected.calciumMg !== null) && (
                      <View style={styles.microGrid}>
                        {selected.b12Mcg !== null && (
                          <MacroCell label={t('log.nutrient_b12')} value={`${selected.b12Mcg} mcg`} styles={styles} micro />
                        )}
                        {selected.vitaminDIu !== null && (
                          <MacroCell label={t('log.nutrient_vitd')} value={`${Math.round(selected.vitaminDIu)} IU`} styles={styles} micro />
                        )}
                        {selected.magnesiumMg !== null && (
                          <MacroCell label={t('log.nutrient_magnesium')} value={`${Math.round(selected.magnesiumMg)} mg`} styles={styles} micro />
                        )}
                        {selected.zincMg !== null && (
                          <MacroCell label={t('log.nutrient_zinc')} value={`${selected.zincMg} mg`} styles={styles} micro />
                        )}
                        {selected.ironMg !== null && (
                          <MacroCell label={t('log.nutrient_iron')} value={`${selected.ironMg} mg`} styles={styles} micro />
                        )}
                        {selected.calciumMg !== null && (
                          <MacroCell label={t('log.nutrient_calcium')} value={`${Math.round(selected.calciumMg)} mg`} styles={styles} micro />
                        )}
                      </View>
                    )}
                  </View>

                  {/* CTA */}
                  <Pressable
                    style={[styles.ctaButton, isLogging && styles.ctaButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={isLogging}
                    accessibilityRole="button"
                    accessibilityLabel={mode === 'log' ? t('log.search_log_button') : t('log.search_use_button')}
                  >
                    <Text style={styles.ctaButtonText}>
                      {mode === 'log' ? t('log.search_log_button') : t('log.search_use_button')}
                    </Text>
                  </Pressable>
                </ScrollView>
              )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type MacroCellProps = {
  label: string;
  value: string;
  highlight?: boolean;
  micro?: boolean;
  styles: ReturnType<typeof makeStyles>;
};

function MacroCell({ label, value, highlight = false, micro = false, styles }: MacroCellProps) {
  return (
    <View style={[styles.macroCell, micro && styles.macroCellMicro]}>
      <Text style={styles.macroCellLabel}>{label}</Text>
      <Text style={[styles.macroCellValue, highlight && styles.macroCellValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    avoider: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      maxHeight: '85%',
      minHeight: '60%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.gray300,
      alignSelf: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    hintText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    spinner: {
      marginTop: spacing.md,
    },
    list: {
      flexGrow: 0,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    resultRowPressed: {
      backgroundColor: colors.primaryLight,
    },
    resultTextBlock: {
      flex: 1,
      gap: 1,
    },
    resultName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    resultMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    resultProtein: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },
    backText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    previewName: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    previewBrand: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 1,
    },
    previewServing: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: spacing.sm,
    },
    curatedChip: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      marginBottom: spacing.md,
    },
    curatedChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    macroGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    microGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    macroCell: {
      backgroundColor: colors.gray50,
      borderRadius: radius.md,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      minWidth: 72,
    },
    macroCellMicro: {
      minWidth: 88,
    },
    macroCellLabel: {
      fontSize: 9,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: colors.textSecondary,
    },
    macroCellValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 1,
    },
    macroCellValueHighlight: {
      color: colors.primary,
    },
    ctaButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    ctaButtonDisabled: {
      backgroundColor: colors.gray200,
    },
    ctaButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.white,
    },
  });
}
