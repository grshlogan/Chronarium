import type { ArchiveManifest, TimelineEventEnvelope } from "@chronarium/types";
import {
  parseArchiveManifestV1,
  parseTimelineEventEnvelopeV1
} from "@chronarium/schemas";
import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import { DEFAULT_ARCHIVE_LAYOUT, resolveArchivePath } from "./layout.js";

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

class FileArchiveWriter implements ArchiveWriter {
  readonly rootPath: string;
  private manifest: ArchiveManifest | undefined;
  private eventCount = 0;
  private lastSequence: number | undefined;
  private finalizedManifest: ArchiveManifest | undefined;
  private readonly eventIds = new Set<string>();

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  async writeManifest(manifest: ArchiveManifest): Promise<void> {
    if (this.finalizedManifest) {
      throw new Error("Cannot write archive manifest after finalization.");
    }
    if (this.eventCount > 0) {
      throw new Error("Cannot rewrite archive manifest after timeline events.");
    }

    const parsed = parseArchiveManifestV1(manifest);
    await this.ensureArchiveDirectories(parsed);
    await this.ensureTimelineFile(parsed.timeline.path);
    await this.writeManifestFile(parsed);
    this.manifest = parsed;
  }

  async appendTimelineEvent(event: TimelineEventEnvelope): Promise<void> {
    if (this.finalizedManifest) {
      throw new Error("Cannot append timeline events after finalization.");
    }
    if (!this.manifest) {
      throw new Error(
        "Cannot append timeline events before a manifest is written."
      );
    }

    const parsed = parseTimelineEventEnvelopeV1(event);
    this.assertAppendableTimelineEvent(this.manifest, parsed);
    const timelinePath = this.safePath(this.manifest.timeline.path);

    await writeFile(timelinePath, `${JSON.stringify(parsed)}\n`, {
      encoding: "utf8",
      flag: "a"
    });

    this.eventIds.add(parsed.eventId);
    this.eventCount += 1;
    this.lastSequence = parsed.sequence;
  }

  async finalize(): Promise<ArchiveManifest> {
    if (this.finalizedManifest) {
      return this.finalizedManifest;
    }
    if (!this.manifest) {
      throw new Error("Cannot finalize archive before a manifest is written.");
    }

    const finalized: ArchiveManifest = {
      ...this.manifest,
      timeline: {
        ...this.manifest.timeline,
        eventCount: this.eventCount,
        ...(this.lastSequence === undefined
          ? {}
          : { lastSequence: this.lastSequence })
      }
    };

    await this.writeManifestFile(finalized);
    this.manifest = finalized;
    this.finalizedManifest = finalized;
    return finalized;
  }

  private async ensureArchiveDirectories(
    manifest: ArchiveManifest
  ): Promise<void> {
    await mkdir(this.safePath(manifest.paths.events), { recursive: true });
    await mkdir(this.safePath(manifest.paths.tracks), { recursive: true });
    await mkdir(this.safePath(manifest.paths.diagnostics), {
      recursive: true
    });
    await mkdir(this.safePath(manifest.paths.exports), { recursive: true });
  }

  private async ensureTimelineFile(relativePath: string): Promise<void> {
    await writeFile(this.safePath(relativePath), "", {
      encoding: "utf8",
      flag: "a"
    });
  }

  private assertAppendableTimelineEvent(
    manifest: ArchiveManifest,
    event: TimelineEventEnvelope
  ): void {
    if (event.sessionId !== manifest.session.id) {
      throw new Error(
        `Timeline event sessionId ${event.sessionId} does not match manifest session ${manifest.session.id}.`
      );
    }

    const expectedSequence =
      this.lastSequence === undefined ? 1 : this.lastSequence + 1;
    if (event.sequence !== expectedSequence) {
      throw new Error(
        `Timeline event sequence expected ${expectedSequence} but received ${event.sequence}.`
      );
    }

    if (this.eventIds.has(event.eventId)) {
      throw new Error(`Duplicate timeline eventId: ${event.eventId}`);
    }
  }

  private async writeManifestFile(manifest: ArchiveManifest): Promise<void> {
    await this.writeJsonFile(DEFAULT_ARCHIVE_LAYOUT.manifest, manifest);
  }

  private async writeJsonFile(
    relativePath: string,
    value: unknown
  ): Promise<void> {
    const finalPath = this.safePath(relativePath);
    const temporaryPath = `${finalPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      flag: "w"
    });
    await rename(temporaryPath, finalPath);
  }

  private safePath(relativePath: string): string {
    return resolveArchivePath(this.rootPath, relativePath);
  }
}

export async function createFileArchiveWriter(
  options: ArchiveWriterOptions
): Promise<ArchiveWriter> {
  if (options.createIfMissing) {
    await mkdir(options.rootPath, { recursive: false });
  } else {
    const rootStat = await stat(options.rootPath);
    if (!rootStat.isDirectory()) {
      throw new Error(`Archive root is not a directory: ${options.rootPath}`);
    }
  }

  return new FileArchiveWriter(options.rootPath);
}

export function createFileArchiveWriterFactory(): ArchiveWriterFactory {
  return {
    create: createFileArchiveWriter
  };
}

export function createArchiveWriterContract(): ArchiveWriterFactory {
  return createFileArchiveWriterFactory();
}
