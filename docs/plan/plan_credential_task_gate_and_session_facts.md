# Credential Task Gate And Session Facts Plan

Date: 2026-06-14

## Goal

Finish the fixture-only credential foundation line before any live cookie work:

- B1: make core capture preflight refuse gated capture intents when no usable
  bound credential profile exists.
- B2: add redacted timeline payload schemas for session intent and credential
  selection facts.

## Scope

- Extend `CoreTaskRequest` with a redacted recording intent and streamer ref.
- Pass the fixture-only `CredentialStore` into the offline fixture capture
  pipeline through the runtime / GUI service boundary.
- Use `selectCredentialForCapture` for gated intent preflight.
- Add lenient schemas and types for:
  - `session.intent_selected`
  - `session.credential_selected`
  - `session.credential_failover`
  - `session.credential_missing`
- Update A01 context and handoff docs.

## Out Of Scope

- No real cookies, headers, bearer tokens, signed URLs, or account material.
- No encrypted credential store.
- No credential import flow.
- No live adapter credential injection.
- No live network requests.
- No browser cookie extraction.

## TDD Plan

Use vertical RED -> GREEN slices:

1. RED: a gated offline fixture capture with no usable bound profile starts the
   adapter stream or completes. GREEN: fail preflight with
   `credential.missing` before adapter startup.
2. RED: a gated offline fixture capture with an entitled synthetic profile is
   rejected. GREEN: allow capture to proceed.
3. RED: session credential payload parse functions / registry entries are
   missing. GREEN: add payload types, schemas, parse functions, and dispatcher
   entries.

## Verification

- Targeted Vitest slices during RED/GREEN.
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
- `git diff --check`
- trailing whitespace scan
- JSON/package parse scan

## TDD Notes

- Core gate RED:
  `pnpm exec vitest run tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts`
  failed because a gated `ticket` capture without a usable credential still
  consumed adapter messages before preflight.
- Core gate GREEN: `CoreTaskRequest` gained optional `recordingIntent` and
  redacted `streamerRef`; `CoreRuntime` can carry the fixture-only
  `CredentialStore`; `CoreGuiService` passes it into `runOfflineFixtureCapture`;
  gated `ticket` / `private` / `spy` intents now fail preflight with
  `credential.missing` before adapter startup when no usable bound profile
  exists.
- Schema RED:
  `pnpm exec vitest run tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  failed because session credential parse functions and registry entries did
  not exist.
- Schema GREEN: added redacted payload types, schemas, parse functions, and
  registry entries for `session.intent_selected`,
  `session.credential_selected`, `session.credential_failover`, and
  `session.credential_missing`.
- Targeted credential gate test passed 1 file and 4 tests.
- Targeted timeline payload schema test passed 1 file and 33 tests.
- Early `pnpm typecheck` passed after implementation.
- Final `pnpm test` passed 30 files and 166 tests.
- Final `pnpm typecheck` passed.
- Final `pnpm build` passed.
- Final `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed with
  1000 scanned events, 8 batches, and 0 issues.
- Final `git diff --check` passed.
- Final trailing whitespace scan found no matches.
- Final JSON/package parse scan parsed 29 JSON files.
