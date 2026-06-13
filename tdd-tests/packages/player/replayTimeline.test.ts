import {
  buildReplayTimeline,
  reconstructRoomStateAt
} from "@chronarium/player";
import type { TimelineEventEnvelope } from "@chronarium/types";
import { describe, expect, it } from "vitest";

const EPOCH_ISO = "2026-06-14T00:00:00.000Z";

function at(offsetMs: number): string {
  return new Date(Date.parse(EPOCH_ISO) + offsetMs).toISOString();
}

function event(
  partial: Partial<TimelineEventEnvelope> & {
    readonly sequence: number;
    readonly type: TimelineEventEnvelope["type"];
  }
): TimelineEventEnvelope {
  return {
    schemaVersion: 1,
    eventId: `event-${partial.sequence}`,
    sessionId: "session-synthetic-001",
    capturedAt: at(0),
    sensitivity: "synthetic",
    payload: {},
    ...partial
  };
}

describe("buildReplayTimeline", () => {
  it("orders by sequence, positions by monotonicMs, classifies presentation", () => {
    const result = buildReplayTimeline([
      event({ sequence: 3, type: "chat.message.observed", monotonicMs: 7000, capturedAt: at(7000) }),
      event({ sequence: 1, type: "session.created", monotonicMs: 0, capturedAt: at(0) }),
      event({ sequence: 2, type: "room.state.changed", monotonicMs: 5000, capturedAt: at(5000) }),
      event({ sequence: 4, type: "media.gap.detected", monotonicMs: 8000, capturedAt: at(8000) })
    ]);

    expect(result.steps.map((s) => s.sequence)).toEqual([1, 2, 3, 4]);
    expect(result.steps.map((s) => s.positionMs)).toEqual([0, 5000, 7000, 8000]);
    expect(result.steps.every((s) => s.approximate === false)).toBe(true);
    expect(result.steps.map((s) => s.presentationClass)).toEqual([
      "point",
      "state",
      "point",
      "span"
    ]);
  });

  it("falls back to an approximate capturedAt delta when monotonicMs is missing", () => {
    const result = buildReplayTimeline([
      event({ sequence: 1, type: "session.created", monotonicMs: 0, capturedAt: at(0) }),
      event({ sequence: 2, type: "network.disconnected", capturedAt: at(10000) })
    ]);

    const step = result.steps[1]!;
    expect(step.presentationClass).toBe("span");
    expect(step.positionMs).toBe(10000);
    expect(step.approximate).toBe(true);
  });
});

describe("reconstructRoomStateAt", () => {
  it("folds room.state.changed up to T with per-key last-write-wins", () => {
    const events = [
      event({
        sequence: 1,
        type: "room.state.changed",
        monotonicMs: 0,
        capturedAt: at(0),
        payload: { state: "public", viewerCount: 10 }
      }),
      event({
        sequence: 2,
        type: "room.state.changed",
        monotonicMs: 8000,
        capturedAt: at(8000),
        payload: { viewerCount: 25 }
      }),
      event({
        sequence: 3,
        type: "room.state.changed",
        monotonicMs: 12000,
        capturedAt: at(12000),
        payload: { state: "ticket-show" }
      })
    ];

    expect(reconstructRoomStateAt(events, 10000)).toMatchObject({
      state: "public",
      viewerCount: 25
    });
  });

  it("ignores events after T", () => {
    const events = [
      event({
        sequence: 1,
        type: "room.state.changed",
        monotonicMs: 0,
        capturedAt: at(0),
        payload: { state: "public" }
      }),
      event({
        sequence: 2,
        type: "room.state.changed",
        monotonicMs: 20000,
        capturedAt: at(20000),
        payload: { state: "private" }
      })
    ];

    expect(reconstructRoomStateAt(events, 5000)).toMatchObject({
      state: "public"
    });
  });
});
