import type { ArchiveManifest, TimelineEventEnvelope } from "@chronarium/types";

export interface ArchiveWriterOptions {
  readonly rootPath: string;
  readonly createIfMissing: boolean;
}

export interface ArchiveWriter {
  readonly rootPath: string;
  writeManifest(manifest: ArchiveManifest): Promise<void>;
  appendTimelineEvent(event: TimelineEventEnvelope): Promise<void>;
  finalize(): Promise<ArchiveManifest>;
}

export interface ArchiveWriterFactory {
  create(options: ArchiveWriterOptions): Promise<ArchiveWriter>;
}

export function createArchiveWriterContract(): ArchiveWriterFactory {
  return {
    async create(): Promise<ArchiveWriter> {
      throw new Error(
        "Archive writer implementation is not available in the skeleton."
      );
    }
  };
}
