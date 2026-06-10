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
