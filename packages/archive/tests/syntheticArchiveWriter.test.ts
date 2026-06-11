import {
  createFileArchiveWriter,
  DEFAULT_ARCHIVE_LAYOUT
} from "@chronarium/archive";
import {
  parseArchiveManifestV1,
  parseTimelineEventEnvelopeV1
} from "@chronarium/schemas";
import {
  createSyntheticArchiveManifest,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("synthetic archive writer", () => {
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

  it("rejects appending a timeline event before a manifest is written", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await expect(writer.appendTimelineEvent(event)).rejects.toThrow(
      /before a manifest is written/
    );
  });

  it("writes a manifest and timeline for a synthetic .chron package", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const manifest = createSyntheticArchiveManifest();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    expect(() => parseArchiveManifestV1(manifest)).not.toThrow();
    expect(() => parseTimelineEventEnvelopeV1(event)).not.toThrow();

    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });

    await writer.writeManifest(manifest);
    await writer.appendTimelineEvent(event);
    const finalized = await writer.finalize();

    const manifestText = await readFile(
      path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.manifest),
      "utf8"
    );
    const timelineText = await readFile(
      path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.timeline),
      "utf8"
    );

    expect(JSON.parse(manifestText)).toMatchObject({
      archiveFormatVersion: 1,
      archiveId: "archive-synthetic-001",
      timeline: {
        path: "timeline.jsonl",
        eventCount: 1,
        lastSequence: 1
      }
    });
    expect(timelineText.trim().split("\n")).toHaveLength(1);
    expect(JSON.parse(timelineText)).toMatchObject({
      schemaVersion: 1,
      type: "session.created",
      payload: {
        status: "imported"
      }
    });
    expect(finalized.timeline.eventCount).toBe(1);
    const eventsDirectory = await stat(path.join(archiveRoot, "events"));
    expect(eventsDirectory.isDirectory()).toBe(true);
  });

  it("rejects timeline events for another session", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });

    await writer.writeManifest(createSyntheticArchiveManifest());

    await expect(
      writer.appendTimelineEvent(
        createSyntheticTimelineEvent({
          type: "session.created",
          sequence: 1,
          sessionId: "session-other",
          payload: {
            status: "imported"
          }
        })
      )
    ).rejects.toThrow(/does not match manifest session/);
  });

  it("rejects non-contiguous timeline sequences", async () => {
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

    await expect(
      writer.appendTimelineEvent(
        createSyntheticTimelineEvent({
          type: "adapter.started",
          sequence: 3,
          payload: {
            adapterId: "fixture"
          }
        })
      )
    ).rejects.toThrow(/expected 2 but received 3/);
  });

  it("rejects duplicate timeline event IDs", async () => {
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
        eventId: "event-duplicate",
        payload: {
          status: "imported"
        }
      })
    );

    await expect(
      writer.appendTimelineEvent(
        createSyntheticTimelineEvent({
          type: "adapter.started",
          sequence: 2,
          eventId: "event-duplicate",
          payload: {
            adapterId: "fixture"
          }
        })
      )
    ).rejects.toThrow(/Duplicate timeline eventId/);
  });

  it("rejects appending timeline events after finalization", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });

    await writer.writeManifest(createSyntheticArchiveManifest());
    await writer.finalize();

    await expect(
      writer.appendTimelineEvent(
        createSyntheticTimelineEvent({
          type: "session.created",
          sequence: 1,
          payload: {
            status: "imported"
          }
        })
      )
    ).rejects.toThrow(/after finalization/);
  });
});

async function createTemporaryArchiveRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-test-"));
  temporaryRoots.push(tempRoot);
  return path.join(tempRoot, "session-synthetic-001.chron");
}
