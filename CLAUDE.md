# Glipra — Claude Context File
# Keep this file current. Update rules and decisions when they change.
# Build history and completed milestones live in PROGRESS.md.
# Last updated: 2026-05-24

---

## What This App Is

**Glipra** — A GLP-1 nutrition companion app built by a licensed pharmacist.
Core promise: "We make sure you don't lose muscle while GLP-1 does its job."

Target user: Adults on Ozempic, Wegovy, Mounjaro, Zepbound, Saxenda, Trulicity,
or compounded GLP-1s who are anxious about muscle loss and underserved by every
existing app.

Primary benchmark competitor: MeAgain (meagain.com) — match their UX polish,
beat them on pharmacist credential, safety features, Spanish localization,
and discontinuation support.

Full details in ARCHITECTURE.md. Read the relevant section before touching any feature.

---

## Stack (Quick Reference)

| What | Choice |
|---|---|
| Framework | Expo SDK 54, managed workflow |
| Navigation | Expo Router 6 (file-based) |
| Language | TypeScript strict mode — always |
| Styling | StyleSheet API + colors.ts (no NativeWind) |
| Backend | Supabase (auth + Postgres + edge functions + storage) |
| DB Types | `src/types/database.ts` — generated, NEVER hand-edited |
| State | Zustand (global) + React Query (server/async) |
| Persistence | AsyncStorage v2.2.0 |
| Date math | date-fns ONLY — never raw JS Date arithmetic |
| AI | OpenAI GPT-4o (photo) + GPT-4o mini (guidance, coach) + Whisper (voice) |
| Payments | RevenueCat (react-native-purchases + react-native-purchases-ui) |
| Analytics | PostHog (posthog-react-native) + feature flags |
| Errors | Sentry (sentry-expo) |
| Food DB | @openfoodfacts/openfoodfacts-nodejs (official SDK) + USDA fallback |
| Health | react-native-health-link (unified iOS + Android — ONE package) |
| PDF | pdf-lib in edge functions (NOT React PDF — Deno incompatible) |
| Email | Resend via Supabase edge functions |
| Validation | Zod at ALL API and edge function boundaries |
| Testing | Vitest + React Native Testing Library |
| CI/CD | GitHub Actions + EAS Build + EAS Update (OTA) |
| Localization | i18next + expo-localization (English + Spanish) |
| Boilerplate | obytes/react-native-template-obytes |

---

## The 10 Rules — Never Break These

**Rule 1 — OpenAI is server-side only**
Never call OpenAI from the React Native client.
All AI calls go through Supabase edge functions.
Pattern: client → supabase.functions.invoke() → edge function → OpenAI API.

**Rule 2 — No PII to OpenAI**
Never include the user's name, email, exact location, or any identifying
information in prompts sent to OpenAI. Use anonymized context only.

**Rule 3 — Zod validates all AI output**
Every OpenAI response must be parsed through a Zod schema before use.
On validation failure: return a safe deterministic fallback, never crash.

**Rule 4 — Safety code needs 90%+ test coverage**
These files require comprehensive Vitest tests covering every branch:
- src/utils/protein.ts
- src/features/safety/redFlagDetector.ts
- src/features/injection-cycle/calculator.ts
- src/features/readiness/calculator.ts
- src/features/medication-level/calculator.ts
- src/features/injection-sites/calculator.ts
Write tests alongside the implementation. Never ship safety code without tests.

**Rule 5 — pnpm test before finishing any session**
Run `pnpm test` before considering any work done. Fix failures before moving on.

**Rule 6 — date-fns for all date math**
Never subtract dates with raw JS. Never use `new Date() - new Date()`.
Always use date-fns functions: `differenceInCalendarDays`, `parseISO`, `format`, etc.

**Rule 7 — RLS on every table**
Every new Supabase table needs Row Level Security enabled and a policy written.
Pattern: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`
Verify RLS works before merging any migration.

**Rule 8 — Disclaimer tier on every clinical screen**
Every screen that touches clinical content needs `<DisclaimerBanner tier={1|2} />`.
Tier 1: AI output, protein floor, medication content — modal on first view.
Tier 2: Educational content, side effects — footer disclaimer.
Tier-1 disclaimers must be the same visual weight as the content, not tiny gray text.

**Rule 9 — Escalation card never names medical conditions**
The `<EscalationCard />` shows NO condition names to users.
No "pancreatitis", no "gastroparesis", no "dehydration" in the UI copy.
Internal type codes (used in database + support only) are never rendered.
User-facing copy: "You've logged symptoms that may need medical attention.
Please contact your prescriber today."

**Rule 10 — AI Nutrition Coach answers food questions only**
The `ai-coach` edge function is scoped to protein, fiber, hydration, and
food strategies. It hard-blocks medication questions, drug interactions,
dosing questions, and symptom interpretation with a canned response:
"For medication questions, contact your prescriber or pharmacist directly."
Keyword blocklist runs before hitting OpenAI.

---

## Open Blockers (do not ungate without resolving)

| Blocker | What's needed |
|---|---|
| **Legal gate** | AI coach prompts + EscalationCard copy need attorney review before `EXPO_PUBLIC_USE_MOCK_AI=false` in any env |
| **Email confirmation** | Currently OFF in Supabase dashboard for dev. Re-enable before any public release. |
| **RevenueCat iOS** | Needs Apple Developer account ($99/yr) + P8 key from App Store Connect |
| **Health package minSdk** | `react-native-health-link` 0.2.0 installed. `android.minSdkVersion` already bumped to 26 in app.config.ts. Re-add `pnpm expo install react-native-health-link` if ever removed. |

---

## File Path Conventions

```
src/
├── features/[feature]/
│   ├── api.ts          — Supabase queries for this feature
│   ├── hooks.ts        — React Query hooks
│   └── calculator.ts   — Pure business logic (if needed)
├── components/
│   ├── ui/             — Shared UI primitives
│   ├── today/          — Today screen components
│   ├── log/            — Food logging components
│   └── [feature]/      — Feature-specific components
├── lib/
│   ├── supabase.ts     — Singleton Supabase client
│   ├── openFoodFacts.ts — OFF SDK wrapper
│   └── analytics.ts    — PostHog wrapper
├── theme/
│   └── colors.ts       — ALL colors, spacing, radius, shadow tokens
├── types/
│   ├── database.ts     — GENERATED — never edit manually
│   └── index.ts        — Domain types (GLP1MedicationId, InjectionPhase, etc.)
├── utils/
│   └── protein.ts      — Protein floor calculator (safety critical)
└── __tests__/          — All test files live here
    └── *.test.ts

supabase/
├── functions/[name]/
│   └── index.ts        — Each edge function is one file
└── migrations/
    └── 00N_name.sql    — Numbered sequentially

app/                    — Expo Router screens (file = route)
├── (auth)/
├── (onboarding)/
├── (tabs)/
└── [feature]/
```

---

## TypeScript Path Aliases

```
@/*           → src/*
@components/* → src/components/*
@features/*   → src/features/*
@lib/*        → src/lib/*
@theme/*      → src/theme/*
@utils/*      → src/utils/*
@stores/*     → src/stores/*
```

Always use aliases, never relative `../../` imports.

---

## Key Business Logic Constants

Do not change these without updating the architecture and the tests.

```ts
// Protein floor (src/utils/protein.ts)
ABSOLUTE_CEILING_G = 200          // Never recommend more than this
ABSOLUTE_FLOOR_G = 50             // Never recommend less than this
KIDNEY_DISEASE_MAX_G_PER_KG = 0.8 // Renal-protective cap
HIGH_BMI_THRESHOLD = 35           // Use ideal body weight above this
MAINTENANCE_MULTIPLIER = 0.9      // 10% reduction for maintenance phase

// Streaks (src/features/streaks/rules.ts)
STREAK_THRESHOLD = 0.80           // 80% of protein floor = streak day

// EWMA weight smoothing
EWMA_ALPHA = 0.1                  // Slow, appropriate for body weight

// Injection phases (src/features/injection-cycle/calculator.ts)
injection_day    = 0 days since injection
peak_suppression = 1-2 days
adjustment       = 3-4 days
recovery_window  = 5-7 days
overdue          = 8+ days

// Injection site rotation (src/features/injection-sites/calculator.ts)
REST_DAYS = 7                     // Days before a site can be reused
SITE_ROTATION_ORDER               // Serpentine: upper L/M/R → lower R/M/L
```

---

## Edge Function Pattern

Every edge function follows this exact structure. Do not deviate.

```ts
// supabase/functions/[name]/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user)
      throw new Error('Unauthorized');

    // 3. Rate limit (check ai_invocations table)
    // 4. Zod validate input
    // 5. Business logic / OpenAI call
    // 6. Zod validate output
    // 7. Log to ai_invocations
    // 8. Return result
  }
  catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
  }
});
```

---

## Database Migration Workflow

```bash
# 1. Write migration in supabase/migrations/XXX_name.sql
# 2. Apply to cloud
npx supabase db push

# 3. Regenerate types — always after schema changes
npx supabase gen types typescript --project-id cuxndkreewlcmijxlgyg > src/types/database.ts
```

Never hand-edit `src/types/database.ts`. Always regenerate after schema changes.

---

## Subscription Tiers

```ts
type SubscriptionTier = 'free' | 'pro' | 'founder_lifetime';
// RevenueCat entitlement: 'glipra_pro'
// Pro = $9.99/month or $79.99/year
// Founder Lifetime = $149 one-time (first 500 users)

// Locked to Pro: AI photo recognition, voice logging (fully gated — no free tier), daily AI guidance,
//   micronutrient watch, unlimited protein history, prescriber visit prep + PDF, linked accounts

// Always free: red-flag escalation, barcode scanning, manual food logging,
//   data export (GDPR), account deletion
```

---

## Liability-Critical Rules

1. **Escalation card copy is locked** — Do not rewrite without attorney sign-off.
   Exact approved text is in ARCHITECTURE.md → Emergency Escalation.

2. **Pharmacist credential language is controlled** — Approved: "Designed by a licensed
   pharmacist", "pharmacist-authored content". Forbidden: "your pharmacist recommends",
   "pharmacist-approved", "your virtual pharmacist".

3. **AI coach is nutrition only** — `ai-coach` scope must not expand to medication
   questions without attorney review of the new prompts.

4. **Content cards on serious medical topics need dual disclaimers** — Top AND bottom.
   Cards #19 (pancreatitis) and #20 (gallbladder) need emergency redirect at the top.

5. **Protein floor modal must include inaccurate-inputs warning** — "This estimate is
   based on the information you provided. Inaccurate inputs will produce inaccurate estimates."

---

## Cost Rules

**OpenAI is mocked during development by default.**

```bash
EXPO_PUBLIC_USE_MOCK_AI=true   # Development default — zero OpenAI cost
EXPO_PUBLIC_USE_MOCK_AI=false  # Only when specifically testing AI output
```

When mock is on, all AI calls must return data from `src/lib/mockAI.ts`.
Never call a real edge function when `EXPO_PUBLIC_USE_MOCK_AI=true`.

```ts
if (process.env.EXPO_PUBLIC_USE_MOCK_AI === 'true') {
  return MOCK_[FEATURE]; // from src/lib/mockAI.ts
}
```

**OpenAI hard cap: $20/month during development.** Flag any code that could loop or retry.

**Free services — never suggest paid alternatives:** Supabase, EAS Build, PostHog, Sentry, GitHub, Resend.

**Never suggest adding:** a second database, Vercel/Netlify, Firebase, paid analytics, Linear/Jira.

---

## Visual Design Direction

**Style: Clean Clinical** — premium medical app. Light, readable, trustworthy. Closer to Apple Health than a gym app.

| Token | Value | Use |
|---|---|---|
| `background` | `#f7f9fc` | Screen background — cool blue-gray |
| `surface` | `#ffffff` | Cards |
| `border` | `#e2e8f0` | Dividers, input borders |
| `brand` | `#5b21b6` | Interactive elements, active states, brand labels only |
| `brandLight` | `rgba(91,33,182,0.08)` | Active/selected tint |
| `today` / `warning` | `#d97706` | Amber — ONLY for "today" markers + clinical warnings |
| `success` | `#059669` | Emerald — ONLY for positive outcomes + streaks |
| Shadow | `rgba(79,70,229,0.10)` | Purple-tinted depth |

**Component patterns:**
- Section labels: 11px, uppercase, `letterSpacing: 1`, `textSecondary`
- Metrics cards: 3px colored `borderTopWidth` accent
- Action rows: 40×40 icon circle + text content + chevron `›`
- Rx badge in Today header: permanent trust signal, do not remove
- Phase banner: leads with clinical headline, not just a label. 2px brand-purple inset top accent.
- Nav icons: SVG line icons (22px viewBox, 1.8px stroke, `stroke-linecap="round"`, `currentColor`). Never emoji in nav.

**Obytes remnants — never restore:** `SettingsContainer`/`SettingsItem`, the "Style" tab, `ThemeItem`/`LanguageItem`.

---

## i18n / Localization

**Supported:** English (`en`) + Spanish (`es`). Arabic removed entirely.

**Language switching:** `changeLanguage()` in `src/lib/i18n/utils.tsx` calls `i18n.changeLanguage(lang)` only.
react-i18next re-renders all consumers in-place. Never add `RNRestart.restart()`.

**Translation files:** `src/translations/en.json` and `src/translations/es.json`

**Onboarding language screen** uses hardcoded EN/ES labels (user hasn't picked a language yet).
On Continue: `changeLanguage(selected)` + persist → navigate to `/onboarding/medication`.

**Adding a new key:**
1. Add to `en.json` under the appropriate namespace
2. Add Spanish equivalent to `es.json`
3. Use `t('namespace.key')` with `useTranslation()` in the component

---

## Session Startup Prompt

```
Read CLAUDE.md. I'm building Glipra — a GLP-1 nutrition app built by a licensed
pharmacist. Today I want to work on [FEATURE NAME].

Before writing any code:
1. Confirm you understand the 10 rules from CLAUDE.md
2. Tell me exactly which files you will create or modify
3. Tell me what tests you will write alongside the code
4. Flag anything that touches liability-critical rules

Then wait for my approval before starting.
```

---

## End-of-Session Checklist

```
Before we end:
1. Run `pnpm test` — show me the output
2. List every file changed this session
3. Is there anything we built today that needs attorney review before shipping?
4. Does ARCHITECTURE.md decisions log need an update?
5. Update PROGRESS.md with anything completed this session.
6. What is the first thing to do next session?
```

---

## Prompting Rules

**One feature, one session.** Never ask Claude to build multiple features in one session.

**Name the exact file.**
Bad: "Build the protein feature"
Good: "Build src/utils/protein.ts — protein floor calculator. Requirements in ARCHITECTURE.md."

**Ask for tests at the same time.**
"Write the function AND the tests in src/__tests__/protein.test.ts. Cover all branches."

**Show exact errors, not descriptions.**
Bad: "It's not working" — Good: paste the exact error output.

**Stop scope creep early.** "Stop. I only asked for [X]. Remove everything you added except [X]."

---

## What Claude Should Never Do

- Call OpenAI from client-side code
- Hand-edit src/types/database.ts
- Use raw JS Date subtraction (always date-fns)
- Skip writing tests for safety-critical functions
- Use NativeWind (not installed)
- Write colors inline — always use colors.ts tokens
- Show medical condition names in escalation UI
- Write AI prompts that could be interpreted as medication advice
- Create a database table without RLS
- Import from a relative `../../` path when an alias exists
- Call a real OpenAI edge function when EXPO_PUBLIC_USE_MOCK_AI=true
- Suggest a paid service when a free tier exists
- Add a second backend (Firebase, PlanetScale, etc.)
- Write AI feature code that could loop or retry without a rate limit check
- Suggest upgrading Supabase, EAS, or PostHog before the free tier is actually hit
- Use em dashes in any user-facing copy
