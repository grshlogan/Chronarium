# Timeline Schema V1

Status: draft schema contract. First-pass Zod runtime validation exists for the
event envelope, and one synthetic archive writer test exercises it. Event-family
payload schemas and ordering diagnostics are still incomplete.

## Principle

The timeline records facts in session time. It must distinguish observed source
facts from Chronarium decisions, derived summaries, diagnostics, and export-only
events.

## Event Envelope

Every timeline record is one JSON object with this envelope:

```json
{
  "schemaVersion": 1,
  "eventId": "event-synthetic-001",
  "sessionId": "session-synthetic-001",
  "type": "session.created",
  "sequence": 1,
  "capturedAt": "2026-01-01T00:00:00.000Z",
  "sourceTime": "2026-01-01T00:00:00.000Z",
  "monotonicMs": 0,
  "source": {
    "adapterId": "fixture",
    "siteId": "synthetic",
    "redactionStatus": "synthetic"
  },
  "sensitivity": "synthetic",
  "payload": {
    "note": "Synthetic session created."
  }
}
```

## Required Fields

- `schemaVersion`: timeline envelope version. V1 uses `1`.
- `eventId`: stable event identifier.
- `sessionId`: owning `LiveSession` identifier.
- `type`: event type, using the `<family>.<name>` convention.
- `sequence`: monotonic local integer for the session.
- `capturedAt`: local capture timestamp in ISO 8601 format.
- `sensitivity`: redaction or sensitivity status.
- `payload`: event-specific JSON object.

## Optional Fields

- `sourceTime`: timestamp reported by the source, if known.
- `monotonicMs`: session-relative monotonic time, if known.
- `source`: adapter/site/source metadata, without secrets.

## Time Model

Chronarium should preserve multiple time concepts instead of collapsing them:

- source time: what the site or media source reported;
- capture time: when Chronarium observed the fact;
- monotonic session time: local ordering anchor for replay;
- media time: track-specific presentation or decode time when available.

Missing source time must not block event capture. The timeline should preserve
uncertainty rather than invent precision.

## Event Families

Reserved v1 families:

```text
session.*
adapter.*
media.track.*
media.segment.*
media.gap.*
room.*
chat.*
paid_room.*
network.*
export.*
diagnostic.*
```

## Sensitivity Values

```text
safe
synthetic
redacted
contains-sensitive
unknown
```

Committed fixtures should use `synthetic`, `safe`, or `redacted`. Events marked
`contains-sensitive` must not be included in public fixtures, shareable
diagnostics, or docs.

## Initial Payload Guidelines

### `session.created`

Records that a session object was created.

Required payload fields:

- `status`: initial session status.

### `adapter.ready`

Records that an adapter process became ready.

Required payload fields:

- `adapterId`;
- `capabilities`;
- `mode`.

### `media.track.discovered`

Records that a logical media track was discovered.

Required payload fields:

- `trackId`;
- `kind`.

### `media.segment.discovered`

Records that a media segment was discovered or represented by a fixture.

Required payload fields:

- `trackId`;
- `segmentId`.

Forbidden payload fields:

- raw signed URLs;
- raw request headers;
- cookies or bearer tokens.

### `room.state`

Records a room-state observation.

Required payload fields:

- `state`.

### `chat.message`

Records a chat message when supported and allowed.

Required payload fields:

- `messageId`;
- `authorRef`;
- `body`;
- `redactionStatus`.

Chat fixtures must be synthetic or heavily redacted.

### `diagnostic.note`

Records a diagnostic observation.

Required payload fields:

- `level`;
- `message`.

Diagnostics must not leak secrets.

## Ordering Rules

- `sequence` is assigned by core, not by adapters.
- Adapters may emit source order hints, but core owns final session order.
- Readers should detect duplicate `eventId` values.
- Readers should detect sequence gaps and report them as diagnostics.

## Schema Evolution

- New event types may be added within existing families when they have schemas,
  examples, and fixture tests.
- Breaking envelope changes require a new timeline schema version.
- Payload migrations must preserve original observed facts when possible.
