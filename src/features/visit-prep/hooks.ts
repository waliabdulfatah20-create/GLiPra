// Visit Prep hooks
// Assembles the last-4-weeks data summary, provides AI question generation,
// and a PDF generation mutation.

import type { MedicationChangeRecord } from '@/features/medication-change/api';
import type { AdministrationRoute } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { useState } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useProteinHistoryPerDay } from '@/features/progress/hooks';
import { useTodayData } from '@/features/today/hooks';
import {
  daysSinceLastDose,
  injectionPhaseLabel,
  medicationChangeToPdfRow,
  medicationIdToName,
  oralPhaseLabel,
} from '@/features/visit-prep/summary';
import { useWeightLogs } from '@/features/weight/hooks';
import { isMockAIEnabled, MOCK_VISIT_PREP_QUESTIONS, MOCK_VISIT_PREP_QUESTIONS_ORAL } from '@/lib/mockAI';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VisitPrepData = {
  currentWeightKg: number | null;
  ewmaWeightKg: number | null;
  avgProteinG: number;
  administrationRoute: AdministrationRoute;
  // Injection-route fields (null for oral users)
  injectionPhase: string | null;
  daysSinceInjection: number | null;
  // Oral-route fields (null for injection users)
  oralPhase: string | null;
  doseAdherenceStreak: number | null;
  daysSinceLastDose: number | null;
  medicationName: string | null;
  avgNausea: number | null;
  avgEnergy: number | null;
  isLoading: boolean;
};

// ---------------------------------------------------------------------------
// useRecentCheckIns — fetches last 7 check-in records for symptom averages
// ---------------------------------------------------------------------------

type CheckInRow = { nausea: number; energy: number };

function useRecentCheckIns(): {
  checkIns: CheckInRow[];
  isLoading: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['visit-prep-checkins', userId],
    queryFn: async () => {
      if (!userId)
        return [];
      const { data: rows, error } = await supabase
        .from('daily_checkins')
        .select('nausea, energy')
        .eq('user_id', userId)
        .gte('checked_in_at', sevenDaysAgo)
        .order('checked_in_at', { ascending: false })
        .limit(7);

      if (error)
        throw new Error(`Failed to fetch check-ins: ${error.message}`);
      return (rows ?? []) as CheckInRow[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return { checkIns: data ?? [], isLoading };
}

// ---------------------------------------------------------------------------
// useVisitPrepData
// ---------------------------------------------------------------------------

export function useVisitPrepData(): VisitPrepData {
  const {
    profile,
    injectionCycle,
    administrationRoute,
    oralCycle,
    oralAdherenceStreak,
    oralLastDoseTakenAt,
    isLoading: isTodayLoading,
  } = useTodayData();
  const { logs, isLoading: isWeightLoading } = useWeightLogs();
  const { checkIns, isLoading: isCheckInsLoading } = useRecentCheckIns();
  // 28-day protein history (food logging is now live)
  const { history: proteinHistory, isLoading: isProteinLoading } = useProteinHistoryPerDay(28);

  // Most-recent weight log values
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const currentWeightKg = latestLog?.weightKg ?? null;
  const ewmaWeightKg = latestLog?.ewmaWeightKg ?? null;

  // 28-day average protein — only count days where the user logged food (hasData)
  const loggedDays = proteinHistory.filter(d => d.hasData);
  const avgProteinG
    = loggedDays.length > 0
      ? loggedDays.reduce((sum, d) => sum + d.proteinG, 0) / loggedDays.length
      : 0;

  // Route-aware cycle data. Injection users get phase + days-since-injection;
  // oral users get a treatment-status label, dosing streak, and days since the
  // last dose. The other route's fields stay null.
  const isOral = administrationRoute === 'oral';
  const today = format(new Date(), 'yyyy-MM-dd');

  const injectionPhase = !isOral && injectionCycle
    ? injectionPhaseLabel(injectionCycle.phase)
    : null;
  const daysSinceInjection = !isOral ? (injectionCycle?.daysSinceInjection ?? null) : null;

  const oralPhase = isOral && oralCycle ? oralPhaseLabel(oralCycle.phase) : null;
  const doseAdherenceStreak = isOral ? oralAdherenceStreak : null;
  const oralDaysSinceLastDose = isOral
    ? daysSinceLastDose(oralLastDoseTakenAt, today)
    : null;

  const medicationName = medicationIdToName(profile?.medicationId);

  // Symptom averages from last 7 check-ins
  let avgNausea: number | null = null;
  let avgEnergy: number | null = null;

  if (checkIns.length > 0) {
    const totalNausea = checkIns.reduce((sum, c) => sum + c.nausea, 0);
    const totalEnergy = checkIns.reduce((sum, c) => sum + c.energy, 0);
    avgNausea = totalNausea / checkIns.length;
    avgEnergy = totalEnergy / checkIns.length;
  }

  return {
    currentWeightKg,
    ewmaWeightKg,
    avgProteinG,
    administrationRoute,
    injectionPhase,
    daysSinceInjection,
    oralPhase,
    doseAdherenceStreak,
    daysSinceLastDose: oralDaysSinceLastDose,
    medicationName,
    avgNausea,
    avgEnergy,
    isLoading: isTodayLoading || isWeightLoading || isCheckInsLoading || isProteinLoading,
  };
}

// ---------------------------------------------------------------------------
// useVisitPrep — AI-generated prescriber discussion questions
// ---------------------------------------------------------------------------
// Rule 1: OpenAI is never called from the client. All AI calls go through
//         the generate-visit-prep Supabase edge function.
// Rule 2: No PII is sent — the edge function schema enforces this.
// Mock gate: when EXPO_PUBLIC_USE_MOCK_AI=true, returns hardcoded questions
//            after 800 ms without calling the edge function.

export type UseVisitPrepResult = {
  questions: string[] | null;
  isLoading: boolean;
  error: string | null;
  generate: (data: VisitPrepData & { doseMg?: number; proteinFloorG?: number }) => Promise<void>;
};

export function useVisitPrep(): UseVisitPrepResult {
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    data: VisitPrepData & { doseMg?: number; proteinFloorG?: number },
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const isOral = data.administrationRoute === 'oral';

    // Mock gate — zero OpenAI cost during development (Rule from CLAUDE.md cost section).
    if (isMockAIEnabled()) {
      await new Promise<void>(resolve => setTimeout(resolve, 800));
      setQuestions([...(isOral ? MOCK_VISIT_PREP_QUESTIONS_ORAL : MOCK_VISIT_PREP_QUESTIONS)]);
      setIsLoading(false);
      return;
    }

    try {
      const body = {
        medicationId: data.medicationName ?? 'unknown',
        doseMg: data.doseMg ?? 0,
        administrationRoute: data.administrationRoute,
        avgNausea14d: data.avgNausea,
        avgEnergy14d: data.avgEnergy,
        proteinFloorG: data.proteinFloorG ?? 0,
        avgProtein14d: data.avgProteinG > 0 ? data.avgProteinG : null,
        recentWeightTrendKg: null, // Weight trend delta not yet computed; placeholder for Phase 2
        // Route-specific clinical signal
        ...(isOral
          ? {
              oralPhase: data.oralPhase ?? 'unknown',
              doseAdherenceStreakDays: data.doseAdherenceStreak ?? 0,
              daysSinceLastDose: data.daysSinceLastDose ?? 0,
            }
          : {
              injectionPhase: data.injectionPhase ?? 'unknown',
              daysSinceInjection: data.daysSinceInjection ?? 0,
            }),
      };

      const { data: result, error: fnError }
        = await supabase.functions.invoke('generate-visit-prep', { body });

      if (fnError) {
        throw new Error(fnError.message ?? 'Question generation failed');
      }

      const raw = result as { questions?: string[] };
      if (!Array.isArray(raw?.questions) || raw.questions.length === 0) {
        throw new Error('Invalid response from visit-prep function');
      }

      setQuestions(raw.questions);
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    }
    finally {
      setIsLoading(false);
    }
  };

  return { questions, isLoading, error, generate };
}

// ---------------------------------------------------------------------------
// useGeneratePdf
// ---------------------------------------------------------------------------

export type GeneratePdfResult = {
  generate: (
    data: VisitPrepData,
    medicationChanges?: MedicationChangeRecord[],
  ) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
};

export function useGeneratePdf(): GeneratePdfResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    data: VisitPrepData,
    medicationChanges?: MedicationChangeRecord[],
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const visitDate = format(new Date(), 'yyyy-MM-dd');

      const isOral = data.administrationRoute === 'oral';

      // Switch history (oral <-> injection, dose changes) — mirror the on-screen
      // MEDICATION CHANGES card in the PDF. Omitted when there are no switches.
      const medChangeRows = (medicationChanges ?? []).map(medicationChangeToPdfRow);

      const body = {
        visitDate,
        patientData: {
          currentWeightKg: data.currentWeightKg ?? undefined,
          ewmaWeightKg: data.ewmaWeightKg ?? undefined,
          avgProteinG: data.avgProteinG,
          administrationRoute: data.administrationRoute,
          medicationName: data.medicationName ?? undefined,
          avgNausea: data.avgNausea ?? undefined,
          avgEnergy: data.avgEnergy ?? undefined,
          hasRedFlags: false, // Placeholder until red-flag history query is wired
          ...(medChangeRows.length > 0 ? { medicationChanges: medChangeRows } : {}),
          // Route-specific clinical signal
          ...(isOral
            ? {
                oralPhase: data.oralPhase ?? undefined,
                doseAdherenceStreakDays: data.doseAdherenceStreak ?? undefined,
                daysSinceLastDose: data.daysSinceLastDose ?? undefined,
              }
            : {
                injectionPhase: data.injectionPhase ?? undefined,
                daysSinceInjection: data.daysSinceInjection ?? undefined,
              }),
        },
      };

      const { data: result, error: fnError } = await supabase.functions.invoke(
        'generate-visit-pdf',
        { body },
      );

      if (fnError) {
        throw new Error(fnError.message ?? 'PDF generation failed');
      }

      const pdfBase64 = (result as { pdfBase64?: string })?.pdfBase64;
      if (typeof pdfBase64 !== 'string') {
        throw new TypeError('Invalid response from PDF function');
      }

      return pdfBase64;
    }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    }
    finally {
      setIsLoading(false);
    }
  };

  return { generate, isLoading, error };
}
