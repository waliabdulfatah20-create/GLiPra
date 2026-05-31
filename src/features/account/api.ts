// Account API — GDPR data export + account deletion.
// Both call Supabase edge functions; no OpenAI involved, so no mock gate.

import { supabase } from '@/lib/supabase';

/**
 * Calls the export-user-data edge function and returns the user's full data
 * bundle as a JSON string (ready to write to a file and share).
 * Throws on failure.
 */
export async function exportUserData(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('export-user-data', {
    body: {},
  });

  if (error) {
    throw new Error(error.message ?? 'Export failed');
  }

  const json = (data as { json?: string })?.json;
  if (typeof json !== 'string') {
    throw new TypeError('Unexpected response from export function');
  }

  return json;
}

/**
 * Calls the delete-user-account edge function. The server permanently deletes
 * the auth user; FK cascade removes all of the user's data. Irreversible.
 * Throws on failure.
 */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-user-account', {
    body: {},
  });

  if (error) {
    throw new Error(error.message ?? 'Account deletion failed');
  }

  if (!(data as { success?: boolean })?.success) {
    throw new Error('Account deletion did not complete');
  }
}
