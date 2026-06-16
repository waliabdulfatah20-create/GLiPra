// _shared/apple.ts — Apple "Sign in with Apple" server helpers for token
// revocation on account deletion (App Store guideline 5.1.1(v)).
//
// Everything here is GATED on getAppleConfig() returning non-null. Until Apple
// Developer enrollment (#87) sets the four APPLE_* secrets, getAppleConfig()
// returns null and every caller no-ops cleanly.
//
// Flow this supports:
//   1. exchangeAuthCode() — trade the one-time authorizationCode (from the native
//      Sign in with Apple credential) for a long-lived refresh_token.
//   2. revokeToken() — at account deletion, revoke that refresh_token so the
//      user's Apple ID grant is fully disconnected.
// Both authenticate to Apple with a short-lived ES256 client-secret JWT
// (makeClientSecret), signed with the .p8 private key via Web Crypto.
//
// NOTE (native SIWA): `client_id` is the app BUNDLE ID, not a web "Services ID".

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const APPLE_AUD = 'https://appleid.apple.com';

export type AppleConfig = {
  teamId: string; // APPLE_TEAM_ID    — 10-char Apple Team ID
  keyId: string; // APPLE_KEY_ID      — Key ID of the Sign in with Apple .p8 key
  clientId: string; // APPLE_CLIENT_ID — app Bundle ID for native SIWA
  privateKey: string; // APPLE_PRIVATE_KEY — full PKCS#8 PEM contents of the .p8
};

/**
 * The gate. Returns the Apple config only when ALL four secrets are present.
 * Null means "Apple not configured" -> callers skip every Apple step.
 */
export function getAppleConfig(): AppleConfig | null {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const clientId = Deno.env.get('APPLE_CLIENT_ID');
  const privateKey = Deno.env.get('APPLE_PRIVATE_KEY');
  if (!teamId || !keyId || !clientId || !privateKey)
    return null;
  // Survive secrets stored with escaped newlines.
  return { teamId, keyId, clientId, privateKey: privateKey.replace(/\\n/g, '\n') };
}

function base64url(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === 'string')
    bytes = new TextEncoder().encode(input);
  else if (input instanceof Uint8Array)
    bytes = input;
  else bytes = new Uint8Array(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const raw = atob(body);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Build + sign the Apple client-secret JWT (ES256). Short-lived (1h) since it is
 * minted per request. Web Crypto's ECDSA/SHA-256 returns raw r||s (64 bytes),
 * which is exactly the JOSE ES256 encoding — do NOT DER-encode it.
 */
export async function makeClientSecret(config: AppleConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: config.keyId, typ: 'JWT' };
  const claims = {
    iss: config.teamId,
    iat: now,
    exp: now + 3600,
    aud: APPLE_AUD,
    sub: config.clientId,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToPkcs8(config.privateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64url(sig)}`;
}

/**
 * Exchange the one-time authorizationCode for tokens. Apple returns a
 * refresh_token ONLY on the user's FIRST authorization for this app; on later
 * sign-ins it is absent. Returns the refresh_token, or null if Apple did not
 * issue one (caller must then NOT overwrite any stored token).
 */
export async function exchangeAuthCode(config: AppleConfig, code: string): Promise<string | null> {
  const clientSecret = await makeClientSecret(config);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
  });
  const res = await fetch(APPLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    console.error('apple exchangeAuthCode failed:', res.status, await res.text());
    return null;
  }
  const json = await res.json() as { refresh_token?: string };
  return json.refresh_token ?? null;
}

/**
 * Revoke an Apple refresh token. Throws on a non-2xx response so the caller can
 * log it (the deletion path swallows the error — deletion must succeed regardless).
 */
export async function revokeToken(config: AppleConfig, refreshToken: string): Promise<void> {
  const clientSecret = await makeClientSecret(config);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: clientSecret,
    token: refreshToken,
    token_type_hint: 'refresh_token',
  });
  const res = await fetch(APPLE_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok)
    throw new Error(`apple revoke failed: ${res.status} ${await res.text()}`);
}
