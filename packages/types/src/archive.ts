import type {
  ChronariumId,
  IsoDateTimeString,
  RelativeArchivePath
} from "./primitives.js";
import type { LiveSession } from "./session.js";
import type { MediaTrack } from "./media.js";

export interface ArchiveManifestPaths {
  readonly timeline: RelativeArchivePath;
  readonly events: RelativeArchivePath;
  readonly tracks: RelativeArchivePath;
  readonly diagnostics: RelativeArchivePath;
  readonly exports: RelativeArchivePath;
}

export interface ArchiveTimelineIndex {
  readonly path: RelativeArchivePath;
  readonly eventCount?: number;
  readonly lastSequence?: number;
}

export interface ArchiveSchemaVersions {
  readonly timeline: 1;
  readonly adapterProtocol: 1;
}

export interface ArchiveGeneratorInfo {
  readonly name: "chronarium";
  readonly version?: string;
}

export interface ArchiveManifest {
  readonly archiveFormatVersion: 1;
  readonly archiveId: ChronariumId;
  readonly session: LiveSession;
  readonly createdAt: IsoDateTimeString;
  readonly updatedAt: IsoDateTimeString;
  readonly schemaVersions: ArchiveSchemaVersions;
  readonly timeline: ArchiveTimelineIndex;
  readonly tracks: readonly MediaTrack[];
  readonly paths: ArchiveManifestPaths;
  readonly generator: ArchiveGeneratorInfo;
}
