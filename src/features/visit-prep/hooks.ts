// Visit Prep hooks
// Assembles the last-4-weeks data summary, provides AI question generation,
// and a PDF generation mutation.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { isMockAIEnabled, MOCK_VISIT_PREP_QUESTIONS } from '@/lib/mockAI';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useTodayData } from '@/features/today/hooks';
import { useWeightLogs } from '@/features/weight/hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VisitPrepData = {
  currentWeightKg: number | null;
  ewmaWeightKg: number | null;
  avgProteinG: number;
  injectionPhase: string | null;
  daysSinceInjection: number | null;
  medicationName: string | null;
  avgNausea: number | null;
  avgEnergy: number | null;
  isLoading: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert internal medication ID to a display name for the PDF. */
function medicationIdToName(id: string | undefined | null): string | null {
  if (!id) return null;
  const map: Record<string, string> = {
    semaglutide_ozempic: 'Semaglutide (Ozempic)',
    semaglutide_wegovy: 'Semaglutide (Wegovy)',
    tirzepatide_mounjaro: 'Tirzepatide (Mounjaro)',
    tirzepatide_zepbound: 'Tirzepatide (Zepbound)',
    liraglutide_saxenda: 'Liraglutide (Saxenda)',
    dulaglutide_trulicity: 'Dulaglutide (Trulicity)',
    semaglutide_compounded: 'Compounded Semaglutide',
    tirzepatide_compounded: 'Compounded Tirzepatide',
  };
  return map[id] ?? id;
}

/** Convert internal injection phase key to a human-readable label. */
function phaseLabel(phase: string | null | undefined): string | null {
  if (!phase) return null;
  const map: Record<string, string> = {
    injection_day: 'Injection Day',
    peak_suppression: 'Peak Suppression (Days 1–2)',
    adjustment: 'Adjustment (Days 3–4)',
    recovery_window: 'Recovery Window (Days 5–7)',
    overdue: 'Overdue',
  };
  return map[phase] ?? phase;
}

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
      if (!userId) return [];
      const { data: rows, error } = await supabase
        .from('daily_checkins')
        .select('nausea, energy')
        .eq('user_id', userId)
        .gte('checked_in_at', sevenDaysAgo)
        .order('checked_in_at', { ascending: false })
        .limit(7);

      if (error) throw new Error(`Failed to fetch check-ins: ${error.message}`);
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
  const { profile, injectionCycle, isLoading: isTodayLoading } = useTodayData();
  const { logs, isLoading: isWeightLoading } = useWeightLogs();
  const { checkIns, isLoading: isCheckInsLoading } = useRecentCheckIns();

  // Most-recent weight log values
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const currentWeightKg = latestLog?.weightKg ?? null;
  const ewmaWeightKg = latestLog?.ewmaWeightKg ?? null;

  // Average protein — no food logs feature yet, so stub at 0 until built
  const avgProteinG = 0;

  // Injection cycle data from today profile
  const injectionPhase = injectionCycle
    ? phaseLabel(injectionCycle.phase)
    : null;
  const daysSinceInjection = injectionCycle?.daysSinceInjection ?? null;
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
    injectionPhase,
    daysSinceInjection,
    medicationName,
    avgNausea,
    avgEnergy,
    isLoading: isTodayLoading || isWeightLoading || isCheckInsLoading,
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

    // Mock gate — zero OpenAI cost during development (Rule from CLAUDE.md cost section).
    if (isMockAIEnabled()) {
      await new Promise<void>((resolve) => setTimeout(resolve, 800));
      setQuestions([...MOCK_VISIT_PREP_QUESTIONS]);
      setIsLoading(false);
      return;
    }

    try {
      const body = {
        medicationId: data.medicationName ?? 'unknown',
        doseMg: data.doseMg ?? 0,
        injectionPhase: data.injectionPhase ?? 'unknown',
        avgNausea14d: data.avgNausea,
        avgEnergy14d: data.avgEnergy,
        proteinFloorG: data.proteinFloorG ?? 0,
        avgProtein14d: data.avgProteinG > 0 ? data.avgProteinG : null,
        recentWeightTrendKg: null, // Weight trend delta not yet computed; placeholder for Phase 2
        daysSinceInjection: data.daysSinceInjection ?? 0,
      };

      const { data: result, error: fnError } =
        await supabase.functions.invoke('generate-visit-prep', { body });

      if (fnError) {
        throw new Error(fnError.message ?? 'Question generation failed');
      }

      const raw = result as { questions?: string[] };
      if (!Array.isArray(raw?.questions) || raw.questions.length === 0) {
        throw new Error('Invalid response from visit-prep function');
      }

      setQuestions(raw.questions);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return { questions, isLoading, error, generate };
}

// ---------------------------------------------------------------------------
// useGeneratePdf
// ---------------------------------------------------------------------------

export type GeneratePdfResult = {
  generate: (data: VisitPrepData) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
};

export function useGeneratePdf(): GeneratePdfResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (data: VisitPrepData): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    // Mock gate — PDF generation requires a real Supabase connection.
    if (isMockAIEnabled()) {
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setIsLoading(false);
      setError(
        'PDF generation requires a real Supabase connection. ' +
          'Set EXPO_PUBLIC_USE_MOCK_AI=false and run the local Supabase stack.',
      );
      return null;
    }

    try {
      const visitDate = format(new Date(), 'yyyy-MM-dd');

      const body = {
        visitDate,
        patientData: {
          currentWeightKg: data.currentWeightKg ?? undefined,
          ewmaWeightKg: data.ewmaWeightKg ?? undefined,
          avgProteinG: data.avgProteinG,
          injectionPhase: data.injectionPhase ?? undefined,
          daysSinceInjection: data.daysSinceInjection ?? undefined,
          medicationName: data.medicationName ?? undefined,
          avgNausea: data.avgNausea ?? undefined,
          avgEnergy: data.avgEnergy ?? undefined,
          hasRedFlags: false, // Placeholder until red-flag history query is wired
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
        throw new Error('Invalid response from PDF function');
      }

      return pdfBase64;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { generate, isLoading, error };
}
