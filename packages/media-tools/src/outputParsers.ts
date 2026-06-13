export interface MediaToolParseError {
  readonly code: string;
  readonly message: string;
}

export type MediaToolParseResult<TValue> =
  | {
      readonly ok: true;
      readonly value: TValue;
    }
  | {
      readonly ok: false;
      readonly error: MediaToolParseError;
    };

export interface ParsedFfprobeFormat {
  readonly durationMs?: number;
  readonly sizeBytes?: number;
  readonly bitRate?: number;
}

export interface ParsedFfprobeStream {
  readonly index: number;
  readonly codecType: string;
  readonly codecName?: string;
  readonly durationMs?: number;
  readonly width?: number;
  readonly height?: number;
  readonly avgFrameRate?: string;
  readonly sampleRate?: number;
  readonly channels?: number;
}

export interface ParsedFfprobeOutput {
  readonly format: ParsedFfprobeFormat;
  readonly streams: readonly ParsedFfprobeStream[];
}

export interface ParsedFfmpegProgressOutput {
  readonly outTimeMs?: number;
  readonly frame?: number;
  readonly fps?: number;
  readonly bitrate?: string;
  readonly totalSizeBytes?: number;
  readonly speed?: string;
  readonly progress?: string;
}

const FfprobeJsonErrors = {
  invalidJson: {
    code: "ffprobe_json.invalid_json",
    message: "ffprobe JSON output could not be parsed as JSON."
  },
  invalidShape: {
    code: "ffprobe_json.invalid_shape",
    message:
      "ffprobe JSON output did not match the expected synthetic-safe shape."
  }
} as const;

export function parseFfprobeJsonOutput(
  text: string
): MediaToolParseResult<ParsedFfprobeOutput> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: FfprobeJsonErrors.invalidJson };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: FfprobeJsonErrors.invalidShape };
  }

  const format = parseFfprobeFormat(parsed.format);
  const streams = parseFfprobeStreams(parsed.streams);
  if (!format || !streams) {
    return { ok: false, error: FfprobeJsonErrors.invalidShape };
  }

  return {
    ok: true,
    value: {
      format,
      streams
    }
  };
}

export function parseFfmpegProgressOutput(
  text: string
): MediaToolParseResult<ParsedFfmpegProgressOutput> {
  const fields = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      return {
        ok: false,
        error: {
          code: "ffmpeg_progress.invalid_line",
          message:
          "FFmpeg progress output did not match the expected synthetic-safe key-value shape."
        }
      };
    }
    const key = line.slice(0, separatorIndex);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return {
        ok: false,
        error: {
          code: "ffmpeg_progress.invalid_line",
          message:
            "FFmpeg progress output did not match the expected synthetic-safe key-value shape."
        }
      };
    }
    fields.set(key, line.slice(separatorIndex + 1));
  }

  return {
    ok: true,
    value: stripUndefined({
      outTimeMs: parseFfmpegOutTime(fields.get("out_time")),
      frame: integerStringToNumber(fields.get("frame")),
      fps: decimalStringToNumber(fields.get("fps")),
      bitrate: optionalString(fields.get("bitrate")),
      totalSizeBytes: integerStringToNumber(fields.get("total_size")),
      speed: optionalString(fields.get("speed")),
      progress: optionalString(fields.get("progress"))
    }) as ParsedFfmpegProgressOutput
  };
}

function parseFfprobeFormat(value: unknown): ParsedFfprobeFormat | undefined {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    return undefined;
  }

  return stripUndefined({
    durationMs: secondsStringToMs(value.duration),
    sizeBytes: integerStringToNumber(value.size),
    bitRate: integerStringToNumber(value.bit_rate)
  }) as ParsedFfprobeFormat;
}

function parseFfprobeStreams(
  value: unknown
): readonly ParsedFfprobeStream[] | undefined {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    return undefined;
  }

  const streams: ParsedFfprobeStream[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      return undefined;
    }
    if (typeof item.index !== "number" || !Number.isInteger(item.index)) {
      return undefined;
    }
    if (typeof item.codec_type !== "string" || item.codec_type.length === 0) {
      return undefined;
    }

    streams.push(
      stripUndefined({
        index: item.index,
        codecType: item.codec_type,
        codecName: optionalString(item.codec_name),
        durationMs: secondsStringToMs(item.duration),
        width: optionalInteger(item.width),
        height: optionalInteger(item.height),
        avgFrameRate: optionalString(item.avg_frame_rate),
        sampleRate: integerStringToNumber(item.sample_rate),
        channels: optionalInteger(item.channels)
      }) as ParsedFfprobeStream
    );
  }

  return streams;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value)
    ? value
    : undefined;
}

function integerStringToNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function secondsStringToMs(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return Math.round(parsed * 1000);
}

function decimalStringToNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFfmpegOutTime(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const match = /^(\d{2,}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) {
    return undefined;
  }

  const [, hoursText, minutesText, secondsText, fractionText = ""] = match;
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const seconds = Number(secondsText);
  if (minutes > 59 || seconds > 59) {
    return undefined;
  }

  const paddedFraction = fractionText.padEnd(6, "0");
  const microseconds = paddedFraction.length > 0 ? Number(paddedFraction) : 0;
  return (
    ((hours * 60 * 60 + minutes * 60 + seconds) * 1000) +
    Math.round(microseconds / 1000)
  );
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  ) as Partial<T>;
}
