# App Review Notes - Glipra

_Paste this text into App Store Connect > App Information > Review Information > Notes._
_Update the [PLACEHOLDERS] before submitting._

---

## Demo Account

Email: reviewer@glipra.com
Password: GlipraReview2025!

This account has a pre-populated profile (8 weeks on Wegovy, weight trend, injection history, food logs) and a Glipra Pro subscription granted via RevenueCat promotional entitlement so all Pro features are accessible without an in-app purchase.

---

## App Overview

Glipra is a GLP-1 nutrition companion designed by a licensed pharmacist. It helps adults on GLP-1 medications (Ozempic, Wegovy, Mounjaro, Zepbound, Saxenda, and others) protect muscle mass through protein tracking, injection-cycle-aware nutrition guidance, and weekly prescriber visit preparation.

The app is nutrition and habit tracking only. It does not diagnose, prescribe, or provide medication dosing advice. Every clinical screen carries a visible disclaimer and defers to the user's prescriber.

---

## Walkthrough

### 1. Sign in
Open the app and sign in with the demo credentials above. The app lands on the Today screen (onboarding is already complete for this account).

### 2. Today screen
- The **Fuel card** at the top shows today's protein progress toward the floor (120g target), fiber, water, and the Muscle Preservation Score.
- The **Dose row** shows the current injection cycle phase ("Adjustment Day 3 of 4") based on the last logged injection date.
- The **Pharmacist Spotlight card** cycles through pharmacist-authored educational content cards relevant to the current phase.
- Tap **Log daily check-in** to record nausea (1-5), energy (1-5), and water intake. If high nausea symptoms are entered, the Escalation Card appears with a prompt to contact the prescriber -- this is the safety escalation feature (no medical condition names are shown, per our liability design).

### 3. Nutrition tab
- Today's food log appears here.
- Tap **+** to add food: manual entry, barcode scan, or AI photo/voice logging (Pro).
- The **Micronutrient Watch** card at the bottom shows Magnesium, Zinc, B12, Vitamin D, and Iron gaps vs. daily targets.

### 4. Dose tab
- Shows the full injection cycle with phase banner (Injection Day, Peak, Adjustment, Recovery) and a PK sparkline.
- Scroll to see the **adherence calendar**, **reminders panel**, and a **Prep for your visit** entry point.
- Tap **Prep for your visit** to generate AI-assisted prescriber visit questions and a downloadable PDF summary (Pro).

### 5. Progress tab
- Weight trend chart (EWMA smoothing) over 4 selectable date ranges.
- Muscle Preservation Score trend and breakdown.
- Protein consistency chart.

### 6. Coach tab (Pro)
- **AI Nutrition Coach**: ask nutrition, protein, fiber, or hydration questions. The coach is scoped to food topics only. Medication questions are blocked with a canned response directing the user to their prescriber.
- **Meal Ideas**: tap "Get meal ideas" to receive AI-generated high-protein meal suggestions tailored to the current injection phase and dietary pattern.

### 7. Settings
- Language: English / Spanish.
- Body Metrics: edit weight, height, activity level; live protein floor preview.
- Subscription: paywall with Pro plan options (Monthly $9.99, Annual $49.99, Founder Lifetime $149).
- Privacy Policy and Terms of Service (in-app legal screens).
- Account deletion (permanently deletes all data).

---

## Subscription / IAP

The demo account has Glipra Pro granted via RevenueCat promotional entitlement, so no purchase is required to review Pro features.

To test the paywall and purchase flow:
1. Create a new account (any email, no pre-seeded data).
2. Tap any Pro-gated feature (AI photo log, voice log, AI coach, visit prep PDF, meal ideas).
3. The paywall appears with three tiers.
4. Use your Apple sandbox account to complete a test purchase.

IAP product IDs:
- `[MONTHLY_PRODUCT_ID]` -- $9.99/month auto-renewing
- `[ANNUAL_PRODUCT_ID]` -- $49.99/year auto-renewing (7-day free trial)
- `[LIFETIME_PRODUCT_ID]` -- $149 non-consumable

---

## Health Content Notes

**Pharmacist credential**: Glipra was designed by Wali Abdul, PharmD, a licensed pharmacist in [STATE]. The "Designed by a licensed pharmacist" claim refers to the pharmacist who authored the app's nutrition guidelines, content cards, and safety logic. The claim does not represent a clinical relationship with the user or constitute pharmaceutical services.

**Medical disclaimer**: Every screen touching clinical content displays a visible disclaimer. Tier-1 disclaimers (AI output, protein floor, medication content) use a modal on first view. Tier-2 disclaimers (educational content, side effects) use a persistent footer. All clinical content directs users to their prescriber for medical decisions.

**Escalation / safety**: The red-flag detector monitors check-in symptoms for patterns requiring prescriber attention. When triggered, it shows the EscalationCard with the locked copy: "You've logged symptoms that may need medical attention. Please contact your prescriber today." No medical condition names are shown to users.

**HealthKit** (iOS only): Glipra reads Weight and Steps from HealthKit to supplement manual entries (read-only, no writes). The Health Import screen explains what data is read and why before requesting permission.

**AI features**: All AI calls go through Supabase edge functions to OpenAI. No user PII is included in prompts. The AI Nutrition Coach is scoped to food topics only and cannot answer medication questions.

---

## Claim Substantiation

Glipra makes no diagnostic or treatment claims. Every score and estimate in the app is an educational approximation computed from user-provided inputs and population-level research, and every clinical screen carries a visible disclaimer (Tier-1 modal on first view; Tier-2 footer) that defers the decision to the user's prescriber.

- **The one population statistic** ("up to 40% of weight lost on GLP-1s can be lean muscle") is cited on the website to the STEP 1 trial (Wilding et al., NEJM 2021) and SURMOUNT-1 (Jastreboff et al., NEJM 2022), and explicitly discloses individual variation and that no specific outcome is guaranteed.
- **Protein floor** is a deterministic estimate from the user's weight, activity, and kidney-disease flag (standard g/kg activity multipliers, a 0.8 g/kg renal-protective cap, and a 50-200 g hard clamp), shown with a "confirm with your prescriber" disclaimer.
- **Medication-level curve** is a relative pharmacokinetic estimate from published per-drug elimination half-lives (first-order decay). It is labeled educational timing only, is not the user's actual serum level, and is shown with a "not a dose recommendation, do not adjust your dose" disclaimer.
- **Muscle Preservation Score and Readiness Score** are 0-100 adherence/check-in indicators (protein and resistance-training consistency; phase and self-reported symptoms). Each states it is not a measurement of actual muscle mass or a medical assessment.
- **Pharmacist credential** ("designed by a licensed pharmacist," founder Wali Abdul, PharmD) denotes authorship of the app's guidelines, content, and safety logic. The in-app and store disclaimer states that use of Glipra does not establish a pharmacist-patient or any professional medical relationship.

A full claim-by-claim substantiation record (each claim, its source file, its methodology or citation, and its disclaimer) is maintained internally and available on request.

---

## Contact

Developer: PHARMSTRONG (Leonava LLC)
Support: legal@glipra.com
Support URL: https://glipra.com/support
