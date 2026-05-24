# DosePath — Project Scaffold Design
**Date:** 2026-05-17
**Status:** Approved
**Scope:** Month 1 Foundation — scaffold only (no features)

---

## Context

Starting from zero code. Goal is a running Expo SDK 52 managed-workflow app on
Windows 11 with the Obytes boilerplate as the base, all DosePath-specific packages
added, NativeWind stripped, and tests configured. The result is the foundation every
Month 1 feature (auth, onboarding, calculators) sits on.

Testing device: Expo Go (physical phone) for initial iteration.
EAS dev builds come later when RevenueCat / HealthKit are needed.

---

## Approach

Use **obytes/react-native-template-obytes** (Expo SDK 52, New Architecture enabled)
as the starting point. It ships Expo Router v3, TypeScript strict, Zustand, React
Query, i18next, Zod, and Husky pre-wired — an exact stack match for DosePath.

**One mandatory post-scaffold step:** strip NativeWind/TailwindCSS immediately.
CLAUDE.md bans NativeWind. It ships in the Obytes template and must be removed
before writing any DosePath code.

---

## Pre-Scaffold Environment Setup (Windows 11)

```powershell
# 1. Fix git line endings — prevents Husky hook failures on Windows
git config --global core.autocrlf input

# 2. Supabase CLI — install via Scoop, NOT npm global (npm global is broken on Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
# Note: local Supabase requires Docker Desktop + WSL 2
```

---

## Scaffold Steps

```powershell
# 1. Scaffold from Obytes boilerplate
npx create-expo-app dosepath --template https://github.com/obytes/react-native-template-obytes
cd dosepath

# 2. Strip NativeWind
npm uninstall nativewind tailwindcss
# Remove tailwind.config.js and any babel-plugin-nativewind references from babel.config.js

# 3. Install DosePath client packages
npx expo install @supabase/supabase-js date-fns

# 4. Install test tooling
npm install -D vitest @vitest/coverage-v8

# (jest-expo is already in the Obytes template — verify it is present)

# 5. Copy .env.example and fill keys
cp .env.example .env.local

# 6. Verify everything boots
npx expo start
```

---

## Project Structure (post-scaffold)

```
dosepath/
├── app/                            ← Expo Router screens (file = route)
│   ├── (auth)/                     ← Auth screens (Month 1)
│   ├── (onboarding)/               ← 10-step onboarding (Month 1)
│   └── (tabs)/                     ← Main tab screens
├── src/
│   ├── components/
│   │   └── ui/                     ← StyleSheet-based primitives (no NativeWind)
│   ├── features/                   ← Empty — ready for Month 1 features
│   ├── lib/
│   │   ├── supabase.ts             ← Singleton Supabase client
│   │   └── mockAI.ts               ← Mock AI responses (EXPO_PUBLIC_USE_MOCK_AI gate)
│   ├── theme/
│   │   └── colors.ts               ← ALL color/spacing/radius/shadow tokens
│   ├── types/
│   │   ├── database.ts             ← GENERATED — never hand-edit
│   │   └── index.ts                ← Domain types (GLP1MedicationId, InjectionPhase…)
│   ├── utils/
│   │   └── protein.ts              ← Safety-critical calculator placeholder
│   └── stores/                     ← Zustand stores
├── supabase/
│   ├── functions/
│   │   └── _shared/                ← cors.ts + shared helpers
│   └── migrations/                 ← Empty, numbered sequentially
├── metro.config.js                 ← Includes unstable_enablePackageExports: true
├── vitest.config.ts                ← Scoped to pure TS utils ONLY (no RN imports)
├── jest.config.js                  ← jest-expo for component + RN tests
└── .env.example                    ← All required keys documented
```

---

## Package List

### Client (installed in the app)

| Package | Purpose | Notes |
|---|---|---|
| `@supabase/supabase-js` | Auth + DB client | v2 (latest ~2.105) |
| `date-fns` | All date math — Rule 6 | v4; metro fix required |
| `zod` | Input/output validation | Already in Obytes |
| `vitest @vitest/coverage-v8` | Pure TS unit tests | Utils + calculators only |
| `jest-expo` | Component + RN tests | Already in Obytes |

### Explicitly NOT on the client

| Package | Reason | Where it lives instead |
|---|---|---|
| `@openfoodfacts/openfoodfacts-nodejs` | Node-only alpha — not RN safe | Supabase edge function |
| `react-native-purchases` | Requires dev build (no Expo Go) | Added in Month 2+ |
| `react-native-health-link` | Requires dev build | Added in Month 2+ |
| `posthog-react-native` | Requires dev build | Added in Month 2+ |
| `sentry-expo` | Requires dev build | Added in Month 2+ |

---

## Key Config Changes vs Obytes Defaults

### metro.config.js — date-fns v4 ESM fix
```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = true;
module.exports = config;
```

### vitest.config.ts — scoped to pure TS utils only
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: [
      'src/utils/**/*.test.ts',
      'src/features/**/calculator.test.ts',
    ],
    environment: 'node',
  },
});
```

### .env.example — all required keys
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_USE_MOCK_AI=true
```

---

## Files to Write (not from boilerplate)

| File | What it contains |
|---|---|
| `src/lib/supabase.ts` | Singleton Supabase client using env vars |
| `src/lib/mockAI.ts` | Mock return values for all AI features; gated by `EXPO_PUBLIC_USE_MOCK_AI` |
| `src/theme/colors.ts` | Color palette, spacing scale, border radius, shadow tokens |
| `src/types/index.ts` | `GLP1MedicationId`, `InjectionPhase`, `SubscriptionTier` domain types |

---

## Out of Scope for This Scaffold

- Auth screens (own session)
- Onboarding flow (own session)
- Supabase migrations (own session)
- Any feature code
- RevenueCat, HealthKit, analytics, Sentry

---

## Verification Criteria

- [ ] `npx expo start` launches without errors in Expo Go
- [ ] No NativeWind imports remain anywhere in the codebase
- [ ] `npm test` passes (zero failing tests, zero NativeWind references)
- [ ] `src/lib/supabase.ts` connects to Supabase with env vars
- [ ] `src/theme/colors.ts` exports all design tokens
- [ ] `EXPO_PUBLIC_USE_MOCK_AI=true` is the default in `.env.example`
- [ ] TypeScript strict mode has zero errors (`npx tsc --noEmit`)
