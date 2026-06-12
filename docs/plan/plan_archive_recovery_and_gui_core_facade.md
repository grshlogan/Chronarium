# Archive Recovery And GUI Core Facade Plan

## Objective

Move Chronarium toward the first usable GUI-era shape without connecting to
real livestream sites:

- add report-only archive recovery inspection;
- expose a minimal core facade that a future GUI can call safely.

## Scope

In scope:

- `packages/archive` read-only `inspectArchiveRecovery` API;
- recovery report types for common interrupted-write states;
- synthetic corrupted archive tests;
- `packages/core` GUI-facing service facade over health, archive/index,
  maintenance, and recovery inspection;
- core tests for the facade;
- docs and A01 context updates.

Out of scope:

- repairing archives;
- deleting, moving, rewriting, or quarantining archive files;
- real media segment IO;
- real site capture;
- Electron, React, preload, or IPC implementation;
- AI calls or automated repair.

## Current Facts

- `packages/archive` can validate/read `.chron` packages but does not have
  recovery-specific inspection yet.
- `packages/core` has runtime lifecycle, archive/index service, and
  maintenance inspector.
- The future GUI needs one narrow core-facing facade instead of reaching into
  many package internals.

## Execution Plan

1. Add archive recovery report types and a read-only inspector.
2. Detect missing/bad manifest through validator results.
3. Detect truncated final timeline line via validator results.
4. Detect unfinalized manifest counts, orphan temporary JSON files, undeclared
   track directories, and manifest-declared missing track metadata.
5. Add archive tests with synthetic corrupted archives.
6. Add a `createCoreGuiService` facade in `packages/core`.
7. Cover the facade with tests.
8. Update docs and A01 context.

## Verification

- `pnpm exec vitest run packages/archive/tests`
- `pnpm exec vitest run packages/core/tests`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- trailing whitespace scan
- JSON/package config parse scan

## Progress / Decisions

- This is A01 work.
- The first recovery implementation is report-only and must not repair files.
- The first GUI core facade is in core only; no Electron app exists yet.
