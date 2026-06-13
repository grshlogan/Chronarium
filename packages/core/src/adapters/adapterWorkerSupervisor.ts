import type { AdapterWorkerCommand } from "./adapterWorkerCommand.js";
import {
  createFixtureAdapterLifecycleHost,
  type AdapterLifecycleSnapshot,
  type AdapterLifecycleStartRequest
} from "./adapterLifecycle.js";
import {
  AdapterWorkerMessageStreamError,
  readAdapterWorkerJsonlMessages
} from "./adapterMessageStream.js";

export type ModeledAdapterWorkerStatus = "completed" | "failed";

export interface ModeledAdapterWorkerInput {
  readonly command: AdapterWorkerCommand;
  readonly request: AdapterLifecycleStartRequest;
  readonly stdout: AsyncIterable<string>;
  readonly stderr: AsyncIterable<string>;
  readonly exitCode: number;
}

export interface AdapterWorkerStderrSummary {
  readonly lineCount: number;
  readonly lines: readonly string[];
}

export interface ModeledAdapterWorkerReport {
  readonly status: ModeledAdapterWorkerStatus;
  readonly command: AdapterWorkerCommand;
  readonly lifecycle?: AdapterLifecycleSnapshot;
  readonly stderrSummary: AdapterWorkerStderrSummary;
  readonly exitCode: number;
  readonly failure?: {
    readonly code: string;
    readonly message: string;
    readonly retryable: boolean;
  };
}

export async function runModeledAdapterWorker(
  input: ModeledAdapterWorkerInput
): Promise<ModeledAdapterWorkerReport> {
  const stderrSummary = await summarizeStderr(input.stderr);
  const lifecycleHost = createFixtureAdapterLifecycleHost();
  let lifecycle: AdapterLifecycleSnapshot;
  try {
    lifecycle = await lifecycleHost.runFixture({
      request: input.request,
      messages: readAdapterWorkerJsonlMessages(input.stdout)
    });
  } catch (error) {
    if (error instanceof AdapterWorkerMessageStreamError) {
      return {
        status: "failed",
        command: input.command,
        stderrSummary,
        exitCode: input.exitCode,
        failure: {
          code: error.code,
          message: error.message,
          retryable: true
        }
      };
    }

    throw error;
  }

  if (input.exitCode !== 0) {
    return {
      status: "failed",
      command: input.command,
      lifecycle,
      stderrSummary,
      exitCode: input.exitCode,
      failure: {
        code: "adapter_worker.exit_nonzero",
        message: `Adapter worker exited with code ${input.exitCode}.`,
        retryable: true
      }
    };
  }

  if (lifecycle.status !== "finished") {
    return {
      status: "failed",
      command: input.command,
      lifecycle,
      stderrSummary,
      exitCode: input.exitCode,
      failure: {
        code: "adapter_worker.lifecycle_failed",
        message: "Adapter worker lifecycle did not finish successfully.",
        retryable: true
      }
    };
  }

  return {
    status: "completed",
    command: input.command,
    lifecycle,
    stderrSummary,
    exitCode: input.exitCode
  };
}

async function summarizeStderr(
  stderr: AsyncIterable<string>
): Promise<AdapterWorkerStderrSummary> {
  const lines: string[] = [];
  let lineCount = 0;

  for await (const line of stderr) {
    lineCount += 1;
    lines.push(line);
  }

  return {
    lineCount,
    lines
  };
}
