// src/components/today/daily-guidance-card.tsx
// Pro-gated daily AI nutrition tip card.
// Rule 8: DisclaimerBanner tier={1} with AsyncStorage-backed first-view acknowledgment.
// Rule 9: No condition names in copy.
// Rule 10: AI scope is nutrition only -- enforced server-side; card is display-only.

import type { DailyGuidanceResult } from '@/features/daily-guidance/api';
import type { GlipraTokens } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';

import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { ProGate } from '@/features/subscription/pro-gate';
import { analytics, EVENTS } from '@/lib/analytics';
import { useTheme } from '@/lib/ThemeContext';

const DISCLAIMER_SEEN_KEY = 'glipra_daily_guidance_disclaimer_seen';

type DailyGuidanceCardProps = {
  guidance: DailyGuidanceResult | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function DailyGuidanceCard({ guidance, isLoading, isError }: DailyGuidanceCardProps) {
  const { colors, gradients, spacing, radius, shadows } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = React.useState(true);
  const [showWhy, setShowWhy] = React.useState(false);
  const [hasTrackedView, setHasTrackedView] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_SEEN_KEY)
      .then(value => setDisclaimerAcknowledged(value === 'true'))
      .catch(() => setDisclaimerAcknowledged(false));
  }, []);

  React.useEffect(() => {
    if (guidance && !hasTrackedView) {
      analytics.capture(EVENTS.DAILY_GUIDANCE_VIEWED);
      setHasTrackedView(true);
    }
  }, [guidance, hasTrackedView]);

  const handleAcknowledge = React.useCallback(async () => {
    await AsyncStorage.setItem(DISCLAIMER_SEEN_KEY, 'true');
    setDisclaimerAcknowledged(true);
  }, []);

  const handleWhyPress = React.useCallback(() => {
    setShowWhy(prev => !prev);
    if (!showWhy) {
      analytics.capture(EVENTS.DAILY_GUIDANCE_WHY_TAPPED);
    }
  }, [showWhy]);

  return (
    <ProGate featureName={t('today.daily_guidance_pro_label')}>
      <View style={styles.card}>
        <LinearGradient
          colors={[...gradients.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>{t('today.daily_guidance_pro_label')}</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {isLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{t('today.daily_guidance_loading')}</Text>
            </View>
          )}

          {isError && !isLoading && (
            <Text style={styles.errorText}>{t('today.daily_guidance_error')}</Text>
          )}

          {guidance && !isLoading && (
            <>
              <Text style={styles.guidanceText}>{guidance.guidance_text}</Text>

              <Pressable
                onPress={handleWhyPress}
                style={styles.whyButton}
                accessibilityRole="button"
                accessibilityLabel={t('today.daily_guidance_why')}
              >
                <Text style={styles.whyButtonText}>
                  {showWhy ? t('today.daily_guidance_why_close') : t('today.daily_guidance_why')}
                </Text>
              </Pressable>

              {showWhy && (
                <View style={styles.reasoningBox}>
                  <Text style={styles.reasoningText}>{guidance.reasoning_text}</Text>
                </View>
              )}
            </>
          )}

          <View style={styles.disclaimerWrapper}>
            <DisclaimerBanner
              tier={1}
              onAcknowledge={disclaimerAcknowledged ? undefined : handleAcknowledge}
              acknowledged={disclaimerAcknowledged}
            >
              <Text style={styles.disclaimerText}>
                {t('today.daily_guidance_disclaimer')}
              </Text>
            </DisclaimerBanner>
          </View>
        </View>
      </View>
    </ProGate>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      ...shadows.md,
      marginVertical: spacing.xs,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    proBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: radius.xs ?? 4,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
    },
    proBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 0.5,
    },
    body: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    guidanceText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    whyButton: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
    },
    whyButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    reasoningBox: {
      backgroundColor: colors.primaryLight,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    reasoningText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    disclaimerWrapper: {
      marginTop: spacing.xs,
    },
    disclaimerText: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textPrimary,
    },
  });
}
