import { router } from 'expo-router';

/**
 * ProteinTargetEditor — jest-expo RTL tests.
 *
 * Units are forced to kg + metric so the seeded values and recomputed floor are
 * deterministic. i18n returns keys in the test env, so copy assertions use keys.
 */
import * as React from 'react';
import { useTodayProfile } from '@/features/today/hooks';
import { supabase } from '@/lib/supabase';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import { ProteinTargetEditor } from './protein-target-editor';

jest.mock('@/features/today/hooks');
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: { use: { session: () => ({ user: { id: 'u1' } }) } },
}));
jest.mock('@/lib/haptics', () => ({
  haptics: { medium: jest.fn(), selection: jest.fn(), tap: jest.fn(), warning: jest.fn() },
}));
// Mutable so a test can exercise the "units not loaded yet" hydration gate.
let mockUnitsLoaded = true;
jest.mock('@/lib/unit-preference', () => ({
  ...jest.requireActual('@/lib/unit-preference'),
  useWeightUnit: () => ({ unit: 'kg', toggle: jest.fn(), loaded: mockUnitsLoaded }),
  useHeightUnit: () => ({ unit: 'metric', toggle: jest.fn(), loaded: mockUnitsLoaded }),
}));
jest.mock('@/lib/supabase', () => {
  const eq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ update }));
  return { supabase: { from } };
});

const mockUseTodayProfile = useTodayProfile as jest.Mock;

const COMPLETE_PROFILE = {
  weightKg: 80,
  heightCm: 175,
  activityLevel: 'moderate' as const,
  hasKidneyDisease: false,
  isPregnant: false,
  phase: 'weight_loss' as const,
  medicationStatus: 'active' as const,
  proteinFloorG: 112,
};

function setProfile(overrides: Record<string, unknown> = {}) {
  mockUseTodayProfile.mockReturnValue({ data: { ...COMPLETE_PROFILE, ...overrides } });
}

describe('protein target editor', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    mockUnitsLoaded = true;
  });

  it('renders a live floor for a complete profile (80kg x 1.4 = 112g)', () => {
    setProfile();
    render(<ProteinTargetEditor />);
    expect(screen.getByTestId('protein-target-editor')).toBeTruthy();
    expect(screen.getByText('112g')).toBeTruthy();
  });

  it('always shows the Rule-5 disclaimer and acknowledgment', () => {
    setProfile();
    render(<ProteinTargetEditor />);
    expect(screen.getByText('protein_target.disclaimer')).toBeTruthy();
    expect(screen.getByText('protein_target.acknowledge')).toBeTruthy();
  });

  it('keeps Save disabled until the estimate is acknowledged', () => {
    setProfile();
    render(<ProteinTargetEditor />);
    expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('acknowledge-checkbox'));
    expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(false);
  });

  it('recomputes the floor live when weight changes (100kg x 1.4 = 140g)', () => {
    setProfile();
    render(<ProteinTargetEditor />);
    fireEvent.changeText(screen.getByTestId('weight-input'), '100');
    expect(screen.getByText('140g')).toBeTruthy();
  });

  it('persists the floor on Save after acknowledging', async () => {
    setProfile();
    render(<ProteinTargetEditor />);
    fireEvent.press(screen.getByTestId('acknowledge-checkbox'));
    fireEvent.press(screen.getByTestId('save-button'));

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    const updateFn = (supabase.from as jest.Mock).mock.results.at(-1)!.value.update as jest.Mock;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ protein_floor_g: 112, has_kidney_disease: false, is_pregnant: false }),
    );
  });

  it('shows no floor and disables Save when body inputs are missing', () => {
    setProfile({ weightKg: null, proteinFloorG: null });
    render(<ProteinTargetEditor />);
    expect(screen.queryByTestId('protein-floor-result')).toBeNull();
    expect(screen.getByText('protein_target.result_hint')).toBeTruthy();
    expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(true);
  });

  it('does not seed inputs until the unit preferences have loaded (no race)', () => {
    // Units not yet loaded from AsyncStorage -> hydration is gated, so the
    // complete profile must NOT seed a (potentially wrong-unit) value yet.
    mockUnitsLoaded = false;
    setProfile();
    render(<ProteinTargetEditor />);
    expect(screen.queryByTestId('protein-floor-result')).toBeNull();
    expect(screen.getByTestId('save-button').props.accessibilityState.disabled).toBe(true);
  });
});
