import type {
  DiagnosticDurationMismatchPayload,
  DiagnosticMediaToolOutputPayload,
  DiagnosticNotePayload,
  ChatMessageObservedPayload,
  MediaGapDetectedPayload,
  MediaSegmentObservedPayload,
  MediaTrackDiscoveredPayload,
  MediaTrackTopologyObservedPayload,
  NetworkDisconnectedPayload,
  NetworkReconnectedPayload,
  RoomStateChangedPayload
} from "@chronarium/types";
import { z } from "zod";
import { mediaTrackKindSchema } from "./mediaSchemas.js";
import { jsonValueSchema, redactionStatusSchema } from "./primitiveSchemas.js";

/**
 * Per-family timeline payload schemas (v1) for the media observation facts that
 * site adapters emit. They are lenient: required + known fields are validated,
 * and unknown keys are allowed (default `z.object` strips them without error),
 * because the timeline payload is intentionally an open `JsonObject`.
 */

export const mediaTrackTopologyObservedPayloadV1Schema = z.object({
  protocol: z.string().min(1),
  trackIds: z.array(z.string().min(1)),
  fixtureName: z.string().min(1).optional(),
  playlistReference: z.string().min(1).optional(),
  combinedAudioVideo: z.boolean().optional(),
  syntheticOnly: z.boolean().optional()
});

export const mediaTrackDiscoveredPayloadV1Schema = z.object({
  trackId: z.string().min(1),
  kind: mediaTrackKindSchema,
  playlistReference: z.string().min(1).optional(),
  sourceIdHash: z.string().min(1).optional(),
  containsAudio: z.boolean().optional(),
  label: z.string().min(1).optional(),
  codec: z.string().min(1).optional(),
  container: z.string().min(1).optional(),
  timeBase: z.string().min(1).optional(),
  syntheticOnly: z.boolean().optional()
});

export const mediaSegmentObservedPayloadV1Schema = z.object({
  trackId: z.string().min(1),
  segmentId: z.string().min(1),
  sourceSequence: z.number().int().nonnegative().optional(),
  mediaStartMs: z.number().nonnegative().optional(),
  durationMs: z.number().nonnegative().optional(),
  playlistReference: z.string().min(1).optional(),
  syntheticOnly: z.boolean().optional()
});

export const mediaGapDetectedPayloadV1Schema = z.object({
  trackId: z.string().min(1),
  previousSegmentId: z.string().min(1),
  nextSegmentId: z.string().min(1),
  gapStartMs: z.number().nonnegative(),
  gapEndMs: z.number().nonnegative(),
  durationMs: z.number().nonnegative(),
  level: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  evidenceLevel: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  affectedTrackIds: z.array(z.string().min(1)).optional(),
  syntheticOnly: z.boolean().optional()
});

export const diagnosticNotePayloadV1Schema = z.object({
  level: z.string().min(1),
  message: z.string().min(1),
  code: z.string().min(1).optional(),
  syntheticOnly: z.boolean().optional()
});

const diagnosticMediaToolPayloadV1Schema = z.object({
  level: z.string().min(1),
  code: z.string().min(1),
  evidenceLevel: z.string().min(1),
  message: z.string().min(1),
  affectedTrackIds: z.array(z.string().min(1)),
  evidence: z.record(z.string(), jsonValueSchema),
  syntheticOnly: z.boolean().optional()
});

export const diagnosticDurationMismatchPayloadV1Schema =
  diagnosticMediaToolPayloadV1Schema;

export const diagnosticMediaToolOutputPayloadV1Schema =
  diagnosticMediaToolPayloadV1Schema;

export const roomStateChangedPayloadV1Schema = z.object({
  state: z.string().min(1),
  viewerCount: z.number().int().nonnegative().optional(),
  showMode: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  syntheticOnly: z.boolean().optional()
});

export const chatMessageObservedPayloadV1Schema = z.object({
  messageId: z.string().min(1),
  authorRef: z.string().min(1),
  body: z.string(),
  redactionStatus: redactionStatusSchema,
  role: z.string().min(1).optional(),
  syntheticOnly: z.boolean().optional()
});

export const networkDisconnectedPayloadV1Schema = z.object({
  reason: z.string().min(1),
  affectedTrackIds: z.array(z.string().min(1)).optional(),
  syntheticOnly: z.boolean().optional()
});

export const networkReconnectedPayloadV1Schema = z.object({
  disconnectedEventId: z.string().min(1),
  outageDurationMs: z.number().nonnegative().optional(),
  affectedTrackIds: z.array(z.string().min(1)).optional(),
  syntheticOnly: z.boolean().optional()
});

export function parseMediaTrackTopologyObservedPayloadV1(
  value: unknown
): MediaTrackTopologyObservedPayload {
  return mediaTrackTopologyObservedPayloadV1Schema.parse(
    value
  ) as MediaTrackTopologyObservedPayload;
}

export function parseMediaTrackDiscoveredPayloadV1(
  value: unknown
): MediaTrackDiscoveredPayload {
  return mediaTrackDiscoveredPayloadV1Schema.parse(
    value
  ) as MediaTrackDiscoveredPayload;
}

export function parseMediaSegmentObservedPayloadV1(
  value: unknown
): MediaSegmentObservedPayload {
  return mediaSegmentObservedPayloadV1Schema.parse(
    value
  ) as MediaSegmentObservedPayload;
}

export function parseMediaGapDetectedPayloadV1(
  value: unknown
): MediaGapDetectedPayload {
  return mediaGapDetectedPayloadV1Schema.parse(value) as MediaGapDetectedPayload;
}

export function parseDiagnosticNotePayloadV1(
  value: unknown
): DiagnosticNotePayload {
  return diagnosticNotePayloadV1Schema.parse(value) as DiagnosticNotePayload;
}

export function parseDiagnosticDurationMismatchPayloadV1(
  value: unknown
): DiagnosticDurationMismatchPayload {
  return diagnosticDurationMismatchPayloadV1Schema.parse(
    value
  ) as DiagnosticDurationMismatchPayload;
}

export function parseDiagnosticMediaToolOutputPayloadV1(
  value: unknown
): DiagnosticMediaToolOutputPayload {
  return diagnosticMediaToolOutputPayloadV1Schema.parse(
    value
  ) as DiagnosticMediaToolOutputPayload;
}

export function parseRoomStateChangedPayloadV1(
  value: unknown
): RoomStateChangedPayload {
  return roomStateChangedPayloadV1Schema.parse(value) as RoomStateChangedPayload;
}

export function parseChatMessageObservedPayloadV1(
  value: unknown
): ChatMessageObservedPayload {
  return chatMessageObservedPayloadV1Schema.parse(
    value
  ) as ChatMessageObservedPayload;
}

export function parseNetworkDisconnectedPayloadV1(
  value: unknown
): NetworkDisconnectedPayload {
  return networkDisconnectedPayloadV1Schema.parse(
    value
  ) as NetworkDisconnectedPayload;
}

export function parseNetworkReconnectedPayloadV1(
  value: unknown
): NetworkReconnectedPayload {
  return networkReconnectedPayloadV1Schema.parse(
    value
  ) as NetworkReconnectedPayload;
}

/**
 * Canonical registry of timeline event type -> payload schema. Keys are the
 * exact event type strings; this is the single place that pins the canonical
 * media observation type names.
 */
export const TIMELINE_PAYLOAD_SCHEMAS_V1 = {
  "media.track.topology_observed": mediaTrackTopologyObservedPayloadV1Schema,
  "media.track.discovered": mediaTrackDiscoveredPayloadV1Schema,
  "media.segment.observed": mediaSegmentObservedPayloadV1Schema,
  "media.gap.detected": mediaGapDetectedPayloadV1Schema,
  "diagnostic.note": diagnosticNotePayloadV1Schema,
  "diagnostic.duration_mismatch": diagnosticDurationMismatchPayloadV1Schema,
  "diagnostic.media_tool_output": diagnosticMediaToolOutputPayloadV1Schema,
  "room.state.changed": roomStateChangedPayloadV1Schema,
  "chat.message.observed": chatMessageObservedPayloadV1Schema,
  "network.disconnected": networkDisconnectedPayloadV1Schema,
  "network.reconnected": networkReconnectedPayloadV1Schema
} as const;

export type SchemaBackedTimelineEventType =
  keyof typeof TIMELINE_PAYLOAD_SCHEMAS_V1;

export interface TimelineEventPayloadIssue {
  readonly message: string;
}

/**
 * Validate one timeline event's payload against its per-family schema.
 * Returns `undefined` when the type has no payload schema yet (pass-through) or
 * when the payload is valid; returns a concise issue message otherwise.
 */
export function validateTimelineEventPayloadV1(event: {
  readonly type: string;
  readonly payload: unknown;
}): TimelineEventPayloadIssue | undefined {
  const schema = (
    TIMELINE_PAYLOAD_SCHEMAS_V1 as Record<string, z.ZodTypeAny>
  )[event.type];
  if (!schema) {
    return undefined;
  }

  const result = schema.safeParse(event.payload);
  if (result.success) {
    return undefined;
  }

  return {
    message: result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ")
  };
}
