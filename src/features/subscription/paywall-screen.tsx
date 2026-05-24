// PaywallScreen — full-screen modal shown when a user tries to access a Pro feature.
//
// Product IDs must match exactly what is configured in RevenueCat + App Store /
// Google Play:
//   monthly   → $9.99/month
//   yearly    → $79.99/year
//   lifetime  → $149 one-time (first 500 users)
//
// When react-native-purchases is NOT installed (Expo Go / pre-native build),
// all purchase buttons are disabled and show an explanatory label.

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing } from '@/theme/colors';

// ---------------------------------------------------------------------------
// RevenueCat availability guard (same pattern as use-subscription)
// ---------------------------------------------------------------------------

function getPurchasesModule(): typeof import('react-native-purchases') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    if (mod && mod.default && typeof mod.default.purchaseProduct === 'function') {
      return mod.default;
    }
    return null;
  } catch {
    return null;
  }
}

const PURCHASES_AVAILABLE = getPurchasesModule() !== null;

// ---------------------------------------------------------------------------
// Product IDs
// ---------------------------------------------------------------------------

const PRODUCT_MONTHLY = 'monthly';
const PRODUCT_ANNUAL = 'yearly';
const PRODUCT_LIFETIME = 'lifetime';

// ---------------------------------------------------------------------------
// Pro benefits list
// ---------------------------------------------------------------------------

const PRO_BENEFITS = [
  'AI photo food recognition (50/day)',
  'Voice logging (unlimited)',
  'Daily AI nutrition guidance',
  'Micronutrient watch',
  'Unlimited protein history',
  'Prescriber visit prep & PDF export',
  'Linked accounts',
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PaywallScreenProps {
  /** Human-readable name of the feature that triggered the paywall */
  featureName: string;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaywallScreen({ featureName, onDismiss }: PaywallScreenProps) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = useCallback(
    async (productId: string) => {
      const Purchases = getPurchasesModule();
      if (!Purchases) return;

      setPurchasingId(productId);
      try {
        await Purchases.purchaseProduct(productId);
        // On success the parent should re-check subscription state.
        // Dismiss the paywall — useSubscription will refresh automatically.
        onDismiss();
      } catch (e) {
        // PurchasesError with code PURCHASE_CANCELLED (2) is a user action —
        // do not show an error alert.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = (e as any)?.code ?? (e as any)?.userInfo?.readableErrorCode;
        if (code !== 'PURCHASE_CANCELLED' && code !== 2) {
          Alert.alert(
            'Purchase failed',
            'Something went wrong. Please try again or restore your purchases.',
          );
        }
      } finally {
        setPurchasingId(null);
      }
    },
    [onDismiss],
  );

  const handleRestore = useCallback(async () => {
    const Purchases = getPurchasesModule();
    if (!Purchases) return;

    try {
      await Purchases.restorePurchases();
      Alert.alert(
        'Purchases restored',
        'Your subscription status has been updated.',
        [{ text: 'OK', onPress: onDismiss }],
      );
    } catch {
      Alert.alert(
        'Restore failed',
        'Could not restore purchases. Please try again.',
      );
    }
  }, [onDismiss]);

  const isAnyPurchasing = purchasingId !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.dismissPlaceholder} />
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <Pressable
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss paywall"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        </View>

        {/* Value prop */}
        <View style={styles.valueCard}>
          <Text style={styles.featureHighlight}>
            Unlock {featureName} and all Pro features
          </Text>
          <Text style={styles.pharmacistBadge}>
            Designed by a licensed pharmacist
          </Text>
        </View>

        {/* Benefits list */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What you get with Pro</Text>
          {PRO_BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Text style={styles.benefitCheck}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Pricing buttons */}
        <PurchaseButton
          label="$9.99 / month"
          sublabel={null}
          productId={PRODUCT_MONTHLY}
          isDisabled={!PURCHASES_AVAILABLE || isAnyPurchasing}
          isLoading={purchasingId === PRODUCT_MONTHLY}
          onPress={handlePurchase}
          style="primary"
        />

        <PurchaseButton
          label="$79.99 / year"
          sublabel="Save 33%"
          productId={PRODUCT_ANNUAL}
          isDisabled={!PURCHASES_AVAILABLE || isAnyPurchasing}
          isLoading={purchasingId === PRODUCT_ANNUAL}
          onPress={handlePurchase}
          style="primary"
        />

        <PurchaseButton
          label="$149 Lifetime"
          sublabel="First 500 users only"
          productId={PRODUCT_LIFETIME}
          isDisabled={!PURCHASES_AVAILABLE || isAnyPurchasing}
          isLoading={purchasingId === PRODUCT_LIFETIME}
          onPress={handlePurchase}
          style="secondary"
        />

        {/* Unavailability notice for Expo Go */}
        {!PURCHASES_AVAILABLE && (
          <View style={styles.stubNotice}>
            <Text style={styles.stubNoticeText}>
              In-app purchases are available in the full app build.
              Purchases are not available in Expo Go.
            </Text>
          </View>
        )}

        {/* Restore + dismiss links */}
        <Pressable
          onPress={handleRestore}
          disabled={!PURCHASES_AVAILABLE}
          style={({ pressed }) => [
            styles.textLink,
            pressed && styles.textLinkPressed,
            !PURCHASES_AVAILABLE && styles.textLinkDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
        >
          <Text
            style={[
              styles.textLinkLabel,
              !PURCHASES_AVAILABLE && styles.textLinkLabelDisabled,
            ]}
          >
            Restore purchases
          </Text>
        </Pressable>

        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.textLink,
            pressed && styles.textLinkPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
        >
          <Text style={[styles.textLinkLabel, styles.maybeLaterText]}>
            Maybe later
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PurchaseButton sub-component
// ---------------------------------------------------------------------------

interface PurchaseButtonProps {
  label: string;
  sublabel: string | null;
  productId: string;
  isDisabled: boolean;
  isLoading: boolean;
  onPress: (productId: string) => void;
  style: 'primary' | 'secondary';
}

function PurchaseButton({
  label,
  sublabel,
  productId,
  isDisabled,
  isLoading,
  onPress,
  style,
}: PurchaseButtonProps) {
  const isPrimary = style === 'primary';

  return (
    <Pressable
      onPress={() => onPress(productId)}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.purchaseButton,
        isPrimary ? styles.purchaseButtonPrimary : styles.purchaseButtonSecondary,
        isDisabled && styles.purchaseButtonDisabled,
        pressed && !isDisabled && styles.purchaseButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        isDisabled ? `${label}: available in full app build` : label
      }
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.white : colors.primary}
        />
      ) : (
        <View style={styles.purchaseButtonContent}>
          <Text
            style={[
              styles.purchaseButtonLabel,
              isPrimary
                ? styles.purchaseButtonLabelPrimary
                : styles.purchaseButtonLabelSecondary,
              isDisabled && styles.purchaseButtonLabelDisabled,
            ]}
          >
            {isDisabled ? `${label}: available in full app` : label}
          </Text>
          {sublabel && (
            <Text
              style={[
                styles.purchaseButtonSublabel,
                isDisabled && styles.purchaseButtonLabelDisabled,
              ]}
            >
              {sublabel}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dismissPlaceholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // Value card
  valueCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    gap: spacing.sm,
    alignItems: 'center',
  },
  featureHighlight: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
    lineHeight: 24,
  },
  pharmacistBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Benefits
  benefitsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs / 2,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  benefitCheck: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
    lineHeight: 20,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    flex: 1,
  },

  // Purchase buttons
  purchaseButton: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...shadows.sm,
  },
  purchaseButtonPrimary: {
    backgroundColor: colors.primary,
  },
  purchaseButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  purchaseButtonDisabled: {
    backgroundColor: colors.gray200,
    borderColor: colors.gray200,
    shadowOpacity: 0,
    elevation: 0,
  },
  purchaseButtonPressed: {
    opacity: 0.85,
  },
  purchaseButtonContent: {
    alignItems: 'center',
    gap: 2,
  },
  purchaseButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  purchaseButtonLabelPrimary: {
    color: colors.white,
  },
  purchaseButtonLabelSecondary: {
    color: colors.primary,
  },
  purchaseButtonLabelDisabled: {
    color: colors.textDisabled,
  },
  purchaseButtonSublabel: {
    fontSize: 12,
    color: colors.successLight,
    fontWeight: '500',
  },

  // Stub notice
  stubNotice: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '60',
  },
  stubNoticeText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Text links
  textLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  textLinkPressed: {
    opacity: 0.6,
  },
  textLinkDisabled: {
    opacity: 0.4,
  },
  textLinkLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  textLinkLabelDisabled: {
    color: colors.textDisabled,
  },
  maybeLaterText: {
    color: colors.textSecondary,
  },
});
