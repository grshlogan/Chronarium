import { openChronariumIndex } from "@chronarium/indexer";
import {
  createLargeSyntheticTimelineBuilder,
  createSyntheticArchiveManifest
} from "@chronarium/testkit";
import { readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];
const indexerSourcePath = path.join(
  process.cwd(),
  "packages",
  "indexer",
  "src",
  "archiveIndexer.ts"
);

describe("SQLite indexer timeline batch consumption", () => {
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

  it("indexes a synthetic archive through the timeline batch reader boundary", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-index-"));
    temporaryRoots.push(tempRoot);
    const archiveRoot = path.join(tempRoot, "session-synthetic-001.chron");
    const databasePath = path.join(tempRoot, "chronarium.sqlite");
    const builder = createLargeSyntheticTimelineBuilder({
      eventCount: 25,
      payloadBytes: 8
    });

    await builder.writeArchiveFiles({
      rootPath: archiveRoot,
      manifest: createSyntheticArchiveManifest()
    });

    const index = openChronariumIndex({
      databasePath
    });

    try {
      const summary = await index.indexArchiveFromPath(archiveRoot);
      const events = index.listTimelineEvents({
        archiveId: summary.archiveId
      });

      expect(summary.timelineEventCount).toBe(25);
      expect(summary.validationIssueCount).toBe(0);
      expect(events).toHaveLength(25);
      expect(events[0]).toMatchObject({
        sequence: 1,
        eventId: "event-large-synthetic-000001"
      });
      expect(events[24]).toMatchObject({
        sequence: 25,
        eventId: "event-large-synthetic-000025"
      });
    } finally {
      index.close();
    }
  });

  it("keeps the indexer off full snapshot timeline arrays", () => {
    const source = readFileSync(indexerSourcePath, "utf8");

    expect(source).toContain("readTimelineEventBatches");
    expect(source).toContain("validateFileArchiveStreaming");
    expect(source).not.toContain("report.timelineEvents");
  });
});
