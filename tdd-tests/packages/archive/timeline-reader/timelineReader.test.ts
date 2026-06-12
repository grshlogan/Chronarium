import {
  createFileArchiveWriter,
  DEFAULT_ARCHIVE_LAYOUT,
  iterateTimelineRecords,
  readTimelineEventBatches
} from "@chronarium/archive";
import { createSyntheticArchiveManifest, createSyntheticTimelineEvent } from "@chronarium/testkit";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("archive timeline reader", () => {
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

  it("reads timeline events through bounded batches", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
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
    await writer.appendTimelineEvent(
      createSyntheticTimelineEvent({
        type: "adapter.started",
        sequence: 2,
        payload: {
          adapterId: "fixture"
        }
      })
    );
    await writer.appendTimelineEvent(
      createSyntheticTimelineEvent({
        type: "media.segment.observed",
        sequence: 3,
        payload: {
          trackId: "track-synthetic-video-001",
          segmentId: "segment-0001"
        }
      })
    );
    await writer.finalize();

    const batches = [];
    for await (const batch of readTimelineEventBatches({
      rootPath: archiveRoot,
      batchSize: 2
    })) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(2);
    expect(batches.map((batch) => batch.events.length)).toEqual([2, 1]);
    expect(batches.flatMap((batch) => batch.events.map((event) => event.sequence))).toEqual([
      1,
      2,
      3
    ]);
    expect(batches.flatMap((batch) => batch.issues)).toEqual([]);
    expect(batches.map((batch) => [batch.startLine, batch.endLine])).toEqual([
      [1, 2],
      [3, 3]
    ]);
  });

  it("streams invalid timeline lines as diagnostics without throwing", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await mkdir(archiveRoot, {
      recursive: true
    });
    await writeFile(
      path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.timeline),
      `${JSON.stringify(event)}\n{not-json}\n\n`,
      "utf8"
    );

    const records = [];
    for await (const record of iterateTimelineRecords({
      rootPath: archiveRoot
    })) {
      records.push(record);
    }

    expect(records.map((record) => record.kind)).toEqual([
      "event",
      "issue",
      "issue"
    ]);
    expect(records[0]).toMatchObject({
      kind: "event",
      line: 1
    });
    expect(records[1]).toMatchObject({
      kind: "issue",
      line: 2,
      issue: {
        code: "timeline.invalid_jsonl"
      }
    });
    expect(records[2]).toMatchObject({
      kind: "issue",
      line: 3,
      issue: {
        code: "timeline.invalid_jsonl"
      }
    });
  });
});

async function createTemporaryArchiveRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-test-"));
  temporaryRoots.push(tempRoot);
  return path.join(tempRoot, "session-synthetic-001.chron");
}
