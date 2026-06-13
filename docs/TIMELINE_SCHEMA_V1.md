# Timeline Schema V1

Status: draft schema contract. Runtime Zod validation exists for the event
envelope and for these initial payload families:
`media.track.topology_observed`, `media.track.discovered`,
`media.segment.observed`, `media.gap.detected`, `diagnostic.note`,
`diagnostic.duration_mismatch`, `diagnostic.media_tool_output`,
`room.state.changed`, `chat.message.observed`, `network.disconnected`,
`network.reconnected`, `session.intent_selected`,
`session.credential_selected`, `session.credential_failover`, and
`session.credential_missing`. Archive validation reports
`payload.schema_invalid` for registered payload families from both snapshot and
streaming validation paths.

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
media.process.*
room.*
chat.*
paid_room.*
network.*
upload.*
export.*
retention.*
diagnostic.*
```

Media processing, upload, retention, and deletion decisions must be modeled as
timeline facts when implemented. They are not invisible background actions:
future consumers must be able to tell which raw facts produced which playable
output, which output was uploaded, which verification passed, and why a local
media file was deleted.

Editable processing plans are derived facts. They may include multiple source
sessions, included ranges, excluded fragments, and output timeline mappings.
They must not rewrite original `session.*` or `media.segment.*` capture facts.

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

Current Chaturbate offline fixture payload fields:

- `playlistReference`: synthetic `fixture://chaturbate/...` reference only;
- `sourceIdHash`: redacted or synthetic source identity;
- `syntheticOnly`: `true`;
- optional `label`, `codec`, `container`, and `timeBase`.

Forbidden payload fields:

- raw signed URLs;
- raw request headers;
- cookies or bearer tokens.

### `media.track.topology_observed`

Records that an adapter observed a media topology before download.

Current Chaturbate offline fixture payload fields:

- `fixtureName`;
- `protocol`: currently `ll-hls-cmaf` for the synthetic CB split-track
  fixture;
- `playlistReference`: synthetic `fixture://chaturbate/...` reference only;
- `trackIds`;
- `syntheticOnly`: `true`.

Forbidden payload fields:

- raw signed URLs;
- raw request headers;
- cookies or bearer tokens.

### `media.segment.observed`

Records that a media segment was discovered or represented by a fixture.

This observation fact is distinct from the stored, `relativePath`-bearing segment
fact validated by `mediaSegmentFactV1Schema` in `segmentValidation.ts`. The
observation payload schema requires `trackId` and `segmentId`, validates known
timing fields when present, and allows extra keys; it does not require
`redactionStatus` or a stored file reference.

Required payload fields:

- `trackId`;
- `segmentId`.

Current Chaturbate offline fixture payload fields:

- `sourceSequence`;
- `mediaStartMs`;
- `durationMs`;
- `playlistReference`: synthetic `fixture://chaturbate/...` reference only;
- `syntheticOnly`: `true`.

Forbidden payload fields:

- raw signed URLs;
- raw request headers;
- cookies or bearer tokens.

### `media.gap.detected`

Records an observed or modeled gap in media evidence. A gap is a media fact, so
its canonical payload carries the gap geometry at the top level. Diagnostic
annotations are optional extras on the same fact; a separate `diagnostic.*` fact
is not required for a gap.

Required payload fields (validated by the payload schema):

- `trackId`;
- `previousSegmentId`;
- `nextSegmentId`;
- `gapStartMs`;
- `gapEndMs`;
- `durationMs`.

Optional annotation fields (allowed, not required):

- `level`: `warning` or `error`;
- `code`: currently `media_gap.detected`;
- `evidenceLevel`: currently `synthetic-contract` for committed fixtures;
- `message`: synthetic or redacted explanation;
- `affectedTrackIds`: track ids affected by the gap;
- source-sequence hints such as `expectedNextSourceSequence` /
  `observedNextSourceSequence`;
- `syntheticOnly`: `true` for committed fixtures.

Both the Chaturbate split-track diagnostic fixture and the Stripchat combined
fixture emit this top-level structured shape. The Chaturbate fixture also keeps
the diagnostic annotations so the maintenance inspector can surface gap findings.

Evidence note:

- The committed gap fixtures are synthetic contract tests. They prove that
  Chronarium can store and query the fact shape; they do not prove current
  live-site behavior.

Forbidden payload fields:

- raw signed URLs;
- raw request headers;
- cookies or bearer tokens.

### `room.state.changed`

Records a room-state observation.

Required payload fields:

- `state`.

Current Stripchat offline fixture payload fields:

- `state`: synthetic room state such as `online`;
- optional `viewerCount`;
- optional `showMode`;
- optional `topic`;
- `syntheticOnly`: `true`.

### `chat.message.observed`

Records a chat message when supported and allowed.

Required payload fields:

- `messageId`;
- `authorRef`;
- `body`;
- `redactionStatus`.

Chat fixtures must be synthetic or heavily redacted.

Current Stripchat offline fixture payload fields:

- `messageId`: synthetic message id;
- `authorRef`: synthetic or redacted author reference, never a raw username;
- `body`: synthetic or redacted message body;
- `redactionStatus`: currently `synthetic` for committed fixtures;
- optional `role`;
- `syntheticOnly`: `true`.

### `session.intent_selected`

Records the capture intent selected for a session or task. It must never carry
raw credential material.

Required payload fields:

- `intent`: one of `public`, `ticket`, `private`, `spy`.

Optional payload fields:

- `selectionPolicy`;
- `syntheticOnly`.

### `session.credential_selected`

Records which redacted credential reference was selected for a gated capture.

Required payload fields:

- `credentialRef`: redacted object with `profileId`;
- `intent`.

Optional payload fields:

- `entitlementMatched`: redacted entitlement metadata (`intent`, `scope`);
- `syntheticOnly`.

### `session.credential_failover`

Records a switch from one redacted credential reference to another.

Required payload fields:

- `fromRef`;
- `toRef`;
- `intent`;
- `reason`.

### `session.credential_missing`

Records that no usable credential was available for a gated capture. This fact
supports "skip gated capture but continue monitoring" behavior.

Required payload fields:

- `intent`;
- `reason`.

Forbidden payload fields for all session credential facts:

- raw cookies;
- request headers;
- bearer tokens;
- signed URLs;
- account passwords or full account identifiers.

### `diagnostic.note`

Records a diagnostic observation.

Required payload fields:

- `level`;
- `message`.

Diagnostics must not leak secrets.

### `diagnostic.duration_mismatch`

Records a duration mismatch between media tracks or between source facts and a
derived artifact.

Current Chaturbate diagnostic fixture payload fields:

- `level`: `warning` or `error`;
- `code`: currently `media_tool.duration_mismatch`;
- `evidenceLevel`: currently `synthetic-contract` for committed diagnostic
  fixtures;
- `message`: synthetic or redacted explanation;
- `affectedTrackIds`: track ids involved in the comparison;
- `evidence`: JSON object with compared durations, such as `videoDurationMs`,
  `audioDurationMs`, `differenceMs`, and a comparison label;
- `syntheticOnly`: `true` for committed fixtures.

The current fixture is synthetic only. A real duration mismatch diagnosis later
must cite approved source facts or redacted media-tool output.

Forbidden payload fields:

- raw signed URLs;
- raw request headers;
- cookies or bearer tokens.

### `diagnostic.media_tool_output`

Records diagnostic evidence that would normally come from a downloader,
ffprobe, FFmpeg, or another approved media tool boundary.

Current Chaturbate diagnostic fixture payload fields:

- `level`: `warning` or `error`;
- `code`: currently one of `media_tool.audio_track_missing` or
  `media_tool.output_stalled`;
- `evidenceLevel`: currently `synthetic-contract` for committed diagnostic
  fixtures;
- `message`: synthetic or redacted explanation;
- `affectedTrackIds`: track ids affected by the tool observation;
- `evidence`: JSON object with synthetic evidence, such as expected and
  observed track kinds, last observed segment ids, or no-progress duration;
- `syntheticOnly`: `true` for committed fixtures.

The current fixture does not execute media tools. It only proves the timeline,
archive, and index shape for these diagnostic facts.

Forbidden payload fields:

- raw signed URLs;
- raw request headers;
- cookies or bearer tokens.

### `network.disconnected`

Records an observed or modeled network interruption that can explain later
media gaps, adapter retries, or reconnect behavior.

Required payload fields:

- `reason`: synthetic or redacted explanation.

Current Stripchat offline fixture payload fields:

- `reason`: synthetic interruption reason;
- optional `affectedTrackIds`;
- `syntheticOnly`: `true`.

### `network.reconnected`

Records that the adapter or modeled source recovered after a network
interruption.

Required payload fields:

- `disconnectedEventId`: event id of the related `network.disconnected` fact.

Current Stripchat offline fixture payload fields:

- `disconnectedEventId`;
- optional `outageDurationMs`;
- optional `affectedTrackIds`;
- `syntheticOnly`: `true`.

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
