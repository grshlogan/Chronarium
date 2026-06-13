import type {
  AdapterId,
  ChronariumId,
  IsoDateTimeString,
  JsonObject,
  RedactionStatus,
  SiteId
} from "./primitives.js";
import type { MediaTrackKind } from "./media.js";
import type {
  CredentialEntitlement,
  CredentialRef,
  RecordingIntent
} from "./credentials.js";

export type TimelineEventFamily =
  | "session"
  | "adapter"
  | "media.track"
  | "media.segment"
  | "media.gap"
  | "room"
  | "chat"
  | "paid_room"
  | "network"
  | "export"
  | "diagnostic";

export type TimelineEventType = `${TimelineEventFamily}.${string}`;

export interface TimelineEventSource {
  readonly adapterId?: AdapterId;
  readonly siteId?: SiteId;
  readonly sourceIdHash?: string;
  readonly redactionStatus: RedactionStatus;
}

export interface TimelineEventEnvelope<
  TType extends TimelineEventType = TimelineEventType,
  TPayload extends JsonObject = JsonObject
> {
  readonly schemaVersion: 1;
  readonly eventId: ChronariumId;
  readonly sessionId: ChronariumId;
  readonly type: TType;
  readonly sequence: number;
  readonly capturedAt: IsoDateTimeString;
  readonly sourceTime?: IsoDateTimeString;
  readonly monotonicMs?: number;
  readonly source?: TimelineEventSource;
  readonly sensitivity: RedactionStatus;
  readonly payload: TPayload;
}

export type TimelineEvent = TimelineEventEnvelope;

/**
 * Per-family timeline payload shapes (v1) for the media observation facts that
 * site adapters emit. These describe the known fields only; the runtime schemas
 * in `@chronarium/schemas` validate required + known fields and allow extra
 * keys, so the timeline payload stays an open `JsonObject`.
 */

export interface MediaTrackTopologyObservedPayload {
  readonly protocol: string;
  readonly trackIds: readonly string[];
  readonly fixtureName?: string;
  readonly playlistReference?: string;
  readonly combinedAudioVideo?: boolean;
  readonly syntheticOnly?: boolean;
}

export interface MediaTrackDiscoveredPayload {
  readonly trackId: string;
  readonly kind: MediaTrackKind;
  readonly playlistReference?: string;
  readonly sourceIdHash?: string;
  readonly containsAudio?: boolean;
  readonly label?: string;
  readonly codec?: string;
  readonly container?: string;
  readonly timeBase?: string;
  readonly syntheticOnly?: boolean;
}

export interface MediaSegmentObservedPayload {
  readonly trackId: string;
  readonly segmentId: string;
  readonly sourceSequence?: number;
  readonly mediaStartMs?: number;
  readonly durationMs?: number;
  readonly playlistReference?: string;
  readonly syntheticOnly?: boolean;
}

export interface MediaGapDetectedPayload {
  readonly trackId: string;
  readonly previousSegmentId: string;
  readonly nextSegmentId: string;
  readonly gapStartMs: number;
  readonly gapEndMs: number;
  readonly durationMs: number;
  readonly level?: string;
  readonly code?: string;
  readonly evidenceLevel?: string;
  readonly message?: string;
  readonly affectedTrackIds?: readonly string[];
  readonly syntheticOnly?: boolean;
}

export interface DiagnosticNotePayload {
  readonly level: string;
  readonly message: string;
  readonly code?: string;
  readonly syntheticOnly?: boolean;
}

export interface DiagnosticMediaToolPayload {
  readonly level: string;
  readonly code: string;
  readonly evidenceLevel: string;
  readonly message: string;
  readonly affectedTrackIds: readonly string[];
  readonly evidence: JsonObject;
  readonly syntheticOnly?: boolean;
}

export type DiagnosticDurationMismatchPayload = DiagnosticMediaToolPayload;

export type DiagnosticMediaToolOutputPayload = DiagnosticMediaToolPayload;

export interface RoomStateChangedPayload {
  readonly state: string;
  readonly viewerCount?: number;
  readonly showMode?: string;
  readonly topic?: string;
  readonly syntheticOnly?: boolean;
}

export interface ChatMessageObservedPayload {
  readonly messageId: string;
  readonly authorRef: string;
  readonly body: string;
  readonly redactionStatus: RedactionStatus;
  readonly role?: string;
  readonly syntheticOnly?: boolean;
}

export interface NetworkDisconnectedPayload {
  readonly reason: string;
  readonly affectedTrackIds?: readonly string[];
  readonly syntheticOnly?: boolean;
}

export interface NetworkReconnectedPayload {
  readonly disconnectedEventId: string;
  readonly outageDurationMs?: number;
  readonly affectedTrackIds?: readonly string[];
  readonly syntheticOnly?: boolean;
}

export interface SessionIntentSelectedPayload {
  readonly intent: RecordingIntent;
  readonly selectionPolicy?: string;
  readonly syntheticOnly?: boolean;
}

export interface SessionCredentialSelectedPayload {
  readonly credentialRef: CredentialRef;
  readonly intent: RecordingIntent;
  readonly entitlementMatched?: CredentialEntitlement;
  readonly syntheticOnly?: boolean;
}

export interface SessionCredentialFailoverPayload {
  readonly fromRef: CredentialRef;
  readonly toRef: CredentialRef;
  readonly intent: RecordingIntent;
  readonly reason: string;
  readonly syntheticOnly?: boolean;
}

export interface SessionCredentialMissingPayload {
  readonly intent: RecordingIntent;
  readonly reason: string;
  readonly syntheticOnly?: boolean;
}
