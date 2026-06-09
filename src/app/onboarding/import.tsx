import type { GlipraTokens } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { OnboardingScaffold } from '@/features/onboarding/components/onboarding-scaffold';
import { StepFooter } from '@/features/onboarding/components/step-footer';
import { useTheme } from '@/lib/ThemeContext';

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
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const handleConnect = (option: ImportOption) => {
    Alert.alert(
      'Coming Soon',
      `${option.name} integration is coming soon - we're working on it!`,
      [{ text: 'OK' }],
    );
  };

  const handleSkip = () => {
    router.push('/onboarding/reveal');
  };

  return (
    <OnboardingScaffold
      step={{ current: 9, total: 10 }}
      title="Import your history"
      subtitle="Already tracking somewhere else? Import to hit the ground running."
      footer={(
        <StepFooter
          primaryLabel="Skip for now"
          onPrimary={handleSkip}
          secondaryLabel="Back"
          onSecondary={() => router.back()}
        />
      )}
    >
      {IMPORT_OPTIONS.map(option => (
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
    </OnboardingScaffold>
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
    // Import option card
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
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
  });
}
