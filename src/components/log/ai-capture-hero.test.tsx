/**
 * AiCaptureHero — jest-expo RTL tests. Queried via testID (i18n resolution is
 * inconsistent in the test env). VoiceCaptureButton is stubbed so the recording
 * branch is observable without the native audio recorder.
 */
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { AiCaptureHero } from './ai-capture-hero';

jest.mock('@/features/subscription/use-subscription', () => ({
  useSubscription: () => ({ isPro: true }),
}));
jest.mock('@/lib/haptics', () => ({ haptics: { medium: jest.fn() } }));
jest.mock('@/components/log/voice-capture-button', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    VoiceCaptureButton: () => ReactLib.createElement(Text, { testID: 'voice-recording' }, 'recording'),
  };
});
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  launchCameraAsync: jest.fn(),
}));

function noop() {}

function setup(overrides: Record<string, unknown> = {}) {
  return render(
    <AiCaptureHero
      onAudioCaptured={noop}
      onImageSelected={noop}
      isLoadingVoice={false}
      isLoadingPhoto={false}
      {...overrides}
    />,
  );
}

describe('ai capture hero', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the Speak and Snap halves plus the PRO pill when idle', () => {
    setup();
    expect(screen.getByTestId('ai-hero-speak')).toBeTruthy();
    expect(screen.getByTestId('ai-hero-snap')).toBeTruthy();
    expect(screen.getByText('PRO')).toBeTruthy();
  });

  it('flips to the recording view when Speak is tapped (Pro)', () => {
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-speak'));
    expect(screen.getByTestId('voice-recording')).toBeTruthy();
    expect(screen.queryByTestId('ai-hero-speak')).toBeNull();
  });

  it('requests camera permission when Snap is tapped', () => {
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-snap'));
    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
  });

  it('shows neither half nor the recording view while analyzing', () => {
    setup({ isLoadingVoice: true });
    expect(screen.queryByTestId('ai-hero-speak')).toBeNull();
    expect(screen.queryByTestId('voice-recording')).toBeNull();
  });
});
