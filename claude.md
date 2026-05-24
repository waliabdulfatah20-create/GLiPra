# DosePath — Project-Local Claude Context

**This file documents the scaffold inside `dosepath/` and overrides the Obytes template defaults.**

For the full product spec, architecture, and the 10 non-negotiable rules, see the project-root file:
`../CLAUDE.md`

---

## Stack (Actual — Scaffolded 2026-05-17)

| What | Choice |
|---|---|
| Framework | **Expo SDK 54** (newer than the spec's SDK 52 — accepted upgrade) |
| Navigation | **Expo Router 6** (newer than spec's v3) |
| Language | TypeScript strict |
| Styling | **StyleSheet API + `src/theme/colors.ts`** — NativeWind/Tailwind STRIPPED |
| Backend | Supabase (`@supabase/supabase-js` v2.105.4) |
| State | Zustand (global) + React Query (server) |
| Forms | TanStack Form + Zod (from Obytes) |
| Persistence | **AsyncStorage** for Supabase sessions (NOT MMKV) — overrides Obytes default |
| Date math | `date-fns` v4.1.0 only |
| Testing | **Vitest** for pure-TS utils; **jest-expo** for components |
| Package manager | **pnpm** v11.1.2 |

## Overrides vs Obytes Template Defaults

The Obytes template ships with several patterns that DosePath explicitly rejects:

| Obytes Default | DosePath Override | Reason |
|---|---|---|
| NativeWind/Tailwind className styling | StyleSheet + `colors.ts` design tokens | CLAUDE.md Rule — no NativeWind |
| MMKV for all persistence | AsyncStorage for Supabase sessions | Standard Supabase-RN pattern; MMKV reserved for non-auth sensitive data later |
| `tailwind-variants` / `tailwind-merge` | Removed | Tailwind-specific; produce useless output without NativeWind |
| Jest only | Vitest (utils) + jest-expo (components) | Rule 4 — safety code needs 90% coverage; Vitest is faster for pure-TS |
| Inner `global.css` | Deleted | Tailwind artifact |

## Supply Chain Posture

- `pnpm install --ignore-scripts` for new dep installs
- Audit baseline documented at `../docs/security/AUDIT-BASELINE.md`
- 42 high vulns are dev-only transitive (Expo SDK 54 ecosystem state) — none reach production
- Pinned scaffold tag: Obytes v9.0.0

## Cost Posture

- `EXPO_PUBLIC_USE_MOCK_AI=true` is the default (zero OpenAI spend)
- All native-only packages deferred (RevenueCat, HealthKit, PostHog, Sentry) — added at first EAS dev build
- Supabase cloud project (free tier) — project ID cuxndkreewlcmijxlgyg
  - Local Docker Supabase abandoned: unreachable from physical device (127.0.0.1 is PC localhost)
  - 11 migrations applied and live on cloud

## Commands (pnpm, not npm)

```bash
pnpm start                 # Start dev server
pnpm test                  # Run jest-expo (component + integration tests)
pnpm test:utils            # Run Vitest (pure TS safety code)
pnpm test:utils:coverage   # Vitest with 90% coverage gate
pnpm tsc --noEmit          # TypeScript check
pnpm expo install <pkg>    # Add an Expo-compatible package
```

## Reading Priority

When a question arises:
1. **Project-root `../CLAUDE.md`** — authoritative for product/clinical/legal rules
2. **This file** — authoritative for scaffold state and Obytes overrides
3. **Obytes template README** — descriptive only; treat as default that may be overridden
