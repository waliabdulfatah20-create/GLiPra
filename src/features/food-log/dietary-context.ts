// Scan-cascade item C: build the anonymized dietary context passed to the
// recognize-food AI prompt so it biases food identification toward how the user
// actually eats (a vegetarian's patty is likely plant-based). Rule 2: a dietary
// pattern is a categorical preference, never PII.
//
// Allergens are intentionally NOT collected or sent: the app makes no
// allergen-avoidance safety promise (an AI photo estimate cannot be relied on
// for allergy safety), so there is no allergen field here.

/** Diet patterns that actually constrain what a food is likely to be. */
const CONSTRAINING_PATTERNS = new Set(['vegetarian', 'vegan', 'pescatarian']);

export type DietaryContext = {
  /** Only ever a constraining pattern — omnivore/other are dropped. */
  dietaryPattern?: 'vegetarian' | 'vegan' | 'pescatarian';
};

/**
 * Build the dietary context to send with a photo scan, or null when there is
 * nothing useful to send. Only constraining diets are emitted (omnivore / other
 * / null add no identification signal and waste prompt tokens).
 */
export function buildDietaryContext(
  dietaryPattern: string | null | undefined,
): DietaryContext | null {
  if (dietaryPattern != null && CONSTRAINING_PATTERNS.has(dietaryPattern))
    return { dietaryPattern: dietaryPattern as DietaryContext['dietaryPattern'] };

  return null;
}
