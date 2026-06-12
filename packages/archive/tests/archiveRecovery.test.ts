import {
  createFileArchiveWriter,
  DEFAULT_ARCHIVE_LAYOUT,
  getMediaTrackMetadataPath,
  inspectArchiveRecovery
} from "@chronarium/archive";
import {
  createSyntheticArchiveManifest,
  createSyntheticMediaTrack,
  createSyntheticTimelineEvent
} from "@chronarium/testkit";
import { mkdir, mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

describe("archive recovery inspection", () => {
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

  it("reports a healthy finalized archive with no recovery findings", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    await writeHealthyArchive(archiveRoot);

    const report = await inspectArchiveRecovery({
      rootPath: archiveRoot
    });

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
  });

  it("reports missing and invalid manifests", async () => {
    const missingManifestRoot = await createTemporaryArchiveRoot();
    await mkdir(missingManifestRoot, {
      recursive: true
    });
    const invalidManifestRoot = await createTemporaryArchiveRoot();
    await mkdir(invalidManifestRoot, {
      recursive: true
    });
    await writeFile(
      path.join(invalidManifestRoot, DEFAULT_ARCHIVE_LAYOUT.manifest),
      "{not-json}",
      "utf8"
    );

    const missingReport = await inspectArchiveRecovery({
      rootPath: missingManifestRoot
    });
    const invalidReport = await inspectArchiveRecovery({
      rootPath: invalidManifestRoot
    });

    expect(findingCodes(missingReport)).toContain("recovery.manifest_missing");
    expect(findingCodes(invalidReport)).toContain("recovery.manifest_invalid");
  });

  it("reports an invalid trailing timeline line", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    await writeManifestAndTimeline({
      archiveRoot,
      timelineText: `${JSON.stringify(
        createSyntheticTimelineEvent({
          type: "session.created",
          sequence: 1,
          payload: {
            status: "imported"
          }
        })
      )}\n{"eventId":"truncated"`
    });

    const report = await inspectArchiveRecovery({
      rootPath: archiveRoot
    });

    expect(findingCodes(report)).toContain(
      "recovery.timeline_trailing_line_invalid"
    );
    expect(report.findings[0]?.suggestedAction).toBe(
      "quarantine-trailing-line-with-confirmation"
    );
  });

  it("reports manifests missing finalized timeline counts", async () => {
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

    const report = await inspectArchiveRecovery({
      rootPath: archiveRoot
    });

    expect(findingCodes(report)).toContain("recovery.manifest_counts_missing");
  });

  it("reports orphan temporary files and undeclared track directories", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const undeclaredTrack = createSyntheticMediaTrack({
      id: "video-orphan",
      segmentsPath: "tracks/video-orphan/segments"
    });
    await writeHealthyArchive(archiveRoot);
    await writeFile(
      path.join(archiveRoot, "manifest.json.tmp"),
      "{}",
      "utf8"
    );
    await mkdir(path.join(archiveRoot, "tracks", undeclaredTrack.id), {
      recursive: true
    });
    await writeFile(
      path.join(archiveRoot, ...getMediaTrackMetadataPath(undeclaredTrack.id).split("/")),
      `${JSON.stringify(undeclaredTrack, null, 2)}\n`,
      "utf8"
    );

    const report = await inspectArchiveRecovery({
      rootPath: archiveRoot
    });

    expect(findingCodes(report)).toEqual(
      expect.arrayContaining([
        "recovery.orphan_temp_file",
        "recovery.undeclared_track_directory"
      ])
    );
  });

  it("reports manifest-declared missing track metadata", async () => {
    const archiveRoot = await createTemporaryArchiveRoot();
    const track = createSyntheticMediaTrack();
    await writeHealthyArchive(archiveRoot, track);
    await unlink(
      path.join(archiveRoot, ...getMediaTrackMetadataPath(track.id).split("/"))
    );

    const report = await inspectArchiveRecovery({
      rootPath: archiveRoot
    });

    expect(findingCodes(report)).toContain("recovery.track_metadata_missing");
  });
});

async function createTemporaryArchiveRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "chronarium-recovery-"));
  temporaryRoots.push(tempRoot);
  return path.join(tempRoot, "session-synthetic-001.chron");
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

async function writeManifestAndTimeline(input: {
  readonly archiveRoot: string;
  readonly timelineText: string;
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
    `${JSON.stringify(createSyntheticArchiveManifest(), null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    path.join(input.archiveRoot, DEFAULT_ARCHIVE_LAYOUT.timeline),
    input.timelineText,
    "utf8"
  );
}

function findingCodes(
  report: Awaited<ReturnType<typeof inspectArchiveRecovery>>
): readonly string[] {
  return report.findings.map((finding) => finding.code);
}
