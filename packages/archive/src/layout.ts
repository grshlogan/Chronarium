import path from "node:path";

export const ARCHIVE_FORMAT_VERSION = 1;

export const DEFAULT_ARCHIVE_LAYOUT = {
  manifest: "manifest.json",
  timeline: "timeline.jsonl",
  events: "events",
  tracks: "tracks",
  diagnostics: "diagnostics",
  exports: "exports"
} as const;

export function getSessionArchiveDirectoryName(sessionId: string): string {
  return `${sessionId}.chron`;
}

export function getMediaTrackDirectoryPath(trackId: string): string {
  assertSafeArchivePathSegment(trackId, "media track id");
  return `${DEFAULT_ARCHIVE_LAYOUT.tracks}/${trackId}`;
}

export function getMediaTrackMetadataPath(trackId: string): string {
  return `${getMediaTrackDirectoryPath(trackId)}/track.json`;
}

export function getMediaTrackSegmentsPath(trackId: string): string {
  return `${getMediaTrackDirectoryPath(trackId)}/segments`;
}

export function assertSafeArchivePathSegment(
  segment: string,
  label = "archive path segment"
): void {
  if (
    segment.length === 0 ||
    path.isAbsolute(segment) ||
    /^[A-Za-z]:/.test(segment) ||
    segment.includes("/") ||
    segment.includes("\\") ||
    segment === "." ||
    segment === ".."
  ) {
    throw new Error(`Unsafe ${label}: ${segment}`);
  }
}

export function assertSafeArchiveRelativePath(relativePath: string): void {
  const parts = relativePath.split("/");

  if (
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    parts.includes("..")
  ) {
    throw new Error(`Unsafe archive-relative path: ${relativePath}`);
  }
}

export function resolveArchivePath(
  archiveRootPath: string,
  relativePath: string
): string {
  assertSafeArchiveRelativePath(relativePath);
  return path.join(archiveRootPath, ...relativePath.split("/"));
}
