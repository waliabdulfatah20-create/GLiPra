import { describe, expect, test } from 'vitest';

import { darkTokens, lightTokens } from './tokens';

describe('lightTokens', () => {
  test('primary is Direction B deep purple', () => {
    expect(lightTokens.colors.primary).toBe('#6d28d9');
  });
  test('background is warm cream', () => {
    expect(lightTokens.colors.background).toBe('#faf8f5');
  });
  test('isDark is false', () => {
    expect(lightTokens.isDark).toBe(false);
  });
});

describe('darkTokens', () => {
  test('background is deep purple-black', () => {
    expect(darkTokens.colors.background).toBe('#0d0920');
  });
  test('surface is dark purple card', () => {
    expect(darkTokens.colors.surface).toBe('#1e1533');
  });
  test('isDark is true', () => {
    expect(darkTokens.isDark).toBe(true);
  });
});

test('light and dark tokens have identical color key sets', () => {
  const lightKeys = Object.keys(lightTokens.colors).sort();
  const darkKeys = Object.keys(darkTokens.colors).sort();
  expect(lightKeys).toEqual(darkKeys);
});
