import { describe, expect, it } from 'vitest';
import { isDevForcePro } from '@/features/subscription/use-subscription';

// B7 regression guard: Pro is force-enabled ONLY in development builds, so a
// production/preview build can never grant Pro for free. Keyed on
// EXPO_PUBLIC_APP_ENV (locked per EAS build profile).
describe('isDevForcePro', () => {
  it('forces Pro only when the app env is development', () => {
    expect(isDevForcePro('development')).toBe(true);
  });

  it('does NOT force Pro in production, preview, or when unset', () => {
    expect(isDevForcePro('production')).toBe(false);
    expect(isDevForcePro('preview')).toBe(false);
    expect(isDevForcePro(undefined)).toBe(false);
    expect(isDevForcePro('staging')).toBe(false);
  });
});
