import {
  createFileArchiveWriter,
  DEFAULT_ARCHIVE_LAYOUT,
  readFileArchive,
  validateFileArchive
} from "@chronarium/archive";
import type {
  ArchiveManifest,
  TimelineEventEnvelope
} from "@chronarium/types";
import {
  createSyntheticArchiveManifest as createBaseSyntheticArchiveManifest,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("archive reader and validator", () => {
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

  it("reads a valid synthetic .chron package", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });
    const manifest = createArchiveManifestWithTimelineIndex();
    const firstEvent = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });
    const secondEvent = createSyntheticTimelineEvent({
      type: "adapter.started",
      sequence: 2,
      payload: {
        adapterId: "fixture"
      }
    });

    await writer.writeManifest(manifest);
    await writer.appendTimelineEvent(firstEvent);
    await writer.appendTimelineEvent(secondEvent);
    await writer.finalize();

    const snapshot = await readFileArchive({
      rootPath: archiveRoot
    });

    expect(snapshot.validation.ok).toBe(true);
    expect(snapshot.validation.issues).toEqual([]);
    expect(snapshot.manifest.timeline.eventCount).toBe(2);
    expect(snapshot.manifest.timeline.lastSequence).toBe(2);
    expect(snapshot.timelineEvents.map((event) => event.type)).toEqual([
      "session.created",
      "adapter.started"
    ]);
  });

  it("reads a manifest-only package with an empty timeline", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });

    await writer.writeManifest(createArchiveManifestWithTimelineIndex());

    const snapshot = await readFileArchive({
      rootPath: archiveRoot
    });

    expect(snapshot.validation.ok).toBe(true);
    expect(snapshot.timelineEvents).toEqual([]);
    expect(snapshot.manifest.timeline.eventCount).toBeUndefined();
    expect(snapshot.manifest.timeline.lastSequence).toBeUndefined();
  });

  it("reports invalid timeline JSONL lines", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await writeArchiveFiles({
      archiveRoot,
      manifest: createArchiveManifestWithTimelineIndex(),
      timelineText: `${JSON.stringify(event)}\n{not-json}\n`
    });

    const report = await validateFileArchive({
      rootPath: archiveRoot
    });

    expect(report.ok).toBe(false);
    expect(issueCodes(report)).toContain("timeline.invalid_jsonl");
  });

  it("reports duplicate event IDs", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const firstEvent = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      eventId: "event-duplicate",
      payload: {
        status: "imported"
      }
    });
    const secondEvent = createSyntheticTimelineEvent({
      type: "adapter.started",
      sequence: 2,
      eventId: "event-duplicate",
      payload: {
        adapterId: "fixture"
      }
    });

    await writeArchiveFiles({
      archiveRoot,
      manifest: createArchiveManifestWithTimelineIndex({
        eventCount: 2,
        lastSequence: 2
      }),
      timelineEvents: [firstEvent, secondEvent]
    });

    const report = await validateFileArchive({
      rootPath: archiveRoot
    });

    expect(report.ok).toBe(false);
    expect(issueCodes(report)).toContain("timeline.duplicate_event_id");
  });

  it("reports sequence gaps", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const firstEvent = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });
    const secondEvent = createSyntheticTimelineEvent({
      type: "adapter.started",
      sequence: 3,
      payload: {
        adapterId: "fixture"
      }
    });

    await writeArchiveFiles({
      archiveRoot,
      manifest: createArchiveManifestWithTimelineIndex({
        eventCount: 2,
        lastSequence: 3
      }),
      timelineEvents: [firstEvent, secondEvent]
    });

    const report = await validateFileArchive({
      rootPath: archiveRoot
    });

    expect(report.ok).toBe(false);
    expect(issueCodes(report)).toContain("timeline.sequence_gap");
  });

  it("reports manifest timeline count mismatches", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await writeArchiveFiles({
      archiveRoot,
      manifest: createArchiveManifestWithTimelineIndex({
        eventCount: 2,
        lastSequence: 1
      }),
      timelineEvents: [event]
    });

    const report = await validateFileArchive({
      rootPath: archiveRoot
    });

    expect(report.ok).toBe(false);
    expect(issueCodes(report)).toContain("timeline.event_count_mismatch");
  });

  it("reports manifest last-sequence mismatches", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await writeArchiveFiles({
      archiveRoot,
      manifest: createArchiveManifestWithTimelineIndex({
        eventCount: 1,
        lastSequence: 2
      }),
      timelineEvents: [event]
    });

    const report = await validateFileArchive({
      rootPath: archiveRoot
    });

    expect(report.ok).toBe(false);
    expect(issueCodes(report)).toContain("timeline.last_sequence_mismatch");
  });

  it("reports unsafe archive-relative paths in manifests", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const manifest = {
      ...createArchiveManifestWithTimelineIndex(),
      timeline: {
        path: "../timeline.jsonl"
      },
      paths: {
        timeline: "../timeline.jsonl",
        events: "events",
        tracks: "tracks",
        diagnostics: "diagnostics",
        exports: "exports"
      }
    };
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await writeArchiveFiles({
      archiveRoot,
      manifest,
      timelineEvents: [event]
    });

    const report = await validateFileArchive({
      rootPath: archiveRoot
    });

    expect(report.ok).toBe(false);
    expect(issueCodes(report)).toContain("archive.unsafe_path");
    expect(issueCodes(report)).toContain("manifest.schema_invalid");
  });
});

async function createTemporaryArchiveRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-test-"));
  temporaryRoots.push(tempRoot);
  return path.join(tempRoot, "session-synthetic-001.chron");
}

async function writeArchiveFiles(input: {
  readonly archiveRoot: string;
  readonly manifest: ArchiveManifest | unknown;
  readonly timelineEvents?: readonly TimelineEventEnvelope[];
  readonly timelineText?: string;
}): Promise<void> {
  await mkdir(input.archiveRoot, {
    recursive: true
  });
  await mkdir(path.join(input.archiveRoot, DEFAULT_ARCHIVE_LAYOUT.events));
  await mkdir(path.join(input.archiveRoot, DEFAULT_ARCHIVE_LAYOUT.tracks));
  await mkdir(path.join(input.archiveRoot, DEFAULT_ARCHIVE_LAYOUT.diagnostics));
  await mkdir(path.join(input.archiveRoot, DEFAULT_ARCHIVE_LAYOUT.exports));

  await writeFile(
    path.join(input.archiveRoot, DEFAULT_ARCHIVE_LAYOUT.manifest),
    `${JSON.stringify(input.manifest, null, 2)}\n`,
    "utf8"
  );

  const timelineText =
    input.timelineText ??
    `${(input.timelineEvents ?? [])
      .map((event) => JSON.stringify(event))
      .join("\n")}\n`;

  await writeFile(
    path.join(input.archiveRoot, DEFAULT_ARCHIVE_LAYOUT.timeline),
    timelineText,
    "utf8"
  );
}

function createArchiveManifestWithTimelineIndex(input: {
  readonly eventCount?: number;
  readonly lastSequence?: number;
} = {}): ArchiveManifest {
  const manifest = createBaseSyntheticArchiveManifest();

  return {
    ...manifest,
    timeline: {
      ...manifest.timeline,
      ...(input.eventCount === undefined
        ? {}
        : {
            eventCount: input.eventCount
          }),
      ...(input.lastSequence === undefined
        ? {}
        : {
            lastSequence: input.lastSequence
          })
    }
  };
}

function issueCodes(report: Awaited<ReturnType<typeof validateFileArchive>>) {
  return report.issues.map((issue) => issue.code);
}
