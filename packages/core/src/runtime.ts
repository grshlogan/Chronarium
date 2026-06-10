import type { AdapterId, IsoDateTimeString } from "@chronarium/types";

export type CoreRuntimeStatus = "not-started" | "running" | "stopped" | "error";

export interface CoreRuntimeOptions {
  readonly dataRoot: string;
  readonly archiveRoot: string;
  readonly adapters: readonly AdapterId[];
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
}

export function createCoreRuntimeContract(
  _options: CoreRuntimeOptions
): CoreRuntime {
  return {
    async start(): Promise<void> {
      throw new Error("Core runtime implementation is not available yet.");
    },
    async stop(): Promise<void> {
      throw new Error("Core runtime implementation is not available yet.");
    },
    async getHealth(): Promise<CoreHealthSnapshot> {
      return {
        status: "not-started",
        checkedAt: "1970-01-01T00:00:00.000Z",
        message: "Core runtime is a contract skeleton only."
      };
    }
  };
}
