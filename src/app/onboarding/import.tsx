import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepProgress } from '@/features/onboarding/components/step-progress';
import { haptics } from '@/lib/haptics';
import { colors, radius, shadows, spacing } from '@/theme/colors';

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

  const handleConnect = (option: ImportOption) => {
    Alert.alert(
      'Coming Soon',
      `${option.name} integration is coming soon — we're working on it!`,
      [{ text: 'OK' }],
    );
  };

  const handleSkip = () => {
    haptics.medium();
    router.push('/onboarding/reveal');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StepProgress current={9} total={10} />

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
        <Text style={styles.heading}>Import your history</Text>
        <Text style={styles.subheading}>
          Already tracking somewhere else? Import to hit the ground running.
        </Text>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Back header
  backHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backArrow: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backArrowText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },

  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subheading: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
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
