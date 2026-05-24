# DosePath Project Scaffold — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a running Expo SDK 52 managed-workflow app at `DosePath/dosepath/` with the Obytes boilerplate as base, NativeWind stripped, DosePath packages added, dual test runners configured, and four foundational source files written — ready for Month 1 feature development.

**Architecture:** Obytes boilerplate provides Expo Router v3, TypeScript strict, Zustand, React Query, i18next, and Zod pre-wired. NativeWind is removed immediately and replaced with a `colors.ts` token system. Vitest handles pure-TS safety tests; jest-expo handles component/RN tests.

**Tech Stack:** Expo SDK 52, Expo Router v3, TypeScript strict, Supabase JS v2, date-fns v4, Vitest, jest-expo, Zustand, React Query, Zod

**Cost posture:** `EXPO_PUBLIC_USE_MOCK_AI=true` is the default — zero OpenAI spend during development. All native-only packages (RevenueCat, HealthKit, PostHog, Sentry) are deferred until a real EAS dev build is needed.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Scaffold | `dosepath/` | Entire Expo app root |
| Modify | `dosepath/metro.config.js` | Add `unstable_enablePackageExports` for date-fns v4 |
| Create | `dosepath/vitest.config.ts` | Scoped to pure-TS utils only |
| Modify | `dosepath/jest.config.js` | Verify jest-expo preset is present |
| Create | `dosepath/.env.example` | All required env vars documented |
| Create | `dosepath/.env.local` | Local secrets (git-ignored) |
| Create | `dosepath/src/theme/colors.ts` | All design tokens — colors, spacing, radius, shadows |
| Create | `dosepath/src/lib/supabase.ts` | Singleton Supabase client |
| Create | `dosepath/src/lib/mockAI.ts` | Mock AI responses gated by `EXPO_PUBLIC_USE_MOCK_AI` |
| Create | `dosepath/src/types/index.ts` | Domain types: GLP1MedicationId, InjectionPhase, SubscriptionTier |

---

## Task 1: Fix Windows Environment

**Files:** None (global git config)

- [ ] **Step 1: Fix line endings to prevent Husky hook failures**

```powershell
git config --global core.autocrlf input
```

Expected output: (no output — silent success)

- [ ] **Step 2: Verify Node.js version is 18+**

```powershell
node --version
```

Expected: `v18.x.x` or higher. If lower, download from nodejs.org before continuing.

- [ ] **Step 3: Check if Scoop is installed**

```powershell
scoop --version
```

If `scoop` is not recognized, install it:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

- [ ] **Step 4: Install Supabase CLI via Scoop**

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

- [ ] **Step 5: Verify Supabase CLI installed**

```powershell
supabase --version
```

Expected: `1.x.x` or higher (not "not recognized").

---

## Task 2: Scaffold from Obytes Boilerplate

**Files:** Creates `dosepath/` directory

- [ ] **Step 1: Navigate to the DosePath docs folder**

```powershell
cd "C:\Users\walia\OneDrive\Desktop\DosePath"
```

- [ ] **Step 2: Scaffold the Expo app**

```powershell
npx create-expo-app dosepath --template https://github.com/obytes/react-native-template-obytes
```

This takes 2–5 minutes. When prompted about EAS, press Enter to skip for now.

- [ ] **Step 3: Move into the project**

```powershell
cd dosepath
```

- [ ] **Step 4: Verify the boilerplate boots**

```powershell
npx expo start
```

Expected: Metro bundler starts, QR code appears. Press `Ctrl+C` to stop — no need to load it yet.

- [ ] **Step 5: Commit the raw boilerplate**

```powershell
git init
git add .
git commit -m "chore: scaffold from obytes/react-native-template-obytes (Expo SDK 52)"
```

---

## Task 3: Strip NativeWind

**Files:**
- Modify: `dosepath/package.json`
- Modify: `dosepath/babel.config.js`
- Delete: `dosepath/tailwind.config.js` (if present)
- Modify: `dosepath/global.css` (if present — delete it)

> NativeWind is banned by CLAUDE.md Rule. It ships in the Obytes template and must be fully removed before any DosePath code is written.

- [ ] **Step 1: Uninstall NativeWind packages**

```powershell
npm uninstall nativewind tailwindcss
```

- [ ] **Step 2: Remove tailwind config file if it exists**

```powershell
if (Test-Path "tailwind.config.js") { Remove-Item "tailwind.config.js" }
if (Test-Path "global.css") { Remove-Item "global.css" }
```

- [ ] **Step 3: Remove NativeWind from babel.config.js**

Open `babel.config.js`. Remove any line referencing `nativewind/babel` or `babel-plugin-nativewind`. The file should look like this afterward:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};
```

- [ ] **Step 4: Search for any remaining NativeWind imports**

```powershell
grep -r "nativewind" . --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules
```

Expected: No matches. If any are found, open those files and remove the import.

- [ ] **Step 5: Verify TypeScript still compiles**

```powershell
npx tsc --noEmit
```

Expected: No errors. Fix any errors before continuing.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "chore: strip NativeWind — DosePath uses StyleSheet API + colors.ts"
```

---

## Task 4: Install DosePath Packages

**Files:**
- Modify: `dosepath/package.json`

- [ ] **Step 1: Install Supabase JS client**

```powershell
npx expo install @supabase/supabase-js
```

- [ ] **Step 2: Install date-fns**

```powershell
npx expo install date-fns
```

- [ ] **Step 3: Install Vitest for pure-TS safety tests**

```powershell
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 4: Verify jest-expo is present (should be from Obytes)**

```powershell
npm list jest-expo
```

Expected: `jest-expo@x.x.x`. If missing, run:
```powershell
npx expo install jest-expo
```

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore: add supabase-js, date-fns, vitest — defer native-only packages to EAS build"
```

---

## Task 5: Fix Metro Config for date-fns v4

**Files:**
- Modify: `dosepath/metro.config.js`

> date-fns v4 is ESM-first. Without this flag, Metro may throw module resolution errors.

- [ ] **Step 1: Open metro.config.js and update it**

Replace the full contents with:

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for date-fns v4 (ESM-first package)
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
```

- [ ] **Step 2: Verify Metro still starts**

```powershell
npx expo start
```

Expected: Metro starts without errors. Press `Ctrl+C`.

- [ ] **Step 3: Commit**

```powershell
git add metro.config.js
git commit -m "fix: enable unstable_enablePackageExports for date-fns v4 ESM resolution"
```

---

## Task 6: Configure Dual Test Runners

**Files:**
- Create: `dosepath/vitest.config.ts`
- Modify: `dosepath/jest.config.js` (verify preset)

> Vitest runs pure-TS utils (no React Native imports). jest-expo runs everything else. They don't overlap.

- [ ] **Step 1: Create vitest.config.ts**

```powershell
New-Item -ItemType File vitest.config.ts
```

Write this content to `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only runs against pure TypeScript files with zero React Native dependencies.
    // Component tests and anything importing from 'react-native' must use jest-expo.
    include: [
      'src/utils/**/*.test.ts',
      'src/features/**/calculator.test.ts',
    ],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/**/*.ts',
        'src/features/**/calculator.ts',
      ],
      thresholds: {
        // Rule 4: safety code needs 90%+ coverage
        lines: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
});
```

- [ ] **Step 2: Verify jest.config.js uses jest-expo preset**

Open `jest.config.js`. It should contain `preset: 'jest-expo'`. If the file doesn't exist, create it:

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

- [ ] **Step 3: Add test scripts to package.json**

Open `package.json` and ensure the `scripts` section includes:

```json
"test": "jest",
"test:utils": "vitest run",
"test:utils:coverage": "vitest run --coverage",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Run both test suites to confirm zero failures**

```powershell
npm test
```

Expected: All existing tests pass (Obytes ships with some tests).

```powershell
npm run test:utils
```

Expected: `No test files found` — that is correct, we haven't written utils yet.

- [ ] **Step 5: Commit**

```powershell
git add vitest.config.ts jest.config.js package.json
git commit -m "chore: configure dual test runners — vitest for utils, jest-expo for components"
```

---

## Task 7: Write Environment Files

**Files:**
- Create: `dosepath/.env.example`
- Create: `dosepath/.env.local`

- [ ] **Step 1: Create .env.example with all required keys**

Write this to `.env.example`:

```
# Supabase — get from supabase.com → project settings → API
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# AI mock gate — KEEP TRUE during development to avoid OpenAI charges
# Set to false ONLY when specifically testing real AI output
EXPO_PUBLIC_USE_MOCK_AI=true

# OpenAI — stored in Supabase Edge Function secrets, NOT here
# See: supabase secrets set OPENAI_API_KEY=sk-...
# OPENAI_API_KEY is never an EXPO_PUBLIC_ variable (Rule 1)
```

- [ ] **Step 2: Create .env.local for local development**

Write this to `.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7kyqd7o5R7M2BeOs7oNNAktNitgq2FQBDlg
EXPO_PUBLIC_USE_MOCK_AI=true
```

> The anon key above is the standard local Supabase dev key — safe to commit to .env.example but not to production. `.env.local` is git-ignored by default.

- [ ] **Step 3: Verify .env.local is git-ignored**

```powershell
git check-ignore -v .env.local
```

Expected: `.gitignore:.env.local` or similar. If not ignored, add `.env.local` to `.gitignore`.

- [ ] **Step 4: Commit .env.example only**

```powershell
git add .env.example
git commit -m "chore: document all required environment variables in .env.example"
```

---

## Task 8: Write src/theme/colors.ts

**Files:**
- Create: `dosepath/src/theme/colors.ts`

> Every color, spacing value, border radius, and shadow in the app comes from this file. Never write inline styles with hardcoded values. This replaces NativeWind.

- [ ] **Step 1: Create the file**

Write this to `src/theme/colors.ts`:

```ts
// All design tokens for DosePath.
// Usage: import { colors, spacing, radius, shadows } from '@theme/colors';
// Never use hardcoded color strings or spacing numbers in components.

export const colors = {
  // Brand
  primary: '#2D6BE4',       // Main CTA, active states
  primaryDark: '#1A4FB5',   // Pressed state
  primaryLight: '#EBF1FD',  // Tinted backgrounds

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Protein / Readiness score arc colors
  proteinLow: '#EF4444',    // Below 60% of floor
  proteinMid: '#F59E0B',    // 60–89% of floor
  proteinGood: '#22C55E',   // 90%+ of floor

  // Injection phase badge colors
  phaseInjectionDay: '#8B5CF6',
  phasePeakSuppression: '#3B82F6',
  phaseAdjustment: '#10B981',
  phaseRecoveryWindow: '#F59E0B',
  phaseOverdue: '#EF4444',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#2D6BE4',

  // Clinical / Safety
  escalationBg: '#FEF2F2',
  escalationBorder: '#FCA5A5',
  escalationText: '#991B1B',
  disclaimerBg: '#FFF7ED',
  disclaimerBorder: '#FED7AA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
```

- [ ] **Step 2: Verify TypeScript accepts it**

```powershell
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add src/theme/colors.ts
git commit -m "feat: add design token system (colors, spacing, radius, shadows) — replaces NativeWind"
```

---

## Task 9: Write src/lib/supabase.ts

**Files:**
- Create: `dosepath/src/lib/supabase.ts`

- [ ] **Step 1: Create the Supabase singleton**

Write this to `src/lib/supabase.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 2: Create the database types placeholder**

`src/types/database.ts` is generated by `supabase gen types` — never hand-edit it. Create a placeholder now so imports don't break:

Write this to `src/types/database.ts`:

```ts
// AUTO-GENERATED — do not edit manually.
// Regenerate with: npx supabase gen types typescript --local > src/types/database.ts
// This placeholder satisfies imports until the first migration is applied.

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```powershell
git add src/lib/supabase.ts src/types/database.ts
git commit -m "feat: add Supabase singleton client with AsyncStorage session persistence"
```

---

## Task 10: Write src/lib/mockAI.ts

**Files:**
- Create: `dosepath/src/lib/mockAI.ts`

> Cost rule from CLAUDE.md: when `EXPO_PUBLIC_USE_MOCK_AI=true`, all AI features return mock data from this file. Zero OpenAI API calls during development. This is the default.

- [ ] **Step 1: Create the mock AI module**

Write this to `src/lib/mockAI.ts`:

```ts
// Mock responses for all AI features.
// Used when EXPO_PUBLIC_USE_MOCK_AI=true (the development default).
// Pattern: every AI feature checks this flag before calling any edge function.
//
// Usage in any AI-powered feature:
//   if (process.env.EXPO_PUBLIC_USE_MOCK_AI === 'true') {
//     return MOCK_[FEATURE];
//   }
//   // real supabase.functions.invoke() call here

export const MOCK_MEAL_RECOGNITION = {
  foods: [
    { name: 'Grilled chicken breast', protein_g: 31, calories: 165, serving_g: 100 },
    { name: 'Brown rice', protein_g: 2.6, calories: 112, serving_g: 100 },
    { name: 'Steamed broccoli', protein_g: 2.8, calories: 34, serving_g: 100 },
  ],
  total_protein_g: 36.4,
  total_calories: 311,
  confidence: 0.87,
};

export const MOCK_DAILY_GUIDANCE = {
  message:
    'Today is your adjustment phase — appetite suppression is at its strongest. ' +
    'Focus on hitting your protein floor with high-density sources like eggs, cottage cheese, or Greek yogurt. ' +
    'Aim for 25–30g per meal to preserve muscle.',
  protein_tip: 'Greek yogurt (17g per 150g serving) is easy on nausea days.',
  hydration_reminder: true,
  phase_aware: true,
};

export const MOCK_MEAL_TEXT_PARSE = {
  foods: [
    { name: 'Scrambled eggs', protein_g: 18, calories: 210, serving_description: '3 large eggs' },
    { name: 'Whole milk', protein_g: 8, calories: 150, serving_description: '1 cup' },
  ],
  total_protein_g: 26,
  total_calories: 360,
};

export const MOCK_VOICE_PARSE = {
  transcript: 'I had two eggs and a protein shake for breakfast',
  foods: [
    { name: 'Scrambled eggs', protein_g: 12, calories: 140, serving_description: '2 large eggs' },
    { name: 'Protein shake', protein_g: 25, calories: 130, serving_description: '1 scoop' },
  ],
  total_protein_g: 37,
  total_calories: 270,
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/mockAI.ts
git commit -m "feat: add mock AI module — gates all AI calls behind EXPO_PUBLIC_USE_MOCK_AI flag"
```

---

## Task 11: Write src/types/index.ts

**Files:**
- Create: `dosepath/src/types/index.ts`

- [ ] **Step 1: Create domain types**

Write this to `src/types/index.ts`:

```ts
// Domain types for DosePath.
// These are app-level types — not generated from the database schema.

// All supported GLP-1 medications
export type GLP1MedicationId =
  | 'semaglutide_ozempic'
  | 'semaglutide_wegovy'
  | 'tirzepatide_mounjaro'
  | 'tirzepatide_zepbound'
  | 'liraglutide_saxenda'
  | 'liraglutide_victoza'
  | 'dulaglutide_trulicity'
  | 'compounded_semaglutide'
  | 'compounded_tirzepatide'
  | 'compounded_glp1_gip';

// Injection cycle phases (calculator.ts determines current phase from last injection date)
export type InjectionPhase =
  | 'injection_day'       // 0 days since injection
  | 'peak_suppression'    // 1–2 days
  | 'adjustment'          // 3–4 days
  | 'recovery_window'     // 5–7 days
  | 'overdue';            // 8+ days

// Subscription tiers (gated via RevenueCat entitlement 'dosepath_pro')
export type SubscriptionTier = 'free' | 'pro' | 'founder_lifetime';

// Biological sex — used in protein floor calculation
export type BiologicalSex = 'male' | 'female';

// Activity level — used in protein floor calculation
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// Dosepath user goal
export type UserGoal = 'preserve_muscle' | 'lose_fat' | 'maintain';

// Onboarding step identifiers (10-step flow)
export type OnboardingStep =
  | 'medication'
  | 'injection_day'
  | 'body'
  | 'safety'
  | 'dietary'
  | 'goals'
  | 'status'
  | 'protein_floor'
  | 'import'
  | 'reveal';

// Disclaimer tiers (Rule 8 — every clinical screen needs one)
export type DisclaimerTier = 1 | 2;

// Red flag severity — used internally in redFlagDetector.ts (never shown to user as condition names)
export type RedFlagSeverity = 'watch' | 'escalate' | 'emergency';
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```powershell
git add src/types/index.ts
git commit -m "feat: add domain types — GLP1MedicationId, InjectionPhase, SubscriptionTier and more"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Run full TypeScript check**

```powershell
npx tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 2: Run jest test suite**

```powershell
npm test
```

Expected: All tests pass. Zero failures.

- [ ] **Step 3: Run vitest (expect no test files yet — that's correct)**

```powershell
npm run test:utils
```

Expected: `No test files found, exiting with code 0` — correct, no utils written yet.

- [ ] **Step 4: Verify NativeWind is fully gone**

```powershell
grep -r "nativewind" . --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git
```

Expected: Zero matches.

- [ ] **Step 5: Start Expo and scan with Expo Go**

```powershell
npx expo start
```

Scan the QR code with Expo Go on your phone. Expected: App loads to the Obytes default home screen without errors.

- [ ] **Step 6: Final commit**

```powershell
git add -A
git commit -m "chore: scaffold complete — NativeWind stripped, packages added, foundation files written"
```

---

## Cost Checkpoints

| Rule | Verified by |
|---|---|
| `EXPO_PUBLIC_USE_MOCK_AI=true` in `.env.example` | Task 7 |
| No OpenAI package on the client | Task 4 (not installed) |
| Native-only packages deferred | Tasks 4 (not installed) |
| Supabase local dev (free tier) | Task 1 (Supabase CLI installed) |
| No paid services referenced anywhere | All tasks |
