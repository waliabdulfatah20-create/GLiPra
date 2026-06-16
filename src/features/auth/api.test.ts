/**
 * signInWithApple — jest-expo tests for the H10 apple-link wiring. The native
 * Apple module and the Supabase client are mocked, so we assert the
 * fire-and-forget apple-link behavior without a device. (This file is jest-only:
 * it imports the native expo-apple-authentication module, which vitest can't load,
 * and it is outside vitest's include allowlist.)
 */

const mockSignInAsync = jest.fn();
jest.mock('expo-apple-authentication', () => ({
  signInAsync: (...args: unknown[]) => mockSignInAsync(...args),
  AppleAuthenticationScope: { EMAIL: 'EMAIL', FULL_NAME: 'FULL_NAME' },
}));

jest.mock('expo-linking', () => ({ createURL: (path: string) => `glipra://${path}` }));

const mockSignInWithIdToken = jest.fn();
const mockInvoke = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signInWithIdToken: (...a: unknown[]) => mockSignInWithIdToken(...a) },
    functions: { invoke: (...a: unknown[]) => mockInvoke(...a) },
  },
}));

// eslint-disable-next-line import/first
import { signInWithApple } from './api';

describe('signInWithApple — apple-link wiring (H10)', () => {
  afterEach(() => jest.clearAllMocks());

  it('fires apple-link with the authorizationCode on success', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'id', authorizationCode: 'code123' });
    mockSignInWithIdToken.mockResolvedValue({ error: null });
    mockInvoke.mockResolvedValue({ data: { linked: true }, error: null });

    const res = await signInWithApple();

    expect(res).toEqual({ error: null });
    expect(mockInvoke).toHaveBeenCalledWith('apple-link', {
      body: { authorizationCode: 'code123' },
    });
  });

  it('does NOT fire apple-link when the Supabase sign-in errors', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'id', authorizationCode: 'code123' });
    mockSignInWithIdToken.mockResolvedValue({ error: { message: 'bad token' } });

    const res = await signInWithApple();

    expect(res).toEqual({ error: 'bad token' });
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('does NOT fire apple-link when no authorizationCode is present', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'id', authorizationCode: null });
    mockSignInWithIdToken.mockResolvedValue({ error: null });

    const res = await signInWithApple();

    expect(res).toEqual({ error: null });
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('still succeeds when apple-link rejects (fire-and-forget)', async () => {
    mockSignInAsync.mockResolvedValue({ identityToken: 'id', authorizationCode: 'code123' });
    mockSignInWithIdToken.mockResolvedValue({ error: null });
    mockInvoke.mockRejectedValue(new Error('network'));

    const res = await signInWithApple();

    expect(res).toEqual({ error: null });
  });

  it('returns no error and calls nothing when the user cancels', async () => {
    mockSignInAsync.mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });

    const res = await signInWithApple();

    expect(res).toEqual({ error: null });
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
    expect(mockInvoke).not.toHaveBeenCalled();
  });
});
