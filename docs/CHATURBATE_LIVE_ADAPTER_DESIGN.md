# Chaturbate Live Adapter Design

Status: design draft only. No live Chaturbate (CB) access, no real network
requests, no real cookies, no real media download exists. This document is the
gate-required design + threat/redaction contract that must exist before any CB
live code, per `docs/REAL_SITE_ADAPTER_BRINGUP.md`. It is owned by Claude (A02);
the fixture-safe CB parsers/fixtures it relies on are built in the adapters lane.

## Goal And First Milestone

- First live milestone: capture a single **public** CB room's stream
  **without credentials** ("无账号也能抓公开流"). This avoids the entire
  credential live-prep crossing.
- Later, gated milestones (ticket / private / spy) add the credential line
  (`docs/CREDENTIALS_AND_SESSIONS.md`): a real encrypted vault, import, and
  stdin-handshake injection. Out of scope here.

## CB Topology (target, modeled fixture-first)

CB serves split audio/video over LL-HLS / CMAF (see
`docs/CB_RECORDING_REFERENCES.md`):

```text
master playlist  -> media playlist (video)  -> CMAF segments
                 -> media playlist (audio)  -> CMAF segments
room state (online / show mode)   -> room.state.changed
chat                              -> chat.message.observed (redacted)
disconnect / reconnect / gaps     -> network.* / media.gap.detected
```

The pure parsers that turn playlist/room/chat text into Chronarium facts are
built and tested against synthetic `fixture://chaturbate/...` inputs in the
adapters lane. The live adapter must reuse those parsers **unchanged**, feeding
them real downloaded bytes instead of fixture text.

## Process Model

- The live adapter runs in an **isolated child process** launched by the core
  adapter worker process launcher (built in `packages/core`; spawns a worker,
  never the GUI/main). Per `AGENTS.md`, adapters run isolated once executable.
- The worker holds the only real HTTP client. It fetches the master/media
  playlists and segments, runs the pure parsers, and emits **redacted**
  adapter-to-core messages as JSON Lines on stdout. Core assigns final sequence
  and writes the archive.
- For gated shows, core injects a resolved cookie jar into the worker via a
  one-time **stdin handshake** (`createCredentialInjectionDescriptor`), never via
  argv and never logged. Public capture needs no injection.

## Live Request Boundary

The worker makes only these request kinds, all local-first and offline-capable
afterward:

- `GET` master playlist; `GET` media playlists; `GET` CMAF segments.
- Optional `GET` room-state / chat endpoints if used.

Rules:

- No request URL, header, cookie, or signed segment URL ever appears in a
  timeline fact, archive, SQLite row, log, or shareable diagnostic. Only a
  redacted reference (a stable hash or a `fixture://`-style handle) crosses the
  protocol boundary.
- The worker must not follow arbitrary redirects to non-CB hosts.
- Network access is the worker's alone; GUI, Electron main, archive, indexer,
  and player never make network requests.

## Redaction Rules (CB)

Applied at the adapter boundary, before any fact/diagnostic leaves the worker:

```text
raw signed segment URL     -> dropped; fact carries a redacted segmentRef/hash
raw playlist URL           -> dropped; fact carries a redacted playlistRef
request headers / cookies  -> never emitted
room / account identity    -> sourceIdHash (salted hash), never the raw name
chat author                -> authorRef (hash), never the raw handle
chat body                  -> redactionStatus set; bodies may be redacted or
                              dropped per policy; never `contains-sensitive` in
                              shareable form
```

- Facts that would carry sensitive source fields are rejected by the core
  adapter catalog (`emitsSensitiveSourceFields` must stay false) and by
  `verifyAdapterFixtureReadiness`'s secret/URL scan.
- Real captured media and private logs are never committed to git.

## Manifest Promotion Criteria

The CB manifest stays fixture-only until ALL of these hold (mirrors
`docs/REAL_SITE_ADAPTER_BRINGUP.md` "Promotion To Live Mode"):

- fixture coverage exists for media topology, room state, chat, reconnect/gap,
  and adapter errors (adapters-lane work);
- the pure parsers are reused unchanged by the live path;
- this redaction contract is implemented and tested;
- the live request boundary is implemented without storing raw
  headers/cookies/URLs;
- worker-process supervision has real-spawn coverage (launcher);
- archive / index / maintenance behavior for live failures has coverage;
- the user explicitly approves CB live access.

Only then does the manifest gain:

```text
runtimeModes: ["fixture", "live"]
security.networkAccess: "live"
security.requiresCredentials: false   // public; true only for gated intents
security.emitsSensitiveSourceFields: false   // always false
```

## Threat Model

- Leak vectors: signed segment URLs, cookies/headers (gated), room/account ids,
  chat PII, real media bytes.
- Controls: boundary redaction (above); the readiness gate's secret/URL scan;
  the catalog's `emitsSensitiveSourceFields` rejection; sensitivity labels
  travel with every fact and `contains-sensitive` is never shareable; raw media
  and cookies never committed; the credential jar is runtime-only (never argv /
  logs / archive); network is confined to the worker process.
- Failure posture: a live failure (disconnect, 403, rate-limit) becomes a
  redacted `adapter.error` / `network.*` fact and a failed/degraded task, never a
  crash that leaks raw responses.

## What Is Still Gated (not built here)

- The worker's real HTTP client and segment download loop.
- Real CMAF segment bytes written to the archive (vs synthetic bytes today).
- FFmpeg / ffprobe execution to verify/remux real media.
- Flipping the CB manifest to `live`.
- The credential live-prep (encrypted vault, import, real injection) for gated
  shows.
- The actual live crossing, which requires explicit per-step user approval.

## First Live Test (definition of "ready to test real recording")

When the fixture-safe push lands (CB parsers + fixtures + the real worker process
launcher running a fixture worker end-to-end), the only remaining work for a
first real test is:

1. Swap the worker's input from fixture text to a real CB public-room HTTP fetch.
2. Write the downloaded CMAF segments as real archive segments.
3. Flip the CB manifest to `live` (public; no credentials).

Each of those three steps is the live crossing and is performed only with
explicit user approval.
