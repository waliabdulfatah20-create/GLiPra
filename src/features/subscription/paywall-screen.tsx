// PaywallScreen — full-screen modal shown when a user tries to access a Pro feature.
//
// Premium look: a gradient hero (crown + pharmacist pill), SVG benefit icons, and
// three price tiers with Annual featured as best value. Product IDs must match
// what is configured in RevenueCat + App Store / Google Play:
//   monthly   → $9.99/month
//   yearly    → $79.99/year
//   lifetime  → $149 one-time (first 500 users)
//
// When react-native-purchases is NOT installed (Expo Go / pre-native build),
// all purchase buttons are disabled and show an explanatory label.

import type { SvgProps } from 'react-native-svg';
import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as React from 'react';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Activity,
  Bolt,
  Camera,
  ClipboardCheck,
  Crown,
  Microphone,
  TrendingUp,
} from '@/components/ui/icons';
import { analytics, EVENTS } from '@/lib/analytics';
import { useTheme } from '@/lib/ThemeContext';

// ---------------------------------------------------------------------------
// RevenueCat availability guard (same pattern as use-subscription)
// ---------------------------------------------------------------------------

function getPurchasesModule(): typeof import('react-native-purchases').default | null {
  try {
    const mod = require('react-native-purchases');
    if (mod && mod.default && typeof mod.default.purchaseProduct === 'function') {
      return mod.default;
    }
    return null;
  }
  catch {
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
// Pro benefits — each paired with an SVG line icon
// ---------------------------------------------------------------------------

type IconCmp = React.ComponentType<SvgProps>;

const PRO_BENEFITS: { Icon: IconCmp; label: string }[] = [
  { Icon: Camera, label: 'AI photo food recognition (50/day)' },
  { Icon: Microphone, label: 'Voice logging (unlimited)' },
  { Icon: Bolt, label: 'Daily AI nutrition guidance' },
  { Icon: Activity, label: 'Micronutrient watch' },
  { Icon: TrendingUp, label: 'Unlimited protein history' },
  { Icon: ClipboardCheck, label: 'Prescriber visit prep & PDF export' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type PaywallScreenProps = {
  /** Human-readable name of the feature that triggered the paywall */
  featureName: string;
  onDismiss: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PaywallScreen({ featureName, onDismiss }: PaywallScreenProps) {
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  // Fire paywall_viewed once per mount — includes the feature that triggered it.
  React.useEffect(() => {
    analytics.capture(EVENTS.PAYWALL_VIEWED, { feature: featureName });
  }, [featureName]);

  const handlePurchase = useCallback(
    async (productId: string) => {
      const Purchases = getPurchasesModule();
      if (!Purchases)
        return;

      setPurchasingId(productId);
      analytics.capture(EVENTS.PURCHASE_STARTED, { product_id: productId });
      try {
        await Purchases.purchaseProduct(productId);
        analytics.capture(EVENTS.PURCHASE_COMPLETED, { product_id: productId });
        onDismiss();
      }
      catch (e) {
        // PurchasesError with code PURCHASE_CANCELLED (2) is a user action —
        // do not show an error alert.

        const code = (e as any)?.code ?? (e as any)?.userInfo?.readableErrorCode;
        if (code !== 'PURCHASE_CANCELLED' && code !== 2) {
          Alert.alert(
            'Purchase failed',
            'Something went wrong. Please try again or restore your purchases.',
          );
        }
      }
      finally {
        setPurchasingId(null);
      }
    },
    [onDismiss],
  );

  const handleRestore = useCallback(async () => {
    const Purchases = getPurchasesModule();
    if (!Purchases)
      return;

    try {
      await Purchases.restorePurchases();
      Alert.alert(
        'Purchases restored',
        'Your subscription status has been updated.',
        [{ text: 'OK', onPress: onDismiss }],
      );
    }
    catch {
      Alert.alert(
        'Restore failed',
        'Could not restore purchases. Please try again.',
      );
    }
  }, [onDismiss]);

  const isAnyPurchasing = purchasingId !== null;
  const storeAccount = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';
  const disclosure
    = `Monthly and annual plans are auto-renewing subscriptions. Your ${storeAccount} account is `
      + `charged at confirmation and renews at $9.99/month or $79.99/year unless cancelled at least `
      + `24 hours before the current period ends. Manage or cancel anytime in your ${storeAccount} `
      + `account settings. Lifetime is a one-time purchase, not a subscription.`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient hero */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Pressable
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss paywall"
          >
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>

          <View style={styles.crownChip}>
            <Crown color={colors.white} width={30} height={30} />
          </View>
          <Text style={styles.heroTitle}>
            Unlock
            {' '}
            {featureName}
            {' '}
            and all Pro features
          </Text>
          <View style={styles.pharmacistPill}>
            <Text style={styles.pharmacistPillText}>DESIGNED BY A LICENSED PHARMACIST</Text>
          </View>
        </LinearGradient>

        <View style={styles.bodyPad}>
          {/* Benefits */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>What you get with Pro</Text>
            {PRO_BENEFITS.map(({ Icon, label }) => (
              <View key={label} style={styles.benefitRow}>
                <View style={styles.benefitIconChip}>
                  <Icon color={colors.success} width={15} height={15} />
                </View>
                <Text style={styles.benefitText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Price tiers — Annual featured */}
          <PriceTier
            label="Annual"
            price="$79.99"
            unit="/yr"
            badge="BEST VALUE · SAVE 33%"
            featured
            productId={PRODUCT_ANNUAL}
            isDisabled={!PURCHASES_AVAILABLE || isAnyPurchasing}
            isLoading={purchasingId === PRODUCT_ANNUAL}
            onPress={handlePurchase}
          />
          <PriceTier
            label="Monthly"
            price="$9.99"
            unit="/mo"
            badge={null}
            featured={false}
            productId={PRODUCT_MONTHLY}
            isDisabled={!PURCHASES_AVAILABLE || isAnyPurchasing}
            isLoading={purchasingId === PRODUCT_MONTHLY}
            onPress={handlePurchase}
          />
          <PriceTier
            label="Lifetime"
            price="$149"
            unit=""
            badge="FIRST 500 USERS"
            featured={false}
            productId={PRODUCT_LIFETIME}
            isDisabled={!PURCHASES_AVAILABLE || isAnyPurchasing}
            isLoading={purchasingId === PRODUCT_LIFETIME}
            onPress={handlePurchase}
          />

          {/* Auto-renew disclosure + legal links (Apple 3.1.2 / Google Play) */}
          <Text style={styles.disclosure}>{disclosure}</Text>
          <View style={styles.legalRow}>
            <Pressable
              onPress={() => router.push('/legal/terms-of-service')}
              accessibilityRole="link"
              accessibilityLabel="Terms of Use"
            >
              <Text style={styles.legalLink}>Terms of Use</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable
              onPress={() => router.push('/legal/privacy-policy')}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy"
            >
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
          </View>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PriceTier sub-component
// ---------------------------------------------------------------------------

type PriceTierProps = {
  label: string;
  price: string;
  unit: string;
  badge: string | null;
  featured: boolean;
  productId: string;
  isDisabled: boolean;
  isLoading: boolean;
  onPress: (productId: string) => void;
};

function PriceTier({
  label,
  price,
  unit,
  badge,
  featured,
  productId,
  isDisabled,
  isLoading,
  onPress,
}: PriceTierProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows: undefined }),
    [colors, spacing, radius],
  );

  return (
    <Pressable
      onPress={() => onPress(productId)}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.tier,
        featured ? styles.tierFeatured : styles.tierPlain,
        pressed && !isDisabled && styles.tierPressed,
        isDisabled && styles.tierDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isDisabled ? `${label} ${price}: available in full app build` : `${label} ${price}`}
    >
      {badge && (
        <View style={[styles.tierBadge, featured ? styles.tierBadgeFeatured : styles.tierBadgePlain]}>
          <Text style={[styles.tierBadgeText, featured ? styles.tierBadgeTextFeatured : styles.tierBadgeTextPlain]}>
            {badge}
          </Text>
        </View>
      )}
      {isLoading
        ? (
            <ActivityIndicator size="small" color={colors.primary} />
          )
        : (
            <View style={styles.tierRow}>
              <Text style={styles.tierLabel}>{label}</Text>
              <Text style={styles.tierPrice}>
                {price}
                <Text style={styles.tierUnit}>{unit}</Text>
              </Text>
            </View>
          )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'] | undefined;
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      paddingBottom: spacing.xxl,
    },

    // Gradient hero
    hero: {
      paddingTop: spacing.xxl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      position: 'relative',
    },
    dismissButton: {
      position: 'absolute',
      top: spacing.lg,
      right: spacing.md,
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dismissText: {
      fontSize: 14,
      color: colors.white,
      fontWeight: '600',
    },
    crownChip: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.white,
      textAlign: 'center',
      lineHeight: 27,
    },
    pharmacistPill: {
      marginTop: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
    },
    pharmacistPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: 0.6,
    },

    bodyPad: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.md,
    },

    // Benefits
    benefitsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...(shadows ? shadows.sm : {}),
    },
    benefitsTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.xs / 2,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    benefitIconChip: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.successLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    benefitText: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
      flex: 1,
    },

    // Price tiers
    tier: {
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 56,
      justifyContent: 'center',
    },
    tierPlain: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    tierFeatured: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    tierPressed: {
      opacity: 0.85,
    },
    tierDisabled: {
      opacity: 0.6,
    },
    tierRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    tierLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    tierPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    tierUnit: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    tierBadge: {
      position: 'absolute',
      top: -9,
      left: spacing.md,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    tierBadgeFeatured: {
      backgroundColor: colors.primary,
    },
    tierBadgePlain: {
      backgroundColor: colors.gray200,
    },
    tierBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    tierBadgeTextFeatured: {
      color: colors.white,
    },
    tierBadgeTextPlain: {
      color: colors.textSecondary,
    },

    // Auto-renew disclosure + legal links
    disclosure: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    legalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    legalLink: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    legalDot: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Stub notice
    stubNotice: {
      backgroundColor: colors.warningLight,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: `${colors.warning}60`,
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
}
