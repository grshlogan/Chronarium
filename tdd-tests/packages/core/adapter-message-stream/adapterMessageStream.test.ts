import { readAdapterWorkerJsonlMessages } from "@chronarium/core";
import { ADAPTER_PROTOCOL_VERSION } from "@chronarium/types";
import { describe, expect, it } from "vitest";

describe("adapter worker JSONL message stream", () => {
  it("parses adapter-to-core messages from JSON Lines and ignores blank lines", async () => {
    const messages = await collectMessages(
      readAdapterWorkerJsonlMessages(
        asyncLines([
          "",
          JSON.stringify({
            protocolVersion: ADAPTER_PROTOCOL_VERSION,
            messageId: "stripchat:ready",
            adapterId: "stripchat",
            sessionId: "session-jsonl-001",
            type: "adapter.ready",
            sentAt: "2026-01-01T00:00:00.000Z",
            mode: "fixture",
            capabilities: ["fixture.timeline"]
          }),
          "   ",
          JSON.stringify({
            protocolVersion: ADAPTER_PROTOCOL_VERSION,
            messageId: "stripchat:finished",
            adapterId: "stripchat",
            sessionId: "session-jsonl-001",
            type: "adapter.finished",
            sentAt: "2026-01-01T00:00:01.000Z",
            reason: "completed",
            summary: {
              syntheticOnly: true
            }
          })
        ])
      )
    );

    expect(messages.map((message) => message.type)).toEqual([
      "adapter.ready",
      "adapter.finished"
    ]);
    expect(messages[0]).toMatchObject({
      adapterId: "stripchat",
      sessionId: "session-jsonl-001"
    });
  });

  it("reports invalid JSON with a code and line number without echoing the line", async () => {
    await expect(
      collectMessages(
        readAdapterWorkerJsonlMessages(
          asyncLines(["", "{ token=secret-value "])
        )
      )
    ).rejects.toMatchObject({
      name: "AdapterWorkerMessageStreamError",
      code: "adapter_worker_stream.invalid_json",
      lineNumber: 2,
      message: "Adapter worker JSONL line 2 is not valid JSON."
    });

    await expect(
      collectMessages(
        readAdapterWorkerJsonlMessages(
          asyncLines(["", "{ token=secret-value "])
        )
      )
    ).rejects.not.toThrow(/secret-value/);
  });

  it("reports protocol-invalid JSON without echoing sensitive-looking fields", async () => {
    const invalidProtocolLine = JSON.stringify({
      protocolVersion: ADAPTER_PROTOCOL_VERSION,
      messageId: "stripchat:bad",
      adapterId: "stripchat",
      type: "adapter.ready",
      sentAt: "2026-01-01T00:00:00.000Z",
      authorization: "Bearer should-not-appear"
    });

    await expect(
      collectMessages(
        readAdapterWorkerJsonlMessages(asyncLines([invalidProtocolLine]))
      )
    ).rejects.toMatchObject({
      name: "AdapterWorkerMessageStreamError",
      code: "adapter_worker_stream.protocol_invalid",
      lineNumber: 1,
      message:
        "Adapter worker JSONL line 1 failed adapter-to-core protocol validation."
    });

    await expect(
      collectMessages(
        readAdapterWorkerJsonlMessages(asyncLines([invalidProtocolLine]))
      )
    ).rejects.not.toThrow(/Bearer should-not-appear/);
  });
});

async function* asyncLines(lines: readonly string[]): AsyncGenerator<string> {
  for (const line of lines) {
    yield line;
  }
}

async function collectMessages<T>(input: AsyncIterable<T>): Promise<T[]> {
  const messages: T[] = [];

  for await (const message of input) {
    messages.push(message);
  }

  return messages;
}
