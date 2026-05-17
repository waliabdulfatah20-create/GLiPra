import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only runs against pure TypeScript files with zero React Native dependencies.
    // Component tests and anything importing from 'react-native' must use jest-expo.
    include: [
      'src/utils/**/*.test.ts',
      'src/features/**/calculator.test.ts',
    ],
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/**/*.ts',
        'src/features/**/calculator.ts',
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
