# Plan: SQLite Index Foundation

## Objective

Add the first rebuildable SQLite index for synthetic `.chron` archives.

The index should make archives queryable by GUI/core code later without making
SQLite the source of replay truth.

## Scope

In scope:

- create a small `@chronarium/indexer` package;
- initialize a local SQLite schema;
- index archive metadata from `manifest.json`;
- index timeline event envelopes from `timeline.jsonl`;
- index archive validation issues from the archive validator;
- add behavior tests using synthetic `.chron` packages.

Out of scope:

- GUI integration;
- long-running core runtime;
- SQLite migrations beyond schema version metadata;
- full-text search;
- media-track indexing;
- real capture state;
- real Chaturbate adapter work.

## Current Facts

- `packages/archive` can write synthetic `.chron` packages.
- `packages/archive` can read and validate `manifest.json` and `timeline.jsonl`.
- `node:sqlite` is available on the local Node.js runtime, but it currently
  emits an ExperimentalWarning.
- SQLite must remain a rebuildable index/cache, not the archive truth.

## Constraints

- Do not store secrets, cookies, headers, signed URLs, private room data, or
  real media.
- Keep index rows derived from archive facts.
- Keep the package boundary narrow so the SQLite binding can be swapped later.
- Do not connect to real sites.

## Execution Plan

1. Add `packages/indexer` package metadata and TypeScript config.
2. Define the first SQLite schema and schema metadata.
3. Add an API for opening the index, indexing one archive path, and querying
   archives/events/issues.
4. Add Vitest coverage using synthetic archives.
5. Update workspace config and docs.
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

- Created during A01 continuation after archive reader/validator landed.
- First schema will store archives, timeline events, and validation issues.
- Implemented `@chronarium/indexer`.
- Implemented `openChronariumIndex`, `indexArchiveFromPath`, archive queries,
  timeline event queries, and validation issue queries.
- Duplicate timeline event IDs are allowed in the index so invalid archives can
  still be indexed for diagnostics.
- The first implementation uses Node.js built-in `node:sqlite`, which emits an
  ExperimentalWarning in the local test runtime.
- `pnpm typecheck` passed.
- `pnpm test` passed 3 files and 12 tests.
- `pnpm build` passed.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Blockers

None currently.
