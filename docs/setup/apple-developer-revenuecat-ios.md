# Apple Developer Enrollment + RevenueCat iOS Setup

Clears the Tier 0 blocker "RevenueCat iOS key" (see the project to-do list) and unlocks
iOS TestFlight + App Store. Created 2026-05-30.

> Context: Glipra builds via EAS cloud. iOS builds and StoreKit/RevenueCat require a paid
> Apple Developer account ($99/yr). The end deliverable here is a **StoreKit In-App
> Purchase key (.p8)** that RevenueCat needs.

## Status (last updated 2026-05-30)
- Entity type: **Organization**. Legal entity: **Leonava** (LLC formed via Northwest Registered Agent).
- ✅ D-U-N-S **requested** via Apple's lookup/request tool on 2026-05-30 — **awaiting issuance** (~5 business days, occasionally up to 2 weeks; arrives by email).
- ⏭ Next once D-U-N-S arrives: Apple Organization enrollment → App Store Connect → .p8 key → RevenueCat.

---

## Decision to make up front

- [ ] **Entity type: Individual vs Organization**
  - **Individual / Sole Proprietor** — approved in hours. App Store "Seller" shows your personal name. No D-U-N-S.
  - **Organization** — App Store shows the company name. Requires a **D-U-N-S number** (free, 1–2 weeks) + legal authority to bind the entity.
  - ⚠️ Hard to switch later. For a pharmacist-credentialed health app, decide which name you want public.
  - If Organization: **request the D-U-N-S number first** (long pole) → https://developer.apple.com/support/D-U-N-S/

## Step 1 — Apple ID prep

- [ ] Pick the Apple ID that will own the account.
- [ ] Enable **two-factor authentication** on it (enrollment fails without it).

## Step 2 — Enroll

- [ ] Go to https://developer.apple.com/programs/enroll
- [ ] Select entity type (from decision above).
- [ ] Complete identity verification (Apple may ask for ID).
- [ ] Pay the **$99/year** fee.
- [ ] Wait for approval (Individual: hours; Organization: longer, after D-U-N-S verified).

## Step 3 — App Store Connect setup

- [ ] Sign in at https://appstoreconnect.apple.com
- [ ] Create the **app record**: bundle ID `com.glipra` (matches `app.config.ts` production), name "Glipra", primary language, SKU.
- [ ] Under **Agreements, Tax, and Banking**: accept the **Paid Apps agreement** and fill tax/banking — IAP will not work until this is "Active".
- [ ] Create the subscription products RevenueCat expects:
  - Pro Monthly — $9.99/month
  - Pro Annual — $79.99/year
  - Founder Lifetime — $149 one-time (non-consumable; first 500 users)
  - Entitlement identifier in code: **`glipra_pro`** (see `src/features/subscription/`).

## Step 4 — Generate the StoreKit key for RevenueCat

- [ ] App Store Connect → **Users and Access → Integrations → In-App Purchase** → generate a key.
- [ ] Download the **.p8 file** (one-time download — store it securely, e.g. password manager).
- [ ] Record the **Key ID** and your **Issuer ID**.

## Step 5 — Wire RevenueCat

- [ ] In the RevenueCat dashboard: create/select the iOS app, upload the **.p8** + Key ID + Issuer ID + App Store bundle ID.
- [ ] Map RevenueCat products → the `glipra_pro` entitlement.
- [ ] Copy the RevenueCat **iOS public SDK key** (`appl_...`).
- [ ] Set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` in `.env.development` (currently empty at L17) and in the production env keys (`.env.production` / eas.json production profile — both currently empty).

## Step 6 — Verify

- [ ] Trigger an iOS dev build: `eas build --profile development --platform ios` (needs Apple credentials; `eas credentials` will guide the first run).
- [ ] On a real iPhone with a **sandbox tester** account, confirm the paywall presents and a sandbox purchase grants the `glipra_pro` entitlement (unlocks photo/voice/guidance).

---

## Related blockers (do alongside)
- Attorney sign-off on AI copy before `EXPO_PUBLIC_USE_MOCK_AI=false`.
- Populate `.env.production` with real Supabase / RevenueCat / PostHog / Sentry keys.
- Re-enable Supabase email confirmation before public release.
