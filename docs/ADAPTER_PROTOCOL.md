# Adapter Protocol

Status: draft protocol contract. The first Chaturbate package is fixture-only
and must not connect to live rooms.

## Purpose

Adapters isolate site-specific behavior from GUI, Electron main, archive
writing, and generic core state. A site adapter discovers facts and emits
structured messages to `chronarium-core`.

The protocol is message-based so adapters can run in child processes or workers.

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

## Chaturbate Initial Scope

The first `packages/adapters/chaturbate` boundary is fixture-first:

- synthetic fixtures only;
- no network requests;
- no live room polling;
- no media download;
- no account, cookie, header, or session handling.

Live capture can only be designed after archive, timeline, validation, fixture
tests, and redaction rules are proven.
