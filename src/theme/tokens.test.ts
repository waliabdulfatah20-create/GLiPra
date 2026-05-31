import { describe, expect, it } from 'vitest';

import { darkTokens, lightTokens } from './tokens';

describe('lightTokens', () => {
  it('primary is Direction B deep purple', () => {
    expect(lightTokens.colors.primary).toBe('#6d28d9');
  });
  it('background is warm cream', () => {
    expect(lightTokens.colors.background).toBe('#faf8f5');
  });
  it('isDark is false', () => {
    expect(lightTokens.isDark).toBe(false);
  });
});

describe('darkTokens', () => {
  it('background is deep purple-black', () => {
    expect(darkTokens.colors.background).toBe('#0d0920');
  });
  it('surface is dark purple card', () => {
    expect(darkTokens.colors.surface).toBe('#1e1533');
  });
  it('isDark is true', () => {
    expect(darkTokens.isDark).toBe(true);
  });
});

it('light and dark tokens have identical color key sets', () => {
  const lightKeys = Object.keys(lightTokens.colors).sort();
  const darkKeys = Object.keys(darkTokens.colors).sort();
  expect(lightKeys).toEqual(darkKeys);
});

describe('gradients', () => {
  it('light hero gradient starts with Direction B purple', () => {
    expect(lightTokens.gradients.hero[0]).toBe('#6d28d9');
  });
  it('light hero gradient ends at sky blue', () => {
    expect(lightTokens.gradients.hero[2]).toBe('#0284c7');
  });
  it('dark hero gradient starts with deep purple-black', () => {
    expect(darkTokens.gradients.hero[0]).toBe('#3b0764');
  });
  it('dark hero gradient has 3 stops', () => {
    expect(darkTokens.gradients.hero).toHaveLength(3);
  });
});
