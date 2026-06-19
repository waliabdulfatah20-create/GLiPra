# Design — 7-day free trial (intro offer) on Annual + Monthly, dynamic eligibility

**Status:** SPEC ONLY — no code yet. Execute as part of **#92** (RevenueCat wiring after Apple approval),
when store intro offers + RC keys + a sandbox account exist to build and test it. Spec'd session 88 (2026-06-16).

## Context
A 7-day free trial lifts free→paid conversion for an unproven brand (let users feel the AI logging before the
charge). Owner decisions: trial on **both Annual ($49.99/yr) and Monthly ($9.99/mo)**; **dynamic eligibility**
(show "7 days free" only to store-eligible users). Lifetime ($149) is one-time — no trial.

**How it works:** a trial is an **introductory offer (free-trial type)** configured per-product in the stores;
RevenueCat surfaces it. The store **auto-applies** it to an eligible user at purchase — `isPro` entitlement
logic is **unchanged** (a trial grants the `GLiPra Pro` entitlement). Work = store config (owner) + paywall
display/eligibility/disclosure (code).

**Why #92-gated:** the paywall today purchases by raw `purchaseProduct('yearly')` with **hardcoded prices** and
reads no Offerings/eligibility (`revenue-cat.ts` only does `getCustomerInfo` tier checks). Dynamic eligibility
needs a move to **RevenueCat Offerings** (`react-native-purchases v10`), and none of it is testable until Apple
enrollment (#87) + IAP products with intro offers (#92) + RC API keys exist.

## Owner-run (store config — part of #92)
- **App Store Connect:** 7-day free-trial introductory offer on the Pro Monthly + Pro Annual auto-renewables (same subscription group).
- **Google Play:** 7-day free-trial offer phase on the monthly + annual base plans.
- **RevenueCat:** products in an Offering with packages (Annual / Monthly / Lifetime); set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY`.

## Code (paywall → Offerings; react-native-purchases v10)
1. **`src/lib/revenue-cat.ts`** (entitlement logic untouched):
   - `getPaywallOfferings()` → `Purchases.getOfferings()`; map `current.availablePackages` → `{ packageId, productId, priceString, period, introFreeTrial: { days } | null }` (read `pkg.product.priceString` + `pkg.product.introPrice` / Android free-trial phase).
   - `getIntroEligibility(productIds)` → wraps `Purchases.checkTrialOrIntroductoryPriceEligibility(productIds)` → `{ [productId]: eligible }`. iOS-reliable; on Android RC returns UNKNOWN → treat "intro phase present" as eligible, let Google enforce. Document.
   - `purchasePaywallPackage(pkg)` → `Purchases.purchasePackage(pkg)` (auto-applies the intro offer), replacing raw `purchaseProduct`.
2. **`src/features/subscription/paywall-screen.tsx`:**
   - On mount (when `PURCHASES_AVAILABLE`) load offerings + eligibility into state; `purchasePackage` on tap.
   - Render each `PriceTier` from the package: price = store-localized `priceString`; trial + eligible → "7 days free, then {priceString}" + CTA "Start 7-day free trial" (reuse the optional `sub` prop added session 88); else current price.
   - **Fallback when Offerings unavailable** (Expo Go / pre-enrollment / no keys / network fail): render today's hardcoded $9.99 / $49.99 / $149, no trial copy, purchase disabled — exactly today's behavior. Hardcoded = fallback; dynamic = happy path.
3. **Disclosure (Apple 3.1.2 / Google — extends B4):** add trial terms ("Starts a 7-day free trial; after it ends the subscription auto-renews at $9.99/month or $49.99/year unless cancelled at least 24 hours before the trial ends. Manage or cancel anytime in your {Apple ID / Google Play} settings. Lifetime is a one-time purchase."). New trial copy → **attorney #89**.
4. **Analytics:** add a `trial_started` event in `src/lib/analytics.ts`, fired on a successful trial-eligible purchase.

## Tests
- Pure mapping (jest/vitest): `getPaywallOfferings` (mock RC offerings → tier view-models incl. intro detection) + `getIntroEligibility` shape.
- Paywall RTL (mock offerings/eligibility): eligible → annual+monthly show "7 days free" + trial CTA; ineligible → plain price; offerings null → hardcoded fallback + disabled.
- **Unverifiable until #92:** real Offerings, store intro offers, RC keys, sandbox/TestFlight account needed for true E2E. Flag.
- Gates: tsc 0 · lint 0 · jest · vitest · lint:translations.

## Compliance
Apple 3.1.2(a) + Google require trial terms disclosed before purchase and the "free trial" label shown only to
eligible users — both covered. The disclosure copy joins attorney **#89** (extends the B4 auto-renew disclosure).
