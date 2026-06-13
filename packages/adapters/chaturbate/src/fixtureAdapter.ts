import type {
  AdapterCapability,
  AdapterToCoreMessage,
  TimelineEventEnvelope
} from "@chronarium/types";
import { ADAPTER_PROTOCOL_VERSION } from "@chronarium/types";

export const CHATURBATE_ADAPTER_ID = "chaturbate";

export const CHATURBATE_FIXTURE_CAPABILITIES = [
  "fixture.timeline",
  "media.discovery",
  "room.state",
  "chat.events",
  "diagnostics"
] as const satisfies readonly AdapterCapability[];

export interface ChaturbateSyntheticFixture {
  readonly name: string;
  readonly sessionId: string;
  readonly events: readonly TimelineEventEnvelope[];
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly retryable: boolean;
    readonly redactionStatus: "synthetic" | "redacted" | "safe";
  };
}

export async function* runChaturbateFixture(
  fixture: ChaturbateSyntheticFixture
): AsyncGenerator<AdapterToCoreMessage> {
  const sentAt = "1970-01-01T00:00:00.000Z";

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: `${fixture.name}:ready`,
    adapterId: CHATURBATE_ADAPTER_ID,
    sessionId: fixture.sessionId,
    type: "adapter.ready",
    sentAt,
    mode: "fixture",
    capabilities: CHATURBATE_FIXTURE_CAPABILITIES
  };

  for (const event of fixture.events) {
    yield {
      protocolVersion: ADAPTER_PROTOCOL_VERSION,
      messageId: `${fixture.name}:event:${event.sequence}`,
      adapterId: CHATURBATE_ADAPTER_ID,
      sessionId: fixture.sessionId,
      type: "fact.timeline",
      sentAt,
      event
    };
  }

  if (fixture.error) {
    yield {
      protocolVersion: ADAPTER_PROTOCOL_VERSION,
      messageId: `${fixture.name}:error`,
      adapterId: CHATURBATE_ADAPTER_ID,
      sessionId: fixture.sessionId,
      type: "adapter.error",
      sentAt,
      code: fixture.error.code,
      message: fixture.error.message,
      retryable: fixture.error.retryable,
      redactionStatus: fixture.error.redactionStatus
    };
  }

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: `${fixture.name}:finished`,
    adapterId: CHATURBATE_ADAPTER_ID,
    sessionId: fixture.sessionId,
    type: "adapter.finished",
    sentAt,
    reason: fixture.error ? "failed" : "completed",
    summary: {
      fixtureName: fixture.name,
      emittedEvents: fixture.events.length
    }
  };
}
