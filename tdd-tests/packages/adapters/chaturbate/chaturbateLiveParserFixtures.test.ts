import {
  CHATURBATE_ADAPTER_MANIFEST,
  createChaturbateLiveParserMediaTracks,
  createChaturbateLiveParserTimelineEvents,
  parseChaturbateLiveParserFixture
} from "@chronarium/adapter-chaturbate";
import { runChaturbateFixture } from "@chronarium/adapter-chaturbate";
import {
  createCoreGuiService,
  createCoreRuntime
} from "@chronarium/core";
import {
  readFileArchive,
  validateFileArchive
} from "@chronarium/archive";
import { openChronariumIndex } from "@chronarium/indexer";
import { parseTimelineEventEnvelopeV1 } from "@chronarium/schemas";
import {
  createSyntheticArchiveManifest,
  createSyntheticSession,
  verifyAdapterFixtureReadiness
} from "@chronarium/testkit";
import { mkdtemp, rm } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach } from "vitest";
import { describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("Chaturbate live parser fixtures", () => {
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

  it("parses synthetic LL-HLS split playlists into media topology facts", async () => {
    const fixture = parseChaturbateLiveParserFixture(
      JSON.parse(await readFixture("live-parser.synthetic.json"))
    );
    const events = createChaturbateLiveParserTimelineEvents(fixture);
    const mediaEvents = events.filter(
      (event) =>
        event.type === "media.track.topology_observed" ||
        event.type === "media.track.discovered" ||
        event.type === "media.segment.observed"
    );

    expect(mediaEvents.map((event) => event.type)).toEqual([
      "media.track.topology_observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed"
    ]);
    expect(mediaEvents[0]?.payload).toMatchObject({
      protocol: "ll-hls-cmaf",
      trackIds: ["video-main", "audio-main"],
      playlistReference: "fixture://chaturbate/live-parser/master.m3u8",
      syntheticOnly: true
    });
    expect(mediaEvents[1]?.payload).toMatchObject({
      trackId: "video-main",
      kind: "video",
      codec: "h264",
      playlistReference: "fixture://chaturbate/live-parser/video-main.m3u8"
    });
    expect(mediaEvents[4]?.payload).toMatchObject({
      trackId: "audio-main",
      kind: "audio",
      codec: "aac",
      playlistReference: "fixture://chaturbate/live-parser/audio-main.m3u8"
    });
    expect(
      mediaEvents
        .filter((event) => event.type === "media.segment.observed")
        .map((event) => event.payload.segmentId)
    ).toEqual([
      "video-main-segment-0101",
      "video-main-segment-0102",
      "audio-main-segment-0201",
      "audio-main-segment-0202"
    ]);

    for (const event of events) {
      expect(() => parseTimelineEventEnvelopeV1(event)).not.toThrow();
    }
    expect(collectStrings(events).some(isForbiddenFixtureString)).toBe(false);
  });

  it("rejects master playlist references that are not backed by fixture playlists", async () => {
    const rawFixture = JSON.parse(await readFixture("live-parser.synthetic.json"));
    rawFixture.masterPlaylist.text = rawFixture.masterPlaylist.text.replace(
      "fixture://chaturbate/live-parser/audio-main.m3u8",
      "fixture://chaturbate/live-parser/unknown-audio.m3u8"
    );

    expect(() => parseChaturbateLiveParserFixture(rawFixture)).toThrow(
      "masterPlaylist references unknown synthetic media playlist"
    );
  });

  it("rejects raw network URLs embedded in playlist text", async () => {
    const rawFixture = JSON.parse(await readFixture("live-parser.synthetic.json"));
    rawFixture.mediaPlaylists[0].text = rawFixture.mediaPlaylists[0].text.replace(
      "fixture://chaturbate/live-parser/video-init.mp4",
      "https://example.invalid/video-init.mp4"
    );

    expect(() => parseChaturbateLiveParserFixture(rawFixture)).toThrow(
      "must use a synthetic fixture://chaturbate/ reference"
    );
  });

  it("parses synthetic room state and chat into timeline facts", async () => {
    const fixture = parseChaturbateLiveParserFixture(
      JSON.parse(await readFixture("live-parser.synthetic.json"))
    );
    const events = createChaturbateLiveParserTimelineEvents(fixture);
    const roomEvent = events.find((event) => event.type === "room.state.changed");
    const chatEvents = events.filter(
      (event) => event.type === "chat.message.observed"
    );

    expect(roomEvent?.payload).toMatchObject({
      state: "online",
      showMode: "ticket",
      viewerCount: 128,
      syntheticOnly: true
    });
    expect(chatEvents.map((event) => event.payload)).toEqual([
      {
        messageId: "chat-synthetic-0001",
        authorRef: "synthetic-author-a",
        body: "Synthetic welcome message.",
        redactionStatus: "synthetic",
        role: "viewer",
        syntheticOnly: true
      },
      {
        messageId: "chat-synthetic-0002",
        authorRef: "synthetic-moderator",
        body: "Synthetic moderation notice.",
        redactionStatus: "synthetic",
        role: "moderator",
        syntheticOnly: true
      }
    ]);

    for (const event of [roomEvent, ...chatEvents]) {
      expect(event).toBeDefined();
      expect(() => parseTimelineEventEnvelopeV1(event)).not.toThrow();
    }
  });

  it("models reconnect, media gap, diagnostic, and adapter error fixtures", async () => {
    const fixture = parseChaturbateLiveParserFixture(
      JSON.parse(await readFixture("live-parser.synthetic.json"))
    );
    const events = createChaturbateLiveParserTimelineEvents(fixture);

    expect(events.map((event) => event.type)).toContain("network.disconnected");
    expect(events.map((event) => event.type)).toContain("network.reconnected");
    expect(events.map((event) => event.type)).toContain("media.gap.detected");
    expect(events.map((event) => event.type)).toContain("diagnostic.note");

    const disconnected = events.find(
      (event) => event.type === "network.disconnected"
    );
    const reconnected = events.find(
      (event) => event.type === "network.reconnected"
    );
    const gap = events.find((event) => event.type === "media.gap.detected");

    expect(disconnected?.payload).toMatchObject({
      reason: "synthetic playlist update interruption",
      affectedTrackIds: ["video-main", "audio-main"],
      syntheticOnly: true
    });
    expect(reconnected?.payload).toMatchObject({
      disconnectedEventId: disconnected?.eventId,
      outageDurationMs: 3000,
      affectedTrackIds: ["video-main", "audio-main"],
      syntheticOnly: true
    });
    expect(gap?.payload).toMatchObject({
      trackId: "video-main",
      previousSegmentId: "video-main-segment-0102",
      nextSegmentId: "video-main-segment-0104",
      gapStartMs: 4000,
      gapEndMs: 7000,
      durationMs: 3000,
      code: "media_gap.detected",
      level: "warning",
      syntheticOnly: true
    });

    const messages = [];
    for await (const message of runChaturbateFixture({
      name: "cb-live-parser-error-synthetic",
      sessionId: fixture.sessionId,
      events: [],
      error: {
        code: "playlist.parse_failed",
        message: "Synthetic fixture parser rejected malformed playlist text.",
        retryable: false,
        redactionStatus: "synthetic"
      }
    })) {
      messages.push(message);
    }

    expect(messages.map((message) => message.type)).toEqual([
      "adapter.ready",
      "adapter.error",
      "adapter.finished"
    ]);
    expect(collectStrings(messages).some(isForbiddenFixtureString)).toBe(false);
  });

  it("passes readiness, offline capture, archive validation, and indexing", async () => {
    const fixture = parseChaturbateLiveParserFixture(
      JSON.parse(await readFixture("live-parser.synthetic.json"))
    );
    const events = createChaturbateLiveParserTimelineEvents(fixture);
    const mediaTracks = createChaturbateLiveParserMediaTracks(fixture);
    const messages = runChaturbateFixture({
      name: fixture.name,
      sessionId: fixture.sessionId,
      events
    });

    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "chaturbate",
        sessionId: fixture.sessionId,
        capabilitiesRequested: [
          "fixture.timeline",
          "media.discovery",
          "room.state",
          "chat.events",
          "diagnostics"
        ]
      },
      messages: runChaturbateFixture({
        name: fixture.name,
        sessionId: fixture.sessionId,
        events
      })
    });

    expect(readiness.ok).toBe(true);
    expect(readiness.issues).toEqual([]);

    const { tempRoot, dataRoot, archiveRoot } = await createTemporaryPaths();
    const session = createSyntheticSession({
      id: fixture.sessionId,
      site: {
        siteId: "chaturbate",
        redactionStatus: "synthetic"
      },
      createdAt: fixture.capturedAt
    });
    const manifest = createSyntheticArchiveManifest({
      archiveId: "archive-cb-live-parser-synthetic-001",
      session,
      createdAt: fixture.capturedAt,
      updatedAt: fixture.capturedAt
    });
    const runtime = createCoreRuntime({
      dataRoot,
      archiveRoot,
      adapters: ["chaturbate"],
      adapterManifests: [CHATURBATE_ADAPTER_MANIFEST]
    });
    const gui = createCoreGuiService({ runtime });
    await runtime.start();

    try {
      const result = await gui.runOfflineFixtureCapture({
        archiveRootPath: path.join(
          archiveRoot,
          "session-cb-live-parser-synthetic-001.chron"
        ),
        task: {
          taskId: "task-cb-live-parser-synthetic-001",
          kind: "capture",
          sessionId: fixture.sessionId,
          adapterId: "chaturbate",
          mode: "fixture",
          capabilitiesRequested: [
            "fixture.timeline",
            "media.discovery",
            "room.state",
            "chat.events",
            "diagnostics"
          ]
        },
        manifest,
        mediaTracks,
        adapterMessages: messages
      });

      expect(result.status).toBe("completed");
      expect(result.indexSummary).toMatchObject({
        archiveId: "archive-cb-live-parser-synthetic-001",
        validationOk: true,
        timelineEventCount: events.length
      });

      const validation = await validateFileArchive({
        rootPath: result.archiveRootPath
      });
      const snapshot = await readFileArchive({
        rootPath: result.archiveRootPath
      });

      expect(validation.ok).toBe(true);
      expect(validation.issues).toEqual([]);
      expect(snapshot.mediaTracks.map((track) => track.id)).toEqual([
        "video-main",
        "audio-main"
      ]);
      expect(snapshot.timelineEvents.map((event) => event.type)).toContain(
        "chat.message.observed"
      );

      const index = openChronariumIndex({
        databasePath: path.join(tempRoot, "chronarium-check.sqlite")
      });
      try {
        const summary = await index.indexArchiveFromPath(result.archiveRootPath);
        expect(summary).toMatchObject({
          archiveId: "archive-cb-live-parser-synthetic-001",
          validationOk: true,
          timelineEventCount: events.length,
          validationIssueCount: 0
        });
        expect(
          index.listTimelineEvents({
            archiveId: summary.archiveId,
            type: "room.state.changed"
          })
        ).toHaveLength(1);
        expect(
          index.listTimelineEvents({
            archiveId: summary.archiveId,
            type: "chat.message.observed"
          })
        ).toHaveLength(2);
      } finally {
        index.close();
      }
    } finally {
      await runtime.stop();
    }
  });
});

async function readFixture(fileName: string): Promise<string> {
  return readFile(
    new URL(
      `../../../../packages/adapters/chaturbate/fixtures/${fileName}`,
      import.meta.url
    ),
    "utf8"
  );
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

async function createTemporaryPaths(): Promise<{
  readonly tempRoot: string;
  readonly dataRoot: string;
  readonly archiveRoot: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-cb-live-parser-"));
  temporaryRoots.push(tempRoot);

  return {
    tempRoot,
    dataRoot: path.join(tempRoot, "data"),
    archiveRoot: path.join(tempRoot, "archives")
  };
}
