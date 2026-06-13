import {
  STRIPCHAT_ADAPTER_MANIFEST,
  createStripchatCombinedMediaTracks,
  createStripchatCombinedTimelineEvents,
  parseStripchatCombinedFixture,
  runStripchatFixture
} from "@chronarium/adapter-stripchat";
import {
  createCoreGuiService,
  createCoreRuntime,
  createCredentialStore
} from "@chronarium/core";
import {
  createSyntheticArchiveManifest,
  createSyntheticSession
} from "@chronarium/testkit";
import type { AdapterToCoreMessage, CredentialProfile } from "@chronarium/types";
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

  it("fails gated capture before adapter startup when no usable credential is bound", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["stripchat"],
      adapterManifests: [STRIPCHAT_ADAPTER_MANIFEST],
      credentialStore: createCredentialStore({
        profiles: [],
        bindings: []
      })
    });
    const gui = createCoreGuiService({
      runtime
    });
    const session = createSyntheticSession({
      id: "session-missing-credential-001",
      site: {
        siteId: "stripchat",
        redactionStatus: "synthetic"
      }
    });

    await runtime.start();

    try {
      const result = await gui.runOfflineFixtureCapture({
        archiveRootPath: path.join(
          archiveRoot,
          "session-missing-credential-001.chron"
        ),
        task: {
          taskId: "task-missing-credential-001",
          kind: "capture",
          sessionId: session.id,
          adapterId: "stripchat",
          mode: "fixture",
          capabilitiesRequested: ["fixture.timeline"],
          recordingIntent: "ticket",
          streamerRef: "streamer:redacted-stripchat-001"
        },
        manifest: createSyntheticArchiveManifest({
          archiveId: "archive-missing-credential-001",
          session
        }),
        adapterMessages: adapterMessagesThatMustNotStart()
      });

      expect(result).toMatchObject({
        status: "failed",
        task: {
          status: "failed",
          failure: {
            code: "credential.missing",
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

  it("allows gated capture when an entitled synthetic credential is bound", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const fixture = parseStripchatCombinedFixture(
      await readStripchatFixtureJson()
    );
    const streamerRef = "streamer:redacted-stripchat-001";
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["stripchat"],
      adapterManifests: [STRIPCHAT_ADAPTER_MANIFEST],
      credentialStore: createCredentialStore({
        profiles: [syntheticCredentialProfile({ siteId: "stripchat" })],
        bindings: [
          {
            streamerRef,
            siteId: "stripchat",
            policy: "capability-match-failover",
            entries: [{ profileId: "profile-ticket-001", priority: 0 }]
          }
        ]
      })
    });
    const gui = createCoreGuiService({
      runtime
    });
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
          "session-entitled-credential-001.chron"
        ),
        task: {
          taskId: "task-entitled-credential-001",
          kind: "capture",
          sessionId: fixture.sessionId,
          adapterId: "stripchat",
          mode: "fixture",
          capabilitiesRequested: ["fixture.timeline", "media.discovery"],
          recordingIntent: "ticket",
          streamerRef
        },
        manifest: createSyntheticArchiveManifest({
          archiveId: "archive-entitled-credential-001",
          session
        }),
        mediaTracks: createStripchatCombinedMediaTracks(fixture),
        adapterMessages: runStripchatFixture({
          name: fixture.name,
          sessionId: fixture.sessionId,
          events: timelineEvents
        })
      });

      expect(result.status).toBe("completed");
      expect(result.indexSummary).toMatchObject({
        archiveId: "archive-entitled-credential-001",
        validationOk: true
      });
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

function syntheticCredentialProfile(
  overrides: Partial<CredentialProfile>
): CredentialProfile {
  return {
    id: "profile-ticket-001",
    siteId: "stripchat",
    label: "Synthetic ticket profile",
    storageHandle: "fixture://credential/profile-ticket-001",
    entitlements: [{ intent: "ticket", scope: "site" }],
    health: "ok",
    ...overrides
  };
}
