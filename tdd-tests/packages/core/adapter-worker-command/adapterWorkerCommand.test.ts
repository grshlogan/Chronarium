import { createAdapterWorkerCommand } from "@chronarium/core";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("adapter worker command builder", () => {
  it("builds a spawn-safe command descriptor for a fixture adapter worker", () => {
    const nodeExecutablePath = path.resolve("runtime", "node.exe");
    const workerEntryPath = path.resolve(
      "packages",
      "adapters",
      "stripchat",
      "dist",
      "worker.js"
    );

    const command = createAdapterWorkerCommand({
      nodeExecutablePath,
      workerEntryPath,
      adapterId: "stripchat",
      mode: "fixture",
      sessionId: "session-worker-command-001",
      capabilitiesRequested: ["fixture.timeline", "media.discovery"],
      fixtureName: "combined-av.synthetic"
    });

    expect(command).toEqual({
      executablePath: nodeExecutablePath,
      argv: [
        workerEntryPath,
        "--adapter-id",
        "stripchat",
        "--mode",
        "fixture",
        "--session-id",
        "session-worker-command-001",
        "--capability",
        "fixture.timeline",
        "--capability",
        "media.discovery",
        "--fixture-name",
        "combined-av.synthetic"
      ],
      redactedArgv: [
        workerEntryPath,
        "--adapter-id",
        "stripchat",
        "--mode",
        "fixture",
        "--session-id",
        "session-worker-command-001",
        "--capability",
        "fixture.timeline",
        "--capability",
        "media.discovery",
        "--fixture-name",
        "combined-av.synthetic"
      ],
      shell: false
    });
  });

  it("rejects relative paths and newline-bearing arguments", () => {
    const validInput = {
      nodeExecutablePath: path.resolve("runtime", "node.exe"),
      workerEntryPath: path.resolve("packages", "adapters", "worker.js"),
      adapterId: "stripchat",
      mode: "fixture" as const,
      sessionId: "session-worker-command-001",
      capabilitiesRequested: ["fixture.timeline" as const]
    };

    expect(() =>
      createAdapterWorkerCommand({
        ...validInput,
        workerEntryPath: "packages/adapters/worker.js"
      })
    ).toThrow(/absolute path/);
    expect(() =>
      createAdapterWorkerCommand({
        ...validInput,
        sessionId: "session-worker-command-001\n--token=secret"
      })
    ).toThrow(/newlines/);
  });
});
