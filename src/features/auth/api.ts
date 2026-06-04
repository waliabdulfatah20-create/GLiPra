// src/features/auth/api.ts
// Pure async wrappers around Supabase auth. All return { error: string | null }.
// Callers handle errors uniformly — no throws escape this module.

import * as AppleAuthentication from 'expo-apple-authentication';

import { supabase } from '@/lib/supabase';

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null; needsEmailConfirmation: boolean; userId?: string }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error)
    return { error: error.message, needsEmailConfirmation: false };
  const needsEmailConfirmation = data.session === null;
  return { error: null, needsEmailConfirmation, userId: data.user?.id };
}

export async function signInWithApple(): Promise<{ error: string | null }> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
    });
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',

      token: credential.identityToken!,
    });
    return { error: error?.message ?? null };
  }
  catch (e: any) {
    // User tapped Cancel — not an error
    if (e.code === 'ERR_REQUEST_CANCELED')
      return { error: null };
    return { error: (e as Error).message ?? 'Apple Sign In failed' };
  }
}

export async function sendPasswordResetEmail(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'dosepath://reset-password',
  });
  return { error: error?.message ?? null };
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  // onAuthStateChange(SIGNED_OUT) fires → store updates automatically
}
