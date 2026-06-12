// SupplementQuickAddSheet
// A single-nutrient supplement quick-add. Opens from a tapped nutrient (the
// Micronutrient Watch card row or the Supplement logging-mode panel), takes one
// amount, and hands back a SupplementEntry. The app never suggests doses — the
// user enters the amount from their supplement label.

import type { SupplementNutrient } from '@/features/food-log/supplement';
import type { SupplementEntry } from '@/features/food-log/types';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { buildSupplementEntry } from '@/features/food-log/supplement';
import { useTheme } from '@/lib/ThemeContext';

type Props = {
  /** The nutrient being added. Null hides the sheet. */
  nutrient: SupplementNutrient | null;
  onAdd: (entry: SupplementEntry) => void;
  onClose: () => void;
};

export function SupplementQuickAddSheet({ nutrient, onAdd, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );
  const [amount, setAmount] = React.useState('');

  // Reset the amount whenever a new nutrient opens the sheet.
  React.useEffect(() => {
    if (nutrient)
      setAmount('');
  }, [nutrient]);

  const parsed = Number.parseFloat(amount);
  const isValid = Number.isFinite(parsed) && parsed > 0;

  function handleAdd() {
    if (!nutrient || !isValid)
      return;
    const entry = buildSupplementEntry(nutrient.key, parsed);
    if (entry)
      onAdd(entry);
  }

  return (
    <Modal
      visible={nutrient != null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {nutrient && (
            <>
              <Text style={styles.title}>
                {t('log.supplement_sheet_title', { nutrient: t(nutrient.labelKey) })}
              </Text>
              <Text style={styles.subtitle}>{t('log.supplement_label_hint')}</Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textDisabled}
                  autoFocus
                  accessibilityLabel={t('log.supplement_amount')}
                />
                <Text style={styles.unit}>{nutrient.unit}</Text>
              </View>

              <Pressable
                style={[styles.addButton, !isValid && styles.addButtonDisabled]}
                onPress={handleAdd}
                disabled={!isValid}
                accessibilityRole="button"
                accessibilityLabel={t('log.supplement_add')}
              >
                <Text style={styles.addText}>{t('log.supplement_add')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    keyboardAvoid: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      paddingTop: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 16,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    input: {
      flex: 1,
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      paddingVertical: spacing.md,
    },
    unit: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    addButtonDisabled: {
      backgroundColor: colors.gray300,
    },
    addText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.white,
    },
  });
}
