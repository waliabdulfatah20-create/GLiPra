// Pure parser for Supabase auth redirect deep links.
//
// Supabase implicit-flow email links (password recovery, signup confirmation,
// magic links) carry their payload in the URL *fragment*, not the query string:
//   glipra://reset-password#access_token=...&refresh_token=...&type=recovery
// Errors come back the same way:
//   glipra://reset-password#error=access_denied&error_code=otp_expired&error_description=...
//
// expo-linking's parse() does not surface fragment params, so we parse the
// fragment by hand here. Keeping it pure (string in, plain object out) makes the
// root layout's deep-link handler thin and lets us unit-test every branch.

export type AuthRedirectTokens = {
  kind: 'session';
  accessToken: string;
  refreshToken: string;
  /** Supabase link type: 'recovery' | 'signup' | 'magiclink' | 'invite' | 'email_change' | ... */
  type: string | null;
};

export type AuthRedirectError = {
  kind: 'error';
  errorCode: string | null;
  errorDescription: string | null;
};

export type AuthRedirectResult = AuthRedirectTokens | AuthRedirectError;

/**
 * Extract auth tokens (or an error) from a deep-link URL's fragment.
 * Returns null when the URL carries no auth payload (an ordinary deep link).
 */
export function parseAuthRedirect(url: string | null | undefined): AuthRedirectResult | null {
  if (!url)
    return null;

  const hashIndex = url.indexOf('#');
  if (hashIndex === -1)
    return null;

  const fragment = url.slice(hashIndex + 1);
  if (!fragment)
    return null;

  const params = new URLSearchParams(fragment);

  // Error payloads take precedence — a failed/expired link has no tokens.
  const error = params.get('error') ?? params.get('error_code');
  if (error !== null) {
    return {
      kind: 'error',
      errorCode: params.get('error_code') ?? params.get('error'),
      errorDescription: params.get('error_description'),
    };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    return {
      kind: 'session',
      accessToken,
      refreshToken,
      type: params.get('type'),
    };
  }

  return null;
}
