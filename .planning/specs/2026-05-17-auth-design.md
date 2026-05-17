# Auth Feature — Design Spec
**Date:** 2026-05-17  
**Feature:** Month 1 Item 1 — Auth (email + Apple Sign In)  
**Status:** Approved for implementation

---

## Overview

Full Supabase-backed authentication with a branded welcome screen, separate sign-in and sign-up screens, forgot/reset password flow, and Apple Sign In (iOS, availability-gated). Replaces the Obytes scaffold stub with real auth.

---

## Screen Structure

Six screens in a `(auth)/` route group located at `src/app/(auth)/`.

| Screen | File | Purpose |
|---|---|---|
| Auth Layout | `src/app/(auth)/_layout.tsx` | Redirects authenticated users to main app; no header |
| Welcome | `src/app/(auth)/welcome.tsx` | Branded entry point — Get Started / Sign In |
| Sign In | `src/app/(auth)/sign-in.tsx` | Email + password + Apple Sign In |
| Sign Up | `src/app/(auth)/sign-up.tsx` | Email + password + Apple Sign In |
| Forgot Password | `src/app/(auth)/forgot-password.tsx` | Send reset email |
| Reset Password | `src/app/(auth)/reset-password.tsx` | Deep link handler — set new password |

The existing `src/app/login.tsx`, `src/features/auth/login-screen.tsx`, and `src/features/auth/components/login-form.tsx` are deleted as part of this work.

The root `src/app/_layout.tsx` initial route changes from `(app)` to `(auth)` so unauthenticated users land on the welcome screen.

---

## Navigation Flow

```
App open
├── status === 'signIn'  →  (app)/ [main app, no change]
└── status !== 'signIn'  →  (auth)/welcome
    ├── "Get Started"    →  (auth)/sign-up
    │     └── success    →  onAuthStateChange fires → (app)/
    ├── "Sign In"        →  (auth)/sign-in
    │     ├── success    →  onAuthStateChange fires → (app)/
    │     └── "Forgot?"  →  (auth)/forgot-password
    │           └── email link  →  dosepath://reset-password
    │                             →  (auth)/reset-password
    │                                   └── success → (auth)/sign-in
    └── Apple Sign In    →  supabase.auth.signInWithIdToken → onAuthStateChange → (app)/
```

Post-auth routing (new vs returning users):
- For Month 1, both new and returning users go to `(app)/` on success.
- A `// TODO: route new users to consent flow (Month 1 Item 2)` comment marks the redirect point.

---

## Architecture

### Auth Store — `src/features/auth/use-auth-store.tsx`

Replace the existing `TokenType` store with a Supabase `Session`-based store:

```ts
import type { Session } from '@supabase/supabase-js';

type AuthState = {
  session: Session | null;
  status: 'idle' | 'signIn' | 'signOut';
  setSession: (session: Session | null) => void;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};
```

- `setSession(session)`: if session is non-null → `status: 'signIn'`; if null → `status: 'signOut'`
- `hydrate()`: calls `supabase.auth.getSession()` → calls `setSession` with result
- `signOut()`: calls `supabase.auth.signOut()` → Supabase fires `onAuthStateChange(SIGNED_OUT)` → store updates automatically

### onAuthStateChange Subscription — `src/app/_layout.tsx`

Registered once at app startup, never unsubscribed (app lifetime):

```ts
useEffect(() => {
  hydrateAuth();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
    }
  );
  return () => subscription.unsubscribe();
}, []);
```

This is the single source of truth. No manual token juggling anywhere else.

### Auth API — `src/features/auth/api.ts`

Pure async functions wrapping Supabase calls. All return `{ error: string | null }` so callers handle errors uniformly:

```ts
signInWithEmail(email, password)   → Promise<{ error: string | null }>
signUpWithEmail(email, password)   → Promise<{ error: string | null }>
signInWithApple()                  → Promise<{ error: string | null }>
sendPasswordResetEmail(email)      → Promise<{ error: string | null }>
updatePassword(newPassword)        → Promise<{ error: string | null }>
signOut()                          → Promise<void>
```

### storage.tsx Migration

`src/lib/storage.tsx` currently uses `react-native-mmkv` (native module, blocked in Expo Go). Replace with `@react-native-async-storage/async-storage`. The API surface is identical — callers are unaffected:

```ts
// Before
import { createMMKV } from 'react-native-mmkv';
export const storage = createMMKV();

// After
import AsyncStorage from '@react-native-async-storage/async-storage';
// getItem / setItem / removeItem wrap AsyncStorage
```

Note: Supabase session storage is handled independently by the `supabase.ts` client (already uses AsyncStorage). `storage.tsx` is only used for non-auth state (e.g. `useIsFirstTime` flag).

### lib/auth/utils.tsx

This file currently holds `getToken`, `setToken`, `removeToken`. Since Supabase owns session storage, these token helpers are no longer needed for auth. The file is simplified to re-export only what is still needed elsewhere (currently nothing after the store rewrite — file may be deleted if unused).

---

## Visual Design

### Design System Rules (from CLAUDE.md + Expo UI guidelines)

- **All colors** from `src/theme/colors.ts` tokens — no hardcoded hex strings in components
- **StyleSheet.create** for component styles; inline styles only for one-off layout values
- **`borderCurve: 'continuous'`** on all rounded corners (iOS continuous squircle)
- **`boxShadow`** CSS property — never legacy `elevation` or `shadowColor`/`shadowRadius`
- **`react-native-safe-area-context`** — never RN `SafeAreaView`
- **Reanimated v4** for all animations — never the built-in `Animated` API
- **Haptics** (`expo-haptics`) on button press — iOS only, conditional

### Welcome Screen Visual

**Background:** Deep navy (`colors.gray900` / `#111827`) with a radial blue glow behind the logo:
```ts
experimental_backgroundImage: 'radial-gradient(ellipse at 50% 25%, rgba(45,107,228,0.45) 0%, transparent 65%)'
// layered over solid colors.gray900 background
```
> Note: `experimental_backgroundImage` requires New Architecture (enabled in app.config.ts via `newArchEnabled: true`). Confirmed safe to use.

**Logo block:** 56×56 view, `borderRadius: 16`, `borderCurve: 'continuous'`, gradient fill using `experimental_backgroundImage: 'linear-gradient(135deg, #2D6BE4, #1A4FB5)'`, `boxShadow: '0 8px 24px rgba(45,107,228,0.4)'`

**Tagline:** `colors.textInverse` at 60% opacity — "Your GLP-1 nutrition companion"

**"Get Started" button:** Gradient fill (`linear-gradient(135deg, colors.primary, colors.primaryDark)`), white text, `borderRadius: 14`, `borderCurve: 'continuous'`, `boxShadow: '0 4px 16px rgba(45,107,228,0.5)'`

**"Sign In" button:** `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.12)`, white text at 85% opacity — ghost/glass style

**Pharmacist badge:** Small text at bottom — "Designed by a licensed pharmacist · Not medical advice" — `colors.textInverse` at 30% opacity

**Entering animation:** Logo and tagline use `FadeInDown.duration(600)`, buttons use `FadeInUp.delay(200).duration(500)` — staggered reveal on mount

### Form Screens (Sign In, Sign Up, Forgot Password, Reset Password)

**Background:** `colors.background` (`#F9FAFB`) — clean light

**Heading:** Large bold title (e.g. "Welcome back"), `colors.textPrimary`, `fontSize: 28`, `fontWeight: '700'`

**Subtitle:** `colors.textSecondary`, `fontSize: 14`

**Input fields:**
- Background: `colors.surface` (white)
- Border default: `1.5px solid colors.border`
- Border focused: `1.5px solid colors.borderFocus` with `boxShadow: '0 0 0 3px rgba(45,107,228,0.12)'`
- `borderRadius: 12`, `borderCurve: 'continuous'`
- `boxShadow: '0 1px 3px rgba(0,0,0,0.06)'` at rest
- Label: uppercase, `fontSize: 11`, `fontWeight: '600'`, `colors.textSecondary`, `letterSpacing: 0.6`

**Error state:** Red border (`colors.error`), error message appears with `FadeInDown.duration(200)`, `LinearTransition` animates layout shift

**Primary CTA button:** `linear-gradient(135deg, colors.primary, colors.primaryDark)`, `borderRadius: 14`, `borderCurve: 'continuous'`, white text, `fontSize: 16`, `fontWeight: '600'`

**Apple Sign In button:** Native black Apple button — use `AppleAuthentication.AppleAuthenticationButton` with `buttonType: SIGN_IN` and `buttonStyle: BLACK`. Only rendered when `appleAvailable === true`. Height: 50, `borderRadius: 14`, `borderCurve: 'continuous'`

**"Forgot password?" link:** Right-aligned, `colors.primary`, `fontSize: 13`, `fontWeight: '500'`

**Cross-links** ("Don't have an account? Sign up"): Centered below CTA, `colors.textSecondary` + `colors.primary` for the tappable part

**Entering animation:** Form elements use `FadeInUp.duration(400)` staggered with small delays

### Password Strength (Sign Up only)

A 3-segment bar below the password field. Segments fill left-to-right based on password strength:
- Weak (< 8 chars): 1 red segment
- Medium (8+ chars, mixed): 2 orange segments  
- Strong (12+ chars, mixed + symbol): 3 green segments

Animated via `LinearTransition` on segment width change.

---

## Apple Sign In Implementation

```ts
// src/features/auth/api.ts
import * as AppleAuthentication from 'expo-apple-authentication';

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
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') return { error: null }; // user dismissed
    return { error: e.message ?? 'Apple Sign In failed' };
  }
}
```

In the component, show the button only if available:
```ts
const [appleAvailable, setAppleAvailable] = useState(false);
useEffect(() => {
  AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
}, []);
```

**Supabase config required:** Enable Apple provider in Supabase dashboard → Auth → Providers → Apple. Add Apple Services ID and OAuth credentials (deferred to EAS build milestone — button is hidden in Expo Go via availability check).

---

## Password Reset Deep Link

**App scheme:** `dosepath` (set in `env.ts` — replaces current `obytesApp` placeholder)

**Supabase redirect URL:** Configure in Supabase dashboard → Auth → URL Configuration:
- Redirect URL: `dosepath://reset-password`

**`reset-password.tsx` flow:**
1. Screen mounts from deep link
2. `useLocalSearchParams()` extracts `access_token` and `refresh_token`
3. Call `supabase.auth.setSession({ access_token, refresh_token })`
4. User enters new password → call `supabase.auth.updateUser({ password: newPassword })`
5. On success → navigate to `(auth)/sign-in` with success flash message

---

## App Identity Updates (env.ts)

The Obytes placeholder values are updated as part of this task:

| Field | Before | After |
|---|---|---|
| `NAME` | `'ObytesApp'` | `'DosePath'` |
| `SCHEMES.development` | `'obytesApp'` | `'dosepath'` |
| `SCHEMES.preview` | `'obytesApp.preview'` | `'dosepath.preview'` |
| `SCHEMES.production` | `'obytesApp'` | `'dosepath'` |
| `BUNDLE_IDS.development` | `'com.obytes.development'` | `'com.dosepath.development'` |
| `BUNDLE_IDS.preview` | `'com.obytes.preview'` | `'com.dosepath.preview'` |
| `BUNDLE_IDS.production` | `'com.obytes'` | `'com.dosepath'` |
| `PACKAGES.*` (Android) | `com.obytes.*` | `com.dosepath.*` |
| `app.config.ts` `slug` | `'obytesapp'` | `'dosepath'` |

Note: `app.config.ts` `owner` field remains for now — update when EAS account is configured.

---

## Files Changed

### Created
- `src/app/(auth)/_layout.tsx`
- `src/app/(auth)/welcome.tsx`
- `src/app/(auth)/sign-in.tsx`
- `src/app/(auth)/sign-up.tsx`
- `src/app/(auth)/forgot-password.tsx`
- `src/app/(auth)/reset-password.tsx`
- `src/features/auth/api.ts`
- `src/features/auth/components/sign-in-form.tsx`
- `src/features/auth/components/sign-up-form.tsx`
- `src/features/auth/components/forgot-password-form.tsx`
- `src/features/auth/components/reset-password-form.tsx`

### Modified
- `src/features/auth/use-auth-store.tsx` — rewrite: TokenType → Session, onAuthStateChange
- `src/lib/storage.tsx` — MMKV → AsyncStorage
- `src/lib/auth/utils.tsx` — remove token helpers (Supabase owns storage)
- `src/app/_layout.tsx` — register onAuthStateChange subscription, change initial route
- `src/app/(app)/_layout.tsx` — update initialRouteName comment; redirect logic unchanged
- `env.ts` — update NAME, SCHEMES, BUNDLE_IDS, PACKAGES to DosePath values
- `.env.development` / `.env.preview` / `.env.production` — no changes needed (SCHEME is computed)
- `app.config.ts` — update slug to `dosepath`

### Deleted
- `src/app/login.tsx`
- `src/features/auth/login-screen.tsx`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/login-form.test.tsx`

---

## Dependencies to Install

```bash
pnpm add expo-apple-authentication --ignore-scripts
# @react-native-async-storage/async-storage is already installed (used by supabase.ts)
# expo-haptics is already in the Expo SDK (no install needed)
# react-native-reanimated is already installed (Obytes scaffold)
# expo-blur is already installed (Obytes scaffold)
```

Add `expo-apple-authentication` plugin to `app.config.ts` plugins array:
```ts
'expo-apple-authentication'
```

---

## Testing

No new Vitest tests (auth screens are UI, not safety-critical pure logic).

jest-expo component tests for:
- `sign-in-form.tsx`: renders fields, shows error on invalid email, disables submit while loading
- `sign-up-form.tsx`: renders fields, shows password strength bar, disables submit while loading
- `forgot-password-form.tsx`: renders email field, shows success state after submit
- `use-auth-store.tsx`: setSession updates status correctly, hydrate calls getSession

All tests must pass before task is considered done (`pnpm test`).

---

## Out of Scope

- Consent flow (Month 1 Item 2 — separate task)
- Onboarding routing (Month 1 Item 3)
- Apple Sign In Supabase dashboard configuration (blocked until EAS dev build)
- Email template customization (Resend integration — later)
- Social auth beyond Apple (Google, etc. — not in spec)
