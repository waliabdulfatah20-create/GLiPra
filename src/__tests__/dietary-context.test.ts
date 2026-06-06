import { describe, expect, it } from 'vitest';
import { buildDietaryContext } from '@/features/food-log/dietary-context';

describe('buildDietaryContext', () => {
  it('returns null for non-constraining patterns', () => {
    expect(buildDietaryContext('omnivore', null)).toBeNull();
    expect(buildDietaryContext('other', null)).toBeNull();
    expect(buildDietaryContext(null, null)).toBeNull();
    expect(buildDietaryContext(undefined, undefined)).toBeNull();
  });

  it('emits a constraining pattern', () => {
    expect(buildDietaryContext('vegetarian', null)).toEqual({ dietaryPattern: 'vegetarian' });
    expect(buildDietaryContext('vegan', null)).toEqual({ dietaryPattern: 'vegan' });
    expect(buildDietaryContext('pescatarian', null)).toEqual({ dietaryPattern: 'pescatarian' });
  });

  it('includes non-empty allergens alongside the pattern', () => {
    expect(buildDietaryContext('vegan', ['nuts', 'soy'])).toEqual({
      dietaryPattern: 'vegan',
      allergens: ['nuts', 'soy'],
    });
  });

  it('emits allergens even when the pattern is non-constraining', () => {
    expect(buildDietaryContext('omnivore', ['shellfish'])).toEqual({ allergens: ['shellfish'] });
  });

  it('drops empty / whitespace-only allergens', () => {
    expect(buildDietaryContext('omnivore', ['', '  '])).toBeNull();
    expect(buildDietaryContext('vegetarian', ['', ' dairy '])).toEqual({
      dietaryPattern: 'vegetarian',
      allergens: ['dairy'],
    });
  });

  it('returns null when nothing useful is present', () => {
    expect(buildDietaryContext('omnivore', [])).toBeNull();
  });
});
