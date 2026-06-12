# Plan: Chaturbate Offline Split Fixture

## Objective

Add the first offline Chaturbate adapter fixture and tests for a CB-like split
audio/video stream topology.

The goal is to prove Chronarium can describe the shape of split audio/video
capture as facts without connecting to Chaturbate and without downloading
media.

## Scope

In scope:

- add a synthetic fixture describing one video track and one audio track;
- add adapter-local parsing/building code that converts the fixture into
  `MediaTrack` metadata and timeline events;
- add behavior tests for:
  - timeline event generation;
  - adapter message generation through the existing fixture runner;
  - schema validation through existing timeline and adapter schemas;
  - rejection of real-network-looking playlist references.
- document the fixture event shapes in `docs/TIMELINE_SCHEMA_V1.md`.

Out of scope:

- live Chaturbate requests;
- playlist polling;
- `N_m3u8DL-RE` integration;
- FFmpeg integration;
- real media files or segment downloads;
- account, cookie, header, token, private room, or session handling;
- GUI work;
- archive recovery.

## Current Facts

- `packages/adapters/chaturbate/src/fixtureAdapter.ts` can emit adapter
  protocol messages from an in-memory fixture.
- `packages/adapters/chaturbate` has no tests.
- The existing timeline runtime schema validates envelopes, not
  payload-specific schemas.
- The existing media track type can represent separate audio and video tracks.
- `docs/CB_RECORDING_REFERENCES.md` recommends starting with offline split
  track fixtures before any real adapter work.

## Design

Add a committed synthetic JSON fixture:

```text
packages/adapters/chaturbate/fixtures/split-audio-video.synthetic.json
```

The fixture describes:

- synthetic fixture name;
- synthetic session id;
- synthetic capture timestamp;
- a synthetic LL-HLS/CMAF topology reference;
- one video track;
- one audio track;
- two synthetic segment observations per track.

The parser must only accept synthetic fixture references such as:

```text
fixture://chaturbate/split-audio-video/master.m3u8
```

It must reject `http://`, `https://`, cookie-like strings, token-like strings,
and query strings so real site URLs cannot accidentally land in the fixture
path.

## Verification

Expected commands:

```powershell
pnpm exec vitest run packages/adapters/chaturbate/tests
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run trailing whitespace and JSON/package config parse scans.

## Progress / Decisions

- Plan created after commit `7c3b9bb`.
- Added `split-audio-video.synthetic.json`.
- Added adapter-local fixture parser/builders in `splitTrackFixture.ts`.
- Added behavior tests for media track generation, timeline facts, adapter
  protocol messages, and rejection of unsafe fixture references.
- Documented emitted fixture event shapes in `docs/TIMELINE_SCHEMA_V1.md`.
- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 1 file and
  3 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 6 files and 35 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan produced no output.
- JSON parse scan succeeded.

## Blockers

None currently.
