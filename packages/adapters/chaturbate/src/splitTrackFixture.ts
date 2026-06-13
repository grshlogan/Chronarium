import type {
  JsonObject,
  MediaTrack,
  MediaTrackKind,
  RedactionStatus,
  TimelineEventEnvelope
} from "@chronarium/types";
import {
  assertNoSensitiveFixtureStrings,
  assertSyntheticFixtureReference,
  expectArray,
  expectJsonObject,
  expectNonNegativeInteger,
  expectNumber,
  expectOptionalArray,
  expectOptionalNumber,
  expectPositiveInteger,
  expectRecord,
  expectString,
  optionalStringProperty
} from "@chronarium/adapter-kit";
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
  readonly diagnostics: readonly ChaturbateFixtureDiagnostic[];
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

export type ChaturbateFixtureDiagnosticType =
  | "diagnostic.duration_mismatch"
  | "diagnostic.media_tool_output"
  | "media.gap.detected";

export type ChaturbateFixtureDiagnosticCode =
  | "media_tool.audio_track_missing"
  | "media_tool.duration_mismatch"
  | "media_tool.output_stalled"
  | "media_gap.detected";

export type ChaturbateFixtureDiagnosticLevel = "warning" | "error";

export interface ChaturbateFixtureDiagnostic {
  readonly type: ChaturbateFixtureDiagnosticType;
  readonly code: ChaturbateFixtureDiagnosticCode;
  readonly evidenceLevel: "synthetic-contract";
  readonly level: ChaturbateFixtureDiagnosticLevel;
  readonly message: string;
  readonly monotonicMs: number;
  readonly affectedTrackIds: readonly string[];
  readonly evidence: JsonObject;
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
  const diagnostics = expectOptionalArray(
    fixture.diagnostics,
    "diagnostics"
  ).map((diagnostic, index) =>
    parseDiagnostic(diagnostic, `diagnostics[${index}]`)
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

  diagnostics.forEach((diagnostic, diagnosticIndex) => {
    diagnostic.affectedTrackIds.forEach((trackId) => {
      if (!trackIds.has(trackId)) {
        throw new Error(
          `diagnostics[${diagnosticIndex}].affectedTrackIds references unknown track id: ${trackId}`
        );
      }
    });
  });

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
    tracks,
    diagnostics
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

  for (const diagnostic of fixture.diagnostics) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: diagnostic.type,
        monotonicMs: fixture.monotonicStartMs + diagnostic.monotonicMs,
        payload:
          diagnostic.type === "media.gap.detected"
            ? createGapPayload(diagnostic)
            : {
                level: diagnostic.level,
                code: diagnostic.code,
                evidenceLevel: diagnostic.evidenceLevel,
                message: diagnostic.message,
                affectedTrackIds: diagnostic.affectedTrackIds,
                evidence: diagnostic.evidence,
                syntheticOnly: true
              }
      })
    );
    sequence += 1;
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
    "topology.playlistReference",
    CHATURBATE_SYNTHETIC_REFERENCE_PREFIX
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
    `${path}.playlistReference`,
    CHATURBATE_SYNTHETIC_REFERENCE_PREFIX
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

function parseDiagnostic(
  value: unknown,
  path: string
): ChaturbateFixtureDiagnostic {
  const diagnostic = expectRecord(value, path);
  const type = parseDiagnosticType(expectString(diagnostic.type, `${path}.type`));
  const code = parseDiagnosticCode(expectString(diagnostic.code, `${path}.code`));
  const evidenceLevel = expectString(
    diagnostic.evidenceLevel,
    `${path}.evidenceLevel`
  );
  if (evidenceLevel !== "synthetic-contract") {
    throw new Error(`${path}.evidenceLevel must be synthetic-contract.`);
  }

  const level = parseDiagnosticLevel(
    expectString(diagnostic.level, `${path}.level`)
  );
  const message = expectString(diagnostic.message, `${path}.message`);
  const affectedTrackIds = expectOptionalArray(
    diagnostic.affectedTrackIds,
    `${path}.affectedTrackIds`
  ).map((trackId, index) =>
    expectString(trackId, `${path}.affectedTrackIds[${index}]`)
  );
  const evidence = expectJsonObject(diagnostic.evidence, `${path}.evidence`);

  assertNoSensitiveFixtureStrings(message, `${path}.message`);
  assertNoSensitiveFixtureStrings(evidence, `${path}.evidence`);

  return {
    type,
    code,
    evidenceLevel,
    level,
    message,
    monotonicMs: expectNonNegativeInteger(
      diagnostic.monotonicMs,
      `${path}.monotonicMs`
    ),
    affectedTrackIds,
    evidence
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

function createGapPayload(diagnostic: ChaturbateFixtureDiagnostic): JsonObject {
  const evidence = diagnostic.evidence;
  const gapStartMs = numberFromEvidence(evidence.gapStartMs);
  const durationMs = numberFromEvidence(evidence.gapDurationMs);

  return {
    trackId: evidence.trackId ?? null,
    previousSegmentId: evidence.previousSegmentId ?? null,
    nextSegmentId: evidence.nextSegmentId ?? null,
    gapStartMs,
    gapEndMs: gapStartMs + durationMs,
    durationMs,
    ...(evidence.expectedNextSourceSequence === undefined
      ? {}
      : { expectedNextSourceSequence: evidence.expectedNextSourceSequence }),
    ...(evidence.observedNextSourceSequence === undefined
      ? {}
      : { observedNextSourceSequence: evidence.observedNextSourceSequence }),
    level: diagnostic.level,
    code: diagnostic.code,
    evidenceLevel: diagnostic.evidenceLevel,
    message: diagnostic.message,
    affectedTrackIds: [...diagnostic.affectedTrackIds],
    syntheticOnly: true
  };
}

function numberFromEvidence(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function parseDiagnosticType(
  value: string
): ChaturbateFixtureDiagnosticType {
  switch (value) {
    case "diagnostic.duration_mismatch":
    case "diagnostic.media_tool_output":
    case "media.gap.detected":
      return value;
    default:
      throw new Error(`Unsupported fixture diagnostic type: ${value}`);
  }
}

function parseDiagnosticCode(
  value: string
): ChaturbateFixtureDiagnosticCode {
  switch (value) {
    case "media_tool.audio_track_missing":
    case "media_tool.duration_mismatch":
    case "media_tool.output_stalled":
    case "media_gap.detected":
      return value;
    default:
      throw new Error(`Unsupported fixture diagnostic code: ${value}`);
  }
}

function parseDiagnosticLevel(
  value: string
): ChaturbateFixtureDiagnosticLevel {
  switch (value) {
    case "warning":
    case "error":
      return value;
    default:
      throw new Error(`Unsupported fixture diagnostic level: ${value}`);
  }
}
