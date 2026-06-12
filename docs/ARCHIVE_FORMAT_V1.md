# Archive Format V1

Status: draft storage contract. A fixture-safe writer now creates a minimal
`.chron` package with `manifest.json`, `timeline.jsonl`, and top-level
directories. A first reader/validator now reads `manifest.json` and
`timeline.jsonl` and reports basic consistency issues. The writer/reader now
support fixture-safe media-track metadata at `tracks/<track-id>/track.json`.
The archive package also exposes the first timeline record iterator and bounded
batch reader so future consumers do not have to receive a full `timelineEvents`
array. Real media segment writing, repair, and migration behavior are not
implemented yet.

## Purpose

A Chronarium archive is a local directory package for one `LiveSession`. It is
designed to preserve facts first and derive videos, reports, and clips later.

The archive must be inspectable with ordinary file tools. JSON files and JSON
Lines logs are preferred for durable facts.

## Package Extension

The working package suffix is:

```text
<session-id>.chron/
```

The suffix is a directory convention, not a compressed format.

## Required Layout

```text
<session-id>.chron/
  manifest.json
  timeline.jsonl
  tracks/
    <track-id>/
      track.json
      segments/
  events/
    room.jsonl
    chat.jsonl
    paid-room.jsonl
  diagnostics/
    adapter.jsonl
    network.jsonl
    gap-decisions.jsonl
  exports/
    README.md
```

Not every substream must contain records, but the top-level meaning of each
path is reserved by v1.

## Source Of Truth

- `manifest.json` describes stable package metadata, schema versions, path
  locations, session identity, track inventory, and generation metadata.
- `timeline.jsonl` is the session-level fact stream and primary replay input.
- `tracks/<track-id>/track.json` describes track-level metadata.
- `tracks/<track-id>/segments/` stores future media segment files or synthetic
  placeholders.
- `events/*.jsonl` stores domain-specific event streams when splitting improves
  inspection or replay.
- `diagnostics/*.jsonl` stores diagnostic facts.
- `exports/` contains derived outputs and may be deleted or rebuilt.

SQLite indexes are caches and state stores outside or beside this package. They
are not the only replay truth.

## Manifest Minimum Shape

```json
{
  "archiveFormatVersion": 1,
  "archiveId": "archive-synthetic-001",
  "session": {
    "id": "session-synthetic-001",
    "schemaVersion": 1,
    "site": {
      "siteId": "synthetic",
      "redactionStatus": "synthetic"
    },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "status": "imported"
  },
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "schemaVersions": {
    "timeline": 1,
    "adapterProtocol": 1
  },
  "timeline": {
    "path": "timeline.jsonl"
  },
  "tracks": [],
  "paths": {
    "timeline": "timeline.jsonl",
    "events": "events",
    "tracks": "tracks",
    "diagnostics": "diagnostics",
    "exports": "exports"
  },
  "generator": {
    "name": "chronarium"
  }
}
```

## JSON Lines Rules

- One complete JSON object per line.
- Lines are appended in monotonic local sequence order for a single session.
- A writer must flush safely enough that a partial final line can be detected.
- Readers must reject or quarantine invalid lines instead of silently accepting
  corrupted facts.
- Redacted fields must stay redacted when re-indexed or exported.

The current fixture-safe validator reports invalid JSONL, schema-invalid lines,
duplicate event IDs, sequence gaps, session mismatches, manifest event-count
mismatches, manifest last-sequence mismatches, missing or invalid media-track
metadata, media-track manifest mismatches, and unsafe archive-relative paths.
It does not yet repair or quarantine corrupted records.

For large archives, callers should prefer the streaming-shaped timeline entry
points:

- `iterateTimelineRecords(options)` yields one parsed event or one validation
  issue per JSONL line.
- `readTimelineEventBatches(options)` yields bounded batches of parsed events
  and issues.

The older `readFileArchive` and `validateFileArchive` snapshot APIs remain for
small fixtures and simple workflows. They still expose full `timelineEvents`
arrays, so new GUI, indexer, replay, and maintenance code should avoid making
that shape their only dependency.

The current fixture-safe writer rejects preventable timeline errors before
writing: missing manifest, session mismatch, non-contiguous sequence, duplicate
event ID, and appends after finalization.

## Media Track Metadata

The current fixture-safe writer can write synthetic track metadata:

```text
tracks/<track-id>/track.json
tracks/<track-id>/segments/
```

`manifest.json` keeps the track inventory in `tracks`, and each declared track
must have matching metadata at `tracks/<track-id>/track.json`.

The first implementation enforces:

- track `sessionId` must match the manifest session;
- track IDs must not repeat in one writer session;
- `segmentsPath` must be `tracks/<track-id>/segments`;
- track metadata must match the manifest-declared track identity and kind;
- `segments/` is only a boundary directory for future media segment files.

It does not write, read, hash, probe, or remux real media segments yet.

## Path Rules

- Archive-relative paths must use forward slashes.
- Paths must not be absolute.
- Paths must not contain `..`.
- Paths must not point outside the package root after normalization.
- Writers must not silently overwrite an existing archive package.
- Destructive cleanup must require explicit user intent and a bounded target.

## Write Safety

The current writer already uses or enforces:

- create-new semantics for package roots;
- temporary files in the same filesystem when replacing small metadata files;
- append-only writes for JSONL streams;
- manifest-before-timeline ordering;
- fixture-safe media-track metadata writes;
- contiguous timeline sequences for one writer session;
- duplicate event ID rejection for one writer session;
- no appends after finalization.

Future writer work should add:

- atomic finalization for `manifest.json` updates where feasible;
- explicit recovery behavior for interrupted writes.

## Sensitive Data

V1 archives must not contain raw cookies, headers, bearer tokens, signed URLs,
account identifiers, private room details, or personal data in committed
fixtures or shareable diagnostics.

When a source fact contains sensitive material, the archive should store one of:

- a redacted placeholder;
- a stable hash;
- a local-only reference that is excluded from shareable bundles;
- no field at all, with a diagnostic explaining the omission when useful.

## Versioning

- `archiveFormatVersion` starts at `1`.
- Timeline and adapter protocol versions are tracked separately.
- Future migrations must be explicit and should preserve original facts when
  possible.
- A v1 reader may reject newer major versions with a clear diagnostic.
