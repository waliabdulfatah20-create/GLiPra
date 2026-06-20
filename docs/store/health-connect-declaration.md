# Google Play - Health Connect Declaration (B11)

> Answer sheet for the Play Console **Health apps declaration** form and the per-data-type
> Health Connect justification. Paste/adapt these into the declaration form. Derived from the
> shipped manifest permissions and the Health Import feature.
>
> **Scope must match the manifest exactly.** `app.config.ts` (B1) declares ONLY two Health
> Connect read permissions: `android.permission.health.READ_STEPS` and
> `android.permission.health.READ_WEIGHT`. Do NOT declare any type the app does not request, or
> review will fail. **Active energy is NOT read** (the older data-safety sheet mentioned it; see
> the discrepancy note at the bottom).

---

## What the app does with Health Connect

The Health Import screen (`src/app/(app)/health-import.tsx`, reached from Settings > Health Import)
lets the user **optionally** connect Health Connect. Access is **read-only** - Glipra never writes
to Health Connect. A one-time permissions-rationale screen (the `androidx.health` intent-filter
added by the `react-native-health-connect` plugin) explains the use before the OS permission
prompt.

| Permission | Health Connect data type | What Glipra does with it | User-visible feature |
|---|---|---|---|
| `READ_WEIGHT` | Weight | Imports up to 90 days of weight readings (90-day dedup, EWMA smoothing) so the user does not have to re-enter weights they already recorded elsewhere. | The Progress-tab weight-trend chart + the "Import Weight History" action on the Health Import screen. |
| `READ_STEPS` | Steps | Reads today's step count to provide light activity-level context. | The "STEPS TODAY" tile on the Health Import screen. |

---

## Per-data-type justification (declaration form)

**Weight (`READ_WEIGHT`) - core, strongly justified.**
> Glipra is a GLP-1 nutrition companion. Weight is read from Health Connect, with the user's
> permission, to populate the in-app weight-trend chart so the user can track their progress
> without manually re-entering readings their scale or another app already wrote to Health
> Connect. The data is read-only, stored in the user's own account, never written back to Health
> Connect, and never shared with third parties for advertising.

**Steps (`READ_STEPS`) - secondary; this is the type Google scrutinizes most. Two options:**

- **Option A - keep + justify (use this wording if you keep Steps):**
  > Glipra reads the day's step count from Health Connect, with the user's permission, to give the
  > user light activity-level context alongside their nutrition tracking (shown on the Health
  > Import screen). It is read-only, never written back, and never used for advertising or shared
  > with third parties.

- **Option B - drop Steps (recommended if review pushes back).** Steps is the weakest link: it
  feeds only a single context tile, not a core feature, and Google holds steps reads to a high bar.
  If you would rather not defend it, **drop `READ_STEPS`** - remove it from `android.permissions`
  in `app.config.ts` and remove the "STEPS TODAY" tile + `fetchTodaySteps` from the Health Import
  screen, leaving a clean Weight-only Health Connect integration. That is a small code change and
  removes the only contentious permission. (Tracked as a fast-follow if you choose it.)

---

## Play "Health apps declaration" form - standing answers

- **Does your app access Health Connect?** Yes.
- **Permissions requested:** Read Weight, Read Steps (read-only; no write permissions).
- **Is access read-only?** Yes. The app never writes to Health Connect.
- **Is Health Connect access optional?** Yes. It is an opt-in Settings feature; the app is fully
  usable without it (the user can log weight manually).
- **How is the data used?** Solely to deliver in-app nutrition/progress features (weight trend +
  activity context). Not for advertising, not for any secondary purpose.
- **Is Health Connect data shared with third parties?** No.
- **Is Health Connect data sold?** No.
- **Where is it stored?** In the user's own Glipra account (Supabase, RLS-isolated). Weight
  readings imported by the user are stored like any manually logged weight; the step count is
  transient (read for display, not persisted as Health Connect data).
- **Can users delete it?** Yes - in-app account deletion removes all account data; the user can
  also disconnect Health Connect permission at any time in Android settings.
- **Privacy policy URL:** https://glipra.com/privacy (must state the Health Connect use; the
  reconciled policy already covers read-only health-platform import).
- **Data encrypted in transit?** Yes (TLS 1.2+).

**Health Connect policy compliance recap:** read-only, minimal permissions (only the two types the
app uses), permission-gated with a rationale screen, optional, no ads/no sharing/no sale, deletable.

---

## Cross-references

- **B1** (`app.config.ts`): the manifest declares exactly `READ_STEPS` + `READ_WEIGHT` and the
  rationale intent-filter. This declaration MUST stay in lockstep with that list.
- **B14** (`docs/legal/data-safety-app-privacy.md`): the Play Data safety form. **Discrepancy to
  reconcile:** that sheet's data inventory says the app reads "weight, steps, active energy" - but
  the app does **not** request active energy. Update that line to "weight, steps" so the Data
  safety form, the Health apps declaration, and the manifest all agree.
- **#89** (attorney): the privacy-policy Health Connect wording + final declaration answers join the
  legal review before submission.

---

## Owner action

Fill the Play Console **Health apps declaration** with the answers above; decide Steps **keep
(Option A)** vs **drop (Option B)**; ensure the manifest, this declaration, the Data safety form,
and the privacy policy all list the same data types. Health Connect approval can take ~7 days plus a
whitelist-propagation delay, so file it early.
