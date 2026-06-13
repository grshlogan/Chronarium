# Adapter Protocol

Status: draft protocol contract with implemented fixture-only boundaries. The
current Chaturbate and Stripchat adapter packages are fixture-only and must not
connect to live rooms.

## Purpose

Adapters isolate site-specific behavior from GUI, Electron main, archive
writing, and generic core state. A site adapter discovers facts and emits
structured messages to `chronarium-core`.

The protocol is message-based so adapters can run in child processes or workers.
The implemented process-boundary helpers are still safe/offline: a JSON Lines
reader for future adapter stdout, a typed command descriptor builder, and a
no-spawn worker supervisor harness. They validate and model the boundary before
core lifecycle code consumes messages, but they do not launch real workers.

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

Fixture readiness also requires evidence for early room/chat capabilities:
`room.state` must be represented by at least one `room.state.changed` timeline
fact, and `chat.events` must be represented by at least one
`chat.message.observed` timeline fact.

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

## Worker JSONL Stream

Future adapter child processes are expected to emit adapter-to-core messages as
JSON Lines. `packages/core` currently exposes `readAdapterWorkerJsonlMessages`
as the first safe parser for that boundary.

The parser:

- ignores blank lines;
- parses each nonblank line as JSON;
- validates through the shared adapter-to-core schema;
- yields typed `AdapterToCoreMessage` values;
- throws `AdapterWorkerMessageStreamError` with stable `code` and `lineNumber`
  for invalid JSON or invalid protocol;
- does not echo raw worker output lines in errors.

This is only a parser boundary. It does not spawn child processes or connect to
live sites.

## Worker Command Descriptor

`packages/core` also exposes `createAdapterWorkerCommand` as the first typed
command-description boundary for future adapter workers.

The builder:

- returns `executablePath`, `argv`, `redactedArgv`, and `shell: false`;
- puts adapter id, runtime mode, session id, capabilities, and optional fixture
  name into structured argv fields;
- requires absolute executable and worker entry paths;
- rejects empty values and newline-bearing values;
- does not accept arbitrary shell strings;
- does not check file existence or spawn child processes.

The real process launcher is still pending. The no-spawn supervisor harness
below is the current testable model for that future launcher.

## No-Spawn Worker Supervisor Harness

`packages/core` exposes `runModeledAdapterWorker` as a no-spawn harness for the
future process supervisor.

The harness accepts:

- an adapter worker command descriptor;
- a lifecycle request;
- modeled stdout JSONL lines;
- modeled stderr lines;
- an exit code.

It parses stdout through `readAdapterWorkerJsonlMessages`, runs the parsed
messages through the fixture lifecycle host, summarizes stderr, and returns a
structured report. Invalid stdout and non-zero exit codes become failed reports
instead of unstructured exceptions.

This harness is still not a real process launcher. It is the testable contract a
future launcher should feed.

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
