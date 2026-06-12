import { createInMemoryTaskScheduler } from "@chronarium/core";
import { describe, expect, it } from "vitest";

describe("core task scheduler", () => {
  it("creates, starts, stops, and lists fixture capture tasks", () => {
    const scheduler = createInMemoryTaskScheduler({
      now: fixedClock()
    });

    const created = scheduler.createTask({
      taskId: "task-synthetic-001",
      kind: "capture",
      sessionId: "session-synthetic-001",
      adapterId: "chaturbate",
      mode: "fixture",
      capabilitiesRequested: ["fixture.timeline", "media.discovery"]
    });
    const running = scheduler.startTask(created.taskId);
    const stopped = scheduler.stopTask(created.taskId, "user-requested");

    expect(created).toMatchObject({
      status: "created",
      createdAt: "2026-06-12T00:00:00.000Z"
    });
    expect(running).toMatchObject({
      status: "running",
      startedAt: "2026-06-12T00:00:01.000Z"
    });
    expect(stopped).toMatchObject({
      status: "stopped",
      stoppedAt: "2026-06-12T00:00:02.000Z",
      stoppedReason: "user-requested"
    });
    expect(stopped.failure).toBeUndefined();
    expect(scheduler.listTasks()).toEqual([stopped]);
  });

  it("rejects duplicate tasks and live mode in the skeleton", () => {
    const scheduler = createInMemoryTaskScheduler({
      now: fixedClock()
    });
    const request = {
      taskId: "task-synthetic-001",
      kind: "capture" as const,
      sessionId: "session-synthetic-001",
      adapterId: "chaturbate",
      mode: "fixture" as const,
      capabilitiesRequested: ["fixture.timeline" as const]
    };

    scheduler.createTask(request);

    expect(() => scheduler.createTask(request)).toThrow(/already exists/);
    expect(() =>
      scheduler.createTask({
        ...request,
        taskId: "task-live-001",
        mode: "live"
      })
    ).toThrow(/Only fixture task mode/);
  });

  it("records task failures without hiding the original task", () => {
    const scheduler = createInMemoryTaskScheduler({
      now: fixedClock()
    });
    scheduler.createTask({
      taskId: "task-synthetic-001",
      kind: "capture",
      sessionId: "session-synthetic-001",
      adapterId: "chaturbate",
      mode: "fixture",
      capabilitiesRequested: ["fixture.timeline"]
    });

    scheduler.startTask("task-synthetic-001");
    const failed = scheduler.failTask("task-synthetic-001", {
      code: "adapter.failed",
      message: "Synthetic adapter failure.",
      retryable: true
    });

    expect(failed).toMatchObject({
      status: "failed",
      failure: {
        code: "adapter.failed",
        retryable: true
      }
    });
    expect(scheduler.getTask("task-synthetic-001")).toEqual(failed);
  });
});

function fixedClock(): () => string {
  let tick = 0;
  return () => {
    const value = new Date(Date.UTC(2026, 5, 12, 0, 0, tick)).toISOString();
    tick += 1;
    return value;
  };
}
