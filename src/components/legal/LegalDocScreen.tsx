import type { GlipraTokens } from '@/theme/tokens';
/**
 * LegalDocScreen — reusable full-screen component for displaying legal documents.
 * Used by /legal/privacy-policy and /legal/terms-of-service routes.
 */
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/ThemeContext';

export type LegalSection = {
  heading: string;
  body: string;
};

type LegalDocScreenProps = {
  title: string;
  effectiveDate: string;
  intro?: string;
  sections: LegalSection[];
};

export function LegalDocScreen({ title, effectiveDate, intro, sections }: LegalDocScreenProps) {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.docTitle}>{title}</Text>
          <Text style={styles.effectiveDate}>{effectiveDate}</Text>
          {intro ? <Text style={styles.intro}>{intro}</Text> : null}
        </View>

        {/* Sections */}
        {sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        {/* Footer note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Glipra is a product of Leonava. For questions, contact legal@glipra.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      width: 60,
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // Content
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    titleBlock: {
      marginBottom: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    docTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: spacing.xs,
    },
    effectiveDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    intro: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      fontStyle: 'italic',
    },

    // Sections
    section: {
      marginBottom: spacing.lg,
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    sectionBody: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    // Footer
    footer: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
