# Plan: Core Archive Index Service

## Objective

Add the first small `packages/core` service that connects archive validation,
archive reading, and SQLite indexing behind one core-facing API.

This makes `core` start owning local archive/index coordination without adding
GUI, adapters, real capture, or real media processing.

## Scope

In scope:

- add a core archive index service API;
- validate a `.chron` archive through `packages/archive`;
- read a valid `.chron` archive through `packages/archive`;
- reindex an archive through `packages/indexer`;
- expose archive, timeline event, and validation issue queries through core;
- add fixture-driven behavior tests.

Out of scope:

- Electron or React GUI;
- real core task scheduler;
- adapter process lifecycle;
- real Chaturbate network behavior;
- cookies, headers, tokens, sessions, signed URLs, private room data, or real
  recordings;
- real media segment writing or FFmpeg integration;
- SQLite migrations beyond the existing indexer package.

## Current Facts

- `packages/archive` can write, read, and validate synthetic `.chron` archives.
- `packages/indexer` can reindex synthetic `.chron` archives and query derived
  rows.
- `packages/core` is currently only a runtime contract skeleton.

## Constraints

- Keep `.chron` files as replay truth.
- Keep SQLite as a rebuildable derived index.
- Keep core APIs narrow and fixture-first.
- Do not duplicate archive validation or SQL logic in core.

## Execution Plan

1. Add this plan and update A01 conversation context.
2. Add `packages/core` dependencies and project references.
3. Implement a small core archive index service.
4. Add behavior tests with synthetic archives.
5. Update docs and handoff files.
6. Run typecheck, tests, build, diff, whitespace, and JSON parse checks.

## Verification

Expected commands:

```powershell
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run trailing whitespace and JSON/package config parse scans.

## Progress / Decisions

- Created after commit `a37ad49`.
- Added `createCoreArchiveIndexService` in `packages/core`.
- Core service now delegates archive validation and reading to
  `packages/archive`.
- Core service now delegates reindexing and query APIs to `packages/indexer`.
- Added fixture-driven core behavior tests for a valid synthetic archive and a
  track metadata validation failure.
- Updated core package dependencies and project references.
- `pnpm exec vitest run packages/core/tests`: passed 1 file and 2 tests.
- First `pnpm typecheck` failed because tests were included in the package
  `tsconfig` while `rootDir` was `src`; fixed by keeping package typecheck on
  `src` only, matching the existing package pattern.
- `pnpm typecheck` passed.
- `pnpm test` passed 4 files and 30 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build` passed.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| Core package typecheck failed because tests were included while `rootDir` was `src`. | First `pnpm typecheck`. | Kept `packages/core/tsconfig.json` focused on `src`; tests stay under Vitest. |
| Untracked generated files appeared under package source/test folders after check runs. | Status scans after targeted and full checks. | Removed only the explicit generated files; no source files were removed. |

## Blockers

None currently.
