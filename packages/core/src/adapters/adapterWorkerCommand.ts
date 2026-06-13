import type {
  AdapterCapability,
  AdapterId,
  AdapterRuntimeMode,
  ChronariumId
} from "@chronarium/types";
import path from "node:path";

export interface AdapterWorkerCommandInput {
  readonly nodeExecutablePath: string;
  readonly workerEntryPath: string;
  readonly adapterId: AdapterId;
  readonly mode: AdapterRuntimeMode;
  readonly sessionId: ChronariumId;
  readonly capabilitiesRequested: readonly AdapterCapability[];
  readonly fixtureName?: string;
}

export interface AdapterWorkerCommand {
  readonly executablePath: string;
  readonly argv: readonly string[];
  readonly redactedArgv: readonly string[];
  readonly shell: false;
}

export function createAdapterWorkerCommand(
  input: AdapterWorkerCommandInput
): AdapterWorkerCommand {
  const executablePath = expectSafeAbsolutePath(
    input.nodeExecutablePath,
    "nodeExecutablePath"
  );
  const workerEntryPath = expectSafeAbsolutePath(
    input.workerEntryPath,
    "workerEntryPath"
  );
  const argv = [
    workerEntryPath,
    "--adapter-id",
    expectSafeArgument(input.adapterId, "adapterId"),
    "--mode",
    expectSafeArgument(input.mode, "mode"),
    "--session-id",
    expectSafeArgument(input.sessionId, "sessionId")
  ];

  for (const capability of input.capabilitiesRequested) {
    argv.push("--capability", expectSafeArgument(capability, "capability"));
  }

  if (input.fixtureName) {
    argv.push(
      "--fixture-name",
      expectSafeArgument(input.fixtureName, "fixtureName")
    );
  }

  return {
    executablePath,
    argv,
    redactedArgv: [...argv],
    shell: false
  };
}

function expectSafeAbsolutePath(value: string, pathName: string): string {
  const safeValue = expectSafeArgument(value, pathName);
  if (!path.isAbsolute(safeValue)) {
    throw new Error(`${pathName} must be an absolute path.`);
  }

  return safeValue;
}

function expectSafeArgument(value: string, pathName: string): string {
  if (value.length === 0) {
    throw new Error(`${pathName} must not be empty.`);
  }

  if (value.includes("\n") || value.includes("\r")) {
    throw new Error(`${pathName} must not contain newlines.`);
  }

  return value;
}
