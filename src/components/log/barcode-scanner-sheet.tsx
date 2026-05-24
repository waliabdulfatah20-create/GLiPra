import { CameraView, useCameraPermissions } from 'expo-camera';
import * as React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { lookupBarcode } from '@/features/food-log/barcode-lookup';
import type { BarcodeProduct } from '@/features/food-log/barcode-lookup';
import { colors, radius, spacing } from '@/theme/colors';

// Barcode scanning is ALWAYS free — never gated by subscription (CLAUDE.md).

export interface BarcodeScannerSheetProps {
  visible: boolean;
  onClose: () => void;
  onProductFound: (product: BarcodeProduct) => void;
}

type ScanState = 'scanning' | 'loading' | 'result' | 'not_found';

export function BarcodeScannerSheet({
  visible,
  onClose,
  onProductFound,
}: BarcodeScannerSheetProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = React.useState<ScanState>('scanning');
  const [product, setProduct] = React.useState<BarcodeProduct | null>(null);
  const scannedRef = React.useRef(false);

  // Reset state each time the sheet opens
  React.useEffect(() => {
    if (visible) {
      setScanState('scanning');
      setProduct(null);
      scannedRef.current = false;
    }
  }, [visible]);

  async function handleBarcodeScan({ data }: { data: string }) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanState('loading');
    const result = await lookupBarcode(data);
    if (result) {
      setProduct(result);
      setScanState('result');
    } else {
      setScanState('not_found');
    }
  }

  function handleConfirm() {
    if (product) {
      onProductFound(product);
      handleClose();
    }
  }

  function handleClose() {
    setScanState('scanning');
    setProduct(null);
    scannedRef.current = false;
    onClose();
  }

  function handleScanAgain() {
    setScanState('scanning');
    setProduct(null);
    scannedRef.current = false;
  }

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
              <Text style={styles.permissionDeniedNote}>
                Please enable camera access in your device Settings.
              </Text>
            )}
            <Pressable style={styles.cancelButton} onPress={handleClose} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Camera live — scanning */}
        {permission?.granted && scanState === 'scanning' && (
          <View style={styles.cameraContent}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScan}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            >
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
              </View>
            </CameraView>
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

        {/* Product found — confirm */}
        {permission?.granted && scanState === 'result' && product && (
          <View style={styles.resultContent}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productServing}>{product.servingDescription}</Text>

            <View style={styles.macroRow}>
              <MacroChip label="Protein" value={product.proteinG} unit="g" highlight />
              {product.fiberG != null && (
                <MacroChip label="Fiber" value={product.fiberG} unit="g" />
              )}
              {product.caloriesKcal != null && (
                <MacroChip label="Calories" value={product.caloriesKcal} unit="kcal" />
              )}
            </View>

            <Text style={styles.per100gNote}>Values per 100g</Text>

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

interface MacroChipProps {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}

function MacroChip({ label, value, unit, highlight = false }: MacroChipProps) {
  return (
    <View style={[styles.macroChip, highlight && styles.macroChipHighlight]}>
      <Text style={[styles.macroValue, highlight && styles.macroValueHighlight]}>
        {value.toFixed(1)}{unit}
      </Text>
      <Text style={[styles.macroLabel, highlight && styles.macroLabelHighlight]}>{label}</Text>
    </View>
  );
}

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
    minHeight: 380,
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
  camera: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  scanOverlay: {
    flex: 1,
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
  resultContent: {
    gap: spacing.md,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  productServing: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  macroChip: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  macroChipHighlight: {
    backgroundColor: colors.primaryLight,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  macroValueHighlight: {
    color: colors.primary,
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  macroLabelHighlight: {
    color: colors.primary,
  },
  per100gNote: {
    fontSize: 12,
    color: colors.textDisabled,
    textAlign: 'right',
  },
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
