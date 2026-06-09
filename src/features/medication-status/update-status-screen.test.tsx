import { router } from 'expo-router';

/**
 * UpdateStatusScreen — jest-expo RTL tests.
 *
 * Saving writes BOTH medication_status and the derived `phase` column. With
 * maintenance + discontinued removed, phase is always 'weight_loss', and a
 * stale 'maintenance' row self-corrects on the next save.
 */
import * as React from 'react';
import { useTodayProfile } from '@/features/today/hooks';
import { supabase } from '@/lib/supabase';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import { UpdateStatusScreen } from './update-status-screen';

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

function setStatus(medicationStatus: string) {
  mockUseTodayProfile.mockReturnValue({ data: { medicationStatus } });
}

async function selectAndSave(label: string) {
  fireEvent.press(screen.getByLabelText(label));
  fireEvent.press(screen.getByLabelText('Save status'));
  await waitFor(() => expect(router.back).toHaveBeenCalled());
  return (supabase.from as jest.Mock).mock.results.at(-1)!.value.update as jest.Mock;
}

describe('update status', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('writes weight_loss phase when switching from starting to active', async () => {
    setStatus('starting');
    render(<UpdateStatusScreen />);
    const update = await selectAndSave('Active');
    expect(update).toHaveBeenCalledWith({ medication_status: 'active', phase: 'weight_loss' });
  });

  it('self-corrects a stale maintenance row to weight_loss when switching to active', async () => {
    // Mocks the hook directly with a legacy value. In production fetchTodayProfile
    // also normalizes such rows to 'active'; this guards the save path either way.
    setStatus('maintenance');
    render(<UpdateStatusScreen />);
    const update = await selectAndSave('Active');
    expect(update).toHaveBeenCalledWith({ medication_status: 'active', phase: 'weight_loss' });
  });
});
