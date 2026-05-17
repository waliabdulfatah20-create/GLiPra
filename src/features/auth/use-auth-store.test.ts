import type { Session } from '@supabase/supabase-js';

// Mock supabase BEFORE importing the store
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { useAuthStore } from './use-auth-store';

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockSignOut = supabase.auth.signOut as jest.Mock;

// Fake session object (only the fields the store cares about)
const fakeSession: Session = {
  access_token: 'fake-access-token',
  refresh_token: 'fake-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
};

beforeEach(() => {
  // Reset store to initial state between tests
  useAuthStore.setState({ status: 'idle', session: null });
  jest.clearAllMocks();
});

describe('useAuthStore', () => {
  describe('setSession', () => {
    it('sets status to signIn when session is non-null', () => {
      useAuthStore.getState().setSession(fakeSession);
      expect(useAuthStore.getState().status).toBe('signIn');
      expect(useAuthStore.getState().session).toBe(fakeSession);
    });

    it('sets status to signOut when session is null', () => {
      // Start in signIn state
      useAuthStore.setState({ status: 'signIn', session: fakeSession });
      useAuthStore.getState().setSession(null);
      expect(useAuthStore.getState().status).toBe('signOut');
      expect(useAuthStore.getState().session).toBeNull();
    });
  });

  describe('hydrate', () => {
    it('calls supabase.auth.getSession and sets session when session exists', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: fakeSession },
        error: null,
      });
      await useAuthStore.getState().hydrate();
      expect(mockGetSession).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().status).toBe('signIn');
      expect(useAuthStore.getState().session).toBe(fakeSession);
    });

    it('calls supabase.auth.getSession and sets signOut when no session', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });
      await useAuthStore.getState().hydrate();
      expect(useAuthStore.getState().status).toBe('signOut');
      expect(useAuthStore.getState().session).toBeNull();
    });
  });

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });
      await useAuthStore.getState().signOut();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
