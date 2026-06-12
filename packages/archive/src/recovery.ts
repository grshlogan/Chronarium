import type { ArchiveManifest } from "@chronarium/types";
import type { Dirent } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_ARCHIVE_LAYOUT,
  getMediaTrackMetadataPath,
  resolveArchivePath
} from "./layout.js";
import {
  type ArchiveValidationIssue,
  type ArchiveValidationReport,
  validateFileArchive
} from "./validator.js";

export type ArchiveRecoverySeverity = "info" | "warning" | "error";

export type ArchiveRecoveryFindingCode =
  | "recovery.archive_root_unreadable"
  | "recovery.manifest_missing"
  | "recovery.manifest_invalid"
  | "recovery.timeline_trailing_line_invalid"
  | "recovery.manifest_counts_missing"
  | "recovery.manifest_count_mismatch"
  | "recovery.orphan_temp_file"
  | "recovery.undeclared_track_directory"
  | "recovery.track_metadata_missing";

export type ArchiveRecoverySuggestedAction =
  | "inspect-manually"
  | "restore-or-recreate-manifest"
  | "quarantine-trailing-line-with-confirmation"
  | "recompute-manifest-counts-with-confirmation"
  | "remove-temp-file-with-confirmation"
  | "adopt-or-remove-track-with-confirmation";

export interface ArchiveRecoveryFinding {
  readonly severity: ArchiveRecoverySeverity;
  readonly code: ArchiveRecoveryFindingCode;
  readonly message: string;
  readonly path?: string;
  readonly line?: number;
  readonly trackId?: string;
  readonly suggestedAction: ArchiveRecoverySuggestedAction;
}

export interface ArchiveRecoveryReport {
  readonly schemaVersion: 1;
  readonly archiveRootPath: string;
  readonly inspectedAt: string;
  readonly status: "healthy" | "needs-attention" | "blocked";
  readonly summary: {
    readonly findingCount: number;
    readonly errorCount: number;
    readonly warningCount: number;
    readonly infoCount: number;
  };
  readonly validation: ArchiveValidationReport;
  readonly findings: readonly ArchiveRecoveryFinding[];
}

export interface ArchiveRecoveryInspectionOptions {
  readonly rootPath: string;
}

export async function inspectArchiveRecovery(
  options: ArchiveRecoveryInspectionOptions
): Promise<ArchiveRecoveryReport> {
  const inspectedAt = new Date().toISOString();
  const validation = await validateFileArchive({
    rootPath: options.rootPath
  });
  const findings: ArchiveRecoveryFinding[] = [
    ...findValidationRecoveryFindings(validation),
    ...findManifestCountFindings(validation),
    ...(await findFilesystemRecoveryFindings(options.rootPath, validation.manifest))
  ];

  return createRecoveryReport({
    archiveRootPath: options.rootPath,
    inspectedAt,
    validation,
    findings
  });
}

function findValidationRecoveryFindings(
  validation: ArchiveValidationReport
): readonly ArchiveRecoveryFinding[] {
  return validation.issues.flatMap((issue) => {
    switch (issue.code) {
      case "archive.root_not_directory":
      case "archive.missing_file":
        return [
          createFindingFromIssue(issue, {
            code:
              issue.path === DEFAULT_ARCHIVE_LAYOUT.manifest
                ? "recovery.manifest_missing"
                : "recovery.archive_root_unreadable",
            message:
              issue.path === DEFAULT_ARCHIVE_LAYOUT.manifest
                ? "Archive manifest is missing or unreadable."
                : "Archive root or required archive file is unreadable.",
            suggestedAction:
              issue.path === DEFAULT_ARCHIVE_LAYOUT.manifest
                ? "restore-or-recreate-manifest"
                : "inspect-manually"
          })
        ];
      case "manifest.invalid_json":
      case "manifest.schema_invalid":
        return [
          createFindingFromIssue(issue, {
            code: "recovery.manifest_invalid",
            message: "Archive manifest exists but cannot be parsed as valid v1 metadata.",
            suggestedAction: "restore-or-recreate-manifest"
          })
        ];
      case "timeline.invalid_jsonl":
        return [
          createFindingFromIssue(issue, {
            code: "recovery.timeline_trailing_line_invalid",
            message:
              "Timeline contains an invalid JSONL line; if it is the final line, explicit quarantine may be needed.",
            suggestedAction: "quarantine-trailing-line-with-confirmation"
          })
        ];
      case "timeline.event_count_mismatch":
        return [
          createFindingFromIssue(issue, {
            code: "recovery.manifest_count_mismatch",
            message: "Manifest timeline eventCount does not match valid timeline events.",
            suggestedAction: "recompute-manifest-counts-with-confirmation"
          })
        ];
      case "timeline.last_sequence_mismatch":
        return [
          createFindingFromIssue(issue, {
            code: "recovery.manifest_count_mismatch",
            message: "Manifest timeline lastSequence does not match valid timeline events.",
            suggestedAction: "recompute-manifest-counts-with-confirmation"
          })
        ];
      case "track.missing_file":
        return [
          createFindingFromIssue(issue, {
            code: "recovery.track_metadata_missing",
            message: "Manifest declares a media track but its track metadata file is missing.",
            suggestedAction: "inspect-manually"
          })
        ];
      default:
        return [];
    }
  });
}

function findManifestCountFindings(
  validation: ArchiveValidationReport
): readonly ArchiveRecoveryFinding[] {
  const manifest = validation.manifest;
  if (!manifest) {
    return [];
  }

  if (
    manifest.timeline.eventCount !== undefined &&
    manifest.timeline.lastSequence !== undefined
  ) {
    return [];
  }

  return [
    {
      severity: "warning",
      code: "recovery.manifest_counts_missing",
      path: DEFAULT_ARCHIVE_LAYOUT.manifest,
      message:
        "Manifest has no finalized timeline eventCount and/or lastSequence; the archive may have been interrupted before finalize().",
      suggestedAction: "recompute-manifest-counts-with-confirmation"
    }
  ];
}

async function findFilesystemRecoveryFindings(
  rootPath: string,
  manifest: ArchiveManifest | undefined
): Promise<readonly ArchiveRecoveryFinding[]> {
  const findings: ArchiveRecoveryFinding[] = [];
  findings.push(...(await findOrphanTempFiles(rootPath)));

  if (manifest) {
    findings.push(...(await findUndeclaredTrackDirectories(rootPath, manifest)));
  }

  return findings;
}

async function findOrphanTempFiles(
  rootPath: string
): Promise<readonly ArchiveRecoveryFinding[]> {
  const findings: ArchiveRecoveryFinding[] = [];
  const rootEntries = await safeReadDirectory(rootPath);

  rootEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tmp"))
    .forEach((entry) => {
      findings.push({
        severity: "warning",
        code: "recovery.orphan_temp_file",
        path: entry.name,
        message: `Orphan temporary file found: ${entry.name}`,
        suggestedAction: "remove-temp-file-with-confirmation"
      });
    });

  const tracksPath = path.join(rootPath, DEFAULT_ARCHIVE_LAYOUT.tracks);
  const trackEntries = await safeReadDirectory(tracksPath);
  for (const trackEntry of trackEntries.filter((entry) => entry.isDirectory())) {
    const trackRoot = path.join(tracksPath, trackEntry.name);
    const trackFiles = await safeReadDirectory(trackRoot);
    trackFiles
      .filter((entry) => entry.isFile() && entry.name.endsWith(".tmp"))
      .forEach((entry) => {
        const relativePath = `${DEFAULT_ARCHIVE_LAYOUT.tracks}/${trackEntry.name}/${entry.name}`;
        findings.push({
          severity: "warning",
          code: "recovery.orphan_temp_file",
          path: relativePath,
          trackId: trackEntry.name,
          message: `Orphan temporary track metadata file found: ${relativePath}`,
          suggestedAction: "remove-temp-file-with-confirmation"
        });
      });
  }

  return findings;
}

async function findUndeclaredTrackDirectories(
  rootPath: string,
  manifest: ArchiveManifest
): Promise<readonly ArchiveRecoveryFinding[]> {
  const declaredTrackIds = new Set(manifest.tracks.map((track) => track.id));
  const tracksPath = resolveArchivePath(rootPath, DEFAULT_ARCHIVE_LAYOUT.tracks);
  const trackEntries = await safeReadDirectory(tracksPath);
  const findings: ArchiveRecoveryFinding[] = [];

  for (const entry of trackEntries) {
    if (!entry.isDirectory() || declaredTrackIds.has(entry.name)) {
      continue;
    }

    const relativePath = `${DEFAULT_ARCHIVE_LAYOUT.tracks}/${entry.name}`;
    const metadataPath = getPotentialMetadataPath(entry.name);
    findings.push({
      severity: (await pathExists(path.join(rootPath, ...metadataPath.split("/"))))
        ? "warning"
        : "info",
      code: "recovery.undeclared_track_directory",
      path: relativePath,
      trackId: entry.name,
      message: `Track directory is not declared by the manifest: ${relativePath}`,
      suggestedAction: "adopt-or-remove-track-with-confirmation"
    });
  }

  return findings;
}

function getPotentialMetadataPath(trackId: string): string {
  try {
    return getMediaTrackMetadataPath(trackId);
  } catch {
    return `${DEFAULT_ARCHIVE_LAYOUT.tracks}/${trackId}/track.json`;
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function safeReadDirectory(
  directoryPath: string
): Promise<Dirent[]> {
  try {
    return await readdir(directoryPath, {
      withFileTypes: true
    });
  } catch {
    return [];
  }
}

function createFindingFromIssue(
  issue: ArchiveValidationIssue,
  input: {
    readonly code: ArchiveRecoveryFindingCode;
    readonly message: string;
    readonly suggestedAction: ArchiveRecoverySuggestedAction;
  }
): ArchiveRecoveryFinding {
  return {
    severity: issue.severity,
    code: input.code,
    message: input.message,
    ...(issue.path ? { path: issue.path } : {}),
    ...(issue.line === undefined ? {} : { line: issue.line }),
    ...(issue.trackId ? { trackId: issue.trackId } : {}),
    suggestedAction: input.suggestedAction
  };
}

function createRecoveryReport(input: {
  readonly archiveRootPath: string;
  readonly inspectedAt: string;
  readonly validation: ArchiveValidationReport;
  readonly findings: readonly ArchiveRecoveryFinding[];
}): ArchiveRecoveryReport {
  const errorCount = input.findings.filter(
    (finding) => finding.severity === "error"
  ).length;
  const warningCount = input.findings.filter(
    (finding) => finding.severity === "warning"
  ).length;
  const infoCount = input.findings.filter(
    (finding) => finding.severity === "info"
  ).length;

  return {
    schemaVersion: 1,
    archiveRootPath: input.archiveRootPath,
    inspectedAt: input.inspectedAt,
    status:
      errorCount > 0
        ? "blocked"
        : warningCount > 0 || infoCount > 0
          ? "needs-attention"
          : "healthy",
    summary: {
      findingCount: input.findings.length,
      errorCount,
      warningCount,
      infoCount
    },
    validation: input.validation,
    findings: input.findings
  };
}
