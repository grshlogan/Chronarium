# Archive Format V1

Status: draft storage contract. The initial package code defines boundaries
only; a complete archive writer is not implemented yet.

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
    video/
      track.json
      segments/
    audio/
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
- `tracks/**/track.json` describes track-level metadata.
- `tracks/**/segments/` stores media segment files or synthetic placeholders.
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

## Path Rules

- Archive-relative paths must use forward slashes.
- Paths must not be absolute.
- Paths must not contain `..`.
- Paths must not point outside the package root after normalization.
- Writers must not silently overwrite an existing archive package.
- Destructive cleanup must require explicit user intent and a bounded target.

## Write Safety

The future writer should use:

- create-new semantics for package roots;
- temporary files in the same filesystem when replacing small metadata files;
- append-only writes for JSONL streams;
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
