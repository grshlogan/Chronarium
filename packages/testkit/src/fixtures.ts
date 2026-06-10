import type {
  JsonObject,
  LiveSession,
  TimelineEventEnvelope,
  TimelineEventType
} from "@chronarium/types";

const SYNTHETIC_TIME = "2026-01-01T00:00:00.000Z";

export function createSyntheticSession(
  overrides: Partial<LiveSession> = {}
): LiveSession {
  return {
    id: "session-synthetic-001",
    schemaVersion: 1,
    site: {
      siteId: "synthetic",
      redactionStatus: "synthetic"
    },
    createdAt: SYNTHETIC_TIME,
    status: "imported",
    ...overrides
  };
}

export function createSyntheticTimelineEvent<
  TType extends TimelineEventType,
  TPayload extends JsonObject
>(input: {
  readonly type: TType;
  readonly sequence: number;
  readonly payload: TPayload;
  readonly sessionId?: string;
  readonly eventId?: string;
}): TimelineEventEnvelope<TType, TPayload> {
  return {
    schemaVersion: 1,
    eventId: input.eventId ?? `event-synthetic-${input.sequence}`,
    sessionId: input.sessionId ?? "session-synthetic-001",
    type: input.type,
    sequence: input.sequence,
    capturedAt: SYNTHETIC_TIME,
    sourceTime: SYNTHETIC_TIME,
    monotonicMs: input.sequence - 1,
    source: {
      adapterId: "fixture",
      siteId: "synthetic",
      redactionStatus: "synthetic"
    },
    sensitivity: "synthetic",
    payload: input.payload
  };
}
