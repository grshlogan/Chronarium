# Plan: Media Track Archive IO

## Objective

Add the first fixture-safe media-track metadata IO path for `.chron` archives.

This stage makes archive track inventory executable enough for later media
segment work, while still avoiding real site capture and real media download.

## Scope

In scope:

- add synthetic `MediaTrack` fixture helpers;
- define archive layout helpers for track metadata and segment directories;
- let the archive writer write track metadata and update manifest track
  inventory;
- let the archive reader return validated media tracks;
- let the archive validator report missing, invalid, unsafe, or mismatched track
  metadata;
- add behavior tests for writer, reader, and validator track paths.

Out of scope:

- real media segment writing;
- FFmpeg or ffprobe integration;
- adapter media discovery;
- network requests;
- cookies, headers, tokens, sessions, signed URLs, private room data, or real
  recordings;
- indexer track tables;
- GUI or core integration.

## Current Facts

- `MediaTrack` and `mediaTrackV1Schema` already exist.
- `ArchiveManifest.tracks` already stores a track inventory.
- The archive writer currently writes `manifest.json`, creates top-level
  directories, appends `timeline.jsonl`, and enforces basic timeline append
  invariants.
- The archive reader/validator currently reads and validates manifest and
  timeline facts only.

## Constraints

- Keep `.chron` files as the replay truth.
- Keep SQLite as a rebuildable derived index only.
- Keep track fixtures synthetic and local-only.
- Do not implement real Chaturbate capture or account/session handling.
- Keep path handling archive-relative and bounded to the package root.

## Execution Plan

1. Add the plan and update conversation context.
2. Add synthetic media-track fixture helper.
3. Add archive track layout helpers.
4. Add writer `writeMediaTrack` behavior and invariants.
5. Add reader/validator media-track metadata behavior.
6. Add behavior tests.
7. Update docs and handoff files.
8. Run typecheck, tests, build, diff, whitespace, and JSON parse checks.

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

- Created after commit `5fbadde`.
- Added `createSyntheticMediaTrack` in `packages/testkit`.
- Added track layout helpers:
  `getMediaTrackDirectoryPath`, `getMediaTrackMetadataPath`, and
  `getMediaTrackSegmentsPath`.
- Added `ArchiveWriter.writeMediaTrack`.
- Writer now rejects media-track writes before manifest, after finalization,
  across sessions, duplicate track IDs, and mismatched `segmentsPath`.
- Writer writes `tracks/<track-id>/track.json`, creates
  `tracks/<track-id>/segments/`, and updates manifest `tracks`.
- Reader snapshots now include `mediaTracks`.
- Validator now reads manifest-declared `track.json` files and reports missing,
  invalid, unsafe, or manifest-mismatched media track metadata.
- Added archive writer, reader, and validator behavior tests for track
  metadata.
- `pnpm exec vitest run packages/archive/tests` passed 2 files and 21 tests.
- `pnpm typecheck` passed.
- `pnpm test` passed 3 files and 28 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build` passed.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| TypeScript could not narrow an optional union in `validator.ts`. | First `pnpm typecheck`. | Switched checks to explicit `"issue" in metadataPath` guards. |

## Blockers

None currently.
