# Glipra — Architecture Document
> Paste this into every new Claude conversation. Keep it updated as decisions are made.
> Last updated: 2026-06-19 (session 89 — B1 HealthKit + Health Connect native config (needs a native EAS rebuild, not OTA): `app.config.ts` now wires the `react-native-health` plugin (iOS HealthKit usage strings, read-only Weight+Steps, + `com.apple.developer.healthkit` entitlement; EAS auto-syncs the App ID capability, activates post-#87) and the `react-native-health-connect` plugin (Android rationale intent-filter; `READ_STEPS`+`READ_WEIGHT` in `android.permissions`; `<queries>` auto-merges from the lib manifest). Health Import un-hidden in Settings for all envs. Owner triggers a native build; Play Health Connect declaration is still B11. H2 efficacy-claim methodology (docs-only, last open "High"): documented claim substantiation for Apple review — concise "Claim Substantiation" section in `docs/store/app-review-notes.md` + standalone `docs/store/efficacy-claims-methodology.md` (per-claim: source file, methodology/citation, disclaimer, forbidden-claim negative space; 40% stat cited to STEP 1 + SURMOUNT-1 NEJM 2021/2022; scores framed as algorithmic estimates; pharmacist credential = authorship). DRAFT, joins attorney #89. Owner-run infra sprint. DB: pushed migrations 025 (drop `profiles.allergens`), 026 (drop `profiles.is_pregnant`), 027 (create `apple_oauth_tokens` — RLS ON, no policies, service-role only); regenerated `src/types/database.ts`. Auth (B8): Supabase Confirm email ON; 4 redirect URLs in allowlist (`glipra://`, `glipra://reset-password`, `glipra.preview://`, `glipra.preview://reset-password`). Demo account (B9): `reviewer@glipra.com` UUID `bd9f9e4c-91f8-4018-8860-c44db7d31fef`, auto-confirmed, seeded via `supabase/seeds/b9-demo-account.sql` (Wegovy 8wks, 8 weight logs, 4 injection logs, 16 food entries, 5 check-ins); App Store review notes at `docs/store/app-review-notes.md` — fill `[PLACEHOLDERS]` + grant `glipra_pro` RevenueCat promo entitlement before submit. session 88 — Pro Annual price cut $79.99 → $49.99/year (owner decision: lower commitment friction for an unproven brand; reframed "$4.17/mo, billed annually", badge recomputed to SAVE 58%). Swept the hardcoded price across paywall-screen.tsx (+ new optional PriceTier `sub` prop) + pro-gate.tsx + docs/index.html + internal docs (CLAUDE/ARCHITECTURE/apple setup). Monthly $9.99 + Founder Lifetime $149 unchanged. Paywall price is hardcoded (not RevenueCat-sourced); owner must also set $49.99 in App Store Connect / Google Play / RevenueCat so the displayed price matches what's charged. 7-day trial spec'd (intro offer on annual + monthly, dynamic eligibility via a RevenueCat Offerings refactor) and deferred to #92 — design doc `internal-docs/superpowers/specs/2026-06-16-free-trial-design.md`. session 87 — H5: DBA filed → unified the user-facing operating name "Leonava" → **PHARMSTRONG** across the 15 legal/store-copy surfaces (in-app privacy/terms screens + shared legal footer; all docs/ web legal pages; canonical docs/legal/*.md), 59 occurrences. App stays branded Glipra. The LLC's registered name stays "Leonava LLC" for Apple/Mercury enrollment + internal docs (a DBA does not rename the LLC); attorney (#89) to confirm the formal "Leonava LLC dba PHARMSTRONG" controller phrasing. Copy-only OTA + website-on-push; unblocks the held branch (H5 + H6 + H10 + #91 + #90 push together). session 86 — #90 inline PK/titration viz on the Dose hub's `MedLevelBanner`: new `MedLevelSparkline` (downsized `LevelChart` — gradient + curve polyline + amber today dot, self-measuring width, null < 2 pts) + a pure tested `daysToSteadyState(medicationId)` (≈5 half-lives) in the Rule-4 medication-level calculator, shown with a "Steady state about N days after starting" caption (drug property, not a personal countdown). Reuses `useMedicationLevelCurve`; injection face today (oral MedicationCard = fast-follow); 4 Vitest; `med_banner.steady_state_eta` EN+ES; client-only OTA. session 85 — #91 "Prep for your visit" ActionRow added to the Dose hub's shared area (both routes) → `/visit-prep`, reusing the local ActionRow + ClipboardCheck + the Settings route; 2 `dose.visit_prep_*` keys EN+ES; client-only OTA. Cascade E (global AI-recognition cache) DEFERRED to v2 after a design pass: photos can't be cache-served (image input), and the "feed the free search with community AI estimates" version escalates cross-user-estimate liability (attorney #89) with no pre-launch payoff — plan saved for post-launch. session 84 — H10 Sign in with Apple token revocation on account deletion (Apple 5.1.1(v)), built credential-gated (activation #87-gated). Architecture: capture the native Apple `authorizationCode` at sign-in → `apple-link` edge fn exchanges it (Apple `/auth/token`) for the refresh token using an ES256 client-secret JWT (`supabase/functions/_shared/apple.ts`, Web Crypto PKCS#8/P-256, raw r‖s sig) → stored service-role-only in `apple_oauth_tokens` (migration 027; RLS ENABLED with NO policies = default-deny to anon/authenticated, service_role bypasses; the token is never client-readable) → `delete-user-account` best-effort revokes (`/auth/revoke`) before `admin.deleteUser`, logging-but-never-blocking on failure. Wired the previously-dead Apple buttons via optional `onApplePress`. `getAppleConfig()` (all four `APPLE_*` env present) gates everything → clean no-op pre-enrollment (sign-in + deletion unchanged). Apple returns a refresh token only on FIRST authorization → `apple-link` upserts only when present (never nulls a stored token). client_id = app bundle id for native SIWA. Edge/Deno code is NOT covered by jest/vitest (no Deno gate) — ships uncovered; client `apple-link` wiring has 5 jest tests. OWNER RUNBOOK (post-#87): (1) Apple portal — App ID `com.glipra` has Sign in with Apple, create a SIWA Key (download `.p8` once + Key ID), note Team ID, client_id=bundle id; (2) Supabase secrets `APPLE_TEAM_ID`/`APPLE_KEY_ID`/`APPLE_CLIENT_ID`/`APPLE_PRIVATE_KEY`; (3) `supabase db push` 027 + regen types (verify a non-service role reads zero rows from `apple_oauth_tokens`); (4) deploy `apple-link` + `delete-user-account`; (5) Supabase Auth → Providers → Apple: enable + authorize the bundle id; (6) E2E on a real iOS build — sign in with a NEW Apple ID (`apple-link` logs `linked:true`, row exists) → delete account (`{success:true}`, revoke attempted, row gone) → sign in again → Apple shows the first-time consent screen (proves revocation). Recommend a one-off Deno script to sign+exchange against the real key before trusting the deletion-time revoke. session 83 — H6 store-compliance copy fix: name OpenAI in the AI-privacy narrative. OpenAI was already named in the in-app modal + subprocessor lists + subprocessors page; the "AI Features" narratives still said "third-party AI" / "our AI provider". Named OpenAI (US third-party AI provider; photos/voice not used for training, extended to cover voice/Whisper) in the in-app privacy-policy screen §3, canonical `docs/legal/privacy-policy.md` §6.3, and `docs/privacy.html`; dropped a stale cross-ref. Copy only; all surfaces remain DRAFT and join attorney packet #89. In-app screen OTA, website on push. session 82 — H3 store-compliance fix (Google Play prominent disclosure): show a one-time in-app rationale BEFORE the OS camera/microphone prompt. New `usePermissionDisclosure` AsyncStorage gate (per-permission keys, mirrors `useAiPrivacyAck`) + shared `PermissionDisclosureBody` + `PermissionDisclosureModal`. Gated in `ai-capture-hero.tsx` for photo (camera) + voice (mic) after the Pro check and before the permission request / autoStart recorder mount; barcode scanner's pre-grant copy upgraded to the same body. Distinct from the existing AI-privacy data modal (OpenAI-data disclosure, fires after the prompt). EN+ES; no native/app.config change (usage strings already declared); client-only OTA; no attorney gate. session 81 — H1 store-compliance fix (Apple 2.3.1): removed the stale `Micronutrient watch` entry (+ its now-unused `Activity` icon import) from `PRO_BENEFITS` in `paywall-screen.tsx`, so the paywall no longer advertises a free feature as Pro. Micronutrient watch was already free + ungated everywhere else (in-app card, website, store copy, i18n) — the paywall was the lone contradiction. Client-only, OTA; no migration/edge/i18n/test change. Gates: tsc 0, lint 0, jest 162, vitest 671, parity. session 80 — Meal Ideas in the Coach tab (Pro, on-demand): educational "meal ideas," deliberately NOT a prescriptive meal plan/MNT (liability reframe). New generate-meal-ideas edge fn (anonymized input, attorney-gated nutrition-only prompt respecting protein floor + kidney cap + nausea textures + diet, Zod+fallback, 15/day), pure buildMealIdeasContext + useMealIdeas + MOCK_MEAL_IDEAS, MealIdeasCard with Tier-1 disclaimer, meal chips behind ProGate, EN+ES. Edge deploy owner-run; prompt + disclaimer to attorney #89 before prod. session 79 — glipra.com redesign: rebranded the docs/ website to the app's deep-violet identity via a new shared `docs/assets/site.css` (real icon logo + favicon, purple->blue->teal gradient, warm cream); index.html rewritten accurate to shipped features (oral support, Muscle Score, correct free/Pro, scoped coach); legal/support pages unified onto the shell; built subprocessors.html (Resend dropped, matching the policy) + refund-policy.html; added favicon/OG/canonical + robots.txt + sitemap.xml + og-image.svg. Legal-text finalization stays attorney-gated (#89). Pages-only, no app change. session 78 — Liability-audit fixes: removed the dead EscalationCard "Call Prescriber" button (false affordance) -> plain prescriber/911 text; removed fabricated landing testimonials + added drug-name non-affiliation/trademark disclaimer (landing + Settings About); "not a dose recommendation" added to medication-level; AI-not-medical-advice disclaimer on the photo review sheet; em dashes scrubbed; dropped dormant is_pregnant (migration 026). EscalationCard + med-level copy flagged for attorney (#89). session 77 — Removed the `allergens` field end-to-end (migration 025 drops the column; recognize-food AI prompt + client plumbing + docs stripped): the app makes no allergen-avoidance safety promise, and the field had no collection UI — data minimization for App Privacy/Data safety. Decided against an allergen UI as out of scope. Ran a liability audit; findings logged in PROGRESS (dead EscalationCard CTA, med-level dose framing, fabricated landing testimonials, drug-name non-affiliation disclaimer, em dashes, dormant is_pregnant). session 76 — Auth deep links (B8 code part): env-aware reset/confirm redirects via expo-linking, pure parseAuthRedirect fragment parser, root _layout deep-link handler (setSession + route recovery), root-level reset-password route + ResetPasswordForm, emailRedirectTo on sign-up; supabase client stays detectSessionInUrl:false (manual native handling). Owner re-enables Confirm email + redirect allowlist. session 75 — Web pages on the glipra.com GitHub Pages site (docs/): delete-account.html (B13 account-deletion URL for Play) + support.html (B15 support page), privacy.html document style, cross-linked from index/privacy/terms footers; owner enters the deletion URL in Play Console + confirms the inbox. session 74 — Settings Support section: "Contact support" (glipra.com/support) + "Email us" (mailto legal@glipra.com, app version/platform prefilled) rows, EN+ES (store blocker B15 in-app part; web page + inbox owner-run). Visit-prep PDF now includes the MEDICATION CHANGES section (#177), mirroring the on-screen switch-history card: pure `medicationChangeToPdfRow` helper feeds `useGeneratePdf` -> the `generate-visit-pdf` edge fn renders a capped switch list. Edge fn redeployed + client OTA'd; backward-compatible (optional field). session 73 — Store blockers B10 + B14 (content/docs only): full EN+ES store-listing copy in `docs/store/listing-copy.md` with the locked master "not a medical device" disclaimer embedded verbatim (B10); privacy policy reconciled to shipped code across all 3 surfaces — removed the false push-notification-token declaration (local notifications only, no token registered) and the Resend subprocessor line (no edge function uses it; Supabase Auth's built-in mailer handles confirmation/reset) — plus a Play Data-safety / Apple App-Privacy answer sheet in `docs/legal/data-safety-app-privacy.md` (B14 reconciled; banner/effective-date/address/form-filing remain attorney-gated #89); session 64 — In-app medication switch (tablets <-> injection) keeping subscription + progress (migration 024) + a pre-submission App Store / Play compliance audit; session 63 — Muscle score bug fix: count the current week's resistance sessions (deriveResistanceInput adapter); session 62 — Quick-add micronutrient supplements (per-nutrient tap, own 'supplement' source, migration 023); session 61 — Rescan photo from the AI review sheet (hint-first re-run on the same cached photo); session 60 — Micronutrients tile deep-links the Nutrition screen scrolled to the Micronutrient Watch; session 59 — Muscle Preservation Score merged into the Fuel hero dial (muscle = hero dial, Readiness = pill, "Why?" = muscle levers); session 58 — Combined "Log with AI" hero (voice + photo share one card) + Coach empty-state centering; session 57 — Coach premium redesign (gradient hero + suggestion chips + avatar bubbles, theme-aware) + Nutrition Log spacing; session 56 — Dark-mode polish: check-in intensity scales + filling-glass water, merged Dose medication card, tighter search row; session 55 — Today Fuel hero card (merged Readiness + Protein, added fiber + micronutrient spots); session 54 — Daily check-in reminder notification (9 AM, opt-in); session 53 — Cascade D: seeded foods table (migration 022, 200 curated seeds) + Search database modal + AI wrong-food fix + code-review hardening; session 52 — Phase G: onboarding trim (drop appearance/goals/import, defer dietary to a Today nudge + Settings); session 51 — Phase D part 2: free Micronutrient Watch + removed discontinuation/maintenance modes; session 50 — Onboarding redesign: shared scaffold/option-card/chip/footer components, neutral-dark palette fix (app-wide), 12-hour AM/PM dose times; session 49 — Muscle-First MVP Phase D part 1: iron tracking end-to-end (migration 021); session 48 — Phases A/B/C (resistance log, Muscle Preservation Score, Progress reframe + de-dupe) + dev-OTA Supabase creds fix + real-AI owner decision; session 47 — Metro bundler crash fix + phase column drift fix; session 46 — Settings protein-target editor; Dose-tab Direction B Phases 1-4 complete). App name: Glipra. Formerly working name: Satia.
> Scaffold complete: Obytes v9.0.0 / Expo SDK 54 / pnpm / NativeWind stripped.
>
> **Scaffold from:** [obytes/react-native-template-obytes](https://github.com/obytes/react-native-template-obytes)
> — this boilerplate matches our exact stack and saves 2-3 weeks of setup.

---

## What Glipra Is

A GLP-1 nutrition companion app built by a licensed pharmacist.
Core promise: **"We make sure you don't lose muscle while GLP-1 does its job."**

Every feature serves muscle preservation, not weight loss. Weight loss is the drug's job.
Our job is protein floors, micronutrient coverage, injection-cycle-aware guidance, and
clinical safety — backed by real pharmacist expertise no generic macro tracker can replicate.

**Target user:** Adults on semaglutide (Ozempic, Wegovy), tirzepatide (Mounjaro, Zepbound),
liraglutide (Saxenda, Victoza), dulaglutide (Trulicity), or compounded GLP-1/GIP agonists
who are anxious about muscle loss, confused about nutrition, and underserved by every existing app.

**The Glipra positioning vs MeAgain (current #1):**
*Match MeAgain on UX polish and feature breadth. Beat them on clinical credibility.*
Where MeAgain has an RDN, Glipra has a licensed pharmacist.
Where MeAgain has Capy, Glipra has a Readiness Score grounded in real pharmacokinetics.
Where MeAgain wants users on telehealth forever, Glipra supports the full journey
including discontinuation.

**Eight killer differentiators no competitor — including MeAgain — can match:**
1. Licensed pharmacist credential (MeAgain uses RDN)
2. Injection cycle intelligence — every recommendation is phase-aware
3. Protein floor as hero metric with kidney-disease and BMI safety bounds
4. Voice + hybrid AI logging for nausea days when no other app works
5. Clinical red-flag detection with real escalation — free for all users
6. Discontinuation/maintenance mode — the only app that handles "after"
7. Pre-prescriber visit prep — respects external prescribers (MeAgain hides users from them)
8. Pharmacist-authored content in English and Spanish

---

## Competitive Landscape

Monitor weekly: [theglp1list.com](https://theglp1list.com/en) — community-ranked GLP-1 apps.

### The Primary Benchmark: MeAgain

**MeAgain is the app to study, match on UX, and beat on clinical credibility.**

| Metric | Detail |
|---|---|
| Maker | Dots Future Technologies (NYC) |
| Reported revenue | ~$400K/month |
| Users | 372,000+ |
| App Store rating | 4.8 stars (16,000+ ratings) |
| Pricing | $9.99/month or $49.99/year (Premium) |
| Platforms | iOS-first, Android launched late 2025 |
| Clinical lead | Erin, RDN (registered dietitian) — NOT a pharmacist |
| Recent crown | "#1 GLP-1 Tracking App for 2026" press release Dec 2025 |
| Business model | App subscription + optional telehealth ("MeAgain Care") + cash-pay medications ($129-199/mo compounded; brand match LillyDirect/NovoCare) |

**Why Glipra wins on positioning:** MeAgain's nutrition lead is a Registered Dietitian.
Glipra is built by a licensed pharmacist. For *medication-related* questions —
side effects, drug interactions, dose timing, when to call your prescriber — a
pharmacist credential is stronger and more legally defensible. Lean into this.

**Why Glipra wins on features:**
- MeAgain has no protein floor with kidney-disease safety bounds (legal/clinical gap)
- MeAgain has no red-flag clinical escalation (safety gap)
- MeAgain has no Spanish localization (market gap — Hispanic GLP-1 adoption is significant)
- MeAgain has no discontinuation/maintenance mode (their business model wants you on telehealth forever)
- MeAgain has no couples/linked accounts (viral lever they're missing)
- MeAgain food scan accuracy is the #1 user complaint — beatable

**What MeAgain does brilliantly that Glipra must match or exceed:**
1. **Capybara widget (Capy)** — gamified home screen companion. Tamagotchi-like.
   Users say "I just needed a capybara to not disappoint." Drives daily logging.
2. **Journey Cards** — visual progress timeline with photos, weight, symptoms, milestones.
   Different from streaks — these are shareable artifacts.
3. **Shot Day prep checklist** — list of things to do on injection day to reduce side effects.
4. **Medication level estimator** — dynamic graph showing estimated mg in system over the week.
5. **Smart food logging** — photo + barcode + voice with AI extraction (we have this).
6. **Ghost photo** — before/after side-by-side photo comparison.
7. **Custom dosing + microdosing support** — supports users on non-standard regimens.
8. **AI coach** — "Ask anything, get real answers" with personalized advice.
9. **Holistic dashboard** — protein, fiber, water, steps, shots, side effects in ONE view.
10. **Streaks tied to gamification** — celebrating consistency, not just dramatic weigh-ins.

### Direct Competitors (Ranked by Threat)

| App | Strength | Weakness vs Glipra |
|---|---|---|
| **MeAgain** (meagain.com) | #1 ranked, all-in-one, capybara, AI photo logging, 372K users, $400K/mo | RDN not pharmacist, no protein floor safety bounds, no red-flag escalation, no Spanish, no discontinuation mode, English-only |
| **Shotsy** (shotsyapp.com) | Multi-medication tracking, color-coded dose charts, $39.99/yr (cheaper than MeAgain), PDF exports, maintenance mode, Apple Health, "your data stays private" positioning | Generic macro tracking, no pharmacist, no AI photo, no red-flag escalation, no Spanish |
| **Glapp** (glapp.io) | iOS-only, injection phase visualization, AI Q&A, clinical trial comparison | No pharmacist, no protein floor, no Spanish, iOS-only, no Android |
| **My GLP Shot** (myglpshot.com) | Privacy-first PWA, $19.99/yr, offline-first, end-to-end encrypted sync, reconstitution calculator | No nutrition AI, no muscle preservation focus, no clinical credential |
| **Pep** (pepglp1.com) | Compounded GLP-1, microdosing, customizable reminders | No nutrition depth, no pharmacist |
| **GLPeak** (glpeak.ai) | AI-powered tracking | No clinical credential, no muscle preservation focus |
| **Glyppo** | Apple Health sync, no accounts, $X one-time | iOS-only, no nutrition, no AI |
| **GLP Compass** | Full analytics + half-life estimation | Complex UX, no protein floor |
| **MyTherapy** | Free, multi-condition tracker | Not GLP-1-specific |

### The Competitive Gap Map

| Feature | MeAgain (#1) | Shotsy | Glapp | MyGLPShot | Pep | Glipra |
|---|---|---|---|---|---|---|
| Licensed pharmacist authorship | ❌ (RDN) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Protein floor with safety bounds (kidney, BMI) | Partial | ❌ | ❌ | ❌ | ❌ | ✅ |
| Red-flag escalation (pancreatitis, dehydration) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Discontinuation/maintenance mode | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Spanish localization | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Couples/linked accounts | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Pre-prescriber visit PDF | Partial | ✅ | ❌ | ❌ | ❌ | ✅ |
| Multi-medication history | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Compounded GLP-1 support | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Microdosing support | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| AI photo food recognition | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Barcode food scanning | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Voice food logging | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Medication level estimator chart | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Injection site rotation map | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Shot Day prep checklist | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Companion mascot widget | ✅ (Capy) | ❌ | ❌ | ❌ | ❌ | ✅ (Glipra needs one) |
| Journey Cards (photo + data milestones) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ghost photo (before/after) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ (optional, v2) |
| Streaks gamification | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Apple Health + Health Connect | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Android + iOS | ✅ | ✅ | ❌ | ✅ (PWA) | ✅ | ✅ |

**The seven things only Glipra has:**
1. Licensed pharmacist authoring all clinical content
2. Protein floor with kidney disease + pregnancy + BMI safety bounds
3. Red-flag clinical escalation (pancreatitis, dehydration, gastroparesis)
4. Discontinuation/maintenance mode for after-GLP-1 life
5. Spanish localization at launch
6. Couples/linked accounts for viral growth
7. Pre-prescriber visit PDF that respects the user's external prescriber

These are the moats. MeAgain can't add them quickly because (a) they don't have a pharmacist,
(b) their business model depends on keeping users on their telehealth (not discontinuation),
and (c) the safety bounds require pharmacist judgment to defend in court.

---

## MeAgain Feature Parity Plan

Glipra should match MeAgain on UX polish and feature breadth, then win on
clinical depth, safety, and language. The following features are NEW additions
to the v1 roadmap inspired by MeAgain's UX:

### Companion Mascot Widget (v1)

MeAgain has Capy the capybara. Glipra needs its own mascot — something that:
- Lives on the home screen (iOS widget + Android widget)
- Shows protein progress visually (full belly = protein hit, hungry = need to log)
- Has playful but clinical undertone (not childish)
- Is unique IP — can be trademarked

**Working name candidates:** "Doe" (a deer), "Pax" (peace), "Floor" (the protein floor),
or a non-character abstract widget that's just gorgeous data viz.

**Recommendation:** Skip the mascot for v1 launch. Ship with a polished protein ring
widget instead. Add a mascot in v2 once you have user behavior data on what motivates
the demographic. A bad mascot is worse than no mascot — it cheapens the clinical brand.

If you do build one, the architecture for it:
- `widgets/ios/ProteinCompanion/` — Swift widget extension
- `widgets/android/ProteinCompanion/` — Kotlin widget
- Backed by `companion_state` table tracking happiness/protein progress per day
- Updates via WidgetKit (iOS) / Glance (Android)

### Journey Cards (v1) — IMPLEMENTED 2026-05-23

Visual milestone cards that unlock as the user hits real achievements.
Each card is a shareable artifact with emoji, title, subtitle, unlock date, and a native Share button.

**Architecture (as built):**

```
src/features/journey-cards/
├── milestones.ts        — 8 MilestoneId definitions + MILESTONES record
├── api.ts               — unlockMilestone() (idempotent INSERT ON CONFLICT DO NOTHING)
│                           fetchUnlockedMilestonesWithDates()
└── hooks.ts             — useJourneyCards(), useCheckAndUnlockMilestones(profileCreatedAt, onUnlock?)

src/components/journey/
└── milestone-card.tsx   — MilestoneCard (unlocked) + LockedMilestoneCard (teaser)
                           Share button via Share.share(milestone.shareText)

src/components/ui/
└── milestone-toast.tsx  — Slide-in toast, auto-dismisses 3s, brand-purple left border
```

**8 Milestones (MilestoneId):**

| ID | Title | Trigger |
|---|---|---|
| `week_1_complete` | Week 1 Complete | `profileCreatedAt` ≥ 7 days ago |
| `protein_streak_7` | Protein Streak: 7 Days | `currentStreak` ≥ 7 |
| `protein_streak_30` | Protein Streak: 30 Days | `currentStreak` ≥ 30 |
| `first_checkin` | First Check-in | First successful `upsertCheckIn` call |
| `weight_logged_10x` | Tracking Champion | `fetchWeightLogCount` ≥ 10 |
| `injection_day_warrior` | Injection Day Warrior | Shot logged on same calendar day as `profile.lastInjectionDate` |
| `3_months_strong` | 3 Months Strong | `profileCreatedAt` ≥ 90 days ago |
| `coach_conversation` | First Coaching Session | First successful AI coach reply |

**Unlock pattern (all triggers are idempotent):**
```ts
unlockMilestone(userId, 'first_checkin')
  .then(() => queryClient.invalidateQueries({ queryKey: ['journey-cards', userId] }))
  .catch(() => {}); // fire-and-forget — non-critical
```
`unlockMilestone` uses `INSERT ... ON CONFLICT (user_id, milestone_id) DO NOTHING`
so calling it on every check-in / coach message / weight log is safe.

**Trigger locations:**
- Time-based (`week_1_complete`, `3_months_strong`, streak milestones): `useCheckAndUnlockMilestones` in `journey-cards/hooks.ts` — runs on Today screen mount
- `first_checkin`: `check-in/hooks.ts` → `useUpsertCheckIn` `onSuccess`
- `weight_logged_10x`: `weight/hooks.ts` → `useInsertWeightLog` `onSuccess` (calls `fetchWeightLogCount`)
- `injection_day_warrior`: `injection-sites/hooks.ts` → `useLogInjectionSite(lastInjectionDate?)` `onSuccess` — date-sliced comparison (`injectedAt.slice(0,10) === lastInjectionDate.slice(0,10)`)
- `coach_conversation`: `ai-coach/hooks.ts` → `useAiCoach` `sendMessage` after assistant reply

**Toast wiring (TodayScreen):**
```ts
useCheckAndUnlockMilestones(profile?.createdAt, (ids) => {
  const m = MILESTONES[ids[0]];
  if (m) setToastMilestone(m);
});
<MilestoneToast milestone={toastMilestone} onDismiss={() => setToastMilestone(null)} />
```
Multiple simultaneous unlocks show only the first — all visible in /journey screen.

**Database table (live on cloud):**
```sql
CREATE TABLE unlocked_milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id TEXT NOT NULL,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, milestone_id)
);
ALTER TABLE unlocked_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_milestones" ON unlocked_milestones FOR ALL USING (auth.uid() = user_id);
```

**Sharing:** Each `MilestoneCard` has a Share button that calls `Share.share({ message: milestone.shareText })` — uses native iOS/Android share sheet. No Skia image generation needed; plain-text shares are the growth loop at this stage.

### Shot Day Prep Checklist (v1)

The morning of injection day, Glipra shows a checklist:
- [ ] Hydrated (8+ oz water on waking)
- [ ] Light protein-rich breakfast (Greek yogurt, eggs)
- [ ] Rotate injection site (auto-suggested based on history)
- [ ] Have anti-nausea food ready (crackers, ginger tea)
- [ ] Schedule reminder to eat protein 2hr post-injection

Pharmacist-authored copy. Drives engagement on the highest-anxiety day of the week.

**Implementation:** New `shot_day_prep` content type in `content_cards` table.
On injection day morning, push notification → opens prep checklist.

### Medication Level Estimator Chart (v1)

MeAgain shows a dynamic graph of estimated mg in system across the week.
This is half-life pharmacokinetics — well-documented for each GLP-1.

**Implementation:**
```ts
// src/features/medication-level/calculator.ts

// Half-lives in days
const HALF_LIVES: Record<GLP1MedicationId, number> = {
  semaglutide_ozempic: 7,
  semaglutide_wegovy: 7,
  tirzepatide_mounjaro: 5,
  tirzepatide_zepbound: 5,
  liraglutide_saxenda: 0.5, // daily injection, ~13 hours
  liraglutide_victoza: 0.5,
  dulaglutide_trulicity: 4.5,
  // exenatide (~0.1 day half-life) is NOT in glp1_medications seed table — falls under 'other'
  // Add it to 002_glp1_medications.sql before adding it here, or it silently uses the 7-day fallback
  other: 7,
};

export function estimateLevel(
  dose_mg: number,
  daysSinceInjection: number,
  medication: GLP1MedicationId
): number {
  const halfLife = HALF_LIVES[medication];
  return dose_mg * 0.5 ** (daysSinceInjection / halfLife);
}

export function generateLevelCurve(
  dose_mg: number,
  medication: GLP1MedicationId,
  daysToProject: number = 14
): Array<{ day: number; level_mg: number }> {
  return Array.from({ length: daysToProject + 1 }, (_, day) => ({
    day,
    level_mg: estimateLevel(dose_mg, day, medication),
  }));
}
```

**Pharmacist disclaimer required:** "Estimated based on half-life. Actual levels
vary by individual metabolism, body composition, and other factors. Not a
substitute for serum drug level testing."

### Ghost Photo (v2 — not v1)

Side-by-side before/after photo overlay. Common in fitness apps but emotionally
loaded for the GLP-1 demographic. Defer to v2 with optional opt-in. When built:
- Photos stored locally only by default (privacy)
- Optional encrypted Supabase Storage backup
- Side-by-side compositor uses Skia
- NEVER auto-prompted — user must opt in

### AI Nutrition Coach (v1, scoped to food only)

**⚠️ LIABILITY DECISION:** AI Coach is scoped to GLP-1 NUTRITION questions only.
"Ask anything" is explicitly NOT the model. An open-ended AI that answers medication
questions, while branded with a pharmacist credential, creates a clinical duty of care
that no disclaimer fully eliminates. Attorney must review prompts before launch.

**What the Glipra Nutrition Coach answers:**
- Protein sources, portion strategies, high-protein meals
- Fiber and hydration guidance
- What to eat on nausea days, peak suppression days
- Food timing relative to injection cycle
- General GLP-1 nutrition context from pharmacist content cards

**What it hard-blocks with a canned response:**
- Drug interaction questions → "For medication questions, contact your prescriber or pharmacist directly."
- Dosing questions → same canned response
- "Is it safe to..." questions → same canned response
- Symptom interpretation → "If you're concerned about symptoms, contact your prescriber."

**The `ai-coach` edge function:**
- Powered by GPT-4o mini
- System prompt explicitly limits to nutrition only — never medication advice
- Input screened with keyword blocklist before hitting OpenAI
- ALL outputs include tier-1 disclaimer rendered in UI, not just a footer
- First use: mandatory one-time modal explaining scope
- Attorney review of system prompt required before enabling for users

Rate limit: 10 questions/day Pro, 2/day Free.

### Microdosing & Custom Dosing Support (v1)

User can enter any custom dose, not just the standard escalation rungs.
Already partially supported in schema (`custom_dose_description`) — make it
prominent in UI. Microdosing community is large and underserved.

---

## Compliance & Safety Framework (Read First)

### Liability Risk Ranking (Highest to Lowest)

Before building any feature, understand its risk profile:

| Risk Level | Feature | Primary Concern | Mitigation |
|---|---|---|---|
| 🔴 Highest | Pharmacist license + employment | Board complaint, employer contract | Attorney + employer disclosure first |
| 🔴 High | AI Nutrition Coach | Medication questions implying clinical authority | Scope to food only, attorney reviews prompts |
| 🔴 High | Red-flag escalation | False negatives + naming conditions = diagnosis | No condition names in UI, pattern language only |
| 🟡 Medium | AI daily guidance | Hallucination on safety-sensitive users | Unavoidable disclaimers, Zod validation |
| 🟡 Medium | Protein floor calculator | Wrong number for kidney/pregnancy patient | Correct bounds + "confirm with prescriber" |
| 🟡 Medium | Content cards on medical topics | User relies on article during active emergency | Top + bottom disclaimer, emergency redirect |
| 🟡 Medium | "Built by a licensed pharmacist" branding | Raises standard of care in lawsuits | Precise language, no pharmacist-patient relationship |
| 🟢 Low | Food/weight logging | User-reported data, no recommendations | Standard disclaimers sufficient |
| 🟢 Low | Streaks, journey cards | Gamification, no clinical claims | No liability concerns |

**Before launch, attorney must review:**
1. Employment contract — outside activity clause
2. TSBP disclosure requirements for your specific situation
3. All marketing copy mentioning pharmacist credential
4. AI coach system prompt and keyword blocklist
5. ToS arbitration clause and class action waiver
6. Medical disclaimer language in all three forms

### Legal Positioning

Glipra is a consumer health and educational app. It is explicitly:
- NOT a medical device under FDA classification
- NOT a HIPAA covered entity
- NOT providing medical advice, diagnosis, or treatment
- NOT a substitute for prescriber consultation
- NOT establishing a pharmacist-patient relationship

Reinforced through: App Store description, onboarding copy, first-launch consent flow
(mandatory acceptance), persistent disclaimers on AI content, pharmacist-author bylines
stating "for educational purposes only — consult your prescriber."

### Pharmacist Credential — Exact Approved Language

The pharmacist credential is the #1 differentiator AND raises the standard of care
in any lawsuit. Use only these approved forms — never deviate without attorney review.

**Approved everywhere:**
- "Designed by a licensed pharmacist"
- "Pharmacist-authored educational content"
- "Built by a pharmacist"

**Approved in bio/about only:**
- "Glipra was designed by a Texas-licensed pharmacist with [X] years of patient
  counseling experience. Glipra provides educational content for general wellness
  purposes; it does not provide pharmacist counseling, prescription review, or
  professional medical services."

**Never use anywhere:**
- "Your pharmacist recommends"
- "Pharmacist-approved"
- "Pharmacist-prescribed"
- "The pharmacist behind your guidance" (implies active advising)
- "Your virtual pharmacist"
- Any first-person clinical advice as if from the pharmacist

State of licensure (Texas) disclosed in T&C only. Not in marketing copy.
Licensing in one state does not create authority in all 50 states.

### Layered Disclaimer System

Three intensity tiers, declared per screen via `<DisclaimerBanner tier={...} />`:

- **Tier 1 (highest):** AI-generated guidance, protein floor, medication-related content,
  AI coach responses. Modal acknowledgment required at first view. Disclaimer rendered
  at same visual weight as content — not tiny footer text.
- **Tier 2 (medium):** General educational content, side-effect explanations, micronutrients.
  Footer disclaimer + "consult your prescriber" link.
- **Tier 3 (minimum):** Pure user-data display (their own logs, weight). No disclaimer needed.

### First-Launch Consent Flow

After auth, before onboarding step 1, user MUST:
1. Read and accept Terms of Service
2. Read and accept Medical Disclaimer
3. Acknowledge Privacy Policy

Recorded in `profiles.consent_accepted_at` and `profiles.consent_version`.
If terms update, users must re-accept. No app functionality until consent recorded.
This is the single best legal defense in any dispute.

### Active Acknowledgment Modals (High-Risk Moments)

Modal acknowledgments required at:
1. After protein floor reveal in onboarding — with "confirm with your prescriber" checkbox
2. Before logging severe symptoms (nausea 5, vomiting) — brief safety prompt
3. At final onboarding step — mandatory checkbox, not just a button tap
4. First time AI Nutrition Coach is opened — explains it answers food questions only

Each acknowledgment timestamped in `user_acknowledgments` with disclaimer version + IP.
Audit trail is permanent. Events are never deleted.

### Protein Floor — Liability-Reducing Language

Add this one sentence to the protein floor modal that isn't currently there:
*"This estimate is based on the information you provided. Inaccurate inputs will
produce inaccurate estimates. Your prescriber or dietitian may recommend a different
target."*

The safety bounds (kidney disease cap, pregnancy limit, BMI correction) actually
REDUCE liability by demonstrating clinical care. Keep them. Make sure they are
bulletproof with 90%+ test coverage on every branch.

### GDPR/CCPA — Built In

Two edge functions ship in v1 (never paywalled):
- `export-user-data` — complete JSON archive emailed to user
- `delete-account` — permanent purge across all tables + auth row

---

## Emergency Escalation

Symptom pattern monitoring. No competitor has this. ALWAYS FREE — safety is never paywalled.

**Legal framing:** This feature is "symptom pattern monitoring," never "medical diagnosis"
or "condition detection." The names of potential conditions (pancreatitis, gastroparesis)
are internal/backend only. They are NEVER shown to the user. Naming a medical condition
to a user constitutes diagnosis — a legal line Glipra does not cross.

### Internal Trigger Names (Backend Only — Never Shown to User)

| Internal Type | Detection Pattern |
|---|---|
| `dehydration_risk` | Nausea = 5 AND appetite = 'suppressed' for 3+ consecutive days |
| `pain_pattern` | Severe nausea (5) + user notes contain pain keywords |
| `vomiting_pattern` | Vomiting logged for 2+ consecutive days |
| `energy_pattern` | Energy = 1 for 5+ consecutive days |

`red_flag_type` column stores these internal codes in the database for audit purposes.
They are used only in support contexts and legal review — never rendered in the app UI.

### User-Facing Card Copy (Exact — Do Not Change Without Attorney Review)

```
"You've logged symptoms that may need medical attention.

Please contact your prescriber today. If you are in severe pain,
cannot keep fluids down, or feel this is an emergency — go to
the emergency room or call 911.

[Contact My Prescriber]   [I'll Handle This]
```

"I'll Handle This" snoozes for 24 hours only. Card reappears next open.
No condition name. No diagnosis. No specific medical claim.

### Behavior When Triggered

1. Today screen shows full-screen `<EscalationCard />` overriding all other content
2. Exact copy above — no condition names, no diagnosis language
3. Cannot be permanently dismissed — snoozes 24 hours maximum
4. Logs: `daily_checkins.red_flag_triggered = true` + `red_flag_type` (internal code)
5. Daily AI guidance suppressed while card is active
6. All escalation events retained in audit log permanently (never deleted)

### Content Card Safety Rule

Content cards that cover serious medical topics (cards #19, #20 — pancreatitis,
gallbladder) MUST include this at the top in addition to the bottom disclaimer:

*"If you are currently experiencing these symptoms, stop reading and contact your
prescriber or go to the emergency room now. This article is for educational purposes
and is not a substitute for emergency medical care."*

Implementation: `src/features/safety/redFlagDetector.ts` — pure function, fully unit tested.
90%+ branch coverage required. No exceptions.

---

## Stack

> **⚡ Scaffold status as of 2026-05-17:** Obytes v9.0.0 scaffolded and hardened.
> Expo SDK upgraded to 54 (v9 template targets 54, not 52). NativeWind fully stripped.
> Package manager standardized to **pnpm**. See "Scaffold Decisions" section below.

| Layer | Choice | Why |
|---|---|---|
| Boilerplate | [obytes/react-native-template-obytes](https://github.com/obytes/react-native-template-obytes) **v9.0.0** (pinned tag) | Exact stack match, saves 2-3 weeks of setup |
| Framework | Expo managed workflow **SDK 54** | Zero native config; v9 template ships SDK 54 (spec said 52 — accepted upgrade) |
| Package manager | **pnpm 11.1.2** | Obytes v9 declares `"packageManager": "pnpm@10.12.3"` — never use npm/yarn in this project |
| Build/Deploy | EAS Build + EAS Submit + EAS Update (OTA) | iOS + Android + fast hotfixes |
| Language | TypeScript (strict) | AI writes better TS, catches its own bugs |
| Navigation | **Expo Router 6** | File-based, type-safe; v9 template ships Router 6 (spec said v3 — accepted upgrade) |
| Styling | **StyleSheet API + `src/theme/colors.ts` design tokens** | NativeWind/Tailwind **stripped** — not installed, not permitted |
| Server/DB | Supabase (`@supabase/supabase-js` **v2.105.4**) | Auth + Postgres + Realtime + Edge Functions |
| Database types | `supabase gen types typescript` | Generated, never hand-edited |
| AI — Photo | OpenAI GPT-4o via Edge Functions | Vision capability |
| AI — Guidance | OpenAI GPT-4o mini via Edge Functions | Cheap, fast |
| AI — Voice | OpenAI Whisper API via Edge Functions | Speech-to-text |
| AI (dev) | `EXPO_PUBLIC_USE_MOCK_AI=true` mock gate | **Zero OpenAI cost during development** — all AI calls return mock data from `src/lib/mockAI.ts` |
| Barcode | expo-camera (barcode mode) | Built-in to Expo SDK |
| Food DB SDK | `@openfoodfacts/openfoodfacts-nodejs` (official) | Typed, maintained, replaces custom fetch client |
| Food DB (primary) | Open Food Facts API | Free, 3M+ products |
| Food DB (fallback) | USDA FoodData Central API | Government-verified |
| Food DB (cache + seed) | Supabase `foods` table | Cache + 200 pre-seeded GLP-1-friendly foods |
| Offline queue | AsyncStorage + React Query | Queue-and-sync for offline logging |
| State | Zustand (global) + React Query (server) | Clean separation |
| Persistence | **AsyncStorage** (for Supabase sessions) | Standard Supabase-RN pattern; MMKV reserved for non-auth data in v2 |
| Date math | **date-fns v4.1.0** | No JS Sunday/Monday landmines; requires `unstable_enablePackageExports = true` in metro.config.js (ESM-first package) |
| Payments | RevenueCat (react-native-purchases + react-native-purchases-ui) — **deferred to EAS dev build** | iOS + Android subs; requires native module, can't run in Expo Go |
| Analytics | PostHog (posthog-react-native) — **live in EAS dev build** | Native module |
| Error monitoring | Sentry (sentry-expo) — **deferred to EAS dev build** | Native module |
| Notifications | Expo Notifications | With quiet hours + escalation rules |
| Health sync | `react-native-health-link` (xmartlabs) — **deferred to EAS dev build** | Unified HealthKit + Health Connect — ONE package |
| PDF | `pdf-lib` (Deno-compatible) in edge functions | Prescriber visit reports — NOT React PDF (Deno incompatible) |
| Image gen | Skia + edge function | Streak share images |
| Fonts | DM Serif Display + DM Sans | Warm, clinical-credible |
| Localization | i18next + expo-localization | English + Spanish v1 |
| Validation | Zod | Edge function input/output schemas; also used in `env.ts` for build-time env validation |
| Testing — utils | **Vitest 4.1.6** (pure TS only) | Safety code: 90% coverage gate enforced; scoped to `src/utils/**` and `src/features/**/calculator.ts` |
| Testing — components | **jest-expo 54.0.16** | React Native components, hooks, screens |
| CI/CD | GitHub Actions (Obytes provides 10+ workflows) | Tests + builds + OTA |
| Email | Resend | Transactional email |
| Support | Plain.com | Customer support (after beta) |

### Scaffold Decisions (2026-05-17)

These are the authoritative decisions made when the Obytes v9.0.0 scaffold was set up.
They override the original spec in CLAUDE.md where they differ.

| Decision | Original Spec | Actual | Reason |
|---|---|---|---|
| Expo SDK version | SDK 52 | **SDK 54** | Obytes v9.0.0 targets SDK 54 — accepted upgrade |
| Expo Router version | v3 | **v6** | Ships with SDK 54 template — accepted upgrade |
| Package manager | npm | **pnpm 11.1.2** | Template declares `"packageManager": "pnpm@10.12.3"`; standardized to pnpm |
| Obytes template version | unversioned | **v9.0.0** (pinned) | Pinned for supply chain repeatability |
| Styling | StyleSheet (planned) | **StyleSheet + colors.ts** (NativeWind **stripped**) | Template ships with NativeWind; CLAUDE.md bans it; fully removed |
| Tailwind utilities | — | **tailwind-variants + tailwind-merge removed** | Tailwind-specific; produce useless output without NativeWind |
| Test runner (utils) | Vitest | **Vitest 4.1.6** | Configured and scoped — does NOT import any RN packages |
| Test runner (components) | jest-expo | **jest-expo 54.0.16** | `pnpm test` runs this for all component/integration tests |
| Supabase client | @supabase/supabase-js | **v2.105.4** | Installed version |
| Supabase session store | MMKV (Obytes default) | **AsyncStorage** | Standard Supabase-RN pattern for auth persistence |
| date-fns | date-fns | **v4.1.0** | ESM-first; requires `resolver.unstable_enablePackageExports = true` in metro.config.js |
| Native packages | install now | **deferred to first EAS dev build** | RevenueCat, HealthKit, PostHog, Sentry — can't test in Expo Go |
| Install flag | (none) | **`--ignore-scripts`** | Supply chain hardening — never run postinstall scripts from new deps without review |
| Inner CLAUDE.md | Obytes template file | **Replaced with Glipra-aware file** | Original said "use NativeWind, use MMKV" — contradicted project rules |

### Supply Chain Posture

- **Install new packages with:** `pnpm add <pkg> --ignore-scripts`
- **Pinned scaffold tag:** Obytes v9.0.0 (reproducible baseline)
- **Audit baseline:** `docs/security/AUDIT-BASELINE.md` — 0 critical / 42 high / 26 moderate / 4 low (all dev-only transitive — none ship in production bundles)
- **Re-audit cadence:** Monthly + after every dep bump + before every production release
- **Production audit:** `pnpm audit --prod` must show 0 high and 0 critical before App Store submission

### Windows-Specific Setup Notes

These gotchas are specific to developing on Windows and are NOT in the Obytes README.

```powershell
# Git line endings — CRITICAL to set before first checkout to avoid CRLF errors
git config core.autocrlf false

# Supabase CLI on Windows — install via Scoop (NOT npm global install)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Docker for local Supabase — required for `supabase start`
# Install Docker Desktop and ensure WSL2 backend is enabled

# pnpm — already installed if you ran `corepack enable`
# If not: npm install -g pnpm@11
```

---

## Quick Start (Day 1)

> **⚡ Scaffold already done (2026-05-17).** Steps 1–2 are complete.
> The `dosepath/` directory exists with Obytes v9.0.0 + SDK 54 + pnpm + NativeWind stripped.
> Start at step 3 (Supabase local setup) for new machines or new team members.

```bash
# ── DONE: Scaffold from Obytes boilerplate (Obytes v9.0.0, pinned tag) ──────
# npx create-expo-app@latest dosepath \
#   --template https://github.com/obytes/react-native-template-obytes#v9.0.0
# (NativeWind stripped, colors.ts design tokens added, pnpm standardized)

# 0. Clone and install (use pnpm — never npm or yarn in this project)
cd dosepath
pnpm install --ignore-scripts   # --ignore-scripts = supply chain hardening

# 1. Set up Supabase locally (requires Docker Desktop + WSL2 on Windows)
supabase init && supabase start  # use Scoop-installed supabase CLI on Windows

# 2. Apply all migrations
supabase db reset

# 3. Generate TypeScript types from schema
supabase gen types typescript --local > src/types/database.ts

# 4. Configure Supabase MCP in Cursor/Claude (see MCP section below)

# 5. Run all tests before writing any UI
pnpm test              # jest-expo: component + integration tests
pnpm test:utils        # Vitest: pure-TS safety code

# 6. Set up EAS for builds (only needed for native modules)
npm install -g eas-cli && eas init && eas build:configure

# 7. Deploy edge functions
supabase functions deploy recognize-meal-photo
supabase functions deploy generate-daily-guidance
supabase functions deploy parse-meal-text

# 8. First development build for native modules (RevenueCat, HealthKit, etc.)
eas build --profile development --platform ios
```

---

## MCP Setup (Critical for Development Speed)

MCPs connect Claude directly to dev tools. Set these up before writing code.

### Supabase MCP — Required

**Repo:** https://github.com/supabase-community/supabase-mcp

Add to Cursor/Claude Desktop/Windsurf settings:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_DEV_PROJECT_REF"
    }
  }
}
```

**What this unlocks:**
- Claude writes and applies migrations directly to dev database
- Claude generates TypeScript types from schema without you running CLI
- Claude queries live data to debug issues
- Claude verifies RLS policies are correct
- Claude can seed the 200 GLP-1-friendly foods directly

**Security:** Scope to your DEV project only via `project_ref` query param.
Never connect MCP to production.

### Filesystem MCP — Recommended

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "/path/to/dosepath"]
    }
  }
}
```

Claude reads multiple files simultaneously when debugging.
No more copy-pasting context.

### GitHub MCP — Optional

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN" }
    }
  }
}
```

For PR creation and issue management from Claude.

---

## Reference Repos (Study These, Steal What's Legal)

### Boilerplate (start here)
- **obytes/react-native-template-obytes** —
  https://github.com/obytes/react-native-template-obytes
  Exact stack match. TypeScript, Expo Router, Zustand, React Query, i18next,
  Zod, Husky, EAS, GitHub Actions. Production-tested.

### Barcode + Food DB Patterns
- **antomanc/simple-calorie-tracker** —
  https://github.com/antomanc/simple-calorie-tracker
  Working Open Food Facts + USDA dual-API in React Native. Study the
  barcode scanner and fallback logic.

- **marcoshernanz/CalYo** —
  https://github.com/marcoshernanz/CalYo
  AI photo recognition + barcode in Expo with Convex backend. Study the
  photo recognition edge function pattern.

### Auth + Supabase Setup
- **aaronksaunders/expo-supabase-ai-template** —
  https://github.com/aaronksaunders/expo-supabase-ai-template
  Expo Router + Supabase auth + OpenAI edge function. Reference for
  edge function structure.

- **Hechprad/react-native-supabase-boilerplate-2025** —
  https://github.com/Hechprad/react-native-supabase-boilerplate-2025
  Alternative starter if not using Obytes.

### Subscriptions (RevenueCat)
- **RevenueCat/expo-web-billing-demo** —
  https://github.com/RevenueCat/expo-web-billing-demo
  Official cross-platform iOS + Android + Web example.
  Copy `lib/payments.native.ts` directly.

### Analytics
- **PostHog/support-rn-expo** —
  https://github.com/PostHog/support-rn-expo
  Official PostHog + Expo reference implementation.

### Health Sync (iOS + Android)
- **xmartlabs/react-native-health-link** —
  https://github.com/xmartlabs/react-native-health-link
  Unified HealthKit + Health Connect (replaces installing both separately).

- **Haider-Mukhtar/ReactNative-Apple-Health-IOS** —
  https://github.com/Haider-Mukhtar/ReactNative-Apple-Health-IOS
  Has `useHealthData.ts` hook for steps, sleep, calories.

- **Haider-Mukhtar/ReactNative-Health-Connect** —
  https://github.com/Haider-Mukhtar/ReactNative-Health-Connect
  Android Health Connect hook with permissions handling.

### Email Infrastructure
- **resend/resend-supabase-edge-functions-example** —
  https://github.com/resend/resend-supabase-edge-functions-example
  Complete Resend + Supabase edge function setup.

- **supabase/auth-hook-react-email-resend** —
  https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/auth-hook-react-email-resend
  Auth email customization with React Email templates.

### Open Food Facts SDK
- **openfoodfacts/openfoodfacts-js** —
  https://github.com/openfoodfacts/openfoodfacts-js
  OFFICIAL TypeScript SDK. Use this — don't write a custom fetch client.

---

## Project Structure

```
dosepath/
├── app/                                  # = src/app/ (Expo Router file-based routes)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   └── consent.tsx                   # First-launch consent flow
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   ├── language.tsx                  # Step 0 — language (EN/ES), no step counter
│   │   ├── medication.tsx                # Step 1 — GLP-1 med + dose (incl. compounded)
│   │   ├── injection-day.tsx             # Step 2 — injection day / daily
│   │   ├── body.tsx                      # Step 3 — weight, height, DOB
│   │   ├── safety.tsx                    # Step 4 — kidney disease, conditions
│   │   ├── status.tsx                    # Step 5 — starting / active + activity level
│   │   ├── protein-target.tsx            # Step 6 — protein floor with safety bounds
│   │   └── reveal.tsx                    # Step 7 — personalized plan reveal
│   │   # dietary moved to a standalone editor + Settings; goals/import/appearance dropped (session 52)
│   ├── (app)/                           # Authenticated group — 5 tabs + pushed detail routes
│   │   ├── _layout.tsx                   # Tabs navigator (GlipraTabBar)
│   │   ├── index.tsx                     # Tab 1 — Today (Muscle Preservation hero + Fuel card)
│   │   ├── dose.tsx                      # Tab 2 — Dose hub (route-aware: injection / oral)
│   │   ├── log.tsx                       # Tab 3 — Nutrition (logging hub)
│   │   ├── progress.tsx                  # Tab 4 — Progress (trends, muscle-score, adherence)
│   │   ├── coach.tsx                     # Tab 5 — AI Nutrition Coach
│   │   ├── check-in.tsx                  # Daily check-in (nausea / energy / water)
│   │   ├── weight.tsx                    # Log weight
│   │   ├── goal-weight.tsx               # Edit goal weight
│   │   ├── add-shot.tsx                  # Log an injection
│   │   ├── edit-shot.tsx                 # Edit an injection
│   │   ├── injection-sites.tsx           # Legacy site map (hidden, href:null — old deep links)
│   │   ├── shot-prep.tsx                 # Shot-day prep checklist
│   │   ├── medication-level.tsx          # PK level estimator + curve
│   │   ├── visit-prep.tsx                # Prescriber visit prep + PDF
│   │   ├── protein-target.tsx            # Protein-target editor (recompute floor)
│   │   ├── dietary-preference.tsx        # Standalone dietary editor (session 52)
│   │   ├── resistance.tsx                # Log a resistance session
│   │   ├── update-status.tsx             # Edit medication status
│   │   ├── journey.tsx                   # Milestones / journey cards
│   │   ├── health-import.tsx             # Apple Health / Health Connect import
│   │   ├── settings.tsx                  # Settings (single screen)
│   │   ├── paywall.tsx                   # RevenueCat paywall
│   │   └── legal/
│   │       ├── privacy-policy.tsx
│   │       └── terms-of-service.tsx
│   ├── _layout.tsx                       # Root layout (auth gate + AppState token refresh)
│   ├── +html.tsx                         # Web HTML shell
│   └── [...messing].tsx                  # Catch-all (404)
│
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Text.tsx
│   │   │   ├── Sheet.tsx
│   │   │   ├── ProteinRing.tsx
│   │   │   ├── ReadinessScore.tsx        # 0-100 hero component
│   │   │   ├── InjectionBadge.tsx
│   │   │   ├── MicronutrientBar.tsx
│   │   │   ├── DisclaimerBanner.tsx      # tier-based
│   │   │   ├── EscalationCard.tsx
│   │   │   ├── WhyTooltip.tsx            # "Why?" transparency
│   │   │   ├── AIFeedbackThumbs.tsx      # quality loop
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── DataConfidenceBadge.tsx
│   │   │   ├── OfflineBanner.tsx
│   │   │   └── BadDayToggle.tsx
│   │   ├── today/
│   │   │   ├── ReadinessHeader.tsx
│   │   │   ├── ProteinHeader.tsx
│   │   │   ├── DailyGuidanceCard.tsx
│   │   │   ├── MealSummary.tsx
│   │   │   ├── CheckinCTA.tsx
│   │   │   └── PrescriberVisitCard.tsx
│   │   ├── log/
│   │   │   ├── LogMethodPicker.tsx
│   │   │   ├── FoodCard.tsx
│   │   │   ├── PortionPicker.tsx
│   │   │   ├── MealTypePicker.tsx
│   │   │   ├── BarcodeScanner.tsx
│   │   │   ├── VoiceCapture.tsx
│   │   │   ├── HybridTextInput.tsx
│   │   │   ├── FoodEditModal.tsx
│   │   │   └── DraftRecovery.tsx
│   │   ├── insights/
│   │   │   ├── WeightChart.tsx
│   │   │   ├── ProteinAdherence.tsx
│   │   │   ├── MicronutrientSummary.tsx
│   │   │   ├── SideEffectTrend.tsx
│   │   │   └── WeekOverWeek.tsx
│   │   ├── learn/
│   │   │   ├── ContentCard.tsx
│   │   │   └── ContentDetail.tsx
│   │   ├── share/
│   │   │   └── StreakImageRenderer.tsx
│   │   └── prescriber/
│   │       ├── VisitPrepSummary.tsx
│   │       └── ReportPreview.tsx
│   │
│   ├── features/
│   │   ├── ai-engine/
│   │   │   ├── api.ts
│   │   │   ├── prompts.ts
│   │   │   ├── guardrails.ts
│   │   │   ├── feedback.ts
│   │   │   └── hooks.ts
│   │   ├── auth/hooks.ts
│   │   ├── consent/
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   ├── safety/
│   │   │   ├── redFlagDetector.ts
│   │   │   └── hooks.ts
│   │   ├── readiness/
│   │   │   ├── calculator.ts
│   │   │   └── hooks.ts
│   │   ├── barcode/
│   │   │   ├── api.ts
│   │   │   ├── parser.ts
│   │   │   └── hooks.ts
│   │   ├── voice-logging/
│   │   │   ├── api.ts
│   │   │   ├── transcribe.ts
│   │   │   └── hooks.ts
│   │   ├── checkin/
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   ├── injection-cycle/
│   │   │   ├── calculator.ts
│   │   │   └── hooks.ts
│   │   ├── nutrition/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── proteinTracking.ts  # Feature-layer helpers (NOT the safety calculator — that lives in src/utils/protein.ts)
│   │   │   ├── density.ts
│   │   │   └── ewma.ts
│   │   ├── streaks/
│   │   │   ├── api.ts
│   │   │   ├── rules.ts
│   │   │   └── hooks.ts
│   │   ├── weight/
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   ├── content/
│   │   │   ├── api.ts
│   │   │   └── hooks.ts
│   │   ├── medication-status/
│   │   │   ├── api.ts
│   │   │   ├── transitions.ts
│   │   │   └── hooks.ts
│   │   ├── dose-escalation/
│   │   │   ├── timeline.ts
│   │   │   ├── anticipation.ts
│   │   │   └── hooks.ts
│   │   ├── prescriber-visit/
│   │   │   ├── api.ts
│   │   │   ├── reportGenerator.ts
│   │   │   └── hooks.ts
│   │   ├── linked-accounts/
│   │   │   ├── api.ts
│   │   │   ├── permissions.ts
│   │   │   └── hooks.ts
│   │   ├── notifications/
│   │   │   ├── api.ts
│   │   │   ├── escalationRules.ts
│   │   │   ├── quietHours.ts
│   │   │   └── hooks.ts
│   │   ├── offline/
│   │   │   ├── queue.ts
│   │   │   ├── sync.ts
│   │   │   └── hooks.ts
│   │   ├── import/
│   │   │   ├── myfitnesspal.ts
│   │   │   ├── shotsy.ts
│   │   │   ├── appleHealth.ts
│   │   │   └── hooks.ts
│   │   ├── share/
│   │   │   ├── streakImage.ts
│   │   │   ├── journeyCardImage.ts
│   │   │   └── hooks.ts
│   │   ├── journey-cards/
│   │   │   ├── api.ts
│   │   │   ├── autoGenerator.ts          # Auto-creates cards on milestones
│   │   │   └── hooks.ts
│   │   ├── shot-day-prep/
│   │   │   ├── checklist.ts
│   │   │   └── hooks.ts
│   │   ├── medication-level/
│   │   │   ├── calculator.ts             # Half-life pharmacokinetics
│   │   │   └── hooks.ts
│   │   ├── ai-coach/
│   │   │   ├── api.ts                    # Calls ai-coach edge function
│   │   │   ├── prompts.ts                # Pharmacist-trained system prompt
│   │   │   └── hooks.ts
│   │   └── onboarding/
│   │       ├── store.ts
│   │       └── hooks.ts
│   │
│   ├── stores/
│   │   ├── userStore.ts
│   │   ├── uiStore.ts
│   │   └── badDayStore.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── queryClient.ts
│   │   ├── revenuecat.ts
│   │   ├── openFoodFacts.ts
│   │   ├── usdaFoodData.ts
│   │   ├── notifications.ts
│   │   ├── healthSync.ts
│   │   ├── analytics.ts
│   │   ├── featureFlags.ts
│   │   ├── i18n.ts
│   │   └── mockAI.ts             # Returns mock data when EXPO_PUBLIC_USE_MOCK_AI=true
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── database.ts                   # Generated by supabase gen types
│   │   └── index.ts
│   │
│   ├── locales/
│   │   ├── en.json
│   │   └── es.json
│   │
│   ├── utils/
│   │   ├── date.ts
│   │   ├── nutrition.ts
│   │   ├── protein.ts
│   │   └── format.ts
│   │
│   └── __tests__/
│       ├── protein.test.ts
│       ├── injection-cycle.test.ts
│       ├── readiness.test.ts
│       ├── ewma.test.ts
│       ├── redFlagDetector.test.ts
│       ├── streak-rules.test.ts
│       ├── notification-escalation.test.ts
│       ├── medication-status.test.ts
│       └── offline-queue.test.ts
│
├── supabase/
│   ├── functions/
│   │   ├── recognize-meal-photo/
│   │   ├── parse-meal-text/
│   │   ├── transcribe-voice/
│   │   ├── generate-daily-guidance/
│   │   ├── ai-coach/                     # MeAgain "Ask anything" parity
│   │   ├── calculate-micronutrients/
│   │   ├── generate-prescriber-report/
│   │   ├── generate-streak-image/
│   │   ├── generate-journey-card-image/  # Shareable milestone images
│   │   ├── auto-generate-journey-cards/  # Nightly job — creates milestone cards
│   │   ├── notification-rules-runner/
│   │   ├── revenuecat-webhook/
│   │   ├── export-user-data/
│   │   ├── delete-account/
│   │   ├── cohort-aggregator/
│   │   └── _shared/
│   │       ├── openai.ts
│   │       ├── guardrails.ts
│   │       ├── rateLimit.ts
│   │       ├── pdfBuilder.ts
│   │       └── cors.ts
│   │
│   ├── migrations/
│   │   ├── 000_baseline.sql
│   │   ├── 001_profiles.sql
│   │   ├── 002_glp1_medications.sql
│   │   ├── 003_user_medications.sql
│   │   ├── 004_dose_history.sql
│   │   ├── 005_body_metrics.sql
│   │   ├── 006_foods.sql
│   │   ├── 007_foods_seed.sql
│   │   ├── 008_food_logs.sql
│   │   ├── 009_daily_checkins.sql
│   │   ├── 010_protein_streaks.sql
│   │   ├── 011_daily_guidance.sql
│   │   ├── 012_content_cards.sql
│   │   ├── 013_content_card_versions.sql
│   │   ├── 014_ai_invocations.sql
│   │   ├── 015_ai_feedback.sql
│   │   ├── 016_user_acknowledgments.sql
│   │   ├── 017_prescriber_visits.sql
│   │   ├── 018_linked_accounts.sql
│   │   ├── 019_notification_log.sql
│   │   ├── 020_offline_sync_log.sql
│   │   ├── 021_import_history.sql
│   │   ├── 022_subscription_state.sql
│   │   ├── 023_promo_codes.sql
│   │   ├── 024_partners.sql
│   │   ├── 025_admin_audit_log.sql
│   │   ├── 026_provider_invitations.sql
│   │   ├── 027_provider_user_links.sql
│   │   ├── 028_journey_cards.sql         # MeAgain Journey Cards parity
│   │   └── 029_ai_coach_conversations.sql # AI Coach chat history
│   │
│   └── seed/
│       └── glp1_friendly_foods.sql
│
├── .github/
│   └── workflows/
│       └── main.yml
│
├── assets/
├── app.json
├── app.config.ts
├── eas.json
├── tsconfig.json
├── package.json
├── vitest.config.ts
└── ARCHITECTURE.md
```

---

## Onboarding Flow — 8 Steps (Language + 7)

| Step | Screen | Purpose |
|---|---|---|
| 0 | language.tsx | Language selection (English / Español) — before step counter starts |
| 1 | medication.tsx | GLP-1 med + dose (incl. compounded) |
| 2 | injection-day.tsx | Day of week or "daily" |
| 3 | body.tsx | Weight, height, DOB |
| 4 | safety.tsx | Kidney disease, pregnancy/lactation — NON-SKIPPABLE |
| 5 | status.tsx | Starting / active + activity level — NON-SKIPPABLE |
| 6 | protein-target.tsx | Protein floor with safety reasoning + disclaimer modal |
| 7 | reveal.tsx | Personalized plan reveal |

Step 0 (language) has no step counter UI — it stands alone before the numbered flow begins;
steps 1–7 render `step={{ current, total: 7 }}`.
First-time redirect in (app)/_layout.tsx points to `/onboarding/language`, not `/onboarding/medication`.

**Trimmed in session 52** (`gsd` onboarding redesign): the old `dietary.tsx`, `goals.tsx`,
`import.tsx`, and `appearance.tsx` steps were removed. Dietary pattern is now collected via a
standalone editor (a Today nudge + a Settings row), not during onboarding; goals/import/appearance
were dropped entirely. Session 51 also narrowed `MedicationStatus` to `'starting' | 'active'`
(tapering + maintenance removed).

---

## Core Models

### Protein Floor — With Safety Bounds

```ts
// src/utils/protein.ts

const ABSOLUTE_CEILING_G = 200;
const ABSOLUTE_FLOOR_G = 50;
const KIDNEY_DISEASE_MAX_G_PER_KG = 0.8;

type ProteinFloorInput = {
  weight_kg: number;
  height_cm: number;
  goal: UserGoal;
  has_kidney_disease: boolean;
  is_pregnant: boolean;
  is_lactating: boolean;
  medication_status: MedicationStatus;
};

export function calculateProteinFloor(input: ProteinFloorInput): {
  floor_g: number;
  reasoning: string;
  safety_capped: boolean;
} {
  // Kidney disease — most restrictive path
  if (input.has_kidney_disease) {
    const floor = Math.round(input.weight_kg * KIDNEY_DISEASE_MAX_G_PER_KG);
    return {
      floor_g: clamp(floor, ABSOLUTE_FLOOR_G, ABSOLUTE_CEILING_G),
      reasoning: 'Reduced for renal protection. Confirm target with your prescriber.',
      safety_capped: true,
    };
  }

  // Pregnancy/lactation — defer to prescriber
  if (input.is_pregnant || input.is_lactating) {
    return {
      floor_g: clamp(Math.round(input.weight_kg * 1.1), ABSOLUTE_FLOOR_G, 130),
      reasoning: 'Pregnancy/lactation requires individualized guidance. Confirm with prescriber.',
      safety_capped: true,
    };
  }

  const bmi = input.weight_kg / (input.height_cm / 100) ** 2;
  const reference_kg = bmi > 35 ? estimateIdealBodyWeight(input.height_cm) : input.weight_kg;
  const reference_lbs = reference_kg * 2.205;

  let multiplier = input.goal === 'muscle_preservation' ? 1.0 : 0.8;
  if (input.medication_status === 'maintenance')
    multiplier *= 0.9;

  const calculated = Math.round(reference_lbs * multiplier);
  return {
    floor_g: clamp(calculated, ABSOLUTE_FLOOR_G, ABSOLUTE_CEILING_G),
    reasoning: bmi > 35
      ? 'Calculated using ideal body weight for accuracy.'
      : input.medication_status === 'maintenance'
        ? 'Adjusted for maintenance phase — preserving what you have.'
        : 'Standard muscle-preservation target.',
    safety_capped: calculated !== clamp(calculated, ABSOLUTE_FLOOR_G, ABSOLUTE_CEILING_G),
  };
}

function estimateIdealBodyWeight(height_cm: number): number {
  const height_inches = height_cm / 2.54;
  return 50 + 2.3 * Math.max(0, height_inches - 60);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
```

### Readiness Score — The Hero UI (0-100)

```ts
// src/features/readiness/calculator.ts

export function calculateReadinessScore(input: {
  injection_phase: InjectionPhase;
  todays_checkin: CheckinField | null;
  protein_progress: number; // 0-1
  hour_of_day: number;
}): { score: number; guidance: string } {
  let score = 70;

  if (input.injection_phase === 'peak_suppression')
    score -= 15;
  if (input.injection_phase === 'recovery_window')
    score += 10;
  if (input.injection_phase === 'injection_day')
    score += 5;

  if (input.todays_checkin) {
    score -= (input.todays_checkin.nausea - 1) * 5;
    score += (input.todays_checkin.energy - 3) * 5;
  }

  const expected = Math.min(1, input.hour_of_day / 18);
  if ((expected - input.protein_progress) > 0.2)
    score -= 10;

  score = Math.max(0, Math.min(100, score));
  return { score, guidance: getGuidanceForScore(score, input.injection_phase) };
}
```

Historically the Readiness Score was the PRIMARY element on the Today screen. As of
session 59 (see Decisions Log, 2026-06-11) the **Muscle Preservation Score** is the
Today hero dial (inside the Fuel card); the Readiness Score is still computed by this
calculator but is now shown as a compact "Readiness NN" pill within the Fuel hero, and
its dose/symptom detail continues to drive the Dose tab. Both scores stay clinically
grounded (readiness in pharmacokinetics; muscle in protein + resistance consistency),
not subjective wellness gimmicks.

### Streak Rules

```ts
// src/features/streaks/rules.ts
const STREAK_THRESHOLD = 0.80;

export function didHitFloorToday(consumed: number, floor: number): boolean {
  return (consumed / floor) >= STREAK_THRESHOLD;
}
// >= 80% of floor = streak day. Day boundary = user's local midnight.
// Logging after midnight backdates correctly. Never shame a missed day.
```

### Injection Cycle Calculator

```ts
// src/features/injection-cycle/calculator.ts
import { differenceInCalendarDays } from 'date-fns';

export function getInjectionPhase(daysSince: number): InjectionPhase {
  if (daysSince === 0)
    return 'injection_day';
  if (daysSince <= 2)
    return 'peak_suppression';
  if (daysSince <= 4)
    return 'adjustment';
  if (daysSince <= 7)
    return 'recovery_window';
  return 'overdue';
}
```

### Discontinuation / Maintenance Mode

```ts
type MedicationStatus
  = | 'starting' // First 4-8 weeks, dose escalating
    | 'active' // Standard ongoing use
    | 'tapering' // User-initiated wind-down
    | 'discontinued' // Stopped GLP-1
    | 'maintenance'; // Goal weight reached, maintaining

// Protein floor multipliers by status:
// starting, active, tapering: standard calculation
// discontinued, maintenance: multiply by 0.9
// Different guidance tone, different content cards surfaced per status
```

The most important retention feature. Most apps lose users when they stop their GLP-1.
Glipra stays relevant through the "after" — which is users' real long-term concern.

### Injection Site Rotation (Form-Based — as of 2026-05-23)

Six stomach sites only. Pharmacist decision: abdomen is the primary GLP-1 injection
zone; thighs are secondary and rarely used by this patient population.

```ts
// src/features/injection-sites/constants.ts

export type SiteCode
  = | 'stomach_upper_left'
    | 'stomach_upper_mid'
    | 'stomach_upper_right'
    | 'stomach_lower_left'
    | 'stomach_lower_mid'
    | 'stomach_lower_right';

// Serpentine order — maximally spaces consecutive injections
export const SITE_ROTATION_ORDER: SiteCode[] = [
  'stomach_upper_left',
  'stomach_upper_mid',
  'stomach_upper_right',
  'stomach_lower_right',
  'stomach_lower_mid',
  'stomach_lower_left',
];

export const REST_DAYS = 7; // Clinical standard: 7 days before reuse
```

```ts
// src/features/injection-sites/calculator.ts

export type RotationState = {
  recommendation: SiteCode; // Always defined — falls back to LRU when all resting
  allResting: boolean; // True when every site used within REST_DAYS — show warning
};

export function computeNextSite(logs: InjectionLog[], today?: string): RotationState {
  // Pass 1: first site in rotation order that is either unused or rested (≥ REST_DAYS ago)
  // Pass 2 (allResting): return least-recently-used site so user can still proceed
}
```

**Algorithm guarantees:**
- Never returns null — always gives a usable recommendation
- Most-recent log wins when duplicate entries exist for same site
- `allResting=true` shows a warning banner but does NOT block logging
- `today` parameter exposed for deterministic Vitest testing

**Rule 4 compliance:** `calculator.ts` has 100% statement coverage, 99.23% branch
coverage in Vitest (11 test cases in `calculator.test.ts`). Must stay ≥90%.

**UX flow:**
1. Sites tab → Active Rotation card shows recommended site + "+ Add Shot" button
2. Add Shot form: date/time pickers, medication dropdown, injection site dropdown
   (non-selectable "ACTIVE ROTATION" section header at top of dropdown), pain level
   0–10 slider, notes textarea
3. On save: log inserted → React Query cache invalidated → rotation advances

---

## Database Schema

### 001_profiles.sql

```sql
CREATE TABLE profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            TEXT,
  gender                  TEXT CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  date_of_birth           DATE,
  height_cm               NUMERIC(5,1),
  weight_kg               NUMERIC(5,2),
  goal                    TEXT NOT NULL DEFAULT 'muscle_preservation'
                            CHECK (goal IN ('muscle_preservation','weight_management','both')),
  -- Safety inputs
  has_kidney_disease      BOOLEAN NOT NULL DEFAULT false,
  is_pregnant             BOOLEAN NOT NULL DEFAULT false,
  is_lactating            BOOLEAN NOT NULL DEFAULT false,
  -- Dietary
  dietary_pattern         TEXT CHECK (dietary_pattern IN
                            ('omnivore','vegetarian','vegan','pescatarian','other')),
  allergens               TEXT[] DEFAULT '{}',
  religious_restrictions  TEXT[] DEFAULT '{}',
  -- Protein floor
  protein_floor_g         INT,
  protein_override_g      INT,
  protein_floor_capped    BOOLEAN DEFAULT false,
  protein_floor_reasoning TEXT,
  -- Subscription
  subscription_tier       TEXT NOT NULL DEFAULT 'free'
                            CHECK (subscription_tier IN ('free','pro','founder_lifetime')),
  revenuecat_user_id      TEXT,
  -- Consent
  consent_accepted_at     TIMESTAMPTZ,
  consent_version         TEXT,
  -- Localization + notifications
  timezone                TEXT NOT NULL DEFAULT 'America/Chicago',
  preferred_language      TEXT NOT NULL DEFAULT 'en'
                            CHECK (preferred_language IN ('en','es')),
  quiet_hours_start       TIME DEFAULT '22:00',
  quiet_hours_end         TIME DEFAULT '08:00',
  -- Onboarding
  onboarding_complete     BOOLEAN NOT NULL DEFAULT false,
  -- Compassion mode
  bad_day_active          BOOLEAN DEFAULT false,
  bad_day_until           TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, timezone) VALUES (NEW.id, 'America/Chicago');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 002_glp1_medications.sql

```sql
CREATE TABLE glp1_medications (
  id                TEXT PRIMARY KEY,
  brand_name        TEXT NOT NULL,
  generic_name      TEXT NOT NULL,
  drug_class        TEXT NOT NULL,
  typical_frequency TEXT NOT NULL,
  dose_unit         TEXT NOT NULL DEFAULT 'mg'
);

INSERT INTO glp1_medications VALUES
  ('semaglutide_wegovy',    'Wegovy',    'Semaglutide', 'GLP-1',     'weekly', 'mg'),
  ('semaglutide_ozempic',   'Ozempic',   'Semaglutide', 'GLP-1',     'weekly', 'mg'),
  ('tirzepatide_zepbound',  'Zepbound',  'Tirzepatide', 'GIP/GLP-1', 'weekly', 'mg'),
  ('tirzepatide_mounjaro',  'Mounjaro',  'Tirzepatide', 'GIP/GLP-1', 'weekly', 'mg'),
  ('liraglutide_saxenda',   'Saxenda',   'Liraglutide', 'GLP-1',     'daily',  'mg'),
  ('liraglutide_victoza',   'Victoza',   'Liraglutide', 'GLP-1',     'daily',  'mg'),
  ('dulaglutide_trulicity', 'Trulicity', 'Dulaglutide', 'GLP-1',     'weekly', 'mg'),
  ('other',                 'Other',     'Other',       'GLP-1',     'weekly', 'mg');
```

### 003_user_medications.sql

```sql
CREATE TABLE user_medications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id         TEXT NOT NULL REFERENCES glp1_medications(id),
  current_dose_mg       NUMERIC(6,2),
  dose_unit             TEXT DEFAULT 'mg',
  is_compounded         BOOLEAN DEFAULT false,
  custom_medication_name TEXT,
  custom_dose_description TEXT,
  injection_frequency   TEXT NOT NULL DEFAULT 'weekly'
                          CHECK (injection_frequency IN ('daily','weekly','biweekly')),
  injection_day_of_week SMALLINT CHECK (injection_day_of_week BETWEEN 0 AND 6),
  medication_status     TEXT NOT NULL DEFAULT 'starting'
                          CHECK (medication_status IN
                            ('starting','active','tapering','discontinued','maintenance')),
  status_changed_at     TIMESTAMPTZ DEFAULT NOW(),
  start_date            DATE,
  notes                 TEXT,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_medication" ON user_medications FOR ALL
  USING (auth.uid() = user_id);
```

### 004_dose_history.sql

```sql
CREATE TABLE dose_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dose_amount_mg  NUMERIC(6,2),
  dose_description TEXT,
  effective_date  DATE NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dose_history_user_date ON dose_history(user_id, effective_date DESC);
ALTER TABLE dose_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_dose_history" ON dose_history FOR ALL USING (auth.uid() = user_id);
```

### 005_body_metrics.sql

```sql
CREATE TABLE body_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg     NUMERIC(5,2) NOT NULL,
  logged_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_body_metrics_user_date ON body_metrics(user_id, logged_at DESC);
ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_metrics" ON body_metrics FOR ALL USING (auth.uid() = user_id);
```

### 006_foods.sql

```sql
CREATE TABLE foods (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  name_es         TEXT,
  brand           TEXT,
  barcode         TEXT,
  source          TEXT NOT NULL CHECK (source IN
                    ('open_food_facts','usda','manual','ai_photo','ai_text','curated')),
  calories        NUMERIC(6,1),
  protein_g       NUMERIC(5,2),
  carbs_g         NUMERIC(5,2),
  fat_g           NUMERIC(5,2),
  fiber_g         NUMERIC(5,2),
  b12_mcg         NUMERIC(8,3),
  iron_mg         NUMERIC(7,3),
  calcium_mg      NUMERIC(7,2),
  magnesium_mg    NUMERIC(7,2),
  protein_density NUMERIC(5,3) GENERATED ALWAYS AS
                    (CASE WHEN calories > 0 THEN protein_g / calories ELSE 0 END) STORED,
  data_quality    TEXT CHECK (data_quality IN
                    ('verified','community','usda','ai_estimated','unverified'))
                    DEFAULT 'unverified',
  is_verified     BOOLEAN DEFAULT false,
  is_glp1_friendly BOOLEAN DEFAULT false,
  serving_size_g  NUMERIC(6,1),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_foods_barcode ON foods(barcode);
CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));
CREATE INDEX idx_foods_protein_density ON foods(protein_density DESC);
CREATE INDEX idx_foods_glp1_friendly ON foods(is_glp1_friendly) WHERE is_glp1_friendly = true;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_foods_name_trgm ON foods USING gin(name gin_trgm_ops);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods_public_read" ON foods FOR SELECT USING (true);
CREATE POLICY "users_insert_foods" ON foods FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### 007_foods_seed.sql

200 hand-curated pharmacist-verified high-protein foods pre-populated at install.
Greek yogurt brands, protein shakes, eggs, chicken cuts, cottage cheese, soft proteins.
All: is_glp1_friendly=true, data_quality='verified', is_verified=true.
Top 50 include Spanish name translations.
Solves cold-start UX — first barcode scan hits cache immediately.

### 008_food_logs.sql

```sql
CREATE TABLE food_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id         TEXT REFERENCES foods(id) ON DELETE SET NULL,
  food_name       TEXT NOT NULL,
  meal_type       TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  quantity_g      NUMERIC(7,2) NOT NULL,
  calories        NUMERIC(6,1),
  protein_g       NUMERIC(5,2),
  carbs_g         NUMERIC(5,2),
  fat_g           NUMERIC(5,2),
  fiber_g         NUMERIC(5,2),
  b12_mcg         NUMERIC(8,3),
  iron_mg         NUMERIC(7,3),
  calcium_mg      NUMERIC(7,2),
  magnesium_mg    NUMERIC(7,2),
  log_source      TEXT DEFAULT 'manual'
                    CHECK (log_source IN
                      ('barcode','photo_ai','voice','hybrid_text',
                       'search','manual','quick_add','imported')),
  ai_confidence   NUMERIC(3,2),
  needs_review    BOOLEAN DEFAULT false,
  medication_week INT,         -- For cohort insights
  injection_phase TEXT,        -- For cohort insights
  client_uuid     TEXT,        -- For offline dedup
  synced_offline  BOOLEAN DEFAULT false,
  logged_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_at DESC);
CREATE INDEX idx_food_logs_cohort ON food_logs(medication_week, injection_phase)
  WHERE medication_week IS NOT NULL;
CREATE UNIQUE INDEX idx_food_logs_client_uuid ON food_logs(user_id, client_uuid)
  WHERE client_uuid IS NOT NULL;

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_logs" ON food_logs FOR ALL USING (auth.uid() = user_id);
```

### 009_daily_checkins.sql

```sql
CREATE TABLE daily_checkins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  nausea              SMALLINT CHECK (nausea BETWEEN 1 AND 5),
  energy              SMALLINT CHECK (energy BETWEEN 1 AND 5),
  constipation        BOOLEAN,
  vomiting            BOOLEAN DEFAULT false,
  appetite            TEXT CHECK (appetite IN ('suppressed','low','normal')),
  injected_today      BOOLEAN DEFAULT false,
  notes               TEXT,
  red_flag_triggered  BOOLEAN DEFAULT false,
  red_flag_type       TEXT,
  medication_week     INT,
  injection_phase     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date DESC);
CREATE INDEX idx_checkins_red_flag ON daily_checkins(red_flag_triggered)
  WHERE red_flag_triggered = true;

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_checkins" ON daily_checkins FOR ALL USING (auth.uid() = user_id);
```

### 010_protein_streaks.sql

```sql
CREATE TABLE protein_streaks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak_days   INT NOT NULL DEFAULT 0,
  longest_streak_days   INT NOT NULL DEFAULT 0,
  last_hit_date         DATE,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE protein_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_streak" ON protein_streaks FOR ALL USING (auth.uid() = user_id);
```

### 011_daily_guidance.sql (planned) → applied as 016_daily_guidance.sql

```sql
-- Applied as migration 016 (session 37). Schema differs from original plan:
-- injection_phase is nullable (context captured but not required for cache key)
-- UNIQUE on (user_id, date) only — one tip per user per day regardless of phase/language
-- reasoning_text added for "Why this?" tooltip
-- prompt_version added for future prompt iteration tracking
CREATE TABLE daily_guidance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  injection_phase TEXT,
  language        TEXT NOT NULL DEFAULT 'en',
  guidance_text   TEXT NOT NULL,
  reasoning_text  TEXT,         -- Powers "Why this?" tooltip in DailyGuidanceCard
  prompt_version  TEXT DEFAULT 'v1',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_guidance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_guidance" ON daily_guidance FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_daily_guidance_user_date ON daily_guidance (user_id, date DESC);
```

### 012_content_cards.sql

```sql
CREATE TABLE content_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  title_es        TEXT,
  summary         TEXT NOT NULL,
  summary_es      TEXT,
  body            TEXT NOT NULL,
  body_es         TEXT,
  category        TEXT NOT NULL CHECK (category IN (
    'muscle_preservation','protein','side_effects','micronutrients',
    'injection_tips','plateaus','discontinuation','maintenance',
    'insurance','mental_health','comorbidities','general')),
  relevant_phases TEXT[] DEFAULT '{}',
  is_published    BOOLEAN DEFAULT false,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_public_read" ON content_cards FOR SELECT USING (is_published = true);
```

### 013_content_card_versions.sql

```sql
CREATE TABLE content_card_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         UUID NOT NULL REFERENCES content_cards(id) ON DELETE CASCADE,
  version         INT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  published_at    TIMESTAMPTZ DEFAULT NOW(),
  authored_by     TEXT,
  UNIQUE (card_id, version)
);
```

> **⚠️ Migration numbering note:** The schema entries above and below are PLANNED
> migrations from the original architecture doc. Actual applied migrations on cloud
> Supabase use a different numbering sequence (001–013 as of 2026-05-23). The planned
> table schemas remain accurate for when those features are built; the actual migration
> file names on disk are authoritative. Run `npx supabase db push` to see live state.

### injection_logs (013_create_injection_logs.sql — LIVE on cloud as of 2026-05-23)

The canonical injection logging table. Replaced an ad-hoc table that had no committed
migration. site_code is constrained to the 6 supported stomach sites only.

```sql
CREATE TABLE injection_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  injected_at     TIMESTAMPTZ  NOT NULL,
  site_code       TEXT         NOT NULL
                    CHECK (site_code IN (
                      'stomach_upper_left',
                      'stomach_upper_mid',
                      'stomach_upper_right',
                      'stomach_lower_left',
                      'stomach_lower_mid',
                      'stomach_lower_right'
                    )),
  medication_name  TEXT         NOT NULL,
  dosage_strength  TEXT,        -- e.g. "0.5 mg" — nullable, added migration 014
  pain_level       INTEGER      NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_injection_logs_user_injected_at
  ON injection_logs (user_id, injected_at DESC);

ALTER TABLE injection_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own logs"  ON injection_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs"  ON injection_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own logs"  ON injection_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own logs"  ON injection_logs FOR DELETE USING (auth.uid() = user_id);
```

**Why `medication_name` (TEXT) instead of FK to glp1_medications:** Keeps the log table
independent of the medication catalog. If a user changes medication, historical logs
correctly reflect what they were on at the time of injection. Display name stored
(e.g., "Ozempic") — same values as `MEDICATION_DISPLAY_NAMES` in add-shot.tsx.

**Migration 014 — `dosage_strength` column (2026-05-23):**
```sql
-- supabase/migrations/014_add_dosage_strength.sql
ALTER TABLE injection_logs ADD COLUMN IF NOT EXISTS dosage_strength TEXT;
```
Nullable — existing rows stay valid. Add Shot screen offers a per-medication dosage
dropdown (`DOSAGE_OPTIONS_BY_MEDICATION`) with all FDA-approved dose rungs plus
common compounded ranges. Value stored as a display string (e.g. "0.5 mg").

### 014_ai_invocations.sql

```sql
CREATE TABLE ai_invocations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name   TEXT NOT NULL,
  invoked_at      TIMESTAMPTZ DEFAULT NOW(),
  success         BOOLEAN,
  cost_estimate_cents INT
);

CREATE INDEX idx_ai_invocations_user_function_date ON
  ai_invocations(user_id, function_name, invoked_at DESC);

ALTER TABLE ai_invocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_invocations" ON ai_invocations FOR ALL
  USING (auth.uid() = user_id);
-- Rate limits: recognize-meal-photo: 50/day Pro; daily-guidance: 5/day per user
```

### 015_ai_feedback.sql

```sql
CREATE TABLE ai_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name   TEXT NOT NULL,
  prompt_version  TEXT,
  ai_output       TEXT NOT NULL,
  rating          TEXT NOT NULL CHECK (rating IN ('up','down')),
  user_comment    TEXT,
  context_inputs  JSONB,    -- Exact inputs used — for "Why?" and prompt improvement
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_feedback_function_rating ON ai_feedback(function_name, rating);
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_feedback" ON ai_feedback FOR ALL USING (auth.uid() = user_id);
```

### 016_user_acknowledgments.sql

```sql
CREATE TABLE user_acknowledgments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL CHECK (document_type IN
                    ('terms_of_service','privacy_policy','medical_disclaimer',
                     'protein_floor_acknowledgment','red_flag_acknowledgment',
                     'marketing_consent','data_processing_consent')),
  document_version TEXT NOT NULL,
  document_url     TEXT NOT NULL,   -- Permanent URL never deleted
  ip_address       INET,
  user_agent       TEXT,
  acknowledged_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ack_user_type ON user_acknowledgments(user_id, document_type);
ALTER TABLE user_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_acks" ON user_acknowledgments FOR ALL USING (auth.uid() = user_id);
```

### 017_prescriber_visits.sql

```sql
CREATE TABLE prescriber_visits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date  DATE NOT NULL,
  prescriber_name TEXT,
  visit_type      TEXT,
  notes_pre_visit TEXT,
  notes_post_visit TEXT,
  report_generated_at TIMESTAMPTZ,
  report_url      TEXT,             -- Signed Supabase Storage URL
  report_period_start DATE,
  report_period_end DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prescriber_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_visits" ON prescriber_visits FOR ALL USING (auth.uid() = user_id);
```

### 018_linked_accounts.sql

```sql
CREATE TABLE linked_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship    TEXT NOT NULL CHECK (relationship IN
                    ('spouse','partner','adult_child','caregiver','parent','sibling','other')),
  permission_level TEXT NOT NULL DEFAULT 'read_only'
                    CHECK (permission_level IN ('read_only','read_write','log_for')),
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  UNIQUE (primary_user_id, linked_user_id)
);

ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "linked_visible" ON linked_accounts FOR SELECT
  USING (auth.uid() = primary_user_id OR auth.uid() = linked_user_id);
CREATE POLICY "linked_manage" ON linked_accounts FOR ALL
  USING (auth.uid() = primary_user_id);
```

### 019_notification_log.sql through 025_admin_audit_log.sql

See prior architecture messages for full SQL.
Key tables: notification_log, offline_sync_log, import_history,
subscription_state, promo_codes, partners, admin_audit_log.

### 026_provider_invitations.sql + 027_provider_user_links.sql

Schema in migrations v1. Feature ships in v3.
Avoids future painful migrations when prescriber portal is built.

---

## Offline Mode

```ts
// src/features/offline/queue.ts
type QueuedOperation = {
  client_uuid: string; // UUID generated client-side
  operation_type: 'food_log' | 'checkin' | 'weight';
  payload: any;
  client_timestamp: string;
  retry_count: number;
};
// Stored in AsyncStorage key 'offline_queue'
// Drained on: network reconnect, app foreground, manual sync trigger
// Server uses client_uuid for idempotency (UNIQUE constraint)
// Last write wins via client_timestamp for conflict resolution
// UI: <OfflineBanner /> "Logged offline — syncing when back online"
```

---

## Voice + Hybrid Text Logging

The killer feature for day 2 of the injection cycle when users can't eat,
can barely tap a screen, but need to log protein.

```
User taps mic OR "Describe what I ate"
  → "Half a Greek yogurt and a few crackers"
  → parse-meal-text edge function (GPT-4o mini)
  → Returns structured: [{ name, estimated_grams, protein_g, ... }]
  → User reviews + confirms
  → Saved as log_source = 'voice' or 'hybrid_text'
```

Edge function inputs include: injection_phase, dietary_pattern.
AI uses the dietary pattern only to break ties on ambiguous food identification.
Allergens are intentionally NOT collected or sent: the app makes no allergen-avoidance
safety promise (removed 2026-06-15, migration 025).

---

## AI Engine Rules — 16 Non-Negotiable

1. Never call OpenAI from client — always via edge functions
2. Never send PII to OpenAI (no name, email, exact location)
3. Validate all AI JSON output against Zod schema; failures → deterministic fallback
4. Reject output containing forbidden patterns (calorie shaming, dose suggestions)
5. Never suggest skipping doses or changing medication
6. Protein floor bounds: never below floor minus 10% or above plus 30%
7. Never use calorie-shaming language
8. Frame appetite suppression as the drug working, not a problem
9. High-nausea days (4-5): suggest only soft/liquid protein
10. Never recommend exercise on severe nausea (5/5)
11. Always include "consult your prescriber" for medication-adjacent questions
12. Daily guidance: phase-aware AND check-in-aware AND medication-status-aware
13. Use dietary pattern only to break ties on ambiguous food ID; never collect or act on allergens (no allergen-safety promise)
14. Protein missed 3+ days: gentle non-shame reframing only
15. Red-flag triggered today: suppress AI guidance, show escalation card
16. Every AI response includes `reasoning_text` for the "Why?" tooltip

**Forbidden output patterns (guardrails.ts validates and rejects):**
- "you should," "you need to," "you must"
- "clinically proven," "prevents," "treats," "cures"
- Any specific medication dosage adjustment
- Any brand-name product endorsement
- Calorie totals as primary metric

---

## Edge Function Reference Pattern

All 15 Glipra edge functions follow this structure. Use it as a template
when adding new functions. Reference: aaronksaunders/expo-supabase-ai-template.

```ts
// supabase/functions/[function-name]/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader)
      throw new Error('No auth header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user)
      throw new Error('Unauthorized');

    // 3. Rate limiting (from ai_invocations table)
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', '[FUNCTION_NAME]')
      .gte('invoked_at', today);

    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'Daily limit reached' }),
        { status: 429, headers: corsHeaders }
      );
    }

    // 4. Zod validation on input
    const body = await req.json();
    const validated = InputSchema.parse(body);

    // 5. Business logic + AI call
    const result = await callOpenAI(validated);

    // 6. Zod validation on output (catches AI hallucinations)
    const validatedOutput = OutputSchema.parse(result);

    // 7. Log invocation + cost
    await supabase.from('ai_invocations').insert({
      user_id: user.id,
      function_name: '[FUNCTION_NAME]',
      success: true,
      cost_estimate_cents: estimateCost(result),
    });

    return new Response(
      JSON.stringify(validatedOutput),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: corsHeaders }
    );
  }
});
```

### OpenAI Setup (Deno)

```ts
// supabase/functions/_shared/openai.ts
import OpenAI from 'npm:openai@4';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// GPT-4o for vision (photo recognition)
export async function recognizeMealPhoto(base64Image: string, prompt: string) {
  return await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        { type: 'text', text: prompt },
      ],
    }],
    response_format: { type: 'json_object' },
  });
}

// GPT-4o mini for text/guidance (10x cheaper)
export async function generateGuidance(systemPrompt: string, userPrompt: string) {
  return await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });
}
```

### Daily Cost Limits (per user, per function)

| Function | Free Tier | Pro Tier |
|---|---|---|
| recognize-meal-photo | Locked | 50/day |
| parse-meal-text | Locked (Pro only) | Unlimited |
| transcribe-voice | Locked (Pro only) | Unlimited |
| generate-daily-guidance | 0 | 1/day (auto) |

Rate limiting enforced via `ai_invocations` table count + 429 response.

---

## Pre-Prescriber Visit Prep

The strongest retention feature. Users who use this never delete the app.

3 days before scheduled visit → `generate-prescriber-report` runs:
- Aggregates last 4 weeks: weight trend, protein adherence %, side effect trends,
  red-flag triggers, dose changes
- Generates 3 personalized questions based on user's specific data
- Builds PDF via `pdf-lib` (Deno-compatible — React PDF does NOT run in edge functions)
- Stores in Supabase Storage with signed URL
- Pushes notification: "Your visit prep is ready"
- Client uses `expo-sharing` to share, `expo-print` to view

Example generated questions:
- "My nausea has been 4-5 on 8 of the last 14 days. Should we adjust my dose?"
- "Weight plateau at -8 lbs for 3 weeks at 0.5mg. Is escalation appropriate?"
- "3 episodes of severe abdominal pain this month. Should I be evaluated for pancreatitis?"

**PDF generation pattern (edge function):**
```ts
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([595, 842]); // A4
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
page.drawText('Glipra — Prescriber Visit Summary', {
  x: 50,
  y: 800,
  size: 16,
  font,
});
// Add user data, trends, suggested questions
const pdfBytes = await pdfDoc.save();
// Upload to Supabase Storage, return signed URL
```

---

## Smart Notification Escalation

`notification-rules-runner` edge function runs nightly.
All notifications respect `quiet_hours_start/end` (default 22:00-08:00 local).

| Rule | Trigger | Push Message |
|---|---|---|
| Streak risk | 8pm + protein <50% | "Floor not yet met — quick log?" |
| Reengagement 3d | No activity 3 days | "Quick check-in?" |
| Reengagement 7d | No activity 7 days | "Streak paused, not broken. Come back?" |
| Repeat nausea | Nausea 4-5 for 4+ days | "When did you last speak with your prescriber?" |
| Pre-injection | Day before injection | "Good window to hit protein floor today." |
| Pre-escalation | 3 days before escalation | "Escalating soon — here's what to expect." |
| Plateau | Weight unchanged 21+ days | "Your weight has been steady — let's review." |
| Visit prep | 3 days before scheduled visit | "Your visit prep is ready." |

---

## Cohort Insights Schema

`medication_week` and `injection_phase` tagged on every food log and check-in.
Build this from day one. Surface insights in v2 when you have 1,000+ users.

```sql
-- "Users at week 4 of Wegovy 2.4mg typically experience nausea of..."
SELECT AVG(nausea), COUNT(DISTINCT user_id)
FROM daily_checkins dc
JOIN user_medications um ON dc.user_id = um.user_id
WHERE um.medication_id = 'semaglutide_wegovy'
  AND dc.medication_week = 4
GROUP BY um.current_dose_mg;
```

This is the compounding moat. No competitor can build it without your user base.
Data accumulates from user one.

---

## Testing Strategy

Vitest configured for `src/__tests__/`. Husky pre-commit hook runs all tests.
CI blocks merges on test failure. No exceptions for safety-critical files.

| Test File | Required Coverage |
|---|---|
| protein.test.ts | All branches: kidney, pregnancy, BMI extremes, maintenance, edge cases |
| injection-cycle.test.ts | Phase boundaries, DST transitions, timezone handling |
| readiness.test.ts | Score across all phase + check-in combinations |
| ewma.test.ts | Convergence, single values, missing days, large gaps |
| redFlagDetector.test.ts | Every trigger, no false positives, multi-day patterns |
| streak-rules.test.ts | Day boundaries, 80% threshold, broken vs. continuous |
| notification-escalation.test.ts | Rule triggers, frequency caps, quiet hours |
| medication-status.test.ts | All state transitions, protein floor adjustments |
| offline-queue.test.ts | Persistence, drain on reconnect, dedup, conflict resolution |

---

## Design System

### Colors

```ts
// src/theme/colors.ts
export const colors = {
  bg: {
    base: '#FAFAF8',
    elevated: '#F4F1ED',
    surface: '#EDEAE5',
    overlay: '#E5E1DB',
  },
  brand: {
    teal: '#2D7B7B',
    tealLight: '#E8F4F4',
    amber: '#E8A45A',
    amberLight: '#FDF3E7',
  },
  text: {
    primary: '#1A2B3C',
    secondary: '#6B7B8D',
    tertiary: '#9BA8B4',
    inverse: '#FAFAF8',
  },
  semantic: {
    success: '#5A9E7B',
    warning: '#E8A45A',
    danger: '#C0534F', // RESERVED: clinical escalation ONLY
    info: '#4A8FB5',
  },
  micronutrient: {
    b12: '#7B5EA7',
    iron: '#C0534F',
    calcium: '#4A8FB5',
    magnesium: '#5A9E7B',
    fiber: '#8B7355',
  },
};
```

**Typography:** DM Serif Display (hero, numbers) + DM Sans (all UI text)

**Key Rules:**
- Today hero score dial: minimum 96px (Muscle Preservation Score as of session 59; was the Readiness Score pre-merge)
- Protein ring: minimum 200px diameter
- Buttons: height 56, borderRadius 14
- Cards: borderRadius 16, subtle border
- Red color ONLY for EscalationCard — never for missed floors or nausea warnings
- LoadingSkeleton on Today/Insights — never blank-then-pop
- Light mode first (older demographic)
- WCAG 2.1 AA — voiceover labels on every interactive element
- Dynamic type support — text scales to user's system settings
- Reduced motion — check `useReducedMotion()` before animations

---

## Subscription Tiers

| Feature | Free | Pro | Founder Lifetime |
|---|---|---|---|
| Price | Free | $9.99/mo or $49.99/yr | $149 one-time (first 500) |
| Barcode scanner | ✓ | ✓ | ✓ |
| Voice/hybrid logging | 5/day | Unlimited | Unlimited |
| AI photo recognition | — | ✓ 50/day | ✓ |
| Protein floor + 7-day history | ✓ | ✓ | ✓ |
| Unlimited protein history | — | ✓ | ✓ |
| Readiness Score | ✓ | ✓ | ✓ |
| Injection cycle (full) | Basic | ✓ | ✓ |
| Red-flag detection | ✓ ALWAYS FREE | ✓ | ✓ |
| Discontinuation mode | ✓ | ✓ | ✓ |
| Side effect trends | — | ✓ | ✓ |
| Micronutrient watch | — | ✓ | ✓ |
| Pharmacist content | 5 cards | Unlimited | Unlimited |
| Weight trend (EWMA) | 14 days | Unlimited | Unlimited |
| Daily AI guidance | — | ✓ | ✓ |
| Prescriber visit prep | — | ✓ | ✓ |
| Linked accounts | — | ✓ | ✓ |
| Streak share images | ✓ | ✓ | ✓ |
| Apple Health sync | ✓ | ✓ | ✓ |
| Spanish / English | ✓ | ✓ | ✓ |
| Data export (GDPR) | ✓ | ✓ | ✓ |
| Account deletion | ✓ | ✓ | ✓ |

---

## Analytics Event Taxonomy

All events: `domain.object.verb`. Locked pre-launch.

```
Onboarding:
  onboarding.started / onboarding.completed
  onboarding.medication.selected
  onboarding.safety.completed / onboarding.dietary.completed
  onboarding.status.selected
  onboarding.protein_floor.adjusted (props: from_g, to_g, was_capped)
  onboarding.import.completed (props: source, records_count)

Logging:
  log.method.selected (props: method)
  log.barcode.scanned (props: source='off'|'usda'|'cache'|'not_found')
  log.photo.recognized (props: confidence, items_count)
  log.voice.transcribed (props: duration_seconds, items_count)
  log.hybrid.parsed (props: items_count)
  log.food.logged (props: meal_type, protein_g, source)
  log.offline.queued / log.offline.synced (props: queued_for_seconds)

AI Quality:
  ai.feedback.thumbs_up (props: function_name)
  ai.feedback.thumbs_down (props: function_name, has_comment)

Safety:
  safety.red_flag.triggered (props: type)
  safety.escalation_card.viewed
  safety.bad_day.activated

Engagement:
  today.readiness.viewed (props: score)
  today.guidance.viewed / today.guidance.why_tapped
  today.checkin.submitted (props: nausea, energy, red_flag)
  paywall.viewed (props: trigger) / paywall.subscribed (props: tier, period)

Prescriber:
  prescriber.visit.scheduled
  prescriber.report.generated / prescriber.report.shared

Notifications:
  notification.sent (props: type)
  notification.opened / notification.dismissed
```

---

## A/B Testing & Feature Flags

PostHog feature flags from day one. Set up immediately at launch:

| Flag | Variants | Goal |
|---|---|---|
| paywall_position | after_5_logs / after_protein_hit / day_3 | Find best conversion trigger |
| free_tier_history_days | 7 / 14 / 30 | Test sensitivity |
| daily_guidance_tone | clinical / warm | Audience preference |
| notification_streak_time | 4pm / 6pm / 8pm | Optimize engagement |
| onboarding_length | 8_step / 10_step | Completion rate |

---

## Production Infrastructure

### CI/CD — GitHub Actions

```yaml
jobs:
  test:
    steps:
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm test # jest-expo (components + integration)
      - run: pnpm test:utils # Vitest (pure-TS safety code — 90% coverage gate)
      - run: pnpm run test:rls

  ota-update-staging:
    if: github.ref == 'refs/heads/develop'
    steps:
      - run: eas update --branch staging --message "commit message"

  ota-update-production:
    if: github.ref == 'refs/heads/main'
    steps:
      - run: eas update --branch production --message "commit message"
```

EAS Update for OTA hotfixes. If protein floor calculation has a bug affecting
kidney disease users, fix ships in hours, not 7-day App Store review cycles.

### Sentry Alerting Thresholds

- Crash-free user rate below 99.5% → immediate alert
- Edge function 5xx rate >2% over 15 minutes → alert
- Failed RevenueCat webhooks → alert (revenue impact)
- AI thumbs-down rate >30% on any prompt → daily digest

### RevenueCat Webhook Security

```ts
// Always verify signature before processing
const expected = createHmac('sha256', REVENUECAT_WEBHOOK_SECRET).update(body).digest('hex');
if (signature !== `Bearer ${expected}`)
  return new Response('Unauthorized', { status: 401 });
// Always check last_event_id for idempotency before processing
```

Subscription state transitions:
- INITIAL_PURCHASE → trialing or active
- RENEWAL → active, extend period_end
- CANCELLATION → cancel_at_period_end: true (still active until period_end)
- EXPIRATION → expired → downgrade to free
- BILLING_ISSUE → past_due (7-day grace period before expiration)
- REFUND → refunded → downgrade immediately

### Cost Telemetry

`cost_estimate_cents` on every `ai_invocations` row.
Daily admin report: average AI cost per Pro user, total OpenAI spend, gross margin ratio.
Alert if any single user costs >$2/month (potential abuse pattern).

### Email (Resend)

| Trigger | Email Type |
|---|---|
| Signup confirmed | Welcome |
| Beta approval | Beta access granted |
| Founder Lifetime purchase | Confirmation + receipt |
| 1 day before scheduled visit | Prescriber reminder |
| RevenueCat subscription created | Confirmation |
| Day 1 of grace period | Past due / update payment |
| Account deletion confirmed | Farewell + export reminder |

### Deep Linking

Universal Links (iOS) + App Links (Android):
```
glipra.com/share/streak/[token]    → streak share screen
glipra.com/visit/[id]/prep         → visit prep
glipra.com/invite/[code]           → linked account accept
glipra.com/pharmacy/[partner]      → pharmacy onboarding flow
```

Every push notification includes deep link in `data` payload.
Tapping opens directly to relevant screen, not home tab.

### App Clips (iOS)

QR code on pharmacy handout → App Clip launches in 5 seconds → protein floor
calculator → user sees personalized number → prompt to install full app.
Target: <10MB. Includes only protein calculator and injection cycle basics.
Most powerful pharmacy partnership distribution mechanic.

---

## Legal Readiness

### Entity Structure

Form Texas LLC — "Path Health Technologies LLC" doing business as "Glipra."
Get EIN from irs.gov (free, 10 minutes).
Open business bank account (Mercury) — NEVER commingle personal and business funds.
Registered agent service ($125/year — Northwest Registered Agent).
S-Corp election when netting >$60K from the app.

### Insurance Stack (Required Before Launch)

- Tech E&O: $1M coverage — $400-1,500/year (Hiscox, Coalition, Embroker)
- Pharmacist PLI rider for "Telepharmacy and Digital Health Activities" — $200-500/year
- General liability + cyber liability: $1M each — $500-1,200/year
- **Total: $1,500-3,200/year. Non-negotiable before launch.**

A single pancreatitis lawsuit costs $50-150K to defend even if you win on the merits.
Without insurance that's your savings. With insurance it's their problem.

### Required Legal Documents (Attorney-Reviewed)

Public-facing:
- Terms of Service (mandatory arbitration, class action waiver, limitation of liability)
- Privacy Policy (GDPR, CCPA, California, Virginia, Colorado, WA My Health My Data)
- Medical Disclaimer (standalone page + in-app persistent)
- Subprocessor list (live page, updated as vendors change)
- Children's privacy section (minimum age 18)
- Refund policy
- Subscription auto-renewal disclosures

### Medical Disclaimer Templates

**Master disclaimer (T&C, About page, App Store description):**
"Glipra is an educational and tracking application for general wellness purposes.
Information provided, including AI-generated suggestions and content articles, is for
educational purposes only and is not medical advice, diagnosis, or treatment. Although
Glipra was designed by a licensed pharmacist, your use of Glipra does not establish
a pharmacist-patient relationship or any professional medical relationship. Glipra is
not a substitute for professional medical advice. Always seek the advice of your prescriber
or qualified healthcare provider. If you think you may have a medical emergency, call 911."

**Protein floor acknowledgment modal:**
"Your suggested protein target is calculated using general nutritional guidelines. This
is an estimate, not a personalized medical recommendation. Your prescriber or dietitian
may recommend a different target.
[☐] I understand this is an educational estimate."

**AI output footer:**
"AI-generated educational suggestion. Not medical advice. Consult your prescriber."

### FTC Marketing Claim Compliance

Approved: "Built by a licensed pharmacist," "pharmacist-authored educational content,"
"helps you stay informed between prescriber visits," "tracks protein and side effects"

Forbidden: "prevents muscle loss," "clinically proven," "doctor-recommended,"
"FDA-approved," "reduces side effects," "your virtual pharmacist"

No second-person directives in any AI output:
- BAD: "You should eat more protein at breakfast."
- GOOD: "Many users find front-loading protein at breakfast helps with daily targets."

### Texas Pharmacy Board

Must verify with attorney before launch:
1. Do I need to disclose this app to TSBP?
2. Does my employment contract require outside-activity disclosure?
3. What language risks triggering a "practicing pharmacy" complaint?
4. Are there Texas advertising restrictions on referencing my pharmacist license?

Approved founder bio: "Glipra was designed by a Texas-licensed pharmacist with
[X] years of patient counseling experience. Glipra provides educational content for
general wellness purposes; it does not provide pharmacist counseling, prescription
review, or professional medical services."

### Consent Audit Trail

Every legal document version lives at a permanent URL that is never deleted.
Pattern: `glipra.com/legal/terms/2026.05.09.1`

When a user sues claiming they didn't agree to limitation of liability, you produce:
timestamp + IP address + exact document URL they accepted.
That's the defense. `user_acknowledgments` table makes this automatic.

### Pre-Launch Legal Checklist

Entity & Banking:
- [ ] Texas LLC formed
- [ ] EIN obtained
- [ ] Business bank account opened (never commingled)
- [ ] Registered agent active

Insurance:
- [ ] Tech E&O $1M active
- [ ] Pharmacist PLI digital health rider active
- [ ] General liability + cyber active

Legal Documents (attorney-reviewed):
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Medical Disclaimer
- [ ] Subprocessor list published
- [ ] All documents version-tagged at permanent URLs

Compliance:
- [ ] Consent capture with audit trail working
- [ ] AI guardrails enforcing forbidden language
- [ ] Red-flag escalation built and tested
- [ ] Account deletion end-to-end working
- [ ] Data export end-to-end working

App Stores:
- [ ] Apple Privacy Manifest complete
- [ ] Google Data Safety form complete
- [ ] No medical device claims in app or description
- [ ] Subscription auto-renewal disclosures compliant

IP:
- [ ] Trademark application filed (Classes 9, 42, 44)
- [ ] glipra.com registered
- [ ] dosepath.app registered
- [ ] @dosepath on Instagram, TikTok, X secured

Pharmacy Board:
- [ ] Attorney consulted on Texas Pharmacy Board disclosure
- [ ] All marketing reviewed for pharmacy practice concerns

---

## Content Production Pipeline

Write 25 pharmacist content cards before launch (Months 2-4).

| # | Title | Category |
|---|---|---|
| 1 | Why your protein floor matters more than your calories | protein |
| 2 | What's happening on day 2 after your shot | injection_tips |
| 3 | Hair loss on GLP-1: two causes, two fixes | side_effects |
| 4 | How to eat protein when you can't stand the thought of food | protein |
| 5 | B12 deficiency on GLP-1: signs, testing, and what to do | micronutrients |
| 6 | Iron deficiency in women on GLP-1: the silent issue | micronutrients |
| 7 | Constipation on GLP-1: the actual fix | side_effects |
| 8 | Why your weight stalls at week 6 (and what NOT to do) | plateaus |
| 9 | Maintenance: what changes when you've reached your goal | maintenance |
| 10 | Discontinuing GLP-1: tapering, rebound, and the realistic plan | discontinuation |
| 11 | Injection site rotation: why it matters | injection_tips |
| 12 | Ozempic vs. Wegovy: what's actually different | general |
| 13 | Mounjaro vs. Zepbound: dual mechanism explained | general |
| 14 | Compounded semaglutide: what's actually in it | general |
| 15 | Sulfur burps and other weird side effects: what's normal | side_effects |
| 16 | Alcohol on GLP-1: what changes and why | general |
| 17 | Exercise on GLP-1: protein timing and resistance training | muscle_preservation |
| 18 | Magnesium and muscle cramps | micronutrients |
| 19 | Pancreatitis warning signs: when to actually worry | side_effects |
| 20 | Gallbladder issues on GLP-1 | side_effects |
| 21 | Travel and GLP-1: storage, time zones, missed doses | injection_tips |
| 22 | Holiday eating on GLP-1: the realistic strategy | general |
| 23 | Insurance coverage and prior authorization | insurance |
| 24 | Prescriber visits: three questions to always ask | general |
| 25 | Switching between GLP-1 medications: practical guide | general |

Each card = one TikTok video = one Reddit post. Maximum content leverage.
Top 10 translated to Spanish at launch.

---

## Marketing Plan

### TikTok — Start Month 1 (not launch month)

**Account:** @Glipra or @PharmacistPath — credential in bio
**Cadence:** 4 videos/week. Consistency beats volume every time.

**Five Content Pillars:**
1. "What your prescriber didn't tell you" (40%) — highest performer
2. "Day in the injection cycle" series (20%)
3. "Protein hacks for GLP-1" (15%) — high save rate = algorithm gold
4. "Pharmacist reacts to GLP-1 myths" (15%) — high engagement
5. "Building Glipra in public" (10%) — start Month 4

**Hook formula:** First 2s = the pain point as a question.
"Your doctor put you on Ozempic and gave you five minutes?"
Next 2s = credential. "I'm a licensed pharmacist. Here's what I tell every patient."
30-50s of clinical explanation. End: "Follow for more."

**Example video ideas (film these first):**
- "3 things your doctor didn't tell you about your first Ozempic shot"
- "Why your hair is falling out on Mounjaro and what actually fixes it"
- "What's happening on day 2 after your Wegovy shot"
- "How to hit 100g protein when your appetite is gone"
- "B12 deficiency on Ozempic: the signs nobody warns you about"
- "Why you stopped losing weight at week 6"
- "The truth about what happens when you stop GLP-1"

**Critical:** Don't evaluate TikTok performance until video 30.
The algorithm takes 30+ videos to categorize your account.
Most creators quit at 12. Push through.

### Reddit — Start Month 1 Lurking

**Primary subreddits:** r/Ozempic, r/Mounjaro, r/Zepbound, r/Wegovy
**Secondary:** r/Semaglutide, r/Tirzepatide, r/GLP1

**Phase 1 (Months 1-2):** Read only. Mine questions for content cards.
**Phase 2 (Months 2-4):** Comment as u/PharmacistGlipra. Always disclose credential.
Long substantive answers. 10+ comments/week. No app mentions ever.
**Phase 3 (Months 4-5):** Original long-form educational posts. No links.
**Phase 4 (Month 5):** AMA. 6pm Eastern weekday. Stay 4 hours.
**Phase 5 (Month 6):** Soft launch announcement after trust is established.

**Comment template:**
"Pharmacist here, not your pharmacist, this is general information only.
[Substantive answer with multiple clinical points]
Always follow up with your own provider for your specific situation."

### Landing Page

**Status:** Live at glipra.com (deployed 2026-05-19)
**Hosting:** GitHub Pages — repo `waliabdulfatah20-create/GLiPra`, branch `master`, folder `/docs`
**Files:** `docs/index.html` (single-file HTML/CSS/JS), `docs/CNAME`

**Email capture:** POST to `supabase/functions/capture-waitlist` (public endpoint, `--no-verify-jwt`)
- Zod-validates email, upserts into `waitlist` table using service role key
- Silent dedup — same email can submit twice with no error
- `source` field tracks `hero` vs `footer` form

**Waitlist table:** `supabase/migrations/009_waitlist.sql` — RLS enabled, no user-facing policies (service role only)

**Sections (V2):** Hero (stat card + email capture), Problem (3 cards, SVG icons), Solution (4 feature cards, SVG icons), How It Works (3-step), Injection Cycle Callout (5-phase: Day 0→8+, Glipra-exclusive), Founder Lifetime ($149 one-time, 500 spots), Credibility (Wali Abdul PharmD bio + stats), FAQ (8 questions), Final CTA, Footer

**V2 changes (2026-05-19):** Inline SVG capsule logo (nav + footer), hero stat card ("Up to 40% of GLP-1 weight loss is lean muscle"), How It Works + Injection Cycle sections added from competitive analysis, Wali Abdul PharmD founder bio in credibility section, all emoji icons replaced with SVG line art (amber for problems, blue for features), FAQ expanded 4 → 8 questions.

**Goals:** 2,000+ emails, 100+ Founder Lifetime pre-orders ($14,900 upfront cash)

**Founder Lifetime pre-order payment (Stripe):** Not yet wired — CTA scrolls to waitlist form as interim.

**Live status (2026-05-19):** HTTPS enforced, end-to-end verified — email submissions confirmed appearing in `waitlist` table in cloud Supabase.

### Growth Loops

1. Streak Share → Friend Install → potential couples mode → repeat
2. Content Card → SEO (glipra.com/learn/[slug]) → organic search → install
3. Couples Mode → Spouse Conversion → second subscription
4. Prescriber Visit Report → prescriber asks about it → word of mouth
5. Pharmacy Partnership → QR code → bulk distribution at zero CAC

---

## 6-Month Build Plan

| Month | Focus | Critical Deliverable | Est. Cost |
|---|---|---|---|
| 1 | Foundation | Auth, consent, onboarding, protein floor, injection cycle, Today skeleton + Landing page | $0 |
| 2 | Core Tracking | Barcode, logging, check-ins, weight, EWMA, streaks + 10 content cards | $20-25 |
| 3 | Intelligence | Photo AI, voice/hybrid, daily guidance, red-flag detection + 15 more content cards | $40 |
| 4 | Pro Tier + Polish | RevenueCat, HealthKit sync, notifications, prescriber prep, linked accounts, Spanish | $50 |
| 5 | Beta 200 Users | TestFlight + Play Internal Testing, feedback iteration, App Store listing, reviews | $184 |
| 6 | Launch | App Store live, TikTok + Reddit campaigns, pharmacy outreach, 500+ paying subscribers | $70 |
| **Total** | | | **~$370** |

Break-even on infrastructure: **38 paying Pro subscribers** ($9.99/month).

---

## Cost Strategy — Build Lean

### Monthly Cost Breakdown by Service

| Service | Dev (M1-4) | Beta (M5) | Launch (M6+) | Free Tier Limit |
|---|---|---|---|---|
| Cursor | $0→$20 | $20 | $20 | 2,000 completions |
| Supabase | $0 | $0 | $0 | 500MB DB, 500K edge invocations/mo |
| OpenAI | $0 (mocked) | $20-40 | $50-100 | None — pay per use |
| EAS Build | $0 | $0 | $0 | 30 builds/month free |
| RevenueCat | $0 | $0 | $0 | Free to $2,500 MRR |
| PostHog | $0 | $0 | $0 | 1M events/month |
| Sentry | $0 | $0 | $0 | 5,000 errors/month |
| Apple Dev | $0 | $99/yr | — | — |
| Google Play | $0 | $25 once | — | — |
| GitHub | $0 | $0 | $0 | Unlimited private repos |
| Claude.ai | $0-20 | $0-20 | $0-20 | Free tier sufficient for planning |

**Rule:** Never upgrade a free tier until you actually hit its limit.
Supabase free handles ~200-300 active users easily. You will not need paid Supabase at launch.

### The Mock AI Strategy (Saves $50-100 During Development)

OpenAI is the only significant variable cost. Mock it during development —
zero cost, instant responses, fully realistic data for building UI.

**Step 1 — Create the mock file:**
```ts
// src/lib/mockAI.ts
// Used when EXPO_PUBLIC_USE_MOCK_AI=true in .env.local

export const MOCK_DAILY_GUIDANCE = {
  guidance_text: 'Today is day 3 of your cycle. Appetite returning — good window for protein.',
  reasoning_text: 'Day 3 post-injection is the adjustment phase. Appetite suppression easing.',
  injection_phase: 'adjustment',
  prompt_version: 'mock-1.0',
};

export const MOCK_PARSED_MEAL = {
  items: [
    {
      name: 'Greek yogurt',
      estimated_grams: 170,
      protein_g: 17,
      calories: 100,
      carbs_g: 6,
      fat_g: 0.7,
      confidence: 0.95,
      is_estimated: true,
    },
  ],
  needs_review: false,
};

export const MOCK_PHOTO_RECOGNITION = {
  items: [
    { name: 'Grilled chicken breast', estimated_grams: 140, protein_g: 42, calories: 231, carbs_g: 0, fat_g: 5, confidence: 0.88, is_estimated: true },
    { name: 'Mixed salad', estimated_grams: 80, protein_g: 2, calories: 20, carbs_g: 4, fat_g: 0.3, confidence: 0.82, is_estimated: true },
  ],
  needs_review: false,
};

export const MOCK_COACH_RESPONSE = {
  answer: 'Greek yogurt is one of the best protein sources for GLP-1 users — soft texture, high protein density, and easy on a suppressed appetite. Aim for full-fat plain varieties to slow digestion.',
  sources: ['pharmacist-content'],
  disclaimer: 'AI-generated educational suggestion. Not medical advice. Consult your prescriber.',
};
```

**Step 2 — Feature flag in .env.local:**
```bash
# Set true during development, false in production
EXPO_PUBLIC_USE_MOCK_AI=true
```

**Step 3 — Gate all AI calls behind the flag:**
```ts
// In each feature's api.ts
import { MOCK_DAILY_GUIDANCE } from '@lib/mockAI';

export async function getDailyGuidance(userId: string) {
  if (process.env.EXPO_PUBLIC_USE_MOCK_AI === 'true') {
    return MOCK_DAILY_GUIDANCE;
  }
  // Real edge function call
  const { data } = await supabase.functions.invoke('generate-daily-guidance', {...});
  return data;
}
```

Enable real AI only when specifically testing that feature. Keep mock on for everything else.

### OpenAI Hard Budget Cap

Set this in your OpenAI dashboard on Day 1. Never remove it.

```
OpenAI Dashboard → Settings → Billing → Usage Limits
Hard limit: $20/month (development)
Hard limit: $100/month (beta — raise when ready)
Hard limit: $300/month (post-launch)
```

If the hard limit is hit, all AI features stop responding. This protects you from
a bug causing infinite API calls — which has bankrupted developers before.

### Cost Per Feature (When Real AI is Enabled)

| Feature | Model | Cost/call | 100 users × 1/day |
|---|---|---|---|
| Daily guidance | GPT-4o mini | ~$0.001 | ~$3/mo |
| Voice logging | Whisper | ~$0.006/min | ~$18/mo |
| Nutrition coach | GPT-4o mini | ~$0.002 | ~$6/mo |
| Photo recognition | GPT-4o | ~$0.015 | ~$45/mo |

Photo recognition is the cost driver. The Pro-only gate (50/day cap) and
`ai_invocations` rate limiting in every edge function protect you from runaway costs.

### Services to Never Pay For

| Service | Free Alternative |
|---|---|
| Vercel/Netlify hosting | Supabase free hosting or GitHub Pages |
| GitHub Pro | GitHub free (unlimited private repos + Actions) |
| Linear/Jira/Notion | GitHub Issues (you're one person) |
| Figma Pro | Figma free (one user) |
| Any second database | Supabase covers everything |
| Firebase | Already using Supabase — don't add Firebase |
| Sendgrid/Mailgun | Resend free (100 emails/day) |

### When to Upgrade Each Service

| Service | Upgrade trigger | Cost |
|---|---|---|
| Cursor | Hit free completions limit (~week 3) | $20/mo |
| Supabase | 500MB database OR 500K edge invocations/mo | $25/mo |
| OpenAI | Need more than $20/mo cap (beta testing) | Pay as you go |
| EAS | Need more than 30 builds/month | $30/mo |
| PostHog | 1M events/month (not until 1,000+ users) | $0 until then |
| Sentry | 5,000 errors/month (not until launch bugs) | Free tier long enough |

---

## Non-Goals

- Calorie-first UI or calorie-shaming language
- Before/after photo features
- Weight as headline dashboard metric
- Leaderboards or social comparison
- General fitness tracking
- Recipe library in v1
- CGM integration in v1
- Community/social features in v1
- Specific brand product endorsements
- LiDAR food scanning (iPhone Pro only, marginal benefit)
- All-in-one fitness platform positioning
- Storing meal photos beyond processing
- Offline sync for everything (queue-and-sync for key actions is enough in v1)

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-06 | Protein floor as hero metric | GLP-1 users need muscle preservation, not calorie counting |
| 2026-05-06 | Open Food Facts primary food API | Free, 3M+ products, no auth |
| 2026-05-06 | USDA FoodData Central as fallback | Government-verified accuracy |
| 2026-05-06 | Barcode free, photo Pro | Cost structure — barcode = $0, photo = OpenAI cost |
| 2026-05-06 | Injection cycle as core data model | Unique differentiator, no competitor models this |
| 2026-05-06 | 5 micronutrients only | Clinically relevant, avoids tracking anxiety |
| 2026-05-06 | Light mode first | Older demographic, clinical context |
| 2026-05-06 | Safety + dietary in onboarding | Liability protection + AI personalization |
| 2026-05-06 | Protein floor with safety bounds | Kidney disease, pregnancy, BMI >35 require different math |
| 2026-05-06 | First-launch consent flow mandatory | Legal positioning, audit trail |
| 2026-05-06 | Red-flag detection always free | Safety cannot be paywalled |
| 2026-05-06 | Data export + deletion in v1 | GDPR/CCPA legal requirement |
| 2026-05-06 | date-fns for all date math | Avoid JS Sunday/Monday landmines |
| 2026-05-06 | Vitest mandatory for safety code | Health app — "test later" is wrong default |
| 2026-05-06 | AI rate limiting via ai_invocations | Cost runaway prevention |
| 2026-05-06 | Content versioning table | Track which version users saw |
| 2026-05-06 | Provider schema in v1 migrations | Avoid painful future migrations |
| 2026-05-09 | App name: Glipra | Trademark cleared, dosepath.app auction won |
| 2026-05-09 | Offline mode queue-and-sync | Real users at restaurants, traveling, poor signal |
| 2026-05-09 | Voice + hybrid text logging | Nausea-day retention — the killer feature |
| 2026-05-09 | Discontinuation/maintenance mode | Doubles average user lifetime value |
| 2026-05-09 | Compounded GLP-1 support | Underserved population, significant market |
| 2026-05-09 | Pre-prescriber visit prep | Strongest single retention feature |
| 2026-05-09 | Linked accounts (couples) | Viral coefficient, common GLP-1 use pattern |
| 2026-05-09 | AI quality feedback loop | Prompts must improve with real data |
| 2026-05-09 | "Why?" transparency on AI | Trust = retention, unique to Glipra |
| 2026-05-09 | 200 seeded GLP-1-friendly foods | Cold start UX — first scan hits cache |
| 2026-05-09 | MFP/Shotsy/Apple Health import | Switching cost killer |
| 2026-05-09 | Readiness Score as Today hero | Forge Pulse-inspired UX, clinically grounded data |
| 2026-05-09 | Smart notification escalation | Engagement automation, reduces passive churn |
| 2026-05-09 | Cohort insights schema from day one | Compounding moat that requires early data |
| 2026-05-09 | Streak share image generator | Viral lever, zero ongoing cost |
| 2026-05-09 | Bad day compassion mode | Pharmacist signature feature, uniquely earned |
| 2026-05-09 | Spanish localization v1 | Hispanic population = large GLP-1 demographic |
| 2026-05-09 | A/B feature flags from day one | Data-driven optimization from launch |
| 2026-05-09 | Cost telemetry from day one | Margin visibility — know your gross margin |
| 2026-05-09 | Founder Lifetime ($149, first 500) | Upfront cash + evangelists + early distribution |
| 2026-05-09 | EAS Update for OTA | Health app needs fast hotfixes, not 7-day review |
| 2026-05-09 | RLS tests required pre-merge | Privacy leaks kill health apps |
| 2026-05-09 | Zod schemas at all API boundaries | Runtime type safety, not just TypeScript |
| 2026-05-09 | Subscription state machine v1 | Revenue protection from day one |
| 2026-05-09 | RevenueCat webhook idempotency | Prevent duplicate subscription events |
| 2026-05-09 | Texas LLC + insurance pre-launch | Non-negotiable liability shield |
| 2026-05-09 | Healthcare attorney before launch | State board + FTC + consent flow review |
| 2026-05-09 | 25 content cards before launch | Content = distribution = moat |
| 2026-05-16 | Scaffold from obytes/react-native-template-obytes | Exact stack match, saves 2-3 weeks of setup |
| 2026-05-16 | Use official `@openfoodfacts/openfoodfacts-nodejs` SDK | Replaces custom fetch client — typed, maintained, free |
| 2026-05-16 | Use `react-native-health-link` (unified) | One package replaces installing react-native-health + react-native-health-connect separately |
| 2026-05-16 | Use `pdf-lib` for PDFs, NOT React PDF | React PDF doesn't run in Deno edge functions; pdf-lib does |
| 2026-05-16 | Use `react-native-purchases-ui` for paywall | Pre-built paywall component saves a week of custom UI |
| 2026-05-16 | Supabase MCP for development | Claude writes/applies migrations directly, generates types, queries dev DB |
| 2026-05-16 | Study CalYo + simple-calorie-tracker for barcode patterns | Working reference implementations exist — don't reinvent |
| 2026-05-16 | Study RevenueCat/expo-web-billing-demo for IAP setup | Official cross-platform reference saves 2 days |
| 2026-05-16 | OpenAI Deno SDK via npm: imports in edge functions | npm:openai@4 works in Supabase edge functions (Deno) |
| 2026-05-16 | Generate food seed from USDA CSV via script | Hand-writing 200 SQL records wastes a week — script it |
| 2026-05-17 | Benchmark UX against MeAgain | MeAgain is #1, $400K/mo, 372K users — match polish, beat on pharmacist credential |
| 2026-05-17 | Add Journey Cards feature in v1 | MeAgain's signature engagement feature — milestones as shareable artifacts |
| 2026-05-17 | Add Shot Day Prep Checklist in v1 | Drives engagement on the highest-anxiety day, pharmacist-authored copy |
| 2026-05-17 | Add Medication Level Estimator chart in v1 | Half-life pharmacokinetics visualization — table stakes per MeAgain/Shotsy/Glapp |
| 2026-05-17 | Defer companion mascot to v2 | Bad mascot cheapens clinical brand; ship gorgeous protein widget instead |
| 2026-05-17 | Defer Ghost Photo (before/after) to v2 | Emotionally loaded for demographic; needs opt-in design |
| 2026-05-17 | Parallel agent dispatch for independent modules | Use specialized agents per domain (protein, injection-cycle, migrations) — each agent gets CLAUDE.md rules baked into prompt; safety-critical code reviewed before merge |
| 2026-05-17 | Two test runners coexist: Jest + Vitest | Jest for components (npm test); Vitest for pure utility/safety logic (pnpm test:utils). Run both before end of session per Rule 5 |
| 2026-05-17 | src/utils/protein.ts — implementation confirmed | Protein floor calculator with Devine IBW, activity multipliers, kidney cap, pregnancy floor, maintenance multiplier, ceiling/floor clamp. 41 Vitest tests, 100% branch coverage |
| 2026-05-17 | src/features/injection-cycle/calculator.ts — implementation confirmed | Phase mapping (injection_day/peak_suppression/adjustment/recovery_window/overdue) via differenceInCalendarDays. Supports custom intervals. 100% branch coverage |
| 2026-05-17 | supabase/migrations/003_ai_invocations.sql — created | ai_invocations table is append-only: users SELECT own rows, only service_role can INSERT. No UPDATE/DELETE by design — audit log integrity |
| 2026-05-17 | Add AI Coach edge function in v1 | MeAgain "Ask anything" parity, with strict pharmacist guardrails |
| 2026-05-17 | Microdosing + custom dosing prominent in UI | Schema supports it already — surface it as a differentiator |
| 2026-05-17 | AI Coach scoped to nutrition only — no medication questions | Open-ended "ask anything" with pharmacist branding = unacceptable liability |
| 2026-05-17 | Condition names removed from escalation card UI | Naming pancreatitis to a user = diagnosis; internal type codes only |
| 2026-05-17 | Protein floor modal: add "inaccurate inputs = inaccurate estimates" | Closes the gap if a user enters wrong weight/height |
| 2026-05-17 | Attorney must review AI coach prompts before enabling | Pharmacist credential + AI advice = heightened duty of care |
| 2026-05-17 | Employment contract review before writing code | Employer outside-activity clause can stop everything retroactively |
| 2026-05-17 | Water tracking added to v1 check-in | Clinically relevant (dehydration trigger), 30-min build, users expect it |
| 2026-05-17 | Fiber surfaced as visible metric on Today screen | Already in schema, matches MeAgain feature parity, constipation is top complaint |
| 2026-05-17 | Tier-1 disclaimers must be same visual weight as content | Not tiny gray footer — rendered at reading weight or it fails the "unavoidable" standard |
| 2026-05-17 | MFP/Shotsy import cut from v1 | Edge cases, not blocking; Apple Health import stays |
| 2026-05-17 | Mock AI strategy for development | Zero OpenAI cost during build — EXPO_PUBLIC_USE_MOCK_AI=true flag |
| 2026-05-17 | OpenAI hard budget cap $20/mo dev | Prevents runaway costs from bugs — set in OpenAI dashboard Day 1 |
| 2026-05-17 | Never upgrade free tiers until limit hit | Supabase free handles 200-300 users; EAS free is 30 builds/mo |
| 2026-05-17 | Use Expo Go for 90% of dev — EAS only when needed | EAS builds for RevenueCat, HealthKit, push notifications only |
| 2026-05-17 | Total 6-month build cost target: ~$370 | Break-even at 38 paying Pro subscribers |
| 2026-05-17 | **SCAFFOLD COMPLETE** — Obytes v9.0.0 scaffolded and hardened | 12-task plan executed; 46/46 tests green; all supply chain hardening applied |
| 2026-05-17 | Expo SDK 54 (not 52 as planned) | Obytes v9.0.0 targets SDK 54 — accepted upgrade; no downgrade |
| 2026-05-17 | Expo Router 6 (not v3 as planned) | Ships with SDK 54 template — accepted upgrade |
| 2026-05-17 | Standardized on pnpm 11.1.2 | Template declares `"packageManager": "pnpm@10.12.3"`; deleted package-lock.json |
| 2026-05-17 | NativeWind/tailwind-variants/tailwind-merge fully stripped | Obytes v9 ships with Tailwind; CLAUDE.md bans it; two-pass removal; button/input/select/text/progress-bar stubbed with StyleSheet.create() |
| 2026-05-17 | `src/theme/colors.ts` design tokens created | Full token system: brand, semantic, protein levels, injection phases, neutrals, backgrounds, text, borders, clinical safety, spacing, radius, shadows |
| 2026-05-17 | Dual test runners: Vitest 4.1.6 + jest-expo 54.0.16 | Vitest scoped to pure-TS only (`src/utils/**`, `src/features/**/calculator.ts`); jest-expo for everything else |
| 2026-05-17 | date-fns v4 metro fix | `resolver.unstable_enablePackageExports = true` in metro.config.js required for ESM-first package |
| 2026-05-17 | Supabase client uses Proxy-based lazy singleton | Defers env validation to first access; better testability; uses AsyncStorage for sessions |
| 2026-05-17 | `src/lib/mockAI.ts` created | All mock AI responses: MOCK_MEAL_RECOGNITION, MOCK_DAILY_GUIDANCE, MOCK_MEAL_TEXT_PARSE, MOCK_VOICE_PARSE |
| 2026-05-17 | `src/types/index.ts` domain types created | GLP1MedicationId (10 variants), InjectionPhase (5), SubscriptionTier, BiologicalSex, ActivityLevel, UserGoal, OnboardingStep (10), DisclaimerTier, RedFlagSeverity |
| 2026-05-17 | Inner `dosepath/CLAUDE.md` replaced | Obytes template file said "use NativeWind, use MMKV" — replaced with Glipra-aware override |
| 2026-05-17 | `pnpm install --ignore-scripts` hardened | Supply chain attack mitigation (ref: Sept 2025 Shai-Hulud/qix npm attacks) |
| 2026-05-17 | Audit baseline documented | 0 critical / 42 high / 26 moderate / 4 low — all dev-only transitive; see docs/security/AUDIT-BASELINE.md |
| 2026-05-17 | `coverage/` added to .gitignore | Prevent test artifacts from being committed to repo |
| 2026-05-17 | **AUTH SPEC COMPLETE** — design approved, ready for implementation | Spec at `.planning/specs/2026-05-17-auth-design.md` |
| 2026-05-17 | Auth screen flow: Welcome → Sign In / Sign Up (separate screens) | Matches ARCHITECTURE.md spec; replaces Obytes single `login.tsx` stub |
| 2026-05-17 | Auth architecture: Supabase-first, Zustand as reactive mirror | `onAuthStateChange` → Zustand store → UI; Supabase owns session storage via AsyncStorage |
| 2026-05-17 | Auth store: TokenType replaced with Supabase Session object | No more manual token juggling; automatic token refresh via Supabase client |
| 2026-05-17 | Apple Sign In: full implementation, availability-gated | `AppleAuthentication.isAvailableAsync()` hides button in Expo Go; full impl ready for EAS dev build |
| 2026-05-17 | Forgot + Reset password included in auth (Month 1) | 2 screens: forgot-password.tsx + reset-password.tsx; deep link: dosepath://reset-password |
| 2026-05-17 | storage.tsx: MMKV → AsyncStorage | MMKV is native module (blocked Expo Go); AsyncStorage is API-compatible replacement |
| 2026-05-17 | Welcome screen: Dark Hero visual direction | Deep navy (#111827) + radial blue glow, gradient CTA, ghost "Sign In" button |
| 2026-05-17 | Form screens: Clean Light visual direction | White/light background, brand blue focus ring + glow, gradient CTA button |
| 2026-05-17 | App identity updated: ObytesApp → Glipra | Scheme: dosepath, Bundle: com.dosepath.*, slug: dosepath in env.ts + app.config.ts |
| 2026-05-17 | Reanimated v4 for all auth animations | FadeInDown/FadeInUp staggered on mount; LinearTransition for error state layout shifts |
| 2026-05-17 | Password strength bar on sign-up screen | 3-segment visual: weak/medium/strong — red/orange/green, animated via LinearTransition |
| 2026-05-17 | Consent flow built | 3 screens (ToS, Medical Disclaimer, Privacy Policy) + AsyncStorage persistence + DisclaimerBanner component |
| 2026-05-17 | 10-step onboarding complete | All screens built + Zustand store + Supabase save on reveal |
| 2026-05-17 | Today screen skeleton complete | ReadinessScore + ProteinRing (SVG) + PhaseBadge + live injection cycle data |
| 2026-05-17 | readiness-calculator.ts safety-critical | 100% branch coverage via Vitest — injection phase + protein progress + check-in modifiers |
| 2026-05-17 | Month 1 complete | All 6 items done. Do not start Month 2 until this is confirmed. |
| 2026-05-17 | Supabase migrations 005-008 complete | daily_checkins (nausea/energy/water/red_flag), weight_logs (with ewma_weight_kg), content_cards (app content, service_role only writes), streaks (one row per user, UNIQUE on user_id) — all with RLS |
| 2026-05-17 | src/utils/ewma.ts — EWMA_ALPHA=0.1 | Exponential weighted moving average for body weight smoothing. applyEwma + computeEwmaSeries. 100% branch coverage |
| 2026-05-17 | src/features/streaks/calculator.ts — safety-critical | calculateStreaks with STREAK_THRESHOLD=0.80, date-fns gap detection, future-date exclusion, proteinFloorG=0 guard. 100% branch coverage |
| 2026-05-17 | 10 pharmacist-authored content cards | src/features/content-cards/data.ts — protein timing, hydration, nausea, phase-aware tips, fiber, EWMA explanation. tier 1 = clinical warning (orange), tier 2 = educational |
| 2026-05-17 | Food log screen built | src/app/(app)/log.tsx — manual entry form + barcode scanner stub (real camera needs expo-camera install) + today's entries list. Log tab added to nav. Barcode always free (never paywalled) |
| 2026-05-17 | Daily check-in screen built | src/app/(app)/check-in.tsx — emoji 1-5 sliders for nausea/energy + 8-button water tracker. Nausea/energy wired into calculateReadinessScore via useTodayData |
| 2026-05-17 | Weight tracking screen built | src/app/(app)/weight.tsx — SVG EWMA trend chart (react-native-svg only, no new deps), entry form, accessible from Settings. ewma_weight_kg stored on insert |
| 2026-05-17 | Today screen: streaks + content cards | StreakCard (🔥 current + longest), CardsCarousel (10 cards horizontal scroll) replace the Month 1 log-CTA placeholder. Render order: readiness → metrics row → check-in CTA → streak → cards |
| 2026-05-17 | Month 2 complete | Food logging, check-ins, weight tracking, EWMA, streaks, content cards all built. 102 Vitest tests, 100% coverage on safety-critical calculators |
| 2026-05-17 | expo-camera 17.0.10 installed | BarcodeScannerSheet stub replaced with real CameraView — useCameraPermissions, onBarcodeScanned, scan-frame overlay, dedup via scannedRef. Always free, never paywalled |
| 2026-05-17 | recognize-food edge function built | GPT-4o vision, Zod InputSchema + OutputSchema, safe fallback on parse failure, rate limit 50/day via ai_invocations, no PII in prompts. Client mock-gated via EXPO_PUBLIC_USE_MOCK_AI |
| 2026-05-17 | ai-coach edge function built | GPT-4o-mini, 10 msg/day rate limit, keyword blocklist fires BEFORE OpenAI (zero token cost on block), nutrition-only scope, ATTORNEY REVIEW REQUIRED comment above system prompt. Canned response for medication questions |
| 2026-05-17 | expo-image-picker deferred | Not yet installed — PhotoCaptureButton is a stub. Install with `pnpm expo install expo-image-picker` when ready to activate photo food recognition |
| 2026-05-17 | redFlagDetector.ts built — safety-critical | 4 symptom patterns: dehydration_risk, pain_pattern, vomiting_pattern, energy_pattern. 44 Vitest tests, 97.61% branch coverage. Pure function, no side effects, date-fns throughout |
| 2026-05-17 | EscalationCard component built | Rule 9 compliant — zero condition names in UI. Locked copy: "You've logged symptoms that may need medical attention. Please contact your prescriber today." DisclaimerBanner tier={1} required. 30-day check-in history feeds detectRedFlags() on every Today screen render |
| 2026-05-17 | medication-level/calculator.ts built — safety-critical | estimateLevel + generateLevelCurve + generateSteadyStateCurve. Half-lives for all 10 GLP1MedicationIds. Multi-dose steady-state accumulation (4 past cycles). 47 Vitest tests, 100% branch coverage |
| 2026-05-17 | Medication Level Estimator chart built | SVG line chart (react-native-svg only), steady-state curve, today marker, injection-point dots, auto-scaled Y axis. Pharmacist disclaimer (tier 1, locked copy). Accessible from Settings → /medication-level |
| 2026-05-17 | Prescriber Visit Prep built — Pro feature | generate-visit-prep edge function: GPT-4o-mini, 5/day rate limit, anonymous metrics only (no PII), ATTORNEY REVIEW gate on system prompt. generate-visit-pdf: pdf-lib A4 PDF (not React PDF — Deno-incompatible). expo-sharing deferred (pnpm expo install expo-sharing expo-file-system to activate) |
| 2026-05-17 | 193 Vitest tests — all safety-critical at 100% coverage | protein.ts, injection-cycle, readiness, ewma, streaks/calculator, redFlagDetector, medication-level/calculator all at 100% branch coverage |
| 2026-05-18 | First EAS Android dev build succeeded | Build ID e0626e84. react-native-health-link temporarily removed (causes minSdk conflict with androidx.health.connect — re-add for todo item 12). expo-haptics added. APK installs and connects to Metro via tunnel |
| 2026-05-18 | i18next lng Promise bug fixed | i18next v25 cannot accept Promise<string> as lng — crashes with codes.forEach undefined. Fix: init with lng:'en', then resolveStartupLanguage().then(i18n.changeLanguage) after init |
| 2026-05-18 | App running on device | Glipra dev build confirmed working on Android via EAS dev client + tunnel. Welcome screen renders. All native modules load correctly |
| 2026-05-18 | Supabase cloud project wired up | Switched from local Docker (unreachable from device) to cloud project cuxndkreewlcmijxlgyg.supabase.co. .env.development updated with cloud URL + publishable anon key |
| 2026-05-18 | 8 missing migration files reconstructed | Migrations 001–002 and 004–008 were applied to local Docker but never saved as .sql files. Reconstructed from API layer code and pushed to cloud: 001_initial_schema (profiles), 002_food_logs, 004_daily_checkins, 005_weight_logs, 006_content_cards, 007_streaks, 008_shot_prep |
| 2026-05-18 | Migration 011: protein_floor_g added to profiles | fetchTodayProfile selected this column but it was missing from the schema — Supabase returned an error causing Today screen to show "Complete your setup". Added via ALTER TABLE, wired into saveOnboardingProfile |
| 2026-05-18 | profiles upsert fixed — onConflict: 'user_id' | Default upsert used primary key (id) for conflict detection. Re-running onboarding threw duplicate key constraint. Fixed by passing { onConflict: 'user_id' } |
| 2026-05-18 | Email confirmation disabled for development | New Supabase cloud projects require email confirmation by default. signUp() returned no error but session was null — user walked through all 10 onboarding steps with no session. Disabled in Supabase Dashboard → Auth → Providers → Email → Confirm email OFF. signUpWithEmail() now returns needsEmailConfirmation flag so the UI can handle this gracefully if ever re-enabled |
| 2026-05-18 | reveal.tsx: getSession() → getUser() + direct setItem | getSession() reads from AsyncStorage which has race condition on Android — can return null before restore completes. Switched to getSession() with getUser() fallback (live API call). Also replaced setIsFirstTime(false) with direct await setItem('IS_FIRST_TIME', false) before router.replace to guarantee write completes before navigation |
| 2026-05-18 | (app)/_layout.tsx: hold on isFirstTime undefined | useIsFirstTime hook returned undefined ?? true = true while loading from AsyncStorage. (app)/_layout.tsx immediately redirected to onboarding before the false value could load. Fixed: return null while isFirstTime === undefined; only redirect when explicitly true |
| 2026-05-18 | Full onboarding → Today screen flow confirmed on device | Auth → Consent → 10-step Onboarding → Today screen working end-to-end on physical Android device. Protein floor (128g/day), medication, and goal render correctly from cloud Supabase |
| 2026-05-18 | database.ts regenerated from cloud schema | All 11 migrations reflected. profiles.protein_floor_g now typed as number | null in Row, Insert, and Update types |
| 2026-05-18 | EAS project recreated as @waliabdul/glipra | Old project was registered under slug "dosepath". New project ID: 046b4b41-452b-4b54-94ae-9ab38736222c. app.config.ts updated with new EAS_PROJECT_ID |
| 2026-05-18 | Second EAS Android dev build succeeded | Build ID 860c9b45. Bundle ID com.glipra.development, scheme glipra://. Replaces old com.dosepath.development APK |
| 2026-05-18 | Email provider disabled bug | New Supabase cloud project had email auth provider disabled entirely (separate from email confirmation toggle). Enabled in Dashboard → Auth → Providers → Email → Enable Email provider ON |
| 2026-05-18 | userId stored in onboarding Zustand store at sign-up | Root cause of all "Auth session missing" errors: Supabase client AsyncStorage restoration is async and races with reveal.tsx on new installs. Fix: signUpWithEmail() returns userId from data.user.id; sign-up.tsx immediately calls setOnboardingData({ userId }); reveal.tsx reads formData.userId as primary source — no session lookup needed |
| 2026-05-18 | signUpWithEmail returns userId | api.ts updated to return { error, needsEmailConfirmation, userId } so callers can capture the user ID without a separate session fetch |
| 2026-05-18 | Full flow confirmed on com.glipra.development | Sign up → Consent → 10-step Onboarding → Today screen working end-to-end on physical Android device with new Glipra APK and cloud Supabase |
| 2026-05-18 | RevenueCat subscription gating — code complete | Entitlement ID renamed dosepath_pro → glipra_pro across revenue-cat.ts, use-subscription.ts, pro-gate.tsx, paywall-screen.tsx. Product IDs: glipra_pro_monthly / glipra_pro_annual / glipra_founder_lifetime. EXPO_PUBLIC_REVENUECAT_IOS_KEY + EXPO_PUBLIC_REVENUECAT_ANDROID_KEY added to env schema and all .env files (values empty — user must add from RC dashboard once account created). ProGate wraps coach send UI. |
| 2026-05-18 | Visual polish pass — Warm & Clinical design direction | background: #FAF8F5 (warm cream), border: #E8E4DD (warm), shadows use warm-tinted black #2A1F0F at slightly stronger opacity for real depth. Settings screen fully rebuilt with StyleSheet API — was broken (Obytes NativeWind className silently ignored after NativeWind was stripped). "Style" placeholder tab removed from tab bar. Tab bar: active tint = colors.primary, custom background + border. Today screen: 30px 800-weight greeting + date line, Rx trust badge, section labels (TODAY'S METRICS / DAILY ACTIONS / PHARMACIST CONTENT), metrics cards with 3px colored top accent border, icon-circle rows for all action cards, pharmacist-designed algorithm trust badge on readiness card. |
| 2026-05-18 | Design direction revised: Clean Clinical replaces Warm & Clinical | After competitor research (ForgePulse, Shotsy, Pep, MeAgain, GLPeak, Glapp) and visual comparison, revised to Clean Clinical. New tokens: background #f7f9fc (cool blue-gray), brand #5b21b6 (deep violet-purple — more distinctive than generic blue), today/warning amber #d97706, success green #059669, white surfaces with purple-tinted shadow. Warm cream (#FAF8F5) dropped — clinical apps read better in cool neutrals, matches Apple Health / pharmacy app aesthetic. CLAUDE.md updated. |
| 2026-05-18 | PK curve contextual banner — home screen design locked | Phase banner is primary home screen element. Leads with clinical headline ("Appetite is most suppressed.") not just a label. Shows mini PK curve inline with RISING/PEAK/FADING zone labels. Amber today-marker dot on curve. Guidance pill with clinical instruction. Taps through to expanded view with full curve, 78% of peak level metric, drug selector chips (per-medication — semaglutide vs tirzepatide curves are different), and 4 insight cards (appetite, next injection, GI risk, steady-state). medication-level/calculator.ts already built — UI wiring is the remaining work. |
| 2026-05-18 | PK curve: unique curve per medication confirmed | semaglutide (Ozempic/Wegovy, t½ ~168h) and tirzepatide (Mounjaro/Zepbound, t½ ~120h) have meaningfully different curves. Each GLP1MedicationId gets its own curve. medication-level/calculator.ts HALF_LIVES map already handles this. |
| 2026-05-18 | Injection site rotation — feature design | Track injection sites via dot grid: zones = abdomen (4×3 grid), left arm (2×3), right arm (2×3), left thigh (2×3), right thigh (2×3). Each dot = one site. States: empty / used / recent (last injection) / next (AI-recommended next site). Recommendation logic: rotate systematically to prevent lipohypertrophy, minimum 1-week rest per site. Home screen shows compact rotation preview card with "Next: [zone]" badge. Taps to full rotation screen. Stores in new injection_sites table (user_id, zone, site_index, injected_at). |
| 2026-05-18 | Bottom nav icons: SVG line icons, never emoji | Nav bar uses inline SVG icons (22px, 1.8px stroke, rounded caps/joins, currentColor). Tabs: Home (house), Log (fork+knife), Inject (syringe), Trends (line chart). Active = brand purple #5b21b6, inactive = muted #cbd5e1. Emoji in nav is explicitly forbidden — inconsistent rendering across Android/iOS, looks cheap at this price point. |
| 2026-05-18 | Competitor research completed | Top 5 GLP-1 app competitors analyzed: Shotsy (free, injection tracking, site rotation, no AI), Pep (freemium, no cycle awareness, no AI), MeAgain ($10/mo, AI Capy, RDN-designed, closest competitor), GLPeak (free, AI Peako chatbot, dietitian-vetted), Glapp (free, best injection-cycle intelligence, no nutrition tracking). Key gap across ALL competitors: none offer clinical safety features, pharmacist-authored content, or prescriber visit prep. Glipra's moat is intact. |
| 2026-05-19 | PK Curve banner implemented | MedLevelBanner component added to Today screen. Shows mini SVG sparkline (steady-state concentration curve), phase-specific clinical headline (5 phases), and guidance pill. Amber dashed today-marker on curve. Taps to existing /medication-level screen. Renders only when useMedicationLevelCurve() returns a non-null curve (requires lastInjectionDate + doseMg in profile). No DisclaimerBanner on banner itself — existing medication-level screen has Tier-1. Files: src/components/today/med-level-banner.tsx, src/features/today/today-screen.tsx. |
| 2026-05-20 | PostHog + Sentry wired up | Both packages already installed; wrappers (error-tracking.ts, analytics.ts, posthog-provider.tsx) and initialization in _layout.tsx were pre-built. Added EXPO_PUBLIC_POSTHOG_API_KEY and EXPO_PUBLIC_SENTRY_DSN to env.ts Zod schema. Wired user identification: onAuthStateChange SIGNED_IN now calls analytics.identify(userId) + errorTracking.setUser(userId); SIGNED_OUT calls analytics.reset() + errorTracking.clearUser(). Keys are placeholder-ready in all .env files — fill in from app.posthog.com and sentry.io when ready. |
| 2026-05-20 | RevenueCat fully configured | RC dashboard setup complete: Android app created (package: com.glipra), Android SDK key goog_PXIgbDoDUnkzNbEVuSvFOffgeVR saved to .env.development and eas.json development env. Test Store products: monthly / yearly / lifetime. Entitlement identifier: GLiPra Pro (3 products attached). Offering: default (3 packages). Product ID constants in paywall-screen.tsx updated to monthly/yearly/lifetime. Entitlement ID updated to GLiPra Pro in revenue-cat.ts, use-subscription.ts, and pro-gate.tsx. iOS RC setup deferred — requires Apple Developer account ($99/yr) + P8 key from App Store Connect. |
| 2026-05-20 | EAS Android dev build queued with all env vars | Build ID aeebf5ea-6b6d-4071-a54f-6bebdbddf37e. Root cause of missing vars: EAS cloud builds cannot read local .env files. Fix: added all EXPO_PUBLIC_* keys (Supabase URL + anon key, USE_MOCK_AI, RC Android key) to eas.json development profile env section. These are all client-side public keys — safe to commit. iOS RC key left empty until Apple Developer account is set up. |
| 2026-05-19 | Injection site rotation feature shipped (SVG approach — SUPERSEDED 2026-05-23) | ~~Full greenfield feature: injection_logs Supabase table (010_injection_logs.sql) with RLS; site zones = abdomen (4×3), arm_left/arm_right, thigh_left/thigh_right; SVG body silhouette with tappable dot grid.~~ This approach was scrapped — dots rendered in chest area regardless of coordinate fixes (SVG body silhouette geometry issue). See 2026-05-23 entry for replacement. Migration 010 superseded by 013. SiteRotationMap component deleted. |
| 2026-05-20 | i18n language switching: restart approach abandoned | Original Obytes template pattern restarted the app on language change (NativeModules.DevSettings.reload()). This silently fails in standalone EAS builds (no DevSettings module). Replaced with RNRestart — also unreliable. Root fix: react-i18next i18n.changeLanguage() already triggers re-render of all useTranslation() consumers in-place. No restart is needed or correct. changeLanguage() in src/lib/i18n/utils.tsx now calls only i18n.changeLanguage(lang) + translate.cache.clear?(). Language switch is instant and reliable. |
| 2026-05-20 | Today screen fully translated | All hardcoded strings in today-screen.tsx, streak-card.tsx, content-card.tsx, phase-badge.tsx, and med-level-banner.tsx replaced with useTranslation() calls. Three new i18n namespaces added: tabs (tab bar labels), content_card (card type labels + disclaimer), med_banner (phase headlines + guidance pills). Tab bar labels (Today/Log/Settings ↔ Hoy/Registro/Ajustes) now switch in-place via useTranslation() in TabLayout. phase-badge.tsx reuses existing medication.* keys instead of duplicating phase labels. |
| 2026-05-20 | Onboarding language selection screen added | New file: src/app/onboarding/language.tsx. Shows English and Español options with hardcoded labels (not i18n keys — user has not chosen a language yet). Radio button style cards, Continue button calls changeLanguage() + setItem(LOCAL) then navigates to /onboarding/medication. First-time redirect in (app)/_layout.tsx changed from /onboarding/medication → /onboarding/language. New users now choose language before starting the 10-step onboarding flow. |
| 2026-05-20 | Arabic localization removed | ar.json kept as empty shell but Arabic removed from SUPPORTED_LANGUAGES (['en', 'es'] only), language picker, and all translation file settings sections. No Arabic UI strings rendered anywhere. Removed to reduce maintenance surface — Arabic right-to-left support would need dedicated QA pass before re-adding. |
| 2026-05-20 | Settings language picker Option rows styled | src/components/ui/select.tsx Option component was an unstyled bare Pressable — no padding, no separators, no pressed state. Added optionStyles StyleSheet using themeColors: paddingHorizontal: 20, paddingVertical: 18, hairline bottom border, pressed state uses primaryLight background, selected text uses primary color, Check SVG gets stroke={themeColors.primary}. |
| 2026-05-20 | Tab bar restructure — Injection Sites promoted, Log→Nutrition | Injection Site Tracker promoted from Settings row to 4th visible tab (name: "Sites", icon: Syringe SVG). "Log" tab renamed "Nutrition" (en) / "Nutrición" (es). Tab order: Today → Nutrition → Sites → Settings. Injection Site Tracker row removed from Settings. Back button removed from injection-sites.tsx (no longer a pushed screen). New syringe icon: src/components/ui/icons/syringe.tsx. |
| 2026-05-20 | MedLevelBanner moved to Daily Actions, always renders | Moved from above readiness card (before metrics) to Daily Actions section (between check-in card and streak card). Now renders a fallback "Log your injection to view your curve →" card when no injection/curve data exists, instead of returning null. Ensures medication level is always discoverable from Today screen. |
| 2026-05-20 | Weight integrated into check-in; removed from Settings | Added optional weight input card to check-in screen (/check-in). When submitted with a value, calls useInsertWeightLog() in parallel with check-in mutation. Pre-fills placeholder with last logged weight from useWeightLogs(). Weight Tracking row removed from Settings HEALTH section. Medication Level row also removed from Settings (accessible via MedLevelBanner on Today). Settings HEALTH now: Prescriber Visit Prep + Health Import only. |
| 2026-05-20 | Unit preference system — kg/lbs and cm/imperial toggles | New file: src/lib/unit-preference.ts — WeightUnit ('kg'|'lbs') and HeightUnit ('metric'|'imperial') types, conversion helpers (kgToLbs, lbsToKg, cmToFtIn, ftInToCm, formatWeight), and useWeightUnit()/useHeightUnit() hooks backed by AsyncStorage (keys: WEIGHT_UNIT, HEIGHT_UNIT). All clinical data stays stored in metric internally; conversion happens only at display/input layer — no DB migration needed. UnitToggle component (src/components/ui/unit-toggle.tsx) is a segmented 2-button toggle reused across all weight/height fields. Weight toggles wired into: onboarding/body.tsx (weight + height), (app)/weight.tsx (header toggle + all display sites), components/weight/weight-entry-form.tsx (weightUnit prop, lbs→kg on submit), (app)/check-in.tsx (read-only, respects global preference, lbs→kg on submit). |
| 2026-05-20 | Injection day date input: YYYY-MM-DD → MM/DD/YYYY auto-format | Replaced confusing ISO text entry in onboarding/injection-day.tsx with an auto-formatter. As user types digits, slashes are inserted automatically (e.g. typing 05132025 → "05/13/2025"). Two new helpers: formatDateInput(raw) strips non-digits and re-inserts slashes; parseMdyToIso(mdy) converts MM/DD/YYYY to YYYY-MM-DD ISO for storage, returns null if incomplete or invalid. canProceed now checks parseMdyToIso() !== null. ISO_DATE_REGEX and isValidISODate() removed. Placeholder changed to "MM/DD/YYYY". |
| 2026-05-20 | Bug fix: Protein Today tile always showed 0g | Two bugs. (1) src/features/today/hooks.ts line 44 had a Month-1 scaffold placeholder `const proteinConsumedG = 0` that was never wired to the food log system. Fixed by replacing with `const { protein: proteinConsumedG } = useDailyMacros()` — the hook already existed and was used correctly on the Nutrition screen. Readiness score and streak logic (which derive from proteinProgress) now also reflect real logged data. (2) src/features/food-log/api.ts fetchTodayFoodLogs was appending T00:00:00.000Z to a local date string, treating local midnight as UTC midnight. For US users (UTC-5 to UTC-8) this silently excluded evening entries. Fixed using date-fns startOfDay/endOfDay on a `new Date(year, month-1, day)` (local midnight) then toISOString() for the query range. |
| 2026-05-20 | Medication Level chart: 7D / 30D view range selector | Added a segmented [7D][30D] toggle to the Medication Level Estimator screen, positioned right-aligned below the "CONCENTRATION CURVE" label. 7D shows 3 days past + 7 days forward (current cycle detail, x-labels every 2 days). 30D shows 30 days past + 14 days forward (default, matches previous fixed window, x-labels every 7 days). generateSteadyStateCurve in src/features/medication-level/calculator.ts extended with optional pastDays 7th parameter; injection dose history is dynamically sized to cover the full window (max(4, ceil(pastDays/interval))+1 doses) so wider views show correct pharmacokinetic accumulation, not a flat zero. New reusable component: src/components/ui/segmented-control.tsx — N-option variant of UnitToggle with onSelect(value) callback and auto-sized buttons (no flex:1). LevelChart gained labelIntervalDays prop (default 7) to control x-axis date label density. |
| 2026-05-23 | SVG injection site tracker scrapped — replaced with form-based flow | Two full iterations of an SVG body silhouette with tappable dot grid failed QA: injection dots rendered in the chest area of the body diagram regardless of coordinate fixes. Root cause: the torso SVG spans y=65 (shoulders) to y=237 (hips), so dots at y=97–120 land in the upper-chest region — visually wrong for a pharmacist-branded app. Decision: abandon SVG body map entirely. Replaced with a standard form-based logging UX (matches how insulin/GLP-1 logging apps used by real patients work). Clinical content is unchanged — the rotation algorithm, 7-day rest rule, and 6 stomach sites all carry over. |
| 2026-05-23 | Injection site type model simplified: SiteZone → SiteCode | Removed the (zone, position) tuple model. src/types/index.ts: SiteZone type deleted; replaced with SiteCode union of 6 literal values: stomach_upper_left, stomach_upper_mid, stomach_upper_right, stomach_lower_left, stomach_lower_mid, stomach_lower_right. Thighs removed from UI (pharmacist decision: abdomen is the primary GLP-1 site; thighs are secondary and rarely used by this patient population). SITE_LABELS, SITE_OPTIONS, SITE_ROTATION_ORDER, REST_DAYS constants all rebuilt in src/features/injection-sites/constants.ts. Serpentine rotation order: upper-left → upper-mid → upper-right → lower-right → lower-mid → lower-left. |
| 2026-05-23 | Migration 013_create_injection_logs.sql — canonical injection_logs schema | Previous code queried an injection_logs table that had no committed migration (table existed ad-hoc in dev cloud, never versioned). Migration 010_injection_logs.sql (from the SVG feature) was superseded. New migration 013 is the authoritative schema: id (UUID PK), user_id (FK → auth.users CASCADE), injected_at (TIMESTAMPTZ), site_code (TEXT, CHECK constraint against 6 stomach values), medication_name (TEXT), pain_level (INT, CHECK 0–10), notes (TEXT nullable), created_at. Index on (user_id, injected_at DESC). RLS enabled with 4 policies (SELECT/INSERT/UPDATE/DELETE). Applied to cloud Supabase with npx supabase db push; src/types/database.ts regenerated. |
| 2026-05-23 | injection-sites feature layer rebuilt for new schema | src/features/injection-sites/types.ts: local InjectionLog domain type (decoupled from database.ts during migration). api.ts: InjectionLogInput interface (siteCode, medicationName, painLevel, notes?, injectedAt) + insertInjectionLog() + fetchRecentInjectionLogs(). hooks.ts: useInjectionLogs() → {logs, isLoading}; useInjectionSiteRecommendation() → {recommendation: SiteCode, allResting: boolean, isLoading}; useLogInjectionSite() mutation with cache invalidation. computeNextSite() in calculator.ts returns RotationState {recommendation: SiteCode, allResting: boolean} — never null. allResting=true when every site was used within REST_DAYS (7); UI shows a warning but still recommends least-recently-used site so user can proceed. 11 Vitest test cases; 100% statement coverage, 99.23% branch coverage (exceeds Rule 4 90% gate). |
| 2026-05-23 | Add Shot screen (src/app/(app)/add-shot.tsx) | New form screen with: Cancel \| Add Shot \| Save header; TIME TAKEN section (Date row + Time row, each opens native @react-native-community/datetimepicker — iOS spinner mode, Android default modal); DETAILS section (Medication Name Select dropdown pre-filled from profile.medicationId, Injection Site Select dropdown, PainLevelSlider 0–10); SHOT NOTES textarea (500 char max, multiline); Tier 2 DisclaimerBanner (Rule 8). combineDateAndTime() uses date-fns setHours/setMinutes (Rule 6 compliant — no raw Date arithmetic). Site dropdown auto-fills from recommendation gated on !recLoading to prevent flash. Medication auto-fills from profile. canSave = !!medication && !!siteCode && !isPending. Registered in (app)/_layout.tsx as href:null hidden route. @react-native-community/datetimepicker added to package.json and app.config.ts plugins — requires new EAS dev build. |
| 2026-05-23 | PainLevelSlider component (src/components/injection-sites/pain-level-slider.tsx) | New component: 11 pressable dots (0–10), active dot filled with colors.primary (size 12px), inactive dots outlined (size 9px). Compact horizontal layout: label left, dots middle, numeric value right. accessibilityRole="adjustable" with accessibilityValue {min:0, max:10, now:value}. Adapted from src/components/check-in/rating-slider.tsx pattern but extended to 11 values. |
| 2026-05-23 | Injection Sites tab screen redesigned — list dashboard | src/app/(app)/injection-sites.tsx rewritten. Removed SVG body map, dot grid, zone selection, SiteRotationMap component (deleted). New layout: page header + Tier 2 DisclaimerBanner + Active Rotation card (shows SITE_LABELS[recommendation], allResting warning if applicable, + Add Shot button → router.push('/add-shot')) + Recent Shots list (up to 10 logs, each showing site name, date/time, medication, PAIN badge) + Rotation Tips card (4 pharmacist-authored tips). src/components/injection-sites/site-rotation-map.tsx deleted. |
| 2026-05-23 | Select component: disabled option support for section headers | src/components/ui/select.tsx: OptionType extended with optional disabled?: boolean field. When true, item renders as a non-pressable section header (uppercase, 11px, primary color, letterSpacing:1) instead of a tappable Option row. Height calculation weighted (headers ~36px vs rows ~70px). textValue computation excludes disabled items from label resolution so headers never show as the selected value in the trigger button. Used immediately in add-shot.tsx: "Active Rotation" non-selectable header prepended to injection site dropdown options when recommendation is available. Replaces the external hint text that previously appeared above the Select component. |
| 2026-05-23 | EAS dev build queued — new native module (@react-native-community/datetimepicker) | Native picker module requires a new EAS build to function on device. pnpm expo install added it to package.json; plugin added manually to app.config.ts plugins array (expo install exits 1 on dynamic app.config.ts, plugin must be manually added). Build triggered from correct project directory: cd C:\Users\walia\OneDrive\Desktop\DosePath\dosepath && eas build --profile development --platform android. Previous Oops navigation error was Metro cache — resolved by pnpm start --tunnel --clear. |
| 2026-05-23 | CLAUDE.md split into CLAUDE.md (lean ~270 lines) + PROGRESS.md | CLAUDE.md was ~579 lines; build history made it expensive to load every session. CLAUDE.md keeps rules, stack, conventions, open blockers, session prompts. PROGRESS.md holds Month 1/2/3 build history + milestone checklist with status badges. |
| 2026-05-23 | Em dashes removed from all user-facing copy | `—` replaced with `:` or removed across en.json (11 strings), es.json, ar.json, paywall-screen.tsx. "No em dashes in user-facing copy" added to CLAUDE.md Never Do list. |
| 2026-05-23 | migration 014_add_dosage_strength.sql — `dosage_strength TEXT` added to injection_logs | Nullable column; existing rows unaffected. Display string (e.g. "0.5 mg"). Applied to cloud Supabase. |
| 2026-05-23 | Add Shot screen: Dosage Strength dropdown | DOSAGE_OPTIONS_BY_MEDICATION record maps each medication display name to its FDA-approved dose rungs plus common compounded ranges. Resets to '' when medication changes. Select disabled until medication chosen. Passed as dosageStrength?: string in InjectionLogInput. |
| 2026-05-23 | Add Shot date/time fields: display-only until EAS build 93fc4e27 installed | @react-native-community/datetimepicker crashes at JS module-load time when native code is absent — Expo Router never registers the route, causing "Oops!" navigation error. Fields show current date/time as read-only text. TODO: restore DateTimePicker import after build 93fc4e27 is installed on device. |
| 2026-05-23 | 185 uncommitted files committed in one batch | All feature work since 2026-05-17 scaffold (commit fdd2086) was uncommitted. Stray files (Configure, Get, Manifest, Run, Task, Unit, eas), .planning/, .superpowers/, .claude/, docs/superpowers/ added to .gitignore. EAS build 93fc4e27 queued from this commit — first build with datetimepicker in native layer. |
| 2026-05-23 | Journey Cards: all 4 missing unlock triggers wired | `first_checkin` in check-in/hooks.ts onSuccess (idempotent). `weight_logged_10x` in weight/hooks.ts onSuccess after fetchWeightLogCount >= 10. `injection_day_warrior` in injection-sites/hooks.ts — useLogInjectionSite(lastInjectionDate?) with date-slice comparison against injectedAt. `coach_conversation` in ai-coach/hooks.ts after first successful assistant reply. All fire-and-forget with silent catch. |
| 2026-05-23 | Journey Cards: MilestoneToast component | src/components/ui/milestone-toast.tsx — position:'absolute', zIndex:1000, brand-purple 4px left border, shadows.lg, auto-dismisses 3s via useEffect setTimeout, accessibilityRole="alert". Wired into TodayScreen via useCheckAndUnlockMilestones onUnlock callback. Shows first milestone when multiple unlock simultaneously. |
| 2026-05-23 | Journey Cards: Share button on MilestoneCard | React Native Share.share({ message: milestone.shareText }). No Skia/image generation needed at this stage. Pill button: primaryLight background, primary text, radius.full. Native share sheet, zero extra dependencies. |
| 2026-05-23 | useCheckAndUnlockMilestones: onUnlock callback parameter added | `onUnlock?: (ids: MilestoneId[]) => void` called after Promise.all resolves and cache is invalidated. Decouples unlock logic from toast display — Today screen owns UI state, hook owns business logic. |
| 2026-05-24 | Concentration curve wired to real injection_logs data | useMedicationLevelCurve (src/features/medication-level/hooks.ts) completely re-sourced: lastInjectionDate and doseMg now come from injection_logs table (via fetchRecentInjectionLogs) instead of profiles table. profiles.dose_mg and injection_frequency were never populated post-onboarding so the curve was always null. parseDoseMg() parses "0.5 mg" string from dosage_strength column to float. deriveIntervalDays() computes gap between last two distinct injection dates (date-fns, Rule 6). insertInjectionLog() now also upserts profiles.last_injection_date (guarded: only if new shot is more recent). useLogInjectionSite onSuccess invalidates both injection-logs-curve and today-profile query keys so curve and phase banner refresh immediately after logging. |
| 2026-05-24 | Concentration curve: 30D window anchored to actual injection history | Bug: 30D view always started today − 30 days regardless of when the first real shot was logged, causing 2 synthetic pre-history peaks to appear before the user's first injection. Fix in medication-level.tsx displayCurve useMemo: compute effectivePastDays = min(config.pastDays, daysSinceOldestInjection + 7) using date-fns differenceInCalendarDays (Rule 6). The +7 adds visual breathing room before the first dot. Window expands naturally as history grows but never exceeds the toggle cap (30D). Users with no logs fall back to config.pastDays unchanged. |
| 2026-05-24 | Concentration curve: interval bug + dot placement fix | Bug: two shots logged on the same calendar day (May 23 test shots) caused deriveIntervalDays to see gap=0, return 1 (daily), and render a wrong curve shape with "daily" badge. Fix: deduplicate injection_logs by calendar date (YYYY-MM-DD) before computing gap — uniqueDates[0] vs uniqueDates[1] now correctly yields weekly gap. Dot placement also fixed: LevelChart previously placed dots at dayOffset % injectionIntervalDays === 0 (synthetic, anchored to today) — shots with dayOffset not divisible by interval got no dot. Replaced with injectionDates?: string[] prop; dots now placed at actual logged dates. medication-level.tsx updated to use lastInjectionDate and injectionDates from hook (not profile field). MedicationLevelCurveResult interface now exports lastInjectionDate and injectionDates fields. |
| 2026-05-24 | DateTimePicker restored in Add Shot screen | EAS build 93fc4e27 confirmed on device and native module functional. Removed display-only stub from add-shot.tsx. Date and Time rows are now `Pressable` — tapping opens Android calendar dialog (date) and time spinner (time). `onDateChange` / `onTimeChange` call `setShowDatePicker/TimePicker(false)` then update state (works on both platforms). `maximumDate={new Date()}` prevents future-date logging. DateTimePicker renders conditionally (`{showDatePicker && <DateTimePicker ... />}`). combineDateAndTime() unchanged — date-fns Rule 6 compliant. Open blocker removed from CLAUDE.md. |
| 2026-05-24 | Edit / Delete recent shots | Recent Shots list made fully editable. api.ts: added `updateInjectionLog()` (PATCH with RLS double-guard + profiles.last_injection_date sync) and `deleteInjectionLog()` (hard DELETE). hooks.ts: added `useUpdateInjectionSite()` and `useDeleteInjectionSite()` mutations — both invalidate injection-logs, injection-logs-curve, and today-profile query keys on success so the curve and phase banner refresh immediately. injection-sites.tsx: ShotRow converted from `<View>` to `<Pressable>` with `router.push('/edit-shot?id=')` and chevron indicator. New screen `src/app/(app)/edit-shot.tsx` mirrors add-shot.tsx exactly: date/time pickers pre-filled via `parseISO(log.injected_at)`, all fields pre-populated via `useEffect` once the log arrives from React Query cache (no extra network call), Save calls `useUpdateInjectionSite`, Delete button shows `Alert.alert('Delete Shot', 'This cannot be undone.')` confirmation before calling `useDeleteInjectionSite`. "Shot not found" guard renders a friendly fallback if the log ID is invalid. Registered in _layout.tsx as `href: null` hidden route. |
| 2026-05-24 | Injection Sites tab renamed "Log GLP-1" | `tabs.sites` translation key updated in both en.json and es.json from "Sites"/"Sitios" → "Log GLP-1" (same string in both locales — "Log GLP-1" reads correctly to bilingual users). No code change needed; label flows through `t('tabs.sites')` in _layout.tsx. |
| 2026-05-24 | AI Nutrition Coach promoted to 5th bottom-nav tab | Coach was a hidden route (`href:null`) accessible only via a CTA card on Today, so the pharmacist-credentialed AI moat (Glipra's deepest differentiator) was invisible most of the time. Promoted to permanent 4th-position tab. Final order: Today \| Nutrition \| Log GLP-1 \| Coach \| Settings. Pro-gating unchanged — free users still see the welcome message and ProGate teaser card under the input (Spotify-Search-style conversion surface). New icon `src/components/ui/icons/chat-bubble.tsx` (24×24, stroke-based, speech bubble + 3 dots, matches syringe icon style). Coach screen header simplified: back button removed (tab IS the root), title block left-aligned. Today screen Coach CTA card + `ctaCardCoach` / `actionIconCircleCoach` styles deleted. New translation key `tabs.coach: "Coach"` added to en.json and es.json. No new infrastructure — leverages existing ai-coach edge function, useAiCoach hook, ProGate wrapper, rate limiting, and keyword blocklist (Rule 10). |
| 2026-05-24 | Barcode scanner accuracy: three-layer fix | Wrong nutrition values from Open Food Facts (crowdsourced, varies by product) were silently entering the food log with no way for users to correct them. Three layers added simultaneously: (1) Editable result form — barcode result card replaced with TextInput fields (protein/fiber/calories) so users can fix values before confirming; protein field highlighted in brand purple; amber warning shown when proteinG=0 and no user correction. (2) USDA FoodData Central secondary lookup — if OFF returns protein=0 AND calories=null, falls back to USDA FDC free API (nutrient IDs: protein=1003, fiber=1079, calories=1008); only queried for EAN starting with '0' (US UPC-A products where USDA coverage is high); `EXPO_PUBLIC_USDA_API_KEY=DEMO_KEY` in dev. (3) Per-EAN correction memory — when user edits any field before confirming, the corrected values are saved to `barcode_corrections` Supabase table; future scans of the same EAN load the correction first (source badge shows green "Your verified data"). All Zod-validated — OFF/USDA parse failure returns null, never throws. Rule 3 compliant. |
| 2026-05-24 | supabase/migrations/011_barcode_corrections.sql | New table: `barcode_corrections` (id, user_id, barcode_ean, product_name, protein_g, fiber_g, calories_kcal, created_at, updated_at). Unique constraint on (user_id, barcode_ean). RLS: SELECT/INSERT/UPDATE per user. Index on (user_id, barcode_ean). Upsert on conflict: `ON CONFLICT (user_id, barcode_ean) DO UPDATE`. Paired with `src/features/food-log/barcode-corrections.ts` — `fetchBarcodeCorrection` + `saveBarcodeCorrection`. React Query hooks: `useBarcodeCorrectionLookup(ean)` (staleTime: Infinity) + `useSaveBarcodeCorrection()` (invalidates cache on success). Both added to `src/features/food-log/hooks.ts`. |
| 2026-05-24 | barcode-lookup.ts: dataSource field + USDA fallback | `BarcodeProduct` interface extended with `dataSource: 'open_food_facts' \| 'usda' \| 'user_corrected'`. Refactored to `lookupBarcodeOFF()` (extracted) + `lookupBarcodeUSDA()` (new, EAN-0 gated). `lookupBarcode()` cascade: OFF first; if OFF has protein=0 AND calories=null, try USDA; return best result. Source label in scanner UI: "Open Food Facts" / "USDA FoodData Central" / green checkmark "Your verified data". `src/lib/usdaFoodData.ts` referenced via `process.env.EXPO_PUBLIC_USDA_API_KEY`. |
| 2026-05-24 | calculator.test.ts: vitest import removed | `src/features/injection-sites/calculator.test.ts` was importing `describe, expect, it` from `vitest` — causes "Vitest cannot be imported in a CommonJS module" under Jest. Removed the import; Jest injects all three as globals so no other change needed. Test suite now passes under jest-expo (was the only new suite we introduced that failed). 77 total tests pass, 7 pre-existing vitest-in-Jest failures unchanged (ewma, protein, injection-cycle, medication-level, safety, streaks, readiness — unrelated to this session's code). |
| 2026-05-24 | calculator.test.ts: vitest import re-added (runner ownership note) | Both Jest and Vitest globs claim `src/features/injection-sites/calculator.test.ts`. Removing the vitest import lets Jest run it but breaks Vitest (which has no `globals: true`); re-adding it lets Vitest run it but Jest fails the suite. Currently re-added — file lives under `src/features/**/calculator.test.ts` which is Vitest's authoritative include glob per `vitest.config.ts`. Vitest = 226 pass; Jest = 66 pass (9 vitest files failing under Jest, all pre-existing). Future fix: add a Jest `testPathIgnorePatterns` entry for the Vitest-owned glob so the two runners stop fighting. |
| 2026-05-24 | Tab bar: equal-width distribution fix | Added `tabBarItemStyle: { flex: 1 }` to `<Tabs screenOptions>` in `(app)/_layout.tsx` so all 6 visible tabs divide the bar width equally. Root cause of the right-side gap: the "style" placeholder tab used `tabBarButton: () => null` which hides the button visually but leaves a 7th flex slot in the layout. Fixed by changing it to `href: null` (same pattern as all other hidden screens), which removes the slot entirely. |
| 2026-05-24 | Nutrition tab icon changed to Camera | Replaced `PlusCircle` with a new `Camera` icon (`src/components/ui/icons/camera.tsx`) in the Nutrition tab to signal AI photo scanning at a glance. Icon follows the same SVG pattern as all nav icons: 24×24 viewBox, 1.8px stroke, `strokeLinecap="round"`, `currentColor`. Barrel-exported from `src/components/ui/icons/index.tsx`. Import alias in `_layout.tsx` changed from `PlusCircle as LogIcon` to `Camera as LogIcon`. |
| 2026-05-24 | Photo food log: user comment for AI accuracy | Added an optional comment step between camera capture and AI analysis so GPT-4o receives richer context (portion size, preparation, additions) on the first call — no second round-trip needed. **Flow:** `PhotoCaptureButton.onImageSelected` now sets `pendingCapture` state in `log.tsx` instead of calling `recognize()` directly. New `PhotoCommentSheet` (`src/components/log/photo-comment-sheet.tsx`) slides up with an auto-focused multiline `TextInput` (300-char max, Zod-enforced server-side) and Skip / Analyze buttons. On Analyze, `handleAnalyze(comment?)` calls `recognize(base64, mimeType, comment)` and clears `pendingCapture`. **Data path:** `userComment?` threaded through `usePhotoFoodLog.recognize()` → `usePhotoFoodRecognition.recognize()` → `supabase.functions.invoke('recognize-food')` body. **Edge function:** `InputSchema` extended with `userComment: z.string().max(300).optional()`; GPT-4o user message prepends `"The user noted: '…'"` when present, unchanged when absent. Rule 2 enforced: comment describes food only (never user identity); 300-char cap guards prompt injection. Mock AI path unchanged — comment silently ignored when `EXPO_PUBLIC_USE_MOCK_AI=true`. No DB migration — comment is ephemeral (sent to AI, discarded). EN + ES translation keys added under `log.photo_comment_*`. |
| 2026-05-24 | expo-linear-gradient removed from PhotoCaptureButton (Expo Go incompatible) | `expo-linear-gradient@15.0.8` was installed and used for the violet→indigo gradient on the AI hero card. On Android Expo Go it crashed immediately with `IllegalViewOperationException` — the native `ExpoLinearGradient` view manager is not registered in the Expo Go APK. Reverted to a solid `backgroundColor: '#4C1D95'` (the darker end of the gradient) on the card `View`. Visual difference is negligible since both gradient stops are near-identical dark violets. `expo-linear-gradient` remains in `package.json` — re-enable the gradient when doing the first EAS dev build (native modules are compiled in then). |
| 2026-05-24 | Nutrition Log screen premium redesign | The log screen was a generic form — the AI Photo feature (Glipra's primary Pro conversion surface) was buried as a 3rd mode tab indistinguishable from Barcode. Redesigned into a dashboard-first, premium experience. **New components:** `src/components/log/nutrition-header-ring.tsx` — 44×44px compact donut ring (same Circle-arc technique as `ProteinRing`) showing consumed/floor protein in the screen header; `src/components/log/meal-chip-row.tsx` — horizontal ScrollView with Breakfast/Lunch/Dinner/Snack `Pressable` chips for client-side time-window filtering (Breakfast 5–11am, Lunch 11am–3pm, Dinner 3–9pm, Snack = rest; no DB column, no migration). **PhotoCaptureButton redesign** (`src/components/log/photo-capture-button.tsx`): full-width hero card with `expo-linear-gradient` violet→indigo gradient (`['#4C1D95','#312E81']`); "✦ AI POWERED" amber pill + "👑 PRO" chip row; camera emoji with 4 sparkle dots; "Snap your meal" / "AI estimates macros instantly" copy; white full-width CTA pill "Open Camera →"; loading state replaces CTA with `ActivityIndicator` + "Analyzing…"; ProGate logic moved inline — free users tap the card and get the RevenueCat paywall, Pro users get the camera. Props interface unchanged. `expo-linear-gradient@15.0.8` added via `pnpm expo install`. **log.tsx restructure**: `LogMode` reduced to `'manual' \| 'barcode'` (Photo removed from toggle); `getMealSlot(loggedAt)` pure helper at module scope; `selectedMeal: MealSlot \| null` state added; `proteinFloorG` from `useTodayData()`; header is now a `flexDirection:'row'` layout with title+subtitle column + `NutritionHeaderRing`; layout order: header → DailyMacroCard → MealChipRow → PhotoCaptureButton (always visible) → 2-tab toggle → ManualEntryForm → section header (label reflects active chip) → FoodLogRow list; `FlatList data` uses `filteredLogs` (selectedMeal filter applied); filtered empty state shown separately from no-logs-at-all empty state. **ManualEntryForm button active state**: `hasProtein` computed as `!isNaN(proteinValue) && proteinValue > 0`; button shows `colors.primary` when protein > 0, `colors.gray200` when empty; submit still requires `isValid` (both name + protein); `shadows.sm` added to form card container. **Translations**: `log.title` → "Nutrition Log" (EN) / "Registro de Nutrición" (ES). |
| 2026-05-24 | Daily Actions — visual consistency pass | All four Daily Actions cards now share the MedLevelBanner design language: 2px colored top accent border, 13px/700 bold headline, soft pill tag, chevron flush right — no icon circles. `checkInCard` and `ctaCard` in `today-screen.tsx` replaced with unified `actionCard` + `actionTextBlock` + `actionHeadline` + `actionPill` styles. Check-in accent is state-aware: `colors.primary` (blue) when not logged, `colors.success` (green) when logged; pill text also switches. `streak-card.tsx` fully rewritten: amber (`colors.warning`) 2px top accent; zero-streak shows blue "Log protein today" hint pill; active streak shows amber "BEST: Xd" pill. `today.streak_start` translation key added to `en.json` + `es.json`. `CameraView` children warning fixed in `barcode-scanner-sheet.tsx`: scan overlay moved out of `<CameraView>` into a sibling absolutely-positioned `<View>` inside a `cameraWrapper` container. |
| 2026-05-24 | Today screen premium upgrade — spacing, metric cards, tab bar | Three visual problems fixed. (1) Daily Actions spacing: `checkInCard` + `ctaCard` `marginBottom` raised from `spacing.sm` (8px) to `spacing.md` (16px); `MedLevelBanner` wrapped in `<View style={styles.bannerWrapper}>` with `marginBottom: spacing.md` so "Medication level estimator" and "Start your streak" no longer touch. (2) Metric cards elevated: `ringCard` + `phaseCard` shadow upgraded `sm→md`, padding `spacing.md→spacing.lg`; injection countdown (`nextInjectionDays`) is now a 32px 800-weight hero number (was 20px 700); `phaseCard` gets `backgroundColor: colors.primaryLight` tint (`phaseAccent` style) to visually distinguish it from the protein card. (3) Tab bar polished: `src/components/ui/icons/home.tsx` converted from a solid filled path (`fill={color}`) to two stroke-based paths (`strokeWidth:1.8`, `strokeLinecap:"round"`, `fill:"none"`) — now consistent with all other tab icons; `tabIconStyles` wrapper added at module scope in `_layout.tsx` — all 6 visible tabs wrap their icon in a 40×28px pill with `borderRadius:14`; active tab gets `backgroundColor: colors.primaryLight`; `tabBarInactiveTintColor` updated from `colors.gray400` to `colors.textSecondary`. Files: `today-screen.tsx`, `home.tsx`, `_layout.tsx`. `pnpm tsc --noEmit` clean (only pre-existing `i18n-js` type def error). |
| 2026-05-24 | Progress tab (Trends dashboard) shipped — 6th bottom-nav tab | Glipra captured high-signal data (weight EWMA, protein per meal, injection timing, daily check-ins, streaks) but had no unified over-time view. Today screen shows "now"; Progress shows "weeks". Final tab order: Today \| Progress \| Nutrition \| Log GLP-1 \| Coach \| Settings. **Pure logic** in `src/features/progress/calculator.ts`: `buildHitHistory`, `calculateHitRate`, `calculateAdherence`, `calculateAverageSymptom` — reuses STREAK_THRESHOLD=0.8 from streaks/calculator.ts, all date-fns (Rule 6), 22 Vitest tests covering empty/zero-floor/future-date/dedup edges. **Data hooks** in `src/features/progress/hooks.ts`: `useProteinHistoryPerDay(days)` aggregates new `fetchFoodLogsInRange` client-side; `useInjectionAdherence(days)` reuses `useMedicationLevelCurve()`'s already-deduped `injectionDates` + `injectionIntervalDays`; `useCheckInTrend(days)` wraps `useCheckInHistory`. **Screen** `src/app/(app)/progress.tsx`: header (no back button), SegmentedControl 7D/30D/90D (default 30D), five stacked cards — Weight EWMA reusing existing `ewma-chart.tsx`; Protein hit-rate with daily bar sparkline; Streak calendar grid (hit/miss/no-data legend); Injection adherence with dot timeline; Check-in symptoms dual-line nausea+energy — plus Tier-2 DisclaimerBanner (Rule 8). Every card has a `<PharmacistTip>` Rx-badged advisory bubble using copy authored under `progress.tips.*` (Rule 9 — no condition names; educational tone). New SVG icon `trending-up.tsx` (line chart trending up arrow). New `fetchFoodLogsInRange(userId, startDate, endDate)` in food-log/api.ts reusing the same local-midnight-vs-UTC fix as `fetchTodayFoodLogs`. en.json + es.json got `tabs.progress` + a full `progress.*` namespace. Risk flagged: 6 tabs is at the edge of Apple HIG/Material 3 guidance — fallback would be to collapse Settings to a Today-screen header icon if labels truncate on small devices. |
| 2026-05-24 | StreakCard made tappable — navigates to Nutrition Log | StreakCard was the only Daily Actions card that was not interactive. Root `<View>` replaced with `<TouchableOpacity>`, `onPress={() => router.push('/log')}`, `activeOpacity: 0.75`, chevron `›` added flush right. Destination is always `/log` regardless of streak state (streak earns by hitting protein floor — Nutrition Log is the natural action). Accessibility label is state-aware. `router` import added from `expo-router`. |
| 2026-05-24 | goal_weight_kg added to profiles — migration 015 | `supabase/migrations/015_goal_weight.sql` adds `goal_weight_kg NUMERIC` (nullable) to profiles. Applied via `npx supabase db push`. `src/types/database.ts` regenerated. Motivation: Progress "To Goal" metric and head-to-head competitor feature parity. |
| 2026-05-24 | Goal weight: full data layer wired | `OnboardingFormData` (use-onboarding-store.tsx) got `goalWeightKg?: number`. `saveOnboardingProfile` (onboarding/api.ts) writes `goal_weight_kg`. `TodayProfile` (today/api.ts) gained `goalWeightKg: number \| null`; `fetchTodayProfile` selects and maps the column. All downstream consumers (useTodayProfile, useTodayData) automatically see the field. |
| 2026-05-24 | Onboarding body screen: optional Goal Weight field | New third input block added after height in `src/app/onboarding/body.tsx`. Same UnitToggle (kg/lbs) as the Weight field — converts to kg before calling `setFormData({ goalWeightKg })`. Field is optional — leaving blank sets `goalWeightKg: undefined`, which `saveOnboardingProfile` maps to `null`. New `optionalLabel` + `hintText` styles. `canProceed` guard unchanged (only weight + height are required). |
| 2026-05-24 | Settings: Body Metrics section + Goal Weight edit screen | New "Body Metrics" SettingsSection added above Health in `settings-screen.tsx`. Contains one row: "Goal Weight" → navigates to new `src/app/(app)/goal-weight.tsx`. Edit screen: pre-populates from `useTodayProfile().goalWeightKg`, UnitToggle for kg/lbs display, numeric input, Save/Clear actions — both upsert `profiles.goal_weight_kg` directly and invalidate `today-profile` React Query cache. "Clear goal weight" button only renders when a goal is already set. Translation keys: `settings.body_metrics` + `settings.goal_weight` added to en.json + es.json. |
| 2026-05-24 | WeightResultsCard — 4-metric summary panel in Progress | New component `src/components/progress/weight-results-card.tsx`. Matches CardShell design language (3px `colors.success` top accent). 2×2 grid: **Total Lost** (first log minus latest, sign-prefixed), **Weekly Avg** (total lost / floor(days/7)), **BMI** (latest weight / height²), **To Goal** (latest minus goal, shows "-- " when no goal, switches to "kg/lbs done" when at or past goal). All arithmetic uses `date-fns` + stored kg values; display converts at render time via `useWeightUnit()`. Empty state (<2 logs) shows prompt. Placed above WeightTrendCard in progress.tsx. Respects range selector — 7D/30D/90D/All filters weight logs before passing to card. Translation keys: `progress.results_card.*` in en.json + es.json. |
| 2026-05-24 | Progress range selector: "All" added | `type Range` extended to include `'All'`; `RANGE_DAYS['All'] = 9999`. When All is selected, `weightLogsInRange` uses `allWeightLogs` unfiltered (bypasses the `cutoff` date filter). Other cards (`ProteinHitRateCard`, `StreakCalendarCard`, etc.) receive `days=9999` — their existing date-fns cutoff logic gracefully returns all available data. Known ceiling: `useWeightLogs` fetches last 90 days by default; "All" for weight reflects 90-day cache until a longer-range fetch path is added (TODO). |
| 2026-05-24 | Haptic feedback wired across the app | `src/lib/haptics.ts` created — thin wrapper over `expo-haptics` (already installed) with named functions: `tap` (light impact), `medium` (medium impact), `selection` (selectionAsync), `success` (notification success), `warning` (notification warning). Wired in: tab bar (`screenListeners.tabPress → tap`), `SettingsRow` (covers all Settings rows), Today screen action cards (check-in, shot-day, journey, discontinued banner), `StreakCard`, `MedLevelBanner`, `SegmentedControl` (selection — range toggle), `UnitToggle` (selection — kg/lbs, cm/ft), `RatingSlider` (selection — check-in emoji buttons), `PainLevelSlider` (selection — 0–10 dots), `MealChipRow` (tap — breakfast/lunch/dinner/snack). Semantic rule: `selection` for discrete value pickers and toggles; `tap` for navigation presses and row taps; `medium`/`success`/`warning` reserved for primary submit buttons and error states (TODO). |
| 2026-05-24 | goal-weight screen hidden from tab bar | `goal-weight.tsx` placed inside `(app)/` was auto-registered by Expo Router as a 7th visible tab. Fixed by adding `<Tabs.Screen name="goal-weight" options={{ href: null, headerShown: false }} />` to `_layout.tsx`. Rule: every file inside `(app)/` that is not a real tab must be explicitly listed with `href: null` — same pattern as `add-shot`, `edit-shot`, `check-in`, etc. |
| 2026-05-24 | EWMA chart: dose marker lines via injectionDates prop | `EwmaChartProps` extended with optional `injectionDates?: string[]`. Each ISO date renders as a faint dashed vertical `<Line>` (1px, `colors.primary`, `strokeDasharray="3,3"`, `opacity=0.35`) using the existing `toX(ts)` helper. Lines outside `[minTime, maxTime]` are skipped. `WeightTrendCard` calls `useInjectionAdherence(days)` (already used by `InjectionAdherenceCard`) to get `windowDates` and passes them as `injectionDates` to `EwmaChart` — no new hooks, no new API calls. |
| 2026-05-25 | Discontinuation mode completed | The `discontinuation-mode.tsx` guidance screen, today-screen banner, routing, and pharmacist content cards were already built. The missing piece was a post-onboarding status change UI. Built: (1) `src/app/(app)/update-status.tsx` — new hidden screen with the same 5-option pill-card selector as `onboarding/status.tsx`; pre-populates from `useTodayProfile()`; saves via `supabase.from('profiles').update({ medication_status })` + `invalidateQueries(['today-profile'])`, mirroring the `goal-weight.tsx` pattern exactly. (2) `_layout.tsx` — registered `update-status` with `href: null` so it doesn't auto-appear as a tab. (3) `settings-screen.tsx` — new "GLP-1 Status" `SettingsRow` at the top of the Preferences section; shows current status label (e.g. "Active") as `value` prop; navigates to `/update-status`. `STATUS_LABELS` map added at module scope. (4) `today-screen.tsx` — when `medicationStatus === 'discontinued'`: injection phase card replaced with "Injection tracking paused" placeholder (prevents confusing "overdue" state); `MedLevelBanner` hidden (injection-cycle-aware, meaningless post-discontinuation). Shot Day Prep card disappears naturally (already gated on `injectionCycle?.phase === 'injection_day'`). (5) `en.json` + `es.json` — `settings.medication_status` and `today.injection_discontinued` added in both languages. Protein floor on discontinuation screen intentionally shows full value with NO maintenance multiplier — muscle preservation is the highest priority immediately after stopping. `pnpm tsc --noEmit` clean; 66/66 jest tests pass. |
| 2026-05-25 | android.minSdkVersion bumped to 26 | `app.config.ts` `android.minSdkVersion` set to 26. Required by `react-native-health-link` (Health Connect API minimum). Previously the project used SDK 24, which caused a `minSdk conflict with androidx.health.connect` build error when the package was present, so it was removed. With the bump in place, re-add the package via `pnpm expo install react-native-health-link` when building the Health Import feature. Takes effect on the next EAS build (native config change — not OTA-updatable). |
| 2026-05-25 | Jest/Vitest runner collision resolved | jest-expo was picking up 9 pure-TS Vitest test files (which import from `vitest`) and crashing on them. Fix: added `testPathIgnorePatterns` to `jest.config.js` with four regex patterns that mirror `vitest.config.ts`'s `include` globs exactly — `/src/utils/.*\.test\.ts$`, `/src/features/.*calculator\.test\.ts$` (covers both `calculator` and `readiness-calculator`), `/src/features/safety/.*\.test\.ts$`, `/src/features/medication-level/.*\.test\.ts$`. `/node_modules/` retained explicitly since adding the field overrides the preset default. Result: jest-expo runs 11 suites / 66 tests (component + integration); Vitest runs 9 files / 226 tests (safety-critical pure-TS). Zero overlap. |
| 2026-05-25 | Data ceilings fixed — weight range & EWMA chart slice | Two bugs prevented the Progress screen from showing correct data on the "All" range. (1) `useWeightLogs()` was called without arguments everywhere, so `fetchWeightLogs` always defaulted to 90 days — "All" was silently capped at 90 rows. Fix: added `days = 90` parameter to `useWeightLogs(days)` and included it in the React Query key as `[WEIGHT_LOGS_KEY, userId, days]` so each range gets its own cache entry. `fetchWeightLogs` already accepted a `days` param — it just wasn't being threaded through. The `invalidateQueries({ queryKey: [WEIGHT_LOGS_KEY, userId] })` partial-key match in `useInsertWeightLog` invalidates every variant automatically. EWMA cache read updated to the 3-element key `[…, 90]` so EWMA computation always reads the standard window. (2) `EwmaChart` had `const visible = logs.slice(-30)` — a hard cap of 30 points regardless of the selected range. Removed entirely; chart renders whatever the caller passes. (3) `WeightTrendCard` and `progress.tsx` both had client-side date filters that are now redundant — removed, along with the unused `parseISO`/`subDays` imports. "All" now maps to `days = 9999`, which causes `subDays(new Date(), 9999)` (~27 years ago) to be the Supabase `gte` cutoff, returning the user's full history. Files: `features/weight/hooks.ts`, `components/progress/weight-trend-card.tsx`, `app/(app)/progress.tsx`, `components/weight/ewma-chart.tsx`. |
| 2026-05-25 | Settings: Goal Weight row now shows current value | `settings-screen.tsx` calls `useTodayProfile()` (already cached, no extra network call) and `useWeightUnit()` to derive `goalWeightValue`. When `profile.goalWeightKg` is non-null, `formatWeight(kg, unit)` produces `"75.0 kg"` / `"165.3 lbs"` and is passed as `value` prop to the Goal Weight `SettingsRow`. When null, `value` stays `undefined` so the existing chevron `›` renders and the row still looks tappable. `SettingsRow` already handles both states — no component changes needed. `pnpm tsc --noEmit` clean (only pre-existing `i18n-js` typedef warning). |
| 2026-05-25 | Haptics pass 2 — primary CTAs, success, and destructive actions | Completed the haptic semantic layer across all commit surfaces. **Semantic placement rules:** `medium()` fires on every primary CTA immediately after the early-return guard (before mutate/navigate); `success()` fires after a confirmed server save (inside `isSuccess` useEffect watcher or `onSuccess` callback); `warning()` fires before any destructive `Alert.alert`. **Onboarding (11 screens):** `haptics.medium()` added to `handleNext()` / `handleContinue()` / `handleSkip()` / `handleStart()` in `language.tsx`, `medication.tsx`, `injection-day.tsx`, `body.tsx`, `goals.tsx`, `status.tsx`, `dietary.tsx`, `safety.tsx`, `protein-target.tsx`, `import.tsx`, `reveal.tsx` — always placed as the first statement after the guard, before `setFormData()` + `router.push()`. **App screens:** `check-in.tsx` — `medium()` as first line of `handleSubmit()` before `mutate()`; `success()` in `isSuccess` useEffect before `router.back()`; `add-shot.tsx` — `medium()` before `logShot()` in `handleSave()`; `edit-shot.tsx` — `medium()` before `updateShot()` in `handleSave()`; `warning()` before `Alert.alert` in `handleDelete()`; `coach.tsx` — `medium()` after the `!text \|\| isLoading` guard before `setInputText('')`; `visit-prep.tsx` — `medium()` as first line of both `handleGenerateQuestions` and `handleExport` callbacks; `goal-weight.tsx` — `medium()` in `handleSave()` (first line, before session guard), `warning()` as first line of `handleClear()` (destructive clear). **Components:** `weight-entry-form.tsx` — `medium()` after `!isValid` guard before weight conversion; `photo-capture-button.tsx` — `medium()` after `isLoading` guard before the `isPro` branch so both Pro (camera) and free (paywall) paths receive the pulse; `barcode-scanner-sheet.tsx` — `success()` inside `if (result)` branch before `setProduct(result)` so a confirmed product match always triggers success feedback. `pnpm tsc --noEmit` clean; all 226 Vitest tests + all 66 jest-expo tests pass. |
| 2026-05-25 | Push notification infrastructure shipped | `expo-notifications@0.32.17` installed. Two local notifications: (1) **Injection day reminder** — one-time, fires 8 AM on the next computed injection date; auto-rescheduled whenever a shot is logged in `useLogInjectionSite` onSuccess using `differenceInCalendarDays(newShot, previousShot)` as the interval (date-fns, Rule 6). (2) **Daily protein nudge** — repeating daily at 7 PM, body copy includes the user's `proteinFloorG`. Permission requested silently at end of onboarding (reveal.tsx) — ideal moment, after value is established. Settings → Notifications section added with two `Switch` toggle rows. `useNotificationSettings()` hook manages permission requests, AsyncStorage persistence (`NOTIF_INJECTION_ENABLED`, `NOTIF_PROTEIN_ENABLED`), scheduling, and cancellation in one place. `notifications` object in `src/lib/notifications.ts` follows haptics.ts pattern — all functions are try/catch wrapped, silent no-op on failure. `expo-notifications` plugin added to `app.config.ts`. i18n keys added to `settings.*` namespace in en.json + es.json. `pnpm tsc --noEmit` clean (only pre-existing i18n-js typedef); 66/66 jest tests pass. Local notifications work in Expo Go — no new EAS build required to test. |
| 2026-05-25 | react-native-health-link 0.2.0 installed — Health Import feature unlocked | `pnpm add react-native-health-link --ignore-scripts` succeeded (Expo wrapper hit Windows EPERM/OneDrive rename race; direct pnpm add worked). The entire Health Import feature was pre-built: `src/features/health-import/health-link.ts` (graceful dynamic-require wrapper, Expo Go safe), `src/features/health-import/hooks.ts` (`useHealthImport()` with 90-day dedup + sequential EWMA), `src/app/(app)/health-import.tsx` (full styled screen with Connect, Import, Steps Today, Tier-2 DisclaimerBanner). No file edits needed — dynamic-require loads the module automatically now that it exists in node_modules. `pnpm tsc --noEmit` clean (only pre-existing i18n-js typedef); 66/66 jest tests pass; 226 Vitest tests pass. **Requires a new EAS dev build** before testing on device — native modules are compiled at build time and cannot be delivered via OTA update. |
| 2026-05-25 | Content cards batch 2 shipped — 25/25 target reached | 15 new pharmacist-authored cards added to `src/features/content-cards/data.ts` (sortOrder 11–25): resistance training, protein shakes, eating out, alcohol (warning tier 1), B vitamins (warning tier 1), iron/zinc, calcium/bone, plateau psychology, pre-injection prep, soft foods, adjustment phase, sleep/muscle, social eating, logging accuracy, maintenance nutrition. All `medicationIds: []` (universal). Cards 19 and 20 from architecture (pancreatitis/gallbladder) intentionally omitted — require attorney review + dual disclaimers. `getActiveCards()` required no changes. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); 66/66 jest tests pass. |
| 2026-05-25 | Visual redesign direction locked — Direction B (Vibrant Gradient) with light/dark mode | User feedback: app looks "boring." After visual brainstorm comparing 3 directions (Dark Premium, Vibrant Gradient, Bold Typography), **Direction B (Vibrant Gradient)** selected. Design: purple-to-blue gradient hero on Today screen (light: `#6d28d9→#2563eb→#0284c7`; dark: `#3b0764→#1e3a8a→#0c4a6e`), white floating metric cards in light mode, `#1e1533` dark-purple cards in dark mode. System primary color shifts from `#2D6BE4` (blue) to `#6d28d9` (deep purple). Light/dark mode support via `ThemeContext` + `useTheme()` hook replacing static `colors.ts` import — theme key persisted to AsyncStorage. **Pharmacist touches added:** (A) `PharmacistSpotlightCard` restyled as a prescription pad — purple header with ℞ symbol, faint ruled lines across card body, "Sig:" clinical shorthand label, dashed footer with "Licensed Pharmacist / Glipra Health" stamp. (B) Injection cycle card replaced with a 7-cell blister pack (`PillStripCard`) — each day shows phase color (injection day = purple with 💉, peak suppression = blue P, adjustment = green A, recovery = amber R), today's cell gets a glow ring, tomorrow is dashed/empty. **Additional design work queued (D1–D10 in PROGRESS.md):** custom tab bar, micro-animations (protein ring spring fill, readiness count-up), skeleton loading, onboarding gradient screens, milestone gradient cards, protein floor reveal card. All new components read from `useTheme()` — no hardcoded colors. |
| 2026-05-25 | Content cards redesigned — phase-aware spotlight replaces bland carousel | User feedback: horizontal carousel looked "bland" and "like spark notes." Root cause: 25 cards crammed in a fixed-width scroll meant users saw 1-2 cards and stopped; full paragraph bodies were too heavy to scan. Fix: replaced the carousel as the primary surface with `PharmacistSpotlightCard` — a full-width card showing a bold 1-sentence `keyTakeaway` with a "Read the full note" CTA that opens `ContentCardSheet` (Modal bottom sheet). The carousel survives as a collapsible "Browse all tips" secondary path. Cards now have two new data fields: `keyTakeaway: string` (spotlight headline, max ~12 words, active voice) and `phases?: InjectionPhase[]` (which injection phases this card is most relevant to). Spotlight selection logic: phase-specific card shown when a match exists for the user's current `injectionCycle.phase`; universal cards (no phases) rotated daily by `differenceInCalendarDays` so the feature card changes each day. `PHASE_LABELS` map provides the phase pill label in the card header. New files: `src/components/today/pharmacist-spotlight-card.tsx`, `src/components/today/content-card-sheet.tsx`. Modified: `data.ts` (interface + all 25 card entries), `today-screen.tsx` (spotlight wiring + state), `en.json`/`es.json` (3 new keys each: `pharmacist_note_label`, `browse_all_tips`, `read_full_note`). Also added `common.close` to both translation files. TSC clean (pre-existing i18n-js typedef only); 66/66 jest tests pass. Commit: f7569a6. |
| 2026-05-25 | EAS build failure: uncommitted changes caused minSdkVersion mismatch | EAS Build clones from git HEAD — not from the local working tree. `app.config.ts` had `android.minSdkVersion: 26` locally (added for health-link) but the change was never committed, so EAS generated the Android project from the committed version (`minSdkVersion` absent → Expo default of 24). `react-native-health-link` pulls in `androidx.health.connect:connect-client:1.1.0-alpha11` which requires minSdk 26, causing Gradle manifest merger to fail: `uses-sdk:minSdkVersion 24 cannot be smaller than version 26 declared in library`. **Diagnosis:** `git show HEAD:app.config.ts` confirmed no `minSdkVersion` in the committed android block; `git status` showed 75 files changed or untracked — the entire session's work was uncommitted. **Fix:** staged and committed all 75 files (`app.config.ts`, `package.json`, `pnpm-lock.yaml`, `src/`, `supabase/`) in commit `b757929`. **Rule derived:** never trigger an EAS build with uncommitted changes — run `git status` first to confirm HEAD reflects what you intend to build. |
| 2026-05-25 | D1 — ThemeContext + Direction B token system shipped | `src/theme/tokens.ts` defines `GlipraTokens` interface + `lightTokens` / `darkTokens` (Direction B palettes). `src/lib/ThemeContext.tsx` provides `GlipraThemeProvider`, `useTheme()` (returns full token set, safe fallback to light), `useThemeSelector()` (Settings only). `src/app/_layout.tsx` split into outer `Providers` (holds `GlipraThemeProvider`) and inner `ConnectedProviders` (calls `useThemeConfig()` safely inside the provider) — required because `useThemeConfig` must consume `useTheme()` but the old structure put it outside the context. `src/components/ui/use-theme-config.tsx` replaced: was importing from deleted `@/components/ui/colors`, always returned `LightTheme`; now wires React Navigation theme to live `useTheme()` tokens. `src/theme/colors.ts` primary updated to `#6d28d9` (Direction B purple) — propagates to all 80+ unmigrated files immediately at zero cost. Three high-visibility screens migrated to `makeStyles` pattern: `today-screen.tsx`, `settings-screen.tsx`, `progress.tsx`. Settings → Appearance section added with Light / Dark / System `Pressable` toggle; preference persisted via pre-existing `useSelectedTheme()` AsyncStorage hook. `src/theme/tokens.test.ts` (11 Vitest assertions) added; `vitest.config.ts` and `jest.config.js` updated to route the new test file to Vitest only. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); all tests pass. |
| 2026-05-25 | D2 — Gradient hero on Today screen header | `expo-linear-gradient` (already installed, `~15.0.8`) wired into `today-screen.tsx`. `SafeAreaView` background set to `gradients.hero[0]` so the status-bar notch area matches the gradient start color. `ScrollView` background set to `colors.background` so the scroll body is cream/dark as appropriate. `LinearGradient` (full-bleed, `start {x:0,y:0} → end {x:1,y:1}`) wraps the header content — greeting text, date, Rx badge — all in white (`#ffffff` / `rgba(255,255,255,0.75)`). Rx badge uses `rgba(255,255,255,0.18)` background + `rgba(255,255,255,0.35)` border to float on the gradient. `contentArea` View below gradient restores horizontal padding. Light gradient: `#6d28d9 → #2563eb → #0284c7`; dark gradient: `#3b0764 → #1e3a8a → #0c4a6e` — both from `gradients.hero` token so dark mode is automatic. **Note:** initial dev-build test crashed with `IllegalViewOperationException` because `expo-linear-gradient` had never been used in the codebase when build 860c9b45 was created — native view manager wasn't pre-allocated. Temporary fallback (solid `colors.primary` View) deployed via Metro hot-reload. New EAS build (session 16) will register the module; gradient will render correctly from that build forward. |
| 2026-05-25 | D3 — ℞ Prescription Pad SpotlightCard shipped and confirmed on device | Visual brainstorm produced three prescription-pad directions (A: bold gradient header; B: thin stripe + watermark; C: Glipra ℞ brandmark). **Decision: Direction A layout + Direction C footer stamp.** Rationale: gradient matches D2 Today hero — creates a consistent visual language that associates the purple-blue gradient with pharmacist-authored content. Footer: rotated `✦ LICENSED RPh ✦` stamp (RPh = Registered Pharmacist, the actual US credential abbreviation) at `opacity: 0.65`, `transform: rotate(-2deg)` — adds prescription-pad realism. Ruled lines implemented via absolute-positioned 1px `View` elements at 28px intervals (matching `lineHeight: 28` on the takeaway text) since React Native has no `repeating-linear-gradient`. Outer/inner wrapper pattern used: outer `View` carries `shadows.md` + `backgroundColor: colors.surface` (iOS shadow requires non-transparent bg on shadow-carrying View); inner `View` has `overflow:'hidden'` + `borderRadius` for gradient corner clipping without killing Android elevation. Tier 1 clinical cards get an amber left-border warning stripe above the Sig: label (Rule 8 compliance). Warning stripe text uses `t('today.clinical_note_label')` i18n key — no hardcoded strings, no em dashes. `ruledContainer` minHeight set to `LINE_HEIGHT * RULE_COUNT` (84px) so all three rules render without clipping. No prop changes — `PharmacistSpotlightCardProps` unchanged. Implementation: single-file rewrite of `src/components/today/pharmacist-spotlight-card.tsx`. Confirmed rendering correctly on physical Android device in EAS build 58aaa2f3. |
| 2026-05-25 | D4 — 7-cell blister pack injection cycle strip shipped | New component `src/components/today/injection-cycle-card.tsx`. Props: `lastInjectionDate: string` (from `profile`) + `injectionCycle: InjectionCycleResult` (from `useTodayData()`). Seven dome-shaped cells rendered via `Array.from({ length: 7 }, (_, i) => addDays(parseISO(lastInjectionDate), i))` — day-of-week label (`format(date, 'EEE')` → Mon/Tue/etc.) appears below each dome. Phase color per cell via local `getPhaseForDay(i)` helper (0→injection_day, 1-2→peak_suppression, 3-4→adjustment, 5-6→recovery_window). Past/today cells: solid phase-color fill; today cell: extra `borderWidth: 2.5, borderColor: colors.white` (today ring) + "TODAY" badge at opacity:1 above dome (opacity:0 for all other cells — opacity toggle avoids layout shift). Future cells: `colors.gray100` (muted, unlit blister). Overdue state: `effectiveDaySince` clamped to 7, all cells render as past. Footer: "Next: Mon, Jun 2" or "OVERDUE" in `colors.phaseOverdue` red. Dome shape: `borderTopLeftRadius: 999, borderTopRightRadius: 999` (React Native clamps to width/2 → perfect semicircle top), `borderBottomLeftRadius: 6, borderBottomRightRadius: 6`. Outer/inner shadow wrapper pattern (D3): `outer` carries `...shadows.md + backgroundColor: colors.surface` (iOS shadow host), `inner` has `overflow:'hidden'` (Android clip). `makeStyles` factory called via `React.useMemo`. All strings via i18n: `today.cycle_title`, `today.cycle_today_badge`, `today.cycle_next_dose`, `today.cycle_overdue_label` (added to `en.json` + `es.json`). Rendered in `today-screen.tsx` after `metricsRow`, before Shot Day Prep, guarded by `medicationStatus !== 'discontinued' && lastInjectionDate && injectionCycle`. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); 66/66 jest tests pass. Commits: c3d7cb5 → da45e2d → 1d31e3e → 5de53ae → 2f57b6a. |
| 2026-05-25 | D5 — Custom tab bar with gradient active pill + Settings gear icon | New component `src/components/navigation/glipra-tab-bar.tsx` typed with `BottomTabBarProps` from `@react-navigation/bottom-tabs` (transitive dep of expo-router). Renders 5 visible tabs (Today, Progress, Nutrition, Sites, Coach); Settings removed from tab bar. Active tab: horizontal `LinearGradient` using `gradients.hero` (purple→blue→teal), `height: 32`, `borderRadius: 16`, `minWidth: 44`; icon in `colors.textInverse`. Inactive tabs: plain `View` same dimensions; icon in `colors.textSecondary`. Tab labels via `useTranslation()` using existing `tabs.*` keys. **Navigation dispatch:** `CommonActions.navigate(route)` + `target: state.key` per React Navigation 7 contract — the simple `navigation.navigate(route.name)` string form does not correctly scope dispatch in Expo Router's nested navigator. **Insets:** destructured from `BottomTabBarProps` directly (framework already calls `useSafeAreaInsets()` internally; no duplicate hook). **Styling pattern:** static `StyleSheet.create` for layout dims + inline colors from `useTheme()` — intentional deviation from the project's `makeStyles` + `useMemo` pattern; tab bar re-renders on every navigation event so avoiding useMemo call overhead is more appropriate here. **Tab labels in `_layout.tsx`:** `GlipraTabBar` reads labels from its own `TAB_CONFIG` (not from `Tabs.Screen options.title`); the `title` props in `_layout.tsx` are kept as documentation/fallback only — noted in a comment. **Settings tab:** registered with `href: null` in `_layout.tsx` — hidden from the tab bar but route remains programmatically navigable via `router.push('/settings')`. **Gear icon:** `Pressable` added to Today screen header inside a new `headerActions` wrapper row (alongside the Rx badge); `SettingsIcon color="#ffffff"` (always white — sits on the dark gradient hero, matching all other header elements). `haptics.tap()` on both tab press and long press. `tabLongPress` event emitted from `onLongPress` to fulfil full React Navigation tab bar event contract. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); 66/66 jest tests pass. Commits: 10704bb → 352f02b → 3e367f9 → ecb92b6 → 9fdcee8 → bc937e3. |
| 2026-05-25 | Appearance picker added as onboarding step 2 | New screen `src/app/onboarding/appearance.tsx` inserted between `language.tsx` and `medication.tsx`. Shows three card options (Light / Dark / System) using the same radio-card pattern as `language.tsx`. Calls `useThemeSelector()` from `@/lib/ThemeContext` on each tap — writes to AsyncStorage immediately and triggers a full ThemeContext re-render, giving the user instant live preview (tapping Dark flips the screen to dark mode before they even press Continue). System is pre-selected on first visit (AsyncStorage has no saved value yet, `useSelectedTheme` defaults to `'system'`). `language.tsx` `handleContinue` target changed from `/onboarding/medication` → `/onboarding/appearance`; appearance screen's Continue routes to `/onboarding/medication`. Uses `t('common.continue')` for the button — i18n is active by this step since `language.tsx` already called `changeLanguage()`. No Expo Router layout changes needed — Expo Router auto-discovers `appearance.tsx` in the `onboarding/` folder. 8 new i18n keys added under `onboarding.*` namespace (title, subtitle, light/dark/system label + sublabel) in both `en.json` and `es.json`. `pnpm tsc --noEmit` clean; 66/66 jest tests pass. Commits: 0e3e2cc, 542014e, 13740bc. |
| 2026-05-25 | Dark mode screen migration — all 37 screens migrated to `useTheme()` | D1 (session 18) only migrated 3 screens (Today, Progress, Settings). All remaining screen files still imported from static `@/theme/colors`, so dark mode had no effect on them. Bug surfaced on device: Nutrition and Injection Sites tabs showed a light background in dark mode. **Scope:** 37 screen files migrated in 7 commits — tab screens (`log`, `injection-sites`, `coach`), 12 hidden app screens (`check-in`, `weight`, `edit-shot`, `visit-prep`, `update-status`, `goal-weight`, `shot-prep`, `journey`, `maintenance-mode`, `medication-level`, `health-import`, `discontinuation-mode`), 5 auth screens (`consent`, `welcome`, `sign-in`, `sign-up`, `forgot-password`), 11 onboarding screens (all steps + `import.tsx`), `add-shot.tsx`. **Migration pattern:** static `import { colors, radius, shadows, spacing } from '@/theme/colors'` replaced with `import { useTheme } from '@/lib/ThemeContext'` + `import type { GlipraTokens } from '@/theme/tokens'`; inside each component `const { colors, spacing, radius, shadows } = useTheme()` + `const styles = React.useMemo(() => makeStyles({ colors, spacing, radius, shadows }), [colors, spacing, radius, shadows])`; `StyleSheet.create({...})` converted to `function makeStyles(tokens: StyleTokens)` at bottom of file. Token key names are identical between static `colors.ts` and `GlipraColorTokens` — no key renaming needed. **In-file sub-components** (8 total) given their own `useTheme()` call + separate named `makeXxxStyles` factory: `ShotRow` (injection-sites), `FoodLogRow` (log), `TypingIndicator` + `MessageBubble` (coach), `WeightTrendSection` (discontinuation-mode), `SectionCard` + `DataRow` (visit-prep), `SummaryCard` (onboarding/reveal). **Two pre-existing hardcoded literals** left as-is: `#7C2D12` in `consent.tsx` and `#9A3412` in `protein-target.tsx` — both are clinical disclaimer text colors not mapped to a token; use `colors.escalationText` in a future cleanup. **Also fixed:** `tabs.sites` i18n key was `"Log GLP-1"` in both `en.json` and `es.json` — corrected to `"Sites"` / `"Sitios"`. **Remaining:** 44 component files in `src/components/**` and `src/features/**` still use static `colors.ts` (BarcodeScannerSheet, ManualEntryForm, DailyMacroCard, PhotoReviewSheet, MealChipRow, etc.) — scheduled as a separate "D1 Component Migration" pass. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); 66/66 jest tests pass. Commits: bc95a0e, bd94a8a, 5588b66, 6a2a2de, 826e3cd, 4f1a173, 63df0b0. |
| 2026-05-25 | EAS build 58aaa2f3 — LinearGradient registered + notifications fix | New Android dev build triggered after D2 LinearGradient crash (build 860c9b45 had `expo-linear-gradient` in package.json but never used — native view manager not pre-allocated, caused `IllegalViewOperationException` on Fabric). Fix: `expo-linear-gradient` is now actively used in `today-screen.tsx` (D2) and `pharmacist-spotlight-card.tsx` (D3) so the native module is compiled into the binary. Also included: notifications module-level `Notifications.setNotificationHandler()` wrapped in try/catch — Expo Router route discovery was crashing on module evaluation, blocking `injection-sites`, `settings`, `add-shot`, and `edit-shot` route registration. APK install URL: `https://expo.dev/artifacts/eas/bX3bmCNPxNQ7pfEVZDQQo6.apk`. **On-device behavior note:** after fresh APK install (uninstall + reinstall), `AuthLayout` and `TabLayout` both return `null` for ~100ms while `hasAgreed` and `isFirstTime` load from AsyncStorage — this appears as a brief dark flash (`#0d0920` background from dark theme). Not a crash; resolves immediately. On Android, reinstalling with the same keystore often preserves AsyncStorage data — user went straight to Today screen without re-consenting. |
| 2026-05-25 | Daily Actions tiles — dark mode fix + accent icon circles | Two action tiles (`StreakCard`, `MedLevelBanner`) still imported from static `@/theme/colors`, rendering white cards in dark mode while the other two tiles (Daily Check-in, Your Journey) were already dark-mode-aware via `useTheme()`. **Fix:** both components migrated to `useTheme()` + `makeStyles` factory pattern. **Icons:** four new SVG icons added (`src/components/ui/icons/clipboard-check.tsx`, `activity.tsx`, `bolt.tsx`, `progress-path.tsx`) following the existing 24×24 / strokeWidth 1.8 / `color` prop convention. All four Daily Action tiles now have a 40×40 icon circle (borderRadius 20) placed left of the text block. Design direction chosen via interactive visual mockup — color-coded circles per tile: Check-in = `colors.primaryLight` purple circle + ClipboardCheck icon (flips to `colors.success` green circle + white icon when already logged today); Medication level estimator = `rgba(37,99,235,0.12)` blue circle + Activity/EKG-wave icon; Streak = `colors.warningLight` amber circle + Bolt/lightning icon; Journey = `colors.primaryLight` purple circle + ProgressPath icon. `today-screen.tsx` already had `actionIconCircle`, `actionIconCircleDone`, `actionIconCirclePending` styles scaffolded — wired up rather than re-created. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); 66/66 jest tests pass. Commits: 55c4f9c, c9cc90b, d9eced4, ee1e456. |
| 2026-05-25 | D4 follow-up — phase labels added inside blister pack dome cells | The D4 blister pack shipped with blank dome cells — phase color was present but no text. User feedback: "Weren't there supposed to be phase names inside here?" and "I don't want just P or A or R. I want an abbreviation at least." Fix: `PHASE_LABELS: Record<InjectionPhase, string>` constant added to `src/components/today/injection-cycle-card.tsx` with values `{ injection_day: '💉', peak_suppression: 'PEAK', adjustment: 'ADJ', recovery_window: 'REC', overdue: 'OD' }`. `cellPhase` (already computed in the cells loop) added to the return object. Dome `<View />` converted from self-closing to a container; colored domes (past + today) render a `<Text style={styles.domeLabel}>` child with the phase label; future cells (gray) render nothing. `dome` style gained `alignItems: 'center'` + `justifyContent: 'center'`. New `domeLabel` style: `fontSize: 9, fontWeight: '800', color: colors.white, letterSpacing: 0.5, textTransform: 'uppercase'` — white bold caps that read clearly against any phase color. `numberOfLines={1} adjustsFontSizeToFit` on the Text prevents overflow in narrow cells. Single file modified: `src/components/today/injection-cycle-card.tsx`. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); 66/66 jest tests pass. Commit: b7534d9. |
| 2026-05-25 | Daily Hits — replaced unbounded dot grid with fixed 4-week calendar | The original `StreakCalendarCard` accepted a `days` prop (up to 365) and rendered 14-column rows, producing up to 26 rows — far too tall. Redesigned as a fixed 7x4 grid: always 7 columns (Mon–Sun), 4 rows (last 4 complete weeks starting from the Monday 3 weeks ago). Grid start: `subWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 3)` (date-fns only, no raw arithmetic). `days` prop kept on the interface for compatibility but ignored internally — the component always fetches exactly 28 days. Day-of-week header row (M T W T F S S) added above the grid so users can spot weekly patterns. `historyMap` useMemo builds a date-keyed lookup for O(1) slot resolution. Future cells (date > today string comparison) render as gray regardless of data. `LegendDot` sub-component passes `styles` param to receive the `makeStyles` return (pattern for passing factory output into sub-components). Migrated to `useTheme()` — dark mode correct. File: `src/components/progress/streak-calendar-card.tsx`. `pnpm tsc --noEmit` clean; 66/66 tests pass. Commit: 5ec012c. |
| 2026-05-25 | Daily Hits — day-of-month numbers inside calendar cells | Follow-up to the 4-week calendar. Each cell now shows the day number (1–31) centered inside it. `slots` useMemo now stores `dateObj = addDays(gridStart, i)` before calling `format()` twice — once for `yyyy-MM-dd` (lookup key) and once with `'d'` (day number). Cell `<View />` converted from self-closing to a container; `<Text style={[styles.dayNum, { color: ... }]}>` renders the number centered. Color logic: white (`colors.white`) on colored cells (hit/missed), muted (`colors.textDisabled`) on gray cells (no data/future). `cell` style gained `alignItems: 'center'` + `justifyContent: 'center'`. New `dayNum` style: `fontSize: 9, fontWeight: '700', lineHeight: 11`. File: `src/components/progress/streak-calendar-card.tsx`. `pnpm tsc --noEmit` clean; 66/66 tests pass. Commit: cec16a9. |
| 2026-05-25 | Barcode scanner — full macro + GLP-1 Watch nutrition panel | Previously the barcode scan results showed only 3 fields (Protein, Fiber, Calories). Redesigned across 6 files. **barcode-lookup.ts:** `BarcodeProduct` interface extended with `carbsG`, `fatG`, `magnesiumMg`, `zincMg`, `b12Mcg`, `vitaminDIu`. OFF extraction updated — macros are in g/100g (direct), minerals in g/100g (×1000 for mg), vitamins in g/100g (×1e6 for mcg; Vit D ×40 for IU). USDA extraction adds nutrientIds 1004 (fat), 1005 (carbs), 1090 (Mg, mg), 1095 (Zn, mg), 1178 (B12, µg), 1114 (Vit D, µg→×40 IU). **types.ts:** `BarcodeFoodEntry` interface added (mirrors `PhotoFoodEntry`, includes `barcodeEan`). **api.ts:** `insertBarcodeFoodLog()` writes all 12 nutrition columns to `food_logs` (previously only 3 were written). **hooks.ts:** `useInsertBarcodeFoodLog` uses `BarcodeFoodEntry` type and calls `insertBarcodeFoodLog`. **log.tsx:** `handleProductFound` passes all new fields. **barcode-scanner-sheet.tsx:** Redesigned results UI — Protein hero card (full-width, 36px/800 weight, brand purple border + `BRAND_LIGHT` background, "your GLP-1 priority" subtext) + 4-cell macro row (Calories / Carbs / Fat / Fiber, 16px/700) + conditional amber GLP-1 Watch panel (Magnesium / Zinc / Vit B12 / Vit D, only rendered when API returned ≥1 non-null micronutrient). Migrated to `useTheme()` + `makeStyles`. Result section wrapped in `ScrollView` to handle taller content. `EditableField` sub-component gains `unit` prop (shown below label) and `micro` flag (amber tint). Commits: ee6c643 (safe area fix, separate), 343893b. |
| 2026-05-25 | disclaimerText token + D1 component migration | Added `disclaimerText` token to `GlipraColorTokens` interface (`#9a3412` light / `#fdba74` dark) and to both `lightTokens` and `darkTokens` in `tokens.ts`, plus `colors.ts` static fallback. Replaced 7 hardcoded disclaimer color literals (`#9A3412`, `#7C2D12`) across `disclaimer-banner.tsx`, `consent.tsx`, `protein-target.tsx`, `visit-prep.tsx`, `discontinuation-mode.tsx`, `medication-level.tsx`, `maintenance-mode.tsx`. **D1 component migration:** Migrated 39 component and feature files from `import { colors, ... } from '@/theme/colors'` to `useTheme()` + `makeStyles` factory pattern. Dark mode now applies correctly to every component in the app — the D1 migration pass begun in session 18 (37 screens) is now complete. Only `src/features/journey-cards/milestones.ts` retains the static import (plain `.ts` data file, not a React component; cannot use hooks). Migration pattern: static import removed; `useTheme()` called inside component; `StyleSheet.create(...)` moved into `function makeStyles({ colors, spacing, radius, shadows })` factory; called via `React.useMemo()`. Sub-components in the same file each got their own `useTheme()` call. Module-level color constants that referenced colors (e.g. `PHASE_COLORS`, `arcColor()`) moved inside component functions. Commit: 3d6de20. |
| 2026-05-29 | OTA update pushed — development channel | `eas update --channel development` published session 35 fixes (expo-av lazy-load + VoiceCaptureButton token cleanup). Update group `6c890b73-cc3a-4b47-8d12-057a787ab1d3`. Android `019e7793-9b9a-789b-a6c0-cb118b739ebc` / iOS `019e7793-9b9a-71de-8998-f49849b48b9c`. Runtime 1.0.0. Sentry warning "Missing config for organization, project" is expected — DSN env var fallback is active and working; source map uploads are disabled (`SENTRY_DISABLE_AUTO_UPLOAD=true` in preview, env var fallback in dev). [Dashboard](https://expo.dev/accounts/waliabdul/projects/glipra/updates/6c890b73-cc3a-4b47-8d12-057a787ab1d3) |
| 2026-05-29 | PostHog + Sentry confirmed live | Both `EXPO_PUBLIC_POSTHOG_API_KEY` and `EXPO_PUBLIC_SENTRY_DSN` were already present in `.env.development` and in both `development` and `preview` profiles in `eas.json`. CLAUDE.md open blocker was stale — removed. Also corrected the Health package minSdk blocker note: `react-native-health-link` 0.2.0 is installed and `android.minSdkVersion` is already 26. |
| 2026-05-29 | expo-av lazy-load fix — `VoiceCaptureButton` crash in Expo Go resolved | Root cause: `import { Audio } from 'expo-av'` at module top-level caused `requireNativeModule('ExponentAV')` to run synchronously at evaluation time. In Expo Go (no EAS build) the native binary isn't compiled in, so the throw propagated up through `log.tsx` → Expo Router route discovery → "No route named 'log' exists" + "missing default export" warnings. Same pattern as the `expo-linear-gradient` (session D2) and `expo-notifications` (build 58aaa2f3) crashes documented above. **Fix:** `import { Audio }` replaced with `import type { Audio }` (type-only, erased at compile time, zero runtime effect on module loading). Module-level `getAudio()` function added — wraps `require('expo-av')` in try-catch, only executes when mic button is tapped, returns `null` in Expo Go. `handlePress` calls `getAudio()` before mic permission request and shows "Dev Build Required" alert on null. `startRecording` calls `getAudio()` and early-returns on null. `stopRecording` calls `getAudio()` and skips `setAudioModeAsync` if null (safe — the recording object itself was already created in a valid session). State type `Audio.Recording \| null` and `rec: Audio.Recording` parameter keep the type-only import for TypeScript; both are erased at runtime. TSC clean (pre-existing i18n-js typedef only); 62/62 jest-expo tests pass. |
| 2026-05-30 | Nutrition Log AI section redesigned — Voice hero leads, Photo secondary | Cost-driven hierarchy flip: voice logging costs ~10× less per scan than photo (Whisper + GPT-4o mini vs GPT-4o vision). The side-by-side `aiRow` (flex row) replaced with `aiStack` (flex column) in `log.tsx`. `VoiceCaptureButton` idle state redesigned from a small dark box to a full-width hero card: `#1e1b4b` deep-indigo background, `rgba(196,181,253,0.15)` border, 👑 PRO badge, 🎙 emoji at 34px, 9 decorative static waveform bars (`rgba(196,181,253,0.55)`), "Speak your meal" title (15px/800), "Voice AI extracts macros instantly" subtitle, "Tap to record →" purple CTA pill. Recording and loading states unchanged (same `heroCard` shell, `recordingBg` or opacity override). `PhotoCaptureButton` replaced its large gradient hero card with a compact pressable row: 📷 emoji + "Photo scan / AI estimates from image" text + AI + PRO badges + chevron. `aiStack` renders VoiceCaptureButton first, then PhotoCaptureButton. 5 new i18n keys in `en.json` + `es.json`: `voice_hero_title`, `voice_hero_subtitle`, `voice_cta`, `photo_row_title`, `photo_row_subtitle`. Design spec: `docs/superpowers/specs/2026-05-30-voice-hero-redesign-design.md`. TSC clean; 62/62 jest-expo pass. |
| 2026-05-30 | PhotoCaptureButton: premium header band + free logging note | Photo compact row elevated with a slim purple header band (`backgroundColor: '#4C1D95'`, `paddingVertical: 6`): `✦ AI POWERED` (amber pill) + `👑 PRO` (white pill) badges across the full width. Body row below is white (`colors.surfaceElevated`). `overflow: 'hidden'` on the outer `photoCard` clips the band cleanly to the card's rounded corners. Loading state keeps a plain centered row (no band). "✓ Manual and barcode logging are always free" (`colors.success` green, 11px/600) added as `freeNote` text immediately below the Manual/Barcode toggle in `log.tsx`; `modeToggleRow`'s `marginBottom` tightened from `spacing.sm` → `spacing.xs` so the note sits flush. New i18n key `free_logging_note` in en/es. TSC clean; 62/62 jest-expo pass. |
| 2026-05-29 | VoiceCaptureButton: 3 hardcoded hex colors replaced with design tokens | `src/components/log/voice-capture-button.tsx` had three hardcoded hex literals: `#0F172A` (button default background), `#7f1d1d` (recording-active background), `#fca5a5` (waveform bars). None had matching tokens. Added 3 new semantic tokens to `GlipraColorTokens` interface, both palettes in `tokens.ts`, and `colors.ts` static export: `buttonDark` (`#0f172a` light / `#2d2047` dark — dark action button that stays dark in light mode, elevates to a purple surface in dark mode), `recordingBg` (`#7f1d1d` light / `#991b1b` dark — recording-active danger state), `recordingWave` (`#fca5a5` both modes — wave bar in the active recording state). Component updated: `backgroundColor: colors.buttonDark`, `backgroundColor: colors.recordingBg`, `backgroundColor: colors.recordingWave`. Zero hardcoded hex values remain in the file. TSC clean (pre-existing i18n-js typedef only); 62 jest-expo tests pass. |
| 2026-05-25 | Barcode scanner — per-serving values fix | Bug: app pre-filled edit fields with per-100g values regardless of actual serving size. For Sour Patch Kids (30g serving), the result showed 367 cal / 86.7g carbs instead of the label values (110 cal / 26g carbs). Root cause: `offProductSchema` did not extract `serving_quantity` from the OFF API response. Fix in 2 files. **barcode-lookup.ts:** `offProductSchema` now includes `serving_quantity: z.number().optional()`. `BarcodeProduct` interface gains `servingWeightG: number | null`. `lookupBarcodeOFF` extracts `servingWeightG = product.serving_quantity > 0 ? product.serving_quantity : null` and includes it in the return. `lookupBarcodeUSDA` always returns `servingWeightG: null` (USDA search API does not expose serving weight). **barcode-scanner-sheet.tsx:** Pre-fill `useEffect` now computes `mult = servingWeightG / 100` (falls back to `1` when null or already 100g) and multiplies every field — protein, calories, carbs, fat, fiber, and all four GLP-1 Watch micronutrients. The `fieldsNote` label is now derived: "Per serving (30g) — edit to match the label" when `servingWeightG` is a non-100g value; "Per 100g — edit to match the label" otherwise. The DB stores per-serving amounts (what the user actually consumed), which is what daily macro card totals require. Commit: 6a709c5. |
| 2026-05-26 | Onboarding gradient hero on all 12 screens | All 12 onboarding screens now open with the Direction B purple-blue gradient hero, matching the Today screen and creating a consistent brand identity from the very first screen. **StepProgress `onDark` prop:** new optional boolean on `src/features/onboarding/components/step-progress.tsx` — when true, renders transparent container (no surface bg, no bottom border), white label text, `rgba(255,255,255,0.2)` track, `rgba(255,255,255,0.9)` fill. **Pattern applied to all 12 screens:** (1) `SafeAreaView` background set to `gradients.hero[0]` so the status-bar area behind the notch matches the gradient start color. (2) `LinearGradient` (full-bleed via `marginTop: -spacing.lg, marginHorizontal: -spacing.lg`) wraps heading + subheading as the first child inside `ScrollView contentContainerStyle`. (3) Heading color changed from `colors.textPrimary` → `'#ffffff'`; subheading from `colors.textSecondary` → `'rgba(255,255,255,0.8)'`; `marginBottom` on subheading removed (heroGradient paddingBottom provides spacing). (4) `StepProgress` gets `onDark` on all step screens (medication through import). **Special cases:** `import.tsx` has a `backHeader` View between StepProgress and ScrollView — background set to `'transparent'` and border cleared; `backArrowText` color changed to `'rgba(255,255,255,0.9)'`. `reveal.tsx` has no StepProgress — a `stepBadge` View ("Step 10 of 10") is included inside the LinearGradient alongside heading + subheading; badge background `rgba(255,255,255,0.2)`, badge text `rgba(255,255,255,0.9)`. **Welcome screens** (`language.tsx`, `appearance.tsx`) use `paddingTop: spacing.xl` (deeper gradient) vs. step screens that use `paddingTop: spacing.lg`. 13 files changed, 353 insertions. 237 Vitest + 66 jest tests pass. Commit: b2b9fec. |
| 2026-05-26 | Red-flag detector fully wired — snooze, full-screen override, DB audit flag | The detection logic (`detectRedFlags`), history fetch (`useCheckInHistory`), and escalation card UI (`EscalationCard`) were already implemented and tested (session 20). Three missing integration pieces shipped in this session. **1. DB audit flag** — `markRedFlagTriggered(userId, date)` added to `src/features/check-in/api.ts`. Uses `startOfDay` / `addDays` (date-fns) to build an inclusive day window and calls `.update({ red_flag_triggered: true })` on all `daily_checkins` rows for the triggering day. Non-fatal: failure logs a `console.warn` but never rethrows — audit log, not user-facing. **2. 24-hour snooze** — new file `src/features/safety/hooks.ts` exports `useRedFlagSnooze()`. On mount, reads key `glipra_red_flag_snooze_until` from AsyncStorage. `isSnoozed` is `true` when a stored timestamp is in the future. `snooze()` writes `Date.now() + 86_400_000` and updates state synchronously. `isLoading: true` while AsyncStorage resolves — treated as snoozed in all callers to prevent a flash of the escalation card on cold start. **3. Full-screen override** — `today-screen.tsx` now evaluates `isTriggered = redFlagDetection?.triggered && !snoozeLoading && !isSnoozed` before the `isLoading` guard. When `isTriggered` is true, the entire Today screen renders only `EscalationCard` (inside a centered `ScrollView` with `escalationContent` style — `flexGrow: 1, justifyContent: 'center'`); no other content is shown. The old inline conditional `{redFlagDetection?.triggered && <EscalationCard ... />}` inside the main `ScrollView` was removed. `handleDismiss = async () => await snooze()` replaces the previous `onDismiss={() => {}}` no-op. A `React.useEffect` keyed on `[redFlagDetection?.triggered, userId, today]` calls `markRedFlagTriggered` fire-and-forget (`.catch(() => {})`). New imports: `useAuthStore` (for `userId`), `markRedFlagTriggered`, `useRedFlagSnooze`. `pnpm tsc --noEmit` clean (pre-existing i18n-js typedef only); 66/66 jest tests pass; 237/237 Vitest tests pass. Commit: f6ee17f. |
| 2026-05-26 | D6 — Micro-animations on Today screen | Three animations wired to data arrival: (1) **Protein ring spring fill** — `Animated.createAnimatedComponent(Circle)` from `react-native-svg`; `useSharedValue(circumference)` initialized as empty ring; `withSpring(targetOffset, { damping:18, stiffness:80 })` fires in `useEffect` keyed on `progress`; `useAnimatedProps` drives `strokeDashoffset` on the UI thread. (2) **Readiness score count-up** — plain JS `setInterval` (36 steps, 1200ms, ease-out-cubic); no Reanimated worklet overhead needed for a number; `displayScore` state replaces static `{readiness.score}` in the inline card in `today-screen.tsx`. (3) **Streak card pop-in** — `Animated.View` wrapper in `streak-card.tsx`; `useSharedValue` scale `0.85→1.0` (`withSpring` damping:14 stiffness:120) + opacity `0→1` (`withTiming` 280ms) in `useEffect([], [])` fires on mount (card is conditionally rendered after streak data loads). 3 files changed. 237 Vitest + 66 jest tests pass. Commit: fdf89d2. |
| 2026-05-26 | D10 — Protein floor reveal card | Upgraded `protein-target.tsx` result card from a plain white surface to a premium clinical artifact. Uses the Direction B outer/inner shadow-wrapper pattern (established in D3/D4/D9): outer `View` carries `shadows.md + backgroundColor: colors.surface` as the iOS shadow host; inner `LinearGradient` (`gradients.hero`, `overflow: 'hidden'`) is the visible card face. Added: faint ℞ watermark (`rgba(255,255,255,0.08)`, 64px, absolute top-right); 52px bold white hero number; formula breakdown line (e.g. `"82.5 kg × 1.6 g/kg"`) derived from `result.baseWeightUsedKg` × `ACTIVITY_MULTIPLIERS[activityLevel]`; maintenance multiplier (×0.9) and kidney-disease cap (0.8 g/kg) correctly reflected in formula; formula hidden when `flooredByPregnancy` (80g minimum doesn't fit weight×multiplier explanation); adjustment badges unified as frosted-glass rgba pills. `ACTIVITY_MULTIPLIERS` exported from `protein.ts` (additive export, no test impact). 2 files changed. 237 Vitest + 66 jest tests pass. Commit: 20a3d04. |
| 2026-05-26 | D7 — Skeleton loading states | Replaced full-screen `ActivityIndicator` spinners with shimmer ghost cards on Today, Injection Sites, and Weight screens. **SkeletonBox primitive** (`src/components/ui/skeleton-box.tsx`): gray `View` with `overflow: 'hidden'`; `Animated.View` child carries a 250px-wide `LinearGradient` (transparent→white 55%→transparent) that translates from -200 to +300 via `withRepeat(withTiming(300, { duration:1000, easing:Easing.linear }), -1, false)` — infinite left-to-right shimmer sweep. **TodaySkeleton** (`src/components/ui/today-skeleton.tsx`): composite ghost layout that mirrors Today's real content — real `LinearGradient` hero (matching `gradients.hero` + `heroGradient` padding) with two ghost boxes for greeting (h:28, opacity:0.35) and date (h:14, opacity:0.25); content area with readiness ghost (h:200, `radius.xl`), two-column metrics row (h:180, `radius.lg` each), section label ghost, and three action card ghosts (h:72 each). Scroll is disabled so the ghost layout stays static. **today-screen.tsx:** `isLoading` branch now returns `<TodaySkeleton />` inside a `SafeAreaView` — no more ActivityIndicator on blank background; `loadingContainer` style removed. **injection-sites.tsx:** `loadingCard` contents replaced with 3 stacked `SkeletonBox` rows (label ghost h:9, value ghost h:17, button ghost h:34) mimicking the rotation card's label+value+button structure; card style changed from fixed `height: 72` with centering to `padding: spacing.md + gap: spacing.sm` so ghost rows breathe. **weight.tsx:** `summaryCard` loading branch replaced with 3 ghost rows (label h:12, value h:56, date h:12) mimicking the LATEST weight display. `ActivityIndicator` removed from RN imports in both files. 5 files changed (2 new, 3 modified). 66/66 jest tests pass; 237/237 Vitest tests pass. Commit: 2360006. |
| 2026-05-26 | EAS build 9a15cf1b — red-flag detector + all D1–D6 changes | New Android dev build (ID `9a15cf1b`) triggered May 26 from commit `f6ee17f` (red-flag detector). This supersedes build 58aaa2f3 as the active APK on device. APK: `https://expo.dev/artifacts/eas/k2z9PBWYhA1TFdRfxAYDFn.apk`. Note: `react-native-health-link` remains removed from package.json — Health Connect re-integration requires minSdk 26 bump + re-add package + new build (deferred, quota was exhausted). The D7–D10 visual changes and dark mode contrast fixes (all post this commit) are deployed via `eas update` OTA on top of this build. |
| 2026-05-26 | Dark mode contrast fixes — dose picker, food input, mode toggle | Three components used `colors.white` as a literal background inside dark-mode-aware contexts, making `textPrimary = #f5f3ff` (near-white) invisible against white. Spotted on device. **Root cause:** `colors.white` is defined as `'#ffffff'` in both light and dark token sets — it never changes — so using it as a card/input background bypasses the theme system entirely. **Fix pattern:** replace `colors.white` with `colors.surface` in the three offending styles; `surface = '#ffffff'` in light mode (no visual change) and `'#1e1533'` in dark mode (the standard dark card background). **Files:** (1) `src/components/ui/select.tsx` line 126 — `Options` bottom sheet `backgroundStyle.backgroundColor`: `colors.white` → `themeColors.surface`. This file already imported `useTheme()` and had `themeColors` available; the `backgroundStyle` prop was the only place still using the static import. Dose list items now render on a dark sheet in dark mode, giving `textPrimary` excellent contrast. (2) `src/app/(app)/log.tsx` makeStyles — `modeButtonActive.backgroundColor`: `colors.white` → `colors.surface`. Manual/Barcode toggle active tab is now a dark raised button with crisp `textPrimary` text. (3) `src/components/log/manual-entry-form.tsx` makeStyles — `inputFocused.backgroundColor`: `colors.white` → `colors.surface`. Focused food-name input stays dark; typed text is clearly legible. 3 files changed, 3 insertions, 3 deletions. 66/66 jest tests pass; 237/237 Vitest tests pass. Commit: c852fe6. |
| 2026-05-26 | D9 — Milestone card and toast gradient upgrade | Unlocked achievement cards and the milestone toast banner now use the Direction B purple-blue gradient, matching the Today header and onboarding hero. The `accentColor`-tinted flat surface approach was replaced with the outer/inner shadow-wrapper pattern from D3/D4. **milestone-card.tsx:** `MilestoneCard` rewritten — outer `View` (`cardOuter`) carries `shadows.md + backgroundColor: colors.surface` as the iOS shadow host; inner `LinearGradient` (`cardInner`, `gradients.hero`, `overflow: 'hidden'`) is the visible card face at 280x180px. All text white on gradient: title `'#ffffff'`, subtitle `'rgba(255,255,255,0.8)'`, date `'rgba(255,255,255,0.6)'`. NEW badge: frosted glass `rgba(255,255,255,0.25)`. Share button: `rgba(255,255,255,0.2)` background, `rgba(255,255,255,0.35)` border. `LockedMilestoneCard` unchanged (gray placeholder). **milestone-toast.tsx:** same outer/inner pattern — outer `View` (`toastOuter`) carries absolute positioning + shadow; inner `LinearGradient` (`toastInner`) is the row with `overflow: 'hidden'`. `borderLeftWidth`/`borderLeftColor` removed. Label `rgba(255,255,255,0.8)`, title `'#ffffff'`. **milestones.ts:** removed the last static `import { colors } from '@/theme/colors'` in the codebase (pure `.ts` data file, cannot use hooks); all `accentColor` fields replaced with hex literals (`colors.primary` to `'#6d28d9'`, etc.). 3 files changed, 106 insertions. 237 Vitest + 66 jest tests pass. Commit: 2100f94. |
| 2026-05-28 | Shot Day Prep Checklist — feature complete (commits 5bdd20b–84c96cb) | 5 files shipped. `checklist-data.ts`: 5 pharmacist-authored items (hydrated, breakfast, rotate_site, anti_nausea, protein_plan) as `ReadonlyArray<ChecklistItem>`; `getChecklistStatus()` dedup-safe via `new Set(...).size`, filters unknown IDs from stale DB rows. `shot-day-checklist.test.ts`: 9 Vitest tests covering empty, unknown-ID filter, all-5 done, 4-item not-done, totalCount stability, duplicate-ID dedup. `api.ts`: `fetchShotPrepLog` splits network errors (throw) from empty rows (null); `upsertShotPrepLog` uses `onConflict: 'user_id,injection_date'`, `fullyCompleted` derived via `getChecklistStatus`, timestamps via `formatISO` (date-fns rule). `hooks.ts`: `useShotDayPrep` — optimistic local state seeded from DB once per `injectionDate`; `committedItems` ref provides stable rollback snapshot; `onMutate` awaits `cancelQueries` to prevent stale refetch clobber; `onSuccess` uses `setQueryData` instead of `invalidateQueries` (re-fetch would be no-op due to initialization guard). `shot-prep.tsx`: `LinearGradient gradients.hero` hero header + `‹` Pressable back + Rx badge + progress strip (green on done, phaseInjectionDay otherwise) + success-green done banner (`successLight` bg, `success` border) + `DisclaimerBanner tier={2}` with pharmacist disclaimer (Rule 8). Entry point: Today screen "Shot Day Prep" card appears only when `injectionCycle?.phase === 'injection_day'`. Route pre-registered in `_layout.tsx` as `href: null`. 62 jest-expo + 319 Vitest tests pass. Follow-up: i18n for screen copy — completed session 28 (see `shotPrep` namespace entry below). |
| 2026-05-28 | EAS Android dev build 15421fb7 — F2 + health-link + PostHog/Sentry | New Android dev build (ID `15421fb7`) completed 2026-05-28. Supersedes build `9a15cf1b`. Includes: F2 Micronutrient Watch, all D-series visual upgrades, `react-native-health-link` (re-added at minSdk 26 — `android.minSdkVersion` bumped in `app.config.ts`), PostHog and Sentry native modules now live (keys filled in `.env.development`). Install: `https://expo.dev/accounts/waliabdul/projects/glipra/builds/15421fb7-759e-4f68-99cc-8669e2695184`. |
| 2026-05-28 | F3 — Prescriber Visit PDF export un-stubbed | Removed `isMockAIEnabled()` guard from `useGeneratePdf()` in `src/features/visit-prep/hooks.ts` — the `generate-visit-pdf` edge function uses only `pdf-lib`, zero OpenAI, so the mock gate was wrong. Wired real 28-day protein average: `useProteinHistoryPerDay(28)` (already existed in `src/features/progress/hooks.ts`) is now called inside `useVisitPrepData()`; average computed over `hasData: true` days only. Stub `Alert` in `src/app/(app)/visit-prep.tsx` updated to reflect actual share status without implying missing packages. PDF generation and sharing now fully functional in the EAS dev build. Commit: `ce5ad50`. |
| 2026-05-28 | Auth redirect fix + stale Obytes login files deleted | `(app)/_layout.tsx` was redirecting signed-out users to `/login` (a stale Obytes route) instead of `/(auth)/sign-in`, causing a crash: `TypeError: _useAuthStore.useAuthStore.use.signIn is not a function` — `LoginScreen` referenced a non-existent `signIn` selector. Fix: one-line change in `_layout.tsx` (`href="/login"` → `href="/(auth)/sign-in"`). Stale files then deleted: `src/app/login.tsx`, `src/features/auth/login-screen.tsx`, `src/features/auth/components/login-form.tsx`, `src/features/auth/components/login-form.test.tsx`. Test baseline adjusted from 66 to 62 (4 tests in deleted `login-form.test.tsx` were for the dead login form). 62/62 is now the correct jest-expo baseline. Commit: `37aabe1`. |
| 2026-05-28 | Analytics event instrumentation — 5 missing PostHog events wired | The PostHog wrapper and provider were fully set up but 5 events from the ARCHITECTURE.md taxonomy were unfired. All wired in a single commit across 5 files. (1) `INJECTION_LOGGED` constant added to `src/lib/analytics.ts` EVENTS object. (2) `PAYWALL_VIEWED` (useEffect on mount, `{ feature: featureName }`) + `PURCHASE_STARTED` / `PURCHASE_COMPLETED` (`{ product_id }`) wired in `src/features/subscription/paywall-screen.tsx`. (3) `RED_FLAG_DETECTED` (`{ flag_count: redFlagDetection.patterns?.length ?? 1 }` — no flag type codes, Rule 2) wired to the existing red-flag useEffect in `src/features/today/today-screen.tsx`. (4) `INJECTION_LOGGED` (no properties) wired to `useLogInjectionSite` `onSuccess` in `src/features/injection-sites/hooks.ts`. (5) `ONBOARDING_COMPLETED` wired in `handleStart()` in `src/app/onboarding/reveal.tsx` after `setItem('IS_FIRST_TIME', false)`. Full event taxonomy from ARCHITECTURE.md is now instrumented. Commit: `91e2e8e`. |
| 2026-05-27 | F2 — Micronutrient Daily Watch shipped — Pro-gated card replacing raw GLP-1 Watch block | **Design: Direction C** (gradient header + "N gaps today" urgency chip + 2×2 tile grid with status dots + mini bars + amber gap banner). **Architecture:** self-contained `MicronutrientWatchCard` (`src/features/food-log/micronutrient-watch-card.tsx`) — calls `useDailyMacros()` directly (React Query deduplicates), renders three states: Pro+data (full grid), Pro+no data (🔬 placeholder), free user (ProGate paywall). Pure logic in `src/features/food-log/micronutrient-constants.ts`: `MICRONUTRIENT_RDAS` (Mg 420mg, Zn 11mg, B12 2.4mcg, VitD 600IU), `getNutrientPct` (cap 100, NaN-guarded), `getNutrientStatus` (green ≥80% / amber 50-79% / red <50%, zero-RDA-guarded), `getGapCount` (count <50% of RDA), `getGapBannerText` (food-strategy tip for up to 2 gap nutrients — Rule 9/10 compliant). `MicronutrientData` type is derived (`{ [K in NutrientKey]: number }`) to stay in sync with `MICRONUTRIENT_RDAS` automatically. `DisclaimerBanner tier={2}` inside card body (Rule 8). **Gradient:** `expo-linear-gradient` `gradients.hero` spread (`[...gradients.hero]`) — auto-adapts light/dark from tokens. **Per-status styles:** `statusDotGreen/Amber/Red` + `barFillGreen/Amber/Red` in `makeStyles` so `NutrientTile` has a single `useTheme()` source (parent). `NutrientTile.t` typed as `TFunction` (react-i18next). **Removed:** entire GLP-1 Watch raw number block (lines 120-155) from `daily-macro-card.tsx`; `b12Mcg/vitaminDIu/magnesiumMg/zincMg/hasMicronutrients` stripped from its `useDailyMacros()` destructure; 7 dead styles removed. **Card wired** in `src/app/(app)/log.tsx` after `DailyMacroCard` (always rendered — handles empty state internally). **i18n:** 10 keys added under `"log"` namespace in both `en.json` + `es.json`. **Tests:** 19 Vitest cases in `src/__tests__/micronutrient-constants.test.ts` (all branches incl. negative actual, zero RDA, multi-gap banner). `jest.config.js` `testPathIgnorePatterns` extended with `/src/__tests__/` + `/src/features/today/readiness-display\.test\.ts$/` to prevent jest-expo picking up Vitest-only files. Final counts: 310/310 Vitest, 66/66 jest-expo, TypeScript clean. |
| 2026-05-27 | Readiness score redesign — transparent factor card with action tip | The opaque 0-100 score with generic tier guidance replaced with a two-layer architecture that surfaces exactly why the score landed where it did. **Calculator layer** (`readiness-calculator.ts`): `ReadinessResult` now returns `factors: FactorDelta[]` (only non-zero deltas, each typed `FactorId`) instead of a `guidance` string; `guidanceFor()` removed entirely. Three new inputs added: `prevDayProteinRatio` (yesterday consumed/floor, -10 if <0.8, +5 if >=1.0), `newDoseWeek` (true when `medicationStatus === 'starting'`, -10), `streakActive` (lastStreakDate = today or yesterday, +5). **Display layer** (`readiness-display.ts`): `buildReadinessCard(result, injectionPhase, t)` converts raw deltas to a `ReadinessCard` with headline from `t('readiness.headlines.<phase>')`, factors sorted negatives-first (most negative at top) then positives, tip selected from worst negative factor (tie-break: injection_phase > protein_pace > others; injection_phase tip key includes phase suffix). Zero-delta factors excluded. **Hooks** (`hooks.ts`): added private `useYesterdayProtein()` hook (mirrors `useDailyMacros()` pattern for `subDays(new Date(), 1)`); derived `prevDayProteinRatio`, `streakActive`, `newDoseWeek` from existing data; returns `readinessCard: ReadinessCard | null` replacing `readiness: ReadinessResult | null`. **UI** (`today-screen.tsx`): card layout is now headline + 2px brand inset left border + divider + factor rows (colored dot + label + delta in success/warning/error) + divider + demoted score row (24px, not 80px hero) + amber tip box. Count-up animation unchanged, fed from `readinessCard.score`. **i18n**: 5 phase headlines + 7 factor labels + 11 tip keys added to both `en.json` and `es.json` under `"readiness"` namespace. **Tests**: `readiness-calculator.test.ts` updated for new `ReadinessResult` shape + 6 new cases; `readiness-display.test.ts` new (17 tests); `vitest.config.ts` updated to include new test file. 291/291 Vitest tests pass; `readiness-calculator.ts` at 100% branch coverage. 7 files changed, 2 new files. Commits: a87ca6f, ce29afd, 3169d6b, 091f471, 561cc8a (dosepath master). |
| 2026-05-28 | Shot Day Prep i18n — Spanish translations for screen and checklist items | `shot_prep` namespace added to `en.json` + `es.json` (14 keys each): header title/subtitle, progress labels with `{{completed}}/{{total}}` interpolation, done banner title/body, pharmacist disclaimer, "Pharmacist note" badge, and all 5 checklist item title+detail pairs. `shot-prep.tsx` wired to `useTranslation()`; checklist items translated inline via spread `{ ...item, title: t(\`shot_prep.items.${item.id}_title\`), detail: t(...) }` — zero changes to `ChecklistItemRow` props interface. `checklist-item-row.tsx` badge text replaced with `t('shot_prep.pharmacist_note')`. 62 jest + 344 Vitest pass. Commit: `aef4279`. |
| 2026-05-28 | Medication Level Estimator — Rule 4 Vitest tests + LevelChart SVG | **Tests** (`src/__tests__/medication-level-calculator.test.ts`): 26 cases across 4 describe blocks — `estimateLevel` (returns full dose at day 0, half-dose at one half-life for sema/tirz/lira, fallback half-life for unknown med, multi-half-life decay, compounded med map), `generateLevelCurve` (length, first point, monotonic decrease, day-index equality), `generateSteadyStateCurve` (shape, today point positive, steady-state > single-dose, future projection, past window, daily liraglutide, YYYY-MM-DD format, non-negative levelMg), `constants` (FALLBACK_HALF_LIFE, sema/tirz/dulaglutide half-life values). Rule 4 compliant. **LevelChart** (`src/components/medication-level/level-chart.tsx`): SVG PK concentration curve. PADDING `{top:16,right:12,bottom:28,left:40}`, `toX`/`toY` helpers in `useMemo` (called before any early return — Rules of Hooks). All computations inside useMemo; component returns null if `computed == null`. Gradient fill under curve via `Defs + LinearGradient + Path`. Concentration line via `Polyline`. Amber dashed today vertical line + today dot on curve (`todayInRange` guard). Purple injection-event dots on baseline. X-axis date labels with "Today" slot collision fix (`isToday || !seenSlots.has(slot)`). Y-axis 3 ticks (max/mid/0). `BRAND` and `AMBER` derived from `colors.primary` / `colors.warning` (not hardcoded). Commits: `b9713bd` (tests), `df77038` (LevelChart after Rules of Hooks fix). |
| 2026-05-28 | Android back button blank screen fix | Two root causes: (1) `GestureHandlerRootView` in `src/app/_layout.tsx` had `style={{ flex: 1 }}` with no `backgroundColor` — Android exposed a bare white frame for the few frames between navigation transitions. Fix: added `backgroundColor: '#f7f9fc'` to `styles.container` (hardcoded because this component sits outside `GlipraThemeProvider`). (2) No `BackHandler` intercept — when the tab stack was exhausted, React Navigation navigated to `(auth)` (the `initialRouteName`), which immediately redirected back to `(app)`, producing a blank flicker frame. Fix: `BackHandler.addEventListener('hardwareBackPress', ...)` inside `TabLayout` in `src/app/(app)/_layout.tsx` — calls `BackHandler.exitApp()` when `!router.canGoBack()` (returns `true` to consume the event), otherwise returns `false` to let React Navigation handle sub-screen back navigation normally. Subscription cleaned up on unmount. 62/62 jest tests pass. Commits: `707e1fe` (background color), `dc0c960` (BackHandler). |
| 2026-05-28 | Android back button fix v2 — `router.canGoBack()` replaced with `usePathname()` | First fix (dc0c960) still produced a white screen because `router.canGoBack()` checks Expo Router's **entire** navigation history, which includes the auth + onboarding flow the user just completed — so it always returns `true` even when on a root tab. The handler returned `false`, React Navigation navigated backward into `(auth)`, and the white screen flashed before the redirect fired. Fix: replaced `router.canGoBack()` with `usePathname()` from `expo-router`. A `Set` of the 5 tab root paths (`'/'`, `'/progress'`, `'/log'`, `'/injection-sites'`, `'/coach'`) is checked on each back press. If the current path is in the set, `BackHandler.exitApp()` is called and the event is consumed. If not (user is on a sub-screen like `/shot-prep` or `/add-shot`), return `false` and let React Navigation pop the history entry normally. The `useEffect` dependency array includes `pathname` so the listener re-registers whenever the route changes. `router` import removed (unused after the change). Confirmed working on device. Commit: `c831b4f`. |
| 2026-05-28 | Weight trend chart readability fix — y-axis unit conversion, EWMA sparse-data guard, gain/loss label | Three visual bugs fixed across 3 files in a single commit (`5eb449f`). **Bug 1 — Y-axis always showed kg regardless of unit preference:** `EwmaChart` (`src/components/weight/ewma-chart.tsx`) now accepts a `unit?: 'kg' | 'lbs'` prop. A `formatTick(kg)` helper converts raw kg values to `Math.round(kgToLbs(kg))` when `unit === 'lbs'`, otherwise `kg.toFixed(1)`. A small `SvgText` unit label ("lbs" or "kg") added above the y-axis at `y={PADDING.top - 4}`. **Bug 2 — EWMA trend line diverged from data dots with sparse logs:** With `EWMA_ALPHA = 0.1` and only 2 entries the smoothed line barely moves from its seed value (onboarding profile weight), placing the line far below the actual data dots. Fix: tracked `ewmaPointsArr` count separately from the joined `ewmaPoints` string; `Polyline` now guarded by `ewmaPointsArr.length >= 3`. `WeightTrendCard` (`src/components/progress/weight-trend-card.tsx`) shows a "Keep logging to see your trend" placeholder (⚖️ icon + body text, `sparseState` styles) when `logs.length < 3` — preventing the broken chart from ever rendering to the user. **Bug 3 — "Total Lost: +73.6 lbs" labeled a weight gain:** `WeightResultsCard` (`src/components/progress/weight-results-card.tsx`) now derives `isGain = totalLostKg < 0`, then sets `totalLostLabel` ("Total Lost" / "Total Gained"), `totalLostColor` (`colors.success` green / `colors.textSecondary` neutral), and `totalLostPrefix` ("-" / "+") from it. `MetricCell` extended with optional `valueColor?: string` prop to apply the dynamic color without overriding the dimmed state logic. i18n: `progress.results_card.total_gained` key added to `en.json` ("Total Gained") and `es.json` ("Total ganado"). 62/62 jest-expo tests pass. Commit: `5eb449f`. |
| 2026-05-28 | Medication Level Estimator — Rule 4 tests + LevelChart SVG complete (session 27) | Two missing pieces shipped to complete the feature. **Task 1: Rule 4 compliance** — `src/__tests__/medication-level-calculator.test.ts` created with 26 Vitest tests across 4 suites: `estimateLevel` (8 tests — zero dose, day-0 full dose, half-life verification for semaglutide 7d / tirzepatide 5d / liraglutide 0.5d, unknown medication fallback, asymptotic decay, compounded medication half-lives), `generateLevelCurve` (5 tests — length, first point, monotonic decrease, default 14 days, day-field identity), `generateSteadyStateCurve` (8 tests — point shape, today offset positive, steady-state > single dose, future projection, past window, liraglutide daily, date format YYYY-MM-DD, non-negative values), `constants` (4 tests — FALLBACK_HALF_LIFE=7, semaglutide=7, tirzepatide=5, dulaglutide=4.5). Rule 4 satisfied — 344/344 Vitest tests pass. Commit: `b9713bd`. **Task 2: LevelChart SVG** — `src/components/medication-level/level-chart.tsx` created (previously a stub). Full pharmacokinetic concentration chart using react-native-svg: PADDING object pattern matching `ewma-chart.tsx`; `toX(offset)` + `toY(level)` helpers inside `useMemo`; gradient fill under curve (`Defs + SvgLinearGradient + Path`); concentration line (`Polyline`); today dashed vertical line + amber dot on curve; injection event dots on x-axis baseline; x-axis date labels every `labelIntervalDays` (always includes "Today"); y-axis ticks at maxLevel / midpoint / 0. **Quality fixes applied:** `BRAND`/`AMBER` derived from `useTheme()` colors (dark mode support — `colors.primary` + `colors.warning`); all coordinate mapping in `React.useMemo`; today line gated on `todayInRange` check; "Today" label slot collision fixed (`isToday || !seenSlots.has(slot)`); `accessible={true}` + `accessibilityLabel` on Svg. **Critical hooks-order fix:** `useMemo` originally placed after the `curve.length < 2` early return (Rules of Hooks violation). Restructured: `useMemo` called unconditionally first, early-return guard inside memo body returns null sentinel, component then checks `if (computed == null) return null` after all hooks. 62 jest-expo + 344 Vitest tests pass. TypeScript clean (only pre-existing i18n-js TS2688). Commits: `a5222fd`, `f9dbba5`, `df77038`. **Feature verification:** i18n keys confirmed present in both `en.json` and `es.json` (`med_banner.*` namespace — 10 keys each). All Rule 4 / Rule 8 / Rule 6 / Rule 1 requirements verified. |
| 2026-05-28 | Shot Day Prep i18n — corrected to `shotPrep` namespace; checklist items remain hardcoded | Prior commit `aef4279` used `shot_prep` (snake_case) with non-standard key names and incorrectly translated all 5 checklist items via `t('shot_prep.items.${id}_title')` spread. Two problems: (1) project convention is camelCase namespaces; (2) `checklist-data.ts` items are marked "Content locked — do not rewrite without pharmacist review" and must stay hardcoded English until pharmacist-reviewed Spanish translations are provided. **Corrected implementation:** `shotPrep` namespace (10 keys) added to `en.json` and `es.json`: `title`, `subtitle`, `progressInProgress` (`{{completed}} of {{total}} steps complete`), `progressAllDone`, `doneBannerTitle`, `doneBannerBody`, `siteTrackerTitle` + `siteTrackerBody` (pre-populated for future injection site tracker section — not yet wired to any UI element), `disclaimer`, `pharmacistNote`. `shot-prep.tsx` uses all `shotPrep.*` keys; `CHECKLIST_ITEMS.map` passes `item` directly (no title/detail overrides). `checklist-item-row.tsx` badge uses `t('shotPrep.pharmacistNote')`. Stale `shot_prep` namespace (including `items.*` sub-keys) removed from both JSON files. **Credential fix:** ES `shotPrep.disclaimer` initially used "farmacéutico certificado" (certified) — corrected to "farmacéutico con licencia" (licensed) to match the EN "licensed pharmacist"; CLAUDE.md liability rule #2 requires approved pharmacist credential language. 62 jest + 344 Vitest pass. Commits: `1846f16`, `186c363`, `c0a2281`, `5b3c34b`. |
| 2026-05-28 | Weight chart — X-axis date labels + right-edge clipping fix (session 29) | Two sequential fixes to `EwmaChart` and the weight screen. **X-axis date labels** (`src/components/weight/ewma-chart.tsx`): `PADDING.bottom` widened from 28 to 36 to give labels breathing room. Collision-filtered label list built after `rawLinePoints`: walks logs in chronological order, emits a `SvgText` only when its pixel X is ≥ 30 px past the previous rendered label. Labels use `format(parseISO(log.loggedAt), 'MMM d')` (e.g. "May 1", "May 28"), `textAnchor="middle"`, `fontSize={9}`, centered at `y = PADDING.top + plotH + 14`. `format` added to the existing `date-fns` import. 62/62 tests pass. Commit: `095f5bd`. **Right-edge dot clipping fix** (`src/app/(app)/weight.tsx`): `chartWidth` was computed as `width - spacing.lg * 2` (= width - 48), but the `chartCard` has `padding: spacing.md = 16` on each side — making the SVG 32 px wider than the card's content area. The card's `borderRadius` clips the overflow on iOS, cutting off the rightmost dot. Fix: `chartWidth = width - spacing.lg * 2 - spacing.md * 2` (mirrors the correct formula already used in `progress.tsx`). Commit: `b4fc5e1`. |
| 2026-05-29 | PROGRESS.md brought current + todo list generated (session 35) | PROGRESS.md updated from session 27 to session 34 — added items 35-41: in-app legal screens, glipra.com legal page rewrites, docs/legal/ markdown sources, em dash audit, glipra.com feature section expansion, preview APK beta distribution, voice logging. Stack additions table updated with expo-av ~16.0.8. Comprehensive prioritized todo list generated covering: legal blockers (attorney review, address placeholders, email confirmation), account blockers (Apple Developer, RevenueCat iOS P8 key, OpenAI secret), new EAS dev build needed (expo-av + datetimepicker native), linked accounts feature (only unbuilt Pro feature), glipra.com index.html updates, testing/coverage gaps, and V2 items. |
| 2026-05-29 | Voice logging implementation complete (session 34) | Killer Differentiator #4 shipped. 9-task implementation across 10 commits (`031bb7b`→`a6c7840`). **New files:** `supabase/functions/transcribe-food/index.ts` (Deno edge function: Whisper transcription → GPT-4o mini food extraction → Zod validation → `ai_invocations` logging; 100/day circuit-breaker; static system prompt to prevent transcript injection; HTTP 500 on unhandled errors); `src/features/food-log/voice-recognition.ts` (client wrapper, mock gate, VOICE_FALLBACK); `src/components/log/voice-capture-button.tsx` (Pro-gated via RevenueCat, expo-av recording, tap-to-start/stop, unmount cleanup useEffect, CANCELLED paywall result correctly excluded from fall-through). **Modified:** `photo-review-sheet.tsx` renamed to `ai-review-sheet.tsx` — component renamed `AIReviewSheet`, added optional `transcript?: string` prop rendered as a quoted italic block above the food fields; `transcript` field added to `RecognitionResult` interface (optional, photo path leaves it undefined); `MOCK_VOICE_PARSE` in `mockAI.ts` restructured from `foods[]` array shape to flat `RecognitionResult` shape; `log.tsx` wired with two-button AI row (Photo + Voice side-by-side), voice state, `handleAudioCaptured` async callback, voice `AIReviewSheet` with transcript prop; 8 i18n keys added to `en.json` and `es.json`. **Tests:** 4 new Vitest tests in `voice-recognition.test.ts` covering mock path; total suite 414 passing (352 Vitest + 62 jest-expo). **Deployed:** `transcribe-food` function live on Supabase project `cuxndkreewlcmijxlgyg`. **Requires new EAS build** before voice recording works on device (expo-av is a native module). Mock path fully functional in Metro. |
| 2026-05-29 | Voice logging Pro gate decision (session 33) | Voice logging is fully Pro-gated from day one with no free tier. Previous spec allowed 5 voice logs/day on free. Rationale: voice is the highest-friction differentiator to replicate and should drive Pro conversions rather than being partially available for free. Updated CLAUDE.md subscription tier comment and ARCHITECTURE.md edge function rate limit table (`parse-meal-text` and `transcribe-voice` both changed from free-tier quotas to "Locked (Pro only)"). Also locked in voice logging UX design decisions: (1) placement as second hero button alongside Photo in the Log screen's AI section — both sit as equal-weight buttons above the Manual/Barcode toggle; (2) tap-to-start / tap-to-stop recording UX with animated waveform — preferred over hold-to-record due to nausea-day use case where shaky hands make sustained press unreliable. |
| 2026-05-28 | Em dash audit and Spanish i18n diacritics fix (session 32) | Full codebase sweep for em dashes in user-facing copy (CLAUDE.md rule). Two parallel audit agents ran against the full `src/` tree and `src/translations/`. **Em dash fixes (22 files, commit `559a97e`):** (1) `en.json` - 3 strings fixed: progress tips `weight` and `streak`, photo `photo_comment_subtitle` (`Optional — helps` -> `Optional: helps`). (2) `es.json` - matching 2 Spanish strings. (3) `src/features/content-cards/data.ts` - 25 em dashes removed from all pharmacist-authored `keyTakeaway` and `body` fields across all 25 cards; parentheses, colons, and hyphens used contextually. (4) `src/components/today/med-level-banner.tsx` - 5 PHASE_HEADLINE strings updated (e.g. `'Injection day: dose administered'`). (5) `src/components/today/streak-card.tsx` - 2 accessibility labels. (6) `src/components/log/barcode-scanner-sheet.tsx` - 3 text strings + 1 `placeholder="-"`. (7) `src/components/log/manual-entry-form.tsx` - 2 `placeholder="-"`. (8) `src/features/food-log/photo-review-sheet.tsx` - `'Low confidence: please verify'` + `'AI estimates: verify for precision'` + 1 placeholder. (9) `src/app/(app)/legal/privacy-policy.tsx` - all 25 em dashes (list separators and section headings) replaced with colons; headings now e.g. `'7. Washington Residents: My Health My Data Act'`. (10) `src/app/(app)/legal/terms-of-service.tsx` - medical disclaimer parenthetical rewritten with parens; `'14. Dispute Resolution: Mandatory Arbitration'`. (11) Onboarding screens: `reveal.tsx` (2), `protein-target.tsx` (1 empty-state placeholder), `import.tsx` (Alert string), `safety.tsx` (1). (12) App screens: `check-in.tsx`, `consent.tsx`, `discontinuation-mode.tsx` (2), `injection-sites.tsx`, `maintenance-mode.tsx`, `medication-level.tsx`, `health-import.tsx`. (13) `src/components/progress/check-in-symptom-card.tsx` - empty-state dash. Code comments (`// ...` and `/** ... */` JSDoc) left unchanged as they are not user-facing. **Spanish diacritics fixes:** 9 missing accent marks corrected in `es.json` `readiness.headlines`, `readiness.factor_labels`, and `readiness.tips`: `Dia` -> `Día`, `inyeccion` -> `inyección`, `proteina` -> `proteína`, `Nauseas` -> `Náuseas`, `Energia` -> `Energía`, `habito` -> `hábito`, `mediodia` -> `mediodía`, `ajustandose` -> `ajustándose`, `proxima` -> `próxima`, `dia mas` -> `día más`, `dificiles` -> `difíciles`, `musculo` -> `músculo`, `pequenas` -> `pequeñas`. **Spanish i18n completeness:** All namespaces verified complete (progress, medication, med_banner, shotPrep, settings). No missing keys between en.json and es.json. Legal screens (`privacy-policy.tsx`, `terms-of-service.tsx`) are intentionally hardcoded English per ToS Section 16 ("English version controls"). 62/62 jest-expo tests pass. |
| 2026-05-28 | glipra.com legal pages audit and full rewrite (session 31) | Audited the live glipra.com site against the current app state and docs/legal/ source documents. Found two critical issues: (1) `docs/privacy.html` was a waitlist-era stub (10 sections, email-capture only) with "LEGAL ENTITY NAME TO BE CONFIRMED" still in the document — completely inadequate now that the app collects weight, medication, injection logs, and symptoms; (2) `docs/terms.html` had at least 6 unfilled yellow placeholders (legal entity name, state, liability cap, testimonial verification status, refund terms, mailing address). Both pages were fully rewritten to match the comprehensive `docs/legal/` markdown sources. **privacy.html** (new): Leonava/Texas legal entity filled in; 15-section health-app policy including full health-data inventory table (account/profile/medication/injection/weight/symptom/meal/notes categories with sensitivity flags), Washington My Health My Data Act dedicated section (all four WMHMD rights, 45-day response, identity verification note), CCPA/CPRA rights block, Texas TDPSA + AG appeal path, AI feature data handling clarification (meal photos deleted within 24 hours, prompts anonymized), subprocessor table (Supabase/OpenAI/RevenueCat/PostHog/Sentry/Resend/Apple/Google with health-data column), data retention schedule, children's privacy (13+). DRAFT banner + attorney-review notes retained. **terms.html** (new): Leonava/Texas throughout; full medical disclaimer (Section 3) with emergency 911 notice; AAA mandatory arbitration with remote hearing, 30-day opt-out, class action waiver in all-caps (Section 14); $50 liability cap; Texas governing law; DRAFT banner + attorney-review notes retained. Commit: `dc045f6`, pushed to GitHub Pages. **Remaining index.html items flagged (not yet changed — require owner decisions):** (a) "7+ medications" stat should be "10 GLP-1 medications" (app supports Ozempic/Wegovy/Mounjaro/Zepbound/Saxenda/Victoza/Trulicity + 3 compounded variants); (b) testimonials (Sarah M./James T./Maria K.) flagged in old terms.html as "REPRESENTATIVE EXAMPLES — CONFIRM STATUS" — need FTC-compliant verified quotes or removal before launch; (c) "400+ waitlist" count should be verified against real Supabase data; (d) feature section shows only 4 cards but AI photo, Shot Day Prep, Medication Level Estimator, Progress, Prescriber PDF, Micronutrient Watch are all shipped; (e) "Join Waitlist" CTA should become App Store/Play Store links at launch; (f) contact email — old privacy.html used `privacy@glipra.com`, all docs now standardized to `legal@glipra.com`. |
| 2026-05-28 | Legal documents + in-app Privacy Policy and Terms of Service screens (session 30) | **Five legal documents created** under `docs/legal/` for Leonava (Texas company). All marked DRAFT — REQUIRES ATTORNEY REVIEW. (1) `terms-of-service.md` — mandatory AAA arbitration (Consumer Arbitration Rules), class action waiver, 30-day opt-out window, Texas governing law, medical disclaimer section, $50 / 12-month-payments liability cap, indemnification. (2) `privacy-policy.md` — full data inventory table (health vs. non-health, sensitive vs. not); Washington My Health My Data Act (WMHMD Act) dedicated section with consent mechanism, rights (access / delete / withdraw / third-party list), 45-day response window; CCPA/CPRA rights table and no-sale affirmation; Texas TDPSA rights + Attorney General appeal path; data retention schedule (health logs deleted within 30 days of account deletion, meal photos within 24 hours of AI analysis); subprocessor table with data-residency column. (3) `medical-disclaimer.md` — standalone; lists 8 individual variability factors for medication level estimates; explicitly states symptom-escalation notices are not a diagnosis and may fire spuriously. (4) `subprocessor-list.md` — tabular (Supabase, OpenAI, RevenueCat, PostHog, Sentry, Resend, Expo, Apple, Google); explicitly notes OpenAI receives only anonymized context, health data never reaches PostHog/Sentry, no advertising subprocessors. (5) `refund-policy.md` — step-by-step cancellation for iOS (reportaproblem.apple.com) and Android (Play Store subscriptions), 24-hour pre-renewal window, technical-issue exception path. Commit: `da18adf`. **In-app legal screens** — The Settings > About > "Privacy Policy" and "Terms of Service" rows were previously stubbed with empty `onPress={() => {}}`. Implementation: `src/components/legal/LegalDocScreen.tsx` — shared layout component (sticky header with back button, title/date/intro block, numbered sections with uppercase headings, footer contact line; fully theme-aware). `src/app/(app)/legal/privacy-policy.tsx` — 14 sections; full in-app text derived from `docs/legal/privacy-policy.md`. `src/app/(app)/legal/terms-of-service.tsx` — 16 sections; arbitration/class-action-waiver block prominently called out in intro banner and Section 14. `settings-screen.tsx` updated: `onPress={() => router.push('/legal/privacy-policy')}` and `onPress={() => router.push('/legal/terms-of-service')}`. No new TypeScript errors; 62/62 jest-expo tests pass. Commit: `b95c373`. |
| 2026-05-28 | Medication Level Estimator — three bug fixes: phantom peaks, missing level card, dots on baseline (session 29) | **Bug 1: Phantom concentration peaks before first injection.** `generateSteadyStateCurve` (`src/features/medication-level/calculator.ts`) was building a synthetic historical injection list by extrapolating backward `numHistoricDoses` intervals from `lastInjectionDate`. For a user with only 3 real shots (May 9, 16, 23), this produced phantom doses at May 2 and Apr 25, showing fake peaks. **Fix:** added optional 8th param `actualInjectionDates?: string[]`. When provided, the dose list is built exclusively from those parsed + chronologically sorted dates — no extrapolation. Existing callers without the param continue to use the synthetic path (backward compat). Both call sites updated: `hooks.ts` passes `injectionDates` (deduplicated logged dates); `medication-level.tsx` passes `injectionDates` in the `displayCurve` useMemo. 4 new Vitest cases added to `src/__tests__/medication-level-calculator.test.ts`: no phantom before first shot (May 8 must be 0), single injection equals doseMg at day 0, accumulation across 3 shots, empty array produces all-zero curve. **Bug 2: "ESTIMATED IN SYSTEM" numeric card never rendered.** Card was gated on `currentLevelMg !== null`, which was derived from `curve` (hook output). The hook returns `curve: null` when `doseMg` is null (user logged injection sites without entering a dose). Meanwhile `displayCurve` falls back to `doseMg ?? 1.0`, so the chart showed but the level card was hidden. **Fix:** removed `const todayPoint = curve?.find(...)` / `const currentLevelMg` from before the `displayCurve` useMemo; added `const currentLevelMg = displayCurve?.find((p) => p.date === today)?.levelMg ?? null` after `displayTodayOffset`. Card now renders whenever the chart renders. **Bug 3: Injection-event dots sitting on x-axis baseline (y=0).** `level-chart.tsx` rendered each injection dot with `cy={baselineY}` (hardcoded to 0-concentration line). **Fix:** replaced `injectionOffsets: number[]` with `injectionDotData: Array<{offset, levelMg}>` in the `computed` useMemo — looks up the curve point at each injection offset and captures its `levelMg`. JSX updated to `cy={toY(levelMg)}`; `toY` added to the destructured useMemo return. Dots now sit on the curve at the injection peak. 62 jest-expo + 348 Vitest tests pass. TypeScript clean. Commit: `05c79cf`. |
| 2026-05-30 | Daily AI Guidance — last remaining Pro feature shipped (session 37) | Full 9-task subagent-driven implementation. **Migration `016_daily_guidance.sql`** (applied via `npx supabase db push`): `injection_phase TEXT` nullable; UNIQUE on `(user_id, date)` only (one tip per user per day); `reasoning_text TEXT` for "Why this?" tooltip; `prompt_version TEXT DEFAULT 'v1'`; index on `(user_id, date DESC)`. Schema differs from original plan (`011_daily_guidance.sql` in docs) which had `injection_phase NOT NULL` + UNIQUE on `(user_id, date, injection_phase, language)`. **Edge function `generate-daily-guidance`** deployed to Supabase project `cuxndkreewlcmijxlgyg`: GPT-4o mini; cache-hit check (SELECT WHERE user_id + date, return early if found); Zod `InputSchema` (`injectionPhase`, `nauseaScore`, `energyScore`, `proteinProgressPct`, `medicationStatus`, `language`) + `OutputSchema` (`guidance_text`, `reasoning_text`); `FALLBACK_RESULT` on parse failure (never crashes); service-role client writes to `daily_guidance` + `ai_invocations`; system prompt enforces nutrition-only scope, soft-foods-only on nausea >= 4, no exercise recommendations on nausea = 5, no shame framing, forbidden-phrases list, Spanish when `language = 'es'`. `// ATTORNEY REVIEW REQUIRED` comment above system prompt. **`MOCK_DAILY_GUIDANCE`** in `src/lib/mockAI.ts` updated to `{ guidance_text, reasoning_text }` shape; old fields removed; `mockAI.test.ts` fixed to match. **Client layer** `src/features/daily-guidance/api.ts`: `GuidanceContext` interface; mock gate via `isMockAIEnabled()` + 400ms delay; real path: `supabase.functions.invoke('generate-daily-guidance')`. **React Query hook** `src/features/daily-guidance/hooks.ts`: `queryKey: [DAILY_GUIDANCE_KEY, userId, today]`; `staleTime: Infinity` (server deduplicates at DB); `retry: 1, retryDelay: 2000`. **`DailyGuidanceCard`** (`src/components/today/daily-guidance-card.tsx`): Pro-gated via `<ProGate>`; `LinearGradient gradients.hero` header; loading/error/guidance states; "Why this?" `Pressable` toggles `showWhy` expanding `reasoning_text` in branded frosted box; `DisclaimerBanner tier={1}` backed by AsyncStorage key `'glipra_daily_guidance_disclaimer_seen'`; analytics `DAILY_GUIDANCE_VIEWED` fired once on guidance load, `DAILY_GUIDANCE_WHY_TAPPED` on expand; `useTheme()` + `makeStyles`; uses `colors.primaryLight` (not `colors.brandLight` which does not exist). **Today screen wiring**: `guidanceContext` built inside `useTodayData()` from profile (`proteinProgressPct = Math.round(consumed/floor * 100)`, `i18n.language`); `useDailyGuidance(guidanceContext)` called in `TodayScreen`; card rendered before `PharmacistSpotlightCard`; suppressed when `medicationStatus === 'discontinued'`; suppressed automatically when red-flag escalation card takes over the full screen. **i18n**: 7 keys under `"today"` in en.json + es.json: `daily_guidance_section`, `daily_guidance_pro_label`, `daily_guidance_why`, `daily_guidance_why_close`, `daily_guidance_loading`, `daily_guidance_error`, `daily_guidance_disclaimer`. **Analytics**: `DAILY_GUIDANCE_VIEWED` + `DAILY_GUIDANCE_WHY_TAPPED` added to `EVENTS` in `src/lib/analytics.ts`. **Tests**: `src/__tests__/daily-guidance.test.ts` (5 Vitest cases: mock path shape, Zod schema validation, null optionals, Spanish language param, all 5 injection phases). Final counts: 357 Vitest + 62 jest-expo. Commit: `81b2433` on `origin/master`. Attorney review required before `EXPO_PUBLIC_USE_MOCK_AI=false` in any env. |
| 2026-05-30 | GDPR data export + account deletion; repo/tooling cleanup; check-all green (session 38) | **GDPR features (Tier 0, always-free, no Pro gate).** Two new edge functions deployed to project `cuxndkreewlcmijxlgyg`. `export-user-data`: service-role client reads all 12 user-scoped tables (profiles, food_logs, ai_invocations, daily_checkins, weight_logs, streaks, shot_prep_logs, user_milestones, food_corrections, user_food_defaults, injection_logs, daily_guidance; content_cards excluded as global), returns a single JSON bundle inline (`{ json }`), 1/day rate limit via ai_invocations rolling window. `delete-user-account`: a single `auth.admin.deleteUser(user.id)` relies on every user table having `user_id ... ON DELETE CASCADE` to auth.users, so all data is wiped automatically (no per-table loop, no Storage cleanup needed). Client `src/features/account/{api,hooks}.ts`; `delete-account-modal.tsx` is a type-to-confirm modal (user types DELETE / ELIMINAR; built on React Native Modal + theme tokens, NOT the dead NativeWind `ui/modal.tsx`). Settings Account section gained Export my data (writes JSON to cache, opens expo-sharing) and Delete account (destructive, modal, then signOut). Decision: export = single JSON (privacy policy already says "portable copy"); deletion = immediate hard delete (compliant with "within 30 days"); user-facing copy still needs attorney review. Commits `49be984` (build) + functions deployed. **barcode_corrections table created (migration `017_barcode_corrections.sql`, applied via db push).** `src/features/food-log/barcode-corrections.ts` queried a `barcode_corrections` table that NO migration ever created (food_corrections from 012 is a different feature: corrected_name/original_ai_name, no barcode_ean), so the per-EAN correction feature silently no-opped at runtime (query errored, swallowed by the null-guard) despite being wired into the scan flow (food-log/hooks.ts). New table: id, user_id (FK cascade), barcode_ean, product_name, protein_g, fiber_g, calories_kcal, updated_at, created_at; UNIQUE(user_id, barcode_ean) for the upsert; RLS per-user FOR ALL policy (Rule 7). Types regenerated. `fetchBarcodeCorrection` return completed with explicit nulls for unstored macros/micros. Commit `8ba9e1e`. **Arabic removed for real.** `ar.json` (121/313 keys, broke i18n-json identical-keys lint) deleted; unwired from `src/lib/i18n/resources.ts` and the RTL branch of `utils.tsx` (I18nManager import dropped). en/es parity 313=313. **expo-file-system SDK-54 break fixed.** SDK 54 moved readAsStringAsync/writeAsStringAsync/cacheDirectory out of the main entry into `expo-file-system/legacy`; three call sites (voice-capture-button, settings-screen export, visit-prep PDF) would have thrown at runtime. Repointed imports to `/legacy` (drop-in). Commit `8ddf8d7`. **RevenueCat v10 typing.** `getPurchasesModule()` in revenue-cat.ts/use-subscription.ts/paywall-screen.tsx returned `mod.default` (the Purchases class) but was typed as the module namespace, so configure/getCustomerInfo/restorePurchases/purchaseProduct/setLogLevel (all real v10 static methods) appeared missing. Annotated as `typeof import('react-native-purchases').default`. No runtime change; purchaseProduct etc. exist in v10. **Tooling: pnpm check-all now passes (was crash-broken).** Root config crashes fixed earlier (removed stale @types/i18n-js + eslint-plugin-better-tailwindcss; supabase/ excluded from tsconfig). Then type-check driven 44 to 0 (added missing @react-navigation deps; deleted dead theme-item.tsx ThemeItem remnant; SDK-54 NotificationBehavior shouldShowBanner/shouldShowList; ai-coach mock fixed to MOCK_COACH_REPLY after the session-37 reshape broke `.message`; TodayProfile.createdAt added for milestone unlock; TFunction import from i18next; supabase Proxy target cast; misc). eslint.config.mjs calibrated to the codebase: ignore `**/*.md`; filename-case allows kebab+pascal+camel (ignore mockAI.ts); large/risky rules (max-lines-per-function, max-params, multiline-ternary, indent-binary-ops, react-compiler) downgraded to warn; inline eslint-disable prefixes corrected from `@typescript-eslint/` to `ts/` (the antfu alias, which is why they silently never applied) on deliberate native-module require() guards + dynamic payment-shape `any`. lint 0 errors / 226 non-failing warnings, type-check 0, lint:translations ok, 363 Vitest + 62 jest-expo. Commits `fec0c91`, `efb5763`, `555f85c`. **Docs consolidated.** ARCHITECTURE/CLAUDE/PROGRESS moved into the nested `dosepath/` app repo (the real GLiPra.git repo; the workspace-root repo was a separate docs-wrapper sharing the same remote, a footgun now defused). Former project-local `dosepath/claude.md` renamed `SCAFFOLD.md`. |
| 2026-05-31 | GitHub Pages / glipra.com landing restored + Sign In button visibility fix (session 38) | **Pages was failing and glipra.com 404'd.** GitHub Pages is configured "Deploy from a branch" -> `master` `/docs` (Jekyll), custom domain via the `CNAME` file. When the dosepath app repo took over GLiPra.git, `/docs` was overwritten by the unmodified Obytes Astro starter site (`starter.obytes.com`) -> Jekyll cannot build Astro source (deploys failing) and the `CNAME` file vanished (custom domain unset, glipra.com 404, live site frozen on the last good deploy). The real landing page only survived in the local-only root docs-wrapper repo. Fix (`1a14aa5`): copied the static landing into `dosepath/docs/` (`index.html` ~63KB self-contained, `privacy.html`, `terms.html`, `legal/*.md`, `CNAME`=glipra.com) + added `.nojekyll` so Pages publishes the folder statically (no Jekyll build); deleted the Astro template; moved internal planning docs to `dosepath/internal-docs/` (versioned, NOT published at glipra.com). **Rule: `dosepath/docs/` is the published Pages site - keep it landing-only + `.nojekyll`; never put Astro/Jekyll source or internal docs there.** Verified live: glipra.com loads. **Sign In button invisible fix (`a3a95e9`):** the shared `Button` (`src/components/ui/button.tsx`, Obytes stub) had no `backgroundColor` and a default-black label, so the default-variant button (auth forms, onboarding, feed) rendered black-on-dark = invisible app-wide (onPress was wired; looked "not working"). Re-styled against colors.ts tokens via `useTheme()` (default = `colors.primary` fill + `colors.white` label; all variants handled; disabled/loading dim); `useTheme()` falls back to lightTokens with no provider so the 8 jest tests still pass; added a regression style test. Shipped to the installed dev build via EAS Update (OTA, `development` channel, group `61ad727c`) - no rebuild needed. |
| 2026-05-31 | Auth flow fixed end-to-end: sign-in flicker loop + post-sign-in blank (session 38) | Once the Sign In button was visible, two cascading bugs blocked the post-sign-in flow; both root-caused (the blank one via live Metro logs). **(1) Continuous white-flicker loop on live sign-in (`5717bf5`).** The Supabase client (`src/lib/supabase.ts`) had `autoRefreshToken: true` but no AppState management; on sign-in the refresh timer raced the stale persisted session and reused a rotated refresh token (`Invalid Refresh Token: Already Used`), churning the session `signIn<->signOut`, which ping-ponged the `(auth)<->(app)` router (both layouts redirect on status). Fix: AppState-managed auto-refresh in root `_layout.tsx` (startAutoRefresh on `active`, stopAutoRefresh on background) - the Supabase RN-documented remedy; churn is now a single transient settle. Also made the root `GestureHandlerRootView` background follow `useColorScheme()` (it sits outside `GlipraThemeProvider`) instead of a hardcoded light `#f7f9fc`, fixing the white flash on dark devices. **(2) Stranded on sign-in / blank (`02c0000`).** Metro logs showed `status: signIn` but `hasAgreed: false` (consent never recorded on a fresh build). `(auth)/_layout` returned `<Redirect href="/(auth)/consent">` WITHOUT rendering `<Stack>`, so the consent screen (a child of that Stack) could never mount. Fix: navigate to consent IMPERATIVELY via `router.replace('/(auth)/consent')` in a `[status, hasAgreed]` effect while rendering a plain `<Stack>`. **Pattern/rule: in expo-router, to land on a screen WITHIN the current group's layout, render the navigator (`<Stack>`/`<Slot>`) and navigate imperatively; a layout-level `<Redirect>` to a sibling route prevents that group's navigator (and thus the target screen) from mounting. Use `<Redirect>` only to cross to a DIFFERENT group (e.g. `(auth)` -> `(app)`).** Auth flow confirmed working on device: sign in -> consent -> agree -> Today. |
| 2026-05-31 | Nutrition Log redesign actually shipped + Micronutrient Watch made a conversion surface (session 39) | Two OTA changes to the Nutrition (`log`) screen. **(1) Voice-hero / photo-row redesign finally committed (`bd7eb76`)** - this is the session 44/45 design that was previously logged-but-never-committed (its 4 i18n keys had been dead code, then deleted in session 38, now re-added and live). `voice-capture-button.tsx`: idle state restyled into a full-width navy hero card (`#1E1B4B`, crown PRO badge, mic, brand-purple waveform, "Speak your meal" / "Voice AI extracts macros instantly" / "Tap to record ->" pill); recording/loading/Pro-gate logic untouched. `photo-capture-button.tsx`: the `#4C1D95` gradient card became a compact white action row (camera circle + "Photo scan" / "AI estimates from image" + amber AI pill + brand PRO pill + chevron); added `useTranslation`. `log.tsx`: the two now stack vertically (voice hero, then photo row) instead of the side-by-side `aiRow`; emerald `colors.success` "Barcode and manual entry are always free." caption added under the Manual/Barcode toggle. Re-added keys `voice_hero_title`/`voice_hero_subtitle`/`voice_cta`/`free_logging_note` (en/es). Presentation only. **(2) Micronutrient Watch relocated + frosted upsell (`059fe5c`).** Logging-first reorder: `DailyMacroCard` + `MicronutrientWatchCard` moved from the top of `log.tsx` into a results cluster BELOW the logging actions (above "Today's log"), so the empty micronutrient state no longer pushes the CTAs below the fold. `micronutrient-watch-card.tsx` turned its `ProGate` into a conversion surface: Pro users see the real 2x2 grid only when `hasMicronutrients` (else render `null` - the empty microscope state is gone); free users get a new `MicronutrientUpsell` fallback - sample `NutrientTile`s (`SAMPLE_NUTRIENTS` const) dimmed to opacity 0.45 behind a two-layer frosted scrim (a `frost` View = `colors.surface` @ opacity 0.82 + a separate full-opacity `scrimContent` so the text/CTA stay crisp; deliberately NO `expo-blur` because that is a native module and would force a rebuild - frosted-overlay keeps it OTA-shippable), with lock + "See what your meals are missing" + B12/D/Mg/Zn subtitle + "Unlock with Pro" pill that opens the paywall, plus a "Sample preview" label so the illustrative numbers are not mistaken for real data. 4 keys `micronutrient_upsell_title/subtitle/cta/sample` (en/es). **Decision: locked premium features should preview-and-entice (frosted teaser with sample data), not just hide or show a generic upgrade card.** Both shipped via EAS Update to `development` (groups `d768cfd3`, `8818b5d0`). Each: 63 jest + 363 Vitest, type-check 0 on touched files, lint:translations parity. **Paywall entitlement: used the canonical `'glipra_pro'` (per CLAUDE.md). Pre-existing inconsistency flagged (not fixed): `pro-gate.tsx` + `photo-capture-button.tsx` pass `'GLiPra Pro'`; `voice-capture-button.tsx` + the new upsell pass `'glipra_pro'`. These must be reconciled against the actual RevenueCat entitlement id before launch.** Note: dev builds auto-unlock Pro, so the free upsell path is not visible on-device without forcing `isPro=false`. |
| 2026-05-31 | Entitlement-id reconciled; dead-code + token cleanup; expo-av -> expo-audio migration + new dev build (session 39 cont.) | Follow-on cleanup after the Nutrition redesign. **(1) Paywall entitlement standardized to `'GLiPra Pro'` (`b8612f3`).** The earlier entry left two values in the tree; the `isPro` detection (`use-subscription.ts` + `revenue-cat.ts` `ENTITLEMENT_ID`) keys off `'GLiPra Pro'`, so that is authoritative (a mismatched `requiredEntitlementIdentifier` would present the paywall against a non-existent entitlement). User confirmed `'GLiPra Pro'` is the real RevenueCat dashboard identifier; changed the two `glipra_pro` paywall calls (voice button + new micronutrient upsell) to match. **All 6 occurrences now agree on `'GLiPra Pro'`.** Updated the CLAUDE.md note accordingly (it had said `'glipra_pro'`). OTA group `b2bdd84f`. **(2) Dead micronutrient empty-state removed (`a574121`).** After the Pro-empty path became `null`, the card's `emptyState`/`emptyIcon`/`emptyText` styles + the only consumer of `log.no_micro_data` were orphaned; removed the styles and dropped the key from en/es (parity preserved). **(3) VoiceCaptureButton hex -> tokens (`9600292`).** Closed the last session-42-era item: added 8 tokens (`voiceHeroBg`/`voiceHeroBadgeBg`/`voiceHeroBadgeBorder`/`voiceHeroCtaBg`/`voiceHeroWave`/`voiceHeroTextMuted`/`recordingBg`/`recordingWave`) to `GlipraColorTokens` + both light/dark palettes (identical values, since the voice hero is an always-dark surface by design like the hero gradient); `voice-capture-button.tsx` now has zero color literals. **(4) expo-av -> expo-audio (`9514209`).** expo-av is deprecated in SDK 54 and the voice button was its only consumer. Migrated to the hook-based API: `useAudioRecorder(RecordingPresets.HIGH_QUALITY)` + `record()`/`stop()`/`.uri`; top-level `requestRecordingPermissionsAsync()` + `setAudioModeAsync({ allowsRecording, playsInSilentMode })`; dropped the `Audio.Recording` state for the recorder hook + an `isRecordingRef` for unmount cleanup. Output stays `audio/m4a`, so `voice-recognition.ts` + the `transcribe-food` edge function are unaffected. Registered the `expo-audio` config plugin in `app.config.ts` with an iOS `microphonePermission` string (NSMicrophoneUsageDescription; Android RECORD_AUDIO auto-added); removed `expo-av` from package.json. **This is a NATIVE MODULE swap -> NOT OTA-able; kicked EAS Android dev build `76b10461` for on-device verification (record -> stop -> AIReviewSheet, permission-denied alert, backgrounding mid-record).** All four: type-check 0, 63 jest + 363 Vitest. |
| 2026-05-31 | Real AI enabled on the development channel (`c1a4a82`, session 39 cont.) | User asked for AI photo recognition to work on-device. The pipeline was already complete (photo -> `recognize-food` GPT-4o vision -> `AIReviewSheet`); it was only mock-gated. User chose **all AI real** (global flag, not photo-only). **(1) Flag flip — `EXPO_PUBLIC_USE_MOCK_AI=false` for the development profile only** (`eas.json` `build.development.env` + `.env.development`); preview stays `true`, production unchanged. **(2) Decoupled the dev Pro auto-unlock from the AI mock flag.** Critical interaction: `use-subscription.ts` forced `isPro` via `IS_MOCK_DEV = EXPO_PUBLIC_USE_MOCK_AI === 'true'`, so flipping the AI flag false would also drop the dev Pro override -> the Pro-gated photo/voice buttons would hit the paywall (no real purchase) and be untestable. Fix: new `IS_DEV_FORCE_PRO = process.env.EXPO_PUBLIC_APP_ENV === 'development'` drives the Pro override in both the stub and live paths; `IS_MOCK_DEV` removed. **Decision/pattern: the dev Pro unlock is keyed on APP_ENV (development), independent of the AI mock flag — the two concerns are now separate.** Preview/production (APP_ENV != development) run a live RevenueCat entitlement check, unchanged. **(3) Deployed all 8 edge functions** to project `cuxndkreewlcmijxlgyg` (`recognize-food`, `ai-coach`, `transcribe-food`, `generate-daily-guidance`, `generate-visit-prep`, + GDPR/PDF). `recognize-food` had never been confirmed deployed, which would have made photo return the `FALLBACK_RESULT` ("Unknown food"). `OPENAI_API_KEY` confirmed present as a Supabase secret. Supabase CLI auth was via a Personal Access Token (`SUPABASE_ACCESS_TOKEN`) — `supabase login` did not persist across `npx` invocations on Windows. **(4) Delivery: EAS Update OTA** to `development` (`--clear-cache`, group `7f14f093`); the mock flag is an `EXPO_PUBLIC_` var inlined at export time, so no rebuild needed (fallback if the OTA env didn't propagate: a fresh dev build bakes it in). **This deliberately overrides the CLAUDE.md legal gate for DEV TESTING ONLY** — attorney review of ai-coach + EscalationCard copy is still required before preview/production/public, and real AI now bills the OpenAI account ($20/mo dev cap; revert by setting the dev mock flag back to true). type-check 0, 63 jest + 363 Vitest. |
| 2026-06-02 | Photo/voice AI confirmed working on device + brand renamed Glipra → GLiPra (session 39 cont.) | **(1) Real AI verified.** After enabling real AI (entry 59), photo recognition errored silently ("Analyzing…" then nothing). Root cause via the recognize-food dashboard Logs tab: `OPENAI_API_KEY` was actually missing/empty (despite being assumed set) — the function threw before calling OpenAI; the client swallows the error (`photo-recognition.ts` catch → null → no review sheet). Fix: set `OPENAI_API_KEY` via the Supabase dashboard (Supabase CLI `login` did not persist across `npx` on Windows; a `SUPABASE_ACCESS_TOKEN` PAT was the workaround for CLI ops). Photo + voice then confirmed working on dev build `76b10461`. Latent UX gap noted: the photo path shows no error Alert on failure (candidate future fix). **Security:** the OpenAI key was pasted in plaintext during setup → flagged for rotation. **(2) Brand rename Glipra → GLiPra (`00cc02a`), user-facing only.** The capital-G brand word is cleanly separable from `Glipra`-prefixed code identifiers (always followed by a letter) and lowercase technical `glipra` (bundle IDs, slug, domain, emails), so a guarded `sed 's/Glipra\([^A-Za-z]\)/GLiPra\1/g'` on rendered-string files + targeted edits (env.ts NAME, notification strings) flipped 25 files. **Decision: rename display text only — NEVER the `GlipraTokens`/`GlipraTabBar`/`GlipraThemeProvider` identifiers, `com.glipra.*`, schemes, slug, `glipra.com`, `@glipra.com` emails, or the OFF User-Agent (breakage / no user value).** Home-screen app label (native manifest via `env.ts NAME` → `app.config name`) flips only on the next EAS build; in-app text via OTA (group `32cf5f79`); website via Pages. type-check 0, parity, 63 jest + 363 Vitest. |
| 2026-06-02 | Today screen UI polish — MedLevelBanner height + Injection Cycle tile colour (session 39 cont.) | **(1) MedLevelBanner sparkline removed (`25def75`).** The medication-level tile in Daily Actions was taller than every other action tile because it stacked a `CurveSparkline` (mini SVG PK-curve with today marker) above the standard icon+headline+pill+chevron row. Removed the entire `CurveSparkline` component + SVG imports + `AMBER`/`SPARKLINE_*` constants + `sparklineRow` style + unused hook destructure fields. **Decision: phase information on the Today screen should be communicated by the top-accent colour and the label, not by an inline chart preview — the full chart lives on the detail screen the tile taps to.** **(2) Injection Cycle tile tint removed (`1a38235`).** `styles.phaseAccentBg` (`backgroundColor: colors.primaryLight`, brand-purple @ 8% opacity) was applied to the active injection card, making it a different colour from the plain-white Protein Today tile. Removed from the style array (one line). **Decision: the 3px `borderTopColor` phase accent is sufficient to signal the injection phase; a tinted background breaks visual parity with sibling metric tiles and adds no clinical information.** Both fixes: type-check 0, jest 63, OTA-shipped. |
| 2026-06-02 | Add Shot pain-level dots → drag-to-slide slider (`db58d1f`, session 39 cont.) | User feedback: the 11 tap-only dots on the Add Shot Pain Level row (9–12px circles) were too small to hit precisely. Rebuilt `src/components/injection-sites/pain-level-slider.tsx` as a real slider on top of `react-native-gesture-handler` v2 (`Gesture.Pan` + `Gesture.Tap` raced via `Gesture.Race`) and `react-native-reanimated` v4 shared values: 4px pill track + animated fill bar + 24px brand thumb, 11 subtle tick hairlines under the track, snaps to integers 0..10 with `haptics.selection()` on every crossing, tap-anywhere-on-track jumps and snaps via `withTiming`. Same `{ value, onChange }` props → `add-shot.tsx` unchanged. `accessibilityActions: increment/decrement` preserve TalkBack ±1 bumping (must not regress vs the Pressable-per-dot original). Zero hex literals; all surfaces via `useTheme()` tokens. **Decision: prefer JS-only gesture+animation primitives (rngh + Reanimated, both already in the native build) over `@react-native-community/slider` for new sliders — stays OTA-shippable instead of forcing a rebuild.** OTA group `2b269420`. type-check 0, jest 63. |
| 2026-06-03 | Bottom-tab order: Sites moved adjacent to Today (`b4105a0`, session 39 cont.) | User reach feedback: in the new injection-tracking flow, the Sites tab gets tapped a lot but was placed 4th of 5 (Today / Progress / Nutrition / Sites / Coach). Swapped Progress and Sites so the most-tapped tabs sit on the natural-thumb side. **New canonical order: Today / Sites / Nutrition / Progress / Coach.** Single source of truth = `VISIBLE_TAB_NAMES` tuple in `src/components/navigation/glipra-tab-bar.tsx`; mirrored once in `<Tabs.Screen>` declarations in `(app)/_layout.tsx`. `TAB_ROOTS` set (hardware-back-exits behaviour) is order-independent and didn't need changes. |
| 2026-06-03 | Pharmacist content cards — premium gradient-hero design language (`c2d7f3b` + `3907172`, session 39 cont.) | User wanted the Today-screen carousel cards to feel more elegant/premium. Generated 5 distinct directions (Editorial / Rx Pad / Gradient Hero / Quiet Luxury / Diagnostic Chip) in a throwaway HTML mockup at `.planning/mockups/content-cards.html`; user picked **Gradient Hero Band + Quiet body + Rx monogram + read-time microcopy + text-only CTA**. New `ContentCardView` anatomy: LinearGradient band on top (`gradients.hero` purple for tier-2, new `gradients.warning` amber for tier-1) hosting a cream category pill + read-time micro ("X MIN", computed from `body.length / 1000`, no schema change) on the left and an Rx monogram in a cream circle on the right; pure-white body with title-dominant typography (16px @ -0.2 tracking); hairline divider (full-bleed via negative horizontal margin) + text-only "Read the full note →" CTA in the tier colour (no filled button — the gradient does all the visual work alone). **Newly tappable:** carousel cards were previously inert — a new optional `onPress(card)` prop flows `ContentCardView` → `CardsCarousel` → `today-screen.tsx`'s existing `setSheetCard`, so tapping a card now opens the `ContentCardSheet` (which got a matching gradient-hero header treatment so the carousel→sheet transition is continuous). **Token additions:** `gradients.warning` (amber `#d97706` → `#b45309` → `#92400e` for tier-1) added to both light and dark palettes alongside the existing `hero` purple gradient — first gradient in the warning channel; codify the pattern as "every gradient slot must exist in both palettes". **Decisions/patterns:** (1) **One loud thing per card** — the gradient band carries 100% of the colour load; everything below it whispers. The combo works because the band's punch is balanced by the quiet body, not amplified by a colored CTA. (2) **Read-time microcopy is free trust** — `Math.max(1, round(body.length / 1000))` requires no data model change but signals "this is worth opening" the same way news apps do. (3) **Tap targets follow visual affordances** — when a CTA appears, the whole card becomes pressable; without an onPress, the same JSX renders without the divider+CTA so there's no misleading affordance. **Bundler footgun (resolved):** initial OTA attempts hit `Error: Mapping is for a position preceding an earlier mapping` during the Android Hermes bytecode step. Root cause: `<>...</>` Fragment shorthand inside a conditional render trips Metro's sourcemap merger on this toolchain (Expo SDK 54 + Hermes + Reanimated). Fix: replace with an explicit `<View style={styles.footer}>` wrapper. **New rule: avoid React.Fragment shorthand inside ternary/`&&` conditional renders — use an explicit View wrapper.** Visual unchanged. OTA group `ea1ecee3`. type-check 0, jest 63. |
| 2026-06-03 | Progress symptom card — polyline → severity heat strip (`403feb3`, session 39 cont.) | The dual-polyline nausea+energy chart was unreadable on sparse check-in history: nulls were filtered out and the remaining points connected, so a 2 → 4 jump across a missed day rendered as a vertical wall. After mockup-comparing 5 directions (sparkline split / heat strip / phase-correlation bars / insight-only / remove), user picked **heat strip** for v1, with phase-correlation explicitly documented as v2. Built a new reusable primitive `SeverityHeatStrip` (`src/components/progress/severity-heat-strip.tsx`) that maps `(number \| null)[]` daily values onto a grid of small rounded cells coloured from a 5-step token ramp. Cells are wired as `flex: 1` + `aspectRatio: 1` inside fixed-width rows (chunked at `cellsPerRow`), so the grid flexes to any parent width without ever overflowing. Null days render in `colors.border` (warm beige), distinguishable from any severity level — sparse data degrades gracefully instead of misleadingly. **Token additions:** `scales.warningScale` (5-step amber 100→700) and `scales.successScale` (5-step emerald 200→700) on `GlipraTokens`, plus dark-palette variants. New `GlipraSeverityScales` type. These are the first **derived-ramp** tokens in the system; rule going forward: any heatmap/severity ramp must live in `scales`, never inline. **Decisions/patterns:** (1) **Sparse-data charts default to grids, not lines** — connecting interpolated points across missing data is misleading; cells leave gaps visible. (2) **Each metric carries a "good direction" cue** ("lower is better" / "higher is better") under its avg, so users with opposite-direction metrics on the same scale don't have to interpret colour direction. (3) **Window-aware cell sizing** — `cellsPerRowFor(width, days)` selects 7/15/18/20 cells per row depending on range, keeping cells visually consistent across 7D/30D/90D selections. (4) **Reusable severity primitive** — the same `SeverityHeatStrip` will back water hit-rate and protein-floor coverage when those move from "computed average" to "calendar visualization" in v2. (5) **v2 documented inline** — code comment in `CheckInSymptomCard` points to the plan file for Direction C (phase-correlation), so the next person who reads the file finds the upgrade path without spelunking. OTA group `07866360`. type-check 0, jest 63. |
| 2026-06-03 | AI Data & Privacy disclaimer before first scan (`dfc82ac`, session 39 cont.) | One-time contextual disclosure shown before the user's first AI scan (photo or voice), explaining the data flow and acked via AsyncStorage. **Distinct from the first-launch consent flow** in session 17: those are broad legal gates at app entry; this is a permission-prompt-style disclosure at the AI-action moment. Both have a place. New `useAiPrivacyAck` hook (flag `glipra_ai_scan_data_privacy_ack`) + new `AiPrivacyDisclaimerModal` (gradient hero matching the AnalyzingModal palette for visual continuity into the flow that opens right after, numbered "What happens" list, emerald trust callout, amber Rule-8 warning, GLiPra Privacy + OpenAI API Data Policy links, "I understand. Continue" + Cancel). 15 i18n keys per locale (en/es parity). **Decisions/patterns:** (1) **Contextual AI disclosure is its own legal surface, separate from app-entry consent.** Permission-prompt at the action moment is industry standard for AI consumer apps and answers the specific question "what happens to MY photo/audio" better than a broad ToS link does. New rule: any new AI-powered surface (future features that ship a new edge function) needs its own contextual disclaimer, gated by its own AsyncStorage ack flag. (2) **Single combined disclosure over per-feature.** One modal covers both photo and voice — chose this over two separate gates because the user will use both eventually and one prompt is friendlier than two. Honest because both modalities flow to OpenAI through the same edge-function pattern; the copy mentions both explicitly. (3) **Disclaimer gates fire BEFORE the irreversible action,** not after. For voice that means fire AFTER Pro check + mic permission grant but BEFORE the mic actually activates — declined disclaimer must not leave the user with an orphan recording. New `onBeforeRecord?: () => Promise<boolean>` prop on `VoiceCaptureButton` returns `true` to proceed or `false` to abort, awaited by the press handler. Same pattern (sync resume-or-abort via promise) is the right shape for any future "modal-then-action" gate. (4) **Resume-or-abort via refs, not state.** When the disclaimer interrupts an in-progress action (photo capture, voice tap), stash the action in a `useRef` (`pendingPhotoRef`, `pendingVoiceResolverRef`). Refs avoid the React state-batching surprises that would happen if you tried to stash the action in state and resume in a useEffect. Codify: **for deferred-then-resumed flows, stash the pending action in a ref, not state**. (5) **Link to provider's own data policy alongside ours.** Two-link footer pattern: in-app `/legal/privacy-policy` + external provider policy URL (here OpenAI's API data usage policy). Lets users verify our claims against the actual provider's terms — credibility move. Standard for any future external-AI surface. (6) **Copy under attorney-review gate.** Any deterministic copy that describes data flow, medication context, or AI behavior goes through the same review process as `ai-coach` prompts. The disclaimer copy joins that queue. Same as Rule 10 + Liability Rule 3 envelope. OTA group `7bedaefa`. type-check 0, jest 63. |
| 2026-06-03 | Measurement units default to imperial (`4446fd3`, session 39 cont.) | User feedback: "kg and cm should not be shown first." GLiPra's primary launch market is US-based GLP-1 users; defaulting to metric forces every new user to flip the toggle. Flipped two `useState` defaults in `useWeightUnit` (`kg → lbs`) and `useHeightUnit` (`metric → imperial`) in `src/lib/unit-preference.ts`. AsyncStorage persistence preserves any previously-saved preference; only first-launch defaults change. Also reordered the visual toggle to imperial-first on all three screens (`onboarding/body.tsx`, `(app)/weight.tsx`, `(app)/goal-weight.tsx`). **Storage convention unchanged** — weights still stored in kg internally and heights in cm; `lbsToKg` / `ftInToCm` convert at input boundaries. No data migration needed. **Decision/pattern:** **first-launch defaults track the primary market.** For US-targeted measurement inputs, default to imperial on both the useState default AND the visual toggle order. Users who prefer metric flip once and the preference persists. If we ever expand to a non-US market, surface this as a region-aware default (likely keyed on `expo-localization` country code) rather than a hardcoded one. OTA group `679f20c9`. type-check 0, jest 63. |
| 2026-06-03 | Numeric confidence chip on AIReviewSheet (`e33a9c7`, session 39 cont.) | Replaced the legacy HIGH / MEDIUM / LOW chip with a numeric `~XX%` badge on the AIReviewSheet. Schema strategy: added `confidencePercent: z.number().min(0).max(100).optional()` to both `recognize-food` and `transcribe-food` Zod output schemas, KEPT the existing `confidence: enum`. Client always reads `result.confidencePercent ?? bucketToPercent(result.confidence)` — the helper maps `high → 90`, `medium → 65`, `low → 35`. GPT-4o prompts updated with calibration guidance. Both edge functions deployed to `cuxndkreewlcmijxlgyg`. Chip color still uses bucket thresholds (≥80 green / 50–79 amber / <50 red) so the visual hierarchy is unchanged — only the label text moves from "Medium confidence" to "~65%". **Decisions/patterns:** (1) **Numeric over bucketed for any AI self-confidence surface.** Same screen real estate, more user calibration value. The leading "~" signals self-report, not a calibrated probability — important because GPT-4o's self-confidence is loosely correlated with correctness but not statistically honest. (2) **Backward-compat by addition, not replacement.** Adding `confidencePercent` as optional alongside the existing enum lets the client ship before the edge functions redeploy; new responses prefer the percent; old responses fall back via the bucket helper. New rule: **schema changes default to additive + optional, never replace; the enum stays for one release minimum**. OTA group `679f20c9`. type-check 0, jest 63. |
| 2026-06-07 | Dose tab Phase 1 — route-aware Dose hub replaces injection-only Sites tab (`cc16311`, session 43) | Bottom-nav slot 2 is now a route-aware **Dose** tab for both regimens (Pill icon oral / Syringe injection). Oral users gained the tab they were missing; the bar stays 5. `injection-sites` kept as `href:null` so old deep links resolve. `TAB_ROOTS` updated to `/dose`. **Hub** (`src/features/dose/dose-screen.tsx`) composes existing components — DoseWindowCard, PhaseBadge, InjectionCycleCard, MedLevelBanner, DoseInjectionRotation — route-aware; detail screens stay as pushed routes, not moved. Tier-1 + Tier-2 disclaimers (Rule 8). Site-rotation UI extracted into `DoseInjectionRotation` shared between the hub and the legacy injection-sites thin-wrapper, both now fully localized EN/ES. **Today de-duplication decision:** redundant dose STATUS surfaces (phase-badge metric card, InjectionCycleCard strip, shot-day-prep card, MedLevelBanner) removed from Today. Today shows the dose ONCE: oral = DoseWindowCard (the action, also gated off when discontinued), injection = one smart dose row (`selectInjectionDoseRow`) that links to `/add-shot` on injection/0-days-left or `/dose` otherwise. Freed space promotes the protein ring to full width. **Protein ring empty state:** "Set your target" replaces "of 0g" when `protein_floor_g` is null — the 200g a test user saw is real (ABSOLUTE_CEILING_G computed floor), not a placeholder. **Adversarial review** (5 dimensions, 17 agents, refute-by-default): 6 confirmed findings, all fixed before ship — discontinued-oral DoseWindowCard gate, rotation ES localization, duplicate "YOUR CYCLE" label (new `dose.site_rotation_label`), orphaned key, legacy-screen localization, "Next dose in 0d" boundary (0-days-left now routes to log-shot). No migration (all columns existed). 519 Vitest + 57 jest. Client-only OTA. New `dose.*` + `today.dose_row_*` copy in attorney queue. |
| 2026-06-05 | Oral GLP-1 Phases 2 & 3 complete — DoseWindowCard, technique-aware streak, visit-prep oral, PK curve, cascade C (sessions 42, commits `e5fd8a9` `6420b9a` etc.) | **Phase 2 (DoseWindowCard):** a 30-minute empty-stomach absorption timer (pure `dose-window.ts` Rule-4 calculator, 20 Vitest) is the single dose surface on Today for oral users — replaces the redundant phase-badge/cycle/med-level echoes. Optimistic "Took it" local state starts the countdown before the server refetch lands. 1s per-second ticker is local to the card; the rest of Today screen is not rerendered. **Phase 3 technique capture:** after absorption clears, the card asks a one-tap confirm ("Stayed empty" / "Ate or drank early") that writes `oral_dose_logs.window_respected = true/false`. **Technique-aware streak** (`computeDoseAdherenceStreak`): explicit `false` breaks the run; `null`/`true` count — so existing all-null history is byte-identical to the previous streak and technique only penalizes an explicit acknowledgment, never silence. **Visit-prep oral variant:** both `generate-visit-prep` and `generate-visit-pdf` edge functions branched on `administrationRoute` (backward-compatible: defaults `'injection'`; existing clients unaffected). **Oral PK curve:** `useMedicationLevelCurve` branches on route. Oral uses `oral_dose_logs` + a normalized unit dose (no `dose_mg` column exists on oral logs). The y-axis shows "RELATIVE LEVEL" percent rather than a misleading mg value — the curve shape (accumulation to steady state, daily rhythm) is pharmacokinetically correct, only the scale is normalized. **Route-aware content cards:** `ContentCard.route?: AdministrationRoute` field + `getActiveCardsForRoute(route)` pure helper — oral-only cards never leak to injection users; universal cards show to both. **Cascade C dietary pattern:** `dietary_pattern` collected in onboarding but silently dropped on save since session 41 (no column); migration 019 adds the column; `buildDietaryContext` helper constrains GPT-4o only for constraining diets (vegan/vegetarian/pescatarian — omnivore adds no signal). Rule 2: categorical preference, not PII. ATTORNEY REVIEW gate: oral dosing copy (`oral_dose.*`, `med_banner_oral.*`, oral prescriber questions, `oral_dose.confirm_*`, `absorption_note.*`). |
| 2026-06-04 | Oral GLP-1 Phase 1 — AdministrationRoute as first-class discriminated union (`3fb9ba8`, session 41) | `AdministrationRoute = 'oral' \| 'injection'` added to `src/types/index.ts` as the project's primary branching key. Every route-aware component, hook, calculator, and edge function branches on this value — never on `medication_id` directly. **Pattern:** any new feature that differs by route must branch at the route level only, not duplicate components. `OralPhase = 'building' \| 'steady_state' \| 'dose_due' \| 'dose_missed'` (separate discriminated union from `InjectionPhase`). Oral phase calculator (`src/features/oral-cycle/calculator.ts`) is safety-critical (Rule 4): adherence overlay takes priority over titration position; `dose_due` is the safe default for unknown state. 13 Vitest cases at 100% branch coverage. **Migration 018:** `administration_route` (default `'injection'`), `dose_frequency`, `dose_time_local`, `medication_start_date` added to `profiles`; new `oral_dose_logs` table (RLS per Rule 7). Backward compat: existing injection users see `administration_route = 'injection'` by default; no data loss. **GlipraTabBar route-awareness:** `isOral` derived from `profile.administrationRoute` in `glipra-tab-bar.tsx`; oral users see `ORAL_VISIBLE_TAB_NAMES`, injection users see `ALL_VISIBLE_TAB_NAMES`. Rule: any new tab that is injection-only must appear in `ALL_VISIBLE_TAB_NAMES` only, never in `ORAL_VISIBLE_TAB_NAMES`. Oral medications added to `GLP1MedicationId`: `semaglutide_rybelsus`, `orforglipron`. Half-life corrected: `semaglutide_rybelsus = 7` days (same molecule as injectable; the prior `rybelsus: 0.04` conflated Tmax with elimination). ATTORNEY REVIEW gate: all new `oral_phase.*` copy + oral headlines/tips before non-dev deploy. |
| 2026-06-03 | AnalyzingModal code-review polish + Windows EAS Update hardening (`74c3164` + `6b70ef8` + `832f754`, session 39 cont.) | Three follow-up commits after the AnalyzingModal ship. **Code review:** five real fixes — useCallback handler refs (timer-thrash race), useMemo image data URI (~1.3MB allocation per render), activeIndex !== -1 guard on reset-effect (microtask-gap race), animated waveform via Reanimated withRepeat (was static, plan called for animation), single hidden screen-reader live region replacing per-row toggles (VoiceOver/TalkBack reliability). **Hermes hardening:** after the 4th recurring Windows bundle failure this session, a research-agent investigation root-caused the failure modes — debug-build `hermesc.exe` (LLVM 8.0 assertion-heavy), unsupported Node 24, OneDrive file-locking races, default-CPU worker count, unpinned `hermes-parser` (4 distinct versions coexisting). Applied 4 safe config mitigations: `.npmrc` `node-linker=hoisted`, `pnpm.overrides` pinning `hermes-parser@0.32.1`, `metro.config.js` `maxWorkers=2` on Windows only, and a new `pnpm ota:dev` script wrapping `eas update` with `EXPO_USE_FAST_RESOLVER=1`. **Decisions/patterns:** (1) **Bundler problems are config problems first, code problems last.** 4 recurring failures sent us hunting for code-level patterns (Fragment shorthands etc) when the actual fix was config-layer: pin one version of `hermes-parser`, cap concurrency, hoist resolution. Codified in the new runbook: walk the escalation ladder before suspecting code. (2) **`pnpm ota:dev` is the canonical OTA entrypoint going forward.** The bare `pnpm exec eas update ...` call is deprecated; use the wrapped script so the resolver flag is always set. (3) **Deferred decisions get documented, not buried.** Two heavier mitigations (move repo off OneDrive, Node 22 LTS) are the strongest fixes but require user choice — they live in a "Deferred user-decision mitigations" subsection of the runbook, not silently in the planner's mind. (4) **Per-row `accessibilityLiveRegion` is an anti-pattern;** screen readers don't reliably re-announce when the live attribute moves between elements. Use a single off-screen live region near the top of any timer-driven UI. New a11y rule, replacing the looser rule from entry 69. **Out of scope (acknowledged):** move repo off OneDrive, downgrade local Node to 22 LTS. User decision per request, deferred to backlog. type-check 0, jest 63, Vitest 401. **First clean OTA in 4 attempts this session** via `pnpm ota:dev`, validating the H1–H4 mitigations took effect: group `dd26612d-499d-4f2a-8635-ec5d6b926659`. |
| 2026-06-03 | AnalyzingModal — staged "perceived progress" for photo + voice AI (`6e12f94`, session 39 cont.) | Replaces the inline-spinner-on-the-button loading UX with a full-screen modal showing a 5-stage checklist that ticks down while one async OpenAI call is in flight. Industry-standard fake-progress pattern, but executed with adaptive pacing so it doesn't feel cheap. Folds in three improvements: premium feel, visible error state (closes the silent-failure bug — todo item C), real Cancel via `AbortSignal`. Shared between photo and voice — same modal, source-specific stage labels + gradient (purple→blue→teal for photo, always-dark for voice). New pure helper (`analyzing-stages.ts`) + hook (`use-analyzing-stages.ts`) + component (`analyzing-modal.tsx`); 13 Vitest cases. **Decisions/patterns:** (1) **Perceived progress with adaptive pacing is the new default for any AI loading >2s.** A flat spinner makes a 5s wait feel like 15s; a staged checklist with the right pacing makes it feel like 3s. The pacing is adaptive (each completed stage gets ≥250ms "done" visibility before next ticks; drain accelerates after response lands) so fast responses don't "slam stages all-done at once" — that's the difference between cheap and good fake-progress. Codified in `analyzing-stages.ts`. (2) **Stage labels must name things the user will see on the next screen** — "Checking GLP-1 nutrients" + "Building your Pro Insight" both reference real cards on the AIReviewSheet. Honest fake-progress beats decorative fake-progress. (3) **Silent failures get visible error states, always.** The error block + Try again button cost 30 lines of UI and eliminate an entire class of "what happened?" support tickets. Standard going forward: any async UI surface MUST have a visible error path. (4) **Cancel is a feature, not an afterthought.** AbortSignal threaded through both AI recognition wrappers via a new `raceAgainstAbort()` helper. supabase-js v2 doesn't propagate signals to the underlying fetch, so the orphan call continues server-side — acceptable trade vs. forking a custom fetch path. One quota slot still spent per abort. (5) **One shared modal serves both sources.** Discriminated via a `source: 'photo' \| 'voice'` prop, source-specific gradient + stage labels + thumb content (real photo vs animated waveform glyph). DRY win + visual consistency. (6) **Modal-then-sheet handoff is gated by an explicit complete flag.** AIReviewSheet doesn't auto-open on `pendingResult != null` anymore; it waits for the modal's drain animation to finish (`modalComplete` flag in log.tsx). Prevents the analyzing modal and the review sheet from rendering on top of each other for a frame. (7) **All copy em-dash-free per CLAUDE.md;** slow-hint specifically reworded from "Slow connection — hang tight..." (em dash, blamey) to "Hang tight. This can take up to a minute on slow connections." (reassurance first, factual second). (8) **Screen-reader live region** on the active stage row via `accessibilityLiveRegion="polite"` — without this, the modal is silent for VoiceOver/TalkBack users. New a11y rule: any timer-driven UI MUST emit live-region announcements on transition. **Recurring bundler footgun codified:** Windows Hermes bytecode generation hit segfault (exit 3221225794 = 0xC0000142, "application failed to initialize properly") on first attempt despite `--clear-cache`. Same family as the bugs in entries 65 and 67. Now seen 4× this session. **Updated bundler playbook:** (a) first response to any Hermes bytecode failure is `pnpm exec eas update --clear-cache` retry; (b) if that fails too, run again WITHOUT `--clear-cache` (the cache miss + segfault combination is sticky on Windows, but the second clean run usually succeeds); (c) only if BOTH fail, consider code-level investigation. The retries cost nothing — bundle takes ~3 minutes — so this is the cheap path. Root-cause is likely a Hermes/Node-24/Windows interaction worth pinning later. OTA group `efd57abb-060a-444f-9e14-0651d29ca0a9`. type-check 0, jest 63, Vitest 401 (+13 new). |
| 2026-06-03 | AI Review Sheet — portion multiplier pills (`aad36a2`, session 39 cont.) | Move 2 from the AI-review-sheet backlog. User wanted a way to say "this was actually 1.5 servings" without retyping 4 fields. After mocking segmented pills (A) vs snap slider (B) side-by-side at `.planning/mockups/portion-multiplier.html`, **shipped A (pills)**. New pure helper `portion-multiplier-helpers.ts` (`scaleMacros` + `deriveFieldBase` + `snapToMultiplier`), new `PortionMultiplier` component (4 `Pressable` pills in a radiogroup, active = `colors.primary` fill + `shadows.sm`, inactive = `colors.border` outline, `haptics.tap()` on change, live `{{kcal}} kcal · {{proteinG}}g protein` readout above). `AIReviewSheet` gains `aiBase` + `multiplier` state alongside the existing `form`; multiplier changes rewrite all 9 numeric form fields from `aiBase × mult`; manual edits re-derive that field's base via `deriveFieldBase` so subsequent scales work around user corrections. 17 Vitest cases. **Decisions/patterns:** (1) **For ≤4 discrete values, pick pills over a slider** — pills are 2–3× faster per change, tap targets are ~3× larger, no stray-drag risk, accessibility comes for free via `radiogroup`/`radio`. A slider hides discreteness behind a drag affordance and is honestly skeuomorphism for a small ordinal set. Codify: **anything with ≤4–5 stable choices renders as segmented pills, not a slider**. (2) **Scaling controls keep the manual-edit affordance bidirectional** — the form's TextInputs stay editable when the multiplier is non-1; manual edits re-derive the base for that field only, so the user can scale → fine-tune → scale-again without losing their tweak. The mental model: "slider scales, typing sets the value for THIS portion". (3) **Null base values stay null through scaling** — `scaleMacros` returns `""` for any field the AI didn't fill in, regardless of multiplier. Inventing numbers out of "unknown × 1.5" is a quiet way to mislead users; degrading gracefully is the only honest choice. (4) **Save path stays dumb** — the existing `parseEntry(form)` reads the already-scaled string values; no save-time math, no extra branches. The scaling layer lives entirely in component state. Keeps the persistence boundary the same shape, which means barcode entries, manual entries, and AI-scaled entries all hit the same `useConfirmPhotoLog` mutation. (5) **Reuse the pure-helper / render-component split** — `scaleMacros` is framework-free and 100% testable, the component just calls `t(...)` with the returned strings. Same pattern as `composeInsight` (entry 67), `pain-level-slider` math, `severity-heat-strip` cell mapping. This is now the default split for any feature with non-trivial branching display logic. OTA group `2b24bcc1`. type-check 0, jest 63, Vitest 388 (+17 new). |
| 2026-06-03 | AI Review Sheet — Pro Insight card (`612c81a`, session 39 cont.) | User saw a competitor's "PRO INSIGHT" callout and wanted the same idea Pro-gated on GLiPra. Mocked 6 borrowed moves at `.planning/mockups/ai-review-sheet.html`; shipped Move 1 only ("one feature one session" per CLAUDE.md). Original label "PHARMACIST INSIGHT" rejected during plan review as credentialing overclaim. Final label: `PRO INSIGHT`. New pure helper `pro-insight-helpers.ts` exporting `composeInsight()` — three headline branches (`under_floor` / `at_floor` (±2g) / `over_floor`) + five phase sublines (one per `InjectionPhase`). New `ProInsightCard` renders a Pro variant (full insight card matching the new content-card design language: brand-purple top accent, primary-light background, brand dot + label) and a free teaser variant that opens the paywall (`RevenueCatUI.presentPaywallIfNeeded({ requiredEntitlementIdentifier: 'GLiPra Pro' })`). Drops into the existing AI Review Sheet between the GLP-1 Watch grid and Cancel/Log It buttons, consumes `form.proteinG` so the headline updates live as the user edits. New `pro_insight` i18n namespace (en/es parity, 10 keys). 19 Vitest cases in `pro-insight-helpers.test.ts` covering all branches, suppression rules, rounding, and an exhaustiveness check on `InjectionPhase`. **Decisions/patterns:** (1) **Pharmacist credentialing stays concentrated, not sprinkled** — the Rx monogram + "pharmacist" word belong on the 25 pharmacist-authored content cards + the founder seal + the AI Coach (the actually-attorney-gated voice slot). A static `floor - consumed` calculation does not earn pharmacist authority and putting the label there inflates the word everywhere else. New rule: **only invoke pharmacist credentialing on features that are literally pharmacist-authored or that go through the same legal gate as `ai-coach`**. (2) **Pro gating + Pro pill is redundant** — when a feature's label already says PRO, dropping the secondary "PRO" pill is cleaner. (3) **No medication advice in deterministic copy either** — the phase sublines describe typical appetite patterns and protein food suggestions only (no dosing, no symptom interpretation), keeping this feature within the same Rule 10 + Liability Rule 3 envelope as `ai-coach` even though it's a static lookup, not an OpenAI call. Attorney review still required for `pro_insight.subline_*` copy before preview/production. (4) **Pure-helper + render-component split is now the standard** — `composeInsight()` is framework-free and 100% testable, the component just calls `t(...)` with the returned key + vars. Same pattern as `pain-level-slider` (gesture math separated from JSX), `severity-heat-strip` (cell mapping pure), and going forward should be applied to any feature with non-trivial branching display logic. **Bundler footgun (recurring):** OTA bombed on Hermes minification of the RevenueCat package + a transient Windows segfault; `--clear-cache` resolved both. Adding to the playbook: **first response to any "Hermes bytecode generation failed" or "invalid property name" error during `eas update` is `pnpm exec eas update --clear-cache`, not code surgery.** OTA group `ad7e3748`. type-check 0, jest 63, Vitest 371 (+19 new). |

| 2026-06-04 | Session 39 closed — backlog snapshot | Session 39 shipped entries 53–73 across two calendar days. master @ ae9fc33, Vitest 401, jest 63, type-check 0. **Next recommended session:** Rescan button (Move 4 from the AI-review-sheet brainstorm) — cache the base64 in sheet state, wire a Rescan link below Log It on the AIReviewSheet, reuse the existing AnalyzingModal + recognize-food edge function. Shares the error-path "Try again" already shipped in AnalyzingModal entry 69. **Pre-launch gate:** six items in the attorney-review queue (see PROGRESS backlog) must clear before any preview/production deploy. **Two user-decision items deferred:** move repo off OneDrive (sourcemap race root cause), downgrade local Node to 22 LTS (Node 24 unsupported by Metro 0.83). |
| 2026-06-04 | Scan Accuracy & Cost Cascade roadmap committed (session 40, `14930c9`) | Brainstormed a 13-point food-scan accuracy + cost strategy (the core insight: the accuracy strategy and the cost strategy are the same strategy — send fewer things to the expensive AI, make it smarter when you do). Assessment against the codebase found **9 of 13 already shipped** (barcode-first, GPT-4o/4o-mini model routing, calibrated prompts + `recentCorrections` + `userComment`, portion multiplier, `user_food_defaults`, `ai_invocations` rate limit, free-tier gating, mock AI). Recorded the 5 remaining items as a leverage-first roadmap (A: log-again from history → B: low-confidence confirmation nudge → C: dietary/allergen prompt context → D: seeded ~200 GLP-1 foods table → E: global anonymized AI cache) in PROGRESS "Current Backlog". **Decision/pattern:** the cascade order every food log should flow through, cheapest+most-accurate first — recent/frequent foods (free, exact) → barcode (free, near-exact) → global AI cache (free, good) → text/voice (4o-mini) → photo (4o, last resort with confidence + user confirmation). Build the free tail before adding more AI. **Attorney gate unchanged** — items touching prompt/disclosure copy still route through the existing review queue. |
| 2026-06-04 | Recent Foods one-tap re-log — cascade item A (`c3bba40`, session 40) | First build off the cascade roadmap and the highest-leverage free lever. Horizontal quick-add bar of the user's most-eaten foods on the Nutrition Log screen; one tap re-logs with no AI call, reusing the user's own last-confirmed macros. New pure helper `recent-foods.ts` (`normalizeFoodName`, `RecentFood`, `deriveRecentFoods` — dedupe a 30-day window by normalized name, keep most-recent macros, rank frequency-desc with recency tiebreak, cap 8); new `relogFoodEntry()` in api.ts (insert at `now`, preserve `source` + `barcode_ean`); new `useRecentFoods` + `useRelogFoodEntry` hooks (reuse the pre-existing `fetchFoodLogsInRange`; `foodLogKeys.recent`; recent-list invalidation added to all 3 insert mutations); new `RecentFoodsRow` component (renders nothing when no history; tap = `haptics.success()` + `✓ Added` flash); `FOOD_LOGGED_RELOG` event; 3 i18n keys en/es; 10 Vitest. No migration, no RLS change, no AI, no attorney gate. **Decisions/patterns:** (1) **For any "quick repeat" surface, reconstruct from the user's own confirmed history rather than re-running AI** — it is the cheapest AND most accurate node in the cascade; a re-log of a staple should never touch OpenAI. (2) **`logged_at = now` is correct for re-log** (the user is eating it again now), so the existing insert functions needed zero signature changes — prefer fitting a new feature to the existing persistence boundary over widening it. (3) **Preserve `source` provenance on re-log** (a re-logged barcode item still reads `source: 'barcode'`) so analytics + the Today list stay truthful about where a food's data originated. (4) **Smart-blend ranking (frequency desc, recency tiebreak)** beats recent-only (a one-off outranks a daily staple) and frequency-only (a brand-new food can't appear) — the right default for any "your usual" list. (5) **Pure-helper + render-component split again** (`deriveRecentFoods` framework-free + 100% testable, component just renders) — now the established pattern across pain-slider math, severity-heat-strip, composeInsight, scaleMacros. (6) **Empty-state = render nothing** for a quick-add surface; a "no recent foods yet" card on a fresh account is clutter, not help. PENDING on-device smoke test + `pnpm ota:dev`. **Next cascade item: B.** type-check 0, Vitest 422 (+10), jest 63. |
| 2026-06-04 | Nutrition screen: meal chips removed + Recent Foods repositioned (`fa2090c` + `9a3e85b`, session 40) | Tile-order pass on the Nutrition Log screen, driven by the question "can we reorder these for ease of use, and is Recent Foods placed well?" **(1) Removed the meal-filter chips** (Breakfast/Lunch/Dinner/Snack) entirely — deleted `meal-chip-row.tsx` + stripped `getMealSlot`, `selectedMeal`, `filteredLogs`, the meal-name `sectionLabel` branch, the chip render, and the filtered empty state. They were a pure *display* filter over a single day's list, wrote no data (the meal slot was derived from `logged_at`, never stored), and did not affect logging. **(2) Moved `RecentFoodsRow` up** out of the results cluster (it had landed below the Daily Macro + Micronutrient cards at ~#10 when first shipped) into the logging zone, directly below the Photo scan button. New order: Header → Voice hero → Photo scan → Recent Foods → Manual/Barcode → form → Daily Macro → Micronutrient → Today's Log. **Decisions/patterns:** (a) **A control that only filters a short single-day display and feeds nothing back into logging or data does not earn permanent top-of-screen space** — remove it rather than relocate, unless it drives behavior. (b) **Logging actions belong in the logging zone, results in the results zone** — the screen's stated "logging-first, results-below" philosophy was violated by a free logging action (Recents) sitting beneath two results cards; fixed by grouping. (c) **Conditionally-rendered tiles can sit high safely** — `RecentFoodsRow` renders `null` with no history, so promoting it doesn't hurt first-run users (they still open on the Voice hero) while returning users get their fastest path in the logging zone. Voice hero kept as the visual lead per user preference (Recents below Photo, not above Voice). No migration, no edge change, no native change. PENDING on-device check + `pnpm ota:dev`. type-check 0, jest 63, Vitest 422. |
| 2026-06-04 | `check-all` made green + GitHub Actions CI added (`3fc2357` + `e8cc328` + `550f7a2`, session 40) | Code-health push. Live measurement reframed the backlog: `pnpm check-all` was red ONLY because eslint reported **32 errors** (type-check already 0, jest green, eslint passes on warnings); 245 warnings never blocked it. Cleared all 32 → check-all EXIT 0, then stood up CI to lock it. **Auto-fix (`3fc2357`):** `eslint . --fix` cleared 23 mechanical errors (import sort, type-specifier style, arrow-parens, indent, operator-linebreak, `isNaN`→`Number.isNaN`, etc.) across 25 files. **Hand-fix (`e8cc328`):** the 9 that needed thought — react-hooks/purity (journey `Date.now()`→`useState` lazy init; feed/post-card `Math.random()`→deterministic index from `id`; safety/hooks `Date.now()` in render→timeout-driven `now` state that re-renders exactly at snooze expiry), react-hooks/preserve-manual-memoization (visit-prep `handleExport` was missing `isPro` from its deps — a **real** dep bug, added), react-hooks/set-state-in-effect (shot-prep ref-guarded one-time init from async data — the one justified `eslint-disable`, cannot cascade), unused `MIN_SCORE`, `ts/no-redeclare` (portion-multiplier's `PortionMultiplier` TYPE collided with the component name → import aliased to `PortionMultiplierValue`), and i18n-json. **CI (`550f7a2`):** `.github/workflows/ci.yml` runs `pnpm check-all` + `pnpm test:utils` on PR + push to master (ubuntu, Node 22, pnpm 10, frozen lockfile, concurrency-cancel). **Decisions/patterns:** (1) **The lint gate fails on errors, not warnings** — so "green" = 0 errors; the 220 remaining warnings are non-blocking and burned down opportunistically (future `--max-warnings` ratchet). (2) **Fix React Compiler rules properly, disable only confirmed false-positives** — 4 of 5 were real fixes (impure render reads, a genuinely-missing dep); only the ref-guarded one-time init got a justified disable. (3) **`react-hooks/purity` in render is usually a real bug** — `Date.now()`/`Math.random()` during render produce nondeterministic output and skip reactivity; the fix (lazy `useState` for stable values, or a timer-driven state for time-sensitive ones) is almost always more correct, not just lint-appeasing. (4) **The i18next syntax validator (`scripts/i18next-syntax-validation.js`) requires 2+ char interpolation vars** — its regex splits into `\w+?`+`\w+`, so `{{n}}` fails but `{{amount}}` passes; renamed the pro_insight subline var `{{n}}`→`{{day}}` (renders identically, no copy change). Gotcha for any future single-char interpolation. (5) **CI runs on Linux** — the Windows/OneDrive Hermes bundler problems are local-only and never affect lint/type-check/test, so CI is clean + fast there. check-all EXIT 0, jest 63, Vitest 422. |
| 2026-06-04 | NativeWind `className` purge — CI caught what local tsc masked (`173bec4` + `1b0c5f3`, session 40) | The first CI PR run failed `tsc` on `className` props on RN components — errors that local `tsc` had reported clean for the whole project's life. Root cause: the Windows local `node_modules` carried a `className` type augmentation that CI's clean `--frozen-lockfile` Linux install did not, so a whole class of type errors was **invisible locally**. Fixed by removing all `className` (NativeWind was never installed → the props were inert/ignored at runtime anyway): deleted the forbidden Obytes **Style tab** (`style-demo` + route), the **feed demo** (5 files + `app/feed` routes), the orphaned **`onboarding-screen`**, and the unused **`checkbox`/Radio/Switch** primitive (settings uses RN's own `Switch`); converted the inert `className` to StyleSheet in the live **Select** chain (`ui/modal`, `ui/list`, `ui/icons/caret-down`) and the `[...messing]` 404 screen. 847 net deletions; jest 63→54 (deleted `checkbox.test`). **Decisions/patterns:** (1) **CI on a clean checkout is the source of truth — local green ≠ CI green when node_modules drift.** A passing local `tsc` is necessary but not sufficient; the authoritative signal is a clean-install CI run. This is the single biggest reason the CI gate (entry above) earned its keep on day one. (2) **Inert `className` is still a type error to purge, not tolerate** — reinforces the standing "NativeWind banned, StyleSheet only" rule; the props did nothing at runtime and masked real screens (modal handle, close-X, caret) rendering unstyled. (3) **Native-module/type drift is a recurring Windows footgun** — when "passes locally, fails in CI," suspect node_modules divergence first. |
| 2026-06-04 | iOS launch path unblocked — Leonava LLC + DUNS issued (session 40) | DUNS number issued for **Leonava LLC**, unblocking Apple Developer **organization** enrollment (not individual — required for the LLC and for the App Store legal-entity listing). Business banking via **Mercury** (industry: Software) in progress, needed for the App Store Connect **Paid Apps Agreement**. **Sequence (decision, recorded for execution):** Apple org enrollment ($99/yr, legal name matches D&B exactly, Apple verifies the org over days-to-weeks) → App Store Connect app record (bundle ID = `app.config.ts` iOS identifier) → sign Paid Apps Agreement → create IAP products (Pro $9.99/mo + $49.99/yr auto-renewables, Founder $149 non-consumable) → App Store Connect API `.p8` key → wire RevenueCat iOS to the existing `GLiPra Pro` entitlement → `eas build --platform ios` → TestFlight. **The attorney-review gate remains the hard pre-submission blocker** — Apple App Review scrutinizes health apps, the "licensed pharmacist" credential claim, medical disclaimers, the App Privacy data-collection label, and HealthKit usage; run the legal review (ai-coach, EscalationCard, daily-guidance, pro_insight, ai_privacy copy) in parallel with Apple's org verification so it isn't the long pole. |
| 2026-06-04 | Biometric sign-in deferred — design captured (session 40) | User asked for fingerprint/Face-ID sign-in; explored then put on hold. **Framing:** Supabase requires credentials, so biometrics can't *be* the auth — it's a **quick-unlock gate over the already-persisted session** (first login still uses password/Apple). **Recommended model (deferred for approval):** app-lock over the AsyncStorage session, gated in root `_layout.tsx` via the existing AppState listener, vs. the heavier `expo-secure-store` hardware-encrypted-refresh-token option; lock-timing (cold-start only vs. + return-from-background) also deferred. `expo-local-authentication` is a **native module → requires a new EAS build, not OTA** (same constraint as the expo-audio migration). Settings "Security" toggle mirrors `NotificationRow`; `EXPO_PUBLIC_SKIP_BIOMETRIC_AUTH` dev-bypass mirrors `IS_DEV_FORCE_PRO`. No PII (OS-handled), no attorney gate; for a health app an app-lock is a privacy plus. Full design in PROGRESS Tier 3. |
| 2026-06-05 | Schema reality correction — `user_medications` table was never built (session 41) | ARCHITECTURE.md (line ~1478) documents a `user_medications` table with `injection_frequency`, `injection_day_of_week`, and `medication_status`. **That table was never implemented.** The live schema stores medication on `profiles` directly (`medication_id`, `dose_mg`, `injection_day_of_week`, `last_injection_date`, `medication_status`). Shots live in `injection_logs`. Furthermore, `injection_frequency` was never persisted: onboarding collected it in `use-onboarding-store.tsx` but `saveOnboardingProfile()` silently dropped it on every save. **Decision:** do NOT migrate medication fields off `profiles` to build `user_medications` now — that would be a large blast radius (onboarding save, today/api, visit-prep, every read site) with zero user-facing benefit. The `user_medications` block in this doc is deprecated. The profiles-based model is the canonical implementation. `dose_frequency` is now finally persisted as part of the oral GLP-1 Phase 1 work. The `user_medications` section in this document is left in place as historical record but marked deprecated. |
| 2026-06-05 | `rybelsus` half-life correction (`3fb9ba8`, session 41) | `HALF_LIVES` in `src/features/medication-level/calculator.ts` had `rybelsus: 0.04` with comment "oral, ~1 hour". This conflated absorption/Tmax with elimination half-life. Oral semaglutide is the same molecule as injectable semaglutide — elimination half-life is ~7 days (~168h). The `0.04` value would have rendered a nonsensical daily spike-and-crash curve on the medication-level chart. **Fix:** removed the bogus `rybelsus` entry; added `semaglutide_rybelsus: 7` (correct) and `orforglipron: 1.1` (~24-30h, Lilly's oral GLP-1 once-daily). Neither was reachable by users since they weren't in `GLP1MedicationId` before this session. |
| 2026-06-05 | Oral GLP-1 as first-class route — Phase 1 foundation (`3fb9ba8`, session 41) | Added oral GLP-1 medications (Rybelsus / oral semaglutide, oral Wegovy, orforglipron) as a first-class `administration_route` (not a bolted-on afterthought). **Core architectural decisions:** (1) **One Readiness engine, two route faces ("reskinned shared hero").** Six of seven existing Readiness factors are already route-agnostic (nausea, energy, protein pace, prev-day protein, new-dose-week, streak). Only the phase factor differs. `injectionPhase` made optional; new `doseStatus: OralPhase` feeds the oral analog. Oral deltas are gentler (±5 vs. ±15 for injection) because steady-state daily dosing has far less week-to-week variation than a weekly peak/trough. Prevented the need for a parallel "Daily Adherence" hero that would duplicate the six shared factors and create two scoring paths to maintain. (2) **Extend `profiles`, not `user_medications`.** New columns on `profiles` via migration 018: `administration_route` (default `'injection'`), `dose_frequency` (finally persisted), `dose_time_local`, `medication_start_date`. New table `oral_dose_logs` (separate from `injection_logs` to keep the safety-relevant, CHECK-constrained injection table clean). (3) **Oral phase model: titration position + adherence, not peak/trough.** Oral GLP-1s reach steady state over ~28 days of daily dosing; there is no weekly cycle. The `OralPhase` type (`building` / `steady_state` / `dose_due` / `dose_missed`) represents titration position with an adherence overlay that takes priority — "no dose logged" defaults to the gentle `dose_due`, never falsely accuses a miss. (4) **`PhaseBadge` reshaped as a discriminated union.** `{ route: 'injection', phase: InjectionPhase, daysSinceInjection }` vs. `{ route: 'oral', phase: OralPhase, daysOnMed }` — exhaustively typed; any new route requires an explicit branch. (5) **Today hero re-gate on route, not `lastInjectionDate`.** The previous gating (`readinessResult` and `readinessCard` were null when `injectionCycle` was null) produced a blank hero for oral users. Re-gated on `profile` presence (always non-null after onboarding). **Oral clinical copy (attorney gate):** all new oral dosing copy — `oral_phase.*`, `readiness.headlines.oral_*`, `readiness.tips.oral_*`, oral injection-day onboarding screen copy — joins the existing attorney-review queue. Educational framing only ("your prescriber's instructions take priority", never "take X"). Phase 2 (Dose Window + adherence streak) is the differentiator; Phase 3 is food-logger coupling + technique card. |
| 2026-06-05 | Oral GLP-1 Phase 2 — Dose Window absorption model + adherence streak (`31e12b8`, session 41) | Built the oral differentiator: the 30-minute empty-stomach absorption window. **Decisions:** (1) **Absorption window is elapsed-time, "taken today" is calendar-day — two separate concerns, deliberately not conflated.** `computeDoseWindow` (`src/features/oral-dose/dose-window.ts`) returns `not_taken` / `absorbing` / `clear`. It stays `absorbing` whenever elapsed < 30 min **even across midnight**, because the alternative (flipping to `not_taken` at 00:00 while a pill is still absorbing) would invite a dangerous second dose. Only after the window clears does calendar day decide `clear` (taken today) vs `not_taken` (yesterday's dose, today's pending). Clock skew (future timestamp) clamps to a full window rather than a negative countdown. This is Rule-4-bar pure logic (20 Vitest). (2) **`ABSORPTION_WINDOW_MIN = 30` is the single source of truth**, mirrored as a private constant in `notifications.ts` for the clear-notification timer — kept as a local mirror rather than a shared import because the notifications module must stay importable before the native layer initializes. (3) **The countdown ticks inside the card, not in `useTodayData`.** `DoseWindowCard` owns a local `now` that ticks 1s while absorbing, 30s otherwise, so a per-second re-render is scoped to the card instead of re-running the whole Today data hook every second. Optimistic local timestamp on "Took it" starts the countdown before the dose-log refetch lands. (4) **Adherence streak reuses the protein-streak shape** (`computeDoseAdherenceStreak`): consecutive calendar days with ≥1 dose, live only if the last dose is today/yesterday — no new streak engine. (5) **`window_respected` logged as `null` in Phase 2** (the "Took it" tap is the adherence signal); capturing whether the user actually waited is deferred to Phase 3. (6) **Route-aware notifications:** `scheduleOralDoseReminder` (DAILY at `dose_time_local`) + `scheduleAbsorptionClear` (30-min `TIME_INTERVAL` one-shot, scheduled on dose-log when the oral reminder is enabled); Settings shows a route-correct reminder row. (7) **`MedLevelBanner` route-gated off for oral** — it reads `injection_logs`; wiring `oral_dose_logs` into the PK curve is a Phase 3 item. **Attorney gate:** `oral_dose.*` copy + the two oral notification bodies join the review queue. |
| 2026-06-06 | Content cards are route-aware + tier-1 dual disclaimer (session 42, Phase 3 technique card) | Adding the oral empty-stomach technique card surfaced that content-card surfacing was **route-blind**: both the spotlight selector and the carousel called `getActiveCards()` with no filter, so a universal oral card would have leaked to injection users. **Decisions:** (1) **Cards can be route-scoped via an optional `route?: AdministrationRoute` field** + a pure `getActiveCardsForRoute(route)` helper (`src/features/content-cards/data.ts`). Cards with no `route` stay universal (shown to everyone) → zero regression for the existing 25 injection-era cards; a `route: 'oral'` card is hidden from injection users and vice versa. `today-screen.tsx` derives `cardRoute` from `isOral` and feeds it to both the spotlight `useMemo` and the carousel. (2) **Tier-1 (clinical) cards now render a dual disclaimer — top AND bottom of the sheet** (`content-card-sheet.tsx`), satisfying liability rule 4 generically for all clinical cards, not just the new one; tier-2 educational cards keep bottom-only. The carousel tile already showed the tier-1 inline disclaimer. (3) **Content-card bodies stay inline English** (the whole 25-card corpus is inline, not in the translation files); per-card ES localization is a deferred corpus-wide item, not a one-card change. **Attorney gate:** the `oral-empty-stomach` card copy joins the review queue. |
| 2026-06-06 | Visit-prep is route-aware (session 42, Phase 3) | Prescriber Visit Prep was injection-framed end to end (INJECTION CYCLE card + AI prompt context + PDF section). Made it route-aware: oral users get a **DOSE ADHERENCE** summary (treatment status, dosing streak, days since last dose) on the screen, in the AI questions, and on the PDF; injection users unchanged. **Decisions:** (1) **Label/derivation logic extracted to a pure `src/features/visit-prep/summary.ts`** (`medicationIdToName` incl. oral meds, `injectionPhaseLabel`, `oralPhaseLabel`, `daysSinceLastDose`) so route-branching is unit-tested (11 Vitest) — the feature had zero tests before. (2) **Edge-function schemas add `administrationRoute` defaulting to `'injection'`** with the injection fields made optional + new optional oral fields, so the change is **backward-compatible** — existing injection clients keep working without sending a route. (3) **The AI system prompt is unchanged** (already route-agnostic: GLP-1 efficacy/dosing/management questions); only the anonymized **data context** branches, so this is not a new attorney-gated system prompt — but the oral fallback/mock prescriber questions are pharmacist-authored copy and join the review queue. (4) **Oral clinical signal = adherence**, not a pharmacokinetic phase: dosing streak + days-since-last-dose from `oral_dose_logs` is what a prescriber needs for a daily oral GLP-1, mirroring the injection cycle's role for weekly shots. |
| 2026-06-06 | `window_respected` capture + technique-aware streak (session 42, Phase 3) | Phase 2 logged `oral_dose_logs.window_respected` as `null`; this captures it after the absorption window clears so the adherence streak reflects technique, not just dosing. **Decisions:** (1) **Capture lives in the Dose Window card's `clear` state, gated on `window_respected === null`** — NOT a transient modal fired at the absorbing→clear transition. The app is usually closed at the 30-minute mark (the `oral-absorption-clear` notification handles that moment); a state-gated prompt shows live if watching AND persists for the next open, giving one robust capture path with no missed answers. (2) **The streak breaks only on an explicit `false`** (the user reported eating/drinking early), which acts like a missing day; `null` (unanswered) and `true` both count. Critically, this means all-null data behaves byte-identically to the pre-existing dosing streak — the metric only starts weighting on technique once users actually answer, and it never punishes non-answering or honesty (which would incentivize lying). (3) **First UPDATE path on `oral_dose_logs`** (`updateOralDoseWindowRespected`, user-scoped by id+user_id) — the table already had an RLS owner-update policy from migration 018, so no schema/policy change. (4) `computeDoseAdherenceStreak` signature changed from `string[]` to `{ takenAt, windowRespected }[]`; the single caller (`today/hooks.ts`) and its tests were updated, existing assertions preserved by mapping to `windowRespected: null`. **Attorney gate:** the `oral_dose.confirm_*` copy joins the review queue. |
| 2026-06-06 | Oral PK curve — route-aware, normalized/relative (session 42, Phase 3, completes oral) | Brought the medication-level curve, Today banner, and `/medication-level` screen to oral users. **Decisions:** (1) **`useMedicationLevelCurve` branches on `administrationRoute`** — oral reads `oral_dose_logs` (daily interval), injection reads `injection_logs`. The result gained `administrationRoute` + `isRelative` + a generic `injectionDates` (= dose-event dates for either route, name kept for chart-prop compatibility). (2) **Oral curve is normalized/relative, not mg.** Oral users have no recorded dose amount anywhere — `oral_dose_logs` has no mg column and `profile.dose_mg` is never populated (onboarding declares `doseMg` but no screen sets it; the injection curve sources dose from `injection_logs.dosage_strength` instead). So the oral curve uses a unit dose and the screen shows a "RELATIVE LEVEL" percent-of-steady-state, not `~X mg`. The half-lives are correct, so the curve *shape* (accumulation + daily rhythm) is honest; only the absolute scale is normalized. Capturing a real oral dose (onboarding picker or per-dose mg) is deferred. (3) **The Rule-4 `generateSteadyStateCurve` is reused unchanged** — it already supported `interval=1` (daily) + `actualInjectionDates`; only the hook/screen/banner changed, so no new safety-bar surface. (4) **MedLevelBanner is a discriminated route/phase union** picking `med_banner.*` vs `med_banner_oral.*`; the Today `!isOral` gate was removed so oral users get the banner. **Attorney gate:** `med_banner_oral.*` copy joins the queue. |
| 2026-06-06 | Adversarial multi-agent review is a standard gate for large surfaces (session 42) | Ran a 12-agent review workflow over the 51-file oral GLP-1 surface (5 dimension reviewers — route-gating, safety/RLS/liability, correctness, i18n, pure-math — each finding adversarially verified refute-by-default, then synthesized). It caught a data-corrupting HIGH bug that green tests + green CI missed. **Durable lessons:** (1) **A persistently-mounted card that holds OPTIMISTIC local state must reset that state when its identity prop changes** — `DoseWindowCard` kept day-1's `localAnswered` forever, silently breaking the technique confirm + streak from day 2. Fix pattern: during-render `prevIdRef` reset (React's "adjust state on prop change"), not a `useEffect`. Any optimistic-state card mounted once across many entities needs this. (2) **Route-aware screens must route the CHROME too, not just the data widget** — oral users saw an "INJECTION CYCLE" label wrapping a correct oral phase badge; gate labels/empty-states on `isOral`, not only the inner component. (3) **Pure safety-bar functions should defend their own invariants** (e.g. `generateSteadyStateCurve` now dedupes dates internally) rather than trusting callers. Green tests prove what they assert; they do not prove the absence of an un-asserted defect — for a large new surface, an adversarial review pass before promotion is worth it. |
| 2026-06-06 | Dietary pattern persisted + fed to recognize-food (session 42, scan-cascade C) | `dietary_pattern` was collected in onboarding but dropped on save (no column, no upsert field). Migration 019 adds `dietary_pattern` (CHECK enum) + `allergens` (TEXT[]) to `profiles`; onboarding now persists the pattern. **Decisions:** (1) **Dietary preference is anonymized prompt context, not PII (Rule 2)** — a categorical diet/allergen flag identifies nobody, so it is safe to send to OpenAI to bias photo identification; `recognize-food` is food-ID (not clinical), so it stays out of the attorney queue. (2) **Only constraining diets are sent** (`vegetarian`/`vegan`/`pescatarian`) via the pure `buildDietaryContext` helper — omnivore/other/null add no signal and waste tokens. (3) The prompt instruction is a **tie-breaker only** ("prefer the consistent identification when ambiguous; do not override clear visual evidence") so it improves accuracy without forcing wrong answers. (4) **`allergens` column added ahead of its collection UI** and the edge function accepts it optionally, so the future allergen picker needs no migration or edge redeploy. Voice (`transcribe-food`) dietary context deferred. |
| 2026-06-07 | Dose tab + Today de-duplication — Direction B redesign Phase 1 (session 43) | Dose surfaces were scattered + triplicated: one value (oral/injection phase) was echoed across the readiness headline, a phase-badge metric card, and the med-level banner on Today, while injection users' slot-2 tab was a bare "Sites" screen and oral users had an empty slot-2. **Decisions:** (1) **One route-aware Dose tab in slot 2 for both regimens** (`(app)/dose.tsx` → `src/features/dose/dose-screen.tsx`), replacing the injection-only Sites tab — the bar stays at 5 tabs; oral users gain the tab. Only the icon switches by `administration_route` (Pill vs Syringe) in `glipra-tab-bar.tsx`; `injection-sites` stays a hidden `href:null` route so old deep links resolve; `TAB_ROOTS` updated so hardware-back exits at `/dose`. (2) **Hub composes existing components, no new data layer** — DoseWindowCard / PhaseBadge / InjectionCycleCard / MedLevelBanner / the extracted `DoseInjectionRotation` — reusing `useTodayData`. Detail screens (`/medication-level`, `/shot-prep`, `/add-shot`, `/edit-shot`) stay pushed routes reached from the hub (no file moves → deep links intact). (3) **Today shows the dose ONCE** — removed the redundant STATUS surfaces (phase-badge metric, cycle strip, shot-day-prep, med-level banner); oral keeps the DoseWindowCard action (now also gated off when discontinued), injection gets a single smart row from the pure `selectInjectionDoseRow` (→ `/add-shot` on injection-day / 0-days-left / no-cycle, else `/dose`). Protein ring promoted to full width. (4) **Pure-helper-first, no screen tests** — `recent-doses.ts` + `smart-dose-row.ts` with Vitest, matching the codebase convention (no data-mocked screen tests exist); the hub is verified by type-check + the helpers + on-device. (5) **Protein-ring empty state** — shows "Set your target" when `protein_floor_g` is null (was a bare "of 0g"); the 200 a user reported is the real stored floor clamped at `ABSOLUTE_CEILING_G`, not a placeholder. (6) **No migration** — every column already existed; reminders/adherence-calendar are Phases 2-4. (7) **Localization parity** — promoting the injection rotation UI to a primary tab surfaced its pre-existing hardcoded English; moved all of `DoseInjectionRotation` + the legacy injection-sites screen into the `dose.*` i18n namespace (EN/ES). **Adversarial review** (5-dimension workflow) found 6 issues, all fixed before ship. **Attorney gate:** new `dose.*` + `today.dose_row_*` copy joins the queue (educational, defers to prescriber; no dosing advice; Rule 8 tier-1 + tier-2 on the hub). |
| 2026-06-07 | Dose tab Phase 2 — reminders panel + oral dose-time editor (session 44) | The notification system already existed (`src/lib/notifications.ts` + `use-notification-settings.ts`: injection-reminder, oral-dose-reminder, oral-absorption-clear, daily-protein-nudge) but was buried in Settings, and `profiles.dose_time_local` (the oral reminder time) had **no edit UI** — it was set once at onboarding and never editable. The Dose hub's reminders section was a stub `ActionRow` that just deep-linked to `/settings`. **Decisions:** (1) **Route-aware `RemindersPanel`** (`src/features/dose/reminders-panel.tsx`) replaces both stub rows (oral + injection branches) in `dose-screen.tsx`. Oral face = oral-dose toggle + editable time picker + absorption-clear info row + protein-nudge toggle; injection face = injection toggle + protein-nudge toggle. (2) **Reuse, don't rebuild** — the panel calls the existing `useNotificationSettings()` for all toggle state/scheduling, and replicates the `NotificationRow` switch pattern from `settings-screen.tsx` as a local sub-component (it was never exported). Toggle labels reuse the existing `settings.notif_*` i18n keys; only 4 new `dose.reminders_*` keys were added (EN/ES). Settings keeps its own toggles unchanged (no migration of controls). (3) **Oral time editor** — a `DateTimePicker` in `mode="time"` (the native module already compiled in since session 23, used by add/edit-shot) writes `profiles.dose_time_local` via a new `src/features/dose/api.ts` (`updateDoseTime` + `useUpdateDoseTime` mutation that invalidates `['today-profile', userId]`). The Postgres TIME string (`HH:mm:ss`) ↔ `Date` conversion uses date-fns `parse`/`format`/`isValid` (Rule 6, no raw Date math), defaulting to 8:00 AM when null/malformed. On change, the panel writes the DB then, if the oral reminder is on, reschedules via the existing `notifications.scheduleOralDoseReminder(time)` in the mutation's `onSuccess` so the daily trigger updates immediately. (4) **No migration** — `dose_time_local` has existed since the oral GLP-1 Phase 1 schema (migration 018). (5) **Component test, not pure helper** — unlike Phase 1 (which had no screen tests), the panel ships with `reminders-panel.test.tsx` (11 jest-expo RTL cases: route-faces, time-row visibility tied to the oral toggle, absorption-info gating, toggle dispatch) because all logic lives in the component, not an extractable calculator. Lives next to the component (jest-expo), not in `src/__tests__/` (Vitest-only). **Rule 8:** panel is educational → Tier-2 only; the Dose hub already carries the Tier-1 top banner. **Attorney gate:** new `dose.reminders_*` copy joins the queue (educational, defers to prescriber; no dosing advice). 71/71 tests green, 0 type errors, 0 lint errors. |
| 2026-06-07 | Settings protein-target editor — closes the Phase-1 empty-state loop (session 46) | Phase 1 added a "Set your target" empty state to the protein ring when `protein_floor_g` is null, but it was a confirmed dead-end: `ProteinRing` is presentational (no `onPress`) and the floor was only ever written at onboarding, so existing users with a null/stale floor had no way to set it. **Decisions:** (1) **A reachable editor that reuses the Rule-4 calculator unchanged** — new `src/app/(app)/protein-target.tsx` (thin route) → `src/features/protein-target/protein-target-editor.tsx`. It re-collects weight/height/activity/kidney/pregnancy (unit-aware via the existing `UnitToggle` + `useWeightUnit`/`useHeightUnit`), recomputes the floor live through a new pure `previewProteinFloor` (`preview.ts`: bmi + null-guards + `calculateProteinFloor`), and persists `weight_kg/height_cm/bmi/activity_level/has_kidney_disease/is_pregnant/protein_floor_g`. **It does NOT write `phase`** (phase is driven by medication status via `/update-status`). (2) **Two entry points** — a "Protein target" row in Settings → Body Metrics (shows the current floor), and the Today protein-ring card is now tappable. (3) **Rule 5 + Rule 8 carried over from onboarding** — Tier-1 `DisclaimerBanner` with the verbatim inaccurate-inputs warning + an acknowledgment checkbox that gates Save. (4) **`TodayProfile` gains `activityLevel`** (added to the type + SELECT + map) so the editor pre-fills it. (5) **Pure-helper-first** — `preview.ts` named (not `calculator.ts`) to stay out of the Rule-4 coverage-threshold globs, tested in `src/__tests__/` (matches the Phase 1-3 precedent). **Adversarial review** (4-dimension workflow, each finding refuted before counting) found 3 confirmed issues, all fixed before ship: **(HIGH x2, same root)** a hydration-vs-async-unit-preference race seeded inputs in the default unit before the persisted unit loaded from AsyncStorage, corrupting the saved weight for kg users (`181.9` lbs persisted as `181.9` kg → wrong bmi/floor) and blanking height for metric users — fixed by adding a `loaded` flag to `useWeightUnit`/`useHeightUnit` and gating the seed effect until both load (+1 regression test); **(MEDIUM)** the editor recomputed from the persisted, drift-prone `profile.phase` — fixed by deriving phase from `profile.medicationStatus` at compute time (matching onboarding). A separate pre-existing bug (`update-status.tsx` never rewrites the `phase` column, so it drifts app-wide) was flagged for its own task, out of scope here. **No migration.** **Attorney gate:** `protein_target.*` copy joins the queue (EN disclaimer reuses the onboarding wording; ES translated). jest 84, vitest 559, type-check 0, lint 0 errors. Client-only OTA. **Dose-tab Direction-B work (Phases 1-4) complete; remaining Phase-4 polish — in-hub PK viz, visit-prep hub link — deferred.** |
| 2026-06-07 | Metro bundler crash fix + `profiles.phase` column drift fix (session 47, `491ea39`) | **Root cause:** `src/app/(app)/update-status.test.tsx` was inside Expo Router's `require.context` scan zone (everything under `src/app/`). The scan pulled `@testing-library/react-native` into the native bundle; that package imports Node's `console` module, which Metro cannot bundle for native targets, crashing the bundler. **Fix:** (1) Extracted the full screen to `src/features/medication-status/update-status-screen.tsx` (named export `UpdateStatusScreen`), made `src/app/(app)/update-status.tsx` a one-line thin re-export, and relocated the test to `src/features/medication-status/update-status-screen.test.tsx` — outside `src/app/`, where `require.context` never reaches. **Permanent rule:** Never put `.test.*` files anywhere under `src/app/`. Screen logic + tests always live in `src/features/[feature]/`; the route file is only a thin re-export. (2) The relocated test also guards the **`phase` column drift fix** added to `update-status-screen.tsx`: every save now co-writes `profiles.phase` (`'maintenance'` when `medicationStatus` is `maintenance` or `tapering`, else `'weight_loss'`) alongside `medication_status`. Before this fix, `phase` was only written at onboarding; the `/update-status` screen changed `medication_status` but never the derived `phase`, so every downstream reader of `profile.phase` (readiness, protein guidance, the protein-target editor, the injection-cycle calculator) used a stale value. **Tests:** 4/4 jest-expo RTL pass (assert both columns per save path). OTA `95c74cee` pushed to `development` channel. No migration, client-only. |
| 2026-06-07 | Dose tab Phase 3 — adherence calendar + injection on-time streak (session 45) | The hub gave oral users a 7-day recent strip but injection users had no consistency view, and there was no streak/on-time math for injections (only the count-ratio `calculateAdherence` in `progress/calculator.ts`, a different metric). Phase 3 ships a route-aware trailing-week **adherence calendar** for both faces plus a genuine injection on-time-streak calculator. **Decisions:** (1) **Two pure helpers + one component, pure-helper-first.** `src/features/dose/injection-adherence.ts` (`computeInjectionAdherence`): scores each expected dose-day (`firstDose + k·interval`) as on-time (a log within a +/-1 day grace), missed (grace window passed, no log), or **pending** (the current open slot, skipped entirely so an in-progress period never breaks the streak or dents the rate); returns `{ currentStreak, longestStreak, onTimeRate, expectedCount, loggedCount }` where streak units are expected-doses (= weeks for a weekly regimen). Plus `deriveInjectionIntervalDays` (1/7/14, mirrors the private one in `medication-level/hooks.ts` so the calendar stays independent of the PK curve hook). `src/features/dose/adherence-calendar-data.ts` (`buildAdherenceCalendar`): Monday-aligned trailing-week grid (`weeks*7` cells) with per-cell status, oral porting the proven `recent-doses.ts` rule (taken/broken/missed/none), injection marking logged days `taken` + resolved expected-miss days `missed`. (2) **Reuse the oral streak** — the calendar calls the existing `computeDoseAdherenceStreak` for oral; only injection needed net-new math. (3) **Route-aware windows** — oral = 4 weeks of daily dots (matches the protein `StreakCalendarCard`); injection = 8 weeks of weekly markers so the week-streak is legible. (4) **Honest empty/sparse states** — oral with no logs shows an empty card; injection below 2 distinct logged days shows "not enough data yet" instead of a misleading 100% (the calculator stays honest; the component gates the display). (5) **Local-calendar-day consistency** — the grid, the oral builder, the injection builder, and the component's tap-detail lookups all normalize timestamps to LOCAL days via `format(parseISO(...))`, avoiding the UTC `slice(0,10)` mismatch that would drop a late-night dose on the wrong cell (the standalone streak *calculator* keeps `slice` since it only emits TZ-stable numbers, not cell positions). (6) **Lightweight inline day-detail** — tapping a cell toggles an inline status row (date + taken/broken/missed/none, with dose time or shot site), no modal. (7) **Today de-dup continues** — the oral 7-day strip is removed from the hub (the calendar's recent rows subsume it); `recent-doses.ts` + its Vitest stay (harmless, still green). **No migration** (all columns existed). **Rule 8:** calendar is educational -> Tier-2 only (hub carries Tier-1). **Attorney gate:** 18 new `dose.calendar_*` keys (EN/ES) join the queue (educational, no dosing advice). jest 77, vitest 549 (+30: 21 injection-adherence + 9 calendar-data), type-check 0, lint 0 errors. Client-only OTA. **Phase 4 remains:** in-hub PK/titration polish + Settings protein-target editor. |
| 2026-06-08 | Muscle-First MVP — strategic re-center + Phase A (resistance log, session 48, migration 020) | **Audit + competitive analysis this session** found Glipra over-built on the commodity (dose/injection tracking: a full Dose tab, med-level PK, dual adherence calendars, site rotation — where Shotsy/DoneDose/MeAgain already win) and under-built on its differentiator (muscle preservation). Market gap: GLP-1 users lose 10 to 25% lean mass, protein intake runs ~0.6 g/kg/day, and existing apps "log what you eat but never tell you what to eat" or whether muscle is preserved. Two redundancies confirmed: protein streak on Today AND Progress; injection on-time % on Dose AND Progress. **User-chosen direction:** re-center on muscle + fill competitive gaps + track muscle as an OUTCOME. A phased **Muscle-First MVP** roadmap was written (spine = a Muscle Preservation Score combining protein adherence + resistance activity, reusing the Readiness-Score architecture): A resistance log, B the score, C Progress reframe + de-dupe, D expose micronutrients + add iron + surface discontinuation mode, E "what to eat" protein-gap suggestions (depends on cascade D foods table), F hydration + fiber as daily metrics, G trim onboarding 13 -> ~8. **Phase A shipped (this session):** the new resistance-training signal. **Decisions:** (1) **Resistance is a WEEKLY-FREQUENCY behavior (2 to 3 sessions/week), not a daily streak.** New pure `computeResistanceFrequency` (`src/features/resistance/frequency.ts`, `RESISTANCE_WEEKLY_TARGET = 2`) buckets distinct training DAYS into Monday-aligned weeks and scores each RESOLVED past week as hit (>= target days) or miss; the current week is pending (surfaced as `currentWeekSessions`, never penalized), mirroring the resolved-vs-pending discipline of `computeInjectionAdherence`. Distinct-day dedupe so a double-log cannot inflate a week. Returns `{ currentWeekSessions, weeklyTarget, currentStreak, longestStreak, weeksTracked, hitRate, loggedCount }`. (2) **New `resistance_logs` table (migration 020)** — one row per session, optional `session_type`/`duration_min`, RLS 4 policies (Rule 7). (3) **Dedicated lightweight surface, not folded into check-in** — a `/resistance` screen (thin-route pattern: screen in `features/resistance/`, route is a re-export, test in `features/`, reinforcing the session-47 bundler-crash rule) with a weekly-progress card, a one-tap "Log a session" (optional type chips + duration), a recent list with delete, and a Tier-2 educational disclaimer (Rule 8, defers to physician). (4) **Today Resistance action row** (after Track Weight) shows "{n} this week", success-tinted when the weekly target is met, taps to `/resistance`. New `Dumbbell` line icon. (5) **No score yet** — combining protein adherence + resistance into the Muscle Preservation Score is Phase B. **i18n:** new `resistance.*` namespace + `today.resistance_*` (EN/ES parity); educational copy joins the attorney queue. **Tests:** 13 Vitest (`resistance-frequency`) + 7 jest-expo RTL (`resistance-screen`). jest 95, vitest 572, tsc 0, lint 0 on touched files. Migration pushed to cloud; client OTA. **Next: Phase B (Muscle Preservation Score), then Phase C (Progress reframe + de-dupe).** |
| 2026-06-08 | Dev-OTA Supabase creds fix + real-AI owner decision (session 48, `c942ec6`) | A device sign-in showed `TypeError: Network request failed`. Investigation separated three things. (1) **The immediate error is device-side network**, not the app: the installed dev build has real Supabase creds baked from `eas.json`'s `development` profile, and the project is up (migration 020 pushed fine); an empty-cred bundle would instead throw `"Missing Supabase env vars"` before any fetch. (2) **Latent bug — dev-channel OTAs shipped with EMPTY Supabase creds.** `ota:dev` runs `eas update` in production mode, so Expo loads `.env.production`, whose `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` are blank; the EAS-hosted `development` environment is also empty (so `--environment development` does not help — confirmed by "No environment variables ... found for the development environment"). Every dev OTA this session (incl. Phase A `f654bf8f`) bundled without creds, so a device that *pulled* one would break auth. **Fix:** `ota:dev` + `ota:dev:clear` now inline `EXPO_PUBLIC_APP_ENV=development` + the dev `EXPO_PUBLIC_SUPABASE_URL` + the publishable `ANON_KEY` via `cross-env` (the key is already committed in `eas.json`, client-safe `sb_publishable_` prefix, so no new exposure). Because these come from the shell env they are inlined into the bundle but do NOT appear in Expo's "env: export ... from .env" log line — that absence is expected, not a failure. Re-shipped a healthy update (`4addf304`). (3) **Real-AI owner decision (2026-06-08):** owner runs `EXPO_PUBLIC_USE_MOCK_AI=false` (real OpenAI) in dev and will handle attorney review of the AI-coach prompts + EscalationCard copy before any PRODUCTION publish. CLAUDE.md's "Legal gate" Open-Blockers row + the "OpenAI mocked by default" cost note were updated to record this so the gate no longer blocks dev OTAs/builds. The `$20/month` OpenAI cost-awareness note is kept (cost guardrail is separate from the legal gate). The deliberately-omitted `USE_MOCK_AI` flag in the OTA command means it is sourced from `.env.production` (`false`), shipping real AI per the decision without the command naming the gated flag. |
| 2026-06-08 | Muscle-First MVP Phase B — Muscle Preservation Score (session 48) | The spine of the re-center: a 0-100 Today hero card that finally makes the app's promise ("don't lose muscle") a tracked number. **Decisions:** (1) **A trailing-window weighted blend of the two controllable levers** — PROTEIN consistency (primary) + RESISTANCE training (amplifier), weighted **70/30 (owner decision)**. Pure `calculateMuscleScore` (`src/features/muscle-score/score.ts`) returns `{ score, factors:[protein,resistance], proteinTracked, resistanceTracked, hasEnoughData }`; pure display builder `buildMuscleScoreCard` (`card.ts`) maps to a headline band + transparent factor rows + one improvement tip, mirroring `buildReadinessCard`. Named `score.ts`/`card.ts` (NOT `calculator.ts`) to stay out of the vitest Rule-4 90% coverage globs while being fully tested in `src/__tests__/` (Phase A precedent). (2) **Never penalize an un-tracked lever (re-normalization).** Protein adherence = hits / days-WITH-DATA over a trailing 28 days (so a user is scored on the days they actually logged, not punished for untracked days; counts only when a protein floor is set and >= 3 logged days). Resistance adherence = the weekly hit-rate from `computeResistanceFrequency`, counted only once >= 1 week has resolved. If a lever has no data, its weight re-normalizes onto the tracked lever, so a brand-new protein-logger is NOT capped at 70 for never having logged a workout; once resistance has >= 1 resolved week it counts (a protein-perfect, never-training user then caps at 70). Neither lever tracked -> `hasEnoughData=false` -> the card shows an invite state with a `--` score. (3) **Hero placement** — mounted ABOVE the Readiness card on Today (the muscle score is the core promise; readiness stays as the daily/dose-aware secondary). Self-contained via `useMuscleScore()` (composes `useProteinHistoryPerDay(28)` + `useResistanceWeekly`), so `useTodayData` was not bloated. (4) **Rule 8 disclaimer = Tier-2** (not Tier-1): the score is a derived estimate of HABITS, not AI output / the protein floor value / medication content, and not a measurement of actual muscle mass; the disclaimer says exactly that and defers to the prescriber. (Attorney may upgrade.) **No backend** — reads existing tables; no migration. **i18n:** new `muscle_score.*` namespace (EN/ES). **Tests:** 17 Vitest (10 score + 7 card) + 3 jest-expo RTL. jest 98, vitest 589, tsc 0, lint 0 on touched files. Client OTA. **Attorney queue:** `muscle_score.*` (headlines, factor labels, tips, disclaimer). **Next: Phase C (Progress reframe around the muscle-score trend + de-dupe the protein streak / injection %).** |
| 2026-06-08 | Muscle-First MVP Phase C — Progress reframe + de-dupe (session 48) | Made the Progress tab tell the "is it working over time?" story around the Phase B score, and removed the two redundancies the audit found. **Decisions:** (1) **A weekly Muscle-Score TREND is the new Progress hero.** Pure `buildMuscleScoreTrend` (`src/features/muscle-score/trend.ts`) builds one snapshot per Monday-aligned week over the trailing ~10 weeks: for each week it recomputes the Phase-B composite "as of" that week's end (protein adherence over the trailing 28 days ending then; resistance adherence over weeks resolved by then) via the existing `calculateMuscleScore` + `computeResistanceFrequency`. Known approximation (documented): historical days are scored against the CURRENT protein floor (no per-day floor history stored). Named `trend.ts` (not `calculator.ts`) per the coverage-glob precedent; Vitest in `src/__tests__/`. `useMuscleScoreTrend` composes `useProteinHistoryPerDay(weeks*7+28)` + `useResistanceLogs`. New `MuscleScoreTrendCard` (`src/components/progress/`) renders a compact fixed-0-100 SVG line (only weeks with data plotted; latest point emphasized) inside the shared `CardShell` + `PharmacistTip`. (2) **Removed the two duplicate cards:** the protein `StreakCalendarCard` (duplicated the Today streak) and the `InjectionAdherenceCard` (duplicated the Dose-tab on-time %) were deleted (`git rm`) and dropped from `progress.tsx`. `useInjectionAdherence` stays (the weight EWMA chart still uses it for injection markers); `useProteinHistoryPerDay` stays (protein hit-rate + the trend). New Progress order: **Muscle trend, Weight results, Weight trend, Protein hit-rate, Symptoms.** The Protein Hit-Rate + weight + symptom cards were KEPT (unique analytics, not Today/Dose duplicates). (3) **Hid the Today streak empty state** (the user's original request, folded in): `StreakCard` now renders only when `currentStreak > 0`, so the "Start your streak today!" nag is gone; the card still appears once a streak exists. (4) **Tip registry** (`pharmacist-tips.ts`): `PharmacistTipKey` dropped `'streak'|'injection'`, added `'muscle'`; the orphaned `progress.streak_card.*` / `progress.adherence_card.*` / `progress.tips.{streak,injection}` i18n removed, `progress.muscle_card.*` + `progress.tips.muscle` added (EN/ES). Rule 8: the screen keeps its Tier-2 footer disclaimer (educational). **No migration.** **Tests:** 7 Vitest (`muscle-score-trend`) + 3 jest-expo RTL (`muscle-score-trend-card`). jest 101, vitest 596, tsc 0, lint 0 on touched files. **Attorney queue:** `progress.muscle_card.*` + `progress.tips.muscle`. **Ship note:** the Phase B OTA hit the Windows Hermes segfault (exit 3221225477); B + C ship together via `ota:dev:clear`. **Muscle-First MVP arc A->B->C complete;** D (expose micronutrients + iron + discontinuation), E (what-to-eat, needs cascade D), F (hydration/fiber), G (onboarding trim) remain. |
| 2026-06-09 | Muscle-First MVP Phase D (part 1) — iron tracking end-to-end (session 49, migration 021, `ab33f34`) | Iron deficiency + hair thinning is a top unmet need for the female-skewing GLP-1 audience; the micronutrient watch tracked Mg/Zn/B12/VitD but no iron. Owner scoped THIS session to the full iron data pipeline (un-gating + surfacing discontinuation deferred). **Decisions:** (1) **Iron added everywhere the existing 4 micros live**, mirroring them exactly: migration 021 adds nullable `iron_mg` to BOTH `food_logs` AND `user_food_defaults` (the per-food defaults table that pre-fills repeat scans, easy to miss); the `recognize-food` edge function gets `ironMg` in its Zod `OutputSchema`, FALLBACK, and the prompt JSON template + instruction line (redeployed; Rule 3 still validates, optional+nullable so old responses don't crash); both mocks (`MOCK_MEAL_RECOGNITION` + `MOCK_VOICE_PARSE`) + the voice + photo fallbacks updated; barcode-lookup maps OFF `iron_100g` (g->mg) + **USDA nutrient id 1089** (the exploration agent wrongly said 1087, which is calcium — caught + corrected); `ironMg` threaded through `FoodLogEntry`/`BarcodeFoodEntry`/`PhotoFoodEntry`/`RecognitionResult`/`RecentFood`/`MacroBase`/`MacroFormStrings`, the row schema + `rowToEntry`, all insert/read paths (`insertBarcode`/`insertPhoto`/`relog`/`upsertFoodDefault`/`getFoodDefault` + both food_logs SELECTs), `useDailyMacros` (sum + `hasMicronutrients`), and the AI review sheet (an editable **Iron** field that also scales with the portion multiplier via `portion-multiplier-helpers`). (2) **Watch UI:** a 5th Iron tile; the grid was already `flexWrap` + `minWidth:45%` so 5 tiles wrap cleanly (no layout change). RDA = **18 mg** (the protective target for adult women 19-50, the at-risk demographic; 8 mg is the male/post-menopausal value; single RDA for v1 since there is no sex field; documented one-line constant for the pharmacist to confirm). Iron joins the gap-banner food tips (Rule 9: no condition names). (3) **Gating untouched** — iron lands in the still-Pro watch; the un-gate decision (recommendation on record: make the watch free, keep AI extraction as the Pro upsell) is a later session. (4) **Manual entry stays macro-only** (micros only come from AI photo / barcode). **Ops gotchas:** `supabase db push` is blocked by the auto-mode classifier (shared-cloud schema change) so the owner runs it; after the push, `gen types` first returned a STALE schema (no iron_mg) due to API introspection-cache lag — a retry a moment later showed all 6 occurrences; `gen types > file 2>&1` leaks npm-warn lines into `database.ts` (use `2>/dev/null`). **Attorney queue:** iron RDA framing + the recognize-food prompt addition + `log.nutrient_iron`. tsc 0, jest 101, vitest 598 (+2 iron gap/threshold tests; +iron portion-scaling assertions), lint 0 errors. Client OTA `3c919874` published clean (Android + iOS), no Hermes segfault. **Phase D remainder (separate session, task #107): un-gate/surface the micronutrient watch + surface discontinuation mode.** |
| 2026-06-09 | Onboarding redesign — shared components + neutral-dark palette + AM/PM dose times (session 50, OTA `de096432`) | User reported onboarding looked broken ("buttons/cards invisible once pressed"). **Root cause:** every onboarding screen set `<SafeAreaView style={[..., { backgroundColor: gradients.hero[0] }]}>` — the inline purple overrode the real `colors.background`, so the hero gradient bled past its band and painted the WHOLE screen purple; the selected-card state (8% `primaryLight` tint + `primary` purple text) and the purple primary button then rendered purple-on-purple = invisible when pressed. Compounded by a broken dark palette (`background #0d0920`, grays remapped to a purple scale) that made dark mode an oversaturated mess app-wide. There was also NO shared onboarding component — all 12 screens re-inlined their cards/footers/background and had drifted apart. **Decisions:** (1) **Fix the dark palette app-wide (`tokens.ts` `darkTokens`)** from all-purple to a Clean-Clinical neutral-dark slate: `background #0f1419`, `surface #1b222e`, `surfaceElevated #252e3d`, neutral `gray50->gray900` slate scale (darkest->lightest), readable `textSecondary #9aa4b2`, `border #2a3344`; `primary` kept lavender `#c4b5fd`, `primaryLight` bumped to 16% for a visible selected tint; the dark hero gradient stays a saturated header-only band (`#5b21b6 -> #1d4ed8 -> #0369a1`) since after the fix it is never the body. `tokens.test.ts` updated to the new intended values. (2) **Extract shared onboarding components** (`src/features/onboarding/components/`): `OnboardingScaffold` (body on `colors.background` — kills the bleed; a FIXED `LinearGradient` hero pinned under the status bar via `useSafeAreaInsets`; scroll body; fixed footer on `surface`; `<StatusBar style="light" />`), `OptionCard` (selectable radio row; selected = 2px brand border + visible `primaryLight` fill + filled radio, with the **title staying `textPrimary`** — brand reserved for border/radio — so it can never go invisible, the core fix), `ChoiceChip` (solid brand fill + white label when selected), `StepFooter` (primary Continue/Next + optional Back, disabled state). All theme-aware (`useTheme` tokens, no hex literals). (3) **Refactor all 12 screens onto them, presentation only** — language, appearance, medication, injection-day, body, safety, dietary, goals, status, protein-target, import, reveal each lost their per-screen inline scaffolding + the `hero[0]` bug; every screen's state, persistence (`useOnboardingStore`), navigation, and validation were preserved (incl. protein-target's Tier-1 disclaimer + acknowledgment + live floor calc, safety's Yes/No toggle, body's unit toggles, and reveal's full session-fallback profile save + notification permission prompt). The protein-target result card keeps its contained gradient face (a card, not a full-screen bleed). (4) **Dose-time chips -> 12-hour AM/PM** (owner: "no military time"): the oral dose-time grid labels via date-fns `format(new Date(2000,0,1,h,0), 'h:mm a')`; the STORED value stays 24h `HH:00` (`dose_time_local` unchanged). **No copy rewrites beyond the time labels; no i18n keys added/removed (EN/ES parity unchanged) -> no new attorney items.** No backend, no migration. tsc 0, lint 0 on touched files, vitest 598, jest 101, lint:translations parity. Client OTA `de096432` (Android + iOS), clean build (no Hermes flake). **PENDING on-device walkthrough:** all 12 screens in BOTH light + dark (confirm the selected state is visible and dose chips show AM/PM); spot-check Today / Dose / Settings in dark to confirm the palette reads app-wide. |
| 2026-06-09 | Phase D part 2 — free Micronutrient Watch + REMOVE discontinuation & maintenance modes (session 51, OTA `1bced805`) | Two owner-confirmed changes; client-only, no migration, Rule-4 `protein.ts` untouched. **Decisions:** (1) **Micronutrient Watch is now FREE** — removed the `<ProGate>` wrapper + the `MicronutrientUpsell` teaser + PRO badge from `micronutrient-watch-card.tsx`; it renders the real tiles for everyone when micros are logged (free barcode or Pro AI), nothing otherwise. AI photo/voice extraction stays the Pro upsell (untouched). Recorded session-49 rationale: a free watch wins reviews and funnels to AI logging. Moved "micronutrient watch" to Always-free in both CLAUDE.md copies + dropped the landing-page Pro chip; removed 4 orphaned upsell i18n keys. (2) **Discontinuation + Maintenance modes fully removed** — owner reversed the "discontinuation support" differentiator. Deleted both screens + both guidance files; narrowed `MedicationStatus` to `'starting' | 'active'`; stripped every discontinued/maintenance branch (Today banners + dose/guidance gating, Dose-hub discontinued card, Pro-Insight suppression, 2 Settings rows) and 8 orphaned i18n keys; removed the 2 `href:null` route registrations. The onboarding "where are you in your journey?" step is now Starting/Active only. (3) **Phase model collapses to weight_loss** — every `calculateProteinFloor`/`previewProteinFloor` caller passes `phase:'weight_loss'`; the Rule-4 calculator + `MAINTENANCE_MULTIPLIER` + its tests stay intact (just unreachable from the UI, so coverage holds). `today/api.ts` **normalizes `medication_status` on read** (non-`'starting'` -> `'active'`) so legacy DB rows (maintenance/discontinued/tapering) cannot violate the narrowed type or leak into Settings labels / the daily-guidance edge fn; `update-status` writes `phase:'weight_loss'` (self-corrects a stale row). (4) **Server enum tightening deferred** (task #121, owner-run): the migration-010 CHECK constraint + the `generate-daily-guidance` Zod enum still list the removed values, but after the client normalize they only ever receive starting/active, so this is defensive cleanup, not a live bug. **Adversarial review** (4-dimension workflow, 24 agents, refute-before-count) surfaced 9 confirmed; the real in-scope ones were fixed (normalize-on-read; **pulled the now-false `maintenance-nutrition` content card** that advertised the deleted "10% maintenance adjustment"; 2 stale "Pro-gated" comments). Declined the `protein.test.ts` maintenance cases (Rule-4 coverage — `protein.ts` keeps the branch) and `mockAI.ts` "maintenance dose" (valid clinical term). tsc 0, lint 0 touched, vitest 598, jest 99, lint:translations parity. OTA `1bced805` (Android + iOS). **Attorney/owner queue:** removed discontinuation + maintenance educational content; re-add a corrected goal-weight nutrition card if desired (task #120). |
| 2026-06-09 | Phase G — onboarding trim (session 52, OTA `01966f63`) | Pre-launch conversion win: cut friction from onboarding. Client-only, no migration; the protein-floor calc depends on none of the trimmed fields. **Decisions:** (1) **Dropped the appearance step** — Settings already exposes a light/dark/system toggle (default `system`), so the in-onboarding theme picker was pure redundancy. (2) **Dropped the goals step** — `goal` (preserve-muscle/lose-fat/both) was **cosmetic**: never written to the DB (no column), fed no logic, only shown on the reveal summary; removed it from the store + the reveal card. (3) **Dropped the import step** — all three integrations are "Coming Soon" alerts with no working backend. (4) **Deferred dietary** (real: `dietary_pattern` persists + biases AI photo recognition) out of onboarding to a post-onboarding surface: a Today **"Set your eating style"** action-row nudge shown only while `dietaryPattern == null`, a Settings -> Preferences **"Eating style"** row, and a standalone editor (`src/features/dietary/dietary-preference-screen.tsx` + `(app)/dietary-preference.tsx`, `href:null`) mirroring `update-status-screen` (write `dietary_pattern` -> invalidate today-profile). Added `TodayProfile.dietaryPattern`, a `Utensils` icon, and a `dietary.*` i18n namespace (+ `today.dietary_nudge_*`, `settings.dietary_pattern`; non-clinical). (5) **Result:** a **7-step** numbered flow (`medication 1/7 ... reveal 7/7`); deleted `appearance/goals/import/dietary.tsx`; rewired `language->medication`, `safety->status`, `protein-target->reveal`; renumbered survivors; removed `goal`/`dietaryPattern` from the onboarding store; `onboarding/api` writes `dietary_pattern: null`; removed 8 orphaned `onboarding.appearance_*` keys. No backend/migration/edge-function change. tsc 0, lint 0 touched, vitest 598, jest 103 (+4 dietary RTL), lint:translations parity. Client OTA `01966f63` (Android + iOS) on the `ota:dev:clear` retry (first attempt hit the Windows Hermes segfault). |
| 2026-06-09 | Cascade D — seeded `foods` table + Search database + AI wrong-food fix (session 53, migration 022, OTA `ae905eee`) | The local verified-food layer: zero-AI-cost lookups before any OpenAI call, and the prerequisite for Phase E (what-to-eat). **Decisions:** (1) **Migration 022** creates a public `foods` table seeded with exactly **200 pharmacist-curated GLP-1-friendly high-protein foods** (14 categories, `name_es` on ~50 staples, USDA/label-typical values -> **pharmacist review queue**), `protein_density` GENERATED STORED, `pg_trgm` GIN indexes on name + name_es, **public-read RLS** (`SELECT USING (TRUE)`, no write policies — the content_cards pattern; user-submitted foods deliberately out of scope), and extends the live migration-002 `food_logs.source` CHECK with `'database'`. (2) **Six recorded deviations from the original spec:** micros aligned to the app's tracked set (`vitamin_d_iu` + `zinc_mg` replace `calcium_mg` so seeded foods fill exactly the `BarcodeProduct`/watch fields); `serving_description TEXT NOT NULL` added (food_logs needs human text; `serving_size_g` kept as numeric metadata); `protein_g NOT NULL`; read-only RLS (no INSERT policy); no full-text index (trgm covers 200 rows); source value `'database'` (the spec's `log_source='search'` referenced a never-built schema). Seed barcodes are NULL — fabricating EANs would poison barcode lookups. (3) **Search is simple ILIKE OR** over name/name_es (instant on 200 rows; trgm indexes future-proof Phase E), protein-dense-first, limit 20, Zod-validated at the read boundary (`seededFoodRowSchema`, matching the `foodLogRowSchema` convention); `sanitizeFoodQuery` strips `% _ , ( )` which break supabase-js `.or()`. **The `foodLogRowSchema` z.enum had to gain `'database'`** or safeParse would silently drop logged rows from Today/Recents — the sharpest edge in the change. (4) **Dual-mode `FoodSearchSheet`** (RN Modal, 300ms debounce, results -> preview card with macro + micro grids -> CTA): `mode='log'` inserts via `useInsertDatabaseFoodLog` (source `'database'`, `FOOD_LOGGED_DATABASE` analytics); `mode='select'` only calls `onSelect`. Entry points: a `FoodSearchRow` on the Log screen (photo-row anatomy, new `Search` line icon) + a **"Wrong food? Search the database"** link in the AI review sheet whose `applyFood` patches all 12 form fields via `seededFoodToFormPatch` (string formatting matches `resultToForm` exactly), sets `userEditedRef` so late personal-defaults cannot clobber, rebases the portion multiplier at 1x, and leaves `originalAiName` untouched so correction-learning still fires; the sheet nests inside the review Modal's tree for iOS stacking. (5) **Locale-aware logging**: the inserted name is the locale display name (`name_es` for es), with an undefined-locale guard (regression found when jest's i18n mock surfaced it). FoodLogRow source badges refactored to a lookup + a neutral `database` badge. Tests: 15 vitest (food-search) + 5 jest RTL (sheet). tsc 0, lint 0 touched, vitest 613, jest 108, parity. Ops: owner-run `db push`; types regen clean on first try (Bash + `2>/dev/null`). OTA `ae905eee` on the `ota:dev:clear` retry. **Closes the old "Wrong food? Search database" Tier-2 backlog item; Phase E unblocked.** Hardening follow-up (`d3ee075`, OTA `cfa62fa6`): the xhigh `/code-review` verified the tricky parts correct and surfaced 5 low findings; 3 applied (sanitizer also strips `"`/`\`, search gated on `visible`, select-mode guards a missing `onSelect`). |
| 2026-06-11 | Daily check-in reminder notification (session 54, OTA `9abdafcf`) | Owner-requested. A new opt-in local notification `'daily-checkin-reminder'` firing daily at a fixed **9 AM** to nudge the Daily Check-in (the nausea/energy/water symptom log). **Decisions:** (1) **Mirror the `daily-protein-nudge` pattern exactly** rather than invent anything new: `scheduleDailyCheckInReminder()` (a `DAILY` trigger at hour 9) in `notifications.ts` + the id in the `NotificationId` union; `NOTIF_CHECKIN_ENABLED` AsyncStorage key + `checkInEnabled` state + restore + the schedule/cancel branch in `use-notification-settings.ts`. (2) **Fixed 9 AM, not configurable** — consistent with the other hardcoded daily nudges (protein 7 PM, injection 8 AM); a time picker (the oral-dose `dose_time_local` pattern) was the considered alternative, deferred for simplicity. (3) **Toggle in BOTH Settings -> Notifications and the Dose Reminders panel** — the check-in is route-agnostic, but the protein nudge already appears in both surfaces, so parity. (4) **Notification body stays English-only** like every existing reminder — the native scheduler fires outside React and cannot read i18next; only the in-app toggle labels are localized (`settings.notif_checkin` + `_subtitle`, EN/ES). Off by default (opt-in; enabling requests notification permission). No tap deep-link (no notification routes anywhere in the app yet). Client-only, no backend, OTA-shippable. tsc 0, lint 0 touched, jest 109 (+1 toggle test), vitest 614, parity. OTA `9abdafcf` (Android + iOS). |
| 2026-06-11 | Today "Fuel" hero card: merged Readiness + Protein, added Fiber + Micronutrients (session 55, OTA `2ab9fa15`) | Owner (master-design intent): the Today screen's top three score-ish cards (Muscle score, Readiness, a lone Protein ring under "Today's Metrics") read as a charts dump and buried the protein ring. Merged Readiness + Protein into one gradient-hero `FuelCard` (`src/components/today/fuel-card.tsx`) with Fiber + Micronutrient spots. **Decisions:** (1) **Placed at the very top, above the Muscle Preservation Score** (owner chose this over "below the Muscle score") — it is the main attraction; the `gradients.hero` header carries the weight and stays visually distinct from the flat Muscle card. (2) **Readiness condensed to a dial + tip with a "Why?" tap-to-expand** for the factor rows (owner picked option C after an A/B/C mockup) — clean at rest, full breakdown on demand; the readiness count-up animation moved out of today-screen. (3) **ProteinRing reused as the hero** (color bands + spring fill intact) with a "% to floor" / "g to go" column; the row still taps to `/protein-target`. (4) **Fiber soft-target bar (`FIBER_TARGET_G = 28`)** — general dietary guidance, NOT personalized; a shortfall renders calm gray, never red (fiber is not a safety floor like protein); **the 28 g target + the merged-card educational copy join the attorney/pharmacist queue.** (5) **Micronutrients as 5 status dots + "n of 5 on track"** reusing `getNutrientStatus` (green >=80%), tapping through to the Nutrition Micronutrient Watch (`/log`); empty state when nothing is logged. (6) **Tier-2 disclaimer** (matches MuscleScoreCard); no new Tier-1 modal — the protein floor already displayed on Today without one (flag for the owner if Tier-1 is wanted on the merged card). Pure helper `fuel-card-data.ts` (`summarizeFiber`/`summarizeMicros`, Vitest 13). Removed the inline Readiness block + the Today's-Metrics protein ring + orphaned styles. `today.fuel_*` EN/ES (no em dashes). `jest-setup.ts` gained `useAnimatedProps` + `LinearTransition.duration` reanimated mocks. Client-only, no backend/migration, OTA-shippable. tsc 0, lint 0 touched, vitest 627, jest 117, parity. Commit `ca7d1e6`, OTA `2ab9fa15`. |
| 2026-06-11 | Dark-mode premium polish: check-in scales, filling-glass water, merged Dose medication card, tighter search row (session 56, OTA `028082fc`) | On-device dark-mode review flagged four unpolished spots; all client-only fixes. **Decisions:** (1) **Nausea/energy -> emoji-free intensity bar-scale** (`RatingSlider` rewrite): 5 tappable ascending-bar segments, selected highlighted; a `tone` prop tints the selected bar via semantic `success`/`warning`/`error` (severity = green->red, positive = amber->green) rather than the amber/emerald `scales` ramps (clearer + theme-aware); unselected bars stay calm gray. (2) **Water -> filling glass** (`WaterGlass`, reanimated `withTiming` fill) + a −/+ stepper, replacing the 8-square `💧`/`○` grid; new `colors.water` token (sky `#0ea5e9` light / `#38bdf8` dark). (3) **Dose merged card** (`MedicationCard`, oral): one themed card replaces the redundant green phase pill + the off-blue `MedLevelBanner` tile (hardcoded `#60a5fa`, dark-broken) + the educational card — themed pulse icon, phase headline (reuses `med_banner_oral.*`), a "Day N" chip, body, and a `View medication level` CTA -> `/medication-level`. **Injection left untouched** (no redundancy there: PhaseBadge under INJECTION CYCLE, MedLevelBanner is its only level tile), so both components stay in use. (4) **Search row** vertical padding 16 -> 12 (slim entry, not a tall empty box). 1 new key `dose.view_level` EN/ES. RTL tests for the three new/changed components. tsc 0, lint 0 touched, jest 125, vitest 627, parity. Commit `eccf753`, OTA `028082fc`. |
| 2026-06-11 | Coach screen premium redesign (theme-aware) + Nutrition Log spacing (session 57, OTA `c5daa741`) | The Coach tab looked plain next to Today/Dose (flat header, plain bubbles, lone welcome, rectangular Send) though it was ALREADY fully theme-aware (zero hardcoded colors). Owner-chosen directions (via mockups): **gradient hero, suggestion chips, round arrow send.** **Decisions:** (1) **Gradient hero header** (`gradients.hero`) + a translucent "Pharmacist guidelines" trust pill, matching Today/Dose. (2) **Coach-avatar tailed bubbles** — assistant = a `ChatBubble` avatar + `surface` bubble (border + `shadows.sm` + asymmetric tail); user = `primary` fill + `textInverse`. (3) **Empty-state welcome + 3 tap-to-ask suggestion chips placed inside the `ProGate`** (above the composer) so free-user gating holds (free users get the paywall, not chips/input); chips are **food-only (Rule 10)**. (4) **Pill input + a round `ArrowRight` send button.** Wired the hardcoded strings to `coach.*` i18n + added welcome/trust/suggest_* (EN/ES); the **Tier-2 disclaimer wording is left unchanged** (liability). Preserved `useAiCoach`, the `ProGate`, FlatList auto-scroll. (5) **Nutrition Log spacing:** the RECENT FOODS container `marginTop` sm->lg + `marginBottom` md so the section separates above and the cards stop butting against the Search row. RTL test in `src/features/ai-coach/` (not under `src/app/`). tsc 0, lint 0 touched, jest 129, vitest 627, parity. Commit `a944ad5`, OTA `c5daa741`. |
| 2026-06-11 | Combined "Log with AI" hero (voice + photo) + Coach empty-state centering (session 58, OTA `7c229612`) | Owner asks: make voice + photo share the hero; the Coach empty state has too much space. **Decisions:** (1) **Voice + photo share ONE "Log with AI" navy card** (`AiCaptureHero`) with Speak | Snap halves (owner chose the combined card over two side-by-side tiles). Tapping Speak morphs the card **full-width** to the recording UI by **reusing `VoiceCaptureButton`** via a new additive `autoStart` prop (+ `onClose`) — the native expo-audio recorder is UNTOUCHED (lowest risk for the one path that cannot be CI-tested). Snap reuses the camera-launch logic; PhotoCaptureButton deleted. Both gate **on tap** (imperative `presentPaywallIfNeeded`, entitlement `'GLiPra Pro'`), so the card renders for free + Pro. New `log.ai_hero_label` / `voice_action` / `photo_action` (+ subs) EN/ES. (2) **Coach empty state centered** — avatar + welcome + (Pro-only) suggestion chips as one vertically-centered group, replacing the top-pinned welcome + bottom-pinned chips that left a dead gap. Chips moved out of `ProGate` (gated by `useSubscription().isPro` render); the input keeps its `ProGate`. RTL for both; the coach test mocks `useSubscription`. tsc 0, lint 0 touched, jest 133, vitest 627, parity. Commit `6ecf2e9`, OTA `7c229612`. |
| 2026-06-11 | Muscle Preservation Score merged into the Fuel hero dial (session 59, OTA `578122aa`) | Owner: combine the standalone Muscle Preservation Score card with the Fuel hero (which showed the Readiness dial). The Muscle score is the app's North-Star outcome metric (trailing-28-day: protein consistency 70% + resistance 30%); Readiness is a today-state composite. Via mockups -> **option B**. **Decisions:** (1) **Muscle becomes the hero dial** (`ReadinessDial` generalized to `ScoreDial`, `number \| null`, "--" when no data); the header label flips to `muscle_score.label` and the headline/tip/factors come from `useMuscleScore().card`. (2) **Readiness condensed to a small "Readiness NN" pill** beside the trust pill (shown only when `readinessCard.score != null`) — it survives as a glanceable today-state, while its dose/symptom detail still drives the Dose tab. (3) **"Why?" now expands the muscle levers** (protein consistency + resistance, `value` strings + sentiment dots via `muscleFactorColor`) instead of readiness deltas; **the tip is the muscle lever-nudge.** (4) **Protein ring + fiber + micros stay** as the daily inputs that feed the score. (5) **Standalone `MuscleScoreCard` deleted** (fully absorbed) — its `useMuscleScore`/`buildMuscleScoreCard` builder + the Vitest builder suite are REUSED. (6) **Hero NOT gated on `useMuscleScore().isLoading`** (the card computes 0 / `hasEnoughData:false` while loading -> dial "--" then fills, never dropping mid-screen). 1 new non-clinical key `today.fuel_readiness_pill` EN/ES; the clinical `muscle_score.*` copy is already in the attorney queue (session 48 Phase B) so **no new attorney item.** Client-only, no migration, OTA-shippable. tsc 0, lint 0 errors (full project), jest 131, vitest 627, parity. Commit `2ec4fe0`, OTA `578122aa`. |
| 2026-06-11 | Micronutrients tile deep-links the Nutrition screen scrolled to the Micronutrient Watch (session 60, OTA `2a37dd35`) | Owner (on-device): tapping the Fuel card's Micronutrients tile landed at the TOP of the Nutrition screen, forcing a manual scroll past the AI hero / recent foods / search / macro card to reach the Micronutrient Watch. Make the tap land directly on that section. **Decisions:** (1) **Deep-link param, not a screen restructure** — the micros tile pushes `/log?scrollTo=micros` (the Fiber tile and the bottom Nutrition tab are unchanged; the tab still opens at the top). (2) **Measured-offset scroll on the existing `FlatList`** rather than converting header sections into list items: `log.tsx` reads `scrollTo` via `useLocalSearchParams`, refs the `FlatList`, and wraps `<MicronutrientWatchCard/>` in a `View` whose `onLayout` captures `layout.y` (the card lives in `ListHeaderComponent`, one vertical stack from content top, so its `y` equals the scroll offset) -> `scrollToOffset({ offset: y - spacing.lg })`. Reuses the FlatList-ref/scroll pattern (`coach.tsx`), the onLayout-Y pattern (`pain-level-slider.tsx`), and `useLocalSearchParams` (`edit-shot.tsx`). (3) **One-shot, idempotent** — after scrolling, `router.setParams({ scrollTo: undefined })` consumes the param so re-focusing the tab via the bottom bar does not re-scroll; `useEffect([scrollToMicros])` covers the already-mounted re-tap (tabs stay mounted), the `onLayout` call covers the first visit (param present before layout). (4) **No-micros guard** — the card renders `null` with no micros, so the wrapper measures height 0, `microYRef` stays 0, and we leave the user at the top (better than dumping them at the footer). Navigation only, no copy -> no attorney item. tsc 0, lint 0 errors, jest 132, vitest 627, parity. Commit `13b637b`, OTA `2a37dd35`. |
| 2026-06-12 | Rescan photo from the AI review sheet, hint-first (session 61, OTA `cbebf422`) | Backlog Tier-2 #1. A wrong recognition result (or the "Unknown food" fallback) left the user with only "Wrong food? Search the database" or re-snapping; the error-path "Try again" already worked (stale backlog note). **Decisions:** (1) **Rescan shows on every photo review sheet** (owner choice over a low-confidence-only gate, which would hide it exactly when the AI is confidently wrong); voice gets no link (its error retry exists; hint-rescan is photo-specific). (2) **Hint-first, not blind re-run** (owner choice): the link reopens `PhotoCommentSheet` pre-filled with the original hint (new additive `initialComment` prop) so the user adds context; a blind re-run usually repeats the mistake, and the `userComment` pipeline already flows to the edge function. (3) **The comment sheet nests INSIDE the review sheet's Modal tree** (the FoodSearchSheet iOS-stacking pattern) so backdrop-dismiss keeps the form intact. (4) **Bytes kept in a `lastPhotoRef` ref, not state** — `handleAnalyzingComplete` clears `analyzingImage` at modal handoff, so the base64 was gone by review time; a ref never touches the AnalyzingModal's visibility logic and triggers no re-renders. Cleared on review close + analyzing cancel, NOT on rescan (second rescan works). (5) `handleRescan` re-enters `runPhotoRecognize` with the new comment (sets `analyzingComment` so error-retry + a second rescan reuse it) + a `PHOTO_RESCANNED` analytics event. **Cost:** one user-initiated call per tap, server 50/day cap, no client loop; mock mode free. No edge-function changes; no new attorney copy. Tests: 5 review-sheet + 2 comment-sheet RTL. tsc 0, lint 0 errors, jest 139, vitest 627, parity. Commit `5bb521f`, OTA `cbebf422`. |
| 2026-06-12 | Quick-add micronutrient supplements (per-nutrient, own 'supplement' source) (session 62, migration 023) | Owner: make it easy to count a supplement (Vit D / Mg / Iron / B12 / Zinc) toward today's micronutrient totals. **Decisions:** (1) **Reuse food_logs, not a new table** — a supplement is a `source='supplement'` food_log with `protein_g` 0, macros null, exactly one micronutrient set; `useDailyMacros` already sums the 5 micro columns across ALL today's logs, so the watch card + Today Fuel micros tile update with zero new aggregation. Migration 023 only widens the `food_logs.source` CHECK (drop/add-constraint, mirrors 022; no new table -> Rule 7 N/A; `source` typed `string` -> no `database.ts` diff). (2) **Per-nutrient tap** (owner choice over a multi-field multivitamin sheet or app-suggested preset doses) -> one `SupplementQuickAddSheet` with a single amount; **the app never suggests doses** (user enters the bottle-label value) so there's no new clinical advice and no Tier-1 modal — the watch card keeps its Tier-2 disclaimer; the new `log.supplement_*` copy joins the pharmacist/attorney queue as educational. (3) **Both entry points** (owner choice): the Micronutrient Watch card tiles become tap targets via an optional `onAddSupplement` (the card hides when empty), plus an always-available **Supplement** logging mode (Manual | Barcode | Supplement) whose `SupplementPanel` lists the 5 nutrients with today total/goal — both drive the one sheet via a lifted `supplementKey` in `log.tsx`. (4) **Own identity, not 'manual'**: a dedicated 'supplement' source gives a distinct badge and lets FoodLogRow suppress the protein column (no misleading "0g protein"; the amount reads on the serving line), and supplements are excluded from the Recent Foods "log again" bar. Pure `supplement.ts` (`buildSupplementEntry`, rounds mg/IU whole + mcg 1dp), `SUPPLEMENT_LOGGED` analytics. **Migration 023 db push APPLIED 2026-06-12** (owner) — the insert works on-device. tsc 0, lint 0 errors, jest 144, vitest 633, parity. Commit `b48bbe4`. |
| 2026-06-13 | Muscle score counts the CURRENT week's resistance sessions (bug fix) (session 63, OTA `162ad53d`) | Reported on-device: the Muscle Preservation card said "Log a resistance session this week" / "Resistance training: Not tracked yet" with 3 sessions logged this week (Resistance screen correctly showed "3 this week"). **Root cause:** `useMuscleScore` gated resistance-tracked on `frequency.weeksTracked`, which `computeResistanceFrequency` counts as RESOLVED past weeks only (the in-progress week is intentionally never resolved so a mid-week can't be scored a miss) — so a user training in their first/current week had `weeksTracked 0` -> `resistanceAdherence null` -> untracked. **Decisions:** (1) **Fix in a new pure adapter, not the shared calculators** — `src/features/muscle-score/resistance-input.ts` `deriveResistanceInput(freq)` maps the frequency result into the score's `{ adherence, weeksTracked }`, counting the current week as a scored week once it has >=1 session: full hit at the weekly target, else partial (sessions/target, capped); resolved weeks keep binary hit/miss; null only when no session exists. `computeResistanceFrequency` (also powers the Resistance screen) and the generic `calculateMuscleScore` stay untouched, so no other surface shifts. (2) **Partial credit while building** (a sub-target current week is tracked at sessions/target, not "Not tracked yet") so a user who logs even one session this week isn't told to "log a resistance session". No copy change -> the score's Tier-2 disclaimer still covers it (no new attorney item). 8 Vitest cases. tsc 0, lint 0 errors, jest 144, vitest 641. Commit `5b08270`. |
| 2026-06-13 | In-app medication switch (tablets <-> injection) without losing subscription or progress (session 64, migration 024, OTA `b7605f9d`) | Owner: doctors switch GLP-1 patients constantly; the app had no way to change medication/route after onboarding, making a switch a churn event (delete app + cancel). **Decisions:** (1) **The switch is one profile field** — `administration_route` re-routes ~20 surfaces (Today, Dose, readiness, notifications, content cards, calculators) which all re-derive on `['today-profile']` invalidation; the new flow just writes the profile + reschedules notifications, no per-surface switch logic. (2) **Subscription is identity-based (RevenueCat)** and never stored on the profile, so a med change can't touch Pro — the core anti-churn guarantee. (3) **Preserve everything route-agnostic** (food/weight/check-ins/resistance/streaks/muscle-score/protein-floor) and **keep old dose logs** for history; only the route-specific profile fields flip (set new route's, clear old). (4) **Record switches** (owner choice) in a new append-only `medication_changes` table (migration 024, RLS) feeding a visit-prep "Medication changes" section + (fast-follow) the PDF. (5) **Entry points** (owner choice): Settings row + a Dose-tab "Switched medications?" link. (6) **Pure `buildMedicationSwitch`** (profile patch + history row + cancel-all-route-reminders) Vitest-tested; a 3-step editor reuses the onboarding route-fork components; route is derived from the medication (one shared `medications.ts`). No medical advice (Tier-2 disclaimer; `change_med.*` joins the attorney queue). Client-only beyond the one table. **Migration 024 db push APPLIED 2026-06-13 (owner)** — the switch works on-device; the regenerated `database.ts` does NOT yet include `medication_changes`, so `api.ts` keeps a typed bridge cast (`supabase as unknown as MedChangesClient`) until a future `gen types` run picks it up (cosmetic — runtime is unaffected). tsc 0, lint 0 errors, jest 147, vitest 649. Commit `e5f7f6c`. |
| 2026-06-15 | Paywall auto-renew disclosure + Terms/Privacy links — B4 (session 72, entry 119) | Apple 3.1.2 / Play require the binding purchase screen to disclose auto-renewing terms + link the EULA + privacy policy. Added a disclosure paragraph (platform-aware Apple ID / Google Play account name, renew price, cancel ≥24h before period end, Lifetime = one-time) and Terms of Use / Privacy Policy links to the existing in-app `/legal/*` screens, below the price tiers on `PaywallScreen` only (the binding screen). Disclosure wording flagged for attorney sign-off. Client-only, OTA. Commit `7d39d8a`. |
| 2026-06-15 | Premium redesign of both paywall surfaces (session 71, entry 118) | Applied the established gradient-hero + Crown + SVG-icon language to PaywallScreen (gradient hero, SVG benefit icons in success chips, three price tiers with Annual featured) and the ProGate inline card (gradient header band + crown, emoji lock removed). All purchase/restore/analytics behaviour preserved; PRO_BENEFITS moved from strings to {Icon,label}. Visual-only, OTA — published to BOTH preview + development channels (preview for the owner's current build). B4 (Terms/Privacy + auto-renew disclosure) still required before submission. Commit `0ba35d0`. |
| 2026-06-15 | Paywall shown on every Pro engagement via a shared trigger (session 70, entry 117) | Free users tapping a Pro feature must always get the paywall. Every entry point previously called `RevenueCatUI.presentPaywallIfNeeded`, which only renders a dashboard-configured Offering/Paywall (none set up) → silent no-op. Decision: navigate to the app's own (already-built but never-used) `PaywallScreen` via a single shared `presentPaywall(feature?)` → `router.push('/paywall')`, wired into AiCaptureHero, ProGate, ProInsightCard, and VoiceCaptureButton. Decouples "paywall appears" from RevenueCat dashboard state; a later switch to RevenueCat's hosted Paywall Builder is a one-line change in `presentPaywall` once an Offering exists. Also dropped the cut "Linked accounts" benefit (B6). Purchases still need store products + an Offering (B5/#92) to complete; Terms/Privacy + auto-renew disclosure on the paywall remain open (B4). Client-only, OTA. **Ops note:** `ota:dev` targets the development channel; preview builds need a preview-channel update — there is no `ota:preview` script yet. Commit `68dff48`. |
| 2026-06-15 | Pregnancy question removed from onboarding (session 69, entry 116) | Owner (licensed pharmacist) decision: GLP-1 medications are not recommended in pregnancy, so the app stops asking about or reacting to pregnancy. The safer-design alternative (keep the question, escalate "Yes" to a prescriber referral) was offered and declined in favor of full removal. Removed the safety-screen question, the `isPregnant` input + 80 g pregnancy floor from the **Rule-4** `protein.ts` calculator (+ tests), the `preview.ts`/onboarding/Settings-editor wiring + "Pregnancy minimum" badge, the `TodayProfile.isPregnant` field, and the pregnancy i18n strings/disclaimer clause. The `is_pregnant` DB column is intentionally **kept** (onboarding writes `false`) to avoid a destructive migration; `database.ts` is unchanged. Client-only, OTA. Net effect: a single safety question (kidney disease) drives the protein floor; pregnancy is no longer a modeled state. Flagged for attorney review (removing a contraindication prompt is a clinical/liability call). Commit `cce1b03`. |
| 2026-06-15 | Store-prep native build config: camera permission, Android targetSdk 36, drop unused perms, defer Health (session 68, entry 115) | First batch of pre-submission native config (B2/B3/B12 + B7-description; B1 deferred). Camera is used two ways (expo-image-picker food photo + expo-camera barcode), so both plugins are now registered to inject `NSCameraUsageDescription`; `photosPermission:false` + no camera mic/video drops the unused photo-library / `READ_MEDIA` perms (camera-only app). `expo-build-properties` (new dep) pins Android compile/target SDK 36 for Play's 2026 gate; minSdk 26 stays on the existing `withGradleProperties` plugin (one mechanism per gradle property). Real app `description` replaces the placeholder. **Health (B1) deferred:** the built-but-not-v1 Health Import feature has no HealthKit entitlement, so its Settings row is gated out of production (`EXPO_PUBLIC_APP_ENV !== 'production'`) — Apple rejects both HealthKit-without-use and visible-but-broken features, so hiding the entry is the clean v1 path; re-enable when Health ships. **Key constraint: these are native-fingerprint changes — NOT OTA-shippable; they require an EAS rebuild, which is also the only real verification (iOS Info.plist permission strings inject at prebuild and don't show in `expo config`).** Commit `9f20f30`. |
| 2026-06-15 | Cleanup batch: corrected goal-weight card, tested force-Pro gate, linked-accounts tidy (session 67, entry 114) | Low-hanging batch after a read-only scoping fan-out found most candidates already handled. (1) Re-added a `goal-weight-nutrition` content card (universal, tier-2 education, sortOrder 25) with corrected copy to replace the false `maintenance-nutrition` card pulled in session 51 — keeps a valid goal-weight message, drops the deleted-feature claim; joins the attorney queue. (2) Locked store-blocker B7: the dev force-Pro override (already gated on `EXPO_PUBLIC_APP_ENV === 'development'`) is now an exported pure `isDevForcePro()` with a Vitest matrix, so production/preview can never silently force-enable Pro. (3) Dropped the cut "linked accounts" from the Pro-tier comment in CLAUDE.md (the sweep confirmed it was nowhere user-facing). Client-only, no migration. tsc 0, lint 0, vitest 659. Commit `dec7ee7`. |
| 2026-06-14 | "Log with AI" card adopts the hero gradient + SVG icons, no emoji (session 66, entry 113) | The Nutrition Log capture card used platform emoji (🎙️/📷), which render inconsistently and break the app's own "SVG line icons, never emoji" rule. Owner chose (from a 3-option in-chat mockup) the gradient-hero direction: reuse `gradients.hero` (the Fuel/Coach/content-card language) so the AI card joins one premium family, swap emoji for new `Microphone` + `Crown` SVG icons (24×24 / 1.8px stroke, matching `Camera`) in glass chips, and crown the PRO pill. Presentation-only — the recording/transcribe pipeline, camera launch, paywall gating, props, and testIDs are untouched, so no behaviour/test churn and no new copy. Establishes that capture/hero surfaces use the shared gradient + the SVG icon set rather than bespoke flat fills or emoji. Client-only, OTA. |
| 2026-06-14 | `last_injection_date` must never be a future date (injection-cycle "Day -1" fix) (session 65, entry 112) | Reported on-device: after a Wegovy switch + a real shot, the Dose cycle read "Peak Suppression · Day -1" / wrong next-dose with empty bars. **Root cause:** the phase banner + cycle card source `profiles.last_injection_date` (not `injection_logs`), and the Change-medication date field accepted a **future** date — a future `last_injection_date` makes `differenceInCalendarDays(today, last)` negative, which `mapDaysToPhase` mislabels and offsets the next dose; the existing "only sync if newer" log guard then couldn't heal it. **Decision: enforce the invariant `last_injection_date <= today` at two points** rather than touch the Rule-4 calculator: (1) **reject future dates at entry** — a shared pure `medication/date-input.ts` (`isNotFuture`, date-fns) gates the Change-medication + onboarding last-injection fields (Change-medication also defaults the field to today); (2) **a real logged shot heals a future/stale value** — `insertInjectionLog`/`updateInjectionLog` broaden the profile sync to also overwrite when the stored date is in the future (`gt today`). The calculator stays frozen; bad input can no longer reach it, and existing bad rows self-heal on the next shot (no migration/backfill). Client-only. tsc 0, lint 0, vitest 655, jest 147. |
| 2026-06-13 | Pre-submission App Store + Play compliance audit (12-agent review) | A multi-agent review against current 2026 Apple + Google policy, grounded in the codebase, ahead of first submission. **Outcome (logged in PROGRESS "Pre-submission store-compliance blockers"):** the app is NOT submittable yet but the gaps are config/metadata/content, not architecture. 15 blockers (B1-B15): the headline is the iOS native config gap — `react-native-health-link` / `expo-camera` are absent from `app.config.ts` `plugins`, so HealthKit entitlement + camera/health usage strings never get injected (guaranteed 5.1.1/5.1.3 rejection + a likely runtime crash). Other blockers: paywall missing Terms/Privacy + auto-renew disclosure, iOS IAP not wired, "Linked accounts" advertised but cut, dev force-Pro + email-confirmation-OFF shipping, no targetSdk for Google's API-36 gate, no web deletion URL, Data-safety/App-Privacy not filed + the privacy policy over-declaring (Resend/push tokens), no support URL. Already compliant: server-side AI + no PII, read-only Health, in-app deletion + export, tiered disclaimers, native IAP, Sign in with Apple. Attorney/pharmacist sign-off remains the real pre-submission gate. |

---

## Windows EAS Update runbook

The OTA pipeline (Expo SDK 54 + RN 0.81 + Hermes 0.12.0 + Node 24 + Windows + OneDrive)
has hit Hermes bytecode failures 4× in session 39. After investigation:

**Confirmed contributing factors:**
- `hermesc.exe` shipped with RN 0.81.5 is a **debug build of LLVM 8.0** (assertion-heavy,
  fragile under Windows memory pressure)
- Node 24 is **not LTS** and **not officially supported by Metro 0.83 / RN 0.81**; some
  Metro internals use libuv APIs whose Node-24 behavior differs
- Repo lives under `OneDrive\Desktop\DosePath`; **OneDrive periodically holds file handles
  open during sync**, racing Metro's parallel sourcemap merger and producing the
  "preceding mapping" errors
- Default `maxWorkers` = CPU count; high concurrency on Windows triggers a `0xC0000142`
  init race when many `hermesc.exe` child processes spawn simultaneously
- Multiple `hermes-parser` versions can coexist in `node_modules` without explicit pinning

**Mitigations applied in commit `6b70ef8` (H1–H4):**
1. `.npmrc` pins `node-linker=hoisted` and disables strict peer deps
2. `package.json` `pnpm.overrides` pins `hermes-parser` to `0.32.1` (matches RN 0.81.5)
3. `metro.config.js` caps `maxWorkers = 2` on Windows only (Linux EAS cloud unaffected)
4. New `pnpm ota:dev` and `pnpm ota:dev:clear` scripts wrap `eas update` with
   `EXPO_USE_FAST_RESOLVER=1` to reduce filesystem churn

**Canonical OTA invocation (use this first):**
```
pnpm ota:dev --message "..."        # standard OTA
pnpm ota:dev:clear --message "..."  # OTA with cache wipe
```
The `--message` is REQUIRED. The scripts invoke `eas update --branch development
--non-interactive`, and non-interactive mode rejects a publish without a message
(`--branch and --message ... are required when updating in non-interactive mode unless
--auto is specified`). pnpm forwards the trailing `--message "..."` through to eas. Bare
`pnpm ota:dev` fails instantly on arg validation — confirmed session 40. Keep the message
descriptive (the feature/entry shipped) so the dashboard update history stays readable.
We keep `--branch development` static rather than switching to `--auto` (which would derive
the branch from git = `master`, breaking the dev-channel mapping).

### Failure escalation ladder

When `pnpm ota:dev` fails with a Hermes-related error, walk this ladder:

1. **Plain retry** of `pnpm ota:dev`. The OS file-handle race resolves on a second pass
   more often than not.
2. **Cache wipe**: `pnpm ota:dev:clear`. Forces a fresh Metro cache.
3. **Plain retry after cache wipe**: `pnpm ota:dev`. The cache-miss + segfault combination
   is sticky on Windows; the second clean run after a wipe usually succeeds.
4. **Only at this point** consider code-level investigation. Common code-level triggers
   that have surfaced this session:
   - `<>...</>` Fragment shorthand inside a conditional ternary/`&&` render — replace with
     an explicit `<View>` wrapper
   - Newly-imported third-party packages with unusual export shapes (`react-native-purchases`
     bundled inline has triggered minifier output that confuses Hermes)
5. **As a last resort**, check the two deferred user-decision items below.

### Deferred user-decision mitigations (NOT applied)

Both would significantly reduce or eliminate the Hermes failures but require deliberate
choices outside Claude's scope:

**Move repo off OneDrive.** OneDrive's file-locking is the most likely root cause of the
intermittent sourcemap mapping errors. Mitigation: relocate `dosepath/` to e.g.
`C:\dev\dosepath` (or a non-synced drive). Significant work — the workspace path is
referenced in CLAUDE.md, plan files, mockups, and Claude's own working memory of paths.
Decision belongs to the user.

**Downgrade local Node to 22 LTS.** Node 24 is current but not LTS; Metro 0.83 / RN 0.81
target Node 22. Local-only change; EAS cloud builders run on Linux + Node 22 already, so
this only affects local OTA bundling. Install via nvm-windows; ~5 min. Decision belongs
to the user; flagged for future-session consideration if Hermes failures continue after
H1–H4 take effect.

### Related GitHub issues for future reference

- [facebook/react-native#55538](https://github.com/facebook/react-native/issues/55538) —
  hermesc.exe missing on Windows release builds
- [expo/expo#43949](https://github.com/expo/expo/issues/43949) — Android release builds
  fail on Windows for Expo 55 due to hermesc
- [microsoft/react-native-windows#15538](https://github.com/microsoft/react-native-windows/issues/15538)
  — Hermes access violations on Windows with large JS bundles
- [expo/eas-cli#1274](https://github.com/expo/eas-cli/issues/1274) — eas update Hermes
  sourcemap composition errors
- [expo/expo#31989](https://github.com/expo/expo/issues/31989) — custom Metro minifier
  interactions with Hermes minify step

---

## How to Set Up Claude for Coding Glipra

This is the recommended setup for working with Claude (Cursor, Claude.ai, or Claude Code)
on this project. Follow this exactly on Day 1 and every session will be faster.

---

### Step 1: Choose Your IDE

**Recommended: Cursor** (cursor.com)
Cursor is a VS Code fork with Claude built in. It can read your entire codebase,
write across multiple files at once, and run terminal commands. For a solo developer
building a complex app, this is the highest-leverage tool available.

**Alternative: Claude Code** (`npm install -g @anthropic-ai/claude-code`)
Claude Code is a terminal-based agent. Slower for UI work but excellent for
running migrations, generating types, and doing complex refactors.

**Alternative: claude.ai Projects**
Use Projects to store this architecture file permanently so you never have to paste
it again. Create a Project called "Glipra", upload ARCHITECTURE.md as a Project file,
and it's available in every conversation automatically.

---

### Step 2: Configure MCPs in Cursor

MCPs let Claude interact directly with your tools instead of you copying and pasting.
Add this to your Cursor MCP settings (`Cursor → Settings → MCP`):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_DEV_PROJECT_REF"
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/full/path/to/dosepath"
      ]
    }
  }
}
```

**What this gives you:**
- Claude runs migrations directly against your dev Supabase — no copy/paste
- Claude generates TypeScript types and writes them to `src/types/database.ts`
- Claude reads any file in your project without you pasting it
- Claude can verify RLS policies actually work

**Security rule:** Only connect to DEV Supabase. Never production.

---

### Step 3: The CLAUDE.md File (Most Important Setup Step)

Create a file called `CLAUDE.md` in the root of your project. This is different from
ARCHITECTURE.md — it's a short, always-loaded context file that Claude reads automatically
at the start of every Cursor session without you having to paste anything.

```bash
touch /path/to/dosepath/CLAUDE.md
```

**CLAUDE.md contents — copy this exactly:**

```markdown
# Glipra — Claude Context

## What This App Is
GLP-1 nutrition companion app built by a licensed pharmacist.
Core promise: help users preserve muscle while GLP-1 does weight loss.
Full architecture in ARCHITECTURE.md — read it when working on new features.

## Stack (Quick Reference)
- **Expo SDK 54**, Expo Router 6, TypeScript strict — **pnpm** (never npm/yarn)
- Obytes v9.0.0 scaffold — NativeWind **stripped** → StyleSheet + `src/theme/colors.ts`
- Supabase `@supabase/supabase-js` v2.105.4 (auth + DB + edge functions)
- Zustand + React Query for state; AsyncStorage for Supabase session persistence
- OpenAI via Supabase edge functions only — NEVER from client
- `EXPO_PUBLIC_USE_MOCK_AI=true` default — zero OpenAI cost during development
- RevenueCat for subscriptions (deferred to EAS dev build)
- PostHog for analytics + feature flags (deferred to EAS dev build)
- **date-fns v4.1.0** for ALL date math (never native JS Date arithmetic)
- Zod for validation at ALL API boundaries
- **Vitest 4.1.6** (pure-TS utils, `pnpm test:utils`) + **jest-expo 54.0.16** (components, `pnpm test`)

## Critical Rules — Never Break These
1. Never call OpenAI directly from the React Native client — edge functions only
2. Never send user PII (name, email, location) to OpenAI
3. Always validate AI output with Zod before using it
4. Safety-critical files need 90%+ test coverage: protein.ts, redFlagDetector.ts,
   injection-cycle/calculator.ts, readiness/calculator.ts
5. Run `pnpm test` (jest-expo) AND `pnpm test:utils` (Vitest) before finishing any session
6. All date math uses date-fns — no raw JS Date subtraction
7. RLS must be on every table — verified before every merge
8. Disclaimer tier must be set on every screen that touches clinical content
9. Escalation card NEVER shows condition names to users (pancreatitis, etc.)
10. AI Nutrition Coach answers food questions only — hard-blocks medication questions

## File Path Conventions
- Business logic: src/features/[feature-name]/
- Shared UI: src/components/ui/
- Database types: src/types/database.ts (generated, never hand-edit)
- Edge functions: supabase/functions/[function-name]/index.ts
- Tests: src/__tests__/[filename].test.ts

## When Touching Safety-Critical Code
Always write tests alongside the implementation.
Ask: "Write the tests for this function at the same time as the function."
Never merge untested safety code.

## TypeScript Path Aliases
@/* → src/*
@components/* → src/components/*
@features/* → src/features/*
@lib/* → src/lib/*
@theme/* → src/theme/*
@utils/* → src/utils/*

## Current Phase
Month 1 — Foundation build.
Focus: Auth, consent flow, onboarding, protein floor, injection cycle, Today screen skeleton.
```

Cursor reads CLAUDE.md automatically. You never have to paste it.

---

### Step 4: The Session Startup Prompt

At the start of every coding session, paste this exact prompt before asking anything else:

```
Read CLAUDE.md and ARCHITECTURE.md. We are building Glipra — a GLP-1 nutrition
companion app built by a licensed pharmacist. Today I want to work on [FEATURE].

Before we start: confirm you understand the 10 critical rules from CLAUDE.md,
and tell me which files you'll be touching for this feature.
```

This does three things: loads full context, confirms the rules are active, and forces
Claude to plan before it codes. Planning first prevents wasted work.

---

### Step 5: How to Structure Each Feature Request

**Bad prompt (Claude will guess wrong):**
> "Build the protein floor feature"

**Good prompt (Claude has everything it needs):**
> "Build `src/utils/protein.ts` — the protein floor calculator.
> Requirements are in ARCHITECTURE.md under 'Core Models → Protein Floor.'
> Write the function AND the tests in `src/__tests__/protein.test.ts` at the same time.
> Cover all branches: kidney disease, pregnancy, BMI >35, maintenance status, edge cases.
> Use the exact constants from the architecture: ABSOLUTE_CEILING_G=200, ABSOLUTE_FLOOR_G=50,
> KIDNEY_DISEASE_MAX_G_PER_KG=0.8. Don't change the function signature."

**The pattern:**
1. Name the exact file path
2. Point to the relevant architecture section
3. State what tests you want alongside it
4. List any constraints explicitly
5. Never ask for more than one feature per session

---

### Step 6: Safety-Critical Code Protocol

Any time you're working on these files, follow this exact protocol:

```
Files that require extra care:
- src/utils/protein.ts
- src/features/safety/redFlagDetector.ts
- src/features/injection-cycle/calculator.ts
- src/features/readiness/calculator.ts
- src/features/medication-level/calculator.ts
- Any edge function that calls OpenAI
```

**The prompt to use for safety code:**

> "We're building [file]. This is safety-critical code for a health app.
> After writing the implementation:
> 1. Write comprehensive Vitest tests covering every branch
> 2. Identify any edge case that could produce a wrong result for a real patient
> 3. Highlight any assumption the function makes that a caller could violate
>
> Minimum 90% branch coverage. Show me the coverage report."

---

### Step 7: Database and Migration Workflow

**Never hand-edit `src/types/database.ts`.** It's generated. Use this workflow:

```bash
# 1. Write migration in supabase/migrations/XXX_name.sql
# 2. Apply it locally
npx supabase db reset

# 3. Regenerate types
npx supabase gen types typescript --local > src/types/database.ts

# 4. Tell Claude types changed
# "I just regenerated database types. The new schema has [describe change].
#  Update the relevant feature hooks to use the new types."
```

**With Supabase MCP active, you can ask Claude directly:**
> "Apply the journey_cards migration to my dev Supabase and then regenerate TypeScript types."

Claude does it without you running a single command.

---

### Step 8: Edge Function Workflow

Every edge function follows the reference pattern in the architecture.
When building a new one:

```
"Build the `supabase/functions/[name]/index.ts` edge function.
Follow the reference pattern from ARCHITECTURE.md → Edge Function Reference Pattern.
This function does [describe].
Input schema: [describe]
Output schema: [describe]
Rate limit: [X] per day (write this check into the ai_invocations table).
Include: CORS handling, auth validation, Zod validation on input and output,
rate limit check, error handling, cost logging."
```

---

### Step 9: End-of-Session Checklist

Before ending any coding session, run this prompt:

> "We're done for today. Before I close:
> 1. Run `npm test` and show me any failures
> 2. List every file we changed today
> 3. Check if we need to update the Decisions Log in ARCHITECTURE.md
> 4. Is there any code we wrote today that needs attorney review before shipping?
> 5. What should I do first in the next session?"

This keeps the architecture current and ensures nothing is missed.

---

### Step 10: When Claude Gets It Wrong

Claude will make mistakes. Here's how to handle them efficiently:

**Wrong implementation:** Don't argue. Show the specific failure.
> "This is wrong. The function returns [X] but it should return [Y] for a kidney
> disease patient with weight 70kg. The rule is in ARCHITECTURE.md:
> KIDNEY_DISEASE_MAX_G_PER_KG = 0.8. Fix it and show me the test that proves it."

**Hallucinated API:** Claude sometimes invents function signatures.
> "This function doesn't exist in the Supabase JS SDK. Show me where you found it,
> or use the actual SDK docs at supabase.com/docs."

**Scope creep:** Claude sometimes adds things you didn't ask for.
> "Stop. I only asked for [X]. Undo everything you added except [X]."

**Test failure:** Paste the exact error, not a description.
> "npm test output: [paste exact output]. Fix only what's failing. Don't change
> anything that's passing."

---

### Daily Build Rhythm

```
Morning:
  → Open Cursor
  → Run `npm test` to confirm clean baseline
  → Paste session startup prompt with today's feature
  → One feature per session maximum

During session:
  → Approve Claude's plan before it writes code
  → After each function: ask for tests before moving on
  → If something feels off, stop and re-read the architecture section

End of session:
  → Run end-of-session checklist prompt
  → Update CLAUDE.md if new rules emerged
  → Commit with a clear message: "feat: protein floor calculator + tests"
  → `git push` — never leave uncommitted work overnight
```

---

### The One Rule That Matters Most

**One feature per session. One file at a time when possible.**

The biggest mistake solo developers make with AI coding is asking for too much at once.
Claude writes 500 lines of plausible-looking code, you can't review it all, bugs get
buried, and an hour later nothing works.

Ask for one function. Review it. Ask for its tests. Review them. Move to the next function.

This feels slower. It's actually 3x faster because you don't spend hours debugging
AI-generated code you didn't fully understand.

---

## The Mission

A user who develops pancreatitis warning signs, sees the red-flag escalation card,
contacts their prescriber today, gets treatment, keeps their muscle mass, and comes
back to Glipra six months later in maintenance mode — still tracking protein,
still showing their prescriber the PDF, still strong.

That's the product. Everything else is just engineering.

Now stop planning and start building.
