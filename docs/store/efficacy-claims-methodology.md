# Glipra - Efficacy-Claim Methodology and Substantiation

> **DRAFT - REQUIRES ATTORNEY REVIEW BEFORE PUBLICATION (#89).**
> This is an internal substantiation record for the claims Glipra makes to users. It backs the
> concise "Claim Substantiation" section in `app-review-notes.md` (what Apple's reviewer reads)
> and the locked store/legal copy. It is not shipped in the app. Keep it in sync with the source
> files it cites.
> Last updated: 2026-06-19 (session 89).

---

## Framing

Every number Glipra shows a user is an **educational approximation** computed from user-provided
inputs and population-level research. None of them is a clinical measurement, a diagnosis, or a
medical recommendation. Every clinical surface carries a visible disclaimer (Tier-1 modal on first
view for AI output / protein floor / medication content; Tier-2 footer for educational content) and
defers the decision to the user's prescriber. The pharmacist credential denotes **authorship** of
the app's guidelines, content, and safety logic, not a pharmacist-patient relationship.

This document states, for each user-facing claim: the exact claim, where it appears, the
methodology or citation behind it, the disclaimer/safety bound that contains it, and the phrasing we
deliberately avoid.

All user-facing disclaimers quoted below exist in both English (`src/translations/en.json`) and
Spanish (`src/translations/es.json`); only the English is reproduced here.

---

## 1. Core promise - "protect your muscle"

**Claim (verbatim):** "The GLP-1 nutrition companion built by a licensed pharmacist. Protein
targets that protect lean mass..." and "Every GLP-1 app tracks calories. None of them protect your
muscle." (`docs/index.html`).

**Methodology / basis:** This is a behavioral-support claim, not a physiological guarantee. Glipra
acts on the two levers the user actually controls - protein intake and resistance training - and
the marketing copy is careful to say the app helps the user "stay on top of" protein, not that it
prevents any outcome.

**Bound by:** The accompanying footnote (see §2) states "GLiPra does not guarantee any specific
body-composition outcome." The B10 master disclaimer governs all surfaces.

**We do NOT claim:** "prevents muscle loss" (forbidden). The verb is "protect / support," framed
around user habits, never a guaranteed result.

---

## 2. Population statistic - "up to 40% of weight lost can be lean muscle"

**Claim (verbatim, `docs/index.html`):** "Up to 40% ... of the weight lost on GLP-1s can be lean
muscle, not just fat."

**Citation (verbatim footnote, `docs/index.html`):**

> Based on body-composition data from the STEP 1 trial (Wilding et al., NEJM 2021) and SURMOUNT-1
> (Jastreboff et al., NEJM 2022). Lean-mass loss varies by individual, medication, dose, diet, and
> exercise. GLiPra does not guarantee any specific body-composition outcome.

**Bound by:** the citation itself discloses individual variation and the absence of any guarantee.
This is the single quantitative population claim in the product; it is attributed to two
peer-reviewed NEJM trials and is presented as a general risk ("up to," "can be"), not a prediction
about the individual user.

**We do NOT claim:** "clinically proven" to do anything, or that Glipra changes this percentage.

---

## 3. Muscle Preservation Score (0–100)

**Claim:** a 0–100 score the app calls a measure of how well the user is protecting muscle.

**Methodology (`src/features/muscle-score/score.ts`):** an adherence score, not a body measurement.
It blends two tracked behaviors:
- Protein-floor adherence, weighted `MUSCLE_PROTEIN_WEIGHT = 0.7` (70%).
- Resistance-training frequency, weighted `MUSCLE_RESISTANCE_WEIGHT = 0.3` (30%).

A lever only counts once it has minimum data (`MIN_PROTEIN_DAYS = 3`, `MIN_RESISTANCE_WEEKS = 1`);
when only one lever has data its weight is re-normalized to 100% so the user is not penalized for a
lever they have not started tracking. The result is rounded and clamped to 0–100.

**Bound by (`muscle_score.disclaimer`, verbatim):**

> This score reflects your protein and resistance-training consistency, the main things you control
> to protect muscle. It is not a measurement of your actual muscle mass. Talk to your prescriber
> about your individual needs.

**We do NOT claim:** that the score measures lean mass, DEXA-equivalent body composition, or a
clinical outcome.

---

## 4. Protein floor (grams/day)

**Claim:** a personalized daily protein target in grams.

**Methodology (`src/utils/protein.ts`, safety-critical, Rule-4 90%+ test coverage):**
1. Base weight: actual weight, unless BMI is above `HIGH_BMI_THRESHOLD = 35`, in which case the
   Devine ideal body weight is used (`47.75 + 2.3 × inches over 60 in`, averaged across sexes since
   the app collects no sex).
2. Raw target: base weight (kg) × activity multiplier, where `ACTIVITY_MULTIPLIERS` = sedentary
   1.2, moderate 1.4, active 1.6 g/kg.
3. Renal-protective cap: if kidney disease is flagged, the target is capped at
   `KIDNEY_DISEASE_MAX_G_PER_KG = 0.8` g/kg of base weight.
4. Maintenance phase: × `MAINTENANCE_MULTIPLIER = 0.9`.
5. Absolute clamp: never below `ABSOLUTE_FLOOR_G = 50` g, never above `ABSOLUTE_CEILING_G = 200` g.

These multipliers reflect commonly cited protein-adequacy ranges for adults in weight-loss and
maintenance phases; the 0.8 g/kg renal cap reflects the standard renal-protective protein ceiling.
The calculation is deterministic and transparent, with hard safety bounds.

**Bound by (`protein.disclaimer`, verbatim):**

> This estimate is based on the information you provided. Inaccurate inputs will produce inaccurate
> estimates. Always confirm your protein target with your prescriber, especially if you have kidney
> disease or other health conditions.

**We do NOT claim:** that this is a clinical nutrition prescription or replaces a registered
dietitian.

---

## 5. Readiness Score (0–100)

**Claim:** a daily 0–100 "readiness" score, labeled "Pharmacist-designed algorithm."

**Methodology (`src/features/today/readiness-calculator.ts`):** a transparent delta model off a
baseline of 70. It adjusts for the medication phase (injection-cycle phase or oral dose status),
self-reported nausea and energy (1–5 each), protein pace vs. the time of day, the prior day's
protein ratio, a new-dose week, and an active streak. The result is clamped 0–100. It uses only
data the user entered; it reads no labs or vitals.

**Bound by (`readiness.disclaimer`, verbatim):**

> Check-in data personalizes your Readiness Score. It is not a medical assessment. Contact your
> prescriber if you have concerns about your symptoms.

**We do NOT claim:** that readiness is a medical or diagnostic assessment.

---

## 6. Medication Level estimate (PK curve)

**Claim:** a relative medication-level curve and a "steady state about N days" caption.

**Methodology (`src/features/medication-level/calculator.ts`):** first-order exponential
elimination, `level = dose × 0.5^(days since dose / half-life)`, summed across recent doses for the
accumulation curve. Per-drug elimination half-lives (`HALF_LIVES`, days) are: semaglutide
(Ozempic/Wegovy/Rybelsus) 7, tirzepatide (Mounjaro/Zepbound) 5, liraglutide (Saxenda/Victoza) 0.5,
dulaglutide (Trulicity) 4.5, orforglipron 1.1, compounded semaglutide 7, compounded
tirzepatide / GLP-1-GIP 5; unknown medications fall back to 7. Steady state is estimated at
`STEADY_STATE_HALF_LIVES = 5` half-lives (`daysToSteadyState = round(5 × half-life)`), the standard
~97% plateau rule. These are published population half-lives, not the user's measured serum level.

**Bound by (`med-level disclaimer`, verbatim):**

> Educational timing only. Follow the directions from your prescriber and pharmacist for your
> specific medication.

The in-app medication-level screen additionally states the value is an estimate, not a dose
recommendation, and that the user should not adjust their dose. See also
`docs/legal/medical-disclaimer.md` §3.

**We do NOT claim:** that the curve reflects the user's actual serum drug concentration, or that it
should inform any dosing or timing decision.

---

## 7. Injection-cycle and oral-dose phases

**Claim:** the app names which phase of the dose cycle the user is in, with educational guidance per
phase.

**Methodology:**
- Injection (`src/features/injection-cycle/calculator.ts`): day-since-injection thresholds - day 0
  injection day, days 1–2 peak suppression, days 3–4 adjustment, days 5–7 recovery window, day 8+
  overdue. Interval defaults to 7 days, configurable for biweekly/custom. All date math uses
  date-fns.
- Oral (`src/features/oral-cycle/calculator.ts`): a titration + adherence model rather than a
  weekly peak/trough, reaching steady state at `ORAL_STEADY_STATE_DAYS = 28` days of daily dosing.

The phase labels organize educational appetite/nutrition guidance by where the user is in the
cycle. They are timing context, not instructions about the medication.

**Bound by (`med_banner_oral` / phase disclaimer, verbatim):** "Educational timing only. Follow the
directions from your prescriber and pharmacist for your specific medication." Phase guidance always
says to follow the prescriber's schedule.

**We do NOT claim:** to set, change, or advise the user's dosing schedule.

---

## 8. Pharmacist credential

**Claim (verbatim):** "Designed by a licensed pharmacist"; "pharmacist-authored content."

**Basis:** Glipra's founder is Wali Abdul, PharmD, a licensed pharmacist (founder bio public on
`docs/index.html`). The credential refers to the pharmacist who authored the app's nutrition
guidelines, content cards, and safety logic.

**Bound by:** the B10 master disclaimer (§9) states use of Glipra "does not establish a
pharmacist-patient relationship or any professional medical relationship." CLAUDE.md liability rule
2 controls this language.

**Approved phrasings:** "Designed by a licensed pharmacist," "pharmacist-authored content."
**Forbidden phrasings:** "your pharmacist recommends," "pharmacist-approved," "your virtual
pharmacist."

---

## 9. Master disclaimer (B10) - shown verbatim in-app and in the store listing

> Glipra is an educational and tracking application for general wellness purposes. Information
> provided, including AI-generated suggestions and content articles, is for educational purposes
> only and is not medical advice, diagnosis, or treatment. Although Glipra was designed by a
> licensed pharmacist, your use of Glipra does not establish a pharmacist-patient relationship
> or any professional medical relationship. Glipra is not a substitute for professional medical
> advice. Always seek the advice of your prescriber or qualified healthcare provider. If you
> think you may have a medical emergency, call 911.

---

## 10. Negative space - claims we deliberately never make

Per the locked copy rules (`docs/store/listing-copy.md`, CLAUDE.md liability rules), the product
never uses any of these phrases:

- "prevents muscle loss"
- "clinically proven"
- "doctor-recommended"
- "FDA-approved"
- "reduces side effects"
- "your virtual pharmacist"

---

## Attorney review (#89)

This document and every claim/disclaimer it cites are DRAFT and require attorney sign-off before any
public release, alongside the rest of the legal/store packet. Specific points to confirm:
(1) adequacy of the §6 medication-level half-life disclaimer; (2) the §2 population-statistic
citation and its "no guarantee" framing; (3) the §8 pharmacist-credential phrasing and the
pharmacist-patient-relationship disclaimer; (4) that nothing here drifts from the locked B10 master
disclaimer.
