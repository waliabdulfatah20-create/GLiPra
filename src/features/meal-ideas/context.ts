// Pure builder for the anonymized meal-ideas request (Rule 2: no PII, no allergens).
// Keeping the transform pure makes it unit-testable and keeps the hook thin.

import { buildDietaryContext } from '@/features/food-log/dietary-context';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';

export type MealIdea = {
  name: string;
  description: string;
  approxProteinG: number;
};

export type MealIdeasResult = {
  ideas: MealIdea[];
  note: string;
};

/** Anonymized payload sent to the generate-meal-ideas edge function. */
export type MealIdeasRequest = {
  mealType: MealType;
  proteinFloorG?: number;
  proteinRemainingG?: number;
  phase?: string;
  nauseaScore?: number;
  dietaryPattern?: 'vegetarian' | 'vegan' | 'pescatarian';
  hasKidneyDisease?: boolean;
  language: 'en' | 'es';
};

export type MealIdeasContextInput = {
  mealType: MealType;
  proteinFloorG: number | null | undefined;
  proteinConsumedG: number | null | undefined;
  phaseLabel: string | null | undefined;
  nauseaScore: number | null | undefined;
  dietaryPattern: string | null | undefined;
  hasKidneyDisease: boolean | null | undefined;
  language: 'en' | 'es';
};

/**
 * Map today's anonymized state into the meal-ideas edge request. Drops anything
 * not useful or not safe to send: omnivore/null diet (only constraining diets
 * carry signal), out-of-range nausea, a non-positive protein floor. Never
 * includes identity, weight, or allergens.
 */
export function buildMealIdeasContext(input: MealIdeasContextInput): MealIdeasRequest {
  const request: MealIdeasRequest = {
    mealType: input.mealType,
    language: input.language,
  };

  if (typeof input.proteinFloorG === 'number' && input.proteinFloorG > 0) {
    request.proteinFloorG = Math.round(input.proteinFloorG);
    const consumed = typeof input.proteinConsumedG === 'number' ? input.proteinConsumedG : 0;
    request.proteinRemainingG = Math.max(0, Math.round(input.proteinFloorG - consumed));
  }

  if (input.phaseLabel)
    request.phase = input.phaseLabel;

  if (
    typeof input.nauseaScore === 'number'
    && input.nauseaScore >= 1
    && input.nauseaScore <= 5
  ) {
    request.nauseaScore = input.nauseaScore;
  }

  const diet = buildDietaryContext(input.dietaryPattern);
  if (diet?.dietaryPattern)
    request.dietaryPattern = diet.dietaryPattern;

  if (input.hasKidneyDisease)
    request.hasKidneyDisease = true;

  return request;
}
