import { router } from 'expo-router';

/**
 * DietaryPreferenceScreen — jest-expo RTL tests.
 *
 * The eating-style editor saves the chosen dietary_pattern straight to the
 * profiles row and invalidates the today-profile query (mirrors update-status).
 */
import * as React from 'react';
import { useTodayProfile } from '@/features/today/hooks';
import { supabase } from '@/lib/supabase';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import { DietaryPreferenceScreen } from './dietary-preference-screen';

jest.mock('@/features/today/hooks');
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('@/features/auth/use-auth-store', () => ({
  useAuthStore: { use: { session: () => ({ user: { id: 'u1' } }) } },
}));
jest.mock('@/lib/haptics', () => ({
  haptics: { medium: jest.fn(), selection: jest.fn(), tap: jest.fn() },
}));
jest.mock('@/lib/supabase', () => {
  const eq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ update }));
  return { supabase: { from } };
});

const mockUseTodayProfile = useTodayProfile as jest.Mock;

describe('dietary preference', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the dietary options', () => {
    mockUseTodayProfile.mockReturnValue({ data: { dietaryPattern: null } });
    render(<DietaryPreferenceScreen />);
    expect(screen.getByLabelText('dietary.opt_omnivore')).toBeTruthy();
    expect(screen.getByLabelText('dietary.opt_vegan')).toBeTruthy();
  });

  it('does not save while nothing is selected', () => {
    mockUseTodayProfile.mockReturnValue({ data: { dietaryPattern: null } });
    render(<DietaryPreferenceScreen />);
    fireEvent.press(screen.getByLabelText('dietary.save'));
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('selecting an option and saving writes dietary_pattern and navigates back', async () => {
    mockUseTodayProfile.mockReturnValue({ data: { dietaryPattern: null } });
    render(<DietaryPreferenceScreen />);
    fireEvent.press(screen.getByLabelText('dietary.opt_vegan'));
    fireEvent.press(screen.getByLabelText('dietary.save'));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    const update = (supabase.from as jest.Mock).mock.results.at(-1)!.value.update as jest.Mock;
    expect(update).toHaveBeenCalledWith({ dietary_pattern: 'vegan' });
  });

  it('pre-selects the existing dietary pattern', () => {
    mockUseTodayProfile.mockReturnValue({ data: { dietaryPattern: 'vegetarian' } });
    render(<DietaryPreferenceScreen />);
    expect(
      screen.getByLabelText('dietary.opt_vegetarian').props.accessibilityState,
    ).toEqual({ checked: true });
  });
});
