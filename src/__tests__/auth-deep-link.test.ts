import { describe, expect, it } from 'vitest';
import { parseAuthRedirect } from '@/features/auth/deep-link';

describe('parseAuthRedirect', () => {
  it('extracts session tokens and type from a recovery fragment', () => {
    const url = 'glipra://reset-password#access_token=abc123&refresh_token=def456&type=recovery&expires_in=3600';
    expect(parseAuthRedirect(url)).toEqual({
      kind: 'session',
      accessToken: 'abc123',
      refreshToken: 'def456',
      type: 'recovery',
    });
  });

  it('extracts signup-confirmation tokens', () => {
    const url = 'glipra://#access_token=tok&refresh_token=ref&type=signup';
    const result = parseAuthRedirect(url);
    expect(result).toMatchObject({ kind: 'session', type: 'signup' });
  });

  it('returns an error payload for an expired link', () => {
    const url = 'glipra://reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    expect(parseAuthRedirect(url)).toEqual({
      kind: 'error',
      errorCode: 'otp_expired',
      errorDescription: 'Email link is invalid or has expired',
    });
  });

  it('returns null for an ordinary deep link with no fragment', () => {
    expect(parseAuthRedirect('glipra://log?scrollTo=micros')).toBeNull();
  });

  it('returns null when the fragment carries no tokens', () => {
    expect(parseAuthRedirect('glipra://reset-password#foo=bar')).toBeNull();
  });

  it('does not treat query-string tokens as a session (tokens live in the fragment)', () => {
    expect(parseAuthRedirect('glipra://reset-password?access_token=x&refresh_token=y')).toBeNull();
  });

  it('returns null for null/undefined/empty input', () => {
    expect(parseAuthRedirect(null)).toBeNull();
    expect(parseAuthRedirect(undefined)).toBeNull();
    expect(parseAuthRedirect('')).toBeNull();
  });

  it('requires both access and refresh tokens', () => {
    expect(parseAuthRedirect('glipra://reset-password#access_token=only')).toBeNull();
  });
});
