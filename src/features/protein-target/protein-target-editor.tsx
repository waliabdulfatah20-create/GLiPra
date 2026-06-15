// Protein-target editor — reachable from Settings > Body Metrics and by tapping
// the Today protein ring. Re-collects the body inputs, recomputes the protein
// floor live via the Rule-4 calculateProteinFloor (through previewProteinFloor),
// and persists weight/height/bmi/activity/kidney/protein_floor_g.
//
// Rule 5 + Rule 8: shows the Tier-1 inaccurate-inputs disclaimer (verbatim from
// onboarding) plus an acknowledgment that gates Save. Does NOT edit phase (that
// is driven by medication status via /update-status).

import type { GlipraTokens } from '@/theme/tokens';
import type { ActivityLevel } from '@/utils/protein';

import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { previewProteinFloor } from '@/features/protein-target/preview';
import { useTodayProfile } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import {
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
  useHeightUnit,
  useWeightUnit,
} from '@/lib/unit-preference';

const ACTIVITY_OPTIONS: { value: ActivityLevel; labelKey: string }[] = [
  { value: 'sedentary', labelKey: 'protein_target.activity_low' },
  { value: 'moderate', labelKey: 'protein_target.activity_moderate' },
  { value: 'active', labelKey: 'protein_target.activity_high' },
];

function parsePositive(value: string): number | null {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n) || n <= 0)
    return null;
  return n;
}

export function ProteinTargetEditor() {
  const { t } = useTranslation();
  const { data: profile } = useTodayProfile();
  const session = useAuthStore.use.session();
  const queryClient = useQueryClient();
  const { unit: weightUnit, toggle: toggleWeightUnit, loaded: weightLoaded } = useWeightUnit();
  const { unit: heightUnit, toggle: toggleHeightUnit, loaded: heightLoaded } = useHeightUnit();
  const isMetricHeight = heightUnit === 'metric';

  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const [weightText, setWeightText] = React.useState('');
  const [heightCmText, setHeightCmText] = React.useState('');
  const [ftText, setFtText] = React.useState('');
  const [inText, setInText] = React.useState('');
  const [activityLevel, setActivityLevel] = React.useState<ActivityLevel | null>(null);
  const [hasKidneyDisease, setHasKidneyDisease] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  // Seed once from the profile, but only after the persisted unit preferences
  // have loaded — otherwise we would seed in the default unit and then mismatch
  // when the real preference resolves a tick later (corrupting the saved weight
  // for kg users / blanking height for metric users).
  React.useEffect(() => {
    if (hydrated || !profile || !weightLoaded || !heightLoaded)
      return;
    if (profile.weightKg != null) {
      setWeightText(String(weightUnit === 'lbs' ? kgToLbs(profile.weightKg) : profile.weightKg));
    }
    if (profile.heightCm != null) {
      if (isMetricHeight) {
        setHeightCmText(String(profile.heightCm));
      }
      else {
        const { ft, inches } = cmToFtIn(profile.heightCm);
        setFtText(String(ft));
        setInText(String(inches));
      }
    }
    setActivityLevel(profile.activityLevel ?? 'moderate');
    setHasKidneyDisease(profile.hasKidneyDisease);
    setHydrated(true);
  }, [hydrated, profile, weightLoaded, heightLoaded, weightUnit, isMetricHeight]);

  // Unit toggles convert the typed value so a flip never silently changes the
  // number's meaning (protein is safety-critical — no garbage inputs).
  function handleToggleWeight() {
    const raw = parsePositive(weightText);
    if (raw != null)
      setWeightText(String(weightUnit === 'lbs' ? lbsToKg(raw) : kgToLbs(raw)));
    toggleWeightUnit();
  }

  function handleToggleHeight() {
    if (isMetricHeight) {
      const cm = parsePositive(heightCmText);
      if (cm != null) {
        const { ft, inches } = cmToFtIn(cm);
        setFtText(String(ft));
        setInText(String(inches));
      }
    }
    else {
      const ft = parsePositive(ftText);
      const inches = inText === '' ? 0 : (parsePositive(inText) ?? 0);
      if (ft != null)
        setHeightCmText(String(ftInToCm(ft, inches)));
    }
    toggleHeightUnit();
  }

  // Canonical metric values for the calculator.
  const weightRaw = parsePositive(weightText);
  const weightKg
    = weightRaw == null ? null : weightUnit === 'lbs' ? lbsToKg(weightRaw) : weightRaw;

  let heightCm: number | null = null;
  if (isMetricHeight) {
    heightCm = parsePositive(heightCmText);
  }
  else {
    const ft = parsePositive(ftText);
    const inches = inText === '' ? 0 : (parsePositive(inText) ?? 0);
    heightCm = ft == null ? null : ftInToCm(ft, inches);
  }

  // All active statuses use the weight-loss phase (maintenance phase removed).
  const result = previewProteinFloor({
    weightKg,
    heightCm,
    activityLevel,
    hasKidneyDisease,
    phase: 'weight_loss',
  });

  const canSave = acknowledged && result !== null && !isSaving && !!session?.user.id;

  async function handleSave() {
    if (!result || !session?.user.id || weightKg == null || heightCm == null || activityLevel == null)
      return;
    haptics.medium();
    setIsSaving(true);

    const heightM = heightCm / 100;
    const bmi = Number.parseFloat((weightKg / (heightM * heightM)).toFixed(1));

    await supabase
      .from('profiles')
      .update({
        weight_kg: weightKg,
        height_cm: heightCm,
        bmi,
        activity_level: activityLevel,
        has_kidney_disease: hasKidneyDisease,
        protein_floor_g: result.proteinFloorG,
      })
      .eq('user_id', session.user.id);

    await queryClient.invalidateQueries({ queryKey: ['today-profile'] });
    setIsSaving(false);
    router.back();
  }

  const currentFloor = profile?.proteinFloorG;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>{t('protein_target.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          testID="protein-target-editor"
        >
          {currentFloor != null && currentFloor > 0 && (
            <Text style={styles.currentValue}>
              {`${t('protein_target.current')}: ${Math.round(currentFloor)}g`}
            </Text>
          )}

          {/* Weight */}
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>{t('protein_target.weight_label')}</Text>
            <UnitToggle options={['lbs', 'kg']} active={weightUnit} onToggle={handleToggleWeight} />
          </View>
          <TextInput
            style={styles.input}
            value={weightText}
            onChangeText={setWeightText}
            placeholder={weightUnit === 'lbs' ? 'e.g. 182' : 'e.g. 82.5'}
            placeholderTextColor={colors.textDisabled}
            keyboardType="decimal-pad"
            accessibilityLabel={`Weight in ${weightUnit}`}
            testID="weight-input"
          />

          {/* Height */}
          <View style={[styles.labelRow, styles.labelRowTop]}>
            <Text style={styles.fieldLabel}>{t('protein_target.height_label')}</Text>
            <UnitToggle
              options={['ft · in', 'cm']}
              active={isMetricHeight ? 'cm' : 'ft · in'}
              onToggle={handleToggleHeight}
            />
          </View>
          {isMetricHeight
            ? (
                <TextInput
                  style={styles.input}
                  value={heightCmText}
                  onChangeText={setHeightCmText}
                  placeholder="e.g. 170"
                  placeholderTextColor={colors.textDisabled}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Height in centimeters"
                  testID="height-input"
                />
              )
            : (
                <View style={styles.imperialRow}>
                  <View style={styles.imperialGroup}>
                    <TextInput
                      style={[styles.input, styles.imperialInput]}
                      value={ftText}
                      onChangeText={setFtText}
                      placeholder="5"
                      placeholderTextColor={colors.textDisabled}
                      keyboardType="number-pad"
                      accessibilityLabel="Feet"
                    />
                    <Text style={styles.imperialUnit}>ft</Text>
                  </View>
                  <View style={styles.imperialGroup}>
                    <TextInput
                      style={[styles.input, styles.imperialInput]}
                      value={inText}
                      onChangeText={(v) => {
                        const n = Number.parseInt(v, 10);
                        if (v === '' || (n >= 0 && n <= 11))
                          setInText(v);
                      }}
                      placeholder="9"
                      placeholderTextColor={colors.textDisabled}
                      keyboardType="number-pad"
                      accessibilityLabel="Inches"
                    />
                    <Text style={styles.imperialUnit}>in</Text>
                  </View>
                </View>
              )}

          {/* Activity level */}
          <Text style={[styles.fieldLabel, styles.labelRowTop]}>{t('protein_target.activity_label')}</Text>
          <View style={styles.activityRow}>
            {ACTIVITY_OPTIONS.map((opt) => {
              const isSelected = activityLevel === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                  onPress={() => { haptics.selection(); setActivityLevel(opt.value); }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={t(opt.labelKey)}
                >
                  <Text style={[styles.activityLabel, isSelected && styles.activityLabelSelected]}>
                    {t(opt.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Kidney toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('protein_target.kidney_label')}</Text>
            <Switch
              value={hasKidneyDisease}
              onValueChange={setHasKidneyDisease}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              accessibilityLabel={t('protein_target.kidney_label')}
            />
          </View>

          {/* Live result */}
          {result !== null
            ? (
                <View style={styles.resultCard}>
                  <Text style={styles.resultNumber} testID="protein-floor-result">
                    {`${result.proteinFloorG}g`}
                  </Text>
                  <Text style={styles.resultLabel}>{t('protein_target.result_label')}</Text>
                  {(result.usedIdealBodyWeight || result.cappedByKidneyDisease) && (
                    <View style={styles.badgeRow}>
                      {result.usedIdealBodyWeight && (
                        <View style={styles.badge}><Text style={styles.badgeText}>{t('protein_target.badge_bmi')}</Text></View>
                      )}
                      {result.cappedByKidneyDisease && (
                        <View style={styles.badge}><Text style={styles.badgeText}>{t('protein_target.badge_kidney')}</Text></View>
                      )}
                    </View>
                  )}
                </View>
              )
            : (
                <Text style={styles.resultHint}>{t('protein_target.result_hint')}</Text>
              )}

          {/* Tier-1 disclaimer (Rule 5 + Rule 8) */}
          <DisclaimerBanner tier={1}>
            <Text style={styles.disclaimerText}>{t('protein_target.disclaimer')}</Text>
          </DisclaimerBanner>

          {/* Acknowledgment */}
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAcknowledged(prev => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
            accessibilityLabel={t('protein_target.acknowledge')}
            testID="acknowledge-checkbox"
          >
            <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
              {acknowledged && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>{t('protein_target.acknowledge')}</Text>
          </Pressable>

          {/* Save */}
          <Pressable
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel={t('protein_target.save')}
            testID="save-button"
          >
            <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
              {isSaving ? t('protein_target.saving') : t('protein_target.save')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backText: { fontSize: 16, color: colors.primary, fontWeight: '500', minWidth: 60 },
    title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 },
    headerSpacer: { minWidth: 60 },
    body: { padding: spacing.lg, paddingBottom: spacing.xxl },
    currentValue: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    labelRowTop: { marginTop: spacing.lg },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
    },
    imperialRow: { flexDirection: 'row', gap: spacing.sm },
    imperialGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    imperialInput: { flex: 1 },
    imperialUnit: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, minWidth: 18 },
    activityRow: { flexDirection: 'row', gap: spacing.sm },
    activityCard: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    activityCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    activityLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    activityLabelSelected: { color: colors.primary },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
    toggleLabel: { fontSize: 15, color: colors.textPrimary, flex: 1, marginRight: spacing.md },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginTop: spacing.lg,
      alignItems: 'center',
    },
    resultNumber: { fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
    resultLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    badge: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    badgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    resultHint: {
      fontSize: 13,
      color: colors.textDisabled,
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    disclaimerText: { fontSize: 14, color: colors.disclaimerText, lineHeight: 20 },
    checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.md, gap: spacing.sm },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 1,
    },
    checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
    checkmark: { color: colors.white, fontSize: 13, fontWeight: '700', lineHeight: 16 },
    checkboxLabel: { flex: 1, fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    saveButtonDisabled: { backgroundColor: colors.gray200 },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: colors.white },
    saveButtonTextDisabled: { color: colors.textDisabled },
  });
}
