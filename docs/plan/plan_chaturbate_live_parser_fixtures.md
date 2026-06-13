# Chaturbate Live Parser Fixtures Plan

Date: 2026-06-14

## Goal

Bring the Chaturbate adapter to the "only missing real networking" line by
adding pure, fixture-first parsers and synthetic fixtures that model a CB-like
LL-HLS/CMAF split audio/video topology, room state, chat, reconnect/gap, and
diagnostic/error facts. Future live code should be able to reuse these parsers
by replacing synthetic text inputs with approved real bytes.

## Scope

- `packages/adapters/chaturbate/**`
- `tdd-tests/packages/adapters/chaturbate/**`
- `docs/plan/plan_chaturbate_live_parser_fixtures.md`
- `docs/conversation-A01-documentation-and-initial-skeleton.md`

## Out Of Scope

- No network access, real room polling, real media download, process spawn, or
  FFmpeg/ffprobe execution.
- No real cookies, headers, tokens, signed URLs, accounts, room names, or chat
  identities.
- No changes to `packages/types`, `packages/schemas`, `packages/core`,
  `packages/archive`, `packages/player`, root `tsconfig*.json`, or
  `vitest.config.ts`.
- No changes to CB manifest safety posture: runtime mode remains fixture-only,
  network access remains none, and credential/sensitive-source flags are not
  relaxed.
- Shared index docs (`README.md`, `docs/AI_HANDOFF.md`,
  `docs/AI_CHANGE_INDEX.md`, `docs/APP_CODE_MAP.md`) are not edited in this
  lane. Snippets are handed to the designated committer instead.

## TDD Plan

1. RED: synthetic master + media playlist text does not yet parse into
   `media.track.*` and `media.segment.observed` facts. GREEN: add a pure parser
   and fixture text.
2. RED: room-state and chat facts are absent from the CB fixture stream.
   GREEN: add synthetic room/chat parser inputs and event generation.
3. RED: reconnect/gap/error facts are absent from the CB fixture stream.
   GREEN: add synthetic network, gap, diagnostic, and adapter-error modeling
   while keeping readiness green for the healthy fixture.
4. RED: the thick CB fixture does not yet pass readiness/catalog/offline capture
   and archive/index consumption. GREEN: wire the fixture runner output through
   existing gates and archive/index tests.

## Verification

- Targeted CB adapter tests during RED/GREEN.
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
- `git diff --check`
- trailing whitespace scan

## TDD Notes

- RED:
  `pnpm exec vitest run tdd-tests/packages/adapters/chaturbate/chaturbateLiveParserFixtures.test.ts`
  failed because `live-parser.synthetic.json` did not exist.
- GREEN slice 1: added `live-parser.synthetic.json` with synthetic master and
  media playlist text, plus `liveParserFixture.ts` pure parsing and event
  generation for `media.track.topology_observed`,
  `media.track.discovered`, and `media.segment.observed`.
- RED slice 2: room/chat expectations failed because no `room.state.changed`
  or `chat.message.observed` facts existed.
- GREEN slice 2: added synthetic room-state and chat fixture inputs and event
  generation. Chat identities and bodies are synthetic only.
- RED slice 3: reconnect/gap/diagnostic facts were missing.
- GREEN slice 3: added synthetic `network.disconnected`,
  `network.reconnected`, `media.gap.detected`, `diagnostic.note`, and a
  modeled adapter-error fixture path. The healthy thick fixture does not emit
  `adapter.error`.
- RED slice 4: integration test failed because no media-track builder existed
  for the thick fixture.
- GREEN slice 4: added `createChaturbateLiveParserMediaTracks`, readiness gate
  coverage, catalog/offline capture coverage, archive validation/reader
  coverage, and SQLite indexing checks.
- RED hardening: a master playlist with an unknown quoted
  `URI="fixture://chaturbate/..."` media reference was accepted because only
  whole-line fixture references were checked.
- GREEN hardening: the parser now extracts quoted `URI` references from master
  playlist attributes and rejects references that are not backed by parsed
  media playlists.
- RED hardening: a media playlist could hide a raw network URL inside an
  `URI="https://..."` attribute because playlist text was validated as one
  large string.
- GREEN hardening: playlist text is now checked line by line. Non-comment URI
  lines and quoted `URI` attributes must use `fixture://chaturbate/...`.
- Updated CB fixture capabilities to declare `room.state` and `chat.events`
  now that the thick fixture emits the required facts. Manifest security
  posture remains fixture-only / no network / no credentials / no sensitive
  source fields.
- Targeted tests passed:
  `pnpm exec vitest run tdd-tests/packages/adapters/chaturbate/chaturbateLiveParserFixtures.test.ts tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts packages/adapters/chaturbate/tests`
  passed 5 files and 19 tests.
- `pnpm typecheck` passed.
- `pnpm test` passed 35 files and 195 tests, with the known Node
  `node:sqlite` ExperimentalWarning.
- `pnpm build` passed.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed with
  1000 scanned events, 8 batches, and 0 issues.
