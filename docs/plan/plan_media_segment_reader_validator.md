# Plan: Media Segment Reader Validator

## Goal

Add the first archive validation coverage for media segment files referenced by
timeline facts.

This is a foundation step between fixture-safe segment writes and future real
media capture. It checks archive file facts only; it does not inspect media
codec content.

## Scope

In scope:

- add a runtime schema for `MediaSegmentFact` payloads;
- validate `media.segment.*` timeline facts that include `relativePath`;
- check referenced segment paths are archive-relative and stay under the
  declared track's `segmentsPath`;
- check referenced segment files exist;
- check `byteLength` when a fact declares it;
- keep `media.segment.*` observations without `relativePath` valid, because
  adapters may first record discovered-but-not-downloaded segments.

Out of scope:

- real site capture;
- FFmpeg or ffprobe execution;
- hash validation;
- duration validation;
- media container or codec probing;
- segment repair, deletion, quarantine, or rewrite;
- manifest segment inventory.

## TDD Slices

1. RED/GREEN: archive validation accepts a segment fact whose referenced file
   exists and whose declared byte length matches.
2. RED/GREEN: archive validation reports missing referenced segment files.
3. RED/GREEN: archive validation reports byte-length mismatches and unsafe or
   wrong-track segment paths.
4. REFACTOR: share segment validation between snapshot and streaming archive
   validation where useful.

## Expected Diagnostic Codes

New `segment.*` archive validation codes:

- `segment.schema_invalid`;
- `segment.track_unknown`;
- `segment.unsafe_path`;
- `segment.path_mismatch`;
- `segment.missing_file`;
- `segment.byte_length_mismatch`.

## Verification

Expected commands:

```powershell
pnpm exec vitest run packages/archive/tests/archiveReaderValidator.test.ts
pnpm exec vitest run packages/archive/tests tdd-tests/packages/indexer/timeline-batches/indexerTimelineBatches.test.ts
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run trailing whitespace and JSON/package config parse scans.

## Progress

- Created after commit `5270bd0`.
- RED: `pnpm exec vitest run packages/archive/tests/archiveReaderValidator.test.ts`
  failed because a missing segment file referenced by a timeline fact was not
  reported.
- GREEN: added `MediaSegmentFact` runtime schema and
  `validateTimelineMediaSegments`; snapshot archive validation reports
  `segment.missing_file`, `segment.byte_length_mismatch`,
  `segment.path_mismatch`, and `segment.schema_invalid`.
- RED: streaming validation test failed because `validateFileArchiveStreaming`
  did not report missing referenced segment files.
- GREEN: connected `validateFileArchiveStreaming` to the shared segment
  validator.
- Targeted regression:
  `pnpm exec vitest run packages/archive/tests packages/adapters/chaturbate/tests
  packages/indexer/tests
  tdd-tests/packages/indexer/timeline-batches/indexerTimelineBatches.test.ts`
  passed 8 files and 54 tests, with the known Node `node:sqlite`
  ExperimentalWarning.
- `pnpm typecheck` passed.
- `pnpm test` passed 19 files and 90 tests, with the known Node `node:sqlite`
  ExperimentalWarning.
- `pnpm build` passed.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed as a
  local smoke run.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan parsed 21 JSON files.
