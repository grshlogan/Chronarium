import {
  buildFfmpegRemuxCommand,
  buildFfprobeJsonCommand
} from "@chronarium/media-tools";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("media tool command builders", () => {
  it("builds redacted ffprobe JSON argv without shell strings", () => {
    const command = buildFfprobeJsonCommand({
      binary: {
        executablePath: "C:/tools/ffprobe.exe",
        origin: "user-settings"
      },
      input: {
        path: "D:/archives/session/track.mp4",
        sensitivity: "redacted"
      },
      workingDirectory: "D:/archives/session",
      timeoutMs: 30000
    });

    expect(command).toMatchObject({
      tool: "ffprobe",
      executablePath: "C:/tools/ffprobe.exe",
      argv: [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        "D:/archives/session/track.mp4"
      ],
      redactedArgv: [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        "<redacted:redacted:path>"
      ],
      timeoutMs: 30000
    });
  });

  it("builds non-overwriting ffmpeg remux argv with redacted inputs", () => {
    const workingDirectory = normalize("D:/archives/session/exports");
    const outputPath = path.join(workingDirectory, "out.mkv");
    const command = buildFfmpegRemuxCommand({
      binary: {
        executablePath: "C:/tools/ffmpeg.exe",
        origin: "user-settings"
      },
      inputs: [
        {
          path: "D:/archives/session/tracks/video/segment.m4s",
          sensitivity: "redacted"
        }
      ],
      output: {
        path: outputPath,
        sensitivity: "safe"
      },
      workingDirectory,
      timeoutMs: 60000,
      overwrite: false
    });

    expect(command.argv).toEqual([
      "-hide_banner",
      "-nostdin",
      "-n",
      "-i",
      "D:/archives/session/tracks/video/segment.m4s",
      "-map",
      "0",
      "-c",
      "copy",
      outputPath
    ]);
    expect(command.redactedArgv).toEqual([
      "-hide_banner",
      "-nostdin",
      "-n",
      "-i",
      "<redacted:redacted:path>",
      "-map",
      "0",
      "-c",
      "copy",
      outputPath
    ]);
  });

  it("rejects empty ffmpeg inputs and output paths outside the working directory", () => {
    const workingDirectory = normalize("D:/archives/session/exports");

    expect(() =>
      buildFfmpegRemuxCommand({
        binary: {
          executablePath: "ffmpeg",
          origin: "system-path"
        },
        inputs: [],
        output: {
          path: path.join(workingDirectory, "out.mkv"),
          sensitivity: "safe"
        },
        workingDirectory,
        timeoutMs: 60000,
        overwrite: false
      })
    ).toThrow(/At least one FFmpeg input/);

    expect(() =>
      buildFfmpegRemuxCommand({
        binary: {
          executablePath: "ffmpeg",
          origin: "system-path"
        },
        inputs: [
          {
            path: "input.mp4",
            sensitivity: "synthetic"
          }
        ],
        output: {
          path: normalize("D:/archives/session/outside.mkv"),
          sensitivity: "safe"
        },
        workingDirectory,
        timeoutMs: 60000,
        overwrite: false
      })
    ).toThrow(/within the working directory/);
  });

  it("rejects newlines in modeled paths", () => {
    expect(() =>
      buildFfprobeJsonCommand({
        binary: {
          executablePath: "ffprobe\nbad",
          origin: "system-path"
        },
        input: {
          path: "input.mp4",
          sensitivity: "synthetic"
        },
        workingDirectory: "D:/archives/session",
        timeoutMs: 30000
      })
    ).toThrow(/must not contain newlines/);
  });
});

function normalize(value: string): string {
  return path.normalize(value);
}
