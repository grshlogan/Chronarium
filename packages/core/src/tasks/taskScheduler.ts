import type { ChronariumId, IsoDateTimeString } from "@chronarium/types";
import type {
  CoreTaskRequest,
  CoreTaskScheduler,
  CoreTaskSnapshot,
  CoreTaskStatus
} from "./taskTypes.js";

export interface InMemoryTaskSchedulerOptions {
  readonly now?: () => IsoDateTimeString;
}

export function createInMemoryTaskScheduler(
  options: InMemoryTaskSchedulerOptions = {}
): CoreTaskScheduler {
  return new InMemoryTaskScheduler(options.now ?? (() => new Date().toISOString()));
}

class InMemoryTaskScheduler implements CoreTaskScheduler {
  private readonly tasks = new Map<ChronariumId, CoreTaskSnapshot>();

  constructor(private readonly now: () => IsoDateTimeString) {}

  createTask(request: CoreTaskRequest): CoreTaskSnapshot {
    if (this.tasks.has(request.taskId)) {
      throw new Error(`Task already exists: ${request.taskId}`);
    }

    if (request.mode !== "fixture") {
      throw new Error("Only fixture task mode is supported in the skeleton.");
    }

    const timestamp = this.now();
    const task: CoreTaskSnapshot = {
      ...request,
      status: "created",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.tasks.set(request.taskId, task);
    return task;
  }

  startTask(taskId: ChronariumId): CoreTaskSnapshot {
    const task = this.getTask(taskId);
    this.assertTransition(task, ["created", "stopped"], "running");
    const timestamp = this.now();
    return this.updateTask(taskId, {
      status: "running",
      updatedAt: timestamp,
      startedAt: timestamp
    });
  }

  stopTask(taskId: ChronariumId, reason: string): CoreTaskSnapshot {
    const task = this.getTask(taskId);
    this.assertTransition(task, ["created", "running", "failed"], "stopped");
    const timestamp = this.now();
    return this.updateTask(taskId, {
      status: "stopped",
      updatedAt: timestamp,
      stoppedAt: timestamp,
      stoppedReason: reason
    });
  }

  failTask(
    taskId: ChronariumId,
    failure: CoreTaskSnapshot["failure"]
  ): CoreTaskSnapshot {
    if (!failure) {
      throw new Error("Task failure details are required.");
    }

    const task = this.getTask(taskId);
    this.assertTransition(task, ["created", "starting", "running"], "failed");
    return this.updateTask(taskId, {
      status: "failed",
      updatedAt: this.now(),
      failure
    });
  }

  getTask(taskId: ChronariumId): CoreTaskSnapshot {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return task;
  }

  listTasks(): readonly CoreTaskSnapshot[] {
    return Array.from(this.tasks.values());
  }

  private updateTask(
    taskId: ChronariumId,
    patch: Partial<CoreTaskSnapshot>
  ): CoreTaskSnapshot {
    const current = this.getTask(taskId);
    const next: CoreTaskSnapshot = {
      ...current,
      ...patch
    };
    this.tasks.set(taskId, next);
    return next;
  }

  private assertTransition(
    task: CoreTaskSnapshot,
    allowedFrom: readonly CoreTaskStatus[],
    nextStatus: CoreTaskStatus
  ): void {
    if (!allowedFrom.includes(task.status)) {
      throw new Error(
        `Cannot transition task ${task.taskId} from ${task.status} to ${nextStatus}.`
      );
    }
  }
}
