import { createFileArchiveWriter } from "@chronarium/archive";
import { createCoreGuiService, createCoreRuntime } from "@chronarium/core";
import {
  createSyntheticArchiveManifest,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("core GUI service facade", () => {
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

  it("exposes health, archive, recovery, maintenance, and index queries", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: []
    });
    const gui = createCoreGuiService({
      runtime
    });
    const archivePath = path.join(archiveRoot, "session-synthetic-001.chron");

    await runtime.start();

    try {
      await writeSyntheticArchive(archivePath);

      const health = await gui.getHealth();
      const validation = await gui.validateArchive(archivePath);
      const recovery = await gui.inspectArchiveRecovery(archivePath);
      const maintenance = await gui.inspectArchiveMaintenance(archivePath);
      const summary = await gui.reindexArchive(archivePath);
      const archives = gui.listArchives({
        sessionId: summary.sessionId
      });
      const timelineEvents = gui.listTimelineEvents({
        archiveId: summary.archiveId
      });
      const validationIssues = gui.listValidationIssues({
        archiveId: summary.archiveId
      });

      expect(health.status).toBe("running");
      expect(validation.ok).toBe(true);
      expect(recovery.status).toBe("healthy");
      expect(maintenance.status).toBe("healthy");
      expect(summary).toMatchObject({
        archiveId: "archive-synthetic-001",
        validationOk: true,
        timelineEventCount: 1
      });
      expect(archives).toHaveLength(1);
      expect(timelineEvents.map((event) => event.type)).toEqual([
        "session.created"
      ]);
      expect(validationIssues).toEqual([]);
    } finally {
      await runtime.stop();
    }
  });

  it("blocks archive operations before the runtime is started", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: []
    });
    const gui = createCoreGuiService({
      runtime
    });

    await expect(gui.getHealth()).resolves.toMatchObject({
      status: "not-started"
    });
    expect(() => gui.listArchives()).toThrow(/not running/);
    await expect(gui.validateArchive(archiveRoot)).rejects.toThrow(/not running/);
  });
});

async function createTemporaryRuntimePaths(): Promise<{
  readonly dataRoot: string;
  readonly archiveRoot: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-gui-"));
  temporaryRoots.push(tempRoot);

  return {
    dataRoot: path.join(tempRoot, "data"),
    archiveRoot: path.join(tempRoot, "archives")
  };
}

async function writeSyntheticArchive(archivePath: string): Promise<void> {
  const writer = await createFileArchiveWriter({
    rootPath: archivePath,
    createIfMissing: true
  });

  await writer.writeManifest(createSyntheticArchiveManifest());
  await writer.appendTimelineEvent(
    createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    })
  );
  await writer.finalize();
}
