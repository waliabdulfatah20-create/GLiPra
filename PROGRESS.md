# Glipra — Build Progress
# Full history of what has been built. Not needed by Claude during coding.
# Update this file at the end of each session.
# Last updated: 2026-05-30 (session 37, corrected after code audit)

---

## Month 3 — AI, Safety & Monetization (in progress)

| # | Item | Status |
|---|---|---|
| 1 | expo-camera — barcode scanner live | ✅ |
| 2 | `recognize-food` edge function (GPT-4o, Zod-validated, 50/day cap) | ✅ |
| 3 | `ai-coach` edge function (GPT-4o-mini, keyword blocklist, 10/day, attorney review gate) | ✅ |
| 4 | `redFlagDetector.ts` — 44 tests, 97.61% branch coverage | ✅ |
| 5 | `<EscalationCard />` — Rule 9 compliant, locked copy, Tier 1 disclaimer | ✅ |
| 6 | Medication level estimator — PK SVG chart, steady-state model, /medication-level screen | ✅ |
| 7 | Prescriber visit prep + PDF — generate-visit-prep + generate-visit-pdf edge functions | ✅ |
| 8 | RevenueCat configured — Android app, SDK key, Test Store products, entitlement. iOS deferred (needs Apple Developer account). | ✅ |
| 9 | Spanish localization — react-i18next in-place reactivity, en/es files, language picker in Settings, language step in onboarding | ✅ |
| 9b | Tab bar restructure — Sites as 4th tab, Log renamed Nutrition, MedLevelBanner moved to Daily Actions, weight field in check-in | ✅ |
| 9c | Unit toggles + date input UX — lbs/kg/ft-in toggles, imperial split inputs, all weight flows metric internally | ✅ |
| 10 | Journey Cards + Shot Day Prep Checklist — milestones, MilestoneToast, share button, all 4 unlock triggers wired | ✅ |
| 11 | Apple Health integration (react-native-health-link) — health-import screen, 90-day dedup, EWMA, Health Connect (minSdk 26) | ✅ |
| 12 | PostHog analytics + Sentry — packages + wrappers installed, keys still empty in .env | ✅ |
| 13 | glipra.com landing page V2 — rebranded, email capture live, GitHub Pages | ✅ |
| 14 | First EAS Android dev build (build ID e0626e84) | ✅ |
| 15 | Cloud Supabase live — full Auth → Onboarding → Today flow on device | ✅ |
| 16 | EAS dev build with com.glipra.development + glipra:// scheme (build ID 860c9b45) | ✅ |
| 17 | Full device flow confirmed — Sign up → Consent → Onboarding → Today on physical Android | ✅ |
| 18 | Visual polish pass — clean clinical design direction | ✅ |
| 19 | AI Photo Recognition + Macro Tracker — Photo tab, editable review sheet, macro card, migration 012 | ✅ |
| 20 | Injection site tracker redesign — form-based Add Shot screen, SiteCode rotation, migration 013 | ✅ |
| 21 | Push notifications — injection reminder + daily protein nudge, Settings toggles, AsyncStorage persistence | ✅ |
| 22 | react-native-health-link 0.2.0 — Health Import screen, 90-day dedup, EWMA integration | ✅ |
| 23 | Progress screen — 5 metric cards, weight trend EWMA chart, 4 date ranges, pharmacist tip | ✅ |
| 24 | Pharmacist content cards — 25/25 cards complete with keyTakeaway + phase tags | ✅ |
| 25 | Phase-aware spotlight card — PharmacistSpotlightCard replaces carousel, ContentCardSheet bottom sheet | ✅ |
| 26 | EAS minSdkVersion fix — withGradleProperties config plugin + @expo/config-plugins as direct dep | ✅ (code fixed; build quota resets Jun 1) |
| 27 | Readiness score redesign — transparent factor card, two-layer architecture, 3 new inputs, action tip | ✅ |
| 28 | F2 Micronutrient Daily Watch — Pro-gated card, 4 nutrients (Mg/Zn/B12/VitD), gap banner, 19 Vitest tests | ✅ |
| 29 | F3 Prescriber Visit PDF — un-stubbed `useGeneratePdf()`, real 28-day protein average wired, share functional | ✅ |
| 30 | Auth redirect fix — stale Obytes `login.tsx` + `login-form.tsx` deleted, `_layout.tsx` redirects to `/(auth)/sign-in` | ✅ |
| 31 | Analytics event instrumentation — 5 missing PostHog events wired (INJECTION_LOGGED, PAYWALL_VIEWED, PURCHASE_STARTED/COMPLETED, RED_FLAG_DETECTED, ONBOARDING_COMPLETED) | ✅ |
| 32 | Shot Day Prep Checklist — 5-item pharmacist checklist, optimistic mutations, gradient hero + Rx badge + done banner | ✅ |
| 33 | Medication Level Estimator — Rule 4 Vitest tests (26 cases) + LevelChart SVG (gradient fill, today dot, injection markers, dark mode) | ✅ |
| 34 | Shot-prep i18n — full `shot_prep` namespace in en/es (14 keys), checklist items + screen strings + pharmacist badge | ✅ |
| 35 | In-app Privacy Policy + Terms of Service screens — `LegalDocScreen` shared component, 14-section privacy policy, 16-section ToS with arbitration/class-action waiver, Settings rows wired to `/legal/privacy-policy` and `/legal/terms-of-service` | ✅ |
| 36 | glipra.com legal pages full rewrite — `docs/privacy.html` (15 sections, WMHMD Act, CCPA/CPRA, Texas TDPSA, subprocessors, retention schedule) + `docs/terms.html` (AAA arbitration, class action waiver, $50 liability cap, Texas law); both DRAFT-bannered for attorney review | ✅ |
| 37 | `docs/legal/` markdown sources — 5 legal docs created: terms-of-service.md, privacy-policy.md, medical-disclaimer.md, subprocessor-list.md, refund-policy.md (all DRAFT, require attorney review) | ✅ |
| 38 | Em dash audit + Spanish diacritics fix — all em dashes removed from user-facing copy across 22 files (translations, pharmacist content cards, onboarding, log screen, legal screens, components); 9 missing Spanish accent marks fixed in `readiness.*` namespace | ✅ |
| 39 | glipra.com feature section expanded — 8 "Also included" cards added to `#solution`: Manual Macro Entry (free), Barcode Scanner (free), AI Photo Recognition (Pro), Shot Day Prep (free), Medication Level Estimator (free), Progress Dashboard (free), Prescriber Visit PDF (Pro), Micronutrient Watch (Pro) | ✅ |
| 40 | Preview APK build for beta distribution — `eas.json` preview profile changed to `distribution: internal`, Sentry source map upload disabled (`SENTRY_DISABLE_AUTO_UPLOAD=true`), all env vars wired; shareable APK link: `https://expo.dev/accounts/waliabdul/projects/glipra/builds/7c9951d5` | ✅ |
| 41 | Voice logging (Killer Differentiator #4) — fully Pro-gated, no free tier. `transcribe-food` Supabase edge function (Whisper transcription → GPT-4o mini food extraction, Zod-validated, 100/day circuit-breaker, static system prompt to prevent injection, service-role `ai_invocations` logging); `voice-recognition.ts` client wrapper + 4 Vitest tests; `VoiceCaptureButton` (expo-av, tap-to-start/stop, unmount cleanup, CANCELLED paywall guard); `PhotoReviewSheet` renamed `AIReviewSheet` with optional `transcript?` prop rendering quoted block; `log.tsx` two-button AI row (Photo + Voice side-by-side above Manual/Barcode toggle); 8 i18n keys en/es; edge function deployed to Supabase. 414 tests passing (352 Vitest + 62 jest-expo). Requires new EAS dev build for on-device testing (expo-av is native). | ✅ |
| 42 | VoiceCaptureButton design token cleanup — DOCUMENTED BUT NOT COMMITTED to `81b2433`. The semantic tokens (`buttonDark`, `recordingBg`, `recordingWave`) were never added to `tokens.ts`/`colors.ts`; `voice-capture-button.tsx` still uses hardcoded hex (`#0F172A` L214, `#7f1d1d` L226, `#fca5a5` L253). Verified absent in 2026-05-30 audit. | ❌ not in code |
| 44 | Nutrition Log AI section redesigned (Voice hero leads, Photo secondary) — VOICE-HERO REDESIGN NOT COMMITTED to `81b2433`. `log.tsx` still uses the `aiRow` two-button layout (L202); the idle state is the compact icon+label+subtitle button, not a hero card. Only the i18n keys (`voice_hero_title`, `voice_hero_subtitle`, `voice_cta`) were committed and are currently dead code. Verified in 2026-05-30 audit. | ❌ not in code |
| 45 | PhotoCaptureButton premium band + free logging note — NOT COMMITTED as described to `81b2433`. `free_logging_note` key exists in en/es but is never rendered; `photo-capture-button.tsx` uses `#4C1D95` as a full card background with AI POWERED/PRO badges, not a slim header band, and there is no green "always free" note below the toggle. Verified in 2026-05-30 audit. | ❌ not in code |
| 43 | expo-av Expo Go crash fix + OTA — CODE FIX NOT PRESENT in `81b2433`. `voice-capture-button.tsx:7` is still a plain `import { Audio } from 'expo-av'` (no `import type`, no `getAudio()` lazy-require wrapper), so the described `requireNativeModule('ExponentAV')` crash guard is absent. The CLAUDE.md PostHog/Sentry blocker cleanup did happen; the OTA push to `development` is not code-verifiable. Verified in 2026-05-30 audit. | ⚠️ partial |
| 46 | Daily AI Guidance (last remaining Pro feature) — fully shipped. Migration `016_daily_guidance.sql` (UNIQUE on `user_id, date`; `injection_phase` nullable; `reasoning_text` for "Why?" tooltip; `prompt_version`). Edge function `generate-daily-guidance` deployed to Supabase: GPT-4o mini, cache-hit check, Zod InputSchema + OutputSchema, FALLBACK_RESULT on parse failure, `ai_invocations` log, nutrition-only scope, nausea/energy-aware (soft foods when nausea >= 4, no exercise on nausea=5), Spanish support, ATTORNEY REVIEW REQUIRED gate. Client: `src/features/daily-guidance/api.ts` (mock gate, 400ms delay), `src/features/daily-guidance/hooks.ts` (staleTime: Infinity, 1/day). `DailyGuidanceCard`: Pro-gated via `<ProGate>`, gradient header, loading/error/guidance states, "Why this?" toggle expands `reasoning_text`, DisclaimerBanner tier=1 (AsyncStorage-backed first-view ack). Suppressed when `medicationStatus === 'discontinued'`. 7 i18n keys en/es. 2 analytics events (DAILY_GUIDANCE_VIEWED, DAILY_GUIDANCE_WHY_TAPPED). `guidanceContext` wired into `useTodayData()`. 5 Vitest tests. Fixed `mockAI.test.ts` to match new `MOCK_DAILY_GUIDANCE` shape. 357 Vitest + 62 jest-expo pass. | ✅ |

### Correction note (2026-05-30 audit)

A code audit against committed HEAD `81b2433` found that sessions **42, 43, 44, 45** were
logged ahead of the code: their descriptions were written, but the consuming component
changes were never committed to this repo. Only the redesign's translation keys landed,
which are now **dead code**: `voice_hero_title`, `voice_hero_subtitle`, `voice_cta`, and
`free_logging_note` exist in `en.json`/`es.json` but no component references them.

The build currently under on-device test (`81b2433`) ships the **session-41 voice UI**
(side-by-side Photo/Voice buttons, compact mic button) and the **session-46 Daily AI
Guidance** feature only. Sessions 41 and 46 are verified accurate. The voice-hero redesign
and token cleanup remain to be built (see Direction B backlog below if re-prioritized).

### Upcoming — Visual Redesign (Direction B)

Design direction locked in session 14 brainstorm. Implement in order:

| # | Item | Priority |
|---|---|---|
| D1 | ThemeContext — light/dark token system replacing hardcoded colors.ts | ✅ |
| D2 | Direction B gradient hero — Today screen header with purple→blue gradient | ✅ |
| D3 | ℞ Prescription pad SpotlightCard — purple header, ruled lines, Sig: label, stamped footer | ✅ |
| D4 | Pill strip injection cycle card — 7-cell blister pack, phase colors, today ring | ✅ |
| D5 | Custom tab bar — gradient active pill + dot indicator, light + dark | ✅ |
| D6 | Micro-animations — protein ring fill (spring), readiness score count-up, streak pop-in | ✅ |
| D7 | Skeleton loading states — shimmer ghost cards replacing ActivityIndicator | ✅ |
| D8 | Onboarding gradient hero — Direction B carried through all onboarding screens | ✅ |
| D9 | Milestone card gradient upgrade — unlocked achievements get gradient card treatment | ✅ |
| D10 | Protein floor reveal card — big 52px number with formula breakdown, ℞ watermark | ✅ |

---

## Month 2 — Core Tracking (complete)

1. Food logging (manual entry + barcode scanner via expo-camera)
2. Daily check-ins (nausea 1-5, energy 1-5, water tracker)
3. Weight tracking + EWMA trend chart (SVG, react-native-svg)
4. Streaks gamification (STREAK_THRESHOLD = 0.80)
5. 10 pharmacist-authored content cards carousel on Today screen
6. Readiness score wired to live check-in data

---

## Month 1 — Foundation (complete)

1. Auth (email + Apple Sign In)
2. First-launch consent flow (ToS + Medical Disclaimer + Privacy Policy)
3. 10-step onboarding (medication → injection day → body → safety → dietary → goals → status → protein floor → import → reveal)
4. Protein floor calculator with safety bounds + acknowledgment modal
5. Injection cycle calculator
6. Today screen skeleton (Readiness Score + protein ring + phase badge)

---

## Stack Additions (post-scaffold)

| Package | Purpose |
|---|---|
| expo-camera 17.0.10 | Barcode scanning |
| expo-image-picker 17.0.11 | Photo food recognition |
| expo-haptics 15.0.8 | Welcome screen tap feedback |
| @react-native-community/datetimepicker | Date/time pickers in Add Shot (requires new EAS build) |
| expo-av ~16.0.8 | Audio recording for voice food logging |
