import type {
  ArchiveManifest,
  MediaTrack,
  TimelineEventEnvelope
} from "@chronarium/types";
import {
  parseArchiveManifestV1,
  parseMediaTrackV1,
  parseTimelineEventEnvelopeV1
} from "@chronarium/schemas";
import { readFile, stat } from "node:fs/promises";
import {
  DEFAULT_ARCHIVE_LAYOUT,
  getMediaTrackMetadataPath,
  getMediaTrackSegmentsPath,
  resolveArchivePath
} from "./layout.js";

export type ArchiveValidationSeverity = "error" | "warning";

export type ArchiveValidationIssueCode =
  | "archive.root_not_directory"
  | "archive.missing_file"
  | "archive.unsafe_path"
  | "manifest.invalid_json"
  | "manifest.schema_invalid"
  | "manifest.timeline_path_mismatch"
  | "track.missing_file"
  | "track.invalid_json"
  | "track.schema_invalid"
  | "track.session_mismatch"
  | "track.manifest_mismatch"
  | "track.segments_path_mismatch"
  | "track.unsafe_path"
  | "timeline.invalid_jsonl"
  | "timeline.schema_invalid"
  | "timeline.duplicate_event_id"
  | "timeline.sequence_gap"
  | "timeline.session_mismatch"
  | "timeline.event_count_mismatch"
  | "timeline.last_sequence_mismatch";

export interface ArchiveValidationIssue {
  readonly severity: ArchiveValidationSeverity;
  readonly code: ArchiveValidationIssueCode;
  readonly message: string;
  readonly path?: string;
  readonly line?: number;
  readonly trackId?: string;
  readonly eventId?: string;
  readonly sequence?: number;
}

export interface ArchiveValidationReport {
  readonly ok: boolean;
  readonly rootPath: string;
  readonly manifest?: ArchiveManifest;
  readonly mediaTracks: readonly MediaTrack[];
  readonly timelineEvents: readonly TimelineEventEnvelope[];
  readonly issues: readonly ArchiveValidationIssue[];
}

export interface ArchiveValidationOptions {
  readonly rootPath: string;
}

interface TimelineParseResult {
  readonly events: readonly TimelineEventEnvelope[];
  readonly issues: readonly ArchiveValidationIssue[];
}

interface MediaTrackParseResult {
  readonly tracks: readonly MediaTrack[];
  readonly issues: readonly ArchiveValidationIssue[];
}

export async function validateFileArchive(
  options: ArchiveValidationOptions
): Promise<ArchiveValidationReport> {
  const issues: ArchiveValidationIssue[] = [];

  try {
    const rootStat = await stat(options.rootPath);
    if (!rootStat.isDirectory()) {
      issues.push({
        severity: "error",
        code: "archive.root_not_directory",
        message: `Archive root is not a directory: ${options.rootPath}`
      });
      return createReport(options.rootPath, undefined, [], [], issues);
    }
  } catch (error) {
    issues.push({
      severity: "error",
      code: "archive.missing_file",
      message: `Archive root could not be read: ${describeError(error)}`
    });
    return createReport(options.rootPath, undefined, [], [], issues);
  }

  const manifestResult = await readManifest(options.rootPath);
  issues.push(...manifestResult.issues);

  if (!manifestResult.manifest) {
    return createReport(options.rootPath, undefined, [], [], issues);
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

  const timelineResult = await readTimeline(
    options.rootPath,
    manifestResult.manifest.timeline.path
  );
  issues.push(...timelineResult.issues);
  issues.push(
    ...validateTimelineConsistency(
      manifestResult.manifest,
      timelineResult.events
    )
  );

  return createReport(
    options.rootPath,
    manifestResult.manifest,
    mediaTrackResult.tracks,
    timelineResult.events,
    issues
  );
}

export function validateArchiveSnapshot(input: {
  readonly rootPath: string;
  readonly manifest: ArchiveManifest;
  readonly mediaTracks?: readonly MediaTrack[];
  readonly timelineEvents: readonly TimelineEventEnvelope[];
}): ArchiveValidationReport {
  const mediaTracks = input.mediaTracks ?? input.manifest.tracks;
  const issues = [
    ...validateMediaTrackConsistency(input.manifest, mediaTracks),
    ...validateTimelineConsistency(input.manifest, input.timelineEvents)
  ];

  return createReport(
    input.rootPath,
    input.manifest,
    mediaTracks,
    input.timelineEvents,
    issues
  );
}

function createReport(
  rootPath: string,
  manifest: ArchiveManifest | undefined,
  mediaTracks: readonly MediaTrack[],
  timelineEvents: readonly TimelineEventEnvelope[],
  issues: readonly ArchiveValidationIssue[]
): ArchiveValidationReport {
  return {
    ok: issues.every((issue) => issue.severity !== "error"),
    rootPath,
    ...(manifest ? { manifest } : {}),
    mediaTracks,
    timelineEvents,
    issues
  };
}

async function readManifest(rootPath: string): Promise<{
  readonly manifest?: ArchiveManifest;
  readonly issues: readonly ArchiveValidationIssue[];
}> {
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

async function readTimeline(
  rootPath: string,
  relativeTimelinePath: string
): Promise<TimelineParseResult> {
  const issues: ArchiveValidationIssue[] = [];
  let timelinePath: string;

  try {
    timelinePath = resolveArchivePath(rootPath, relativeTimelinePath);
  } catch (error) {
    return {
      events: [],
      issues: [
        {
          severity: "error",
          code: "archive.unsafe_path",
          path: relativeTimelinePath,
          message: describeError(error)
        }
      ]
    };
  }

  let timelineText: string;
  try {
    timelineText = await readFile(timelinePath, "utf8");
  } catch (error) {
    return {
      events: [],
      issues: [
        {
          severity: "error",
          code: "archive.missing_file",
          path: relativeTimelinePath,
          message: `Archive timeline could not be read: ${describeError(error)}`
        }
      ]
    };
  }

  const events: TimelineEventEnvelope[] = [];

  if (timelineText.length === 0) {
    return {
      events,
      issues
    };
  }

  const rawLines = timelineText.split(/\r?\n/);
  const logicalLines = timelineText.endsWith("\n")
    ? rawLines.slice(0, -1)
    : rawLines;

  logicalLines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.trim().length === 0) {
      issues.push({
        severity: "error",
        code: "timeline.invalid_jsonl",
        path: relativeTimelinePath,
        line: lineNumber,
        message: "Timeline JSONL line is empty."
      });
      return;
    }

    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch (error) {
      issues.push({
        severity: "error",
        code: "timeline.invalid_jsonl",
        path: relativeTimelinePath,
        line: lineNumber,
        message: `Timeline JSONL line is not valid JSON: ${describeError(error)}`
      });
      return;
    }

    try {
      events.push(parseTimelineEventEnvelopeV1(value));
    } catch (error) {
      issues.push({
        severity: "error",
        code: "timeline.schema_invalid",
        path: relativeTimelinePath,
        line: lineNumber,
        message: `Timeline JSONL line failed schema validation: ${describeError(error)}`
      });
    }
  });

  return {
    events,
    issues
  };
}

function validateTimelineConsistency(
  manifest: ArchiveManifest,
  events: readonly TimelineEventEnvelope[]
): readonly ArchiveValidationIssue[] {
  const issues: ArchiveValidationIssue[] = [];
  const seenEventIds = new Map<string, TimelineEventEnvelope>();
  let expectedSequence = 1;

  events.forEach((event) => {
    if (seenEventIds.has(event.eventId)) {
      issues.push({
        severity: "error",
        code: "timeline.duplicate_event_id",
        eventId: event.eventId,
        sequence: event.sequence,
        message: `Timeline eventId is duplicated: ${event.eventId}`
      });
    } else {
      seenEventIds.set(event.eventId, event);
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

  if (
    manifest.timeline.eventCount !== undefined &&
    manifest.timeline.eventCount !== events.length
  ) {
    issues.push({
      severity: "error",
      code: "timeline.event_count_mismatch",
      message: `Manifest timeline eventCount is ${manifest.timeline.eventCount} but ${events.length} valid events were read.`
    });
  }

  const lastSequence = events.at(-1)?.sequence;
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

  return issues;
}

function validateMediaTrackConsistency(
  manifest: ArchiveManifest,
  mediaTracks: readonly MediaTrack[]
): readonly ArchiveValidationIssue[] {
  const issues: ArchiveValidationIssue[] = [];

  manifest.tracks.forEach((manifestTrack) => {
    const metadataPath = getDeclaredMediaTrackMetadataPath(manifestTrack);
    if ("issue" in metadataPath) {
      issues.push(metadataPath.issue);
      return;
    }

    issues.push(
      ...validateManifestMediaTrack(manifest, manifestTrack, metadataPath.path)
    );

    const mediaTrack = mediaTracks.find((track) => track.id === manifestTrack.id);
    if (!mediaTrack) {
      issues.push({
        severity: "error",
        code: "track.manifest_mismatch",
        path: metadataPath.path,
        trackId: manifestTrack.id,
        message: `Manifest track ${manifestTrack.id} has no matching media track metadata.`
      });
      return;
    }

    issues.push(
      ...validateMediaTrackAgainstManifest(
        manifest,
        manifestTrack,
        mediaTrack,
        metadataPath.path
      )
    );
  });

  return issues;
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
