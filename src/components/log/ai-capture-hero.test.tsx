/**
 * AiCaptureHero — jest-expo RTL tests. Queried via testID (i18n resolution is
 * inconsistent in the test env). VoiceCaptureButton is stubbed so the recording
 * branch is observable without the native audio recorder.
 */
import * as ImagePicker from 'expo-image-picker';
import * as React from 'react';

import { presentPaywall } from '@/features/subscription/present-paywall';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { AiCaptureHero } from './ai-capture-hero';

const mockIsPro = jest.fn(() => true);
jest.mock('@/features/subscription/use-subscription', () => ({
  useSubscription: () => ({ isPro: mockIsPro() }),
}));
jest.mock('@/features/subscription/present-paywall', () => ({ presentPaywall: jest.fn() }));
jest.mock('@/lib/haptics', () => ({ haptics: { medium: jest.fn(), tap: jest.fn() } }));

// Permission disclosure: default to "already seen" so the gate passes straight
// through (existing tests assert the OS prompt / recording directly). Individual
// tests flip mockHasSeen to false to exercise the disclosure.
const mockHasSeen = jest.fn((_kind: string) => true);
const mockMarkSeen = jest.fn();
jest.mock('@/features/permissions/use-permission-disclosure', () => ({
  usePermissionDisclosure: () => ({
    isLoading: false,
    hasSeen: mockHasSeen,
    markSeen: mockMarkSeen,
  }),
}));
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
    mockIsPro.mockReturnValue(true); // restore default (clearAllMocks keeps impl)
    mockHasSeen.mockReturnValue(true); // restore default: disclosure already seen
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

  it('opens the paywall (not recording) when a free user taps Speak', () => {
    mockIsPro.mockReturnValue(false);
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-speak'));
    expect(presentPaywall).toHaveBeenCalledWith('Voice logging');
    expect(screen.queryByTestId('voice-recording')).toBeNull();
  });

  it('opens the paywall (no camera) when a free user taps Snap', () => {
    mockIsPro.mockReturnValue(false);
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-snap'));
    expect(presentPaywall).toHaveBeenCalledWith('AI photo recognition');
    expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });

  it('shows the camera disclosure on first Snap, not the OS prompt', () => {
    mockHasSeen.mockReturnValue(false);
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-snap'));
    expect(screen.getByTestId('permission-disclosure')).toBeTruthy();
    expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
  });

  it('continuing the camera disclosure marks it seen and launches the camera', () => {
    mockHasSeen.mockReturnValue(false);
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-snap'));
    fireEvent.press(screen.getByTestId('perm-disclosure-continue'));
    expect(mockMarkSeen).toHaveBeenCalledWith('camera');
    expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
  });

  it('cancelling the disclosure does nothing', () => {
    mockHasSeen.mockReturnValue(false);
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-snap'));
    fireEvent.press(screen.getByTestId('perm-disclosure-cancel'));
    expect(mockMarkSeen).not.toHaveBeenCalled();
    expect(ImagePicker.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId('ai-hero-snap')).toBeTruthy();
  });

  it('shows the mic disclosure on first Speak and does not mount the recorder', () => {
    mockHasSeen.mockReturnValue(false);
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-speak'));
    expect(screen.getByTestId('permission-disclosure')).toBeTruthy();
    expect(screen.queryByTestId('voice-recording')).toBeNull();
  });

  it('continuing the mic disclosure flips to the recording view', () => {
    mockHasSeen.mockReturnValue(false);
    setup();
    fireEvent.press(screen.getByTestId('ai-hero-speak'));
    fireEvent.press(screen.getByTestId('perm-disclosure-continue'));
    expect(mockMarkSeen).toHaveBeenCalledWith('microphone');
    expect(screen.getByTestId('voice-recording')).toBeTruthy();
  });
});
