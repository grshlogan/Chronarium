import type {
  JsonObject,
  MediaTrack,
  RedactionStatus,
  TimelineEventEnvelope
} from "@chronarium/types";
import { STRIPCHAT_ADAPTER_ID } from "./fixtureAdapter.js";

export const STRIPCHAT_SITE_ID = "stripchat";
export const STRIPCHAT_SYNTHETIC_REFERENCE_PREFIX = "fixture://stripchat/";

export interface StripchatCombinedFixture {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly sessionId: string;
  readonly capturedAt: string;
  readonly monotonicStartMs: number;
  readonly topology: StripchatFixtureTopology;
  readonly track: StripchatFixtureTrack;
}

export interface StripchatFixtureTopology {
  readonly protocol: "hls-combined-av";
  readonly playlistReference: string;
  readonly redactionStatus: "synthetic";
}

export interface StripchatFixtureTrack {
  readonly id: string;
  readonly kind: "video";
  readonly label?: string;
  readonly codec?: string;
  readonly container?: string;
  readonly timeBase?: string;
  readonly sourceIdHash: string;
  readonly playlistReference: string;
  readonly containsAudio: true;
  readonly segments: readonly StripchatFixtureSegment[];
}

export interface StripchatFixtureSegment {
  readonly id: string;
  readonly sourceSequence: number;
  readonly mediaStartMs: number;
  readonly durationMs: number;
}

export function parseStripchatCombinedFixture(
  value: unknown
): StripchatCombinedFixture {
  const fixture = expectRecord(value, "fixture");
  const schemaVersion = expectNumber(fixture.schemaVersion, "schemaVersion");
  if (schemaVersion !== 1) {
    throw new Error(`schemaVersion must be 1, received ${schemaVersion}.`);
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
    topology: parseTopology(fixture.topology),
    track: parseTrack(fixture.track, "track")
  };
}

export function createStripchatCombinedMediaTracks(
  fixture: StripchatCombinedFixture
): readonly MediaTrack[] {
  return [
    {
      id: fixture.track.id,
      sessionId: fixture.sessionId,
      kind: fixture.track.kind,
      ...(fixture.track.label ? { label: fixture.track.label } : {}),
      ...(fixture.track.codec ? { codec: fixture.track.codec } : {}),
      ...(fixture.track.container ? { container: fixture.track.container } : {}),
      ...(fixture.track.timeBase ? { timeBase: fixture.track.timeBase } : {}),
      source: createSyntheticSource(fixture.track.sourceIdHash),
      segmentsPath: `tracks/${fixture.track.id}/segments`,
      createdAt: fixture.capturedAt
    }
  ];
}

export function createStripchatCombinedTimelineEvents(
  fixture: StripchatCombinedFixture
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
        trackIds: [fixture.track.id],
        combinedAudioVideo: true,
        syntheticOnly: true
      }
    })
  );
  sequence += 1;

  events.push(
    createFixtureTimelineEvent({
      fixture,
      sequence,
      type: "media.track.discovered",
      monotonicMs: fixture.monotonicStartMs,
      sourceIdHash: fixture.track.sourceIdHash,
      payload: {
        trackId: fixture.track.id,
        kind: fixture.track.kind,
        playlistReference: fixture.track.playlistReference,
        sourceIdHash: fixture.track.sourceIdHash,
        containsAudio: fixture.track.containsAudio,
        syntheticOnly: true,
        ...(fixture.track.label ? { label: fixture.track.label } : {}),
        ...(fixture.track.codec ? { codec: fixture.track.codec } : {}),
        ...(fixture.track.container ? { container: fixture.track.container } : {}),
        ...(fixture.track.timeBase ? { timeBase: fixture.track.timeBase } : {})
      }
    })
  );
  sequence += 1;

  let previousSegment: StripchatFixtureSegment | undefined;
  for (const segment of fixture.track.segments) {
    if (previousSegment) {
      const previousEndMs =
        previousSegment.mediaStartMs + previousSegment.durationMs;
      if (segment.mediaStartMs > previousEndMs) {
        events.push(
          createFixtureTimelineEvent({
            fixture,
            sequence,
            type: "media.gap.detected",
            monotonicMs: fixture.monotonicStartMs + previousEndMs,
            sourceIdHash: fixture.track.sourceIdHash,
            payload: {
              trackId: fixture.track.id,
              previousSegmentId: previousSegment.id,
              nextSegmentId: segment.id,
              gapStartMs: previousEndMs,
              gapEndMs: segment.mediaStartMs,
              durationMs: segment.mediaStartMs - previousEndMs,
              syntheticOnly: true
            }
          })
        );
        sequence += 1;
      }
    }

    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "media.segment.observed",
        monotonicMs: fixture.monotonicStartMs + segment.mediaStartMs,
        sourceIdHash: fixture.track.sourceIdHash,
        payload: {
          trackId: fixture.track.id,
          segmentId: segment.id,
          sourceSequence: segment.sourceSequence,
          mediaStartMs: segment.mediaStartMs,
          durationMs: segment.durationMs,
          playlistReference: fixture.track.playlistReference,
          syntheticOnly: true
        }
      })
    );
    sequence += 1;
    previousSegment = segment;
  }

  return events;
}

function parseTopology(value: unknown): StripchatFixtureTopology {
  const topology = expectRecord(value, "topology");
  const protocol = expectString(topology.protocol, "topology.protocol");
  if (protocol !== "hls-combined-av") {
    throw new Error(`topology.protocol must be hls-combined-av, received ${protocol}.`);
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

function parseTrack(value: unknown, path: string): StripchatFixtureTrack {
  const track = expectRecord(value, path);
  const kind = expectString(track.kind, `${path}.kind`);
  if (kind !== "video") {
    throw new Error(`${path}.kind must be video for combined A/V fixtures.`);
  }

  const containsAudio = track.containsAudio;
  if (containsAudio !== true) {
    throw new Error(`${path}.containsAudio must be true.`);
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
  assertSegmentsAreOrdered(segments, `${path}.segments`);

  return {
    id: expectString(track.id, `${path}.id`),
    kind,
    ...optionalStringProperty("label", track.label, `${path}.label`),
    ...optionalStringProperty("codec", track.codec, `${path}.codec`),
    ...optionalStringProperty("container", track.container, `${path}.container`),
    ...optionalStringProperty("timeBase", track.timeBase, `${path}.timeBase`),
    sourceIdHash: expectString(track.sourceIdHash, `${path}.sourceIdHash`),
    playlistReference,
    containsAudio,
    segments
  };
}

function parseSegment(value: unknown, path: string): StripchatFixtureSegment {
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

function assertSegmentsAreOrdered(
  segments: readonly StripchatFixtureSegment[],
  path: string
): void {
  let previousEndMs = 0;

  for (const [index, segment] of segments.entries()) {
    if (index > 0 && segment.mediaStartMs < previousEndMs) {
      throw new Error(
        `${path}[${index}] must not overlap or move backwards from the previous segment.`
      );
    }

    previousEndMs = segment.mediaStartMs + segment.durationMs;
  }
}

function createFixtureTimelineEvent(input: {
  readonly fixture: StripchatCombinedFixture;
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
    adapterId: STRIPCHAT_ADAPTER_ID,
    siteId: STRIPCHAT_SITE_ID,
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

  if (!reference.startsWith(STRIPCHAT_SYNTHETIC_REFERENCE_PREFIX)) {
    throw new Error(`${path} must use a synthetic fixture://stripchat/ reference.`);
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
