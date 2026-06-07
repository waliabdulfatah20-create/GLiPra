import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DoseInjectionRotation } from '@/components/dose/dose-injection-rotation';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useTheme } from '@/lib/ThemeContext';

// Legacy route — the site rotation now lives inside the Dose tab. This screen is
// kept (hidden) so older deep links still resolve, and it reuses the same module.
export default function InjectionSitesScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{t('dose.rotation_screen_title')}</Text>
          <Text style={styles.subtitle}>{t('dose.rotation_screen_subtitle')}</Text>
        </View>

        {/* Rule 8: clinical screen — Tier 2 disclaimer */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            {t('dose.rotation_disclaimer')}
          </Text>
        </DisclaimerBanner>

        <DoseInjectionRotation />
      </ScrollView>
    </SafeAreaView>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    headerBlock: { gap: spacing.xs },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
