import {
  createChaturbateSplitTrackMediaTracks,
  createChaturbateSplitTrackTimelineEvents,
  parseChaturbateSplitTrackFixture
} from "@chronarium/adapter-chaturbate";
import {
  createFileArchiveWriter,
  readFileArchive,
  validateFileArchive
} from "@chronarium/archive";
import { openChronariumIndex } from "@chronarium/indexer";
import {
  createSyntheticArchiveManifest,
  createSyntheticSession
} from "@chronarium/testkit";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("Chaturbate split track archive flow", () => {
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

  it("writes the split A/V fixture into an archive and indexes its facts", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const fixture = parseChaturbateSplitTrackFixture(await readFixtureJson());
    const mediaTracks = createChaturbateSplitTrackMediaTracks(fixture);
    const timelineEvents = createChaturbateSplitTrackTimelineEvents(fixture);
    const session = createSyntheticSession({
      id: fixture.sessionId,
      site: {
        siteId: "chaturbate",
        redactionStatus: "synthetic"
      },
      createdAt: fixture.capturedAt
    });
    const manifest = createSyntheticArchiveManifest({
      archiveId: "archive-cb-synthetic-split-001",
      session,
      createdAt: fixture.capturedAt,
      updatedAt: fixture.capturedAt
    });

    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });
    await writer.writeManifest(manifest);
    for (const mediaTrack of mediaTracks) {
      await writer.writeMediaTrack(mediaTrack);
    }
    for (const event of timelineEvents) {
      await writer.appendTimelineEvent(event);
    }
    await writer.finalize();

    const validation = await validateFileArchive({
      rootPath: archiveRoot
    });
    const snapshot = await readFileArchive({
      rootPath: archiveRoot
    });

    expect(validation.ok).toBe(true);
    expect(validation.issues).toEqual([]);
    expect(snapshot.mediaTracks.map((track) => track.id)).toEqual([
      "video-main",
      "audio-main"
    ]);
    expect(snapshot.manifest.timeline).toMatchObject({
      eventCount: 7,
      lastSequence: 7
    });
    expect(snapshot.timelineEvents.map((event) => event.type)).toEqual([
      "media.track.topology_observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed"
    ]);

    const index = openChronariumIndex({
      databasePath
    });

    try {
      const summary = await index.indexArchiveFromPath(archiveRoot);
      const archive = index.getArchive(summary.archiveId);
      const trackEvents = index.listTimelineEvents({
        archiveId: summary.archiveId,
        type: "media.track.discovered"
      });
      const segmentEvents = index.listTimelineEvents({
        archiveId: summary.archiveId,
        type: "media.segment.observed"
      });
      const issues = index.listValidationIssues({
        archiveId: summary.archiveId
      });

      expect(summary).toMatchObject({
        archiveId: "archive-cb-synthetic-split-001",
        sessionId: fixture.sessionId,
        validationOk: true,
        timelineEventCount: 7,
        validationIssueCount: 0
      });
      expect(archive).toMatchObject({
        siteId: "chaturbate",
        timelineEventCount: 7,
        timelineLastSequence: 7,
        validationOk: true
      });
      expect(trackEvents).toHaveLength(2);
      expect(segmentEvents).toHaveLength(4);
      expect(
        segmentEvents.map((event) => JSON.parse(event.payloadJson).segmentId)
      ).toEqual([
        "video-segment-0001",
        "video-segment-0002",
        "audio-segment-0001",
        "audio-segment-0002"
      ]);
      expect(issues).toEqual([]);
    } finally {
      index.close();
    }
  });
});

async function createTemporaryPaths(): Promise<{
  readonly archiveRoot: string;
  readonly databasePath: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-cb-flow-"));
  temporaryRoots.push(tempRoot);

  return {
    archiveRoot: path.join(tempRoot, "session-cb-synthetic-001.chron"),
    databasePath: path.join(tempRoot, "chronarium.sqlite")
  };
}

async function readFixtureJson(): Promise<unknown> {
  const text = await readFile(
    new URL("../fixtures/split-audio-video.synthetic.json", import.meta.url),
    "utf8"
  );

  return JSON.parse(text);
}
