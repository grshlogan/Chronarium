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
