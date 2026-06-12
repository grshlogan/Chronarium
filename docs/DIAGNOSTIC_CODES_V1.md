# Diagnostic Codes V1

Status: registry document. The Implemented Registry section reflects the
`ArchiveValidationIssueCode` union that exists in
`packages/archive/src/validator.ts` today and is stored by the SQLite indexer.
The Timeline Diagnostic Payload Code Registry section reflects codes that
appear inside committed synthetic timeline diagnostic fixture payloads. All
Reserved sections are drafts: no production emitting code exists for them, and
their candidate names may change until first implementation.

## Purpose

Diagnostic codes are stable identifiers for validation and diagnostic
conditions. They are not log strings. They are stored data:

- every `ArchiveValidationIssue` produced by the archive validator carries a
  `code`;
- the indexer persists issues into the `archive_validation_issues` table in
  `packages/indexer/src/schema.ts`, whose `code` column is indexed for
  grouping and lookup;
- the planned GUI (see `docs/GUI_CORE_PROTOCOL.md`) will show codes to users
  and group them;
- the planned maintenance layer (see `docs/MAINTENANCE_OPS_DESIGN.md`) will
  classify stored issues into maintenance findings by code.

Because codes end up in index rows, reports, and potentially shared
diagnostics, they must be treated like a storage contract, with the same
discipline as `docs/ARCHIVE_FORMAT_V1.md` and `docs/TIMELINE_SCHEMA_V1.md`
apply to on-disk shapes.

A stored issue row conceptually looks like this synthetic example:

```json
{
  "severity": "error",
  "code": "timeline.invalid_jsonl",
  "message": "Timeline JSONL line is not valid JSON.",
  "path": "timeline.jsonl",
  "line": 5
}
```

## Naming Rules

Codes use the format:

```text
area.problem
```

- `area` is a single lowercase token naming the subsystem or artifact the
  diagnostic is about. Implemented areas today are `archive`, `manifest`,
  `timeline`, and `track`.
- `problem` is a lowercase snake_case description of the condition, such as
  `missing_file` or `sequence_gap`.
- Codes are never reused or repurposed. A code that once meant one thing must
  never be redefined to mean another.
- Renaming a code means adding a new code and deprecating the old one. The
  old code keeps its meaning forever.
- Every new code requires three things before it ships:
  - a registry entry in this document;
  - emitting code in a package;
  - a test fixture that produces the code.

## Severity Model

The implemented severity type is `ArchiveValidationSeverity` in
`packages/archive/src/validator.ts`:

```text
error
warning
```

Note that every issue the validator currently emits uses `error`. The
`warning` severity exists in the type but has no emitting code path today.

The maintenance finding model drafted in `docs/MAINTENANCE_OPS_DESIGN.md`
uses a wider severity scale for user-facing findings:

```text
info | warning | error | critical
```

The intended direction is one-way: validation severities feed finding
severities. A future classifier should map stored validation issues into
maintenance findings, possibly escalating (for example, many `error` issues
on one archive could become a `critical` finding) or contextualizing them.
That mapping is a draft and is not implemented; nothing translates validator
severities into finding severities today.

## Stability Promise

Once a code has been stored in index rows or included in a report a user may
have shared, its meaning is frozen:

- the condition the code describes must not be broadened, narrowed, or
  redefined;
- the code must not be deleted from this registry;
- if the condition needs to be split or refined, new codes are added and the
  old code is deprecated;
- deprecated codes remain documented here so that old index rows and old
  reports stay interpretable.

Deprecation is the only allowed end state. There is no removal.

## Implemented Registry

These twenty-six codes are exactly the members of `ArchiveValidationIssueCode`
in `packages/archive/src/validator.ts`. Two validator entry points emit
them: `validateFileArchive` (reads a Replay Package from disk) and
`validateArchiveSnapshot` (checks already-parsed in-memory data).

### archive.*

- `archive.root_not_directory`: the archive root path exists but is not a
  directory. Emitted by `validateFileArchive`.
- `archive.missing_file`: a required archive file (the root, the manifest,
  or the timeline) could not be read. Emitted by `validateFileArchive`.
- `archive.unsafe_path`: a manifest-declared archive-relative path is
  absolute or escapes the archive root. Emitted by `validateFileArchive`.

### manifest.*

- `manifest.invalid_json`: the archive manifest file is not valid JSON.
  Emitted by `validateFileArchive`.
- `manifest.schema_invalid`: the manifest parsed as JSON but failed schema
  validation. Emitted by `validateFileArchive`.
- `manifest.timeline_path_mismatch`: `timeline.path` in the manifest does
  not match `paths.timeline`. Emitted by `validateFileArchive`.

### track.*

- `track.missing_file`: a MediaTrack metadata file declared by the manifest
  could not be read. Emitted by `validateFileArchive`.
- `track.invalid_json`: a MediaTrack metadata file is not valid JSON.
  Emitted by `validateFileArchive`.
- `track.schema_invalid`: MediaTrack metadata parsed as JSON but failed
  schema validation. Emitted by `validateFileArchive`.
- `track.session_mismatch`: a MediaTrack's `sessionId` does not match the
  manifest's LiveSession id. Emitted by `validateFileArchive` and
  `validateArchiveSnapshot`.
- `track.manifest_mismatch`: MediaTrack metadata disagrees with the manifest
  track entry (a missing counterpart, reported by snapshot validation only,
  or differing id, kind, or segments path). Emitted by `validateFileArchive`
  and `validateArchiveSnapshot`.
- `track.segments_path_mismatch`: a MediaTrack's `segmentsPath` does not
  match the expected layout-derived path for its track id. Emitted by
  `validateFileArchive` and `validateArchiveSnapshot`.
- `track.unsafe_path`: a track id produces an unsafe metadata or segments
  path that would escape the archive root. Emitted by `validateFileArchive`
  and `validateArchiveSnapshot`.

### segment.*

- `segment.schema_invalid`: a `media.segment.*` timeline event that references
  a segment file has a payload that does not match the `MediaSegmentFact`
  schema. Emitted by `validateFileArchive` and `validateFileArchiveStreaming`.
- `segment.track_unknown`: a referenced segment file belongs to a track id not
  declared by the manifest and validated track metadata. Emitted by
  `validateFileArchive` and `validateFileArchiveStreaming`.
- `segment.unsafe_path`: a referenced segment `relativePath` is absolute or
  escapes the archive root. Emitted by `validateFileArchive` and
  `validateFileArchiveStreaming`.
- `segment.path_mismatch`: a referenced segment path is not under the owning
  track's `segmentsPath`. Emitted by `validateFileArchive` and
  `validateFileArchiveStreaming`.
- `segment.missing_file`: a referenced segment path could not be read as a
  file. Emitted by `validateFileArchive` and `validateFileArchiveStreaming`.
- `segment.byte_length_mismatch`: a referenced segment file exists, but its
  byte size does not match the timeline fact's `byteLength`. Emitted by
  `validateFileArchive` and `validateFileArchiveStreaming`.

### timeline.*

- `timeline.invalid_jsonl`: a timeline line is empty or is not valid JSON.
  Emitted by `validateFileArchive`.
- `timeline.schema_invalid`: a timeline line parsed as JSON but failed
  event-envelope schema validation. Emitted by `validateFileArchive`.
- `timeline.duplicate_event_id`: the same `eventId` appears more than once
  in the timeline. Emitted by `validateFileArchive` and
  `validateArchiveSnapshot`.
- `timeline.sequence_gap`: an event's `sequence` is not the expected next
  value. Emitted by `validateFileArchive` and `validateArchiveSnapshot`.
- `timeline.session_mismatch`: an event's `sessionId` does not match the
  manifest's LiveSession id. Emitted by `validateFileArchive` and
  `validateArchiveSnapshot`.
- `timeline.event_count_mismatch`: the manifest's declared `eventCount` does
  not match the number of valid events read. Emitted by
  `validateFileArchive` and `validateArchiveSnapshot`.
- `timeline.last_sequence_mismatch`: the manifest's declared `lastSequence`
  does not match the last event's sequence. Emitted by
  `validateFileArchive` and `validateArchiveSnapshot`.

## Reserved Areas

The following areas are RESERVED for archive validation or future durable
diagnostic outputs. No production emitting code exists for any of them.
Candidate names listed here are drafts unless they are also listed in the
Timeline Diagnostic Payload Code Registry below; only the area tokens
themselves are reserved.

- `segment.*`: now implemented for basic referenced-file existence, path, and
  byte-length checks. Future segment checks may add hash mismatches, duration
  anomalies, and media probing diagnostics. Related design context lives in
  `docs/CB_RECORDING_REFERENCES.md` and `docs/MEDIA_TOOLS_BOUNDARY.md`.
- `recovery.*`: interrupted-write recovery diagnostics for `.chron`
  packages, such as detected partial writes or recovered timelines. See
  `docs/plan/plan_archive_recovery.md`.
- `index.*`: SQLite index staleness and consistency checks, such as index
  rows that no longer match archive truth.
- `adapter.*`: Adapter Worker runtime failures, such as parse errors,
  unexpected exits, or protocol violations. See `docs/ADAPTER_PROTOCOL.md`.
- `media_gap.*`: media gap diagnostics preserved as timeline facts. The first
  committed synthetic fixture uses `media_gap.detected`.
- `media_tool.*`: external media tool diagnostics. Candidate examples include
  `media_tool.audio_track_missing`, `media_tool.duration_mismatch`,
  `media_tool.output_stalled` (output stopped growing while the tool process
  stayed alive), and `media_tool.exit_nonzero` (tool exited with a failure
  status), following the watchdog lessons in
  `docs/CB_RECORDING_REFERENCES.md` and the boundary in
  `docs/MEDIA_TOOLS_BOUNDARY.md`.
- `maintenance.*`: diagnostics produced by the maintenance layer itself, per
  `docs/MAINTENANCE_OPS_DESIGN.md`.
- `protocol.*`: GUI/core protocol errors, per `docs/GUI_CORE_PROTOCOL.md`. A
  candidate example is `protocol.version_mismatch` (a message arrived with an
  unsupported `protocolVersion`). Adapter protocol violations belong to
  `adapter.*`, not here.
- `replay.*`: replay reconstruction diagnostics, per
  `docs/REPLAY_MODEL_V1.md`.
- `export.*`: export and derived-artifact diagnostics, such as duration loss
  in a derived mux.
- `storage.*`: disk space and storage health diagnostics, such as free space
  below a configured floor.

## Timeline Diagnostic Payload Code Registry

These codes currently appear only in committed synthetic Chaturbate diagnostic
fixtures under `packages/adapters/chaturbate/fixtures/`. They are stored inside
timeline event payloads, not emitted by `packages/archive/src/validator.ts` and
not stored in `archive_validation_issues`.

Evidence level:

- synthetic contract fixture only;
- proves Chronarium can store, validate, read, and index the fact shape;
- does not prove current live Chaturbate behavior;
- real compatibility evidence must come later from separately approved,
  redacted samples or synthetic reproductions derived from approved local
  evidence.

### media_gap.*

- `media_gap.detected`: a media gap was observed or modeled between media
  evidence points. Current fixture event type: `media.gap.detected`.

### media_tool.*

- `media_tool.audio_track_missing`: an expected audio track was absent in the
  modeled topology. Current fixture event type:
  `diagnostic.media_tool_output`.
- `media_tool.duration_mismatch`: compared media durations did not match.
  Current fixture event type: `diagnostic.duration_mismatch`.
- `media_tool.output_stalled`: no new media evidence arrived while the modeled
  tool process remained alive. Current fixture event type:
  `diagnostic.media_tool_output`.

## Relationship To Timeline Events

`docs/TIMELINE_SCHEMA_V1.md` reserves a `diagnostic.*` event family. Event
types and diagnostic codes are different things:

- a `diagnostic.*` value such as `diagnostic.note` is a timeline event type:
  it names a kind of timeline record;
- a diagnostic code such as `timeline.sequence_gap` is a classification: it
  names a condition that was detected;
- a diagnostic event payload may carry a code as a field, so that an event
  records which condition was observed;
- a code is not an event type and must never be used as a `type` value.

A synthetic example of a future diagnostic event carrying a code. The example
is abbreviated and omits required envelope fields such as `schemaVersion`,
`eventId`, `sessionId`, `sequence`, and `capturedAt`; see
`docs/TIMELINE_SCHEMA_V1.md` for the full envelope:

```json
{
  "type": "diagnostic.note",
  "sensitivity": "synthetic",
  "payload": {
    "level": "error",
    "code": "timeline.sequence_gap",
    "message": "Timeline sequence expected 3 but found 5."
  }
}
```

## Redaction Rules

Issue `message` and any detail fields must follow `docs/SECURITY_PRIVACY.md`:

- no cookies, headers, tokens, signed URLs, account identifiers, private
  room details, or personal data in messages or stored issue rows;
- archive-relative paths (such as `timeline/events.jsonl`) are fine and are
  the preferred way to point at evidence;
- absolute local paths may appear only in local-only surfaces, such as a
  validation report a user inspects on their own machine; they must not be
  placed in shareable diagnostics without explicit user intent;
- examples in this registry and in fixtures must be synthetic, and fixture
  events should use the `synthetic`, `safe`, or `redacted` sensitivity
  labels.

## Evolution

- Adding a new code is a minor change: add the registry entry here, the
  emitting code, and a test fixture, in line with the Naming Rules above.
- Changing the meaning of an existing code is forbidden. Refinement always
  happens through new codes plus deprecation.
- Adding a new area token should be deliberate and documented in this file
  before any code in that area ships.

### Deprecated Codes

No codes are deprecated yet. When a code is deprecated, it moves here with
its original meaning, the replacement code, and the date of deprecation.
