import type {
  ArchiveManifest,
  MediaTrack,
  TimelineEventEnvelope
} from "@chronarium/types";
import {
  type ArchiveValidationReport,
  validateFileArchive
} from "./validator.js";

export interface ArchiveReaderOptions {
  readonly rootPath: string;
}

export interface ArchiveSnapshot {
  readonly rootPath: string;
  readonly manifest: ArchiveManifest;
  readonly mediaTracks: readonly MediaTrack[];
  readonly timelineEvents: readonly TimelineEventEnvelope[];
  readonly validation: ArchiveValidationReport;
}

export async function readFileArchive(
  options: ArchiveReaderOptions
): Promise<ArchiveSnapshot> {
  const validation = await validateFileArchive(options);

  if (!validation.manifest) {
    throw new Error("Archive manifest could not be read or validated.");
  }

  if (!validation.ok) {
    const issueSummary = validation.issues
      .map((issue) => `${issue.code}: ${issue.message}`)
      .join("; ");
    throw new Error(`Archive validation failed: ${issueSummary}`);
  }

  return {
    rootPath: options.rootPath,
    manifest: validation.manifest,
    mediaTracks: validation.mediaTracks,
    timelineEvents: validation.timelineEvents,
    validation
  };
}
