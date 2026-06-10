import type {
  AdapterId,
  ChronariumId,
  IsoDateTimeString,
  JsonObject,
  RedactionStatus,
  SiteId
} from "./primitives.js";

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
