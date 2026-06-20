// React Query hooks for the food-log feature.

import type { BarcodeProduct } from './barcode-lookup';
import type { SeededFood } from './food-search';
import type { RecognitionResult } from './photo-recognition';
import type { RecentFood } from './recent-foods';
import type { BarcodeFoodEntry, DatabaseFoodEntry, FoodCorrection, FoodLogEntry, ManualFoodEntry, PhotoFoodEntry, SupplementEntry } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

import { useCallback, useState } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { analytics, EVENTS } from '@/lib/analytics';
import {
  fetchFoodLogsInRange,
  fetchTodayFoodLogs,
  getFoodDefault,
  getRecentCorrections,
  getUserDietaryContext,
  insertBarcodeFoodLog,
  insertDatabaseFoodLog,
  insertFoodLog,
  insertPhotoFoodLog,
  insertSupplementLog,
  relogFoodEntry,
  saveFoodCorrection,
  searchFoods,
  upsertFoodDefault,
} from './api';
import { fetchBarcodeCorrection, saveBarcodeCorrection } from './barcode-corrections';
import { usePhotoFoodRecognition } from './photo-recognition';
import { deriveRecentFoods } from './recent-foods';

// Days of history scanned to build the Recent Foods quick-add list.
const RECENT_FOODS_WINDOW_DAYS = 30;

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
const foodLogKeys = {
  todayLogs: (userId: string, today: string) =>
    ['food-logs', 'today', userId, today] as const,
  foodDefault: (userId: string, foodNameKey: string) =>
    ['food-defaults', userId, foodNameKey] as const,
  recent: (userId: string) =>
    ['food-logs', 'recent', userId] as const,
  // Seeded foods table is global (no userId) and static.
  foodSearch: (query: string) =>
    ['foods', 'search', query] as const,
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
// useRecentFoods
// Builds the one-tap quick-add list from a 30-day history window. Free, no AI.
// Dedupes + ranks via deriveRecentFoods (frequency desc, recency tiebreak).
// ---------------------------------------------------------------------------
export function useRecentFoods(): {
  items: RecentFood[];
  isLoading: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = new Date();
  const endDate = format(today, 'yyyy-MM-dd');
  const startDate = format(subDays(today, RECENT_FOODS_WINDOW_DAYS), 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: foodLogKeys.recent(userId ?? ''),
    queryFn: async () => {
      const logs = await fetchFoodLogsInRange(userId!, startDate, endDate);
      return deriveRecentFoods(logs);
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute — refreshed on any food-log mutation anyway
  });

  return {
    items: data ?? [],
    isLoading,
  };
}

// ---------------------------------------------------------------------------
// useRelogFoodEntry
// One-tap re-log of a Recent Food. Inserts a fresh row at `now`, preserving the
// food's macros + source. Invalidates today's logs AND the recent list.
// Always free — no paywall, no AI.
// ---------------------------------------------------------------------------
export function useRelogFoodEntry(): {
  mutate: (item: RecentFood) => void;
  isLoading: boolean;
} {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { mutate, isPending } = useMutation({
    mutationFn: (item: RecentFood) => {
      if (!userId)
        throw new Error('Not authenticated');
      return relogFoodEntry(userId, item);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.FOOD_LOGGED_RELOG, { source: 'relog' });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.todayLogs(userId, today),
        });
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.recent(userId),
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
      if (!userId)
        throw new Error('Not authenticated');
      return insertFoodLog(userId, entry, 'manual', null);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.FOOD_LOGGED_MANUAL, { source: 'manual' });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.todayLogs(userId, today),
        });
        // Keep Recent Foods fresh so a just-logged food bubbles into the
        // quick-add row without waiting for staleTime.
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.recent(userId),
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
// useSearchFoods (Cascade D)
// Debounce upstream (the sheet debounces the query string); the seeded table
// is static so results cache forever.
// ---------------------------------------------------------------------------
export function useSearchFoods(query: string): {
  results: SeededFood[];
  isLoading: boolean;
} {
  const trimmed = query.trim();

  const { data, isLoading } = useQuery({
    queryKey: foodLogKeys.foodSearch(trimmed),
    queryFn: () => searchFoods(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: Infinity,
  });

  return {
    results: data ?? [],
    isLoading: isLoading && trimmed.length >= 2,
  };
}

// ---------------------------------------------------------------------------
// useInsertDatabaseFoodLog (Cascade D)
// Inserts a food log entry sourced from the seeded foods table.
// Always free — zero AI cost.
// ---------------------------------------------------------------------------
export function useInsertDatabaseFoodLog(): {
  mutate: (entry: DatabaseFoodEntry) => void;
  isLoading: boolean;
} {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { mutate, isPending } = useMutation({
    mutationFn: (entry: DatabaseFoodEntry) => {
      if (!userId)
        throw new Error('Not authenticated');
      return insertDatabaseFoodLog(userId, entry);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.FOOD_LOGGED_DATABASE, { source: 'database' });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.todayLogs(userId, today),
        });
        // Keep Recent Foods fresh so a just-logged food bubbles into the
        // quick-add row without waiting for staleTime.
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.recent(userId),
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
// useInsertSupplementLog
// Inserts a per-nutrient supplement (source 'supplement'). Always free.
// Invalidates today's logs so the micronutrient totals + watch card refresh.
// ---------------------------------------------------------------------------
export function useInsertSupplementLog(): {
  mutate: (entry: SupplementEntry) => void;
  isLoading: boolean;
} {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const today = format(new Date(), 'yyyy-MM-dd');

  const { mutate, isPending } = useMutation({
    mutationFn: (entry: SupplementEntry) => {
      if (!userId)
        throw new Error('Not authenticated');
      return insertSupplementLog(userId, entry);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.SUPPLEMENT_LOGGED, { source: 'supplement' });
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
      if (!userId)
        throw new Error('Not authenticated');
      return insertBarcodeFoodLog(userId, entry);
    },
    onSuccess: () => {
      analytics.capture(EVENTS.FOOD_LOGGED_BARCODE, { source: 'barcode' });
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.todayLogs(userId, today),
        });
        // Keep Recent Foods fresh so a just-logged food bubbles into the
        // quick-add row without waiting for staleTime.
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.recent(userId),
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
    signal?: AbortSignal,
  ) => Promise<RecognitionResult | null>;
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
      signal?: AbortSignal,
    ): Promise<RecognitionResult | null> => {
      // Fetch recent corrections + dietary context to improve AI accuracy.
      // Rule 2: food names + categorical dietary prefs only — never user identity.
      const [corrections, dietaryContext] = userId
        ? await Promise.all([
            getRecentCorrections(userId),
            getUserDietaryContext(userId),
          ])
        : [[], null];
      const result = await recognizeRaw(
        base64,
        mimeType,
        corrections,
        userComment,
        dietaryContext,
        signal,
      );
      if (result) {
        setPendingResult(result);
      }
      return result;
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
      if (!userId)
        throw new Error('Not authenticated');

      // 1. Insert the food log entry
      await insertPhotoFoodLog(userId, entry);

      // 2. If the user edited the food name, save a correction for future AI context
      const nameChanged
        = originalAiName.toLowerCase().trim() !== entry.name.toLowerCase().trim();
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
        // Keep Recent Foods fresh so a just-logged food bubbles into the
        // quick-add row without waiting for staleTime.
        queryClient.invalidateQueries({
          queryKey: foodLogKeys.recent(userId),
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
      if (!userId)
        throw new Error('Not authenticated');
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
  ironMg: number;
  calciumMg: number;
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
      ironMg: acc.ironMg + (log.ironMg ?? 0),
      calciumMg: acc.calciumMg + (log.calciumMg ?? 0),
      hasMicronutrients:
        acc.hasMicronutrients
        || log.b12Mcg != null
        || log.vitaminDIu != null
        || log.magnesiumMg != null
        || log.zincMg != null
        || log.ironMg != null
        || log.calciumMg != null,
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
      ironMg: 0,
      calciumMg: 0,
      hasMicronutrients: false,
    },
  );

  return { ...totals, isLoading };
}
