import type { ArchiveManifest, MediaTrack } from "@chronarium/types";
import { parseArchiveManifestV1, parseMediaTrackV1 } from "@chronarium/schemas";
import { readFile, stat } from "node:fs/promises";
import {
  DEFAULT_ARCHIVE_LAYOUT,
  getMediaTrackMetadataPath,
  getMediaTrackSegmentsPath,
  resolveArchivePath
} from "./layout.js";
import { validateTimelineMediaSegments } from "./segmentValidation.js";
import { validateTimelinePayloads } from "./payloadValidation.js";
import { readTimelineEventBatches } from "./timelineReader.js";
import type { ArchiveValidationIssue } from "./validator.js";

export interface ArchiveStreamingValidationOptions {
  readonly rootPath: string;
  readonly timelineBatchSize?: number;
}

export interface ArchiveStreamingValidationReport {
  readonly ok: boolean;
  readonly rootPath: string;
  readonly manifest?: ArchiveManifest;
  readonly mediaTracks: readonly MediaTrack[];
  readonly timelineEventCount: number;
  readonly timelineLastSequence?: number;
  readonly issues: readonly ArchiveValidationIssue[];
}

interface ManifestParseResult {
  readonly manifest?: ArchiveManifest;
  readonly issues: readonly ArchiveValidationIssue[];
}

interface MediaTrackParseResult {
  readonly tracks: readonly MediaTrack[];
  readonly issues: readonly ArchiveValidationIssue[];
}

interface TimelineScanResult {
  readonly eventCount: number;
  readonly lastSequence?: number;
  readonly issues: readonly ArchiveValidationIssue[];
}

export async function validateFileArchiveStreaming(
  options: ArchiveStreamingValidationOptions
): Promise<ArchiveStreamingValidationReport> {
  const issues: ArchiveValidationIssue[] = [];

  try {
    const rootStat = await stat(options.rootPath);
    if (!rootStat.isDirectory()) {
      issues.push({
        severity: "error",
        code: "archive.root_not_directory",
        message: `Archive root is not a directory: ${options.rootPath}`
      });
      return createReport(options.rootPath, undefined, [], 0, undefined, issues);
    }
  } catch (error) {
    issues.push({
      severity: "error",
      code: "archive.missing_file",
      message: `Archive root could not be read: ${describeError(error)}`
    });
    return createReport(options.rootPath, undefined, [], 0, undefined, issues);
  }

  const manifestResult = await readManifest(options.rootPath);
  issues.push(...manifestResult.issues);

  if (!manifestResult.manifest) {
    return createReport(options.rootPath, undefined, [], 0, undefined, issues);
  }

  const timelinePathIssue = compareTimelinePaths(manifestResult.manifest);
  if (timelinePathIssue) {
    issues.push(timelinePathIssue);
  }

  const mediaTrackResult = await readMediaTracks(
    options.rootPath,
    manifestResult.manifest
  );
  issues.push(...mediaTrackResult.issues);

  const timelineScan = await scanTimeline(
    options.rootPath,
    manifestResult.manifest,
    mediaTrackResult.tracks,
    options.timelineBatchSize ?? 1024
  );
  issues.push(...timelineScan.issues);

  return createReport(
    options.rootPath,
    manifestResult.manifest,
    mediaTrackResult.tracks,
    timelineScan.eventCount,
    timelineScan.lastSequence,
    issues
  );
}

function createReport(
  rootPath: string,
  manifest: ArchiveManifest | undefined,
  mediaTracks: readonly MediaTrack[],
  timelineEventCount: number,
  timelineLastSequence: number | undefined,
  issues: readonly ArchiveValidationIssue[]
): ArchiveStreamingValidationReport {
  return {
    ok: issues.every((issue) => issue.severity !== "error"),
    rootPath,
    ...(manifest ? { manifest } : {}),
    mediaTracks,
    timelineEventCount,
    ...(timelineLastSequence === undefined ? {} : { timelineLastSequence }),
    issues
  };
}

async function readManifest(rootPath: string): Promise<ManifestParseResult> {
  const issues: ArchiveValidationIssue[] = [];
  const manifestPath = resolveArchivePath(rootPath, DEFAULT_ARCHIVE_LAYOUT.manifest);
  let manifestText: string;

  try {
    manifestText = await readFile(manifestPath, "utf8");
  } catch (error) {
    return {
      issues: [
        {
          severity: "error",
          code: "archive.missing_file",
          path: DEFAULT_ARCHIVE_LAYOUT.manifest,
          message: `Archive manifest could not be read: ${describeError(error)}`
        }
      ]
    };
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(manifestText);
  } catch (error) {
    return {
      issues: [
        {
          severity: "error",
          code: "manifest.invalid_json",
          path: DEFAULT_ARCHIVE_LAYOUT.manifest,
          message: `Archive manifest is not valid JSON: ${describeError(error)}`
        }
      ]
    };
  }

  issues.push(...findUnsafeManifestPathIssues(manifestJson));

  try {
    return {
      manifest: parseArchiveManifestV1(manifestJson),
      issues
    };
  } catch (error) {
    return {
      issues: [
        ...issues,
        {
          severity: "error",
          code: "manifest.schema_invalid",
          path: DEFAULT_ARCHIVE_LAYOUT.manifest,
          message: `Archive manifest failed schema validation: ${describeError(error)}`
        }
      ]
    };
  }
}

async function readMediaTracks(
  rootPath: string,
  manifest: ArchiveManifest
): Promise<MediaTrackParseResult> {
  const tracks: MediaTrack[] = [];
  const issues: ArchiveValidationIssue[] = [];

  for (const manifestTrack of manifest.tracks) {
    const metadataPath = getDeclaredMediaTrackMetadataPath(manifestTrack);

    if ("issue" in metadataPath) {
      issues.push(metadataPath.issue);
      continue;
    }

    issues.push(
      ...validateManifestMediaTrack(manifest, manifestTrack, metadataPath.path)
    );

    let trackText: string;
    try {
      trackText = await readFile(
        resolveArchivePath(rootPath, metadataPath.path),
        "utf8"
      );
    } catch (error) {
      issues.push({
        severity: "error",
        code: "track.missing_file",
        path: metadataPath.path,
        trackId: manifestTrack.id,
        message: `Media track metadata could not be read: ${describeError(error)}`
      });
      continue;
    }

    let trackJson: unknown;
    try {
      trackJson = JSON.parse(trackText);
    } catch (error) {
      issues.push({
        severity: "error",
        code: "track.invalid_json",
        path: metadataPath.path,
        trackId: manifestTrack.id,
        message: `Media track metadata is not valid JSON: ${describeError(error)}`
      });
      continue;
    }

    let parsedTrack: MediaTrack;
    try {
      parsedTrack = parseMediaTrackV1(trackJson);
    } catch (error) {
      issues.push({
        severity: "error",
        code: "track.schema_invalid",
        path: metadataPath.path,
        trackId: manifestTrack.id,
        message: `Media track metadata failed schema validation: ${describeError(error)}`
      });
      continue;
    }

    tracks.push(parsedTrack);
    issues.push(
      ...validateMediaTrackAgainstManifest(
        manifest,
        manifestTrack,
        parsedTrack,
        metadataPath.path
      )
    );
  }

  return {
    tracks,
    issues
  };
}

async function scanTimeline(
  rootPath: string,
  manifest: ArchiveManifest,
  mediaTracks: readonly MediaTrack[],
  batchSize: number
): Promise<TimelineScanResult> {
  const issues: ArchiveValidationIssue[] = [];
  const seenEventIds = new Set<string>();
  let expectedSequence = 1;
  let eventCount = 0;
  let lastSequence: number | undefined;

  for await (const batch of readTimelineEventBatches({
    rootPath,
    relativeTimelinePath: manifest.timeline.path,
    batchSize
  })) {
    issues.push(...batch.issues);
    issues.push(
      ...(await validateTimelineMediaSegments({
        rootPath,
        manifest,
        mediaTracks,
        timelineEvents: batch.events
      }))
    );
    issues.push(
      ...validateTimelinePayloads({
        timelineEvents: batch.events
      })
    );

    batch.events.forEach((event) => {
      eventCount += 1;
      lastSequence = event.sequence;

      if (seenEventIds.has(event.eventId)) {
        issues.push({
          severity: "error",
          code: "timeline.duplicate_event_id",
          eventId: event.eventId,
          sequence: event.sequence,
          message: `Timeline eventId is duplicated: ${event.eventId}`
        });
      } else {
        seenEventIds.add(event.eventId);
      }

      if (event.sessionId !== manifest.session.id) {
        issues.push({
          severity: "error",
          code: "timeline.session_mismatch",
          eventId: event.eventId,
          sequence: event.sequence,
          message: `Timeline event sessionId ${event.sessionId} does not match manifest session ${manifest.session.id}.`
        });
      }

      if (event.sequence !== expectedSequence) {
        issues.push({
          severity: "error",
          code: "timeline.sequence_gap",
          eventId: event.eventId,
          sequence: event.sequence,
          message: `Timeline sequence expected ${expectedSequence} but found ${event.sequence}.`
        });
        expectedSequence = event.sequence + 1;
        return;
      }

      expectedSequence += 1;
    });
  }

  if (
    manifest.timeline.eventCount !== undefined &&
    manifest.timeline.eventCount !== eventCount
  ) {
    issues.push({
      severity: "error",
      code: "timeline.event_count_mismatch",
      message: `Manifest timeline eventCount is ${manifest.timeline.eventCount} but ${eventCount} valid events were read.`
    });
  }

  if (
    manifest.timeline.lastSequence !== undefined &&
    manifest.timeline.lastSequence !== lastSequence
  ) {
    issues.push({
      severity: "error",
      code: "timeline.last_sequence_mismatch",
      message: `Manifest timeline lastSequence is ${manifest.timeline.lastSequence} but last event sequence is ${lastSequence ?? "missing"}.`
    });
  }

  return {
    eventCount,
    ...(lastSequence === undefined ? {} : { lastSequence }),
    issues
  };
}

function validateManifestMediaTrack(
  manifest: ArchiveManifest,
  track: MediaTrack,
  metadataPath: string
): readonly ArchiveValidationIssue[] {
  const issues: ArchiveValidationIssue[] = [];

  if (track.sessionId !== manifest.session.id) {
    issues.push({
      severity: "error",
      code: "track.session_mismatch",
      path: metadataPath,
      trackId: track.id,
      message: `Manifest media track sessionId ${track.sessionId} does not match manifest session ${manifest.session.id}.`
    });
  }

  const expectedSegmentsPath = getMediaTrackSegmentsPath(track.id);
  if (track.segmentsPath !== expectedSegmentsPath) {
    issues.push({
      severity: "error",
      code: "track.segments_path_mismatch",
      path: metadataPath,
      trackId: track.id,
      message: `Manifest media track segmentsPath ${track.segmentsPath} does not match expected ${expectedSegmentsPath}.`
    });
  }

  return issues;
}

function validateMediaTrackAgainstManifest(
  manifest: ArchiveManifest,
  manifestTrack: MediaTrack,
  mediaTrack: MediaTrack,
  metadataPath: string
): readonly ArchiveValidationIssue[] {
  const issues: ArchiveValidationIssue[] = [];

  if (mediaTrack.sessionId !== manifest.session.id) {
    issues.push({
      severity: "error",
      code: "track.session_mismatch",
      path: metadataPath,
      trackId: manifestTrack.id,
      message: `Media track sessionId ${mediaTrack.sessionId} does not match manifest session ${manifest.session.id}.`
    });
  }

  if (mediaTrack.id !== manifestTrack.id || mediaTrack.kind !== manifestTrack.kind) {
    issues.push({
      severity: "error",
      code: "track.manifest_mismatch",
      path: metadataPath,
      trackId: manifestTrack.id,
      message: `Media track metadata id/kind does not match manifest track ${manifestTrack.id}.`
    });
  }

  if (mediaTrack.segmentsPath !== manifestTrack.segmentsPath) {
    issues.push({
      severity: "error",
      code: "track.manifest_mismatch",
      path: metadataPath,
      trackId: manifestTrack.id,
      message: `Media track segmentsPath ${mediaTrack.segmentsPath} does not match manifest track ${manifestTrack.segmentsPath}.`
    });
  }

  let expectedSegmentsPath: string;
  try {
    expectedSegmentsPath = getMediaTrackSegmentsPath(mediaTrack.id);
  } catch (error) {
    issues.push({
      severity: "error",
      code: "track.unsafe_path",
      path: metadataPath,
      trackId: manifestTrack.id,
      message: describeError(error)
    });
    return issues;
  }

  if (mediaTrack.segmentsPath !== expectedSegmentsPath) {
    issues.push({
      severity: "error",
      code: "track.segments_path_mismatch",
      path: metadataPath,
      trackId: manifestTrack.id,
      message: `Media track segmentsPath ${mediaTrack.segmentsPath} does not match expected ${expectedSegmentsPath}.`
    });
  }

  return issues;
}

function getDeclaredMediaTrackMetadataPath(
  track: MediaTrack
):
  | { readonly path: string; readonly issue?: never }
  | { readonly path?: never; readonly issue: ArchiveValidationIssue } {
  try {
    return {
      path: getMediaTrackMetadataPath(track.id)
    };
  } catch (error) {
    return {
      issue: {
        severity: "error",
        code: "track.unsafe_path",
        trackId: track.id,
        message: describeError(error)
      }
    };
  }
}

function compareTimelinePaths(
  manifest: ArchiveManifest
): ArchiveValidationIssue | undefined {
  if (manifest.timeline.path === manifest.paths.timeline) {
    return undefined;
  }

  return {
    severity: "error",
    code: "manifest.timeline_path_mismatch",
    path: DEFAULT_ARCHIVE_LAYOUT.manifest,
    message: `Manifest timeline path ${manifest.timeline.path} does not match paths.timeline ${manifest.paths.timeline}.`
  };
}

function findUnsafeManifestPathIssues(
  manifestJson: unknown
): readonly ArchiveValidationIssue[] {
  if (!isRecord(manifestJson)) {
    return [];
  }

  const issues: ArchiveValidationIssue[] = [];
  const timeline = manifestJson.timeline;
  if (isRecord(timeline) && typeof timeline.path === "string") {
    collectUnsafePathIssue(issues, "timeline.path", timeline.path);
  }

  const paths = manifestJson.paths;
  if (isRecord(paths)) {
    ["timeline", "events", "tracks", "diagnostics", "exports"].forEach(
      (key) => {
        const value = paths[key];
        if (typeof value === "string") {
          collectUnsafePathIssue(issues, `paths.${key}`, value);
        }
      }
    );
  }

  const tracks = manifestJson.tracks;
  if (Array.isArray(tracks)) {
    tracks.forEach((track, index) => {
      if (isRecord(track) && typeof track.segmentsPath === "string") {
        collectUnsafePathIssue(
          issues,
          `tracks[${index}].segmentsPath`,
          track.segmentsPath
        );
      }
    });
  }

  return issues;
}

function collectUnsafePathIssue(
  issues: ArchiveValidationIssue[],
  pathLabel: string,
  relativePath: string
): void {
  try {
    resolveArchivePath("archive-root", relativePath);
  } catch (error) {
    issues.push({
      severity: "error",
      code: "archive.unsafe_path",
      path: pathLabel,
      message: describeError(error)
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
