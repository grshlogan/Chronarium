import type {
  AdapterCapability,
  AdapterId,
  AdapterRuntimeMode,
  AdapterToCoreMessage,
  ChronariumId,
  TimelineEventEnvelope
} from "@chronarium/types";

export type AdapterLifecycleStatus =
  | "created"
  | "ready"
  | "running"
  | "finished"
  | "failed";

export interface AdapterLifecycleStartRequest {
  readonly adapterId: AdapterId;
  readonly sessionId: ChronariumId;
  readonly mode: AdapterRuntimeMode;
  readonly capabilitiesRequested: readonly AdapterCapability[];
}

export interface AdapterLifecycleSnapshot {
  readonly adapterId: AdapterId;
  readonly sessionId: ChronariumId;
  readonly mode: AdapterRuntimeMode;
  readonly status: AdapterLifecycleStatus;
  readonly capabilities: readonly AdapterCapability[];
  readonly timelineEvents: readonly TimelineEventEnvelope[];
  readonly diagnostics: readonly AdapterToCoreMessage[];
  readonly errors: readonly AdapterToCoreMessage[];
  readonly messageCount: number;
  readonly finishedReason?: string;
}

export interface FixtureAdapterLifecycleHost {
  runFixture(input: {
    readonly request: AdapterLifecycleStartRequest;
    readonly messages: AsyncIterable<AdapterToCoreMessage>;
  }): Promise<AdapterLifecycleSnapshot>;
}

export function createFixtureAdapterLifecycleHost(): FixtureAdapterLifecycleHost {
  return new DefaultFixtureAdapterLifecycleHost();
}

class DefaultFixtureAdapterLifecycleHost implements FixtureAdapterLifecycleHost {
  async runFixture(input: {
    readonly request: AdapterLifecycleStartRequest;
    readonly messages: AsyncIterable<AdapterToCoreMessage>;
  }): Promise<AdapterLifecycleSnapshot> {
    if (input.request.mode !== "fixture") {
      throw new Error("Fixture adapter lifecycle host only supports fixture mode.");
    }

    const state: MutableAdapterLifecycleState = {
      adapterId: input.request.adapterId,
      sessionId: input.request.sessionId,
      mode: input.request.mode,
      status: "created",
      capabilities: [],
      timelineEvents: [],
      diagnostics: [],
      errors: [],
      messageCount: 0
    };

    for await (const message of input.messages) {
      this.assertMessageMatchesRequest(input.request, message);
      state.messageCount += 1;
      this.applyMessage(state, message);
    }

    if (state.status !== "finished" && state.status !== "failed") {
      state.status = "failed";
      state.errors.push({
        protocolVersion: 1,
        messageId: `${state.adapterId}:lifecycle:missing-finished`,
        adapterId: state.adapterId,
        sessionId: state.sessionId,
        type: "adapter.error",
        sentAt: new Date().toISOString(),
        code: "adapter.lifecycle.missing_finished",
        message: "Adapter stream ended without adapter.finished.",
        retryable: true,
        redactionStatus: "safe"
      });
    }

    return freezeState(state);
  }

  private applyMessage(
    state: MutableAdapterLifecycleState,
    message: AdapterToCoreMessage
  ): void {
    switch (message.type) {
      case "adapter.ready":
        state.status = "ready";
        state.capabilities = [...message.capabilities];
        break;
      case "fact.timeline":
        state.status = "running";
        state.timelineEvents.push(message.event);
        break;
      case "diagnostic.event":
        state.diagnostics.push(message);
        break;
      case "adapter.error":
        state.status = "failed";
        state.errors.push(message);
        break;
      case "adapter.finished":
        state.status = message.reason === "failed" ? "failed" : "finished";
        state.finishedReason = message.reason;
        break;
      case "health.pong":
        break;
    }
  }

  private assertMessageMatchesRequest(
    request: AdapterLifecycleStartRequest,
    message: AdapterToCoreMessage
  ): void {
    if (message.adapterId !== request.adapterId) {
      throw new Error(
        `Adapter message adapterId ${message.adapterId} does not match ${request.adapterId}.`
      );
    }

    if (message.sessionId && message.sessionId !== request.sessionId) {
      throw new Error(
        `Adapter message sessionId ${message.sessionId} does not match ${request.sessionId}.`
      );
    }
  }
}

interface MutableAdapterLifecycleState {
  adapterId: AdapterId;
  sessionId: ChronariumId;
  mode: AdapterRuntimeMode;
  status: AdapterLifecycleStatus;
  capabilities: AdapterCapability[];
  timelineEvents: TimelineEventEnvelope[];
  diagnostics: AdapterToCoreMessage[];
  errors: AdapterToCoreMessage[];
  messageCount: number;
  finishedReason?: string;
}

function freezeState(
  state: MutableAdapterLifecycleState
): AdapterLifecycleSnapshot {
  return {
    adapterId: state.adapterId,
    sessionId: state.sessionId,
    mode: state.mode,
    status: state.status,
    capabilities: [...state.capabilities],
    timelineEvents: [...state.timelineEvents],
    diagnostics: [...state.diagnostics],
    errors: [...state.errors],
    messageCount: state.messageCount,
    ...(state.finishedReason ? { finishedReason: state.finishedReason } : {})
  };
}
