import type {
  AdapterCapability,
  AdapterId,
  AdapterRuntimeMode,
  ChronariumId,
  IsoDateTimeString,
  RecordingIntent
} from "@chronarium/types";

export type CoreTaskKind = "capture";

export type CoreTaskStatus =
  | "created"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "failed";

export interface CoreTaskRequest {
  readonly taskId: ChronariumId;
  readonly kind: CoreTaskKind;
  readonly sessionId: ChronariumId;
  readonly adapterId: AdapterId;
  readonly mode: AdapterRuntimeMode;
  readonly capabilitiesRequested: readonly AdapterCapability[];
  readonly recordingIntent?: RecordingIntent;
  readonly streamerRef?: string;
}

export interface CoreTaskSnapshot extends CoreTaskRequest {
  readonly status: CoreTaskStatus;
  readonly createdAt: IsoDateTimeString;
  readonly updatedAt: IsoDateTimeString;
  readonly startedAt?: IsoDateTimeString;
  readonly stoppedAt?: IsoDateTimeString;
  readonly stoppedReason?: string;
  readonly failure?: {
    readonly code: string;
    readonly message: string;
    readonly retryable: boolean;
  };
}

export interface CoreTaskScheduler {
  createTask(request: CoreTaskRequest): CoreTaskSnapshot;
  startTask(taskId: ChronariumId): CoreTaskSnapshot;
  stopTask(taskId: ChronariumId, reason: string): CoreTaskSnapshot;
  failTask(
    taskId: ChronariumId,
    failure: CoreTaskSnapshot["failure"]
  ): CoreTaskSnapshot;
  getTask(taskId: ChronariumId): CoreTaskSnapshot;
  listTasks(): readonly CoreTaskSnapshot[];
}
