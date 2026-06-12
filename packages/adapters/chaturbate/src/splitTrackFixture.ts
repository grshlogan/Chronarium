import type {
  JsonObject,
  MediaTrack,
  MediaTrackKind,
  RedactionStatus,
  TimelineEventEnvelope
} from "@chronarium/types";
import { CHATURBATE_ADAPTER_ID } from "./fixtureAdapter.js";

export const CHATURBATE_SITE_ID = "chaturbate";
export const CHATURBATE_SYNTHETIC_REFERENCE_PREFIX =
  "fixture://chaturbate/";

export interface ChaturbateSplitTrackFixture {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly sessionId: string;
  readonly capturedAt: string;
  readonly monotonicStartMs: number;
  readonly topology: ChaturbateFixtureTopology;
  readonly tracks: readonly ChaturbateFixtureTrack[];
}

export interface ChaturbateFixtureTopology {
  readonly protocol: "ll-hls-cmaf";
  readonly playlistReference: string;
  readonly redactionStatus: "synthetic";
}

export interface ChaturbateFixtureTrack {
  readonly id: string;
  readonly kind: Extract<MediaTrackKind, "video" | "audio">;
  readonly label?: string;
  readonly codec?: string;
  readonly container?: string;
  readonly timeBase?: string;
  readonly sourceIdHash: string;
  readonly playlistReference: string;
  readonly segments: readonly ChaturbateFixtureSegment[];
}

export interface ChaturbateFixtureSegment {
  readonly id: string;
  readonly sourceSequence: number;
  readonly mediaStartMs: number;
  readonly durationMs: number;
}

export function parseChaturbateSplitTrackFixture(
  value: unknown
): ChaturbateSplitTrackFixture {
  const fixture = expectRecord(value, "fixture");
  const schemaVersion = expectNumber(fixture.schemaVersion, "schemaVersion");
  if (schemaVersion !== 1) {
    throw new Error(`schemaVersion must be 1, received ${schemaVersion}.`);
  }

  const topology = parseTopology(fixture.topology);
  const tracks = expectArray(fixture.tracks, "tracks").map((track, index) =>
    parseTrack(track, `tracks[${index}]`)
  );

  if (tracks.length === 0) {
    throw new Error("tracks must contain at least one synthetic track.");
  }

  const trackIds = new Set<string>();
  for (const track of tracks) {
    if (trackIds.has(track.id)) {
      throw new Error(`Duplicate fixture track id: ${track.id}`);
    }
    trackIds.add(track.id);
  }

  return {
    schemaVersion: 1,
    name: expectString(fixture.name, "name"),
    sessionId: expectString(fixture.sessionId, "sessionId"),
    capturedAt: expectString(fixture.capturedAt, "capturedAt"),
    monotonicStartMs: expectOptionalNumber(
      fixture.monotonicStartMs,
      "monotonicStartMs",
      0
    ),
    topology,
    tracks
  };
}

export function createChaturbateSplitTrackMediaTracks(
  fixture: ChaturbateSplitTrackFixture
): readonly MediaTrack[] {
  return fixture.tracks.map((track) => ({
    id: track.id,
    sessionId: fixture.sessionId,
    kind: track.kind,
    ...(track.label ? { label: track.label } : {}),
    ...(track.codec ? { codec: track.codec } : {}),
    ...(track.container ? { container: track.container } : {}),
    ...(track.timeBase ? { timeBase: track.timeBase } : {}),
    source: createSyntheticSource(track.sourceIdHash),
    segmentsPath: `tracks/${track.id}/segments`,
    createdAt: fixture.capturedAt
  }));
}

export function createChaturbateSplitTrackTimelineEvents(
  fixture: ChaturbateSplitTrackFixture
): readonly TimelineEventEnvelope[] {
  const events: TimelineEventEnvelope[] = [];
  let sequence = 1;

  events.push(
    createFixtureTimelineEvent({
      fixture,
      sequence,
      type: "media.track.topology_observed",
      monotonicMs: fixture.monotonicStartMs,
      payload: {
        fixtureName: fixture.name,
        protocol: fixture.topology.protocol,
        playlistReference: fixture.topology.playlistReference,
        trackIds: fixture.tracks.map((track) => track.id),
        syntheticOnly: true
      }
    })
  );
  sequence += 1;

  for (const track of fixture.tracks) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "media.track.discovered",
        monotonicMs: fixture.monotonicStartMs,
        sourceIdHash: track.sourceIdHash,
        payload: {
          trackId: track.id,
          kind: track.kind,
          playlistReference: track.playlistReference,
          sourceIdHash: track.sourceIdHash,
          syntheticOnly: true,
          ...(track.label ? { label: track.label } : {}),
          ...(track.codec ? { codec: track.codec } : {}),
          ...(track.container ? { container: track.container } : {}),
          ...(track.timeBase ? { timeBase: track.timeBase } : {})
        }
      })
    );
    sequence += 1;

    for (const segment of track.segments) {
      events.push(
        createFixtureTimelineEvent({
          fixture,
          sequence,
          type: "media.segment.observed",
          monotonicMs: fixture.monotonicStartMs + segment.mediaStartMs,
          sourceIdHash: track.sourceIdHash,
          payload: {
            trackId: track.id,
            segmentId: segment.id,
            sourceSequence: segment.sourceSequence,
            mediaStartMs: segment.mediaStartMs,
            durationMs: segment.durationMs,
            playlistReference: track.playlistReference,
            syntheticOnly: true
          }
        })
      );
      sequence += 1;
    }
  }

  return events;
}

function parseTopology(value: unknown): ChaturbateFixtureTopology {
  const topology = expectRecord(value, "topology");
  const protocol = expectString(topology.protocol, "topology.protocol");
  if (protocol !== "ll-hls-cmaf") {
    throw new Error(`topology.protocol must be ll-hls-cmaf, received ${protocol}.`);
  }

  const playlistReference = expectString(
    topology.playlistReference,
    "topology.playlistReference"
  );
  assertSyntheticFixtureReference(
    playlistReference,
    "topology.playlistReference"
  );

  const redactionStatus = expectString(
    topology.redactionStatus,
    "topology.redactionStatus"
  );
  if (redactionStatus !== "synthetic") {
    throw new Error("topology.redactionStatus must be synthetic.");
  }

  return {
    protocol,
    playlistReference,
    redactionStatus
  };
}

function parseTrack(value: unknown, path: string): ChaturbateFixtureTrack {
  const track = expectRecord(value, path);
  const id = expectString(track.id, `${path}.id`);
  const kind = expectString(track.kind, `${path}.kind`);
  if (kind !== "video" && kind !== "audio") {
    throw new Error(`${path}.kind must be video or audio, received ${kind}.`);
  }

  const playlistReference = expectString(
    track.playlistReference,
    `${path}.playlistReference`
  );
  assertSyntheticFixtureReference(
    playlistReference,
    `${path}.playlistReference`
  );

  const segments = expectArray(track.segments, `${path}.segments`).map(
    (segment, index) => parseSegment(segment, `${path}.segments[${index}]`)
  );
  if (segments.length === 0) {
    throw new Error(`${path}.segments must contain at least one segment.`);
  }

  return {
    id,
    kind,
    ...optionalStringProperty("label", track.label, `${path}.label`),
    ...optionalStringProperty("codec", track.codec, `${path}.codec`),
    ...optionalStringProperty("container", track.container, `${path}.container`),
    ...optionalStringProperty("timeBase", track.timeBase, `${path}.timeBase`),
    sourceIdHash: expectString(track.sourceIdHash, `${path}.sourceIdHash`),
    playlistReference,
    segments
  };
}

function parseSegment(value: unknown, path: string): ChaturbateFixtureSegment {
  const segment = expectRecord(value, path);

  return {
    id: expectString(segment.id, `${path}.id`),
    sourceSequence: expectNonNegativeInteger(
      segment.sourceSequence,
      `${path}.sourceSequence`
    ),
    mediaStartMs: expectNonNegativeInteger(
      segment.mediaStartMs,
      `${path}.mediaStartMs`
    ),
    durationMs: expectPositiveInteger(segment.durationMs, `${path}.durationMs`)
  };
}

function createFixtureTimelineEvent(input: {
  readonly fixture: ChaturbateSplitTrackFixture;
  readonly sequence: number;
  readonly type: TimelineEventEnvelope["type"];
  readonly monotonicMs: number;
  readonly payload: JsonObject;
  readonly sourceIdHash?: string;
}): TimelineEventEnvelope {
  return {
    schemaVersion: 1,
    eventId: `${input.fixture.name}:event:${input.sequence}`,
    sessionId: input.fixture.sessionId,
    type: input.type,
    sequence: input.sequence,
    capturedAt: input.fixture.capturedAt,
    monotonicMs: input.monotonicMs,
    source: createSyntheticSource(input.sourceIdHash),
    sensitivity: "synthetic",
    payload: input.payload
  };
}

function createSyntheticSource(sourceIdHash?: string): {
  readonly adapterId: string;
  readonly siteId: string;
  readonly sourceIdHash?: string;
  readonly redactionStatus: RedactionStatus;
} {
  return {
    adapterId: CHATURBATE_ADAPTER_ID,
    siteId: CHATURBATE_SITE_ID,
    ...(sourceIdHash ? { sourceIdHash } : {}),
    redactionStatus: "synthetic"
  };
}

function assertSyntheticFixtureReference(reference: string, path: string): void {
  const lowerReference = reference.toLowerCase();
  const forbiddenFragments = [
    "cookie",
    "token",
    "session",
    "signature",
    "authorization",
    "bearer"
  ];

  if (!reference.startsWith(CHATURBATE_SYNTHETIC_REFERENCE_PREFIX)) {
    throw new Error(`${path} must use a synthetic fixture://chaturbate/ reference.`);
  }

  if (reference.includes("?") || reference.includes("#")) {
    throw new Error(`${path} must not contain query strings or fragments.`);
  }

  if (forbiddenFragments.some((fragment) => lowerReference.includes(fragment))) {
    throw new Error(`${path} contains a forbidden sensitive fragment.`);
  }
}

function expectRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function expectArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array.`);
  }

  return value;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${path} must be a non-empty string.`);
  }

  return value;
}

function optionalStringProperty<K extends string>(
  key: K,
  value: unknown,
  path: string
): Partial<Record<K, string>> {
  if (value === undefined) {
    return {};
  }

  return {
    [key]: expectString(value, path)
  } as Partial<Record<K, string>>;
}

function expectNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number.`);
  }

  return value;
}

function expectOptionalNumber(
  value: unknown,
  path: string,
  fallback: number
): number {
  if (value === undefined) {
    return fallback;
  }

  return expectNumber(value, path);
}

function expectNonNegativeInteger(value: unknown, path: string): number {
  const numberValue = expectNumber(value, path);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(`${path} must be a non-negative integer.`);
  }

  return numberValue;
}

function expectPositiveInteger(value: unknown, path: string): number {
  const numberValue = expectNumber(value, path);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${path} must be a positive integer.`);
  }

  return numberValue;
}
