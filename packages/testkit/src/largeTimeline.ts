import type {
  ArchiveManifest,
  JsonObject,
  TimelineEventEnvelope,
  TimelineEventType
} from "@chronarium/types";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_SESSION_ID = "session-synthetic-001";
const DEFAULT_TIME = "2026-01-01T00:00:00.000Z";
const DEFAULT_PAYLOAD_BYTES = 32;
const EVENT_TYPE_CYCLE = [
  "session.synthetic_tick",
  "media.segment.synthetic_tick",
  "chat.synthetic_tick",
  "diagnostic.synthetic_tick"
] as const satisfies readonly TimelineEventType[];

export interface LargeSyntheticTimelineBuilderOptions {
  readonly eventCount: number;
  readonly sessionId?: string;
  readonly payloadBytes?: number;
  readonly eventTypes?: readonly TimelineEventType[];
}

export interface LargeSyntheticTimelineArchiveWriteOptions {
  readonly rootPath: string;
  readonly manifest: ArchiveManifest;
}

export interface LargeSyntheticTimelineBuilder {
  events(): Iterable<TimelineEventEnvelope>;
  timelineJsonlChunks(): AsyncIterable<string>;
  writeArchiveFiles(
    options: LargeSyntheticTimelineArchiveWriteOptions
  ): Promise<ArchiveManifest>;
}

export function createLargeSyntheticTimelineBuilder(
  options: LargeSyntheticTimelineBuilderOptions
): LargeSyntheticTimelineBuilder {
  assertNonNegativeInteger(options.eventCount, "eventCount");
  const payloadBytes = options.payloadBytes ?? DEFAULT_PAYLOAD_BYTES;
  assertNonNegativeInteger(payloadBytes, "payloadBytes");

  const eventTypes =
    options.eventTypes && options.eventTypes.length > 0
      ? options.eventTypes
      : EVENT_TYPE_CYCLE;
  const sessionId = options.sessionId ?? DEFAULT_SESSION_ID;

  return {
    events(): Iterable<TimelineEventEnvelope> {
      return createEventIterable({
        eventCount: options.eventCount,
        eventTypes,
        payloadBytes,
        sessionId
      });
    },

    async *timelineJsonlChunks(): AsyncIterable<string> {
      for (const event of createEventIterable({
        eventCount: options.eventCount,
        eventTypes,
        payloadBytes,
        sessionId
      })) {
        yield `${JSON.stringify(event)}\n`;
      }
    },

    async writeArchiveFiles(
      writeOptions: LargeSyntheticTimelineArchiveWriteOptions
    ): Promise<ArchiveManifest> {
      const manifest = createManifestWithTimelineCounts(
        writeOptions.manifest,
        options.eventCount
      );
      await mkdir(writeOptions.rootPath, {
        recursive: true
      });
      await mkdir(path.join(writeOptions.rootPath, manifest.paths.events), {
        recursive: true
      });
      await mkdir(path.join(writeOptions.rootPath, manifest.paths.tracks), {
        recursive: true
      });
      await mkdir(path.join(writeOptions.rootPath, manifest.paths.diagnostics), {
        recursive: true
      });
      await mkdir(path.join(writeOptions.rootPath, manifest.paths.exports), {
        recursive: true
      });

      await writeFile(
        path.join(writeOptions.rootPath, "manifest.json"),
        `${JSON.stringify(manifest, null, 2)}\n`,
        "utf8"
      );

      const timelinePath = path.join(
        writeOptions.rootPath,
        ...manifest.timeline.path.split("/")
      );
      await writeFile(timelinePath, this.timelineJsonlChunks(), "utf8");

      return manifest;
    }
  };
}

function* createEventIterable(input: {
  readonly eventCount: number;
  readonly eventTypes: readonly TimelineEventType[];
  readonly payloadBytes: number;
  readonly sessionId: string;
}): Iterable<TimelineEventEnvelope> {
  for (let index = 0; index < input.eventCount; index += 1) {
    const sequence = index + 1;
    yield {
      schemaVersion: 1,
      eventId: `event-large-synthetic-${String(sequence).padStart(6, "0")}`,
      sessionId: input.sessionId,
      type: input.eventTypes[index % input.eventTypes.length]!,
      sequence,
      capturedAt: DEFAULT_TIME,
      sourceTime: DEFAULT_TIME,
      monotonicMs: index,
      source: {
        adapterId: "fixture",
        siteId: "synthetic",
        redactionStatus: "synthetic"
      },
      sensitivity: "synthetic",
      payload: createPayload(sequence, input.payloadBytes)
    };
  }
}

function createPayload(sequence: number, payloadBytes: number): JsonObject {
  return {
    synthetic: true,
    sequence,
    pad: "x".repeat(payloadBytes)
  };
}

function createManifestWithTimelineCounts(
  manifest: ArchiveManifest,
  eventCount: number
): ArchiveManifest {
  return {
    ...manifest,
    timeline: {
      ...manifest.timeline,
      eventCount,
      ...(eventCount === 0 ? {} : { lastSequence: eventCount })
    }
  };
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}
