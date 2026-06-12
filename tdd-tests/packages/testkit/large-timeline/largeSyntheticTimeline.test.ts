import { readTimelineEventBatches } from "@chronarium/archive";
import {
  createLargeSyntheticTimelineBuilder,
  createSyntheticArchiveManifest
} from "@chronarium/testkit";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("large synthetic timeline builder", () => {
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

  it("generates deterministic timeline events without building an event array", () => {
    const builder = createLargeSyntheticTimelineBuilder({
      eventCount: 3,
      payloadBytes: 12
    });

    expect([...builder.events()].map((event) => event)).toMatchObject([
      {
        eventId: "event-large-synthetic-000001",
        sequence: 1,
        type: "session.synthetic_tick"
      },
      {
        eventId: "event-large-synthetic-000002",
        sequence: 2,
        type: "media.segment.synthetic_tick"
      },
      {
        eventId: "event-large-synthetic-000003",
        sequence: 3,
        type: "chat.synthetic_tick"
      }
    ]);
  });

  it("writes deterministic JSONL that can be read through timeline batches", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const builder = createLargeSyntheticTimelineBuilder({
      eventCount: 5,
      payloadBytes: 16
    });

    await builder.writeArchiveFiles({
      rootPath: archiveRoot,
      manifest: createSyntheticArchiveManifest()
    });

    const batches = [];
    for await (const batch of readTimelineEventBatches({
      rootPath: archiveRoot,
      batchSize: 2
    })) {
      batches.push(batch);
    }

    expect(batches.map((batch) => batch.events.length)).toEqual([2, 2, 1]);
    expect(batches.flatMap((batch) => batch.issues)).toEqual([]);
    expect(batches.flatMap((batch) => batch.events.map((event) => event.sequence))).toEqual([
      1,
      2,
      3,
      4,
      5
    ]);
  });

  it("can stream JSONL text into a caller-owned writer", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-test-"));
    temporaryRoots.push(tempRoot);
    const timelinePath = path.join(tempRoot, "timeline.jsonl");
    const chunks: string[] = [];
    const builder = createLargeSyntheticTimelineBuilder({
      eventCount: 4
    });

    for await (const chunk of builder.timelineJsonlChunks()) {
      chunks.push(chunk);
    }
    await mkdir(tempRoot, {
      recursive: true
    });
    await writeFile(timelinePath, chunks.join(""), "utf8");

    expect(chunks).toHaveLength(4);
    expect(chunks[0]).toContain("event-large-synthetic-000001");
    expect(chunks[3]).toContain("event-large-synthetic-000004");
  });
});

async function createTemporaryArchiveRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-test-"));
  temporaryRoots.push(tempRoot);
  return path.join(tempRoot, "session-synthetic-001.chron");
}
