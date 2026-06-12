# Conversation A03: Chaturbate Offline Fixtures

## Topic

A03 covers the first Chaturbate adapter continuation after the foundation
documentation pass: add offline split audio/video fixture parsing and behavior
tests without connecting to Chaturbate.

## Current Status

Completed again.

Starting point:

- `@chronarium/adapter-chaturbate` has a synthetic `runChaturbateFixture`
  message generator.
- The adapter package has no tests yet.
- `docs/CB_RECORDING_REFERENCES.md` and `docs/MEDIA_TOOLS_BOUNDARY.md`
  recommend fixture-first split audio/video work before any live adapter.
- No real CB capture, downloader, cookie, header, token, session, account, or
  signed URL handling exists.

Landed in this continuation:

- synthetic split audio/video JSON fixture;
- adapter-local fixture parser and builders;
- media track metadata generation;
- timeline fact generation for `media.track.topology_observed`,
  `media.track.discovered`, and `media.segment.observed`;
- adapter protocol validation through the existing fixture runner;
- tests rejecting network-looking and token-bearing fixture references.

Current continuation:

- verified that the same split-track fixture can be written into a synthetic
  `.chron` archive;
- verified that archive reader/validator and SQLite indexer can consume the
  resulting facts.
- added synthetic diagnostic fixtures for missing audio, media gap,
  audio/video duration mismatch, and stalled output;
- verified that diagnostic facts can be emitted as timeline events, written to
  `.chron`, validated/read back, and queried from SQLite.

Important evidence clarification:

- These diagnostic fixtures are synthetic contract tests.
- They prove Chronarium can preserve and query modeled bad recording facts.
- They do not prove current live Chaturbate behavior.
- Real compatibility evidence must come later from user-approved, sanitized
  samples or synthetic reproductions derived from approved local evidence.

## Active Constraints

- Work only inside `D:\live\Chronarium`.
- Offline fixture data only.
- Do not connect to real livestream sites.
- Do not implement real Chaturbate download logic.
- Do not add cookie, header, token, account, private room, or session handling.
- Do not store real room URLs, signed URLs, or captured media.
- Keep new fixtures synthetic.
- Keep adapter work isolated to `packages/adapters/chaturbate` unless shared
  contracts genuinely need a small update.
- Update `README.md`, `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, and
  `docs/AI_CHANGE_INDEX.md` after structural changes.

## Decisions So Far

- The first CB adapter test should prove that a CB-like split audio/video
  topology can become redacted timeline facts.
- The first implementation should use committed synthetic JSON fixture data.
- Timeline facts should pass the existing timeline envelope schema.
- Adapter messages should pass the existing adapter protocol schema.
- The fixture must reject network-looking playlist references so accidental
  real URLs do not enter committed tests.
- Diagnostic fixtures are allowed to model likely failure classes, but must be
  labeled as synthetic contract tests rather than empirical site facts.

## Files Changed Or Expected To Change

- `docs/conversation-A03-chaturbate-offline-fixtures.md`
- `docs/plan/plan_chaturbate_offline_split_fixture.md`
- `docs/plan/plan_chaturbate_fixture_archive_flow.md`
- `docs/plan/plan_chaturbate_offline_diagnostic_fixtures.md`
- `packages/adapters/chaturbate/fixtures/`
- `packages/adapters/chaturbate/src/`
- `packages/adapters/chaturbate/tests/`
- `packages/adapters/chaturbate/tests/diagnosticFixtures.test.ts`
- `packages/adapters/chaturbate/tests/splitTrackArchiveFlow.test.ts`
- `docs/TIMELINE_SCHEMA_V1.md`
- `README.md`
- `docs/APP_CODE_MAP.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`

## Verification

Checks run:

- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 1 file and
  3 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 6 files and 35 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON parse scan: succeeded.
- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 2 files and
  4 tests after adding archive/indexer flow coverage.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 7 files and 36 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON parse scan: succeeded.
- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 3 files and
  7 tests after adding synthetic diagnostic fixtures.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 8 files and 39 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON parse scan: succeeded for package/config and synthetic fixture JSON
  files.

## Next Safe Step

Run full workspace verification, then commit/push this diagnostic fixture step.
After that, implement archive recovery report-only detection or the first
deterministic maintenance inspection types under core.
