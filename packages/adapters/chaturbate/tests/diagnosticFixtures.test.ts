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
import { parseTimelineEventEnvelopeV1 } from "@chronarium/schemas";
import {
  createSyntheticArchiveManifest,
  createSyntheticSession
} from "@chronarium/testkit";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("Chaturbate diagnostic fixtures", () => {
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

  it("builds a missing-audio diagnostic timeline from synthetic fixture data", async () => {
    const fixture = parseChaturbateSplitTrackFixture(
      await readFixtureJson("missing-audio.synthetic.json")
    );
    const mediaTracks = createChaturbateSplitTrackMediaTracks(fixture);
    const events = createChaturbateSplitTrackTimelineEvents(fixture);
    const diagnosticEvent = events.at(-1);

    expect(mediaTracks.map((track) => track.kind)).toEqual(["video"]);
    expect(events.map((event) => event.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(events.map((event) => event.type)).toEqual([
      "media.track.topology_observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed",
      "diagnostic.media_tool_output"
    ]);
    expect(diagnosticEvent?.payload).toMatchObject({
      level: "error",
      code: "media_tool.audio_track_missing",
      evidenceLevel: "synthetic-contract",
      affectedTrackIds: ["video-main"],
      syntheticOnly: true
    });
    expect(collectStrings(events).some(isForbiddenFixtureString)).toBe(false);

    for (const event of events) {
      expect(() => parseTimelineEventEnvelopeV1(event)).not.toThrow();
    }
  });

  it("builds gap, duration mismatch, and stalled-output timeline facts", async () => {
    const fixture = parseChaturbateSplitTrackFixture(
      await readFixtureJson("diagnostic-anomalies.synthetic.json")
    );
    const events = createChaturbateSplitTrackTimelineEvents(fixture);

    expect(events.map((event) => event.sequence)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ]);
    expect(events.map((event) => event.type)).toEqual([
      "media.track.topology_observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed",
      "media.segment.observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed",
      "media.gap.detected",
      "diagnostic.duration_mismatch",
      "diagnostic.media_tool_output"
    ]);
    expect(events.slice(-3).map((event) => event.payload.code)).toEqual([
      "media_gap.detected",
      "media_tool.duration_mismatch",
      "media_tool.output_stalled"
    ]);
    expect(events.at(-3)?.payload).toMatchObject({
      trackId: "video-main",
      previousSegmentId: "video-segment-0002",
      nextSegmentId: "video-segment-0004",
      gapStartMs: 4000,
      gapEndMs: 7000,
      durationMs: 3000,
      code: "media_gap.detected",
      level: "warning"
    });
    expect(collectStrings(events).some(isForbiddenFixtureString)).toBe(false);

    for (const event of events) {
      expect(() => parseTimelineEventEnvelopeV1(event)).not.toThrow();
    }
  });

  it("persists diagnostic facts through archive validation and SQLite indexing", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const fixture = parseChaturbateSplitTrackFixture(
      await readFixtureJson("diagnostic-anomalies.synthetic.json")
    );
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
      archiveId: "archive-cb-synthetic-diagnostic-001",
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
    expect(snapshot.timelineEvents).toHaveLength(11);
    expect(snapshot.manifest.timeline).toMatchObject({
      eventCount: 11,
      lastSequence: 11
    });

    const index = openChronariumIndex({
      databasePath
    });

    try {
      const summary = await index.indexArchiveFromPath(archiveRoot);
      const gapEvents = index.listTimelineEvents({
        archiveId: summary.archiveId,
        type: "media.gap.detected"
      });
      const mismatchEvents = index.listTimelineEvents({
        archiveId: summary.archiveId,
        type: "diagnostic.duration_mismatch"
      });
      const toolEvents = index.listTimelineEvents({
        archiveId: summary.archiveId,
        type: "diagnostic.media_tool_output"
      });

      expect(summary).toMatchObject({
        archiveId: "archive-cb-synthetic-diagnostic-001",
        timelineEventCount: 11,
        validationIssueCount: 0,
        validationOk: true
      });
      expect(gapEvents).toHaveLength(1);
      expect(JSON.parse(gapEvents[0]?.payloadJson ?? "{}")).toMatchObject({
        trackId: "video-main",
        previousSegmentId: "video-segment-0002",
        nextSegmentId: "video-segment-0004",
        gapStartMs: 4000,
        gapEndMs: 7000,
        durationMs: 3000,
        code: "media_gap.detected",
        evidenceLevel: "synthetic-contract",
        level: "warning"
      });
      expect(mismatchEvents).toHaveLength(1);
      expect(JSON.parse(mismatchEvents[0]?.payloadJson ?? "{}")).toMatchObject({
        code: "media_tool.duration_mismatch",
        evidence: {
          differenceMs: 5500
        }
      });
      expect(toolEvents).toHaveLength(1);
      expect(JSON.parse(toolEvents[0]?.payloadJson ?? "{}")).toMatchObject({
        code: "media_tool.output_stalled",
        level: "error"
      });
    } finally {
      index.close();
    }
  });
});

async function createTemporaryPaths(): Promise<{
  readonly archiveRoot: string;
  readonly databasePath: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-cb-diag-"));
  temporaryRoots.push(tempRoot);

  return {
    archiveRoot: path.join(tempRoot, "session-cb-synthetic-diagnostic.chron"),
    databasePath: path.join(tempRoot, "chronarium.sqlite")
  };
}

async function readFixtureJson(fileName: string): Promise<unknown> {
  const text = await readFile(
    new URL(`../fixtures/${fileName}`, import.meta.url),
    "utf8"
  );

  return JSON.parse(text);
}

function collectStrings(value: unknown): readonly string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap((item) => collectStrings(item));
  }

  return [];
}

function isForbiddenFixtureString(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return (
    lowerValue.startsWith("http://") ||
    lowerValue.startsWith("https://") ||
    lowerValue.includes("token=") ||
    lowerValue.includes("cookie") ||
    lowerValue.includes("authorization") ||
    lowerValue.includes("bearer")
  );
}
