import {
  STRIPCHAT_ADAPTER_MANIFEST,
  createStripchatCombinedMediaTracks,
  createStripchatCombinedTimelineEvents,
  parseStripchatCombinedFixture,
  runStripchatFixture
} from "@chronarium/adapter-stripchat";
import { createCoreGuiService, createCoreRuntime } from "@chronarium/core";
import {
  createSyntheticArchiveManifest,
  createSyntheticSession
} from "@chronarium/testkit";
import type { AdapterToCoreMessage } from "@chronarium/types";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("core adapter task gate", () => {
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

  it("fails fixture capture before adapter startup when the adapter is not registered", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["stripchat"],
      adapterManifests: [STRIPCHAT_ADAPTER_MANIFEST]
    });
    const gui = createCoreGuiService({
      runtime
    });
    const session = createSyntheticSession({
      id: "session-unregistered-adapter-001",
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
          "session-unregistered-adapter-001.chron"
        ),
        task: {
          taskId: "task-unregistered-adapter-001",
          kind: "capture",
          sessionId: session.id,
          adapterId: "chaturbate",
          mode: "fixture",
          capabilitiesRequested: ["fixture.timeline"]
        },
        manifest: createSyntheticArchiveManifest({
          archiveId: "archive-unregistered-adapter-001",
          session
        }),
        adapterMessages: adapterMessagesThatMustNotStart()
      });

      expect(result).toMatchObject({
        status: "failed",
        task: {
          status: "failed",
          failure: {
            code: "adapter.catalog.unregistered",
            retryable: false
          }
        }
      });
      expect(result.lifecycle).toBeUndefined();
      expect(gui.listArchives({ sessionId: session.id })).toEqual([]);
    } finally {
      await runtime.stop();
    }
  });

  it("runs a registered Stripchat fixture through gated offline capture", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["stripchat"],
      adapterManifests: [STRIPCHAT_ADAPTER_MANIFEST]
    });
    const gui = createCoreGuiService({
      runtime
    });
    const fixture = parseStripchatCombinedFixture(
      await readStripchatFixtureJson()
    );
    const session = createSyntheticSession({
      id: fixture.sessionId,
      site: {
        siteId: "stripchat",
        redactionStatus: "synthetic"
      }
    });
    const timelineEvents = createStripchatCombinedTimelineEvents(fixture);

    await runtime.start();

    try {
      const result = await gui.runOfflineFixtureCapture({
        archiveRootPath: path.join(
          archiveRoot,
          "session-stripchat-gated-001.chron"
        ),
        task: {
          taskId: "task-stripchat-gated-001",
          kind: "capture",
          sessionId: fixture.sessionId,
          adapterId: "stripchat",
          mode: "fixture",
          capabilitiesRequested: ["fixture.timeline", "media.discovery"]
        },
        manifest: createSyntheticArchiveManifest({
          archiveId: "archive-stripchat-gated-001",
          session
        }),
        mediaTracks: createStripchatCombinedMediaTracks(fixture),
        adapterMessages: runStripchatFixture({
          name: fixture.name,
          sessionId: fixture.sessionId,
          events: timelineEvents
        })
      });

      expect(result).toMatchObject({
        status: "completed",
        lifecycle: {
          status: "finished",
          messageCount: 11
        },
        indexSummary: {
          archiveId: "archive-stripchat-gated-001",
          sessionId: fixture.sessionId,
          validationOk: true,
          timelineEventCount: 9
        }
      });
      expect(
        gui.listTimelineEvents({
          archiveId: "archive-stripchat-gated-001"
        }).map((event) => event.type)
      ).toEqual([
        "media.track.topology_observed",
        "room.state.changed",
        "chat.message.observed",
        "network.disconnected",
        "network.reconnected",
        "media.track.discovered",
        "media.segment.observed",
        "media.gap.detected",
        "media.segment.observed"
      ]);
    } finally {
      await runtime.stop();
    }
  });
});

async function createTemporaryRuntimePaths(): Promise<{
  readonly dataRoot: string;
  readonly archiveRoot: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-adapter-gate-"));
  temporaryRoots.push(tempRoot);

  return {
    dataRoot: path.join(tempRoot, "data"),
    archiveRoot: path.join(tempRoot, "archives")
  };
}

async function* adapterMessagesThatMustNotStart(): AsyncGenerator<AdapterToCoreMessage> {
  throw new Error("Adapter messages should not be consumed before catalog gating.");
}

async function readStripchatFixtureJson(): Promise<unknown> {
  const text = await readFile(
    new URL(
      "../../../../packages/adapters/stripchat/fixtures/combined-av.synthetic.json",
      import.meta.url
    ),
    "utf8"
  );

  return JSON.parse(text);
}
