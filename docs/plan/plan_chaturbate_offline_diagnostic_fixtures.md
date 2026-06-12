# Plan: Chaturbate Offline Diagnostic Fixtures

## Objective

Add synthetic Chaturbate fixture scenarios that preserve bad recording facts as
timeline events.

This step proves that Chronarium can store and index diagnostic facts such as
missing audio, duration mismatch, stream gaps, and stalled output without
connecting to Chaturbate or executing media tools.

## Scope

In scope:

- extend the existing Chaturbate split-track fixture parser with optional
  diagnostic records;
- add synthetic fixture files for:
  - missing audio;
  - duration mismatch;
  - media gap;
  - stalled output;
- emit diagnostic facts into the normal timeline envelope;
- verify the diagnostic facts through archive validation, archive reading, and
  SQLite indexing;
- document the event payload shapes and diagnostic code registry updates.

Out of scope:

- real Chaturbate requests;
- real media segments;
- downloader integration;
- FFmpeg / ffprobe integration;
- account, cookie, header, token, private room, signed URL, or session handling;
- upload or retention policy work;
- automatic repair or AI operations.

## Current Facts

- `packages/adapters/chaturbate` already has an offline split audio/video
  fixture.
- `packages/archive` can write, validate, and read synthetic `.chron` archives.
- `packages/indexer` can query indexed timeline events by event type.
- `docs/TIMELINE_SCHEMA_V1.md` already reserves `media.gap.*` and
  `diagnostic.*`.
- `docs/MEDIA_TOOLS_BOUNDARY.md` already names
  `diagnostic.media_tool_output` and `diagnostic.duration_mismatch` as planned
  future event types.

## Evidence Level

These fixtures are synthetic contract tests, not empirical Chaturbate
compatibility tests.

They are based on:

- Chronarium's design requirement that bad recording facts must be preserved;
- public reference-project lessons that split audio/video recording can produce
  missing tracks, gaps, duration mismatch, and stalled output symptoms;
- the existing archive, timeline, and indexer contracts.

They do not prove current Chaturbate live behavior. Real adapter compatibility
will require separately approved, redacted evidence such as sanitized playlist
shapes, sanitized ffprobe output, synthetic reproductions generated from real
failure classes, or other user-approved local samples. Until then, these
fixtures only prove that Chronarium can store and query the modeled facts.

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

- Plan created during A03 after commit `54e83ef`.
- Added optional fixture diagnostics to `splitTrackFixture.ts`.
- Added `missing-audio.synthetic.json`.
- Added `diagnostic-anomalies.synthetic.json`.
- Added `diagnosticFixtures.test.ts`.
- Diagnostic fixture events use existing timeline families:
  `media.gap.detected`, `diagnostic.duration_mismatch`, and
  `diagnostic.media_tool_output`.
- Diagnostic payload `code` values are registered separately from archive
  validator issue codes because they live inside timeline event payloads.
- Targeted adapter tests passed: 3 files and 7 tests.

## Blockers

None currently.
