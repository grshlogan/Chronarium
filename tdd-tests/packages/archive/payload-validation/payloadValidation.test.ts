import {
  createFileArchiveWriter,
  validateFileArchive,
  validateFileArchiveStreaming
} from "@chronarium/archive";
import {
  createSyntheticArchiveManifest,
  createSyntheticMediaTrack,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("archive timeline payload validation", () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) =>
        rm(root, { recursive: true, force: true })
      )
    );
  });

  it("flags a known-type fact with a missing required field", async () => {
    const archiveRoot = await writeArchive([
      createSyntheticTimelineEvent({
        type: "media.track.discovered",
        sequence: 1,
        payload: { trackId: "video-main" }
      })
    ]);

    const validation = await validateFileArchive({ rootPath: archiveRoot });
    const payloadIssues = validation.issues.filter(
      (issue) => issue.code === "payload.schema_invalid"
    );

    expect(payloadIssues).toHaveLength(1);
    expect(payloadIssues[0]).toMatchObject({
      severity: "error",
      sequence: 1
    });
    expect(validation.ok).toBe(false);
  });

  it("accepts well-formed media observation facts with no payload issues", async () => {
    const archiveRoot = await writeArchive([
      createSyntheticTimelineEvent({
        type: "media.track.discovered",
        sequence: 1,
        payload: { trackId: "video-main", kind: "video", syntheticOnly: true }
      }),
      createSyntheticTimelineEvent({
        type: "media.segment.observed",
        sequence: 2,
        payload: {
          trackId: "video-main",
          segmentId: "video-segment-0001",
          mediaStartMs: 0,
          durationMs: 2000
        }
      }),
      createSyntheticTimelineEvent({
        type: "media.gap.detected",
        sequence: 3,
        payload: {
          trackId: "video-main",
          previousSegmentId: "video-segment-0001",
          nextSegmentId: "video-segment-0003",
          gapStartMs: 2000,
          gapEndMs: 5000,
          durationMs: 3000
        }
      })
    ]);

    const validation = await validateFileArchive({ rootPath: archiveRoot });
    const streaming = await validateFileArchiveStreaming({
      rootPath: archiveRoot
    });

    expect(
      validation.issues.filter(
        (issue) => issue.code === "payload.schema_invalid"
      )
    ).toEqual([]);
    expect(
      streaming.issues.filter(
        (issue) => issue.code === "payload.schema_invalid"
      )
    ).toEqual([]);
  });

  it("flags an invalid payload in the streaming validation path too", async () => {
    const archiveRoot = await writeArchive([
      createSyntheticTimelineEvent({
        type: "media.gap.detected",
        sequence: 1,
        payload: { trackId: "video-main", level: "warning" }
      })
    ]);

    const streaming = await validateFileArchiveStreaming({
      rootPath: archiveRoot
    });

    expect(
      streaming.issues.some((issue) => issue.code === "payload.schema_invalid")
    ).toBe(true);
  });
});

async function writeArchive(
  events: readonly ReturnType<typeof createSyntheticTimelineEvent>[]
): Promise<string> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-payload-"));
  temporaryRoots.push(tempRoot);
  const archiveRoot = path.join(tempRoot, "session-payload.chron");

  const writer = await createFileArchiveWriter({
    rootPath: archiveRoot,
    createIfMissing: true
  });
  await writer.writeManifest(createSyntheticArchiveManifest());
  await writer.writeMediaTrack(
    createSyntheticMediaTrack({
      id: "video-main",
      kind: "video",
      segmentsPath: "tracks/video-main/segments"
    })
  );
  for (const event of events) {
    await writer.appendTimelineEvent(event);
  }
  await writer.finalize();

  return archiveRoot;
}
