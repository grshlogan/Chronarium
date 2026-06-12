# Plan: Chaturbate Fixture Archive Flow

## Objective

Verify that the offline Chaturbate split audio/video fixture can become a
valid synthetic `.chron` archive and can be consumed by the archive reader,
validator, and SQLite indexer.

This closes the first offline path:

```text
CB-like split A/V fixture
  -> media tracks and timeline facts
  -> .chron archive
  -> archive reader / validator
  -> SQLite indexer queries
```

## Scope

In scope:

- write the existing synthetic Chaturbate split-track fixture into a temporary
  `.chron` package during tests;
- write two media tracks to `tracks/<track-id>/track.json`;
- append fixture timeline facts to `timeline.jsonl`;
- validate and read the package;
- index the package into a temporary SQLite database;
- query indexed timeline events by event type.

Out of scope:

- real Chaturbate requests;
- real media segments;
- downloader integration;
- FFmpeg / ffprobe integration;
- account, cookie, header, token, private room, or session handling;
- upload or retention policy work.

## Current Facts

- `packages/adapters/chaturbate` can parse the synthetic split-track fixture
  into media tracks and timeline facts.
- `packages/archive` can write, read, and validate synthetic `.chron`
  packages with media track metadata.
- `packages/indexer` can derive archive and timeline rows from a `.chron`
  package.

## Verification

Expected commands:

```powershell
pnpm exec vitest run packages/adapters/chaturbate/tests
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run trailing whitespace and JSON parse scans.

## Progress / Decisions

- Plan created after commit `ac67e42`.
- Added `splitTrackArchiveFlow.test.ts`.
- The test writes the split-track fixture into a synthetic `.chron` archive.
- The test validates media tracks, timeline event counts, and sequence data
  through `validateFileArchive` and `readFileArchive`.
- The test indexes the archive through `packages/indexer` and queries
  `media.track.discovered` and `media.segment.observed` rows.
- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 2 files and
  4 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 7 files and 36 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan produced no output.
- JSON parse scan succeeded.

## Blockers

None currently.
