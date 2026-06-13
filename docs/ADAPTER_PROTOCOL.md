# Adapter Protocol

Status: draft protocol contract. The first Chaturbate package is fixture-only
and must not connect to live rooms.

## Purpose

Adapters isolate site-specific behavior from GUI, Electron main, archive
writing, and generic core state. A site adapter discovers facts and emits
structured messages to `chronarium-core`.

The protocol is message-based so adapters can run in child processes or workers.

Every adapter package should also expose an adapter manifest. The manifest is
not a runtime message; it is the registration metadata core uses before a
worker is started.

## Process Boundary

```text
chronarium-core
  -> starts adapter worker
  -> sends commands
  -> receives facts, diagnostics, and status
  -> assigns final timeline sequence
  -> writes archives and indexes

site adapter worker
  -> parses site-specific fixture or source data
  -> emits structured facts
  -> does not write final archives directly
```

## Protocol Version

V1 uses:

```text
protocolVersion: 1
```

Every message has:

- `protocolVersion`;
- `messageId`;
- `type`;
- `adapterId`;
- `sentAt`;
- optional `correlationId`;
- optional `sessionId` when tied to a session.

## Core To Adapter Messages

### `adapter.start`

Requests that an adapter start for one session.

Required fields:

- `sessionId`;
- `mode`;
- `capabilitiesRequested`.

For the first Chaturbate skeleton, only fixture mode is allowed.

### `adapter.stop`

Requests a graceful stop.

Required fields:

- `reason`.

### `fixture.load`

Requests that the adapter load a synthetic fixture by reference.

Required fields:

- `fixtureRef.name`;
- `fixtureRef.syntheticOnly`.

The reference must not point at private recordings or real captured media.

### `health.ping`

Requests a liveness response.

## Adapter To Core Messages

### `adapter.ready`

Signals that the adapter is ready and reports capabilities.

Required fields:

- `mode`;
- `capabilities`.

### `fact.timeline`

Emits one candidate timeline event. Core owns final persistence and may assign
or rewrite session-local sequence fields before writing.

Required fields:

- `event`.

### `diagnostic.event`

Emits a diagnostic message that can be converted into timeline or diagnostic
logs.

Required fields:

- `level`;
- `message`;
- `details`.

Diagnostics must be redacted before crossing the protocol boundary.

### `adapter.error`

Reports a structured adapter failure.

Required fields:

- `code`;
- `message`;
- `retryable`;
- `redactionStatus`.

### `adapter.finished`

Signals that fixture processing or capture ended.

Required fields:

- `reason`;
- `summary`.

### `health.pong`

Responds to `health.ping`.

## Capability Names

Initial capability names:

```text
fixture.timeline
media.discovery
room.state
chat.events
diagnostics
```

Capabilities describe what the adapter can emit. They do not grant filesystem,
network, credential, or shell access by themselves.

## Adapter Manifest

An adapter manifest declares a package's safe registration shape:

- `schemaVersion`;
- `adapterId`;
- `siteId`;
- `displayName`;
- allowed `runtimeModes`;
- emitted `capabilities`;
- fixture readiness status and fixture names;
- security posture.

The first manifest schema is implemented in `packages/types` and
`packages/schemas`, and core can register manifests through its adapter catalog.
When a runtime is configured with manifests, the offline capture pipeline uses
that catalog as a preflight gate before consuming adapter messages.

For a future live adapter, `runtimeModes` must not include `live` until the
adapter has:

- offline synthetic or redacted fixtures;
- a passing adapter readiness gate;
- documented credential and redaction boundaries;
- a site-specific plan that does not store raw cookies, headers, signed URLs,
  or private room/session details.

## Readiness Gate

Before live-site design begins, an adapter fixture stream must pass the
readiness gate in `packages/testkit`.

The gate checks:

- protocol parsing through the shared adapter schema;
- `adapter.ready` before facts;
- a single `adapter.ready`;
- requested capabilities are declared;
- adapter and session ids match the request;
- `adapter.finished` exists and is terminal;
- no messages appear after `adapter.finished`;
- no raw network URLs, secret-looking field names, cookies, authorization
  headers, bearer tokens, signed URLs, or token query strings are present.

Passing the readiness gate only means the adapter is safe to wire into
Chronarium's offline core contract. It does not prove current live-site
behavior.

`docs/ADAPTER_SITE_READINESS.md` is the practical checklist for new adapter
packages.

## Core Task Gate

The current core gate applies to offline fixture capture. When the runtime has
an adapter catalog, a capture request fails before adapter startup if:

- the adapter id is not registered;
- the requested runtime mode is not declared by the manifest;
- a requested capability is not declared by the manifest;
- fixture mode is requested while `fixtureReadiness.status` is not
  `fixture-ready`.

The gate does not start child processes, does not connect to a site, and does
not prove live compatibility. It prevents invalid task setup from consuming an
adapter message stream or writing an archive.

## Security Rules

- GUI must never talk directly to site adapters.
- Electron main must not parse adapter payloads beyond safe process lifecycle
  handling.
- Adapters must not write final archives directly.
- Adapters must not call unrelated adapters.
- Adapters must not emit raw cookies, headers, bearer tokens, signed URLs, or
  private account/session data.
- Adapter logs must be treated as potentially sensitive until redacted.
- Child process arguments must be typed and bounded; no arbitrary shell command
  strings.
- Adapter manifests that declare sensitive source field emission are rejected by
  the current core catalog.

## Current Fixture Scopes

`packages/adapters/chaturbate` is the split audio/video example:

- synthetic fixtures only;
- no network requests;
- no live room polling;
- no media download;
- no account, cookie, header, or session handling.
- CB-like split audio/video topology fixtures.

`packages/adapters/stripchat` is the combined audio/video example:

- synthetic fixtures only;
- no network requests;
- no live room polling;
- no media download;
- no account, cookie, header, or session handling;
- SC-like combined audio/video topology fixture;
- non-contiguous media segments become `media.gap.detected` facts;
- overlapping or backwards media segments are rejected.

Live capture can only be designed after archive, timeline, validation, fixture
tests, and redaction rules are proven.
