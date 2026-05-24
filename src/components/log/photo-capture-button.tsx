import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ProGate } from '@/features/subscription/pro-gate';
import { colors, radius, spacing } from '@/theme/colors';

export interface PhotoCaptureButtonProps {
  onImageSelected: (
    base64: string,
    mimeType: 'image/jpeg' | 'image/png',
  ) => void;
  isLoading: boolean;
}

export function PhotoCaptureButton({
  onImageSelected,
  isLoading,
}: PhotoCaptureButtonProps) {
  async function handlePress() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera permission required',
        'Glipra needs camera access to recognise food from photos.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) return;

    const mimeType: 'image/jpeg' | 'image/png' =
      asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg';

    onImageSelected(asset.base64, mimeType);
  }

  return (
    <ProGate featureName="AI Photo Recognition">
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePress}
          disabled={isLoading}
          accessibilityLabel="Take a photo to recognise food"
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              <Text style={styles.icon}>📷</Text>
              <Text style={styles.label}>Scan food with camera</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ProGate>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: colors.gray300,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
