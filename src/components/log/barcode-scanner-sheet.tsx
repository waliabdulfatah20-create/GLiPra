import { CameraView, useCameraPermissions } from 'expo-camera';
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { lookupBarcode } from '@/features/food-log/barcode-lookup';
import type { BarcodeProduct } from '@/features/food-log/barcode-lookup';
import {
  useBarcodeCorrectionLookup,
  useSaveBarcodeCorrection,
} from '@/features/food-log/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

// Barcode scanning is ALWAYS free — never gated by subscription (CLAUDE.md).

// Brand tokens — not in GlipraTokens so kept as module constants
const BRAND = '#5b21b6';
const BRAND_LIGHT = 'rgba(91,33,182,0.08)';
const AMBER = '#d97706';
const AMBER_LIGHT = 'rgba(217,119,6,0.10)';
const MICRO_BG = 'rgba(217,119,6,0.06)';

export interface BarcodeScannerSheetProps {
  visible: boolean;
  onClose: () => void;
  onProductFound: (product: BarcodeProduct) => void;
}

type ScanState = 'scanning' | 'loading' | 'result' | 'not_found';

const SOURCE_LABEL: Record<BarcodeProduct['dataSource'], string> = {
  open_food_facts: 'Open Food Facts',
  usda: 'USDA FoodData Central',
  user_corrected: 'Your verified data',
};

export function BarcodeScannerSheet({
  visible,
  onClose,
  onProductFound,
}: BarcodeScannerSheetProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [scanState, setScanState] = React.useState<ScanState>('scanning');
  const [product, setProduct] = React.useState<BarcodeProduct | null>(null);
  const [scannedEan, setScannedEan] = React.useState<string | null>(null);
  const scannedRef = React.useRef(false);

  // Editable macro fields
  const [editedProtein, setEditedProtein] = React.useState('');
  const [editedCarbs, setEditedCarbs] = React.useState('');
  const [editedFat, setEditedFat] = React.useState('');
  const [editedFiber, setEditedFiber] = React.useState('');
  const [editedCalories, setEditedCalories] = React.useState('');
  // Editable GLP-1 Watch fields
  const [editedMagnesium, setEditedMagnesium] = React.useState('');
  const [editedZinc, setEditedZinc] = React.useState('');
  const [editedB12, setEditedB12] = React.useState('');
  const [editedVitD, setEditedVitD] = React.useState('');

  // Correction memory hooks
  const { correction, isLoading: correctionLoading } = useBarcodeCorrectionLookup(
    scanState === 'result' ? scannedEan : null,
  );
  const { mutate: saveCorrection } = useSaveBarcodeCorrection();

  const resetFields = React.useCallback(() => {
    setEditedProtein('');
    setEditedCarbs('');
    setEditedFat('');
    setEditedFiber('');
    setEditedCalories('');
    setEditedMagnesium('');
    setEditedZinc('');
    setEditedB12('');
    setEditedVitD('');
  }, []);

  // Reset state each time the sheet opens
  React.useEffect(() => {
    if (visible) {
      setScanState('scanning');
      setProduct(null);
      setScannedEan(null);
      resetFields();
      scannedRef.current = false;
    }
  }, [visible, resetFields]);

  // When correction loads (or product arrives), pre-fill edit fields
  React.useEffect(() => {
    if (scanState !== 'result') return;
    const source = correction ?? product;
    if (!source) return;

    // Scale factor: if OFF reported a specific serving weight, convert _100g values
    // to per-serving amounts. mult=1 means values are left as-is (per 100g).
    const mult =
      product?.servingWeightG != null && product.servingWeightG !== 100
        ? product.servingWeightG / 100
        : 1;

    // Core fields: prefer saved correction (user's verified data); apply mult
    setEditedProtein(((source.proteinG ?? 0) * mult).toFixed(1));
    setEditedFiber(source.fiberG != null ? (source.fiberG * mult).toFixed(1) : '');
    setEditedCalories(
      source.caloriesKcal != null
        ? Math.round(source.caloriesKcal * mult).toString()
        : '',
    );
    // Macro + micro: always from raw product (corrections don't store these)
    if (!product) return;
    setEditedCarbs(product.carbsG != null ? (product.carbsG * mult).toFixed(1) : '');
    setEditedFat(product.fatG != null ? (product.fatG * mult).toFixed(1) : '');
    // Micronutrients: also reported per-100g in OFF — scale by same mult
    setEditedMagnesium(
      product.magnesiumMg != null
        ? Math.round(product.magnesiumMg * mult).toString()
        : '',
    );
    setEditedZinc(product.zincMg != null ? (product.zincMg * mult).toFixed(1) : '');
    setEditedB12(product.b12Mcg != null ? (product.b12Mcg * mult).toFixed(1) : '');
    setEditedVitD(
      product.vitaminDIu != null
        ? Math.round(product.vitaminDIu * mult).toString()
        : '',
    );
  }, [correction, product, scanState]);

  async function handleBarcodeScan({ data }: { data: string }) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScannedEan(data);
    setScanState('loading');
    const result = await lookupBarcode(data);
    if (result) {
      haptics.success();
      setProduct(result);
      setScanState('result');
    } else {
      setScanState('not_found');
    }
  }

  function handleConfirm() {
    const displayProduct = correction ?? product;
    if (!displayProduct) return;

    const proteinG = parseFloat(editedProtein) || 0;
    const carbsG = editedCarbs !== '' ? parseFloat(editedCarbs) : null;
    const fatG = editedFat !== '' ? parseFloat(editedFat) : null;
    const fiberG = editedFiber !== '' ? parseFloat(editedFiber) : null;
    const caloriesKcal = editedCalories !== '' ? parseFloat(editedCalories) : null;
    const magnesiumMg = editedMagnesium !== '' ? parseFloat(editedMagnesium) : null;
    const zincMg = editedZinc !== '' ? parseFloat(editedZinc) : null;
    const b12Mcg = editedB12 !== '' ? parseFloat(editedB12) : null;
    const vitaminDIu = editedVitD !== '' ? parseFloat(editedVitD) : null;

    const finalProduct: BarcodeProduct = {
      ...displayProduct,
      proteinG,
      carbsG,
      fatG,
      fiberG,
      caloriesKcal,
      magnesiumMg,
      zincMg,
      b12Mcg,
      vitaminDIu,
      dataSource: correction ? 'user_corrected' : displayProduct.dataSource,
    };

    // Save correction if user changed protein/fiber/calories vs what was shown
    const original = correction ?? product!;
    const userEdited =
      proteinG !== original.proteinG ||
      fiberG !== original.fiberG ||
      caloriesKcal !== original.caloriesKcal;

    if (userEdited && scannedEan) {
      saveCorrection({
        ean: scannedEan,
        product: {
          name: finalProduct.name,
          proteinG,
          fiberG,
          caloriesKcal,
        },
      });
    }

    onProductFound(finalProduct);
    handleClose();
  }

  function handleClose() {
    setScanState('scanning');
    setProduct(null);
    setScannedEan(null);
    resetFields();
    scannedRef.current = false;
    onClose();
  }

  function handleScanAgain() {
    setScanState('scanning');
    setProduct(null);
    setScannedEan(null);
    resetFields();
    scannedRef.current = false;
  }

  // Derive the product to display (user correction wins over raw lookup)
  const displayProduct = (scanState === 'result' && !correctionLoading)
    ? (correction ?? product)
    : product;

  // Show protein warning when no correction and protein is 0
  const showProteinWarning =
    scanState === 'result' &&
    !correction &&
    displayProduct?.proteinG === 0 &&
    displayProduct?.dataSource !== 'user_corrected';

  // Dynamic note: show "Per serving (Xg)" when OFF provided a non-100g serving_quantity
  const servingLabel =
    product?.servingWeightG != null && product.servingWeightG !== 100
      ? `Per serving (${product.servingWeightG}g) — edit to match the label`
      : 'Per 100g — edit to match the label';

  // GLP-1 Watch section only shows when the API returned at least one micro value
  const hasMicroData =
    product?.magnesiumMg != null ||
    product?.zincMg != null ||
    product?.b12Mcg != null ||
    product?.vitaminDIu != null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={handleClose} accessibilityLabel="Close scanner" />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Barcode Scanner</Text>

        {/* Permission not yet determined */}
        {!permission && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Permission denied */}
        {permission && !permission.granted && (
          <View style={styles.permissionContent}>
            <Text style={styles.permissionText}>
              Camera access is required to scan barcodes.
            </Text>
            {permission.canAskAgain ? (
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                onPress={requestPermission}
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
              </Pressable>
            ) : (
              <View style={styles.settingsActions}>
                <Text style={styles.permissionDeniedNote}>
                  Please enable camera access in your device Settings, then tap below.
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                  onPress={() => void Linking.openSettings()}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Open Settings</Text>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => void getPermission()}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelButtonText}>I've enabled it — check again</Text>
                </Pressable>
              </View>
            )}
            <Pressable style={styles.cancelButton} onPress={handleClose} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Camera live — scanning */}
        {permission?.granted && scanState === 'scanning' && (
          <View style={styles.cameraContent}>
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarcodeScan}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
              </View>
            </View>
            <Text style={styles.scanHint}>Point camera at a barcode</Text>
            <Pressable style={styles.cancelButton} onPress={handleClose} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Looking up product */}
        {permission?.granted && scanState === 'loading' && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Looking up product…</Text>
          </View>
        )}

        {/* Product not found */}
        {permission?.granted && scanState === 'not_found' && (
          <View style={styles.stubContent}>
            <Text style={styles.notFoundText}>
              Product not found in the Open Food Facts database.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={handleScanAgain}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Scan again</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={handleClose} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Product found — editable result */}
        {permission?.granted && scanState === 'result' && displayProduct && (
          <ScrollView
            style={styles.resultScroll}
            contentContainerStyle={styles.resultContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Product name + source badge */}
            <Text style={styles.productName}>{displayProduct.name}</Text>
            <View style={styles.sourceRow}>
              {displayProduct.dataSource === 'user_corrected' ? (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ Your verified data</Text>
                </View>
              ) : (
                <Text style={styles.sourceLabel}>
                  {SOURCE_LABEL[displayProduct.dataSource]} · {displayProduct.servingDescription}
                </Text>
              )}
            </View>

            {/* Protein warning when data is likely missing */}
            {showProteinWarning && (
              <View style={styles.proteinWarning}>
                <Text style={styles.proteinWarningText}>
                  ⚠ Protein data may be missing — verify against the label
                </Text>
              </View>
            )}

            <Text style={styles.fieldsNote}>{servingLabel}</Text>

            {/* ── Protein hero ──────────────────────────────────── */}
            <View style={styles.proteinHero}>
              <TextInput
                style={styles.heroInput}
                value={editedProtein}
                onChangeText={setEditedProtein}
                keyboardType="decimal-pad"
                returnKeyType="done"
                placeholder="0"
                placeholderTextColor={BRAND}
                accessibilityLabel="Protein grams"
              />
              <Text style={styles.heroLabel}>Protein · g</Text>
              <Text style={styles.heroSub}>your GLP-1 priority</Text>
            </View>

            {/* ── Macro row (4 cells) ───────────────────────────── */}
            <View style={styles.fieldsRow}>
              <EditableField
                label="Calories"
                unit="kcal"
                value={editedCalories}
                onChangeText={setEditedCalories}
                styles={styles}
              />
              <EditableField
                label="Carbs"
                unit="g"
                value={editedCarbs}
                onChangeText={setEditedCarbs}
                styles={styles}
              />
              <EditableField
                label="Fat"
                unit="g"
                value={editedFat}
                onChangeText={setEditedFat}
                styles={styles}
              />
              <EditableField
                label="Fiber"
                unit="g"
                value={editedFiber}
                onChangeText={setEditedFiber}
                styles={styles}
              />
            </View>

            {/* ── GLP-1 Watch (conditional) ─────────────────────── */}
            {hasMicroData && (
              <>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>GLP-1 Watch</Text>
                  <Text style={styles.sectionLabelSub}>Verify against label</Text>
                </View>
                <View style={[styles.fieldsRow, styles.microRow]}>
                  <EditableField
                    label="Magnesium"
                    unit="mg"
                    value={editedMagnesium}
                    onChangeText={setEditedMagnesium}
                    micro
                    styles={styles}
                  />
                  <EditableField
                    label="Zinc"
                    unit="mg"
                    value={editedZinc}
                    onChangeText={setEditedZinc}
                    micro
                    styles={styles}
                  />
                  <EditableField
                    label="Vit B12"
                    unit="mcg"
                    value={editedB12}
                    onChangeText={setEditedB12}
                    micro
                    styles={styles}
                  />
                  <EditableField
                    label="Vit D"
                    unit="IU"
                    value={editedVitD}
                    onChangeText={setEditedVitD}
                    micro
                    styles={styles}
                  />
                </View>
              </>
            )}

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel="Add this product to your log"
            >
              <Text style={styles.primaryButtonText}>Add to log</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={handleScanAgain} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Scan again</Text>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Editable nutrition field ────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  micro?: boolean;
  styles: ReturnType<typeof makeStyles>;
}

function EditableField({ label, unit, value, onChangeText, micro, styles }: EditableFieldProps) {
  return (
    <View style={[styles.fieldCard, micro && styles.fieldCardMicro]}>
      <TextInput
        style={[styles.fieldInput, micro && styles.fieldInputMicro]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        returnKeyType="done"
        placeholder="—"
        placeholderTextColor={micro ? AMBER : '#9ca3af'}
        accessibilityLabel={`${label} (${unit})`}
      />
      <Text style={[styles.fieldLabel, micro && styles.fieldLabelMicro]}>{label}</Text>
      <Text style={[styles.fieldUnit, micro && styles.fieldUnitMicro]}>{unit}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
}

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      paddingTop: spacing.sm,
      maxHeight: '90%',
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.gray300,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    centerContent: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      gap: spacing.md,
    },
    permissionContent: {
      gap: spacing.md,
      alignItems: 'center',
      paddingTop: spacing.md,
    },
    permissionText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    settingsActions: {
      width: '100%',
      gap: spacing.sm,
    },
    permissionDeniedNote: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    stubContent: {
      gap: spacing.md,
    },
    cameraContent: {
      gap: spacing.md,
    },
    cameraWrapper: {
      width: '100%',
      height: 260,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    camera: {
      width: '100%',
      height: '100%',
    },
    scanOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanFrame: {
      width: 220,
      height: 120,
      borderWidth: 2,
      borderColor: colors.white,
      borderRadius: radius.md,
      backgroundColor: 'transparent',
    },
    scanHint: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    notFoundText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginVertical: spacing.md,
    },

    // Result view
    resultScroll: {
      flexGrow: 0,
    },
    resultContent: {
      gap: spacing.md,
      paddingBottom: spacing.sm,
    },
    productName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sourceLabel: {
      fontSize: 12,
      color: colors.textDisabled,
    },
    verifiedBadge: {
      backgroundColor: 'rgba(5,150,105,0.10)',
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    verifiedBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#059669',
    },

    // Protein warning
    proteinWarning: {
      backgroundColor: AMBER_LIGHT,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    proteinWarningText: {
      fontSize: 12,
      color: AMBER,
      fontWeight: '600',
      lineHeight: 18,
    },

    fieldsNote: {
      fontSize: 11,
      color: colors.textDisabled,
    },

    // Protein hero card
    proteinHero: {
      backgroundColor: BRAND_LIGHT,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: BRAND,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      gap: 2,
    },
    heroInput: {
      fontSize: 36,
      fontWeight: '800',
      color: BRAND,
      textAlign: 'center',
      paddingVertical: 0,
      minWidth: 80,
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: BRAND,
    },
    heroSub: {
      fontSize: 10,
      color: BRAND,
      opacity: 0.7,
    },

    // Macro + micro field rows
    fieldsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    microRow: {
      backgroundColor: MICRO_BG,
      borderRadius: radius.md,
      padding: spacing.xs,
    },
    fieldCard: {
      flex: 1,
      backgroundColor: colors.gray100,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: 2,
      alignItems: 'center',
      gap: 1,
    },
    fieldCardMicro: {
      backgroundColor: 'transparent',
    },
    fieldInput: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      minWidth: 44,
      paddingVertical: 0,
    },
    fieldInputMicro: {
      fontSize: 14,
      color: AMBER,
    },
    fieldLabel: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    fieldLabelMicro: {
      color: AMBER,
    },
    fieldUnit: {
      fontSize: 9,
      color: colors.textDisabled,
      textAlign: 'center',
    },
    fieldUnitMicro: {
      color: AMBER,
      opacity: 0.7,
    },

    // GLP-1 Watch section label
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: AMBER,
      textTransform: 'uppercase',
    },
    sectionLabelSub: {
      fontSize: 9,
      color: colors.textDisabled,
    },

    // Buttons
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    primaryButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
    },
  });
}
