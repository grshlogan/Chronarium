import {
  createAdapterWorkerCommand,
  runModeledAdapterWorker
} from "@chronarium/core";
import { ADAPTER_PROTOCOL_VERSION } from "@chronarium/types";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("modeled adapter worker supervisor", () => {
  it("turns valid worker stdout JSONL into a completed lifecycle report", async () => {
    const command = createStripchatWorkerCommand("session-worker-supervisor-001");

    const report = await runModeledAdapterWorker({
      command,
      request: {
        adapterId: "stripchat",
        sessionId: "session-worker-supervisor-001",
        mode: "fixture",
        capabilitiesRequested: ["fixture.timeline"]
      },
      stdout: lines([
        JSON.stringify({
          protocolVersion: ADAPTER_PROTOCOL_VERSION,
          messageId: "stripchat:ready",
          adapterId: "stripchat",
          sessionId: "session-worker-supervisor-001",
          type: "adapter.ready",
          sentAt: "2026-01-01T00:00:00.000Z",
          mode: "fixture",
          capabilities: ["fixture.timeline"]
        }),
        JSON.stringify({
          protocolVersion: ADAPTER_PROTOCOL_VERSION,
          messageId: "stripchat:finished",
          adapterId: "stripchat",
          sessionId: "session-worker-supervisor-001",
          type: "adapter.finished",
          sentAt: "2026-01-01T00:00:01.000Z",
          reason: "completed",
          summary: {
            syntheticOnly: true
          }
        })
      ]),
      stderr: lines([]),
      exitCode: 0
    });

    expect(report).toMatchObject({
      status: "completed",
      exitCode: 0,
      stderrSummary: {
        lineCount: 0,
        lines: []
      },
      lifecycle: {
        status: "finished",
        finishedReason: "completed",
        messageCount: 2
      }
    });
    expect(report.command.shell).toBe(false);
  });

  it("maps invalid worker stdout into a failed report without echoing stdout", async () => {
    const command = createStripchatWorkerCommand("session-worker-supervisor-002");

    const report = await runModeledAdapterWorker({
      command,
      request: {
        adapterId: "stripchat",
        sessionId: "session-worker-supervisor-002",
        mode: "fixture",
        capabilitiesRequested: ["fixture.timeline"]
      },
      stdout: lines(["{ token=should-not-appear "]),
      stderr: lines(["synthetic stderr warning"]),
      exitCode: 0
    });

    expect(report).toMatchObject({
      status: "failed",
      exitCode: 0,
      stderrSummary: {
        lineCount: 1,
        lines: ["synthetic stderr warning"]
      },
      failure: {
        code: "adapter_worker_stream.invalid_json",
        retryable: true
      }
    });
    expect(report.failure?.message).toBe(
      "Adapter worker JSONL line 1 is not valid JSON."
    );
    expect(report.failure?.message).not.toContain("should-not-appear");
    expect(report.lifecycle).toBeUndefined();
  });

  it("marks a worker as failed when it exits with a non-zero code", async () => {
    const command = createStripchatWorkerCommand("session-worker-supervisor-003");

    const report = await runModeledAdapterWorker({
      command,
      request: {
        adapterId: "stripchat",
        sessionId: "session-worker-supervisor-003",
        mode: "fixture",
        capabilitiesRequested: ["fixture.timeline"]
      },
      stdout: lines([
        JSON.stringify({
          protocolVersion: ADAPTER_PROTOCOL_VERSION,
          messageId: "stripchat:ready",
          adapterId: "stripchat",
          sessionId: "session-worker-supervisor-003",
          type: "adapter.ready",
          sentAt: "2026-01-01T00:00:00.000Z",
          mode: "fixture",
          capabilities: ["fixture.timeline"]
        }),
        JSON.stringify({
          protocolVersion: ADAPTER_PROTOCOL_VERSION,
          messageId: "stripchat:finished",
          adapterId: "stripchat",
          sessionId: "session-worker-supervisor-003",
          type: "adapter.finished",
          sentAt: "2026-01-01T00:00:01.000Z",
          reason: "completed",
          summary: {
            syntheticOnly: true
          }
        })
      ]),
      stderr: lines(["synthetic worker exit warning"]),
      exitCode: 7
    });

    expect(report).toMatchObject({
      status: "failed",
      exitCode: 7,
      failure: {
        code: "adapter_worker.exit_nonzero",
        message: "Adapter worker exited with code 7.",
        retryable: true
      },
      lifecycle: {
        status: "finished"
      },
      stderrSummary: {
        lineCount: 1,
        lines: ["synthetic worker exit warning"]
      }
    });
  });
});

async function* lines(values: readonly string[]): AsyncGenerator<string> {
  for (const value of values) {
    yield value;
  }
}

function createStripchatWorkerCommand(sessionId: string) {
  return createAdapterWorkerCommand({
    nodeExecutablePath: path.resolve("runtime", "node.exe"),
    workerEntryPath: path.resolve(
      "packages",
      "adapters",
      "stripchat",
      "worker.js"
    ),
    adapterId: "stripchat",
    mode: "fixture",
    sessionId,
    capabilitiesRequested: ["fixture.timeline"]
  });
}
