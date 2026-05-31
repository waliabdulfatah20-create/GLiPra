import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock supabase so no React Native or network imports are pulled in.
vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const { supabase } = await import('@/lib/supabase');
const { exportUserData, deleteAccount } = await import('@/features/account/api');

const invoke = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;

describe('exportUserData', () => {
  beforeEach(() => invoke.mockReset());

  it('returns the json string on success', async () => {
    invoke.mockResolvedValue({ data: { json: '{"ok":true}' }, error: null });
    const result = await exportUserData();
    expect(result).toBe('{"ok":true}');
    expect(invoke).toHaveBeenCalledWith('export-user-data', { body: {} });
  });

  it('throws on edge function error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(exportUserData()).rejects.toThrow('boom');
  });

  it('throws when the response shape is unexpected', async () => {
    invoke.mockResolvedValue({ data: {}, error: null });
    await expect(exportUserData()).rejects.toThrow('Unexpected response');
  });
});

describe('deleteAccount', () => {
  beforeEach(() => invoke.mockReset());

  it('resolves when the server reports success', async () => {
    invoke.mockResolvedValue({ data: { success: true }, error: null });
    await expect(deleteAccount()).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('delete-user-account', { body: {} });
  });

  it('throws on edge function error', async () => {
    invoke.mockResolvedValue({ data: null, error: { message: 'nope' } });
    await expect(deleteAccount()).rejects.toThrow('nope');
  });

  it('throws when the success flag is missing', async () => {
    invoke.mockResolvedValue({ data: {}, error: null });
    await expect(deleteAccount()).rejects.toThrow('did not complete');
  });
});
