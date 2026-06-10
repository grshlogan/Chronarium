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
  "diagnostics"
] as const satisfies readonly AdapterCapability[];

export interface ChaturbateSyntheticFixture {
  readonly name: string;
  readonly sessionId: string;
  readonly events: readonly TimelineEventEnvelope[];
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

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: `${fixture.name}:finished`,
    adapterId: CHATURBATE_ADAPTER_ID,
    sessionId: fixture.sessionId,
    type: "adapter.finished",
    sentAt,
    reason: "completed",
    summary: {
      fixtureName: fixture.name,
      emittedEvents: fixture.events.length
    }
  };
}
