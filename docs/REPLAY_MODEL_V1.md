# Replay Model V1

Status: draft design contract. A first fixture-safe replay reader now exists in
`packages/player` (`buildReplayTimeline` + `reconstructRoomStateAt`, pure
functions over a timeline event array) covering milestone (a) and a slice of (b);
no media playback, segment alignment, GUI, or archive-read integration exists
yet. The repository today has a fixture-safe `.chron` writer,
reader/validator, a rebuildable SQLite indexer, and a minimal core
archive/index service. This document defines the target semantics that future
replay work must satisfy.

## Purpose

Replay is the primary consumer of a `.chron` Replay Package. The Player is a
core product surface, not an optional viewer, so the storage design must be
validated against what replay needs rather than what capture happens to
produce.

This document exerts reverse pressure on `docs/ARCHIVE_FORMAT_V1.md` and
`docs/TIMELINE_SCHEMA_V1.md`:

- if a preserved fact cannot be positioned, ordered, or explained at replay
  time, the storage contract is incomplete;
- if replay would need data the archive does not preserve, the gap belongs in
  those contracts, not in player-side guessing.

When this model and a storage contract disagree, the disagreement must be
resolved explicitly in the storage doc, not papered over in a future player.

## Replay Definition

Replay builds on the Perfect Replay Definition in `docs/CONTEXT.md`: an
engineering target, not a promise of pixel-for-pixel reconstruction.

A replay of one `LiveSession` should:

- play audio and video with the best alignment the preserved facts allow;
- show room events, chat, and paid/private state in session time;
- explain gaps, disconnects, reconnects, cuts, and capture decisions instead
  of hiding them (export choices, the last item in the `docs/CONTEXT.md`
  definition, are explained at export time rather than during replay);
- distinguish observed facts from Chronarium's later interpretations at every
  presentation surface.

A replay that silently smooths over missing evidence is worse than one that
honestly shows a labeled hole.

## Replay Inputs

Replay reads only the Replay Package. The planned inputs are:

- `manifest.json`: package identity, session identity, schema versions, track
  inventory, and path locations;
- `timeline.jsonl`: the session-level fact stream and primary replay input;
- `tracks/<track-id>/track.json` and `tracks/<track-id>/segments/`: per-track
  metadata and future media segment evidence;
- `events/*.jsonl`: domain-specific event lanes (room, chat, paid-room) when
  split out of the main timeline;
- `diagnostics/*.jsonl`: optional lanes that explain capture behavior; replay
  may surface them but must not require them to position media or events.

Explicitly NOT replay inputs:

- `exports/`: derived artifacts that may be deleted and rebuilt at any time;
  replay must not depend on their existence;
- SQLite: an acceleration cache and state store beside the package, never a
  source of truth. Replay must work from the archive alone, on a machine that
  has never built an index.

If a retention policy has deleted local raw media or processed outputs, replay
must degrade honestly: timeline, chat, room state, diagnostics, and media
availability facts can still be shown, but full media playback requires local
media evidence or a future verified restore path from uploaded artifacts.

For merged or edited outputs, replay must distinguish the original capture
timeline from the derived output timeline. A processed output may skip tiny
fragments, merge restarted sessions, or insert synthetic gap fill, but those
choices are replayed as edit decisions and source-range mappings rather than as
changes to the original session facts.

## The Replay Clock

The replay clock mirrors the time model in `docs/TIMELINE_SCHEMA_V1.md`.
Replay must keep ordering and positioning as separate concerns:

```text
ordering authority:    sequence (monotonic local integer, assigned by core)
positioning:           monotonicMs when present
positioning fallback:  capturedAt deltas (approximate)
display annotation:    sourceTime (never a positioning authority)
```

Rules:

- `sequence` is the only ordering authority. Two events never swap order
  because of timestamp disagreement.
- `monotonicMs` positions an event on the replay clock when present.
- When `monotonicMs` is missing, the player should fall back to deltas between
  `capturedAt` values. These positions are approximate.
- `sourceTime` is what the site or media source reported. It is displayed as
  an annotation and is never used to position or reorder events.

The session epoch is the first timeline event. All replay-clock positions are
expressed relative to that epoch.

When positions are derived from the `capturedAt` fallback, the player must
mark them as approximate rather than invent precision. Preserving uncertainty
is part of the contract, not a degraded mode.

## Media Time Mapping

Each `MediaTrack` carries its own media presentation time. Replay must map
that media time onto session time through anchor facts: future
`media.segment.*` events that carry both a media-time position and a
session-time anchor for the same `MediaSegment`.

A synthetic illustration of the planned anchor shape:

```json
{
  "schemaVersion": 1,
  "eventId": "event-synthetic-042",
  "sessionId": "session-synthetic-001",
  "type": "media.segment.observed",
  "sequence": 42,
  "capturedAt": "2026-01-01T00:00:10.000Z",
  "monotonicMs": 10000,
  "sensitivity": "synthetic",
  "payload": {
    "trackId": "video-main",
    "segmentId": "segment-synthetic-0001",
    "mediaTimeMs": 9800,
    "durationMs": 2000
  }
}
```

Alignment rules:

- each track aligns to the session clock independently; tracks never align to
  each other directly;
- split audio and video tracks stay separate facts in the archive until they
  are muxed for export, consistent with the direction recorded in
  `docs/CB_RECORDING_REFERENCES.md`;
- muxing is a derived operation behind the boundary described in
  `docs/MEDIA_TOOLS_BOUNDARY.md`; replay of preserved tracks must not require
  a prior mux.

If two tracks disagree about session time, that disagreement is a fact worth
showing, not an error to be hidden by silent resampling.

## Seek Model

A seek target is a session time `T` on the replay clock.

```text
seek(T):
  media: for each MediaTrack, locate the segments whose
         [anchor, anchor + duration) range covers T
  state: fold state-bearing events with position <= T,
         applied in sequence order, last-write-wins per state key
  chat:  bounded range query of chat events near T
```

Rules:

- media seek locates covering segments per track using segment anchors and
  durations; tracks with no covering segment at `T` are in a gap state;
- session state at `T` is a fold of state-bearing events (for example
  `room.state.changed` and `paid_room.*`) in `sequence` order up to `T`, where
  the last write wins for each state key;
- the baseline state path is a full timeline scan from the session epoch. It
  is always correct and must always remain available;
- derived state snapshots or SQLite acceleration are optional optimizations.
  They must be rebuildable from the archive and are never authoritative; a
  stale or missing cache degrades speed, never correctness;
- chat near `T` is a bounded range query, not a full-history render.

## Event Presentation Classes

Replay groups timeline facts into presentation classes, because different
shapes of evidence render differently:

- point events: facts at one instant, such as `chat.message.observed`.
  Rendered at a single position, typically in a scrolling or stacked lane.
- state events: facts that set a value which holds until superseded, such as
  `room.state.changed`. Rendered as the current value at the playhead, derived
  from the seek-model fold.
- span facts: facts that describe a duration, such as `media.gap.*` and
  network spans from the `network.*` family. Rendered as ranges on the
  timeline and as overlays during playback.

A future event type should declare which presentation class it belongs to
when its payload schema is added to `docs/TIMELINE_SCHEMA_V1.md`.

## Gaps And Uncertainty

Gaps are first-class facts, not rendering accidents.

- when no media evidence covers a range, replay must say so explicitly, for
  example "no media evidence for this range", instead of silently skipping
  ahead or freezing the last frame without explanation;
- gap and capture-decision diagnostics should be surfaced next to the affected
  range, using the codes planned in `docs/DIAGNOSTIC_CODES_V1.md`;
- any interpolation, smoothing, or inferred fill the player performs must be
  labeled as an Interpretation, never presented as an observed Fact;
- approximate positions from the `capturedAt` fallback must be visually
  distinguishable from `monotonicMs`-anchored positions.

## Finalized Versus Live Archives

The v1 replay target is finalized archives: packages whose writer has
completed and whose manifest is stable.

Read-only replay of an in-progress archive (watching a capture as it grows)
is a future goal, not a v1 requirement. It must not weaken the v1 contract.

Replay must never write to an archive, finalized or not. Repairing an
interrupted or damaged package is recovery work, owned by
`docs/plan/plan_archive_recovery.md`, not by the player.

## Replay Must Never

- mutate an archive, its manifest, its timeline, or its media tracks;
- require network access; replay is a local-first, offline operation;
- require SQLite; the index is an acceleration cache only;
- require `exports/`; derived outputs may be absent or deleted;
- hide media-retention facts; if local media was deleted by policy, replay must
  show that state instead of pretending the captured media is still present;
- surface events marked `contains-sensitive` in shareable form, including
  screenshots, exported reports, or diagnostics bundles. Sensitivity labels
  (`safe`, `synthetic`, `redacted`, `contains-sensitive`, `unknown`) travel
  with events into every replay surface.

## Constraints On Other Contracts

This model places explicit requirements on the storage contracts.

On `docs/TIMELINE_SCHEMA_V1.md`:

- state-bearing event payloads must be reconstructible without site access;
  the fold in the seek model can only use what the payload preserved;
- payloads must be self-contained: replay must not need to resolve external
  references, fetch source URLs, or consult adapter state to render an event.

On `docs/ARCHIVE_FORMAT_V1.md`:

- future media segment metadata must carry a duration and a session-time
  anchor for each `MediaSegment`, so the seek model can locate covering
  segments per track without probing media files.

New replay-driven requirements discovered later should be added to this list
and pushed into the owning contract explicitly.

## Replay Milestones

Planned milestones, smallest first:

- (a) timeline inspector: open a synthetic fixture archive with no media and
  render its timeline events, presentation classes, and diagnostics. This is
  the replay face of the minimal React UI step in the
  `docs/ARCHITECTURE.md` MVP direction, talking to core through the protocol
  drafted in `docs/GUI_CORE_PROTOCOL.md`;
- (b) state reconstruction plus scrubbing: implement the seek-model fold and
  an approximate playhead over the same fixture archive;
- (c) synthetic split-track alignment fixture: a package with separate
  synthetic audio and video track metadata and anchor facts, proving the
  media time mapping without real media;
- (d) real media playback: actual segment decode and aligned playback, which
  depends on real segment writing and the boundary in
  `docs/MEDIA_TOOLS_BOUNDARY.md`.

Each milestone must work from the archive alone, per the inputs contract.

## Open Decisions

- Media playback technology: HTML media elements, Media Source Extensions, a
  native decode path, or a hybrid; deferred until milestone (d) is close.
- Snapshot cadence: how often derived state snapshots should be taken, and
  whether they live beside the SQLite cache or in a separate derived store.
- Presentation of schema-invalid or quarantined events: hidden, shown in a
  separate lane, or shown inline with a warning; this interacts with the
  validator and the codes planned in `docs/DIAGNOSTIC_CODES_V1.md`.
- Clock-skew handling between source time and capture time: whether replay
  should estimate and display skew, and how to label that estimate as an
  Interpretation.
