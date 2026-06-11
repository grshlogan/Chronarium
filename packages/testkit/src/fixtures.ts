import type {
  ArchiveManifest,
  JsonObject,
  LiveSession,
  MediaTrack,
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

export function createSyntheticArchiveManifest(input: {
  readonly session?: LiveSession;
  readonly archiveId?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
} = {}): ArchiveManifest {
  const session = input.session ?? createSyntheticSession();
  const createdAt = input.createdAt ?? SYNTHETIC_TIME;

  return {
    archiveFormatVersion: 1,
    archiveId: input.archiveId ?? "archive-synthetic-001",
    session,
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
    schemaVersions: {
      timeline: 1,
      adapterProtocol: 1
    },
    timeline: {
      path: "timeline.jsonl"
    },
    tracks: [],
    paths: {
      timeline: "timeline.jsonl",
      events: "events",
      tracks: "tracks",
      diagnostics: "diagnostics",
      exports: "exports"
    },
    generator: {
      name: "chronarium"
    }
  };
}

export function createSyntheticMediaTrack(
  overrides: Partial<MediaTrack> = {}
): MediaTrack {
  const id = overrides.id ?? "track-synthetic-video-001";
  const sessionId = overrides.sessionId ?? "session-synthetic-001";

  return {
    id,
    sessionId,
    kind: "video",
    label: "Synthetic video",
    codec: "h264",
    container: "mp4",
    timeBase: "1/1000",
    source: {
      adapterId: "fixture",
      siteId: "synthetic",
      sourceIdHash: "synthetic-source-hash",
      redactionStatus: "synthetic"
    },
    segmentsPath: `tracks/${id}/segments`,
    createdAt: SYNTHETIC_TIME,
    ...overrides
  };
}
