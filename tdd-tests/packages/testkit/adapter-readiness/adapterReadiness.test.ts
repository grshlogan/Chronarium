import {
  createChaturbateSplitTrackTimelineEvents,
  parseChaturbateSplitTrackFixture,
  runChaturbateFixture
} from "@chronarium/adapter-chaturbate";
import { verifyAdapterFixtureReadiness } from "@chronarium/testkit";
import { ADAPTER_PROTOCOL_VERSION, type AdapterToCoreMessage } from "@chronarium/types";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("adapter fixture readiness gate", () => {
  it("accepts a synthetic adapter stream that is safe to wire into core", async () => {
    const fixture = parseChaturbateSplitTrackFixture(await readFixtureJson());
    const events = createChaturbateSplitTrackTimelineEvents(fixture);

    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "chaturbate",
        sessionId: fixture.sessionId,
        capabilitiesRequested: ["fixture.timeline", "media.discovery"]
      },
      messages: runChaturbateFixture({
        name: fixture.name,
        sessionId: fixture.sessionId,
        events
      })
    });

    expect(readiness).toMatchObject({
      ok: true,
      adapterId: "chaturbate",
      sessionId: fixture.sessionId,
      messageCount: 9,
      timelineEventCount: 7
    });
    expect(readiness.issues).toEqual([]);
    expect(readiness.capabilities).toEqual([
      "fixture.timeline",
      "media.discovery",
      "diagnostics"
    ]);
  });

  it("rejects adapter facts emitted after adapter.finished", async () => {
    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "synthetic-site",
        sessionId: "session-synthetic-001",
        capabilitiesRequested: ["fixture.timeline"]
      },
      messages: messagesWithFactAfterFinished()
    });

    expect(readiness.ok).toBe(false);
    expect(readiness.issues).toContainEqual(
      expect.objectContaining({
        code: "adapter_readiness.message_after_finished"
      })
    );
  });

  it("rejects duplicate adapter.ready messages", async () => {
    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "synthetic-site",
        sessionId: "session-synthetic-001",
        capabilitiesRequested: ["fixture.timeline"]
      },
      messages: duplicateReadyMessages()
    });

    expect(readiness.ok).toBe(false);
    expect(readiness.issues).toContainEqual(
      expect.objectContaining({
        code: "adapter_readiness.duplicate_ready"
      })
    );
  });

  it("rejects secret-looking diagnostic fields", async () => {
    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "synthetic-site",
        sessionId: "session-synthetic-001",
        capabilitiesRequested: ["diagnostics"]
      },
      messages: messagesWithSecretLookingDiagnosticField()
    });

    expect(readiness.ok).toBe(false);
    expect(readiness.issues).toContainEqual(
      expect.objectContaining({
        code: "adapter_readiness.secret_reference"
      })
    );
  });

  it("rejects declared room.state capability when no room facts are emitted", async () => {
    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "synthetic-site",
        sessionId: "session-synthetic-001",
        capabilitiesRequested: ["room.state"]
      },
      messages: messagesWithCapabilitiesButNoFacts(["fixture.timeline", "room.state"])
    });

    expect(readiness.ok).toBe(false);
    expect(readiness.issues).toContainEqual(
      expect.objectContaining({
        code: "adapter_readiness.capability_fact_missing",
        path: "room.state"
      })
    );
  });

  it("rejects declared chat.events capability when no chat facts are emitted", async () => {
    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "synthetic-site",
        sessionId: "session-synthetic-001",
        capabilitiesRequested: ["chat.events"]
      },
      messages: messagesWithCapabilitiesButNoFacts(["fixture.timeline", "chat.events"])
    });

    expect(readiness.ok).toBe(false);
    expect(readiness.issues).toContainEqual(
      expect.objectContaining({
        code: "adapter_readiness.capability_fact_missing",
        path: "chat.events"
      })
    );
  });
});

async function readFixtureJson(): Promise<unknown> {
  const text = await readFile(
    new URL(
      "../../../../packages/adapters/chaturbate/fixtures/split-audio-video.synthetic.json",
      import.meta.url
    ),
    "utf8"
  );

  return JSON.parse(text);
}

async function* messagesWithFactAfterFinished(): AsyncGenerator<AdapterToCoreMessage> {
  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:ready",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.ready",
    sentAt: "2026-01-01T00:00:00.000Z",
    mode: "fixture",
    capabilities: ["fixture.timeline"]
  };

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:finished",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.finished",
    sentAt: "2026-01-01T00:00:00.000Z",
    reason: "completed",
    summary: {
      emittedEvents: 0
    }
  };

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:event-after-finished",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "fact.timeline",
    sentAt: "2026-01-01T00:00:01.000Z",
    event: {
      schemaVersion: 1,
      eventId: "event-after-finished",
      sessionId: "session-synthetic-001",
      type: "session.created",
      sequence: 1,
      capturedAt: "2026-01-01T00:00:01.000Z",
      sensitivity: "synthetic",
      payload: {
        status: "imported"
      }
    }
  };
}

async function* duplicateReadyMessages(): AsyncGenerator<AdapterToCoreMessage> {
  const ready = {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:ready",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.ready",
    sentAt: "2026-01-01T00:00:00.000Z",
    mode: "fixture",
    capabilities: ["fixture.timeline"]
  } as const;

  yield ready;
  yield {
    ...ready,
    messageId: "synthetic:ready-duplicate"
  };
  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:finished",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.finished",
    sentAt: "2026-01-01T00:00:01.000Z",
    reason: "completed",
    summary: {
      emittedEvents: 0
    }
  };
}

async function* messagesWithSecretLookingDiagnosticField(): AsyncGenerator<AdapterToCoreMessage> {
  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:ready",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.ready",
    sentAt: "2026-01-01T00:00:00.000Z",
    mode: "fixture",
    capabilities: ["diagnostics"]
  };

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:diagnostic",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "diagnostic.event",
    sentAt: "2026-01-01T00:00:01.000Z",
    level: "warn",
    message: "Synthetic diagnostic with an unsafe field name.",
    redactionStatus: "safe",
    details: {
      Authorization: "Basic synthetic"
    }
  };

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:finished",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.finished",
    sentAt: "2026-01-01T00:00:02.000Z",
    reason: "completed",
    summary: {
      emittedEvents: 0
    }
  };
}

async function* messagesWithCapabilitiesButNoFacts(
  capabilities: readonly ("fixture.timeline" | "room.state" | "chat.events")[]
): AsyncGenerator<AdapterToCoreMessage> {
  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:ready",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.ready",
    sentAt: "2026-01-01T00:00:00.000Z",
    mode: "fixture",
    capabilities
  };

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:finished",
    adapterId: "synthetic-site",
    sessionId: "session-synthetic-001",
    type: "adapter.finished",
    sentAt: "2026-01-01T00:00:01.000Z",
    reason: "completed",
    summary: {
      emittedEvents: 0
    }
  };
}
