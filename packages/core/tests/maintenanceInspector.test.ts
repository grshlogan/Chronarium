import {
  createFileArchiveWriter,
  getMediaTrackMetadataPath
} from "@chronarium/archive";
import {
  createArchiveMaintenanceInspector,
  createCoreArchiveIndexService
} from "@chronarium/core";
import { openChronariumIndex } from "@chronarium/indexer";
import {
  createSyntheticArchiveManifest,
  createSyntheticMediaTrack,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("core maintenance archive inspector", () => {
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

  it("reports a healthy synthetic archive with no findings", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    await writeHealthyArchive(archiveRoot);
    const index = openChronariumIndex({
      databasePath
    });
    const inspector = createArchiveMaintenanceInspector({
      service: createCoreArchiveIndexService({
        index
      })
    });

    try {
      const report = await inspector.inspectArchive(archiveRoot);

      expect(report).toMatchObject({
        schemaVersion: 1,
        archiveRootPath: archiveRoot,
        status: "healthy",
        summary: {
          findingCount: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0
        },
        findings: []
      });
    } finally {
      index.close();
    }
  });

  it("turns synthetic recording diagnostics into maintenance findings", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    await writeChaturbateDiagnosticArchive(archiveRoot);
    const index = openChronariumIndex({
      databasePath
    });
    const inspector = createArchiveMaintenanceInspector({
      service: createCoreArchiveIndexService({
        index
      })
    });

    try {
      const report = await inspector.inspectArchive(archiveRoot);

      expect(report.status).toBe("error");
      expect(report.summary).toMatchObject({
        findingCount: 3,
        errorCount: 1,
        warningCount: 2,
        infoCount: 0
      });
      expect(report.findings.map((finding) => finding.title)).toEqual([
        "Media gap detected",
        "Media duration mismatch",
        "Media tool diagnostic"
      ]);
      expect(report.findings.map((finding) => finding.domain)).toEqual([
        "media",
        "media",
        "media"
      ]);
      expect(
        report.findings.map((finding) => finding.evidence[0]?.code)
      ).toEqual([
        "media_gap.detected",
        "media_tool.duration_mismatch",
        "media_tool.output_stalled"
      ]);
      expect(
        report.findings.map((finding) => finding.evidence[0]?.evidenceLevel)
      ).toEqual([
        "synthetic-contract",
        "synthetic-contract",
        "synthetic-contract"
      ]);
      expect(
        report.findings.every(
          (finding) =>
            finding.suggestedActions[0]?.safetyLevel === "report-only"
        )
      ).toBe(true);
    } finally {
      index.close();
    }
  });

  it("turns archive validator issues into archive findings", async () => {
    const { archiveRoot, databasePath } = await createTemporaryPaths();
    const track = createSyntheticMediaTrack();
    await writeHealthyArchive(archiveRoot, track);
    await unlink(
      path.join(archiveRoot, ...getMediaTrackMetadataPath(track.id).split("/"))
    );
    const index = openChronariumIndex({
      databasePath
    });
    const inspector = createArchiveMaintenanceInspector({
      service: createCoreArchiveIndexService({
        index
      })
    });

    try {
      const report = await inspector.inspectArchive(archiveRoot);

      expect(report.status).toBe("error");
      expect(report.summary).toMatchObject({
        findingCount: 1,
        errorCount: 1
      });
      expect(report.findings[0]).toMatchObject({
        domain: "archive",
        severity: "error",
        title: "Media track metadata is missing",
        evidence: [
          {
            source: "archive-validator",
            code: "track.missing_file"
          }
        ],
        suggestedActions: [
          {
            safetyLevel: "report-only"
          }
        ]
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
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-maint-"));
  temporaryRoots.push(tempRoot);

  return {
    archiveRoot: path.join(tempRoot, "session-synthetic.chron"),
    databasePath: path.join(tempRoot, "chronarium.sqlite")
  };
}

async function writeHealthyArchive(
  archiveRoot: string,
  track: ReturnType<typeof createSyntheticMediaTrack> = createSyntheticMediaTrack()
): Promise<void> {
  const writer = await createFileArchiveWriter({
    rootPath: archiveRoot,
    createIfMissing: true
  });

  await writer.writeManifest(createSyntheticArchiveManifest());
  await writer.writeMediaTrack(track);
  await writer.appendTimelineEvent(
    createSyntheticTimelineEvent({
      type: "session.created",
      sequence: 1,
      payload: {
        status: "imported"
      }
    })
  );
  await writer.finalize();
}

async function writeChaturbateDiagnosticArchive(
  archiveRoot: string
): Promise<void> {
  const writer = await createFileArchiveWriter({
    rootPath: archiveRoot,
    createIfMissing: true
  });
  const videoTrack = createSyntheticMediaTrack({
    id: "video-main",
    kind: "video",
    source: {
      adapterId: "fixture",
      siteId: "chaturbate",
      sourceIdHash: "synthetic-maintenance-video-source-hash",
      redactionStatus: "synthetic"
    },
    segmentsPath: "tracks/video-main/segments"
  });
  const audioTrack = createSyntheticMediaTrack({
    id: "audio-main",
    kind: "audio",
    label: "Synthetic audio",
    codec: "aac",
    source: {
      adapterId: "fixture",
      siteId: "chaturbate",
      sourceIdHash: "synthetic-maintenance-audio-source-hash",
      redactionStatus: "synthetic"
    },
    segmentsPath: "tracks/audio-main/segments"
  });

  await writer.writeManifest(
    createSyntheticArchiveManifest({
      archiveId: "archive-cb-synthetic-maintenance-001"
    })
  );
  await writer.writeMediaTrack(videoTrack);
  await writer.writeMediaTrack(audioTrack);
  await writer.appendTimelineEvent(
    createSyntheticTimelineEvent({
      type: "media.gap.detected",
      sequence: 1,
      payload: {
        level: "warning",
        code: "media_gap.detected",
        evidenceLevel: "synthetic-contract",
        message:
          "Synthetic fixture observed a missing video segment interval.",
        affectedTrackIds: ["video-main"],
        evidence: {
          gapStartMs: 4000,
          gapDurationMs: 3000,
          syntheticOnly: true
        },
        syntheticOnly: true
      }
    })
  );
  await writer.appendTimelineEvent(
    createSyntheticTimelineEvent({
      type: "diagnostic.duration_mismatch",
      sequence: 2,
      payload: {
        level: "warning",
        code: "media_tool.duration_mismatch",
        evidenceLevel: "synthetic-contract",
        message: "Synthetic fixture observed video longer than audio.",
        affectedTrackIds: ["video-main", "audio-main"],
        evidence: {
          videoDurationMs: 9000,
          audioDurationMs: 3500,
          differenceMs: 5500,
          syntheticOnly: true
        },
        syntheticOnly: true
      }
    })
  );
  await writer.appendTimelineEvent(
    createSyntheticTimelineEvent({
      type: "diagnostic.media_tool_output",
      sequence: 3,
      payload: {
        level: "error",
        code: "media_tool.output_stalled",
        evidenceLevel: "synthetic-contract",
        message:
          "Synthetic fixture observed no new media evidence while the tool stayed alive.",
        affectedTrackIds: ["video-main", "audio-main"],
        evidence: {
          noProgressForMs: 2000,
          processState: "alive",
          syntheticOnly: true
        },
        syntheticOnly: true
      }
    })
  );
  await writer.finalize();
}
