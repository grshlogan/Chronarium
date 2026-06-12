import type {
  MediaToolBinaryRef,
  MediaToolCommand,
  MediaToolInputRef
} from "./commandTypes.js";
import {
  assertNoShellMetacharacters,
  redactPath
} from "./pathSafety.js";

export interface FfprobeJsonCommandInput {
  readonly binary: MediaToolBinaryRef;
  readonly input: MediaToolInputRef;
  readonly workingDirectory: string;
  readonly timeoutMs: number;
}

export function buildFfprobeJsonCommand(
  input: FfprobeJsonCommandInput
): MediaToolCommand {
  assertNoShellMetacharacters(input.binary.executablePath, "ffprobe path");
  assertNoShellMetacharacters(input.input.path, "ffprobe input path");

  const argv = [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    input.input.path
  ];

  return {
    tool: "ffprobe",
    executablePath: input.binary.executablePath,
    argv,
    redactedArgv: [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      redactPath(input.input.path, input.input.sensitivity)
    ],
    workingDirectory: input.workingDirectory,
    timeoutMs: input.timeoutMs,
    sensitivity: input.input.sensitivity,
    expectedOutput: "ffprobe JSON format and stream metadata"
  };
}
