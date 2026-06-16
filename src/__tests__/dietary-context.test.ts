import { describe, expect, it } from 'vitest';
import { buildDietaryContext } from '@/features/food-log/dietary-context';

describe('buildDietaryContext', () => {
  it('returns null for non-constraining patterns', () => {
    expect(buildDietaryContext('omnivore')).toBeNull();
    expect(buildDietaryContext('other')).toBeNull();
    expect(buildDietaryContext(null)).toBeNull();
    expect(buildDietaryContext(undefined)).toBeNull();
  });

  it('emits a constraining pattern', () => {
    expect(buildDietaryContext('vegetarian')).toEqual({ dietaryPattern: 'vegetarian' });
    expect(buildDietaryContext('vegan')).toEqual({ dietaryPattern: 'vegan' });
    expect(buildDietaryContext('pescatarian')).toEqual({ dietaryPattern: 'pescatarian' });
  });
});
