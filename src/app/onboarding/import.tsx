import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { StepProgress } from '@/features/onboarding/components/step-progress';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

type ImportOption = {
  id: string;
  name: string;
  description: string;
};

const IMPORT_OPTIONS: ImportOption[] = [
  {
    id: 'myfitnesspal',
    name: 'MyFitnessPal',
    description: 'Import your food log history',
  },
  {
    id: 'apple_health',
    name: 'Apple Health',
    description: 'Sync weight and nutrition data',
  },
  {
    id: 'shotsy',
    name: 'Shotsy',
    description: 'Import your injection history',
  },
];

export default function ImportScreen() {
  const router = useRouter();
  const { colors, spacing, radius, shadows, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows, gradients],
  );

  const handleConnect = (option: ImportOption) => {
    Alert.alert(
      'Coming Soon',
      `${option.name} integration is coming soon - we're working on it!`,
      [{ text: 'OK' }],
    );
  };

  const handleSkip = () => {
    haptics.medium();
    router.push('/onboarding/reveal');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: gradients.hero[0] }]}
      edges={['top', 'bottom']}
    >
      <StepProgress current={9} total={10} onDark />

      {/* Back arrow in header area */}
      <View style={styles.backHeader}>
        <Pressable
          style={styles.backArrow}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrowText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heading}>Import your history</Text>
          <Text style={styles.subheading}>
            Already tracking somewhere else? Import to hit the ground running.
          </Text>
        </LinearGradient>

        {IMPORT_OPTIONS.map((option) => (
          <View key={option.id} style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{option.name}</Text>
              <Text style={styles.cardDescription}>{option.description}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.connectButton, pressed && styles.connectButtonPressed]}
              onPress={() => handleConnect(option)}
              accessibilityRole="button"
              accessibilityLabel={`Connect ${option.name}`}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </Pressable>
          </View>
        ))}

        {/* Skip link */}
        <Pressable
          style={({ pressed }) => [styles.skipLink, pressed && styles.skipLinkPressed]}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip import and continue"
        >
          <Text style={styles.skipLinkText}>Skip for now →</Text>
        </Pressable>
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
    container: { flex: 1, backgroundColor: colors.background },

    // Back header — transparent to blend with gradient background
    backHeader: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
    },
    backArrow: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
    },
    backArrowText: {
      fontSize: 15,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.9)',
    },

    scroll: { flex: 1 },
    scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    heroGradient: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl + spacing.sm,
      marginTop: -spacing.lg,
      marginHorizontal: -spacing.lg,
      marginBottom: spacing.lg,
    },

    heading: {
      fontSize: 24,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: spacing.sm,
    },
    subheading: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.8)',
      lineHeight: 22,
    },

    // Import option card
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...shadows.sm,
    },
    cardContent: {
      flex: 1,
      marginRight: spacing.md,
    },
    cardName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    cardDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // Connect button (outline style)
    connectButton: {
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
    },
    connectButtonPressed: {
      backgroundColor: colors.primaryLight,
    },
    connectButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },

    // Skip link
    skipLink: {
      alignSelf: 'center',
      marginTop: spacing.xl,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    skipLinkPressed: {
      opacity: 0.6,
    },
    skipLinkText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
