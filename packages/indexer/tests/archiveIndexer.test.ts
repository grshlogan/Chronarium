import {
  createFileArchiveWriter,
  DEFAULT_ARCHIVE_LAYOUT
} from "@chronarium/archive";
import { openChronariumIndex } from "@chronarium/indexer";
import type {
  ArchiveManifest,
  TimelineEventEnvelope
} from "@chronarium/types";
import {
  createSyntheticArchiveManifest,
  createSyntheticSession,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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

  it("reindexes an archive path by replacing stale rows", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
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

    await writeArchiveFixture(archiveRoot, [firstEvent, secondEvent]);

    const index = openChronariumIndex({
      databasePath
    });

    try {
      await index.indexArchiveFromPath(archiveRoot);

      await writeArchiveFixture(archiveRoot, [firstEvent]);
      const summary = await index.reindexArchiveFromPath(archiveRoot);
      const events = index.listTimelineEvents({
        sessionId: summary.sessionId
      });

      expect(summary.timelineEventCount).toBe(1);
      expect(events.map((event) => event.type)).toEqual(["session.created"]);
    } finally {
      index.close();
    }
  });

  it("removes an indexed archive and its child rows", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await writeArchiveFixture(archiveRoot, [event]);

    const index = openChronariumIndex({
      databasePath
    });

    try {
      const summary = await index.indexArchiveFromPath(archiveRoot);
      const removal = index.removeArchiveFromIndex({
        archiveId: summary.archiveId
      });

      expect(removal.removedArchiveCount).toBe(1);
      expect(index.getArchive(summary.archiveId)).toBeUndefined();
      expect(
        index.listTimelineEvents({
          sessionId: summary.sessionId
        })
      ).toEqual([]);
      expect(
        index.listValidationIssues({
          archiveId: summary.archiveId
        })
      ).toEqual([]);
    } finally {
      index.close();
    }
  });

  it("clears the rebuildable index", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const event = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    });

    await writeArchiveFixture(archiveRoot, [event]);

    const index = openChronariumIndex({
      databasePath
    });

    try {
      await index.indexArchiveFromPath(archiveRoot);
      const clearSummary = index.clearIndex();

      expect(clearSummary.removedArchiveCount).toBe(1);
      expect(index.listArchives()).toEqual([]);
      expect(
        index.listTimelineEvents({
          sessionId: "session-synthetic-001"
        })
      ).toEqual([]);
    } finally {
      index.close();
    }
  });

  it("filters archives, timeline events, and validation issues", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-index-"));
    temporaryRoots.push(tempRoot);
    const firstArchiveRoot = path.join(tempRoot, "session-synthetic-001.chron");
    const secondArchiveRoot = path.join(tempRoot, "session-synthetic-002.chron");
    const databasePath = path.join(tempRoot, "chronarium.sqlite");
    const firstSession = createSyntheticSession({
      id: "session-synthetic-001",
      site: {
        siteId: "synthetic",
        redactionStatus: "synthetic"
      }
    });
    const secondSession = createSyntheticSession({
      id: "session-synthetic-002",
      site: {
        siteId: "other-synthetic",
        redactionStatus: "synthetic"
      }
    });
    const firstEvent = createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      sessionId: firstSession.id,
      payload: {
        status: "imported"
      }
    });
    const secondEvent = createSyntheticTimelineEvent({
      type: "room.state",
      sequence: 1,
      sessionId: secondSession.id,
      payload: {
        state: "online"
      }
    });
    const skippedEvent = createSyntheticTimelineEvent({
      type: "room.state",
      sequence: 3,
      sessionId: firstSession.id,
      payload: {
        state: "online"
      }
    });

    await writeArchiveFixture(firstArchiveRoot, [firstEvent, skippedEvent], {
      archiveId: "archive-synthetic-001",
      session: firstSession
    });
    await writeArchiveFixture(secondArchiveRoot, [secondEvent], {
      archiveId: "archive-synthetic-002",
      session: secondSession
    });

    const index = openChronariumIndex({
      databasePath
    });

    try {
      await index.indexArchiveFromPath(firstArchiveRoot);
      await index.indexArchiveFromPath(secondArchiveRoot);

      expect(index.listArchives({ siteId: "synthetic" })).toHaveLength(1);
      expect(index.listArchives({ validationOk: false })).toHaveLength(1);
      expect(
        index.listTimelineEvents({
          type: "room.state"
        })
      ).toHaveLength(2);
      expect(
        index.listTimelineEvents({
          sessionId: firstSession.id,
          type: "room.state"
        })
      ).toHaveLength(1);
      expect(
        index.listValidationIssues({
          code: "timeline.sequence_gap"
        })
      ).toHaveLength(1);
    } finally {
      index.close();
    }
  });

  it("indexes validation issues for an archive with a timeline gap", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
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

    await writeArchiveFixture(archiveRoot, [firstEvent, secondEvent]);

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

    await writeArchiveFixture(archiveRoot, [firstEvent, secondEvent]);

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

async function writeArchiveFixture(
  archiveRoot: string,
  timelineEvents: readonly TimelineEventEnvelope[],
  options: {
    readonly archiveId?: string;
    readonly session?: ArchiveManifest["session"];
  } = {}
): Promise<void> {
  await mkdir(archiveRoot, {
    recursive: true
  });
  await mkdir(path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.events), {
    recursive: true
  });
  await mkdir(path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.tracks), {
    recursive: true
  });
  await mkdir(path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.diagnostics), {
    recursive: true
  });
  await mkdir(path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.exports), {
    recursive: true
  });

  const manifest = createSyntheticArchiveManifest({
    archiveId: options.archiveId,
    session: options.session
  });
  const lastSequence = timelineEvents.at(-1)?.sequence;
  await writeFile(
    path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.manifest),
    `${JSON.stringify(
      {
        ...manifest,
        timeline: {
          ...manifest.timeline,
          eventCount: timelineEvents.length,
          ...(lastSequence === undefined ? {} : { lastSequence })
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  await writeFile(
    path.join(archiveRoot, DEFAULT_ARCHIVE_LAYOUT.timeline),
    `${timelineEvents.map((event) => JSON.stringify(event)).join("\n")}\n`,
    "utf8"
  );
}
