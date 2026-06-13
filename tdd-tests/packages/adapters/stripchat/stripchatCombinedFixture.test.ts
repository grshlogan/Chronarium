import {
  STRIPCHAT_ADAPTER_MANIFEST,
  createStripchatCombinedMediaTracks,
  createStripchatCombinedTimelineEvents,
  parseStripchatCombinedFixture,
  runStripchatFixture
} from "@chronarium/adapter-stripchat";
import { createAdapterCatalog } from "@chronarium/core";
import { verifyAdapterFixtureReadiness } from "@chronarium/testkit";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Stripchat offline combined A/V fixture", () => {
  it("registers as a fixture adapter and passes the readiness gate", async () => {
    const fixture = parseStripchatCombinedFixture(await readFixtureJson());
    const mediaTracks = createStripchatCombinedMediaTracks(fixture);
    const timelineEvents = createStripchatCombinedTimelineEvents(fixture);
    const catalog = createAdapterCatalog({
      manifests: [STRIPCHAT_ADAPTER_MANIFEST]
    });

    const readiness = await verifyAdapterFixtureReadiness({
      request: {
        adapterId: "stripchat",
        sessionId: fixture.sessionId,
        capabilitiesRequested: ["fixture.timeline", "media.discovery"]
      },
      messages: runStripchatFixture({
        name: fixture.name,
        sessionId: fixture.sessionId,
        events: timelineEvents
      })
    });

    expect(catalog.getAdapter("stripchat")).toMatchObject({
      siteId: "stripchat",
      runtimeModes: ["fixture"],
      security: {
        networkAccess: "none",
        requiresCredentials: false,
        emitsSensitiveSourceFields: false
      }
    });
    expect(mediaTracks).toMatchObject([
      {
        id: "combined-main",
        kind: "video",
        segmentsPath: "tracks/combined-main/segments"
      }
    ]);
    expect(timelineEvents.map((event) => event.type)).toEqual([
      "media.track.topology_observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.segment.observed"
    ]);
    expect(readiness).toMatchObject({
      ok: true,
      adapterId: "stripchat",
      sessionId: fixture.sessionId,
      messageCount: 6,
      timelineEventCount: 4
    });
  });

  it("rejects overlapping combined media segments", async () => {
    const rawFixture = await readFixtureJson();
    const fixture = {
      ...asObject(rawFixture),
      track: {
        ...asObject(asObject(rawFixture).track),
        segments: [
          {
            id: "combined-segment-0001",
            sourceSequence: 1,
            mediaStartMs: 0,
            durationMs: 2000
          },
          {
            id: "combined-segment-0002",
            sourceSequence: 2,
            mediaStartMs: 1000,
            durationMs: 2000
          }
        ]
      }
    };

    expect(() => parseStripchatCombinedFixture(fixture)).toThrow(
      /must not overlap or move backwards/
    );
  });

  it("emits a media gap fact for non-contiguous combined segments", async () => {
    const rawFixture = await readFixtureJson();
    const fixture = parseStripchatCombinedFixture({
      ...asObject(rawFixture),
      track: {
        ...asObject(asObject(rawFixture).track),
        segments: [
          {
            id: "combined-segment-0001",
            sourceSequence: 1,
            mediaStartMs: 0,
            durationMs: 2000
          },
          {
            id: "combined-segment-0002",
            sourceSequence: 2,
            mediaStartMs: 5000,
            durationMs: 2000
          }
        ]
      }
    });

    const timelineEvents = createStripchatCombinedTimelineEvents(fixture);

    expect(timelineEvents.map((event) => event.type)).toEqual([
      "media.track.topology_observed",
      "media.track.discovered",
      "media.segment.observed",
      "media.gap.detected",
      "media.segment.observed"
    ]);
    expect(timelineEvents[3]).toMatchObject({
      type: "media.gap.detected",
      monotonicMs: 2000,
      payload: {
        trackId: "combined-main",
        previousSegmentId: "combined-segment-0001",
        nextSegmentId: "combined-segment-0002",
        gapStartMs: 2000,
        gapEndMs: 5000,
        durationMs: 3000
      }
    });
  });
});

async function readFixtureJson(): Promise<unknown> {
  const text = await readFile(
    new URL(
      "../../../../packages/adapters/stripchat/fixtures/combined-av.synthetic.json",
      import.meta.url
    ),
    "utf8"
  );

  return JSON.parse(text);
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected object fixture data.");
  }

  return value as Record<string, unknown>;
}
