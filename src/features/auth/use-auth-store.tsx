import type { Session } from '@supabase/supabase-js';

import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { createSelectors } from '@/lib/utils';

type AuthState = {
  session: Session | null;
  status: 'idle' | 'signIn' | 'signOut';
  setSession: (session: Session | null) => void;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};

const _useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  session: null,

  setSession: (session) => {
    set({
      session,
      status: session !== null ? 'signIn' : 'signOut',
    });
  },

  hydrate: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    get().setSession(session);
  },

  signOut: async () => {
    await supabase.auth.signOut();
    // Supabase fires onAuthStateChange(SIGNED_OUT) → root layout calls setSession(null)
    // Store updates automatically — no manual setState here.
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

// Module-level action exports for use outside components
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
export const setSession = (session: Session | null) =>
  _useAuthStore.getState().setSession(session);
