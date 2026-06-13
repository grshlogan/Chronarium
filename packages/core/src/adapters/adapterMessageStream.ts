import { parseAdapterToCoreMessageV1 } from "@chronarium/schemas";
import type { AdapterToCoreMessage } from "@chronarium/types";

export type AdapterWorkerMessageStreamErrorCode =
  | "adapter_worker_stream.invalid_json"
  | "adapter_worker_stream.protocol_invalid";

export class AdapterWorkerMessageStreamError extends Error {
  readonly code: AdapterWorkerMessageStreamErrorCode;
  readonly lineNumber: number;

  constructor(input: {
    readonly code: AdapterWorkerMessageStreamErrorCode;
    readonly lineNumber: number;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "AdapterWorkerMessageStreamError";
    this.code = input.code;
    this.lineNumber = input.lineNumber;
  }
}

export async function* readAdapterWorkerJsonlMessages(
  lines: AsyncIterable<string>
): AsyncGenerator<AdapterToCoreMessage> {
  let lineNumber = 0;

  for await (const line of lines) {
    lineNumber += 1;

    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
      continue;
    }

    let parsedLine: unknown;
    try {
      parsedLine = JSON.parse(trimmedLine);
    } catch {
      throw new AdapterWorkerMessageStreamError({
        code: "adapter_worker_stream.invalid_json",
        lineNumber,
        message: `Adapter worker JSONL line ${lineNumber} is not valid JSON.`
      });
    }

    try {
      yield parseAdapterToCoreMessageV1(parsedLine);
    } catch {
      throw new AdapterWorkerMessageStreamError({
        code: "adapter_worker_stream.protocol_invalid",
        lineNumber,
        message: `Adapter worker JSONL line ${lineNumber} failed adapter-to-core protocol validation.`
      });
    }
  }
}
