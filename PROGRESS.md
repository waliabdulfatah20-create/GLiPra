# Glipra — Build Progress
# Full history of what has been built. Not needed by Claude during coding.
# Update this file at the end of each session.
# Last updated: 2026-06-02 (session 39 — Nutrition redesign, Micronutrient upsell, entitlement fix, voice tokens, expo-av→expo-audio, real AI confirmed on device, Glipra→GLiPra rebrand)

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

| 47 | GDPR data export + account deletion (Tier 0, always-free) — two edge functions: `export-user-data` (service-role reads all 12 user tables → single JSON bundle, inline return, 1/day rate limit, `ai_invocations` log) and `delete-user-account` (`auth.admin.deleteUser` → FK CASCADE wipes all tables). Client `src/features/account/{api,hooks}.ts` + `delete-account-modal.tsx` (type-to-confirm "DELETE"/"ELIMINAR", built on RN Modal + tokens, NOT the dead NativeWind `ui/modal.tsx`). Settings Account section: Export my data (writes JSON → expo-sharing) + Delete account (destructive → modal → deleteAccount → signOut). Removed 4 dead i18n keys (`voice_hero_*`, `voice_cta`, `free_logging_note`); added `settings.export_data`/`delete_account` + new `account` namespace (en/es parity 313=313). 2 analytics events. 6 Vitest tests (account-api). 363 Vitest + 62 jest-expo pass. Privacy policy already covers "portable copy" + in-app deletion (no copy change needed). Both edge functions DEPLOYED to Supabase 2026-05-30. PENDING: attorney review of delete-modal copy before public release; on-device test with a throwaway account. | ✅ |
| 48 | Tooling repaired + real-bug fixes; `pnpm check-all` now GREEN (was crash-broken). Type-check driven 44 to 0: added missing `@react-navigation/native`+`/bottom-tabs`+`/elements` deps; deleted dead `theme-item.tsx` (Obytes ThemeItem remnant); `expo-file-system/legacy` for SDK-54 (readAsStringAsync/writeAsStringAsync/cacheDirectory moved out of main entry, was a runtime throw in voice/export/PDF); created missing `barcode_corrections` table (migration `017`, db push + type regen, RLS) which fixed a silently-broken feature; RevenueCat v10 typing (getPurchasesModule typed as module namespace but returns `.default`); SDK-54 NotificationBehavior; ai-coach `MOCK_COACH_REPLY`; TodayProfile.createdAt; misc. Arabic fully removed (`ar.json` deleted + unwired from resources.ts/utils.tsx). eslint.config.mjs calibrated (ignore `**/*.md`; filename-case allows kebab+pascal+camel; large/risky rules to warn; inline disable prefixes `@typescript-eslint/`→`ts/`). Result: lint 2931→0 errors (226 non-failing warnings), type-check 0, 363 Vitest + 62 jest-expo. | ✅ |
| 49 | GitHub Pages / glipra.com landing restored. Pages serves `master /docs` (Jekyll); when the dosepath app repo took over GLiPra.git, `/docs` got replaced by the unmodified Obytes Astro template (Jekyll cannot build Astro → deploys failing; CNAME dropped → glipra.com 404; site frozen on last good deploy). Fix (`1a14aa5`): restored the static landing into `docs/` (`index.html`, `privacy.html`, `terms.html`, `legal/`, `CNAME`=glipra.com, `.nojekyll`) from the local root docs-wrapper repo; removed the Astro cruft; moved internal planning docs to `dosepath/internal-docs/` (not published). Verified live: glipra.com loads again. | ✅ |
| 50 | Sign In button invisible fix. The shared `Button` (`src/components/ui/button.tsx`, Obytes stub) had no `backgroundColor` and a default-black label, so the default-variant button (sign-in, sign-up, forgot-password, onboarding, feed) rendered black-on-dark = invisible (looked "not working" but onPress was wired). Re-styled against colors.ts tokens via `useTheme()`: default = `colors.primary` fill + `colors.white` label; all variants styled; disabled/loading dim. Regression test added. 63 jest + 363 Vitest, type-check 0, lint 0. Shipped to the installed dev build via EAS Update (OTA) on `development` channel (update group `61ad727c`), no rebuild needed. Commit `a3a95e9`. | ✅ |
| 51 | Post-sign-in flicker loop + white flash fixed. After the button became tappable, live sign-in caused a continuous white-flicker loop (cold reopen was fine). Root cause: Supabase client had `autoRefreshToken: true` but no AppState management, so on sign-in the refresh timer raced the stale persisted session and reused a rotated refresh token (`Invalid Refresh Token: Already Used`), churning the session signIn<->signOut and ping-ponging the `(auth)<->(app)` router. Fix (`5717bf5`): tie auto-refresh to AppState in root `_layout.tsx` (startAutoRefresh on active, stopAutoRefresh on background — the Supabase RN-documented remedy); the churn is now a single transient settle, not a loop. Also made the root `GestureHandlerRootView` background follow the device color scheme (dark on dark devices) instead of a hardcoded light `#f7f9fc`, killing the white flash. OTA to `development`. | ✅ |
| 52 | Post-sign-in blank/stranded-on-sign-in fixed (the real blocker, found via live Metro logs). Logs showed `status: signIn` but `hasAgreed: false` (consent never recorded on this build) — and `(auth)/_layout` returned `<Redirect href="/(auth)/consent">` WITHOUT rendering `<Stack>`, so the consent screen (which lives in that Stack) could never mount → blank/stuck on sign-in. Fix (`02c0000`): navigate to consent IMPERATIVELY via `router.replace('/(auth)/consent')` in a `[status, hasAgreed]` effect while rendering a plain `<Stack>`, so the consent screen mounts. Flow now: sign in → consent → agree (`setHasAgreed(true)`) → `(app)` → Today. Confirmed working on device. Temp `[GLIPRA]` diagnostic logs removed afterward. 63 jest + 363 Vitest, type-check 0, lint 0. | ✅ |
| 53 | Nutrition Log voice-hero / photo-row redesign — ACTUALLY SHIPPED this time (the session 44/45 redesign that was logged-but-never-committed; the 4 "dead" keys are now live). `voice-capture-button.tsx`: idle state restyled into a full-width navy hero card (`#1E1B4B`, 👑 PRO badge, mic, brand-purple waveform, "Speak your meal" / "Voice AI extracts macros instantly" / "Tap to record →" pill); recording/loading/Pro-gate logic untouched. `photo-capture-button.tsx`: the big violet gradient card became a compact white action row (camera circle + "Photo scan" / "AI estimates from image" + amber AI pill + brand PRO pill + chevron); camera/Pro-gate logic untouched (added `useTranslation`). `log.tsx`: the two stack vertically (voice hero, then photo row) instead of side-by-side; emerald "Barcode and manual entry are always free." caption added under the Manual/Barcode toggle. Re-added the 4 i18n keys (`voice_hero_title`, `voice_hero_subtitle`, `voice_cta`, `free_logging_note`) en/es; `photo_row_title/subtitle` already existed. Presentation only. 63 jest + 363 Vitest, type-check 0 (touched files), lint:translations parity. Commit `bd7eb76`, OTA to `development` (update group `d768cfd3`). | ✅ |
| 54 | Micronutrient Watch relocation + frosted "Unlock with Pro" upsell. (a) Logging-first reorder in `log.tsx`: `DailyMacroCard` + `MicronutrientWatchCard` moved from the top into a results cluster BELOW the logging actions (above "Today's log"), so the empty micronutrient state no longer pushes the CTAs below the fold. (b) `micronutrient-watch-card.tsx` turned the Pro gate into a conversion surface — Pro users see the real card only when micros are logged (else `null`, removing the empty microscope state); free users get a new `MicronutrientUpsell` fallback: sample nutrient tiles dimmed to 45% behind a frosted scrim (`colors.surface` @ 0.82, two-layer so text stays crisp; no `expo-blur` → OTA-shippable), 🔒 + "See what your meals are missing" + B12/D/Mg/Zn subtitle + "Unlock with Pro" pill (opens paywall, entitlement `glipra_pro`), labelled "Sample preview". 4 i18n keys (`micronutrient_upsell_title/subtitle/cta/sample`) en/es. 63 jest + 363 Vitest, type-check 0 (touched), parity ok. Commit `059fe5c`, OTA to `development` (update group `8818b5d0`). NOTE: dev build auto-unlocks Pro, so the free teaser path is not visible on-device without forcing `isPro=false`. Pre-existing entitlement-id inconsistency flagged (`pro-gate.tsx` + `photo-capture-button.tsx` use `'GLiPra Pro'`; canonical is `'glipra_pro'`). | ✅ |
| 55 | Paywall entitlement-id standardized to `'GLiPra Pro'` (`b8612f3`). The `isPro` detection (`use-subscription.ts` / `revenue-cat.ts` `ENTITLEMENT_ID`) and the pro-gate/photo paywall calls all used `'GLiPra Pro'`, but `voice-capture-button.tsx` + the new micronutrient upsell passed `'glipra_pro'` — a mismatch that would present the paywall against a non-existent entitlement. User confirmed `'GLiPra Pro'` is the real dashboard identifier, so the 2 paywall calls were changed to match (now all 6 occurrences agree). Updated the CLAUDE.md note (was `'glipra_pro'`). OTA to `development` (group `b2bdd84f`). 63 jest + 363 Vitest, type-check 0. | ✅ |
| 56 | Dead micronutrient empty-state code removed (`a574121`). After entry 54 turned the Pro-empty path into `null`, the card's `emptyState`/`emptyIcon`/`emptyText` styles + the sole consumer of the `log.no_micro_data` key were orphaned. Removed the 3 styles and dropped `no_micro_data` from en/es (parity preserved). No behavior change. 63 jest + 363 Vitest, type-check 0. | ✅ |
| 57 | VoiceCaptureButton hardcoded hex → semantic tokens (`9600292`) — closes the last open item from the session-42 era (entry 42). Added 8 tokens (`voiceHeroBg`, `voiceHeroBadgeBg`, `voiceHeroBadgeBorder`, `voiceHeroCtaBg`, `voiceHeroWave`, `voiceHeroTextMuted`, `recordingBg`, `recordingWave`) to `GlipraColorTokens` + both light/dark palettes (identical values — the hero is an always-dark surface by design, like the hero gradient). `voice-capture-button.tsx` now references `colors.*` exclusively; zero color literals remain. Values byte-identical to before → no visual change. 63 jest + 363 Vitest, type-check 0. | ✅ |
| 58 | expo-av → expo-audio migration (`9514209`). expo-av is deprecated in SDK 54; the voice button was its only consumer. Swapped to the hook-based API: `useAudioRecorder(RecordingPresets.HIGH_QUALITY)` + `record()`/`stop()`/`.uri`, top-level `requestRecordingPermissionsAsync()` + `setAudioModeAsync({ allowsRecording, playsInSilentMode })`; dropped the `Audio.Recording` state for the recorder hook + an `isRecordingRef` for unmount cleanup. Output stays `audio/m4a` so `voice-recognition.ts` + the `transcribe-food` edge function are untouched. Registered the `expo-audio` config plugin in `app.config.ts` with an iOS `microphonePermission` string (NSMicrophoneUsageDescription; Android RECORD_AUDIO auto-added). Removed `expo-av` from package.json. **NATIVE MODULE SWAP → not OTA-able; requires a new dev build.** Kicked EAS Android dev build `76b10461`. type-check 0, 63 jest + 363 Vitest. PENDING on-device test of the new recorder (record→stop→review sheet, permission-denied alert, backgrounding mid-record). | ✅ |
| 59 | Real AI enabled on the development channel (`c1a4a82`). User wanted AI photo recognition working on-device; the pipeline was complete but mock-gated. Flipped `EXPO_PUBLIC_USE_MOCK_AI=false` for the **development** profile only (eas.json `development.env` + `.env.development`); preview/production untouched. **Decoupled the dev Pro auto-unlock from the AI mock flag** — `use-subscription.ts` now forces Pro on `EXPO_PUBLIC_APP_ENV === 'development'` (`IS_DEV_FORCE_PRO`) instead of `IS_MOCK_DEV`, because the Pro-gated photo/voice buttons would otherwise become unreachable once mock went false (no real purchase → paywall). Preview/production still run a live RevenueCat entitlement check. Deployed all 8 edge functions to Supabase (`recognize-food`, `ai-coach`, `transcribe-food`, `generate-daily-guidance`, `generate-visit-prep` + the 3 non-AI) — `recognize-food` had never been confirmed deployed before, which would have made photo return the safe "Unknown food" fallback. `OPENAI_API_KEY` turned out NOT to be set initially (recognize-food logs showed "OPENAI_API_KEY environment variable is missing or empty" → photo errored silently, "Analyzing…" then nothing); root-caused via the dashboard Logs tab and fixed by setting the secret via the Supabase dashboard (2026-06-02). Shipped via EAS Update OTA to `development` (`--clear-cache`, group `7f14f093`). type-check 0, 63 jest + 363 Vitest. **Deliberate dev-only override of the CLAUDE.md legal gate** (attorney review of ai-coach + EscalationCard copy still required before preview/production/public; real AI now bills the OpenAI account, $20/mo dev cap — revert by setting the dev mock flag back to true). **CONFIRMED working on device 2026-06-02** — photo recognition returns real GPT-4o reads of the actual meal; voice also verified on dev build `76b10461`. (Reminder: the OpenAI key was pasted in plaintext during setup → should be rotated.) | ✅ |
| 61 | MedLevelBanner height fix (`25def75`). The medication-level tile in Daily Actions was taller than every other action tile (Daily Check-in / Track Weight / Your Journey) because it stacked a mini PK-curve sparkline above the standard icon+headline+pill+chevron row. Removed the entire `CurveSparkline` component, its SVG imports (`Circle`/`Line`/`Polyline`/`Svg`), unused constants (`AMBER`, `SPARKLINE_W`, `SPARKLINE_H`), the `sparklineRow` style, and the unused `todayOffset`/`injectionIntervalDays` destructure. The card is now a uniform single-row tile; the full curve still lives on the `/medication-level` detail screen it taps into. type-check 0, lint 0 errors, jest 63. OTA group `50eca2d1`. | ✅ |
| 62 | Injection Cycle metric tile background fix (`1a38235`). The "INJECTION CYCLE" tile in TODAY'S METRICS had `phaseAccentBg` (`backgroundColor: colors.primaryLight` = purple tint) making it a different colour from the plain-white Protein Today tile. Removed `styles.phaseAccentBg` from the active card's style array (one-line change in `today-screen.tsx` L421). The phase is still communicated by the 3px `borderTopColor` accent which changes per phase. Both metric tiles now have the same plain white surface. type-check 0, jest 63. OTA group `f0be4245`. | ✅ |
| 60 | Brand rename "Glipra" → "GLiPra" (user-facing only, `00cc02a`). Capitalized the brand as GLiPra everywhere users see it (to evoke GLP-1), across 25 files: app display NAME (`env.ts`), en/es translation values, welcome/consent/onboarding-reveal/health-import copy, paywall + pro-gate "GLiPra Pro", content-card bodies, milestone share text, both legal screens + `LegalDocScreen` footer, camera + notification-permission alerts, the injection-reminder notification body, and the published website (`docs/*.html` + `docs/legal/*.md`). Method: guarded `sed 's/Glipra\([^A-Za-z]\)/GLiPra\1/g'` (leaves `Glipra`-identifiers, which are always followed by a letter) on rendered-string files + targeted edits for `env.ts`/notifications to avoid comments; a grep guard caught two missed files (`paywall.tsx`, `reveal.tsx`). **Deliberately NOT changed** (would break things / invisible to users): code identifiers (`GlipraTokens`/`GlipraTabBar`/`GlipraThemeProvider`, 89 files still use them), `com.glipra.*` bundle IDs, schemes, EAS slug, package name, `glipra.com` domain, all `@glipra.com` emails, the Open Food Facts `User-Agent: Glipra/1.0` header, and code comments. type-check 0, lint:translations parity, 63 jest + 363 Vitest. Shipped: OTA to `development` (group `32cf5f79`) for in-app text + Pages push for the website. NOTE: the home-screen app label flips to "GLiPra" only on the next native EAS build (it's baked into the manifest). | ✅ |

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

**Resolved (session 39):** the voice-hero redesign and the "always free" note were finally
implemented and committed (entry 53, `bd7eb76`) — the previously-dead keys (`voice_hero_title`,
`voice_hero_subtitle`, `voice_cta`, `free_logging_note`) are now live and rendered. The
VoiceCaptureButton hardcoded-hex → semantic-token cleanup (entry 42) was also completed
(entry 57, `9600292`): all colors are now `tokens.ts` values, zero literals remain. The entire
session-42/43/44/45 backlog from that era is now closed.

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
