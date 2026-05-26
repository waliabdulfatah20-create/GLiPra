// React Query hooks for the food-log feature.

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { analytics, EVENTS } from '@/lib/analytics';

import {
  fetchTodayFoodLogs,
  getFoodDefault,
  getRecentCorrections,
  insertBarcodeFoodLog,
  insertFoodLog,
  insertPhotoFoodLog,
  saveFoodCorrection,
  upsertFoodDefault,
} from './api';
import { fetchBarcodeCorrection, saveBarcodeCorrection } from './barcode-corrections';
import type { BarcodeProduct } from './barcode-lookup';
import { usePhotoFoodRecognition, type RecognitionResult } from './photo-recognition';
import type { BarcodeFoodEntry, FoodCorrection, FoodLogEntry, ManualFoodEntry, PhotoFoodEntry } from './types';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
const foodLogKeys = {
  todayLogs: (userId: string, today: string) =>
    ['food-logs', 'today', userId, today] as const,
  foodDefault: (userId: string, foodNameKey: string) =>
    ['food-defaults', userId, foodNameKey] as const,
};

// ---------------------------------------------------------------------------
// useTodayFoodLogs
// Fetches today's food log entries for the authenticated user.
// ---------------------------------------------------------------------------
export function useTodayFoodLogs(): {
  logs: FoodLogEntry[];
  isLoading: boolean;
  refetch: () => void;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading, refetch } = useQuery({
    queryKey: foodLogKeys.todayLogs(userId ?? '', today),
    queryFn: () => fetchTodayFoodLogs(userId!, today),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds — food logs change frequently
  });

  return {
    logs: data ?? [],
    isLoading,
    refetch,
  };
}

// ---------------------------------------------------------------------------
// useInsertFoodLog
// Inserts a food log entry and invalidates today's query on success.
// ---------------------------------------------------------------------------
export function useInsertFoodLog(): {
  mutate: (entry: ManualFoodEntry) => void;
  isLoading: boolean;
} {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { mutate, isPending } = useMutation({
    mutationFn: (entry: ManualFoodEntry) => {
      if (!userId) throw new Error('Not authenticated');
      return insertFoodLog(userId, entry, 'manual', null);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.FOOD_LOGGED_MANUAL, { source: 'manual' });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.todayLogs(userId, today),
        });
      }
    },
  });

  return {
    mutate,
    isLoading: isPending,
  };
}

// ---------------------------------------------------------------------------
// useInsertBarcodeFoodLog
// Inserts a food log entry sourced from barcode scanning.
// Always free — no paywall check needed per subscription rules.
// ---------------------------------------------------------------------------
export function useInsertBarcodeFoodLog(): {
  mutate: (entry: BarcodeFoodEntry) => void;
  isLoading: boolean;
} {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { mutate, isPending } = useMutation({
    mutationFn: (entry: BarcodeFoodEntry) => {
      if (!userId) throw new Error('Not authenticated');
      return insertBarcodeFoodLog(userId, entry);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.FOOD_LOGGED_BARCODE, { source: 'barcode' });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.todayLogs(userId, today),
        });
      }
    },
  });

  return {
    mutate,
    isLoading: isPending,
  };
}

// ---------------------------------------------------------------------------
// usePhotoFoodLog
// Orchestrates the photo capture → AI recognition → review flow.
// Fetches recent corrections to pass as AI context (food names only, Rule 2).
// Returns pendingResult to drive the review sheet visibility.
// ---------------------------------------------------------------------------
export function usePhotoFoodLog(): {
  recognize: (
    base64: string,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
    userComment?: string,
  ) => Promise<void>;
  pendingResult: RecognitionResult | null;
  clearPending: () => void;
  isLoading: boolean;
  error: string | null;
} {
  const [pendingResult, setPendingResult] = useState<RecognitionResult | null>(null);
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { recognize: recognizeRaw, isLoading, error } = usePhotoFoodRecognition();

  const recognize = useCallback(
    async (
      base64: string,
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
      userComment?: string,
    ) => {
      // Fetch recent corrections to improve AI accuracy (Rule 2: food names only)
      const corrections = userId ? await getRecentCorrections(userId) : [];
      const result = await recognizeRaw(base64, mimeType, corrections, userComment);
      if (result) {
        setPendingResult(result);
      }
    },
    [recognizeRaw, userId],
  );

  return {
    recognize,
    pendingResult,
    clearPending: () => setPendingResult(null),
    isLoading,
    error,
  };
}

// ---------------------------------------------------------------------------
// useConfirmPhotoLog
// Saves the confirmed food entry after the user reviews and edits the AI result.
// Also saves:
//   - a FoodCorrection if the food name was edited
//   - upserts user_food_defaults so repeat scans pre-fill with saved values
// ---------------------------------------------------------------------------
export function useConfirmPhotoLog(): {
  confirm: (entry: PhotoFoodEntry, originalAiName: string) => void;
  isLoading: boolean;
} {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      entry,
      originalAiName,
    }: {
      entry: PhotoFoodEntry;
      originalAiName: string;
    }) => {
      if (!userId) throw new Error('Not authenticated');

      // 1. Insert the food log entry
      await insertPhotoFoodLog(userId, entry);

      // 2. If the user edited the food name, save a correction for future AI context
      const nameChanged =
        originalAiName.toLowerCase().trim() !== entry.name.toLowerCase().trim();
      if (nameChanged) {
        const correction: FoodCorrection = {
          originalAiName,
          correctedName: entry.name,
          servingDescription: entry.servingDescription,
          proteinG: entry.proteinG,
          carbsG: entry.carbsG,
          fatG: entry.fatG,
          caloriesKcal: entry.caloriesKcal,
          fiberG: entry.fiberG,
        };
        // Non-blocking — failure is logged but does not throw
        await saveFoodCorrection(userId, correction);
      }

      // 3. Always upsert personal defaults with the confirmed values
      // Non-blocking — failure is logged but does not throw
      await upsertFoodDefault(userId, entry.name, entry);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.FOOD_LOGGED_PHOTO, { source: 'photo' });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.todayLogs(userId, today),
        });
      }
    },
  });

  return {
    confirm: (entry: PhotoFoodEntry, originalAiName: string) =>
      mutate({ entry, originalAiName }),
    isLoading: isPending,
  };
}

// ---------------------------------------------------------------------------
// useUserFoodDefault
// Looks up the user's saved personal defaults for a food name.
// Used by the photo review sheet to pre-fill fields for repeat foods.
// ---------------------------------------------------------------------------
export function useUserFoodDefault(foodNameKey: string): {
  defaults: PhotoFoodEntry | null;
  isLoading: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading } = useQuery({
    queryKey: foodLogKeys.foodDefault(userId ?? '', foodNameKey),
    queryFn: () => getFoodDefault(userId!, foodNameKey),
    enabled: !!userId && foodNameKey.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes — defaults don't change often
  });

  return {
    defaults: data ?? null,
    isLoading,
  };
}

// ---------------------------------------------------------------------------
// useBarcodeCorrectionLookup
// Fetches the user's saved correction for a given EAN (if any).
// Used by the scanner to pre-fill result fields with previously verified values.
// staleTime: Infinity — corrections only change when the user explicitly updates them.
// ---------------------------------------------------------------------------
export function useBarcodeCorrectionLookup(ean: string | null): {
  correction: BarcodeProduct | null;
  isLoading: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading } = useQuery({
    queryKey: ['barcode-correction', userId, ean],
    queryFn: () => fetchBarcodeCorrection(userId!, ean!),
    enabled: !!userId && ean !== null,
    staleTime: Infinity,
  });

  return { correction: data ?? null, isLoading };
}

// ---------------------------------------------------------------------------
// useSaveBarcodeCorrection
// Persists a user-verified correction for a barcode EAN.
// Invalidates the correction cache so future lookups reload.
// ---------------------------------------------------------------------------
export function useSaveBarcodeCorrection() {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: ({
      ean,
      product,
    }: {
      ean: string;
      product: Pick<BarcodeProduct, 'name' | 'proteinG' | 'fiberG' | 'caloriesKcal'>;
    }) => {
      if (!userId) throw new Error('Not authenticated');
      return saveBarcodeCorrection(userId, ean, product);
    },
    onSuccess: (_data, { ean }) => {
      queryClient.invalidateQueries({ queryKey: ['barcode-correction', userId, ean] });
    },
  });
}

// ---------------------------------------------------------------------------
// useDailyMacros
// Computes today's macro and micronutrient totals from all food log sources.
// Used by DailyMacroCard.
// ---------------------------------------------------------------------------
export function useDailyMacros(): {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  calories: number;
  b12Mcg: number;
  vitaminDIu: number;
  magnesiumMg: number;
  zincMg: number;
  hasMicronutrients: boolean;
  isLoading: boolean;
} {
  const { logs, isLoading } = useTodayFoodLogs();

  const totals = logs.reduce(
    (acc, log) => ({
      protein: acc.protein + log.proteinG,
      carbs: acc.carbs + (log.carbsG ?? 0),
      fat: acc.fat + (log.fatG ?? 0),
      fiber: acc.fiber + (log.fiberG ?? 0),
      calories: acc.calories + (log.caloriesKcal ?? 0),
      b12Mcg: acc.b12Mcg + (log.b12Mcg ?? 0),
      vitaminDIu: acc.vitaminDIu + (log.vitaminDIu ?? 0),
      magnesiumMg: acc.magnesiumMg + (log.magnesiumMg ?? 0),
      zincMg: acc.zincMg + (log.zincMg ?? 0),
      hasMicronutrients:
        acc.hasMicronutrients ||
        log.b12Mcg != null ||
        log.vitaminDIu != null ||
        log.magnesiumMg != null ||
        log.zincMg != null,
    }),
    {
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      calories: 0,
      b12Mcg: 0,
      vitaminDIu: 0,
      magnesiumMg: 0,
      zincMg: 0,
      hasMicronutrients: false,
    },
  );

  return { ...totals, isLoading };
}
