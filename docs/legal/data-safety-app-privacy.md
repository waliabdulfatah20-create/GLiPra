# Data Safety (Google Play) and App Privacy (Apple) Answer Sheet

> Working answer sheet for the Play Console **Data safety** form and App Store Connect
> **App Privacy** questionnaire. Derived from the shipped code and the reconciled
> Privacy Policy (`privacy-policy.md`). Keep this file and the policy in sync: if one
> changes, change both.
>
> **Reconciled against code (do not re-add):**
> - **No push notification tokens.** The app uses only local, on-device scheduled
>   notifications (`src/lib/notifications.ts`, `expo-notifications` DATE/DAILY/TIME_INTERVAL
>   triggers). It never registers for remote push and collects no push token.
> - **No Resend.** No deployed edge function uses Resend. Account confirmation and
>   password-reset email are sent by Supabase Auth's built-in mailer.
> - **No precise location, no payment card data, no advertising/tracking SDKs, no data sold.**

---

## 1. Confirmed data inventory (what the app actually collects)

| Data type | Where it lives | Sensitive / health | Linked to the user | Purpose |
|---|---|---|---|---|
| Name | `auth.users`, `profiles` | No | Yes | Account |
| Email address | `auth.users` | No | Yes | Account, transactional email (Supabase Auth mailer) |
| Password | `auth.users` (hashed) | No | Yes | Account security |
| Height, starting weight, activity level, goal weight | `profiles` | Yes (health) | Yes | App functionality (protein/nutrition targets) |
| Dietary pattern | `profiles` | Yes (health) | Yes | App functionality |
| Medication type, dose, route, injection day, last-injection date, dose time, medication status | `profiles` | Yes (health) | Yes | App functionality (injection cycle, reminders) |
| Kidney-disease flag | `profiles` | Yes (health) | Yes | App functionality (renal-protective protein cap) |
| Injection logs (date, site, medication, pain level, notes) | `injection_logs` | Yes (health) | Yes | App functionality |
| Medication changes (from/to medication + route, notes) | `medication_changes` | Yes (health) | Yes | App functionality |
| Weight logs (weight, smoothed weight, notes) | `weight_logs` | Yes (health) | Yes | App functionality |
| Daily check-ins (nausea, energy, water, notes, escalation flag) | `daily_checkins` | Yes (health) | Yes | App functionality, safety escalation |
| Food/meal logs (items, macros, iron, barcode, source, notes) | `food_logs` | Yes (health) | Yes | App functionality |
| Meal photos | Supabase Storage | Yes (health) | Yes | AI analysis only; **deleted within 24h** |
| Resistance-training logs (type, duration, notes) | `resistance_logs` | Yes (health) | Yes | App functionality (muscle score) |
| Streaks, milestones, viewed content cards, guidance views | `streaks`, `user_milestones`, `content_cards_viewed`, `daily_guidance` | No | Yes | App functionality |
| AI invocation audit (function name, model, token count) | `ai_invocations` | No | Yes | Operational (rate-limit + cost), not a user-facing feature |
| Device info (model, OS version, app version) | PostHog | No | No (anonymous device ID) | Analytics |
| Usage data (screens viewed, features used) | PostHog | No | No (anonymous device ID) | Analytics |
| IP address | Supabase (auth/login) | No | Yes | Security, fraud prevention |
| Crash logs / diagnostics | Sentry | No | No (PII stripped) | Diagnostics |
| Apple Health / Google Health Connect: weight, steps | Read-only, on device | Yes (health) | Yes | App functionality; **optional**, read-only, never written back (manifest declares only READ_WEIGHT + READ_STEPS) |

**Subprocessors that receive data:** Supabase (primary store), OpenAI (meal photo + anonymized
prompts, not used for training), PostHog (anonymized analytics), Sentry (crash, no health/PII),
RevenueCat (subscription status), Apple/Google (distribution + payments).

---

## 2. Google Play — Data safety form

**Global answers**
- Is data encrypted in transit? **Yes** (TLS 1.2+).
- Can users request data deletion? **Yes** (in-app account deletion + `legal@glipra.com`).
- Does the app collect or share user data? **Collects: yes. Shares: no** (see note below).

**"Collected" vs "Shared":** All third parties are service providers processing data on
GLiPra's behalf under DPAs; none use it for their own purposes and none receive it for
advertising. Under Play's definition this is **collected, not shared**. Meal photos sent to
OpenAI are **processed ephemerally** (deleted within 24h, not used to train models).

| Play category → data type | Collected | Shared | Processing | Required? | Purpose |
|---|---|---|---|---|---|
| Personal info → Name | Yes | No | — | Required | Account management |
| Personal info → Email address | Yes | No | — | Required | Account management |
| Personal info → User IDs | Yes | No | — | Required | Account management |
| Financial info → Purchase history | Yes | No | — | Optional | App functionality (subscription) |
| Health & fitness → Health info | Yes | No | — | Required* | App functionality |
| Health & fitness → Fitness info (steps via Health Connect) | Yes | No | — | Optional | App functionality |
| Photos and videos → Photos (meal photos) | Yes | No | **Ephemeral** (24h) | Optional | App functionality (AI analysis) |
| App activity → App interactions | Yes | No | — | Optional | Analytics |
| App activity → Other user-generated content (notes) | Yes | No | — | Optional | App functionality |
| App info & performance → Crash logs | Yes | No | — | Optional | Diagnostics |
| App info & performance → Diagnostics | Yes | No | — | Optional | Diagnostics |
| Device or other IDs → Device or other IDs | Yes | No | — | Optional | Analytics |

\* "Required" = needed to deliver the core nutrition/injection features; the user enters it
during onboarding. Health Connect import is optional.

**Health apps declaration (Play):** The app reads weight and step count from Health Connect
(read-only, with permission) to support nutrition and activity tracking. It never writes data
back. (Per-type Health Connect justification + form answers: `docs/store/health-connect-declaration.md`, B11.)

---

## 3. Apple — App Privacy questionnaire

**Global answers**
- Used for tracking (cross-app/advertising)? **No** for every type.
- Used for Third-Party Advertising? **No.**

| Apple category → data type | Collected | Linked to user | Used for tracking | Purpose |
|---|---|---|---|---|
| Contact Info → Email Address | Yes | Yes | No | App Functionality |
| Identifiers → User ID | Yes | Yes | No | App Functionality |
| Identifiers → Device ID (analytics) | Yes | No | No | Analytics |
| Health & Fitness → Health | Yes | Yes | No | App Functionality |
| Health & Fitness → Fitness | Yes | Yes | No | App Functionality |
| User Content → Photos or Videos (meal photos) | Yes | Yes | No | App Functionality |
| User Content → Other User Content (notes) | Yes | Yes | No | App Functionality |
| Purchases → Purchase History | Yes | Yes | No | App Functionality |
| Usage Data → Product Interaction | Yes | No | No | Analytics |
| Diagnostics → Crash Data | Yes | No | No | App Functionality |
| Diagnostics → Performance Data | Yes | No | No | App Functionality |

**Notes for the reviewer / privacy details:**
- Meal photos are transmitted for AI analysis and deleted within 24 hours; not used to train models.
- AI prompts for guidance/coaching contain anonymized context only (never name, email, or identifiers).
- Health data is used solely to deliver the app's nutrition and injection-tracking features.

---

## 4. Before filing (owner / attorney gate — out of scope here)

- Set the Privacy Policy effective date and registered address; drop the draft banner (attorney sign-off, #89).
- Confirm the privacy policy URL that both stores will point to (`glipra.com/privacy`).
- If Supabase Auth is ever switched to custom SMTP via Resend, re-add Resend to the policy and this sheet.
