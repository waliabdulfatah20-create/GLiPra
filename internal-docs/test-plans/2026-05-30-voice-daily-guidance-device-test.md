# On-Device Test Plan — Voice Logging + Daily AI Guidance

**Build:** EAS development profile, Android, commit `81b2433`
**Build ID:** `eee1489a-eab9-4b61-b856-4e753e2be24d`
**Mock AI:** `EXPO_PUBLIC_USE_MOCK_AI=true` (dev profile) — transcription and guidance return
canned mock data; **no real OpenAI calls**. Audio recording itself is real (native expo-av).
**Date:** 2026-05-30

---

## What this build actually contains (read first)

PROGRESS.md describes a voice-hero redesign (sessions 44/45) and a color-token cleanup
(session 42) as shipped. **Those are NOT in this build.** Expect:

- The **old two-button AI row**: Photo and Voice side-by-side (not a full-width voice hero).
- The voice button as a **dark box with a 🎙 emoji + "Speak your meal" subtitle** (hardcoded
  colors, no PRO badge band).

Voice logging and Daily AI Guidance both **function** — only the redesigned styling is absent.

---

## Prerequisite — Pro entitlement

Both features are **fully Pro-gated** (`glipra_pro` entitlement via RevenueCat).
On a fresh dev build with no purchase, tapping either shows the **paywall**, not the feature.

- [ ] Confirm how you're testing Pro: sandbox purchase, a granted test entitlement, or
      a forced `isPro` in `use-subscription`. Without Pro you can only verify the paywall appears.

---

## A. Install & launch

- [ ] Download the APK from the build link and install over the existing dev client.
- [ ] App launches without a redbox / crash on the **Nutrition (Log)** tab.
- [ ] No `requireNativeModule('ExponentAV')` crash on opening the Log tab (the expo-av
      lazy-require fix — session 43).

## B. Voice logging — `VoiceCaptureButton` + `AIReviewSheet`

- [ ] Log tab shows the AI row with **Photo (left) and Voice (right)** buttons.
- [ ] **Non-Pro:** tap Voice → RevenueCat **paywall** appears. Cancel it → returns to Log
      cleanly, **no recording starts** (CANCELLED guard).
- [ ] **Pro:** tap Voice → OS **mic permission** prompt on first use.
- [ ] Deny permission → alert (`voice_permission_denied_*`), no crash.
- [ ] Grant permission → button switches to **recording state**: red box, static waveform
      bars, and an **MM:SS timer counting up**.
- [ ] Tap again to **stop** → button shows the processing/loading state.
- [ ] **AIReviewSheet** opens showing the mock parse result (`MOCK_VOICE_PARSE`) with the
      **transcript rendered as a quoted block** and editable macro fields.
- [ ] Confirm/save the entry → it appears in today's food log; macro ring updates.
- [ ] **Backgrounding mid-record:** start recording, navigate away → no crash; audio session
      released (unmount cleanup).

## C. Daily AI Guidance — `DailyGuidanceCard` (Today tab)

- [ ] **Non-Pro:** card shows the **ProGate** (locked) state, not guidance text.
- [ ] **Pro:** card shows a **gradient header** (expo-linear-gradient native module loads — no crash).
- [ ] On first view, the **Tier-1 disclaimer** appears (AsyncStorage-backed first-view ack).
- [ ] Guidance text renders (mock `MOCK_DAILY_GUIDANCE`) after a brief ~400ms load.
- [ ] Tap **"Why this?"** → expands `reasoning_text`; tap again collapses.
- [ ] Card **does not appear** when medication status is `discontinued` (set via profile/onboarding
      to verify suppression).
- [ ] Only fetches once per day (re-open Today → no re-load spinner; staleTime: Infinity).

## D. Regression sanity (native modules in this build)

- [ ] Photo capture still works (expo-image-picker) and opens AIReviewSheet.
- [ ] Barcode scanner opens (expo-camera).
- [ ] Add Shot date/time picker works (`@react-native-community/datetimepicker`).
- [ ] Language switch EN ↔ ES updates voice + guidance copy in place (no restart).

---

## Notes / follow-ups

- If the redesigned voice hero is expected, PROGRESS.md and the code are out of sync
  (sessions 42/44/45). Decide: build the redesign, or correct PROGRESS.md.
- To test **real** AI (not mock), a separate build with `EXPO_PUBLIC_USE_MOCK_AI=false` is
  needed — but that is gated on attorney review of the AI prompts (CLAUDE.md legal gate).
