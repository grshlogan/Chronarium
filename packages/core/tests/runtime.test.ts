import { createFileArchiveWriter } from "@chronarium/archive";
import { createCoreRuntime } from "@chronarium/core";
import {
  createSyntheticArchiveManifest,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("core runtime lifecycle", () => {
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

  it("reports not-started before start and blocks service access", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: []
    });

    await expect(runtime.getHealth()).resolves.toMatchObject({
      status: "not-started"
    });
    expect(() => runtime.getArchiveIndexService()).toThrow(/not running/);
  });

  it("starts, exposes the archive index service, and stops", async () => {
    const { dataRoot, archiveRoot } = await createTemporaryRuntimePaths();
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: []
    });
    const archivePath = path.join(archiveRoot, "session-synthetic-001.chron");

    await runtime.start();
    await runtime.start();
    await writeSyntheticArchive(archivePath);
    const summary = await runtime
      .getArchiveIndexService()
      .reindexArchive(archivePath);

    await expect(runtime.getHealth()).resolves.toMatchObject({
      status: "running"
    });
    expect((await stat(dataRoot)).isDirectory()).toBe(true);
    expect((await stat(archiveRoot)).isDirectory()).toBe(true);
    expect(summary).toMatchObject({
      archiveId: "archive-synthetic-001",
      validationOk: true
    });
    expect(runtime.getArchiveIndexService().listArchives()).toHaveLength(1);

    await runtime.stop();
    await runtime.stop();

    await expect(runtime.getHealth()).resolves.toMatchObject({
      status: "stopped"
    });
    expect(() => runtime.getArchiveIndexService()).toThrow(/not running/);
  });
});

async function createTemporaryRuntimePaths(): Promise<{
  readonly dataRoot: string;
  readonly archiveRoot: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-runtime-"));
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
