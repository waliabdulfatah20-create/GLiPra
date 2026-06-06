// Scan-cascade item C: build the anonymized dietary context passed to the
// recognize-food AI prompt so it biases food identification toward how the user
// actually eats (a vegetarian's patty is likely plant-based). Rule 2: a dietary
// pattern + allergen flags are categorical preferences, never PII.

/** Diet patterns that actually constrain what a food is likely to be. */
const CONSTRAINING_PATTERNS = new Set(['vegetarian', 'vegan', 'pescatarian']);

export type DietaryContext = {
  /** Only ever a constraining pattern — omnivore/other are dropped. */
  dietaryPattern?: 'vegetarian' | 'vegan' | 'pescatarian';
  /** Non-empty allergen list, if any. */
  allergens?: string[];
};

/**
 * Build the dietary context to send with a photo scan, or null when there is
 * nothing useful to send. Only constraining diets are emitted (omnivore / other
 * / null add no identification signal and waste prompt tokens), and allergens
 * are included only when the list is non-empty.
 */
export function buildDietaryContext(
  dietaryPattern: string | null | undefined,
  allergens: string[] | null | undefined,
): DietaryContext | null {
  const context: DietaryContext = {};

  if (dietaryPattern != null && CONSTRAINING_PATTERNS.has(dietaryPattern))
    context.dietaryPattern = dietaryPattern as DietaryContext['dietaryPattern'];

  const cleanedAllergens = (allergens ?? [])
    .map(a => a.trim())
    .filter(a => a.length > 0);
  if (cleanedAllergens.length > 0)
    context.allergens = cleanedAllergens;

  return context.dietaryPattern || context.allergens ? context : null;
}
