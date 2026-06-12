import type {
  MediaToolBinaryRef,
  MediaToolCommand,
  MediaToolInputRef,
  MediaToolOutputRef
} from "./commandTypes.js";
import {
  assertNoShellMetacharacters,
  assertOutputWithinWorkingDirectory,
  redactPath
} from "./pathSafety.js";

export interface FfmpegRemuxCommandInput {
  readonly binary: MediaToolBinaryRef;
  readonly inputs: readonly MediaToolInputRef[];
  readonly output: MediaToolOutputRef;
  readonly workingDirectory: string;
  readonly timeoutMs: number;
  readonly overwrite: false;
}

export function buildFfmpegRemuxCommand(
  input: FfmpegRemuxCommandInput
): MediaToolCommand {
  if (input.inputs.length === 0) {
    throw new Error("At least one FFmpeg input is required.");
  }

  assertNoShellMetacharacters(input.binary.executablePath, "ffmpeg path");
  assertNoShellMetacharacters(input.output.path, "ffmpeg output path");
  assertOutputWithinWorkingDirectory(input.workingDirectory, input.output.path);

  const argv = ["-hide_banner", "-nostdin", "-n"];
  const redactedArgv = ["-hide_banner", "-nostdin", "-n"];

  for (const mediaInput of input.inputs) {
    assertNoShellMetacharacters(mediaInput.path, "ffmpeg input path");
    argv.push("-i", mediaInput.path);
    redactedArgv.push("-i", redactPath(mediaInput.path, mediaInput.sensitivity));
  }

  argv.push("-map", "0", "-c", "copy", input.output.path);
  redactedArgv.push(
    "-map",
    "0",
    "-c",
    "copy",
    redactPath(input.output.path, input.output.sensitivity)
  );

  return {
    tool: "ffmpeg",
    executablePath: input.binary.executablePath,
    argv,
    redactedArgv,
    workingDirectory: input.workingDirectory,
    timeoutMs: input.timeoutMs,
    sensitivity: input.output.sensitivity,
    expectedOutput: "FFmpeg remux output file"
  };
}
