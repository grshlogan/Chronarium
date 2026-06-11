import {
  createFileArchiveWriter,
  getMediaTrackMetadataPath
} from "@chronarium/archive";
import { createCoreArchiveIndexService } from "@chronarium/core";
import { openChronariumIndex } from "@chronarium/indexer";
import {
  createSyntheticArchiveManifest,
  createSyntheticMediaTrack,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("core archive index service", () => {
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

  it("validates, reads, and reindexes a synthetic archive", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const track = createSyntheticMediaTrack();
    await writeSyntheticArchive(archiveRoot, track);
    const index = openChronariumIndex({
      databasePath
    });
    const service = createCoreArchiveIndexService({
      index
    });

    try {
      const validation = await service.validateArchive(archiveRoot);
      const snapshot = await service.readArchive(archiveRoot);
      const summary = await service.reindexArchive(archiveRoot);
      const archives = service.listArchives({
        sessionId: summary.sessionId
      });
      const events = service.listTimelineEvents({
        archiveId: summary.archiveId
      });

      expect(validation.ok).toBe(true);
      expect(snapshot.mediaTracks.map((mediaTrack) => mediaTrack.id)).toEqual([
        track.id
      ]);
      expect(summary).toMatchObject({
        archiveId: "archive-synthetic-001",
        sessionId: "session-synthetic-001",
        validationOk: true,
        timelineEventCount: 1,
        validationIssueCount: 0
      });
      expect(archives).toHaveLength(1);
      expect(events.map((event) => event.type)).toEqual(["session.created"]);
    } finally {
      index.close();
    }
  });

  it("surfaces validation issues through the core query API", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const track = createSyntheticMediaTrack();
    await writeSyntheticArchive(archiveRoot, track);
    await unlink(
      path.join(archiveRoot, ...getMediaTrackMetadataPath(track.id).split("/"))
    );
    const index = openChronariumIndex({
      databasePath
    });
    const service = createCoreArchiveIndexService({
      index
    });

    try {
      const validation = await service.validateArchive(archiveRoot);
      const summary = await service.reindexArchive(archiveRoot);
      const issues = service.listValidationIssues({
        archiveId: summary.archiveId
      });

      expect(validation.ok).toBe(false);
      expect(summary.validationOk).toBe(false);
      expect(issues.map((issue) => issue.code)).toContain(
        "track.missing_file"
      );
    } finally {
      index.close();
    }
  });
});

async function createTemporaryPaths(): Promise<{
  readonly archiveRoot: string;
  readonly databasePath: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-core-"));
  temporaryRoots.push(tempRoot);

  return {
    archiveRoot: path.join(tempRoot, "session-synthetic-001.chron"),
    databasePath: path.join(tempRoot, "chronarium.sqlite")
  };
}

async function writeSyntheticArchive(
  archiveRoot: string,
  track: ReturnType<typeof createSyntheticMediaTrack>
): Promise<void> {
  const writer = await createFileArchiveWriter({
    rootPath: archiveRoot,
    createIfMissing: true
  });

  await writer.writeManifest(createSyntheticArchiveManifest());
  await writer.writeMediaTrack(track);
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
