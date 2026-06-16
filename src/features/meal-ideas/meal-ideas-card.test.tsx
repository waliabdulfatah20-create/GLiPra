import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { MealIdeasCard } from './meal-ideas-card';

// Note: the test i18n returns translation KEYS, not resolved copy, so we assert
// prop-driven content (idea names, note) plus the presence of the title/protein/
// disclaimer elements by their keys.

const result = {
  ideas: [
    { name: 'Greek yogurt bowl', description: 'Creamy and protein-dense.', approxProteinG: 18 },
    { name: 'Scrambled eggs', description: 'Soft and gentle.', approxProteinG: 14 },
  ],
  note: 'Adjust portions to your appetite.',
};

describe('mealIdeasCard', () => {
  afterEach(cleanup);

  it('renders each idea name, description, and a protein pill per idea', () => {
    render(<MealIdeasCard result={result} />);
    expect(screen.getByText('Greek yogurt bowl')).toBeTruthy();
    expect(screen.getByText('Scrambled eggs')).toBeTruthy();
    expect(screen.getByText('Creamy and protein-dense.')).toBeTruthy();
    expect(screen.getByText(/~18/)).toBeTruthy();
    expect(screen.getByText(/~14/)).toBeTruthy();
  });

  it('renders the note and the Tier-1 disclaimer element', () => {
    render(<MealIdeasCard result={result} />);
    expect(screen.getByText('Adjust portions to your appetite.')).toBeTruthy();
    expect(screen.getByText('coach.meal_ideas_disclaimer')).toBeTruthy();
  });
});
