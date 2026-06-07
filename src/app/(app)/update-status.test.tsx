import { router } from 'expo-router';

/**
 * UpdateStatusScreen — jest-expo RTL tests.
 *
 * Guards the regression where changing medication_status left the derived
 * `phase` column stale. Saving must write BOTH columns, with phase derived the
 * same way onboarding does.
 */
import * as React from 'react';
import { useTodayProfile } from '@/features/today/hooks';
import { supabase } from '@/lib/supabase';
import { cleanup, fireEvent, render, screen, waitFor } from '@/lib/test-utils';

import UpdateStatusScreen from './update-status';

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

  it('writes maintenance phase when switching to maintenance', async () => {
    setStatus('active');
    render(<UpdateStatusScreen />);
    const update = await selectAndSave('Maintenance');
    expect(update).toHaveBeenCalledWith({ medication_status: 'maintenance', phase: 'maintenance' });
  });

  it('writes maintenance phase when switching to tapering', async () => {
    setStatus('active');
    render(<UpdateStatusScreen />);
    const update = await selectAndSave('Tapering');
    expect(update).toHaveBeenCalledWith({ medication_status: 'tapering', phase: 'maintenance' });
  });

  it('writes weight_loss phase when switching back to active from maintenance', async () => {
    setStatus('maintenance');
    render(<UpdateStatusScreen />);
    const update = await selectAndSave('Active');
    expect(update).toHaveBeenCalledWith({ medication_status: 'active', phase: 'weight_loss' });
  });

  it('writes weight_loss phase for discontinued', async () => {
    setStatus('active');
    render(<UpdateStatusScreen />);
    const update = await selectAndSave('Discontinued');
    expect(update).toHaveBeenCalledWith({ medication_status: 'discontinued', phase: 'weight_loss' });
  });
});
