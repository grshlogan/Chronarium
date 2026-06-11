import { createFileArchiveWriter } from "@chronarium/archive";
import { openChronariumIndex } from "@chronarium/indexer";
import {
  createSyntheticArchiveManifest,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("SQLite archive indexer", () => {
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

  it("indexes a valid synthetic archive for session and timeline queries", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });
    const firstEvent = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });
    const secondEvent = createSyntheticTimelineEvent({
      type: "room.state",
      sequence: 2,
      payload: {
        state: "online"
      }
    });

    await writer.writeManifest(createSyntheticArchiveManifest());
    await writer.appendTimelineEvent(firstEvent);
    await writer.appendTimelineEvent(secondEvent);
    await writer.finalize();

    const index = openChronariumIndex({
      databasePath
    });

    try {
      const summary = await index.indexArchiveFromPath(archiveRoot);
      const archive = index.getArchive(summary.archiveId);
      const events = index.listTimelineEvents({
        sessionId: summary.sessionId
      });
      const issues = index.listValidationIssues({
        archiveId: summary.archiveId
      });

      expect(summary).toMatchObject({
        archiveId: "archive-synthetic-001",
        sessionId: "session-synthetic-001",
        validationOk: true,
        timelineEventCount: 2,
        validationIssueCount: 0
      });
      expect(archive).toMatchObject({
        archiveId: "archive-synthetic-001",
        sessionId: "session-synthetic-001",
        siteId: "synthetic",
        validationOk: true,
        timelineEventCount: 2,
        timelineLastSequence: 2
      });
      expect(events.map((event) => event.type)).toEqual([
        "session.created",
        "room.state"
      ]);
      expect(JSON.parse(events[1]?.payloadJson ?? "{}")).toEqual({
        state: "online"
      });
      expect(issues).toEqual([]);
    } finally {
      index.close();
    }
  });

  it("indexes validation issues for an archive with a timeline gap", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });
    const firstEvent = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });
    const secondEvent = createSyntheticTimelineEvent({
      type: "room.state",
      sequence: 3,
      payload: {
        state: "online"
      }
    });

    await writer.writeManifest(createSyntheticArchiveManifest());
    await writer.appendTimelineEvent(firstEvent);
    await writer.appendTimelineEvent(secondEvent);
    await writer.finalize();

    const index = openChronariumIndex({
      databasePath
    });

    try {
      const summary = await index.indexArchiveFromPath(archiveRoot);
      const archive = index.getArchive(summary.archiveId);
      const events = index.listTimelineEvents({
        sessionId: summary.sessionId
      });
      const issues = index.listValidationIssues({
        archiveId: summary.archiveId
      });

      expect(summary.validationOk).toBe(false);
      expect(summary.validationIssueCount).toBe(1);
      expect(archive?.validationOk).toBe(false);
      expect(events).toHaveLength(2);
      expect(issues.map((issue) => issue.code)).toEqual([
        "timeline.sequence_gap"
      ]);
    } finally {
      index.close();
    }
  });

  it("indexes validation issues when timeline event IDs are duplicated", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const writer = await createFileArchiveWriter({
      rootPath: archiveRoot,
      createIfMissing: true
    });
    const firstEvent = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      eventId: "event-duplicate",
      payload: {
        status: "imported"
      }
    });
    const secondEvent = createSyntheticTimelineEvent({
      type: "room.state",
      sequence: 2,
      eventId: "event-duplicate",
      payload: {
        state: "online"
      }
    });

    await writer.writeManifest(createSyntheticArchiveManifest());
    await writer.appendTimelineEvent(firstEvent);
    await writer.appendTimelineEvent(secondEvent);
    await writer.finalize();

    const index = openChronariumIndex({
      databasePath
    });

    try {
      const summary = await index.indexArchiveFromPath(archiveRoot);
      const events = index.listTimelineEvents({
        sessionId: summary.sessionId
      });
      const issues = index.listValidationIssues({
        archiveId: summary.archiveId
      });

      expect(summary.validationOk).toBe(false);
      expect(events.map((event) => event.eventId)).toEqual([
        "event-duplicate",
        "event-duplicate"
      ]);
      expect(issues.map((issue) => issue.code)).toEqual([
        "timeline.duplicate_event_id"
      ]);
    } finally {
      index.close();
    }
  });
});

async function createTemporaryPaths(): Promise<{
  readonly archiveRoot: string;
  readonly databasePath: string;
}> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-index-"));
  temporaryRoots.push(tempRoot);

  return {
    archiveRoot: path.join(tempRoot, "session-synthetic-001.chron"),
    databasePath: path.join(tempRoot, "chronarium.sqlite")
  };
}
