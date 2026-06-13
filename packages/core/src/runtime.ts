import type {
  AdapterId,
  AdapterManifest,
  IsoDateTimeString
} from "@chronarium/types";
import {
  type ChronariumIndex,
  openChronariumIndex
} from "@chronarium/indexer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  createAdapterCatalog,
  type AdapterCatalog
} from "./adapters/index.js";
import {
  createCoreArchiveIndexService,
  type CoreArchiveIndexService
} from "./archiveIndexService.js";

export type CoreRuntimeStatus = "not-started" | "running" | "stopped" | "error";

export interface CoreRuntimeOptions {
  readonly dataRoot: string;
  readonly archiveRoot: string;
  readonly adapters: readonly AdapterId[];
  readonly adapterManifests?: readonly AdapterManifest[];
  readonly indexDatabasePath?: string;
}

export interface CoreHealthSnapshot {
  readonly status: CoreRuntimeStatus;
  readonly checkedAt: IsoDateTimeString;
  readonly message?: string;
}

export interface CoreRuntime {
  start(): Promise<void>;
  stop(): Promise<void>;
  getHealth(): Promise<CoreHealthSnapshot>;
  getArchiveIndexService(): CoreArchiveIndexService;
  getAdapterCatalog(): AdapterCatalog | undefined;
}

export function createCoreRuntime(options: CoreRuntimeOptions): CoreRuntime {
  return new DefaultCoreRuntime(options);
}

export function createCoreRuntimeContract(
  options: CoreRuntimeOptions
): CoreRuntime {
  return createCoreRuntime(options);
}

class DefaultCoreRuntime implements CoreRuntime {
  private status: CoreRuntimeStatus = "not-started";
  private message = "Core runtime has not started.";
  private index: ChronariumIndex | undefined;
  private archiveIndexService: CoreArchiveIndexService | undefined;
  private readonly adapterCatalog: AdapterCatalog | undefined;

  constructor(private readonly options: CoreRuntimeOptions) {
    this.adapterCatalog = options.adapterManifests
      ? createAdapterCatalog({
          manifests: options.adapterManifests
        })
      : undefined;
  }

  async start(): Promise<void> {
    if (this.status === "running") {
      return;
    }

    try {
      await mkdir(this.options.dataRoot, {
        recursive: true
      });
      await mkdir(this.options.archiveRoot, {
        recursive: true
      });

      const index = openChronariumIndex({
        databasePath: this.getIndexDatabasePath()
      });

      this.index = index;
      this.archiveIndexService = createCoreArchiveIndexService({
        index
      });
      this.status = "running";
      this.message = "Core runtime is running.";
    } catch (error) {
      this.status = "error";
      this.message = describeError(error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.status !== "running") {
      this.status = "stopped";
      this.message = "Core runtime is stopped.";
      return;
    }

    try {
      this.index?.close();
      this.index = undefined;
      this.archiveIndexService = undefined;
      this.status = "stopped";
      this.message = "Core runtime is stopped.";
    } catch (error) {
      this.status = "error";
      this.message = describeError(error);
      throw error;
    }
  }

  async getHealth(): Promise<CoreHealthSnapshot> {
    return {
      status: this.status,
      checkedAt: new Date().toISOString(),
      message: this.message
    };
  }

  getArchiveIndexService(): CoreArchiveIndexService {
    if (!this.archiveIndexService || this.status !== "running") {
      throw new Error("Core runtime is not running.");
    }

    return this.archiveIndexService;
  }

  getAdapterCatalog(): AdapterCatalog | undefined {
    return this.adapterCatalog;
  }

  private getIndexDatabasePath(): string {
    return (
      this.options.indexDatabasePath ??
      path.join(this.options.dataRoot, "chronarium.sqlite")
    );
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
