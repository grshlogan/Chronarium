import { runChaturbateFixture } from "@chronarium/adapter-chaturbate";
import { createFixtureAdapterLifecycleHost } from "@chronarium/core";
import { createSyntheticTimelineEvent } from "@chronarium/testkit";
import type { AdapterToCoreMessage } from "@chronarium/types";
import { ADAPTER_PROTOCOL_VERSION } from "@chronarium/types";
import { describe, expect, it } from "vitest";

describe("fixture adapter lifecycle host", () => {
  it("runs a synthetic adapter message stream to completion", async () => {
    const host = createFixtureAdapterLifecycleHost();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    const snapshot = await host.runFixture({
      request: {
        adapterId: "chaturbate",
        sessionId: event.sessionId,
        mode: "fixture",
        capabilitiesRequested: ["fixture.timeline", "media.discovery"]
      },
      messages: runChaturbateFixture({
        name: "synthetic-lifecycle",
        sessionId: event.sessionId,
        events: [event]
      })
    });

    expect(snapshot).toMatchObject({
      adapterId: "chaturbate",
      sessionId: event.sessionId,
      status: "finished",
      finishedReason: "completed",
      messageCount: 3
    });
    expect(snapshot.capabilities).toContain("fixture.timeline");
    expect(snapshot.timelineEvents).toEqual([event]);
    expect(snapshot.errors).toEqual([]);
  });

  it("rejects live mode in the fixture lifecycle skeleton", async () => {
    const host = createFixtureAdapterLifecycleHost();

    await expect(
      host.runFixture({
        request: {
          adapterId: "chaturbate",
          sessionId: "session-synthetic-001",
          mode: "live",
          capabilitiesRequested: ["fixture.timeline"]
        },
        messages: emptyMessages()
      })
    ).rejects.toThrow(/only supports fixture mode/);
  });

  it("fails when the stream ends without adapter.finished", async () => {
    const host = createFixtureAdapterLifecycleHost();

    const snapshot = await host.runFixture({
      request: {
        adapterId: "chaturbate",
        sessionId: "session-synthetic-001",
        mode: "fixture",
        capabilitiesRequested: ["fixture.timeline"]
      },
      messages: readyOnlyMessages()
    });

    expect(snapshot.status).toBe("failed");
    expect(snapshot.errors[0]).toMatchObject({
      type: "adapter.error",
      code: "adapter.lifecycle.missing_finished"
    });
  });
});

async function* emptyMessages(): AsyncGenerator<AdapterToCoreMessage> {}

async function* readyOnlyMessages(): AsyncGenerator<AdapterToCoreMessage> {
  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "synthetic:ready",
    adapterId: "chaturbate",
    sessionId: "session-synthetic-001",
    type: "adapter.ready",
    sentAt: "1970-01-01T00:00:00.000Z",
    mode: "fixture",
    capabilities: ["fixture.timeline"]
  };
}
