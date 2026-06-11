# Plan: Core Runtime Lifecycle Shell

## Objective

Turn the current core runtime contract into a minimal local runtime shell.

The runtime should be able to start, stop, report health, and expose the
existing core archive/index service after startup.

## Scope

In scope:

- implement `start`, `stop`, and `getHealth`;
- create local data and archive root directories on start;
- open and close the rebuildable SQLite index through `packages/indexer`;
- expose the core archive/index service from the running runtime;
- add lifecycle behavior tests.

Out of scope:

- Electron or React GUI;
- adapter process lifecycle;
- real livestream capture;
- cookies, headers, tokens, sessions, signed URLs, private room data, or real
  recordings;
- FFmpeg or real media processing;
- background scheduling or AI maintenance loops.

## Current Facts

- `packages/core` already has `createCoreArchiveIndexService`.
- `packages/indexer` owns SQLite open/query/close behavior.
- `packages/archive` owns archive read/validate behavior.
- `createCoreRuntimeContract` currently returns a skeleton that throws on
  `start` and `stop`.

## Constraints

- Keep this as a small local lifecycle shell.
- Do not start adapters or external tools.
- Do not duplicate archive or SQL logic in core.
- Keep runtime tests fixture-first and local-only.

## Execution Plan

1. Add this plan and update A01 context.
2. Implement the minimal runtime lifecycle.
3. Add runtime lifecycle tests.
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

- Created after commit `ea464a5`.
- Implemented `createCoreRuntime`.
- Kept `createCoreRuntimeContract` as a compatibility alias.
- Runtime startup creates `dataRoot` and `archiveRoot`.
- Runtime startup opens the rebuildable SQLite index and exposes the existing
  archive/index service.
- Runtime stop closes the SQLite index and clears service access.
- Runtime health now reports `not-started`, `running`, `stopped`, or `error`.
- Added lifecycle tests for pre-start health, service access guard, start,
  repeated start, archive reindex through runtime service, stop, repeated stop,
  and post-stop service access guard.
- `pnpm exec vitest run packages/core/tests`: passed 2 files and 4 tests.
- `pnpm typecheck` passed.
- `pnpm test` passed 5 files and 32 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build` passed.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Blockers

None currently.
