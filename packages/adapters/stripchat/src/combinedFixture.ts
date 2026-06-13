import type {
  JsonObject,
  MediaTrack,
  RedactionStatus,
  TimelineEventEnvelope
} from "@chronarium/types";
import {
  assertSyntheticFixtureReference,
  expectArray,
  expectNonNegativeInteger,
  expectNumber,
  expectOptionalArray,
  expectOptionalNumber,
  expectPositiveInteger,
  expectRecord,
  expectString,
  optionalStringProperty
} from "@chronarium/adapter-kit";
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
  readonly roomStates: readonly StripchatFixtureRoomState[];
  readonly chatMessages: readonly StripchatFixtureChatMessage[];
  readonly networkEvents: readonly StripchatFixtureNetworkEvent[];
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

export interface StripchatFixtureRoomState {
  readonly state: string;
  readonly monotonicMs: number;
  readonly viewerCount?: number;
  readonly showMode?: string;
  readonly topic?: string;
  readonly syntheticOnly: true;
}

export interface StripchatFixtureChatMessage {
  readonly messageId: string;
  readonly authorRef: string;
  readonly body: string;
  readonly redactionStatus: "synthetic" | "redacted";
  readonly monotonicMs: number;
  readonly role?: string;
  readonly syntheticOnly: true;
}

export type StripchatFixtureNetworkEvent =
  | StripchatFixtureNetworkDisconnected
  | StripchatFixtureNetworkReconnected;

export interface StripchatFixtureNetworkDisconnected {
  readonly type: "network.disconnected";
  readonly reason: string;
  readonly monotonicMs: number;
  readonly affectedTrackIds?: readonly string[];
  readonly syntheticOnly: true;
}

export interface StripchatFixtureNetworkReconnected {
  readonly type: "network.reconnected";
  readonly disconnectedEventId: string;
  readonly outageDurationMs?: number;
  readonly monotonicMs: number;
  readonly affectedTrackIds?: readonly string[];
  readonly syntheticOnly: true;
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
    roomStates: expectOptionalArray(fixture.roomStates, "roomStates").map(
      (roomState, index) => parseRoomState(roomState, `roomStates[${index}]`)
    ),
    chatMessages: expectOptionalArray(fixture.chatMessages, "chatMessages").map(
      (chatMessage, index) =>
        parseChatMessage(chatMessage, `chatMessages[${index}]`)
    ),
    networkEvents: expectOptionalArray(fixture.networkEvents, "networkEvents").map(
      (networkEvent, index) =>
        parseNetworkEvent(networkEvent, `networkEvents[${index}]`)
    ),
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

  for (const roomState of fixture.roomStates) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "room.state.changed",
        monotonicMs: fixture.monotonicStartMs + roomState.monotonicMs,
        payload: {
          state: roomState.state,
          syntheticOnly: roomState.syntheticOnly,
          ...(roomState.viewerCount === undefined
            ? {}
            : { viewerCount: roomState.viewerCount }),
          ...(roomState.showMode ? { showMode: roomState.showMode } : {}),
          ...(roomState.topic ? { topic: roomState.topic } : {})
        }
      })
    );
    sequence += 1;
  }

  for (const chatMessage of fixture.chatMessages) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: "chat.message.observed",
        monotonicMs: fixture.monotonicStartMs + chatMessage.monotonicMs,
        payload: {
          messageId: chatMessage.messageId,
          authorRef: chatMessage.authorRef,
          body: chatMessage.body,
          redactionStatus: chatMessage.redactionStatus,
          syntheticOnly: chatMessage.syntheticOnly,
          ...(chatMessage.role ? { role: chatMessage.role } : {})
        }
      })
    );
    sequence += 1;
  }

  for (const networkEvent of fixture.networkEvents) {
    events.push(
      createFixtureTimelineEvent({
        fixture,
        sequence,
        type: networkEvent.type,
        monotonicMs: fixture.monotonicStartMs + networkEvent.monotonicMs,
        sourceIdHash: fixture.track.sourceIdHash,
        payload:
          networkEvent.type === "network.disconnected"
            ? {
                reason: networkEvent.reason,
                syntheticOnly: networkEvent.syntheticOnly,
                ...(networkEvent.affectedTrackIds
                  ? { affectedTrackIds: [...networkEvent.affectedTrackIds] }
                  : {})
              }
            : {
                disconnectedEventId: networkEvent.disconnectedEventId,
                syntheticOnly: networkEvent.syntheticOnly,
                ...(networkEvent.outageDurationMs === undefined
                  ? {}
                  : { outageDurationMs: networkEvent.outageDurationMs }),
                ...(networkEvent.affectedTrackIds
                  ? { affectedTrackIds: [...networkEvent.affectedTrackIds] }
                  : {})
              }
      })
    );
    sequence += 1;
  }

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

function parseNetworkEvent(
  value: unknown,
  path: string
): StripchatFixtureNetworkEvent {
  const networkEvent = expectRecord(value, path);
  const type = expectString(networkEvent.type, `${path}.type`);
  const syntheticOnly = networkEvent.syntheticOnly;
  if (syntheticOnly !== true) {
    throw new Error(`${path}.syntheticOnly must be true.`);
  }

  const affectedTrackIds = expectOptionalArray(
    networkEvent.affectedTrackIds,
    `${path}.affectedTrackIds`
  ).map((trackId, index) =>
    expectString(trackId, `${path}.affectedTrackIds[${index}]`)
  );

  if (type === "network.disconnected") {
    return {
      type,
      reason: expectString(networkEvent.reason, `${path}.reason`),
      monotonicMs: expectNonNegativeInteger(
        networkEvent.monotonicMs,
        `${path}.monotonicMs`
      ),
      ...(affectedTrackIds.length > 0 ? { affectedTrackIds } : {}),
      syntheticOnly
    };
  }

  if (type === "network.reconnected") {
    return {
      type,
      disconnectedEventId: expectString(
        networkEvent.disconnectedEventId,
        `${path}.disconnectedEventId`
      ),
      monotonicMs: expectNonNegativeInteger(
        networkEvent.monotonicMs,
        `${path}.monotonicMs`
      ),
      ...optionalNumberProperty(
        "outageDurationMs",
        networkEvent.outageDurationMs,
        `${path}.outageDurationMs`
      ),
      ...(affectedTrackIds.length > 0 ? { affectedTrackIds } : {}),
      syntheticOnly
    };
  }

  throw new Error(`${path}.type must be network.disconnected or network.reconnected.`);
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
    "topology.playlistReference",
    STRIPCHAT_SYNTHETIC_REFERENCE_PREFIX
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

function parseRoomState(
  value: unknown,
  path: string
): StripchatFixtureRoomState {
  const roomState = expectRecord(value, path);
  const syntheticOnly = roomState.syntheticOnly;
  if (syntheticOnly !== true) {
    throw new Error(`${path}.syntheticOnly must be true.`);
  }

  return {
    state: expectString(roomState.state, `${path}.state`),
    monotonicMs: expectNonNegativeInteger(
      roomState.monotonicMs,
      `${path}.monotonicMs`
    ),
    ...optionalNumberProperty(
      "viewerCount",
      roomState.viewerCount,
      `${path}.viewerCount`
    ),
    ...optionalStringProperty("showMode", roomState.showMode, `${path}.showMode`),
    ...optionalStringProperty("topic", roomState.topic, `${path}.topic`),
    syntheticOnly
  };
}

function parseChatMessage(
  value: unknown,
  path: string
): StripchatFixtureChatMessage {
  const chatMessage = expectRecord(value, path);
  const redactionStatus = expectString(
    chatMessage.redactionStatus,
    `${path}.redactionStatus`
  );
  if (redactionStatus !== "synthetic" && redactionStatus !== "redacted") {
    throw new Error(`${path}.redactionStatus must be synthetic or redacted.`);
  }
  const syntheticOnly = chatMessage.syntheticOnly;
  if (syntheticOnly !== true) {
    throw new Error(`${path}.syntheticOnly must be true.`);
  }

  return {
    messageId: expectString(chatMessage.messageId, `${path}.messageId`),
    authorRef: expectString(chatMessage.authorRef, `${path}.authorRef`),
    body: expectString(chatMessage.body, `${path}.body`),
    redactionStatus,
    monotonicMs: expectNonNegativeInteger(
      chatMessage.monotonicMs,
      `${path}.monotonicMs`
    ),
    ...optionalStringProperty("role", chatMessage.role, `${path}.role`),
    syntheticOnly
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
    `${path}.playlistReference`,
    STRIPCHAT_SYNTHETIC_REFERENCE_PREFIX
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

function optionalNumberProperty<TName extends string>(
  name: TName,
  value: unknown,
  path: string
): Partial<Record<TName, number>> {
  if (value === undefined) {
    return {};
  }

  return {
    [name]: expectNonNegativeInteger(value, path)
  } as Partial<Record<TName, number>>;
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
