import { createCoreGuiService, createCoreRuntime } from "@chronarium/core";
import type {
  AdapterToCoreMessage,
  TimelineEventEnvelope
} from "@chronarium/types";
import { ADAPTER_PROTOCOL_VERSION } from "@chronarium/types";
import {
  createSyntheticArchiveManifest,
  createSyntheticMediaTrack,
  createSyntheticSession,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("offline fixture capture pipeline", () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) =>
        rm(root, {
          recursive: true,
          force: true
        })
      )
    );
  });

  it("runs a fixture capture task into a .chron archive and index rows", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["chaturbate"]
    });
    const gui = createCoreGuiService({
      runtime
    });

    const session = createSyntheticSession({
      id: "session-offline-capture-001",
      site: {
        siteId: "chaturbate",
        redactionStatus: "synthetic"
      }
    });
    const manifest = createSyntheticArchiveManifest({
      archiveId: "archive-offline-capture-001",
      session
    });
    const archiveRootPath = path.join(
      archiveRoot,
      "session-offline-capture-001.chron"
    );

    await runtime.start();

    try {
      const result = await gui.runOfflineFixtureCapture({
        archiveRootPath,
        task: {
          taskId: "task-offline-capture-001",
          kind: "capture",
          sessionId: session.id,
          adapterId: "chaturbate",
          mode: "fixture",
          capabilitiesRequested: ["fixture.timeline", "media.discovery"]
        },
        manifest,
        mediaTracks: [
          createSyntheticMediaTrack({
            id: "track-offline-video-001",
            sessionId: session.id,
            source: {
              adapterId: "chaturbate",
              siteId: "chaturbate",
              sourceIdHash: "synthetic-video-source",
              redactionStatus: "synthetic"
            }
          })
        ],
        adapterMessages: fixtureMessages({
          adapterId: "chaturbate",
          sessionId: session.id,
          events: [
            createSyntheticTimelineEvent({
              type: "media.track.discovered",
              sequence: 1,
              sessionId: session.id,
              eventId: "event-offline-capture-001",
              payload: {
                trackId: "track-offline-video-001",
                kind: "video",
                syntheticOnly: true
              }
            })
          ]
        })
      });

      expect(result).toMatchObject({
        status: "completed",
        archiveRootPath,
        task: {
          taskId: "task-offline-capture-001",
          status: "stopped",
          stoppedReason: "fixture-capture-completed"
        },
        lifecycle: {
          status: "finished",
          messageCount: 3
        },
        indexSummary: {
          archiveId: "archive-offline-capture-001",
          sessionId: session.id,
          validationOk: true,
          timelineEventCount: 1
        }
      });

      const snapshot = await gui.readArchive(archiveRootPath);
      const maintenance = await gui.inspectArchiveMaintenance(archiveRootPath);
      const recovery = await gui.inspectArchiveRecovery(archiveRootPath);

      expect(snapshot.mediaTracks.map((track) => track.id)).toEqual([
        "track-offline-video-001"
      ]);
      expect(gui.listArchives({ sessionId: session.id })).toHaveLength(1);
      expect(
        gui.listTimelineEvents({
          archiveId: "archive-offline-capture-001"
        }).map((event) => event.type)
      ).toEqual(["media.track.discovered"]);
      expect(maintenance.status).toBe("healthy");
      expect(recovery.status).toBe("healthy");
    } finally {
      await runtime.stop();
    }
  });

  it("fails the task and skips indexing when the fixture lifecycle fails", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["chaturbate"]
    });
    const gui = createCoreGuiService({
      runtime
    });

    const session = createSyntheticSession({
      id: "session-offline-failed-001",
      site: {
        siteId: "chaturbate",
        redactionStatus: "synthetic"
      }
    });
    const archiveRootPath = path.join(
      archiveRoot,
      "session-offline-failed-001.chron"
    );

    await runtime.start();

    try {
      const result = await gui.runOfflineFixtureCapture({
        archiveRootPath,
        task: {
          taskId: "task-offline-failed-001",
          kind: "capture",
          sessionId: session.id,
          adapterId: "chaturbate",
          mode: "fixture",
          capabilitiesRequested: ["fixture.timeline"]
        },
        manifest: createSyntheticArchiveManifest({
          archiveId: "archive-offline-failed-001",
          session
        }),
        adapterMessages: failingFixtureMessages({
          adapterId: "chaturbate",
          sessionId: session.id
        })
      });

      expect(result).toMatchObject({
        status: "failed",
        task: {
          taskId: "task-offline-failed-001",
          status: "failed",
          failure: {
            code: "fixture.synthetic_failure",
            retryable: false
          }
        },
        lifecycle: {
          status: "failed"
        }
      });
      expect(result.indexSummary).toBeUndefined();
      expect(gui.listArchives({ sessionId: session.id })).toEqual([]);
      await expect(gui.readArchive(archiveRootPath)).rejects.toThrow();
    } finally {
      await runtime.stop();
    }
  });

  it("fails the task when the fixture stream ends without adapter.finished", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["chaturbate"]
    });
    const gui = createCoreGuiService({
      runtime
    });

    const session = createSyntheticSession({
      id: "session-offline-missing-finished-001",
      site: {
        siteId: "chaturbate",
        redactionStatus: "synthetic"
      }
    });

    await runtime.start();

    try {
      const result = await gui.runOfflineFixtureCapture({
        archiveRootPath: path.join(
          archiveRoot,
          "session-offline-missing-finished-001.chron"
        ),
        task: {
          taskId: "task-offline-missing-finished-001",
          kind: "capture",
          sessionId: session.id,
          adapterId: "chaturbate",
          mode: "fixture",
          capabilitiesRequested: ["fixture.timeline"]
        },
        manifest: createSyntheticArchiveManifest({
          archiveId: "archive-offline-missing-finished-001",
          session
        }),
        adapterMessages: readyOnlyFixtureMessages({
          adapterId: "chaturbate",
          sessionId: session.id
        })
      });

      expect(result).toMatchObject({
        status: "failed",
        task: {
          status: "failed",
          failure: {
            code: "adapter.lifecycle.missing_finished",
            retryable: true
          }
        },
        lifecycle: {
          status: "failed"
        }
      });
      expect(gui.listArchives({ sessionId: session.id })).toEqual([]);
    } finally {
      await runtime.stop();
    }
  });
});

async function createTemporaryRuntimePaths(): Promise<{
  readonly dataRoot: string;
  readonly archiveRoot: string;
}> {
  const tempRoot = await mkdtemp(
    path.join(tmpdir(), "chronarium-offline-capture-")
  );
  temporaryRoots.push(tempRoot);

  return {
    dataRoot: path.join(tempRoot, "data"),
    archiveRoot: path.join(tempRoot, "archives")
  };
}

async function* fixtureMessages(input: {
  readonly adapterId: string;
  readonly sessionId: string;
  readonly events: readonly TimelineEventEnvelope[];
}): AsyncGenerator<AdapterToCoreMessage> {
  const sentAt = "2026-01-01T00:00:00.000Z";

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "fixture-ready-001",
    adapterId: input.adapterId,
    sessionId: input.sessionId,
    type: "adapter.ready",
    sentAt,
    mode: "fixture",
    capabilities: ["fixture.timeline", "media.discovery"]
  };

  for (const event of input.events) {
    yield {
      protocolVersion: ADAPTER_PROTOCOL_VERSION,
      messageId: `fixture-event-${event.sequence}`,
      adapterId: input.adapterId,
      sessionId: input.sessionId,
      type: "fact.timeline",
      sentAt,
      event
    };
  }

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "fixture-finished-001",
    adapterId: input.adapterId,
    sessionId: input.sessionId,
    type: "adapter.finished",
    sentAt,
    reason: "completed",
    summary: {
      syntheticOnly: true
    }
  };
}

async function* failingFixtureMessages(input: {
  readonly adapterId: string;
  readonly sessionId: string;
}): AsyncGenerator<AdapterToCoreMessage> {
  const sentAt = "2026-01-01T00:00:00.000Z";

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "fixture-ready-failed-001",
    adapterId: input.adapterId,
    sessionId: input.sessionId,
    type: "adapter.ready",
    sentAt,
    mode: "fixture",
    capabilities: ["fixture.timeline"]
  };

  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "fixture-error-001",
    adapterId: input.adapterId,
    sessionId: input.sessionId,
    type: "adapter.error",
    sentAt,
    code: "fixture.synthetic_failure",
    message: "Synthetic fixture failed before archive writing.",
    retryable: false,
    redactionStatus: "safe"
  };
}

async function* readyOnlyFixtureMessages(input: {
  readonly adapterId: string;
  readonly sessionId: string;
}): AsyncGenerator<AdapterToCoreMessage> {
  yield {
    protocolVersion: ADAPTER_PROTOCOL_VERSION,
    messageId: "fixture-ready-only-001",
    adapterId: input.adapterId,
    sessionId: input.sessionId,
    type: "adapter.ready",
    sentAt: "2026-01-01T00:00:00.000Z",
    mode: "fixture",
    capabilities: ["fixture.timeline"]
  };
}
