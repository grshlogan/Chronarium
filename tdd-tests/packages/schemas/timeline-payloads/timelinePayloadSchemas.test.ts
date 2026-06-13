import {
  parseDiagnosticDurationMismatchPayloadV1,
  parseDiagnosticMediaToolOutputPayloadV1,
  parseDiagnosticNotePayloadV1,
  parseChatMessageObservedPayloadV1,
  parseMediaGapDetectedPayloadV1,
  parseMediaSegmentObservedPayloadV1,
  parseMediaTrackDiscoveredPayloadV1,
  parseMediaTrackTopologyObservedPayloadV1,
  parseNetworkDisconnectedPayloadV1,
  parseNetworkReconnectedPayloadV1,
  parseRoomStateChangedPayloadV1,
  validateTimelineEventPayloadV1
} from "@chronarium/schemas";
import { describe, expect, it } from "vitest";

describe("media.track.discovered payload schema", () => {
  it("accepts a payload with the required fields plus extra keys", () => {
    expect(() =>
      parseMediaTrackDiscoveredPayloadV1({
        trackId: "video-main",
        kind: "video",
        playlistReference: "fixture://chaturbate/x/video.m3u8",
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("rejects a payload missing the required kind", () => {
    expect(() =>
      parseMediaTrackDiscoveredPayloadV1({ trackId: "video-main" })
    ).toThrow();
  });

  it("rejects an unknown media track kind", () => {
    expect(() =>
      parseMediaTrackDiscoveredPayloadV1({ trackId: "x", kind: "hologram" })
    ).toThrow();
  });
});

describe("media.track.topology_observed payload schema", () => {
  it("accepts protocol + trackIds", () => {
    expect(() =>
      parseMediaTrackTopologyObservedPayloadV1({
        protocol: "ll-hls-cmaf",
        trackIds: ["video-main", "audio-main"],
        combinedAudioVideo: true
      })
    ).not.toThrow();
  });

  it("rejects a missing protocol", () => {
    expect(() =>
      parseMediaTrackTopologyObservedPayloadV1({ trackIds: ["video-main"] })
    ).toThrow();
  });
});

describe("media.segment.observed payload schema", () => {
  it("accepts trackId + segmentId with optional timing", () => {
    expect(() =>
      parseMediaSegmentObservedPayloadV1({
        trackId: "video-main",
        segmentId: "video-segment-0001",
        mediaStartMs: 0,
        durationMs: 2000
      })
    ).not.toThrow();
  });

  it("rejects a missing segmentId", () => {
    expect(() =>
      parseMediaSegmentObservedPayloadV1({ trackId: "video-main" })
    ).toThrow();
  });
});

describe("media.gap.detected payload schema", () => {
  it("accepts the structured geometry with optional diagnostic annotations", () => {
    expect(() =>
      parseMediaGapDetectedPayloadV1({
        trackId: "video-main",
        previousSegmentId: "video-segment-0002",
        nextSegmentId: "video-segment-0004",
        gapStartMs: 4000,
        gapEndMs: 7000,
        durationMs: 3000,
        level: "warning",
        code: "media_gap.detected"
      })
    ).not.toThrow();
  });

  it("rejects a payload missing the gap geometry", () => {
    expect(() =>
      parseMediaGapDetectedPayloadV1({
        trackId: "video-main",
        level: "warning",
        code: "media_gap.detected"
      })
    ).toThrow();
  });
});

describe("validateTimelineEventPayloadV1 dispatcher", () => {
  it("returns undefined for a type with no payload schema (passthrough)", () => {
    expect(
      validateTimelineEventPayloadV1({
        type: "session.created",
        payload: { anything: true }
      })
    ).toBeUndefined();
  });

  it("returns undefined for a valid known-type payload", () => {
    expect(
      validateTimelineEventPayloadV1({
        type: "media.track.discovered",
        payload: { trackId: "video-main", kind: "video" }
      })
    ).toBeUndefined();
  });

  it("returns an issue for an invalid known-type payload", () => {
    const issue = validateTimelineEventPayloadV1({
      type: "media.track.discovered",
      payload: { trackId: "video-main" }
    });
    expect(issue?.message).toMatch(/kind/);
  });

  it("allows unknown extra keys on a known-type payload (lenient)", () => {
    expect(
      validateTimelineEventPayloadV1({
        type: "media.segment.observed",
        payload: {
          trackId: "video-main",
          segmentId: "video-segment-0001",
          playlistReference: "fixture://chaturbate/x/video.m3u8",
          someFutureField: 42
        }
      })
    ).toBeUndefined();
  });
});

describe("diagnostic payload schemas", () => {
  it("accepts diagnostic.note payloads with level and message", () => {
    expect(() =>
      parseDiagnosticNotePayloadV1({
        level: "warning",
        message: "Synthetic diagnostic note.",
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("rejects diagnostic.note payloads without a message", () => {
    expect(() =>
      parseDiagnosticNotePayloadV1({
        level: "warning"
      })
    ).toThrow();
  });

  it("accepts Chaturbate duration mismatch diagnostic payloads", () => {
    expect(() =>
      parseDiagnosticDurationMismatchPayloadV1({
        level: "warning",
        code: "media_tool.duration_mismatch",
        evidenceLevel: "synthetic-contract",
        message: "Synthetic fixture observed video duration longer than audio.",
        affectedTrackIds: ["video-main", "audio-main"],
        evidence: {
          videoDurationMs: 9000,
          audioDurationMs: 3500,
          differenceMs: 5500
        },
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("accepts Chaturbate media tool output diagnostic payloads", () => {
    expect(() =>
      parseDiagnosticMediaToolOutputPayloadV1({
        level: "error",
        code: "media_tool.output_stalled",
        evidenceLevel: "synthetic-contract",
        message: "Synthetic fixture observed stalled output.",
        affectedTrackIds: ["video-main"],
        evidence: {
          tool: "synthetic-downloader",
          noProgressForMs: 2000
        },
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("dispatches diagnostic payload validation by event type", () => {
    const issue = validateTimelineEventPayloadV1({
      type: "diagnostic.media_tool_output",
      payload: {
        level: "error",
        message: "Missing code."
      }
    });

    expect(issue?.message).toMatch(/code/);
  });
});

describe("room and chat payload schemas", () => {
  it("accepts room.state.changed payloads with a state", () => {
    expect(() =>
      parseRoomStateChangedPayloadV1({
        state: "online",
        viewerCount: 42,
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("rejects room.state.changed payloads without state", () => {
    expect(() =>
      parseRoomStateChangedPayloadV1({
        viewerCount: 42
      })
    ).toThrow();
  });

  it("accepts chat.message.observed payloads with redacted author refs", () => {
    expect(() =>
      parseChatMessageObservedPayloadV1({
        messageId: "synthetic-message-001",
        authorRef: "synthetic-author-hash-001",
        body: "Synthetic hello.",
        redactionStatus: "synthetic",
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("rejects chat.message.observed payloads without redactionStatus", () => {
    expect(() =>
      parseChatMessageObservedPayloadV1({
        messageId: "synthetic-message-001",
        authorRef: "synthetic-author-hash-001",
        body: "Synthetic hello."
      })
    ).toThrow();
  });

  it("dispatches room/chat payload validation by canonical event type", () => {
    expect(
      validateTimelineEventPayloadV1({
        type: "room.state.changed",
        payload: { state: "online" }
      })
    ).toBeUndefined();

    const issue = validateTimelineEventPayloadV1({
      type: "chat.message.observed",
      payload: {
        messageId: "synthetic-message-001",
        authorRef: "synthetic-author-hash-001",
        body: "Synthetic hello."
      }
    });

    expect(issue?.message).toMatch(/redactionStatus/);
  });
});

describe("network reconnect payload schemas", () => {
  it("accepts network.disconnected payloads with reason and affected tracks", () => {
    expect(() =>
      parseNetworkDisconnectedPayloadV1({
        reason: "synthetic network pause",
        affectedTrackIds: ["combined-main"],
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("rejects network.disconnected payloads without reason", () => {
    expect(() =>
      parseNetworkDisconnectedPayloadV1({
        affectedTrackIds: ["combined-main"]
      })
    ).toThrow();
  });

  it("accepts network.reconnected payloads with a disconnected event reference", () => {
    expect(() =>
      parseNetworkReconnectedPayloadV1({
        disconnectedEventId: "combined-av.synthetic:event:5",
        outageDurationMs: 3000,
        affectedTrackIds: ["combined-main"],
        syntheticOnly: true
      })
    ).not.toThrow();
  });

  it("dispatches network payload validation by canonical event type", () => {
    expect(
      validateTimelineEventPayloadV1({
        type: "network.disconnected",
        payload: {
          reason: "synthetic network pause",
          affectedTrackIds: ["combined-main"]
        }
      })
    ).toBeUndefined();

    const issue = validateTimelineEventPayloadV1({
      type: "network.reconnected",
      payload: {
        affectedTrackIds: ["combined-main"]
      }
    });

    expect(issue?.message).toMatch(/disconnectedEventId/);
  });
});
