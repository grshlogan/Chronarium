# Plan: Archive Writer Timeline Invariants

## Objective

Move basic timeline correctness checks into the archive writer so Chronarium's
own `.chron` packages are harder to write incorrectly.

The validator should still diagnose corrupted, external, or manually crafted
archives, but the writer should not create avoidable timeline errors.

## Scope

In scope:

- require a manifest before appending timeline events;
- require timeline event `sessionId` to match the manifest session;
- require contiguous `sequence` values starting at `1`;
- reject duplicate `eventId` values within one writer session;
- reject appends after finalization;
- update behavior tests and invalid fixture tests.

Out of scope:

- recovery for existing partially written archives;
- reading writer state from existing archives;
- cross-process writer locking;
- media-track writes;
- real capture or adapter logic.

## Current Facts

- `packages/archive` already has a fixture-safe writer.
- `packages/archive` already has reader/validator diagnostics for bad
  timelines.
- `packages/indexer` can index invalid archives for diagnostics.
- Some invalid archive tests currently use writer paths and need to switch to
  manual fixture construction once writer invariants are enforced.

## Constraints

- Keep the writer local-only and fixture-safe.
- Do not remove validator diagnostics; writer invariants and validator
  diagnostics serve different lifecycle moments.
- Do not add real site logic or media IO.
- Keep public interfaces small.

## Execution Plan

1. Add writer tests for manifest-before-append, session match, sequence order,
   duplicate event IDs, and appends after finalize.
2. Enforce append-time invariants in `packages/archive/src/writer.ts`.
3. Update indexer invalid archive tests to use manual bad fixtures.
4. Update docs and handoff files.
5. Run typecheck, tests, build, diff, whitespace, and JSON parse checks.

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

- Created after pushing commit `31c23ec`.
- Added writer behavior tests for manifest-before-append, session mismatch,
  sequence gaps, duplicate event IDs, and appends after finalization.
- Enforced append-time invariants in `packages/archive/src/writer.ts`.
- Updated indexer invalid archive tests to use manual bad fixtures instead of
  writer-generated bad archives.
- `pnpm typecheck` passed.
- Targeted archive/indexer tests passed.
- `pnpm test` passed 3 files and 17 tests.
- `pnpm build` passed.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Blockers

None currently.
