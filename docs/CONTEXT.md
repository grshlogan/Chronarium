# Chronarium Context

This document defines project vocabulary. It is the first place to update when
the product language changes.

## Product Terms

- **Chronarium**: the local-first livestream archive and replay platform.
- **LiveSession**: one captured livestream session. It is the top-level product
  object.
- **Replay Package**: the on-disk archive for one `LiveSession`. It contains
  media tracks, timelines, events, manifest, diagnostics, and derived exports.
- **Timeline**: append-friendly event log that records media, room, chat,
  state, adapter, and diagnostic facts in time order.
- **Fact**: an observed raw or normalized piece of evidence. Examples include
  playlist sequence numbers, segment URLs after redaction, chat messages, room
  state changes, gap decisions, and reconnects.
- **Interpretation**: Chronarium's derived explanation of facts. Examples
  include unsafe A/V gap decisions, room-state summaries, and export readiness.
- **MediaTrack**: a logical audio, video, subtitle, or data track inside a
  session.
- **MediaSegment**: one fetched media unit, such as an LL-HLS part, fMP4/m4s
  segment, or other site-specific media chunk.
- **RoomEvent**: a structured event describing room state, such as online,
  offline, private, paid, topic change, viewer count, or site-specific state.
- **ChatEvent**: a structured chat or message event.
- **PaidRoomEvent**: a structured event for paid/private room transitions,
  price semantics, access state, or purchase-relevant state.
- **Adapter**: a site-specific process that discovers room facts, media tracks,
  events, and capture decisions for one provider.
- **Core**: the local backend authority for tasks, archive writes, adapter
  lifecycle, indexing, and diagnostics.
- **Player**: the Chronarium replay surface that reconstructs a session from
  media tracks and timeline facts.
- **Export**: a derived artifact, such as mp4, mkv, clipped segment, timeline
  report, or diagnostic bundle.

## Product Direction

Chronarium is not primarily a recorder.

```text
Old goal: record video and audio.
New goal: preserve and replay the livestream's observable world.
```

This means:

- A single mp4 is not enough.
- A/V sync is one timeline problem, not the only timeline problem.
- Media, chat, room state, paid-state, network health, and adapter decisions all
  deserve durable facts.
- A replay player is a core product surface, not an optional viewer.
- Exported video is a convenience output derived from the archive.

## Architecture Terms

- **Desktop Shell**: the Electron application shell.
- **Renderer**: the React GUI running inside Chromium.
- **Electron Main**: the thin desktop lifecycle process. It must not contain
  site or media logic.
- **chronarium-core**: planned Node.js/TypeScript backend process that owns
  local state and archive writes.
- **Adapter Worker**: planned child process for a site adapter, such as
  Chaturbate or Stripchat.
- **Command Builder**: typed construction layer for FFmpeg, ffprobe, or other
  external commands. It prevents arbitrary shell execution.
- **Fixture**: offline sample data used to reproduce adapter parsing, timeline,
  archive, or replay behavior.
- **Schema**: typed and validated JSON shape for timeline events, manifests,
  adapter messages, and core APIs.
- **Hot Maintenance**: the ability to repair one site adapter or one schema
  edge without changing unrelated providers or the whole application.

## Site Direction

Initial site priority:

1. Chaturbate, because CB-specific media behavior exposed the limitations of a
   unified recorder model.
2. Other sites only after the core archive, timeline, and adapter harness are
   proven.

Do not design the initial system around a generic "all sites are the same"
abstraction. Start with narrow contracts and allow each site to preserve its own
media logic.

## Perfect Replay Definition

"Perfect replay" is an engineering target, not a promise of impossible
pixel-for-pixel reconstruction.

Chronarium should preserve enough facts to:

- replay audio and video with the best available alignment;
- show room events and chat in session time;
- explain gaps, disconnects, reconnects, cuts, and export choices;
- re-render or repair outputs later without recapturing the live session;
- distinguish observed facts from Chronarium's later interpretations.
