# GUI Core Protocol

Status: draft protocol contract. A static Web-first React/Vite renderer exists
under `apps/desktop`, but no Electron shell, preload bridge, IPC
implementation, or live GUI-core binding exists. `chronarium-core` is currently
an in-process TypeScript library (`packages/core`) exposing a runtime contract,
archive/index service, GUI-facing facade, and fixture-only offline capture
pipeline. Request families marked as existing below map to library calls that
exist today; the message envelope, transport, events, paging, and everything
marked reserved are design targets only.

## Purpose

The GUI submits user intent and renders state. `chronarium-core` is the local
authority for tasks, archive reads and writes, SQLite indexing, adapter
lifecycle, and diagnostics. The renderer never owns those responsibilities.

This protocol exists so GUI work cannot invent ad-hoc APIs. Every
renderer-visible capability must be a named message in this document before it
is implemented. If a GUI feature needs something core does not offer, the
contract changes here first.

The protocol is message-based so the same shapes work whether core runs inside
Electron main or as a separate supervised process.

## Process Boundary

```text
React Renderer
  -> calls the narrow typed client exposed by the preload bridge
  -> renders state, timelines, and diagnostics
  -> never touches the filesystem, archives, or SQLite directly

Preload Bridge
  -> exposes only the typed client surface to the renderer
  -> forwards messages; holds no business logic

Electron Main
  -> routes messages between renderer and chronarium-core
  -> owns desktop lifecycle only

chronarium-core
  -> validates every request at its boundary
  -> executes archive, index, and runtime operations
  -> pushes subscription events back toward the renderer
```

The renderer must not fetch site media, parse provider protocols, mutate
Replay Packages, open SQLite, or invoke FFmpeg or shell commands. See
`docs/ARCHITECTURE.md` and `docs/SECURITY_PRIVACY.md`.

## Transport

This protocol is a transport-agnostic message contract. V1 has two candidate
transports:

- core linked as a library inside Electron main, behind a typed client that
  speaks these message shapes (fastest first step; matches what
  `packages/core` is today);
- core as a supervised child process talking to Electron main over a message
  channel.

The decision is deferred. The message shapes are identical either way, and
the renderer-facing typed client interface is the stable contract. GUI code
must depend on the typed client only, never on the transport behind it.

## Protocol Version

V1 uses:

```text
protocolVersion: 1
```

Every message has:

- `protocolVersion`;
- `messageId`;
- `type`;
- `sentAt`;
- optional `correlationId`.

These envelope conventions mirror `docs/ADAPTER_PROTOCOL.md`.

## Message Model

Three message kinds exist:

- **Request**: GUI to core, carries user intent or a query.
- **Response**: core to GUI, paired to exactly one request by
  `correlationId`. Every request receives exactly one response: a result or
  a structured error.
- **Event**: core to GUI, pushed for active subscriptions. Events are not
  paired to requests and may arrive at any time while a subscription is open.

A synthetic request example:

```json
{
  "protocolVersion": 1,
  "messageId": "msg-0001",
  "type": "index.timeline.query",
  "sentAt": "2026-06-12T00:00:00.000Z",
  "payload": {
    "filter": {
      "archiveId": "arch-synthetic-0001",
      "type": "chat.message"
    },
    "limit": 200
  }
}
```

## GUI To Core Requests

Requests are grouped by family. "Exists today" means the operation exists as
an in-process library call in `packages/core`; no transport or GUI is wired
to it yet.

### `core.status.get`

Exists today as the library call `CoreRuntime.getHealth()`.

Returns a runtime health snapshot: `status` (one of `not-started`,
`running`, `stopped`, `error`), `checkedAt`, and an optional `message`.

Required fields: none beyond the envelope.

### `archive.validate`

Exists today as `CoreArchiveIndexService.validateArchive()`.

Validates one Replay Package (`.chron` directory) and returns the validation
report, including issues with severity, code, message, and location.

Required fields:

- `archiveRootPath`.

### `archive.read`

Exists today as `CoreArchiveIndexService.readArchive()`.

Reads one Replay Package into an archive snapshot (manifest, media tracks,
timeline events, and the embedded validation report). Responses for large
archives should be paged; see Query Bounds.

Required fields:

- `archiveRootPath`.

### `archive.reindex`

Exists today as `CoreArchiveIndexService.reindexArchive()`.

Rebuilds the SQLite index rows for one Replay Package and returns an index
summary (`archiveId`, `sessionId`, `archiveRootPath`, `validationOk`, event
and issue counts). `archiveRootPath` is an absolute local path and stays a
local-only surface value per the Error Model path rule.

Required fields:

- `archiveRootPath`.

### `index.archives.query`

Exists today as the indexer query contract `listArchives()` with fixed
parameterized filters.

Required fields:

- `filter` (may be empty; allowed keys: `sessionId`, `siteId`,
  `validationOk`);
- `limit` (protocol-level requirement; see Query Bounds).

### `index.timeline.query`

Exists today as the indexer query contract `listTimelineEvents()` with fixed
parameterized filters.

Required fields:

- `filter` (may be empty; allowed keys: `archiveId`, `sessionId`, `type`);
- `limit`.

### `index.issues.query`

Exists today as the indexer query contract `listValidationIssues()` with
fixed parameterized filters.

Required fields:

- `filter` (may be empty; allowed keys: `archiveId`, `sessionId`,
  `severity`, `code`);
- `limit`.

### Reserved request families

These families are declared so names stay stable, but they are not specified
and nothing implements them:

- `task.*` (task lifecycle: planned with core task state);
- `adapter.*` (Adapter Worker control: planned per
  `docs/ADAPTER_PROTOCOL.md`; the GUI never talks to adapters directly);
- `replay.*` (replay/player queries: planned per `docs/REPLAY_MODEL_V1.md`);
- `export.*` (derived exports: planned per `docs/MEDIA_TOOLS_BOUNDARY.md`);
- `maintenance.*` (inspection, recovery, and repair flows: planned per
  `docs/MAINTENANCE_OPS_DESIGN.md`; the interrupted-write recovery slice is
  drafted in `docs/plan/plan_archive_recovery.md`).

A reserved family must be specified in this document before any GUI or core
code uses it.

## Core To GUI Events

Events are pushed for active subscriptions. No event emission exists in core
today; the library is call-and-return only.

### `core.lifecycle.changed`

Planned. Emitted when the core runtime status changes between
`not-started`, `running`, `stopped`, and `error`. Carries the same snapshot
shape as the `core.status.get` response.

### `archive.indexed`

Planned. Emitted after an archive index or reindex completes, carrying the
index summary so archive lists can refresh without polling.

### Reserved events

- `task.state.changed`;
- `maintenance.finding.surfaced`.

Reserved events are named but not specified.

## Error Model

Every failed request returns a structured error envelope:

```json
{
  "protocolVersion": 1,
  "messageId": "msg-0002",
  "type": "error",
  "sentAt": "2026-06-12T00:00:01.000Z",
  "correlationId": "msg-0001",
  "error": {
    "code": "archive.missing_file",
    "message": "Synthetic example: the archive manifest could not be read.",
    "retryable": false,
    "details": {
      "sensitivity": "synthetic"
    }
  }
}
```

Rules:

- `code` follows the naming scheme in `docs/DIAGNOSTIC_CODES_V1.md`;
- `message` is human-readable and safe to display;
- `retryable` tells the GUI whether retrying the same request can succeed;
- `details` must be redacted per `docs/SECURITY_PRIVACY.md` and should carry
  a sensitivity label (`safe`, `synthetic`, `redacted`,
  `contains-sensitive`, `unknown`);
- absolute local paths are allowed only in local-only surfaces, never in
  shareable diagnostics or exported error reports.

## Query Bounds

- Every query in this protocol is bounded: requests carry an explicit
  `limit`, and core must enforce a maximum even when the GUI asks for more.
- No unbounded timeline dumps to the renderer. A full session Timeline can
  be large; the renderer requests windows, not whole streams.
- Large reads (`archive.read`, `index.timeline.query`) are paged. The
  pagination shape (offset, cursor, or sequence range) is an open decision.
- The library query contracts in `packages/indexer` today filter by fixed
  parameters but do not yet take a limit; the protocol layer must add and
  enforce bounds before any GUI ships.

## Security Rules

- The renderer runs without `nodeIntegration` and with `contextIsolation`
  enabled.
- The preload bridge exposes only the narrow typed client; no generic IPC,
  filesystem, or process surface reaches the renderer.
- Electron main routes messages but does not parse business payloads beyond
  safe lifecycle handling.
- Every request is schema-validated at the core boundary before execution.
- `archiveRootPath` values are validated against configured archive roots;
  requests for paths outside those roots are rejected.
- No secrets in payloads: no cookies, headers, bearer tokens, signed URLs,
  or credential material crosses this boundary in either direction; future
  credential designs use safe references per `docs/SECURITY_PRIVACY.md`.
- No shell access: the protocol never carries shell command strings, and no
  request may trigger arbitrary command execution.
- The GUI must never talk directly to Adapter Workers, SQLite, or Replay
  Packages; all access goes through these messages.

## Versioning

Every message carries `protocolVersion`. Core rejects any message with a
mismatched `protocolVersion` using the structured error envelope above, with
a dedicated code from the reserved `protocol.*` area in
`docs/DIAGNOSTIC_CODES_V1.md` and `retryable: false`. The GUI must surface
the mismatch instead of silently downgrading. Breaking changes to message
shapes require a version bump and a note in this document.

## Initial Scope

The first GUI milestone is the minimal React UI from the
`docs/ARCHITECTURE.md` MVP step list: open a fixture Replay Package and show
its timeline events. That milestone needs only:

- `core.status.get`;
- `archive.validate`;
- `archive.read`;
- `index.archives.query`;
- `index.timeline.query`;
- `index.issues.query`.

Everything else stays reserved. Fixture packages used by the first GUI must
be synthetic per `docs/SECURITY_PRIVACY.md`.

## Open Decisions

- Transport choice: core as a library inside Electron main versus a
  supervised child process over a message channel.
- Subscription granularity: per-event-family, per-archive, or per-session
  subscriptions for pushed events.
- Pagination shape: offset, cursor, or sequence-range paging for archive
  and timeline reads.
- Streaming for large timelines: whether `archive.read` and
  `index.timeline.query` gain a chunked streaming mode or stay strictly
  request/response with paging.
