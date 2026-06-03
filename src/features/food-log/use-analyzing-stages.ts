/**
 * useAnalyzingStages — drives the staged checklist in <AnalyzingModal>.
 *
 * Owns three pieces of state:
 *   - `activeIndex` — which stage row is currently showing the spinner
 *   - `showSlowHint` — has the slow-connection hint fired yet
 *   - lifecycle phase (`pending` while call is in flight, `draining` once the
 *     response landed but stages 1..n-2 still need their visible "done" beat,
 *     `done` when ready to close)
 *
 * The pure pacing math lives in `analyzing-stages.ts`. This hook orchestrates
 * the timers and reacts to external signals (`isLoading` flips false, error,
 * cancel) to advance / pause / finalize the checklist.
 */

import * as React from 'react';

import {
  type AnalyzingSource,
  planDrainDelay,
  planNextStageDelay,
  shouldShowSlowHint,
  SLOW_HINT_AFTER_MS,
  stagesFor,
  type StageKey,
} from './analyzing-stages';

export type UseAnalyzingStagesInput = {
  source: AnalyzingSource;
  /** True while the underlying recognize/transcribe call is in flight. */
  isLoading: boolean;
  /** True if the call resolved successfully. */
  hasResult: boolean;
  /** True if the call errored. The active stage gets the error icon. */
  hasError: boolean;
};

export type UseAnalyzingStagesOutput = {
  stages: readonly StageKey[];
  activeIndex: number;
  /** True once we hit "all stages done" and the modal should close. */
  isComplete: boolean;
  showSlowHint: boolean;
};

export function useAnalyzingStages(input: UseAnalyzingStagesInput): UseAnalyzingStagesOutput {
  const stages = React.useMemo(() => stagesFor(input.source), [input.source]);
  const total = stages.length;

  // `activeIndex` is the row currently showing the spinner. Done rows are 0..activeIndex-1.
  // -1 = not started yet; total = all done.
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [showSlowHint, setShowSlowHint] = React.useState<boolean>(false);

  // Track when each stage began for slow-hint timing.
  const activeStageStartRef = React.useRef<number>(0);

  // Reset whenever a new analyzing run begins (isLoading flips true with index < 0).
  React.useEffect(() => {
    if (input.isLoading && activeIndex === -1) {
      // Start: stage 0 begins immediately.
      setActiveIndex(0);
      activeStageStartRef.current = performance.now();
      setShowSlowHint(false);
    }
  }, [input.isLoading, activeIndex]);

  // Reset to -1 when both loading and result/error clear (e.g. modal closes).
  // The `activeIndex !== -1` guard prevents a stale reset firing during the
  // brief microtask gap where isLoading just flipped false but hasResult
  // hasn't yet flipped true (B3 from code review).
  React.useEffect(() => {
    if (!input.isLoading && !input.hasResult && !input.hasError && activeIndex !== -1) {
      setActiveIndex(-1);
      setShowSlowHint(false);
    }
  }, [input.isLoading, input.hasResult, input.hasError, activeIndex]);

  // Tick to the next stage at the natural cadence (used while call still in flight).
  React.useEffect(() => {
    if (activeIndex < 0 || activeIndex >= total - 1)
      return;
    // Don't auto-tick if the call already finished — let the drain effect handle it.
    if (!input.isLoading)
      return;

    const delay = planNextStageDelay(activeIndex + 1, total);
    if (!Number.isFinite(delay))
      return;

    const timer = setTimeout(() => {
      setActiveIndex(i => Math.min(total - 1, i + 1));
      activeStageStartRef.current = performance.now();
    }, delay);
    return () => clearTimeout(timer);
  }, [activeIndex, input.isLoading, total]);

  // Drain remaining stages after the call has resolved.
  React.useEffect(() => {
    if (input.isLoading)
      return;
    if (!input.hasResult)
      return;
    if (activeIndex >= total)
      return;

    const remaining = total - 1 - activeIndex;
    const delay = planDrainDelay(remaining);
    const timer = setTimeout(() => {
      setActiveIndex(i => Math.min(total, i + 1));
      activeStageStartRef.current = performance.now();
    }, delay);
    return () => clearTimeout(timer);
  }, [activeIndex, input.isLoading, input.hasResult, total]);

  // Slow-hint timer — fires only when stuck on the last stage too long.
  React.useEffect(() => {
    if (activeIndex !== total - 1)
      return;
    if (!input.isLoading)
      return;
    if (showSlowHint)
      return;

    const timer = setTimeout(() => {
      const elapsed = performance.now() - activeStageStartRef.current;
      if (shouldShowSlowHint(activeIndex, total, elapsed))
        setShowSlowHint(true);
    }, SLOW_HINT_AFTER_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, total, input.isLoading, showSlowHint]);

  const isComplete = activeIndex >= total;

  return { stages, activeIndex, isComplete, showSlowHint };
}
