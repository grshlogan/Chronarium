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

As of 2026-06-11, the project is entering the workspace skeleton phase. The
initial code packages define contracts and placeholders only. GUI, core runtime,
archive writer, SQLite index, media tooling, player, and real adapters remain
unimplemented.

## Open Product Decisions

- Exact `.chron` migration strategy after v1.
- Public fixture policy.
- GUI information architecture.
- Adapter update and distribution model.
- Export format priority.
