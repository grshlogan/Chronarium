import type {
  AdapterId,
  ChronariumId,
  IsoDateTimeString,
  JsonObject,
  RedactionStatus,
  RelativeArchivePath
} from "./primitives.js";
import type { TimelineEventEnvelope } from "./timeline.js";

export const ADAPTER_PROTOCOL_VERSION = 1;

export type AdapterRuntimeMode = "fixture" | "live";

export type AdapterCapability =
  | "fixture.timeline"
  | "media.discovery"
  | "room.state"
  | "chat.events"
  | "diagnostics";

export interface AdapterMessageBase<TType extends string = string> {
  readonly protocolVersion: typeof ADAPTER_PROTOCOL_VERSION;
  readonly messageId: ChronariumId;
  readonly correlationId?: ChronariumId;
  readonly adapterId: AdapterId;
  readonly sessionId?: ChronariumId;
  readonly type: TType;
  readonly sentAt: IsoDateTimeString;
}

export interface AdapterStartCommand
  extends AdapterMessageBase<"adapter.start"> {
  readonly sessionId: ChronariumId;
  readonly mode: AdapterRuntimeMode;
  readonly capabilitiesRequested: readonly AdapterCapability[];
}

export interface AdapterStopCommand extends AdapterMessageBase<"adapter.stop"> {
  readonly reason: string;
}

export interface AdapterFixtureRef {
  readonly name: string;
  readonly rootRelativePath?: RelativeArchivePath;
  readonly syntheticOnly: true;
}

export interface AdapterFixtureLoadCommand
  extends AdapterMessageBase<"fixture.load"> {
  readonly sessionId: ChronariumId;
  readonly fixtureRef: AdapterFixtureRef;
}

export interface AdapterHealthPing extends AdapterMessageBase<"health.ping"> {
  readonly nonce: string;
}

export type CoreToAdapterMessage =
  | AdapterStartCommand
  | AdapterStopCommand
  | AdapterFixtureLoadCommand
  | AdapterHealthPing;

export interface AdapterReadyEvent extends AdapterMessageBase<"adapter.ready"> {
  readonly mode: AdapterRuntimeMode;
  readonly capabilities: readonly AdapterCapability[];
}

export interface AdapterTimelineFactMessage
  extends AdapterMessageBase<"fact.timeline"> {
  readonly sessionId: ChronariumId;
  readonly event: TimelineEventEnvelope;
}

export interface AdapterDiagnosticMessage
  extends AdapterMessageBase<"diagnostic.event"> {
  readonly level: "debug" | "info" | "warn" | "error";
  readonly message: string;
  readonly details?: JsonObject;
  readonly redactionStatus: RedactionStatus;
}

export interface AdapterErrorMessage extends AdapterMessageBase<"adapter.error"> {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly redactionStatus: RedactionStatus;
}

export interface AdapterFinishedMessage
  extends AdapterMessageBase<"adapter.finished"> {
  readonly reason: "completed" | "stopped" | "failed";
  readonly summary: JsonObject;
}

export interface AdapterHealthPong extends AdapterMessageBase<"health.pong"> {
  readonly nonce: string;
}

export type AdapterToCoreMessage =
  | AdapterReadyEvent
  | AdapterTimelineFactMessage
  | AdapterDiagnosticMessage
  | AdapterErrorMessage
  | AdapterFinishedMessage
  | AdapterHealthPong;
