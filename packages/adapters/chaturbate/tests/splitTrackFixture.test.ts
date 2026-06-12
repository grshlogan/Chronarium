import {
  createChaturbateSplitTrackMediaTracks,
  createChaturbateSplitTrackTimelineEvents,
  parseChaturbateSplitTrackFixture,
  runChaturbateFixture
} from "@chronarium/adapter-chaturbate";
import {
  parseAdapterToCoreMessageV1,
  parseTimelineEventEnvelopeV1
} from "@chronarium/schemas";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Chaturbate split track fixture", () => {
  it("builds media tracks and timeline facts from a synthetic split A/V fixture", async () => {
    const fixture = parseChaturbateSplitTrackFixture(await readFixtureJson());
    const mediaTracks = createChaturbateSplitTrackMediaTracks(fixture);
    const events = createChaturbateSplitTrackTimelineEvents(fixture);

    expect(mediaTracks).toMatchObject([
      {
        id: "video-main",
        kind: "video",
        segmentsPath: "tracks/video-main/segments"
      },
      {
        id: "audio-main",
        kind: "audio",
        segmentsPath: "tracks/audio-main/segments"
      }
    ]);
    expect(events.map((event) => event.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(events.map((event) => event.type)).toEqual([
      "media.track.topology_observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed"
    ]);
    expect(events[0]?.payload).toMatchObject({
      protocol: "ll-hls-cmaf",
      trackIds: ["video-main", "audio-main"],
      syntheticOnly: true
    });
    expect(events.every((event) => event.sensitivity === "synthetic")).toBe(
      true
    );
    expect(collectStrings(events).some(isNetworkLikeString)).toBe(false);

    for (const event of events) {
      expect(() => parseTimelineEventEnvelopeV1(event)).not.toThrow();
    }
  });

  it("emits valid adapter messages through the existing fixture runner", async () => {
    const fixture = parseChaturbateSplitTrackFixture(await readFixtureJson());
    const events = createChaturbateSplitTrackTimelineEvents(fixture);
    const messages = [];

    for await (const message of runChaturbateFixture({
      name: fixture.name,
      sessionId: fixture.sessionId,
      events
    })) {
      messages.push(message);
    }

    expect(messages.map((message) => message.type)).toEqual([
      "adapter.ready",
      "fact.timeline",
      "fact.timeline",
      "fact.timeline",
      "fact.timeline",
      "fact.timeline",
      "fact.timeline",
      "fact.timeline",
      "adapter.finished"
    ]);
    expect(messages.filter((message) => message.type === "fact.timeline"))
      .toHaveLength(7);

    for (const message of messages) {
      expect(() => parseAdapterToCoreMessageV1(message)).not.toThrow();
    }
  });

  it("rejects fixture references that look like real network or sensitive sources", async () => {
    const rawFixture = await readFixtureJson();

    expect(() =>
      parseChaturbateSplitTrackFixture(
        withFirstTrackPlaylistReference(
          rawFixture,
          "https://example.invalid/playlist.m3u8"
        )
      )
    ).toThrow(/fixture:\/\/chaturbate/);

    expect(() =>
      parseChaturbateSplitTrackFixture(
        withFirstTrackPlaylistReference(
          rawFixture,
          "fixture://chaturbate/split-audio-video/video.m3u8?token=secret"
        )
      )
    ).toThrow(/query strings/);
  });
});

async function readFixtureJson(): Promise<unknown> {
  const text = await readFile(
    new URL("../fixtures/split-audio-video.synthetic.json", import.meta.url),
    "utf8"
  );

  return JSON.parse(text);
}

function withFirstTrackPlaylistReference(
  value: unknown,
  playlistReference: string
): unknown {
  const fixture = structuredClone(value) as {
    tracks: Array<{ playlistReference: string }>;
  };
  const firstTrack = fixture.tracks[0];
  if (!firstTrack) {
    throw new Error("Fixture must include at least one track.");
  }
  firstTrack.playlistReference = playlistReference;
  return fixture;
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

function isNetworkLikeString(value: string): boolean {
  const lowerValue = value.toLowerCase();
  return (
    lowerValue.startsWith("http://") ||
    lowerValue.startsWith("https://") ||
    lowerValue.includes("token=") ||
    lowerValue.includes("cookie")
  );
}
