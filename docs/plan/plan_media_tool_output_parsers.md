# Media Tool Output Parsers Plan

Date: 2026-06-14

## Goal

Add fixture-tested parsers for synthetic ffprobe JSON output and synthetic
FFmpeg progress output inside `packages/media-tools`, without executing real
tools or touching core contracts.

## Scope

- Add package-local parser result types and parser functions in
  `packages/media-tools/src`.
- Add synthetic fixtures under `packages/media-tools/fixtures/`.
- Add TDD tests under `tdd-tests/packages/media-tools/output-parsing/`.
- Update media-tools docs and A01 handoff/change records.

## Out Of Scope

- No real ffmpeg / ffprobe execution.
- No child-process spawning.
- No real media files.
- No real URLs, cookies, headers, tokens, signed URLs, account data, or
  credentials.
- No changes to `packages/types`, `packages/schemas`, `packages/core`, or
  `packages/archive`.

## TDD Plan

1. RED: ffprobe fixture parser is missing. GREEN: parse synthetic
   `ffprobe -print_format json` output into typed format/stream metadata.
2. RED: malformed ffprobe output leaks or throws raw parser errors. GREEN:
   return a stable sanitized error.
3. RED: FFmpeg progress fixture parser is missing. GREEN: parse synthetic
   `ffmpeg -progress` key/value output into typed progress metadata.
4. RED: malformed FFmpeg progress leaks raw text. GREEN: return a stable
   sanitized error.

## Verification

- Targeted media-tools parser tests during RED/GREEN.
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
- `git diff --check`
- trailing whitespace scan

## TDD Notes

- RED:
  `pnpm exec vitest run tdd-tests/packages/media-tools/output-parsing/mediaToolOutputParsers.test.ts`
  failed because `parseFfprobeJsonOutput` and
  `parseFfmpegProgressOutput` were not exported.
- GREEN: added `packages/media-tools/src/outputParsers.ts`, exported it from
  the package source index, and added synthetic fixtures for ffprobe JSON and
  FFmpeg progress output.
- Refine: tightened malformed ffprobe shape handling and FFmpeg progress key
  validation so parser errors stay stable and do not echo sensitive-looking raw
  lines.
- Targeted parser + media command tests passed 2 files and 8 tests.
- `pnpm typecheck` passed.
- `pnpm test` passed 33 files and 181 tests.
- `pnpm build` passed.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed with 1000
  scanned events, 8 batches, and 0 issues.
- `git diff --check` passed.
- trailing whitespace scan found no matches.
- JSON/package parse scan parsed 30 JSON files.
