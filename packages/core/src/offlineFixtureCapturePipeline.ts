import {
  createFileArchiveWriter,
  type ArchiveWriterFactory
} from "@chronarium/archive";
import type {
  AdapterErrorMessage,
  AdapterToCoreMessage,
  ArchiveManifest,
  MediaTrack
} from "@chronarium/types";
import type { ArchiveIndexSummary } from "@chronarium/indexer";
import type { AdapterCatalog } from "./adapters/index.js";
import type { CoreArchiveIndexService } from "./archiveIndexService.js";
import {
  createFixtureAdapterLifecycleHost,
  type AdapterLifecycleSnapshot,
  type FixtureAdapterLifecycleHost
} from "./adapters/index.js";
import {
  createInMemoryTaskScheduler,
  type CoreTaskRequest,
  type CoreTaskScheduler,
  type CoreTaskSnapshot
} from "./tasks/index.js";

export type OfflineFixtureCaptureStatus = "completed" | "failed";

export interface OfflineFixtureCaptureInput {
  readonly archiveRootPath: string;
  readonly task: CoreTaskRequest;
  readonly manifest: ArchiveManifest;
  readonly mediaTracks?: readonly MediaTrack[];
  readonly adapterMessages: AsyncIterable<AdapterToCoreMessage>;
}

export interface OfflineFixtureCaptureResult {
  readonly status: OfflineFixtureCaptureStatus;
  readonly archiveRootPath: string;
  readonly task: CoreTaskSnapshot;
  readonly lifecycle?: AdapterLifecycleSnapshot;
  readonly indexSummary?: ArchiveIndexSummary;
}

export interface OfflineFixtureCapturePipelineOptions {
  readonly archiveIndexService: CoreArchiveIndexService;
  readonly taskScheduler?: CoreTaskScheduler;
  readonly lifecycleHost?: FixtureAdapterLifecycleHost;
  readonly archiveWriterFactory?: ArchiveWriterFactory;
  readonly adapterCatalog?: AdapterCatalog;
}

export async function runOfflineFixtureCapture(
  input: OfflineFixtureCaptureInput,
  options: OfflineFixtureCapturePipelineOptions
): Promise<OfflineFixtureCaptureResult> {
  const taskScheduler = options.taskScheduler ?? createInMemoryTaskScheduler();
  const lifecycleHost =
    options.lifecycleHost ?? createFixtureAdapterLifecycleHost();
  const archiveWriterFactory = options.archiveWriterFactory ?? {
    create: createFileArchiveWriter
  };

  const createdTask = taskScheduler.createTask(input.task);
  const runningTask = taskScheduler.startTask(createdTask.taskId);

  const gateFailure = getAdapterTaskGateFailure(
    input.task,
    options.adapterCatalog
  );
  if (gateFailure) {
    const failedTask = taskScheduler.failTask(runningTask.taskId, gateFailure);

    return {
      status: "failed",
      archiveRootPath: input.archiveRootPath,
      task: failedTask
    };
  }

  const lifecycle = await lifecycleHost.runFixture({
    request: {
      adapterId: input.task.adapterId,
      sessionId: input.task.sessionId,
      mode: input.task.mode,
      capabilitiesRequested: input.task.capabilitiesRequested
    },
    messages: input.adapterMessages
  });

  if (lifecycle.status !== "finished") {
    const lifecycleError = firstAdapterError(lifecycle.errors);
    const failedTask = taskScheduler.failTask(input.task.taskId, {
      code: lifecycleError?.code ?? "adapter.lifecycle.failed",
      message:
        lifecycleError?.message ??
        "Fixture adapter lifecycle did not finish successfully.",
      retryable: lifecycleError?.retryable ?? true
    });

    return {
      status: "failed",
      archiveRootPath: input.archiveRootPath,
      task: failedTask,
      lifecycle
    };
  }

  const writer = await archiveWriterFactory.create({
    rootPath: input.archiveRootPath,
    createIfMissing: true
  });

  await writer.writeManifest(input.manifest);
  for (const mediaTrack of input.mediaTracks ?? []) {
    await writer.writeMediaTrack(mediaTrack);
  }
  for (const event of lifecycle.timelineEvents) {
    await writer.appendTimelineEvent(event);
  }
  await writer.finalize();

  const indexSummary = await options.archiveIndexService.reindexArchive(
    input.archiveRootPath
  );
  const stoppedTask = taskScheduler.stopTask(
    input.task.taskId,
    "fixture-capture-completed"
  );

  return {
    status: "completed",
    archiveRootPath: input.archiveRootPath,
    task: stoppedTask,
    lifecycle,
    indexSummary
  };
}

function firstAdapterError(
  messages: readonly AdapterToCoreMessage[]
): AdapterErrorMessage | undefined {
  return messages.find(
    (message): message is AdapterErrorMessage => message.type === "adapter.error"
  );
}

function getAdapterTaskGateFailure(
  task: CoreTaskRequest,
  adapterCatalog: AdapterCatalog | undefined
): CoreTaskSnapshot["failure"] | undefined {
  if (!adapterCatalog) {
    return undefined;
  }

  const manifest = adapterCatalog.getAdapter(task.adapterId);
  if (!manifest) {
    return {
      code: "adapter.catalog.unregistered",
      message: `Adapter ${task.adapterId} is not registered in the runtime adapter catalog.`,
      retryable: false
    };
  }

  if (!manifest.runtimeModes.includes(task.mode)) {
    return {
      code: "adapter.catalog.unsupported_mode",
      message: `Adapter ${task.adapterId} does not support ${task.mode} mode.`,
      retryable: false
    };
  }

  const missingCapability = task.capabilitiesRequested.find(
    (capability) => !manifest.capabilities.includes(capability)
  );
  if (missingCapability) {
    return {
      code: "adapter.catalog.capability_missing",
      message: `Adapter ${task.adapterId} does not declare capability ${missingCapability}.`,
      retryable: false
    };
  }

  if (
    task.mode === "fixture" &&
    manifest.fixtureReadiness.status !== "fixture-ready"
  ) {
    return {
      code: "adapter.catalog.fixture_not_ready",
      message: `Adapter ${task.adapterId} is not fixture-ready.`,
      retryable: false
    };
  }

  return undefined;
}
