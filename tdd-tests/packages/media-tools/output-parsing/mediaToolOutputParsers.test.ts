import {
  parseFfmpegProgressOutput,
  parseFfprobeJsonOutput
} from "../../../../packages/media-tools/src/index.js";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("parseFfprobeJsonOutput", () => {
  it("parses synthetic ffprobe JSON format and stream metadata", async () => {
    const parsed = parseFfprobeJsonOutput(await readFixture("ffprobe.synthetic.json"));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(parsed.error.message);
    }

    expect(parsed.value).toMatchObject({
      format: {
        durationMs: 12345,
        sizeBytes: 2048000,
        bitRate: 1327000
      },
      streams: [
        {
          index: 0,
          codecType: "video",
          codecName: "h264",
          durationMs: 12300,
          width: 1280,
          height: 720,
          avgFrameRate: "30/1"
        },
        {
          index: 1,
          codecType: "audio",
          codecName: "aac",
          durationMs: 12345,
          sampleRate: 48000,
          channels: 2
        }
      ]
    });
  });

  it("returns a stable sanitized error for malformed ffprobe JSON", () => {
    const parsed = parseFfprobeJsonOutput(
      '{"format": "bad", "secret": "https://example.invalid/signed?token=abc"}'
    );

    expect(parsed).toEqual({
      ok: false,
      error: {
        code: "ffprobe_json.invalid_shape",
        message: "ffprobe JSON output did not match the expected synthetic-safe shape."
      }
    });
    expect(JSON.stringify(parsed)).not.toContain("token=abc");
    expect(JSON.stringify(parsed)).not.toContain("example.invalid");
  });
});

describe("parseFfmpegProgressOutput", () => {
  it("parses synthetic ffmpeg progress key-value output", async () => {
    const parsed = parseFfmpegProgressOutput(
      await readFixture("ffmpeg-progress.synthetic.txt")
    );

    expect(parsed).toEqual({
      ok: true,
      value: {
        outTimeMs: 12345,
        frame: 360,
        fps: 29.97,
        bitrate: "1327.0kbits/s",
        totalSizeBytes: 2048000,
        speed: "1.02x",
        progress: "continue"
      }
    });
  });

  it("returns a stable sanitized error for malformed ffmpeg progress output", () => {
    const parsed = parseFfmpegProgressOutput(
      "frame=12\nhttps://example.invalid/signed?token=abc\nprogress=continue"
    );

    expect(parsed).toEqual({
      ok: false,
      error: {
        code: "ffmpeg_progress.invalid_line",
        message:
          "FFmpeg progress output did not match the expected synthetic-safe key-value shape."
      }
    });
    expect(JSON.stringify(parsed)).not.toContain("token=abc");
    expect(JSON.stringify(parsed)).not.toContain("example.invalid");
  });
});

async function readFixture(name: string): Promise<string> {
  return readFile(
    new URL(`../../../../packages/media-tools/fixtures/${name}`, import.meta.url),
    "utf8"
  );
}
