// Account hooks — thin useState wrappers around the export/delete API calls.
// Mirrors the useGeneratePdf pattern in src/features/visit-prep/hooks.ts.

import { useState } from 'react';

import { deleteAccount, exportUserData } from './api';

export type UseExportDataResult = {
  /** Runs the export and resolves to the JSON string, or null on error. */
  run: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
};

export function useExportData(): UseExportDataResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await exportUserData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { run, isLoading, error };
}

export type UseDeleteAccountResult = {
  /** Runs the deletion and resolves true on success, false on error. */
  run: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
};

export function useDeleteAccount(): UseDeleteAccountResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteAccount();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { run, isLoading, error };
}
