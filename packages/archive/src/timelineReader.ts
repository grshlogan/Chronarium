import type { TimelineEventEnvelope } from "@chronarium/types";
import { parseTimelineEventEnvelopeV1 } from "@chronarium/schemas";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolveArchivePath } from "./layout.js";
import type { ArchiveValidationIssue } from "./validator.js";

export interface TimelineReaderOptions {
  readonly rootPath: string;
  readonly relativeTimelinePath?: string;
}

export interface TimelineBatchReaderOptions extends TimelineReaderOptions {
  readonly batchSize: number;
}

export type TimelineRecord =
  | {
      readonly kind: "event";
      readonly line: number;
      readonly event: TimelineEventEnvelope;
    }
  | {
      readonly kind: "issue";
      readonly line: number;
      readonly issue: ArchiveValidationIssue;
    };

export interface TimelineEventBatch {
  readonly startLine: number;
  readonly endLine: number;
  readonly events: readonly TimelineEventEnvelope[];
  readonly issues: readonly ArchiveValidationIssue[];
}

export async function* iterateTimelineRecords(
  options: TimelineReaderOptions
): AsyncIterable<TimelineRecord> {
  const relativeTimelinePath = options.relativeTimelinePath ?? "timeline.jsonl";
  let timelinePath: string;

  try {
    timelinePath = resolveArchivePath(options.rootPath, relativeTimelinePath);
  } catch (error) {
    yield {
      kind: "issue",
      line: 0,
      issue: {
        severity: "error",
        code: "archive.unsafe_path",
        path: relativeTimelinePath,
        message: describeError(error)
      }
    };
    return;
  }

  const stream = createReadStream(timelinePath, {
    encoding: "utf8"
  });
  const lines = createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;

  try {
    for await (const line of lines) {
      lineNumber += 1;
      yield parseTimelineRecordLine(line, lineNumber, relativeTimelinePath);
    }
  } catch (error) {
    yield {
      kind: "issue",
      line: lineNumber,
      issue: {
        severity: "error",
        code: "archive.missing_file",
        path: relativeTimelinePath,
        message: `Archive timeline could not be read: ${describeError(error)}`
      }
    };
  }
}

export async function* readTimelineEventBatches(
  options: TimelineBatchReaderOptions
): AsyncIterable<TimelineEventBatch> {
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1) {
    throw new Error(`Timeline batchSize must be a positive integer.`);
  }

  let startLine: number | undefined;
  let endLine = 0;
  let events: TimelineEventEnvelope[] = [];
  let issues: ArchiveValidationIssue[] = [];

  for await (const record of iterateTimelineRecords(options)) {
    startLine ??= record.line;
    endLine = record.line;

    if (record.kind === "event") {
      events.push(record.event);
    } else {
      issues.push(record.issue);
    }

    if (events.length + issues.length >= options.batchSize) {
      yield {
        startLine,
        endLine,
        events,
        issues
      };
      startLine = undefined;
      endLine = 0;
      events = [];
      issues = [];
    }
  }

  if (events.length > 0 || issues.length > 0) {
    yield {
      startLine: startLine ?? endLine,
      endLine,
      events,
      issues
    };
  }
}

function parseTimelineRecordLine(
  line: string,
  lineNumber: number,
  relativeTimelinePath: string
): TimelineRecord {
  if (line.trim().length === 0) {
    return {
      kind: "issue",
      line: lineNumber,
      issue: {
        severity: "error",
        code: "timeline.invalid_jsonl",
        path: relativeTimelinePath,
        line: lineNumber,
        message: "Timeline JSONL line is empty."
      }
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch (error) {
    return {
      kind: "issue",
      line: lineNumber,
      issue: {
        severity: "error",
        code: "timeline.invalid_jsonl",
        path: relativeTimelinePath,
        line: lineNumber,
        message: `Timeline JSONL line is not valid JSON: ${describeError(error)}`
      }
    };
  }

  try {
    return {
      kind: "event",
      line: lineNumber,
      event: parseTimelineEventEnvelopeV1(value)
    };
  } catch (error) {
    return {
      kind: "issue",
      line: lineNumber,
      issue: {
        severity: "error",
        code: "timeline.schema_invalid",
        path: relativeTimelinePath,
        line: lineNumber,
        message: `Timeline JSONL line failed schema validation: ${describeError(error)}`
      }
    };
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
