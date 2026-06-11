# Plan: Archive Reader And Validator

## Objective

Add the first fixture-safe archive reader and validator for synthetic `.chron`
packages.

The goal is to make archives readable and checkable before adding SQLite,
replay UI, real media writing, or real site adapters.

## Scope

In scope:

- read `manifest.json`;
- read `timeline.jsonl`;
- validate records with existing runtime schemas;
- expose parsed archive contents through a small TypeScript interface;
- report consistency diagnostics for the timeline;
- add Vitest behavior tests for valid and invalid synthetic archives.

Out of scope:

- real media track reading;
- archive migration;
- recovery or quarantine directories;
- SQLite indexing;
- FFmpeg/ffprobe invocation;
- real Chaturbate network capture;
- cookies, headers, tokens, sessions, or account handling.

## Current Facts

- `packages/archive` already has `layout.ts` and `writer.ts`.
- The writer creates a package root, writes `manifest.json`, appends
  `timeline.jsonl`, and finalizes manifest timeline metadata.
- `packages/schemas` provides parsers for `ArchiveManifest` and
  `TimelineEventEnvelope`.
- `packages/testkit` provides synthetic session, timeline event, and archive
  manifest helpers.

## Constraints

- Keep implementation local-only and fixture-safe.
- Reject unsafe archive-relative paths.
- Do not silently accept invalid JSON Lines records.
- Do not infer real capture behavior from synthetic tests.
- Keep docs synchronized with actual implementation.

## Execution Plan

1. Add a reader that loads and parses manifest plus timeline JSONL.
2. Add a validator that checks manifest/timeline consistency.
3. Add behavior tests for a valid synthetic archive.
4. Add behavior tests for invalid JSONL, duplicate event IDs, sequence gaps,
   unsafe paths, manifest event-count mismatch, and last-sequence mismatch.
5. Update docs and handoff files.
6. Run the minimal safe verification suite.

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

- Created during A01 continuation.
- Reader/validator will use existing schemas rather than duplicate shape checks.
- Implemented `readFileArchive` as the strict read API.
- Implemented `validateFileArchive` as the diagnostic report API.
- Writer now creates an empty timeline file when writing a manifest, so a
  manifest-only package can be read as a valid empty timeline.
- Added behavior tests for valid archives, manifest-only archives, invalid
  JSONL, duplicate event IDs, sequence gaps, event-count mismatch,
  last-sequence mismatch, and unsafe manifest paths.
- `pnpm typecheck` passed.
- `pnpm test` passed 2 files and 9 tests.
- `pnpm build` passed.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Blockers

None currently.
