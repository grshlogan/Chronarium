# Plan: Indexer Rebuild And Query Contracts

## Objective

Make the first SQLite indexer contract clearer around rebuild, removal, clear,
and filtered query behavior.

The index remains a rebuildable cache derived from `.chron` archives, not the
source of replay truth.

## Scope

In scope:

- add an explicit `reindexArchiveFromPath` API;
- add archive removal by archive ID or archive root path;
- add a clear-all index API;
- add filtered archive, timeline event, and validation issue queries;
- add behavior tests for replacement semantics and filtered queries.

Out of scope:

- core runtime integration;
- GUI integration;
- long-running file watchers;
- full-text search;
- SQLite migrations beyond the current schema metadata;
- real media or real site capture.

## Current Facts

- `packages/indexer` can index one synthetic `.chron` package.
- Existing `indexArchiveFromPath` already deletes by archive ID or root path
  before insert, but that behavior is not explicit in the public contract.
- SQLite uses Node.js built-in `node:sqlite`, which is currently experimental
  in the local runtime.

## Constraints

- Keep SQLite rows derived from archive facts and validator diagnostics.
- Do not store secrets, cookies, signed URLs, real media, or personal data.
- Keep query construction bounded and parameterized.
- Keep the binding behind `@chronarium/indexer`.

## Execution Plan

1. Add public query/removal types.
2. Add `reindexArchiveFromPath`, `removeArchiveFromIndex`, and `clearIndex`.
3. Extend list APIs with safe filters.
4. Add behavior tests for reindex replacement, removal, clearing, and filters.
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

- Created after pushing commit `e891673`.
- Implemented `reindexArchiveFromPath`.
- Implemented `removeArchiveFromIndex`.
- Implemented `clearIndex`.
- Added filtered archive, timeline event, and validation issue queries.
- Added behavior tests for replacement, removal, clearing, and filters.
- `pnpm typecheck` passed.
- `pnpm test` passed 3 files and 21 tests.
- `pnpm build` passed.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Blockers

None currently.
