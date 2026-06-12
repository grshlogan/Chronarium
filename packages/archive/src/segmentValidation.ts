import type {
  ArchiveManifest,
  MediaSegmentFact,
  MediaTrack,
  TimelineEventEnvelope
} from "@chronarium/types";
import { parseMediaSegmentFactV1 } from "@chronarium/schemas";
import { stat } from "node:fs/promises";
import { resolveArchivePath } from "./layout.js";
import type { ArchiveValidationIssue } from "./validator.js";

export async function validateTimelineMediaSegments(input: {
  readonly rootPath: string;
  readonly manifest: ArchiveManifest;
  readonly mediaTracks: readonly MediaTrack[];
  readonly timelineEvents: readonly TimelineEventEnvelope[];
}): Promise<readonly ArchiveValidationIssue[]> {
  const issues: ArchiveValidationIssue[] = [];

  for (const event of input.timelineEvents) {
    if (!event.type.startsWith("media.segment.")) {
      continue;
    }

    if (!hasReferencedSegmentPath(event.payload)) {
      continue;
    }

    let segment: MediaSegmentFact;
    try {
      segment = parseMediaSegmentFactV1(event.payload);
    } catch (error) {
      issues.push({
        severity: "error",
        code: "segment.schema_invalid",
        eventId: event.eventId,
        sequence: event.sequence,
        message: `Media segment fact failed schema validation: ${describeError(error)}`
      });
      continue;
    }

    if (!segment.relativePath) {
      continue;
    }

    const track = input.mediaTracks.find(
      (mediaTrack) => mediaTrack.id === segment.trackId
    );

    if (!track) {
      issues.push({
        severity: "error",
        code: "segment.track_unknown",
        path: segment.relativePath,
        trackId: segment.trackId,
        eventId: event.eventId,
        sequence: event.sequence,
        message: `Media segment references unknown track: ${segment.trackId}`
      });
      continue;
    }

    let segmentPath: string;
    try {
      segmentPath = resolveArchivePath(input.rootPath, segment.relativePath);
    } catch (error) {
      issues.push({
        severity: "error",
        code: "segment.unsafe_path",
        path: segment.relativePath,
        trackId: segment.trackId,
        eventId: event.eventId,
        sequence: event.sequence,
        message: describeError(error)
      });
      continue;
    }

    if (!isPathInsideSegmentsPath(segment.relativePath, track.segmentsPath)) {
      issues.push({
        severity: "error",
        code: "segment.path_mismatch",
        path: segment.relativePath,
        trackId: segment.trackId,
        eventId: event.eventId,
        sequence: event.sequence,
        message: `Media segment path ${segment.relativePath} is not under track segmentsPath ${track.segmentsPath}.`
      });
      continue;
    }

    try {
      const segmentStat = await stat(segmentPath);
      if (!segmentStat.isFile()) {
        issues.push({
          severity: "error",
          code: "segment.missing_file",
          path: segment.relativePath,
          trackId: segment.trackId,
          eventId: event.eventId,
          sequence: event.sequence,
          message: `Media segment path is not a file: ${segment.relativePath}`
        });
        continue;
      }

      if (
        segment.byteLength !== undefined &&
        segment.byteLength !== segmentStat.size
      ) {
        issues.push({
          severity: "error",
          code: "segment.byte_length_mismatch",
          path: segment.relativePath,
          trackId: segment.trackId,
          eventId: event.eventId,
          sequence: event.sequence,
          message: `Media segment byteLength is ${segment.byteLength} but file size is ${segmentStat.size}.`
        });
      }
    } catch (error) {
      issues.push({
        severity: "error",
        code: "segment.missing_file",
        path: segment.relativePath,
        trackId: segment.trackId,
        eventId: event.eventId,
        sequence: event.sequence,
        message: `Media segment file could not be read: ${describeError(error)}`
      });
    }
  }

  return issues;
}

function isPathInsideSegmentsPath(
  relativePath: string,
  segmentsPath: string
): boolean {
  return relativePath === segmentsPath || relativePath.startsWith(`${segmentsPath}/`);
}

function hasReferencedSegmentPath(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "relativePath" in value
  );
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
