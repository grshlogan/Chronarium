import type {
  JsonObject,
  JsonValue,
  TimelineEventEnvelope
} from "@chronarium/types";

/**
 * First fixture-safe replay reader. Pure functions over an in-memory timeline
 * event array — no IO, no archive read, no SQLite, no network — implementing the
 * early milestones of `docs/REPLAY_MODEL_V1.md`:
 *
 * - `sequence` is the only ordering authority.
 * - `monotonicMs` positions an event relative to the session epoch (the first
 *   event by sequence); when absent, position falls back to an approximate
 *   `capturedAt` delta flagged `approximate: true`. `sourceTime` never positions.
 * - presentation classes: `state` for room and paid_room facts, `span` for
 *   media gap and network facts, otherwise `point`.
 */

export type ReplayPresentationClass = "point" | "state" | "span";

export interface ReplayStep {
  readonly event: TimelineEventEnvelope;
  readonly sequence: number;
  readonly positionMs: number;
  readonly approximate: boolean;
  readonly presentationClass: ReplayPresentationClass;
}

export interface ReplayEpoch {
  readonly sequence: number;
  readonly capturedAt: string;
  readonly monotonicMs?: number;
}

export interface ReplayTimeline {
  readonly epoch: ReplayEpoch;
  readonly steps: readonly ReplayStep[];
}

export function buildReplayTimeline(
  events: readonly TimelineEventEnvelope[]
): ReplayTimeline {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  const epochEvent = ordered[0];
  if (!epochEvent) {
    return { epoch: { sequence: 0, capturedAt: "" }, steps: [] };
  }

  const epochMonotonic = epochEvent.monotonicMs;
  const epochCapturedMs = Date.parse(epochEvent.capturedAt);

  const steps = ordered.map((event): ReplayStep => {
    const { positionMs, approximate } = positionOf(
      event,
      epochMonotonic,
      epochCapturedMs
    );
    return {
      event,
      sequence: event.sequence,
      positionMs,
      approximate,
      presentationClass: presentationClassOf(event.type)
    };
  });

  return {
    epoch: {
      sequence: epochEvent.sequence,
      capturedAt: epochEvent.capturedAt,
      ...(epochMonotonic === undefined ? {} : { monotonicMs: epochMonotonic })
    },
    steps
  };
}

/**
 * Reconstruct room state at replay-clock time `atMs` by folding
 * `room.state.changed` payloads with position <= `atMs` in `sequence` order,
 * last-write-wins per state key. Always a full scan from the epoch — correct,
 * never cached. See the seek model in `docs/REPLAY_MODEL_V1.md`.
 */
export function reconstructRoomStateAt(
  events: readonly TimelineEventEnvelope[],
  atMs: number
): JsonObject {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  const epochEvent = ordered[0];
  const epochMonotonic = epochEvent?.monotonicMs;
  const epochCapturedMs = epochEvent ? Date.parse(epochEvent.capturedAt) : 0;

  const state: Record<string, JsonValue> = {};
  for (const event of ordered) {
    if (event.type !== "room.state.changed") {
      continue;
    }
    const { positionMs } = positionOf(event, epochMonotonic, epochCapturedMs);
    if (positionMs > atMs) {
      continue;
    }
    for (const [key, value] of Object.entries(event.payload)) {
      state[key] = value;
    }
  }
  return state;
}

function positionOf(
  event: TimelineEventEnvelope,
  epochMonotonic: number | undefined,
  epochCapturedMs: number
): { readonly positionMs: number; readonly approximate: boolean } {
  if (event.monotonicMs !== undefined && epochMonotonic !== undefined) {
    return {
      positionMs: event.monotonicMs - epochMonotonic,
      approximate: false
    };
  }
  const capturedMs = Date.parse(event.capturedAt);
  const positionMs =
    Number.isNaN(capturedMs) || Number.isNaN(epochCapturedMs)
      ? 0
      : capturedMs - epochCapturedMs;
  return { positionMs, approximate: true };
}

function presentationClassOf(type: string): ReplayPresentationClass {
  if (type.startsWith("room.") || type.startsWith("paid_room.")) {
    return "state";
  }
  if (type.startsWith("media.gap.") || type.startsWith("network.")) {
    return "span";
  }
  return "point";
}
