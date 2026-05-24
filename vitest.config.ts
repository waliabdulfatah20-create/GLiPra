import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // Only runs against pure TypeScript files with zero React Native dependencies.
    // Component tests and anything importing from 'react-native' must use jest-expo.
    include: [
      'src/utils/**/*.test.ts',
      'src/features/**/calculator.test.ts',
      'src/features/**/readiness-calculator.test.ts',
      'src/features/safety/**/*.test.ts',
      'src/features/medication-level/**/*.test.ts',
    ],
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/**/*.ts',
        'src/features/**/calculator.ts',
        'src/features/**/readiness-calculator.ts',
        'src/features/safety/**/*.ts',
        'src/features/medication-level/**/*.ts',
      ],
      exclude: [
        'src/features/safety/**/*.test.ts',
        // React hooks are tested via jest-expo (component tests), not vitest.
        // Including them here falsely deflates Rule 4's safety-code threshold.
        '**/hooks.ts',
      ],
      thresholds: {
        // Rule 4 from CLAUDE.md: safety code needs 90%+ coverage
        lines: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
});
