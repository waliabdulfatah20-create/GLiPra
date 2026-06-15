import { describe, expect, it } from 'vitest';
import {
  CONTENT_CARDS,
  getActiveCards,
  getActiveCardsForRoute,
} from '@/features/content-cards/data';

const ORAL_CARD_ID = 'oral-empty-stomach';
// A known universal (route-less) card that must show for every route.
const UNIVERSAL_CARD_ID = 'protein-timing-101';

describe('getActiveCardsForRoute', () => {
  it('shows the oral technique card only to oral users', () => {
    const oralIds = getActiveCardsForRoute('oral').map(c => c.id);
    const injectionIds = getActiveCardsForRoute('injection').map(c => c.id);

    expect(oralIds).toContain(ORAL_CARD_ID);
    expect(injectionIds).not.toContain(ORAL_CARD_ID);
  });

  it('shows universal (route-less) cards to every route', () => {
    expect(getActiveCardsForRoute('oral').map(c => c.id)).toContain(UNIVERSAL_CARD_ID);
    expect(getActiveCardsForRoute('injection').map(c => c.id)).toContain(UNIVERSAL_CARD_ID);
  });

  it('returns cards sorted by sortOrder', () => {
    const orders = getActiveCardsForRoute('injection').map(c => c.sortOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('only ever drops route-mismatched cards (never universal ones)', () => {
    const injection = getActiveCardsForRoute('injection');
    expect(injection.every(c => !c.route || c.route === 'injection')).toBe(true);
  });
});

describe('oral technique card', () => {
  const card = getActiveCards().find(c => c.id === ORAL_CARD_ID);

  it('exists and is route-tagged for oral', () => {
    expect(card).toBeDefined();
    expect(card?.route).toBe('oral');
  });

  it('is a tier-1 clinical card (drives the dual disclaimer)', () => {
    expect(card?.tier).toBe(1);
  });

  it('has non-empty body and key takeaway', () => {
    expect((card?.body ?? '').length).toBeGreaterThan(50);
    expect((card?.keyTakeaway ?? '').length).toBeGreaterThan(10);
  });

  it('contains no em dashes in user-facing copy', () => {
    const copy = `${card?.title} ${card?.keyTakeaway} ${card?.body}`;
    expect(copy).not.toContain('—');
  });
});

describe('goal-weight nutrition card', () => {
  const card = getActiveCards().find(c => c.id === 'goal-weight-nutrition');

  it('exists as a universal tier-2 education card', () => {
    expect(card).toBeDefined();
    expect(card?.route).toBeUndefined();
    expect(card?.tier).toBe(2);
    expect(card?.cardType).toBe('education');
  });

  it('no card claims the deleted "maintenance mode" feature', () => {
    const allCopy = CONTENT_CARDS
      .map(c => `${c.title} ${c.keyTakeaway} ${c.body}`)
      .join(' ')
      .toLowerCase();
    expect(allCopy).not.toContain('maintenance mode');
  });
});

describe('content card invariants', () => {
  it('has unique ids', () => {
    const ids = CONTENT_CARDS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique sortOrder values', () => {
    const orders = CONTENT_CARDS.map(c => c.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('only uses tier 1 or 2', () => {
    expect(CONTENT_CARDS.every(c => c.tier === 1 || c.tier === 2)).toBe(true);
  });
});
