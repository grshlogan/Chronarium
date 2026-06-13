# Chronarium Product Spec

Status: draft product specification for the first project foundation. This file
describes intended behavior and constraints; it is not a claim that the
features are implemented.

## Product Promise

Chronarium is a local-first livestream archive and replay platform. Its primary
artifact is a replayable session archive that preserves media, timeline facts,
room state, chat, diagnostics, and capture decisions.

Chronarium is not a plain video downloader. Exported MP4, MKV, clips, and
reports are derived artifacts.

## Primary Users

- A local user who wants durable, inspectable livestream archives.
- A maintainer who needs to diagnose capture gaps, sync issues, adapter
  failures, and replay inconsistencies.
- A future AI agent or developer who needs clear contracts, fixtures, and small
  package boundaries before changing behavior.

## Core Objects

- `LiveSession`: one captured livestream session.
- `ReplayPackage`: one on-disk `.chron` archive for a `LiveSession`.
- `Timeline`: append-friendly fact stream for the session.
- `MediaTrack`: logical audio, video, subtitle, or data track.
- `RoomEvent`: room-state fact in session time.
- `ChatEvent`: chat/message fact in session time.
- `DiagnosticEvent`: capture, adapter, network, media, or export diagnostic
  fact.
- `Export`: derived output that can be rebuilt from preserved facts when enough
  source data exists.

## MVP Scope

The first useful Chronarium milestone should prove the archive and timeline
model before connecting to real sites:

1. Create a TypeScript workspace with shared contracts.
2. Define archive manifest, timeline event, media track, session, and adapter
   message boundaries.
3. Create synthetic fixtures for sessions, timeline events, and adapter facts.
4. Add a local `.chron` writer after the contracts are stable.
5. Add validation for manifest and timeline consistency.
6. Add a minimal replay or inspection surface for fixture packages.
7. Add the first Chaturbate adapter harness in fixture mode only.

## Non-Goals For The First Foundation

- No real livestream capture.
- No account login, cookie, header, token, or signed URL handling.
- No production recorder migration.
- No generic all-sites abstraction that hides provider-specific media behavior.
- No arbitrary shell execution exposed to GUI, adapters, config, or plugins.
- No claim of pixel-perfect replay guarantees.

## User Workflows

### Create A Fixture Session

The user or test harness creates synthetic session metadata, media-track facts,
timeline events, and diagnostics. Chronarium should be able to validate the
facts without touching a live site.

### Maintain Streamers

The user adds a streamer by link and Chronarium maintains that streamer until
the user pauses or removes monitoring. The normal recording path is automatic:
Chronarium checks streamer state on a schedule or on demand, records when the
streamer is live, finalizes the archive when the stream ends, then continues
monitoring for the next session. The recording GUI should expose pause
monitoring, resume monitoring, and check now controls rather than a manual
"start recording" button.

### Inspect A Session Archive

Chronarium should load a `.chron` package, read the manifest and timeline, show
media/event state, and explain gaps or diagnostics.

### Replay A Session

The replay surface should reconstruct media and overlays from archive facts.
Room events, chat, paid/private state, network diagnostics, and media decisions
should be tied to session time.

### Export Derived Media

Exports should be generated from preserved facts and media tracks. Exported
files are not the source of truth and may be deleted or rebuilt.

### Process And Retain Media

Chronarium should treat disk space as a first-class product constraint, but
media retention and upload must be configurable policy rather than mandatory
release behavior. Raw media segments are captured as evidence, then may be
processed after the session into playable compressed outputs when enough source
data exists. Both raw hashes and processed-output hashes should be recorded
because they prove different things: raw hashes prove what Chronarium captured,
while output hashes prove what was produced, uploaded, or safely deleted.

For the project owner's local deployment, the preferred policy is to delete raw
media after verified processing, then upload processed outputs on schedule and
delete local outputs after upload verification. Public releases should expose
that as an optional policy, not force it on every user. See
`docs/MEDIA_LIFECYCLE_AND_RETENTION.md`.

Processing must be editable rather than overly strict. If recording was
interrupted, restarted, or produced many tiny fragments, Chronarium should be
able to merge multiple source sessions, exclude unusable fragments, and record
the edit plan as derived facts. This must not rewrite the original raw capture
facts.

### Diagnose A Failure

The maintainer should be able to answer:

- Which facts were observed?
- Which facts were interpreted by Chronarium?
- Which adapter emitted them?
- Which media segment or time range was affected?
- Which sensitive fields were redacted or intentionally omitted?

## Quality Attributes

- Local-first: archives and indexes live on the user's machine.
- Append-friendly: timeline writes must be durable and ordered.
- Fixture-first: site behavior must be reproducible offline before live capture.
- Schema-first: event and protocol contracts must be explicit.
- Privacy-preserving: secrets and private data must not enter committed files or
  shareable diagnostics.
- AI-maintainable: small modules, plain file formats, and accurate handoff docs.

## Current Implementation Status

As of 2026-06-13, the project has a minimal executable validation chain:
synthetic fixture data can be runtime-validated and written into a local
`.chron` package skeleton. The archive package can write, read, and validate
synthetic manifests, timeline JSONL, media-track metadata, and synthetic segment
bytes. Validation now includes basic referenced-file checks for
`media.segment.*` facts with `relativePath`, and the package exposes bounded
timeline readers so new consumers do not have to depend only on full
`timelineEvents` arrays.

The first SQLite indexer can derive query rows from synthetic archives for
archive metadata, timeline events, and validation issues, and now consumes the
timeline batch reader. The first core archive/index service can call archive
validation, archive reading, reindex, and index queries. A minimal core runtime
lifecycle shell can start, stop, report health, expose that service, and
optionally hold an adapter manifest catalog. Core also has a fixture-only task
scheduler, adapter lifecycle host, offline capture-like pipeline, adapter
catalog preflight gate, adapter worker JSONL parser, typed worker command
descriptor builder, and no-spawn worker supervisor harness. These worker pieces
do not launch real child processes.

`packages/adapters/chaturbate` contains fixture-only split audio/video
synthetic fixtures and diagnostics. `packages/adapters/stripchat` contains the
first non-Chaturbate fixture-only combined A/V scaffold. `packages/media-tools`
contains typed FFmpeg/ffprobe command builders only; it does not execute media
tools.

`apps/desktop` contains a static Web-first React/Vite recording dashboard shell
using synthetic data only. The dashboard models streamer monitoring as the
primary operation, with pause/resume/check controls and an offline self-test
diagnostic action instead of a manual start recording action. Electron shell,
preload/IPC, live GUI-core binding, live task execution, real adapter child
process launching, real media capture/probing, archive repair/migration, replay
player, and real site adapters remain unimplemented.

## Open Product Decisions

- Exact `.chron` migration strategy after v1.
- Public fixture policy.
- GUI information architecture.
- Adapter update and distribution model.
- Export format priority.
