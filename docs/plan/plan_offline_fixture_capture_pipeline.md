# Offline Fixture Capture Pipeline Plan

## Goal

Add the first offline capture-like vertical slice for future GUI work:

```text
fixture adapter messages -> core task -> .chron archive -> SQLite index -> GUI service
```

## Scope

- Fixture mode only.
- Adapter messages are supplied by tests or future GUI demo fixtures.
- Core writes archive manifests, media track metadata, and timeline facts.
- Core reindexes the resulting archive and exposes the result through the GUI
  service facade.
- Adapter lifecycle failures map to task failures.

## Out Of Scope

- No real site connection.
- No adapter child process launch.
- No FFmpeg or ffprobe execution.
- No real media segment writing.
- No cookie, session, header, token, signed URL, account, or private room data.
- No Electron or React renderer implementation in this step.

## TDD Slices

1. RED/GREEN: a fixture capture task produces a valid `.chron` archive and index
   rows.
2. RED/GREEN: adapter errors and missing `adapter.finished` messages produce
   failed tasks without indexing an archive.
3. RED/GREEN: the GUI service can inspect the produced archive through archive,
   index, maintenance, and recovery APIs.

## Verification

- Targeted core tests.
- Full workspace typecheck, test, and build.
- `git diff --check`.
- Trailing whitespace scan.
- JSON/package parse scan.
