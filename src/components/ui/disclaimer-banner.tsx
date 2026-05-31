import type { GlipraTokens } from '@/theme/tokens';
import type { DisclaimerTier } from '@/types';

import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

type DisclaimerBannerProps = {
  tier: DisclaimerTier;
  children: React.ReactNode;
  onAcknowledge?: () => void;
  acknowledged?: boolean;
};

export function DisclaimerBanner({
  tier,
  children,
  onAcknowledge,
  acknowledged = false,
}: DisclaimerBannerProps) {
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  if (tier === 1) {
    return (
      <View style={styles.tier1Container}>
        <View style={styles.tier1Header}>
          <View style={styles.tier1IconBadge}>
            <Text style={styles.tier1IconText}>!</Text>
          </View>
          <Text style={styles.tier1Title}>Medical Disclaimer</Text>
        </View>
        <View style={styles.tier1Body}>{children}</View>
        {onAcknowledge && !acknowledged && (
          <Pressable
            style={({ pressed }) => [
              styles.acknowledgeButton,
              pressed && styles.acknowledgeButtonPressed,
            ]}
            onPress={onAcknowledge}
            accessibilityRole="button"
            accessibilityLabel="Acknowledge medical disclaimer"
          >
            <Text style={styles.acknowledgeButtonText}>I understand</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.tier2Container}>
      <Text style={styles.tier2IconText}>i</Text>
      <View style={styles.tier2Content}>{children}</View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    // Tier 1 — full content weight, orange card
    tier1Container: {
      backgroundColor: colors.disclaimerBg,
      borderWidth: 1,
      borderColor: colors.disclaimerBorder,
      borderRadius: radius.md,
      padding: spacing.md,
      marginVertical: spacing.sm,
    },
    tier1Header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    tier1IconBadge: {
      width: 22,
      height: 22,
      borderRadius: radius.full,
      backgroundColor: '#F97316',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    tier1IconText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: '700',
      lineHeight: 16,
    },
    tier1Title: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.disclaimerText,
      letterSpacing: 0.2,
    },
    tier1Body: {
      // children render here — no extra wrapping
    },
    acknowledgeButton: {
      marginTop: spacing.md,
      alignSelf: 'flex-start',
      backgroundColor: '#F97316',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    acknowledgeButtonPressed: {
      opacity: 0.85,
    },
    acknowledgeButtonText: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
    },

    // Tier 2 — slim footer strip
    tier2Container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.gray50,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    tier2IconText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textDisabled,
      marginRight: spacing.xs,
      marginTop: 1,
    },
    tier2Content: {
      flex: 1,
    },
  });
}
