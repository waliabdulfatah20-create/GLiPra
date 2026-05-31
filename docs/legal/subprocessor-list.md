# Subprocessor List

**Glipra** — a product of **Leonava** (a Texas company)
**Effective date:** [DATE]
**Last updated:** [DATE]

> **DRAFT — REQUIRES ATTORNEY REVIEW BEFORE PUBLICATION**

---

Leonava uses the following third-party subprocessors ("subprocessors") to operate Glipra. Each subprocessor processes personal information on our behalf, subject to written data processing agreements that restrict their use of your data to performing services for us.

This list is updated whenever we add, change, or remove a subprocessor. Material changes are announced via in-app notification at least **30 days** before the change takes effect.

---

## Infrastructure and Core Services

| Subprocessor | Role | Data processed | Data location | Privacy policy |
|---|---|---|---|---|
| **Supabase, Inc.** | Database, authentication, file storage, edge function hosting | All user data including health data, account information, uploaded photos | United States | supabase.com/privacy |
| **Expo / Expo Application Services (EAS)** | Mobile app builds, over-the-air (OTA) updates, crash reporting (basic) | App build artifacts; no user personal data in transit | United States | expo.dev/privacy |

---

## Artificial Intelligence

| Subprocessor | Role | Data processed | Data location | Privacy policy |
|---|---|---|---|---|
| **OpenAI, L.L.C.** | AI-powered meal photo analysis (GPT-4o vision); AI nutrition guidance and coaching (GPT-4o mini); voice transcription (Whisper) | Meal photos; anonymized, non-identifying nutrition and wellness context; voice audio for transcription. **Personal identifiers (name, email, exact location) are never sent to OpenAI.** | United States | openai.com/policies/privacy-policy |

---

## Payments and Subscriptions

| Subprocessor | Role | Data processed | Data location | Privacy policy |
|---|---|---|---|---|
| **RevenueCat, Inc.** | Subscription entitlement management; purchase verification; paywall and offering management | Subscription status, entitlements, anonymous user ID; **no payment card data** | United States | revenuecat.com/privacy |
| **Apple Inc.** | iOS in-app purchase processing (App Store) | Payment card data, purchase receipts; processed under Apple's policies | United States | apple.com/legal/privacy |
| **Google LLC** | Android in-app purchase processing (Google Play) | Payment card data, purchase receipts; processed under Google's policies | United States | policies.google.com/privacy |

---

## Analytics

| Subprocessor | Role | Data processed | Data location | Privacy policy |
|---|---|---|---|---|
| **PostHog, Inc.** | Product analytics; feature flag management; user behavior analysis | Anonymized device and usage events; **no health data is sent to PostHog** | United States | posthog.com/privacy |

---

## Error Monitoring

| Subprocessor | Role | Data processed | Data location | Privacy policy |
|---|---|---|---|---|
| **Sentry (Functional Software, Inc.)** | Crash reporting; error monitoring; performance tracing | Stack traces, device info, anonymized breadcrumb events; **no health data is sent to Sentry** | United States | sentry.io/privacy |

---

## Email

| Subprocessor | Role | Data processed | Data location | Privacy policy |
|---|---|---|---|---|
| **Resend, Inc.** | Transactional email delivery (account confirmation, password reset, subscription receipts) | Recipient email address; email content | United States | resend.com/legal/privacy-policy |

---

## App Distribution

| Subprocessor | Role | Data processed | Data location | Privacy policy |
|---|---|---|---|---|
| **Apple Inc.** | iOS app distribution via App Store | Account registration, download, and update data processed under Apple's policies | United States | apple.com/legal/privacy |
| **Google LLC** | Android app distribution via Google Play | Account registration, download, and update data processed under Google's policies | United States | policies.google.com/privacy |

---

## Notes

1. **OpenAI data handling:** We configure our OpenAI API integration in accordance with OpenAI's zero-data-retention and API usage policies. AI prompts contain only anonymized context and never include identifying information. We do not use OpenAI's fine-tuning or training features with user data.

2. **Supabase data residency:** Our Supabase project is hosted in the United States. All primary user data is stored and processed in the United States.

3. **No advertising subprocessors:** We do not use any advertising platforms, ad networks, or data brokers. We do not share user data for advertising, retargeting, or similar purposes.

4. **Health data restrictions:** Subprocessors that receive health-related data (Supabase, OpenAI for meal photos) are restricted by contract to processing that data only for the purposes of providing their services to us.

---

## Requesting Subprocessor Information

For questions about our subprocessors, their data processing agreements, or to request a notification of changes before they take effect, contact [LEGAL@GLIPRA.COM].

---

> **ATTORNEY REVIEW REQUIRED.** This is a first draft. Key areas: (1) Verify current DPA terms with each subprocessor — especially OpenAI, Supabase, and RevenueCat for health data; (2) Confirm OpenAI API data retention and training-opt-out settings are enabled in the Leonava account; (3) Washington WMHMD Act may require explicit authorization for sharing health data with subprocessors — verify consent flow is sufficient; (4) Review whether any subprocessors are located outside the U.S. (relevant if future GDPR scope arises); (5) Add any additional subprocessors introduced during development (e.g., CDN, logging, feature-flag providers).
