import type { ConfigContext, ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import { withGradleProperties } from '@expo/config-plugins';

import 'tsx/cjs';

// adding lint exception as we need to import tsx/cjs before env.ts is imported
// eslint-disable-next-line perfectionist/sort-imports
import Env from './env';

const EXPO_ACCOUNT_OWNER = 'waliabdul';
const EAS_PROJECT_ID = '046b4b41-452b-4b54-94ae-9ab38736222c';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.EXPO_PUBLIC_APP_ENV !== 'production',
  badges: [
    {
      text: Env.EXPO_PUBLIC_APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.EXPO_PUBLIC_VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const appConfig: ExpoConfig = {
    ...config,
    name: Env.EXPO_PUBLIC_NAME,
    description:
      'Glipra is a GLP-1 nutrition companion designed by a licensed pharmacist. Track protein to protect muscle while GLP-1 does its job, log meals by photo or voice, watch key micronutrients, and prepare for prescriber visits.',
    owner: EXPO_ACCOUNT_OWNER,
    scheme: Env.EXPO_PUBLIC_SCHEME,
    slug: 'glipra',
    version: Env.EXPO_PUBLIC_VERSION.toString(),
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    updates: {
      fallbackToCacheTimeout: 0,
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: Env.EXPO_PUBLIC_BUNDLE_ID,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    experiments: {
      typedRoutes: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#5b21b6',
      },
      package: Env.EXPO_PUBLIC_PACKAGE,
      // minSdkVersion 26 (required by react-native-health-link / Health Connect)
      // is applied via the withGradleProperties plugin at the end of this file —
      // the inline android.minSdkVersion field is not reliably honored by Expo.
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          backgroundColor: '#5b21b6',
          image: './assets/splash-icon.png',
          imageWidth: 150,
        },
      ],
      [
        'expo-font',
        {
          ios: {
            fonts: [
              'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
              'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
              'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
              'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
            ],
          },
          android: {
            fonts: [
              {
                fontFamily: 'Inter',
                fontDefinitions: [
                  {
                    path: 'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
                    weight: 400,
                  },
                  {
                    path: 'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
                    weight: 500,
                  },
                  {
                    path: 'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
                    weight: 600,
                  },
                  {
                    path: 'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
                    weight: 700,
                  },
                ],
              },
            ],
          },
        },
      ],
      'expo-apple-authentication',
      'expo-localization',
      'expo-router',
      ['app-icon-badge', appIconBadgeConfig],
      ['react-native-edge-to-edge'],
      '@sentry/react-native',
      '@react-native-community/datetimepicker',
      'expo-notifications',
      [
        'expo-audio',
        {
          microphonePermission:
            'Glipra uses the microphone so you can log meals by voice.',
        },
      ],
      // Camera is used for barcode scanning (expo-camera CameraView) and food
      // photos (expo-image-picker launchCameraAsync). Both inject the same
      // NSCameraUsageDescription. No photo-library access (photosPermission:false)
      // and no camera mic/video, so the unused photo + audio permissions are dropped.
      [
        'expo-camera',
        {
          cameraPermission: 'Glipra uses the camera to scan barcodes and recognize food.',
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-image-picker',
        {
          cameraPermission: 'Glipra uses the camera to recognize food from photos.',
          photosPermission: false,
        },
      ],
      // Pin Android compile/target SDK to 36 for the Google Play 2026 gate.
      // minSdk 26 stays handled by the withGradleProperties plugin below.
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
    },
  };

  // react-native-health-link requires Health Connect API (minSdk >= 26).
  // android.minSdkVersion in app.config.ts is not reliably applied by
  // expo prebuild in EAS for SDK 54 / RN 0.81 — patch gradle.properties
  // directly via a config plugin, which is the authoritative source Gradle reads.
  return withGradleProperties(appConfig, (c) => {
    const idx = c.modResults.findIndex(
      item => item.type === 'property' && item.key === 'android.minSdkVersion',
    );
    if (idx !== -1) {
      // Overwrite existing value
      (c.modResults[idx] as { type: 'property'; key: string; value: string }).value = '26';
    }
    else {
      // Not present — add it
      c.modResults.push({ type: 'property', key: 'android.minSdkVersion', value: '26' });
    }
    return c;
  });
};
