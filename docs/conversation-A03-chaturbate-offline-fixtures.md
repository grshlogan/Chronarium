# Conversation A03: Chaturbate Offline Fixtures

## Topic

A03 covers the first Chaturbate adapter continuation after the foundation
documentation pass: add offline split audio/video fixture parsing and behavior
tests without connecting to Chaturbate.

## Current Status

Completed.

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

## Files Changed Or Expected To Change

- `docs/conversation-A03-chaturbate-offline-fixtures.md`
- `docs/plan/plan_chaturbate_offline_split_fixture.md`
- `packages/adapters/chaturbate/fixtures/`
- `packages/adapters/chaturbate/src/`
- `packages/adapters/chaturbate/tests/`
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

## Next Safe Step

Write the split-track fixture into a synthetic `.chron` archive and verify
archive reader/indexer consumption.
