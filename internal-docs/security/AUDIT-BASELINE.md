# Dependency Audit Baseline

**Date:** 2026-05-17
**Project:** DosePath (Obytes v9.0.0 / Expo SDK 54 scaffold)
**Tool:** `pnpm audit --json`

## Baseline Snapshot

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 42 |
| Moderate | 26 |
| Low | 4 |
| **Total** | **72** |

## Named High-Severity Findings

All in **development-only** transitive dependencies (do not ship in production bundles):

- `tar` — hardlink escape
- `minimatch` — ReDoS
- `lodash` — prototype pollution (moderate)
- `@isaacs/brace-expansion` — DoS

## Why We Are Proceeding

1. Every finding is in transitive dev tooling (Expo CLI internals, ESLint plugins, build chain) — none reach the production bundle.
2. These are the ambient state of the Expo SDK 54 ecosystem at this snapshot.
3. Most lack upstream fixes today; they will trickle in via Expo / Obytes minor releases.

## Re-Audit Cadence

- **Monthly:** Run `pnpm audit` and update this file.
- **After every dep bump:** Run `pnpm audit` and check delta.
- **Before any production release:** Verify all *production* deps (not devDeps) are clean.

## Production-Only Audit Command

To check only what ships to users:

```powershell
pnpm audit --prod
```

This must show **0 high and 0 critical** before any App Store / Play Store submission.
