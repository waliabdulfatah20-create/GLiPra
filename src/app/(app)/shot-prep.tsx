// Route: /(app)/shot-prep
// Shot Day Prep Checklist — pharmacist-authored injection day checklist.
// Route registered in _layout.tsx as href:null (do NOT add it again).

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { format } from 'date-fns';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { ChecklistItemRow } from '@/components/shot-prep/checklist-item-row';
import { useShotDayPrep } from '@/features/shot-prep/hooks';
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/features/shot-prep/checklist-data';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

export default function ShotPrepScreen() {
  const { colors, spacing, radius, shadows, gradients } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const { completedItems, completedCount, totalCount, isDone, isLoading, toggleItem } =
    useShotDayPrep(today);

  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      {/* Gradient header */}
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => { haptics.tap(); router.back(); }}
            hitSlop={8}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backChevron}>&#x2039;</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('shotPrep.title')}</Text>
          <View style={styles.rxBadge}>
            <Text style={styles.rxBadgeText}>Rx</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          {t('shotPrep.subtitle')}
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress strip */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {isDone
                ? t('shotPrep.progressAllDone')
                : t('shotPrep.progressInProgress', { completed: completedCount, total: totalCount })}
            </Text>
            <Text style={styles.progressFraction}>{completedCount}/{totalCount}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct * 100}%`,
                  backgroundColor: isDone ? colors.success : colors.phaseInjectionDay,
                },
              ]}
            />
          </View>
        </View>

        {/* Done banner */}
        {isDone && (
          <View style={styles.doneBanner}>
            <Text style={styles.doneCheck}>&#x2713;</Text>
            <View style={styles.doneTextBlock}>
              <Text style={styles.doneTitle}>{t('shotPrep.doneBannerTitle')}</Text>
              <Text style={styles.doneBody}>{t('shotPrep.doneBannerBody')}</Text>
            </View>
          </View>
        )}

        {/* Checklist card */}
        <View style={styles.checklistCard}>
          {CHECKLIST_ITEMS.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              isChecked={completedItems.includes(item.id)}
              onToggle={() => {
                if (!isLoading) {
                  haptics.tap();
                  toggleItem(item.id);
                }
              }}
            />
          ))}
        </View>

        {/* Rule 8: tier-2 disclaimer for pharmacist-authored educational content */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            {t('shotPrep.disclaimer')}
          </Text>
        </DisclaimerBanner>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
}

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: spacing.xxl },

    heroGradient: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    backButton: {
      marginRight: spacing.sm,
    },
    backChevron: {
      fontSize: 28,
      fontWeight: '300',
      color: colors.white,
      lineHeight: 32,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '800',
      color: colors.white,
    },
    rxBadge: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    rxBadgeText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 20,
    },

    progressCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      ...shadows.sm,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    progressLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    progressFraction: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    progressTrack: {
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.gray100,
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      borderRadius: radius.full,
    },

    doneBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      backgroundColor: colors.successLight,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.success,
      padding: spacing.md,
      gap: spacing.md,
    },
    doneCheck: {
      fontSize: 24,
      color: colors.success,
      fontWeight: '700',
    },
    doneTextBlock: {
      flex: 1,
    },
    doneTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.success,
      marginBottom: 2,
    },
    doneBody: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    checklistCard: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      overflow: 'hidden',
      ...shadows.sm,
    },

    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
}
