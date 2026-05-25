import { CameraView, useCameraPermissions } from 'expo-camera';
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
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
import { useAuthStore } from '@/features/auth/use-auth-store';
import { haptics } from '@/lib/haptics';
import { colors, radius, spacing } from '@/theme/colors';

// Barcode scanning is ALWAYS free — never gated by subscription (CLAUDE.md).

// Brand purple for protein field highlight (Clean Clinical design)
const BRAND = '#5b21b6';
const BRAND_LIGHT = 'rgba(91,33,182,0.08)';
const AMBER = '#d97706';
const AMBER_LIGHT = 'rgba(217,119,6,0.10)';

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
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [scanState, setScanState] = React.useState<ScanState>('scanning');
  const [product, setProduct] = React.useState<BarcodeProduct | null>(null);
  const [scannedEan, setScannedEan] = React.useState<string | null>(null);
  const scannedRef = React.useRef(false);

  // Editable fields
  const [editedProtein, setEditedProtein] = React.useState('');
  const [editedFiber, setEditedFiber] = React.useState('');
  const [editedCalories, setEditedCalories] = React.useState('');

  // Correction memory hooks
  const { correction, isLoading: correctionLoading } = useBarcodeCorrectionLookup(
    scanState === 'result' ? scannedEan : null,
  );
  const { mutate: saveCorrection } = useSaveBarcodeCorrection();

  // Reset state each time the sheet opens
  React.useEffect(() => {
    if (visible) {
      setScanState('scanning');
      setProduct(null);
      setScannedEan(null);
      setEditedProtein('');
      setEditedFiber('');
      setEditedCalories('');
      scannedRef.current = false;
    }
  }, [visible]);

  // When correction loads (or product arrives), pre-fill edit fields
  React.useEffect(() => {
    if (scanState !== 'result') return;
    const source = correction ?? product;
    if (!source) return;
    setEditedProtein(source.proteinG.toFixed(1));
    setEditedFiber(source.fiberG != null ? source.fiberG.toFixed(1) : '');
    setEditedCalories(source.caloriesKcal != null ? source.caloriesKcal.toFixed(0) : '');
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
    const fiberG = editedFiber !== '' ? parseFloat(editedFiber) : null;
    const caloriesKcal = editedCalories !== '' ? parseFloat(editedCalories) : null;

    const finalProduct: BarcodeProduct = {
      ...displayProduct,
      proteinG,
      fiberG,
      caloriesKcal,
      dataSource: correction ? 'user_corrected' : displayProduct.dataSource,
    };

    // Check if user changed any value vs what was originally shown
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
    setEditedProtein('');
    setEditedFiber('');
    setEditedCalories('');
    scannedRef.current = false;
    onClose();
  }

  function handleScanAgain() {
    setScanState('scanning');
    setProduct(null);
    setScannedEan(null);
    setEditedProtein('');
    setEditedFiber('');
    setEditedCalories('');
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
          <View style={styles.resultContent}>
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

            {/* Editable nutrition fields */}
            <Text style={styles.fieldsNote}>Per 100g — edit to match the label</Text>
            <View style={styles.fieldsRow}>
              <EditableField
                label="Protein (g)"
                value={editedProtein}
                onChangeText={setEditedProtein}
                highlight
              />
              <EditableField
                label="Fiber (g)"
                value={editedFiber}
                onChangeText={setEditedFiber}
                placeholder="—"
              />
              <EditableField
                label="Calories"
                value={editedCalories}
                onChangeText={setEditedCalories}
                placeholder="—"
              />
            </View>

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
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Editable nutrition field ────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  highlight?: boolean;
  placeholder?: string;
}

function EditableField({ label, value, onChangeText, highlight, placeholder }: EditableFieldProps) {
  return (
    <View style={[styles.fieldCard, highlight && styles.fieldCardHighlight]}>
      <TextInput
        style={[styles.fieldInput, highlight && styles.fieldInputHighlight]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        returnKeyType="done"
        placeholder={placeholder ?? '0'}
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel={label}
      />
      <Text style={[styles.fieldLabel, highlight && styles.fieldLabelHighlight]}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    minHeight: 400,
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
  resultContent: {
    gap: spacing.md,
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

  // Editable fields
  fieldsNote: {
    fontSize: 11,
    color: colors.textDisabled,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldCard: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  fieldCardHighlight: {
    backgroundColor: BRAND_LIGHT,
  },
  fieldInput: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    minWidth: 60,
    paddingVertical: 0,
  },
  fieldInputHighlight: {
    color: BRAND,
  },
  fieldLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fieldLabelHighlight: {
    color: BRAND,
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
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
