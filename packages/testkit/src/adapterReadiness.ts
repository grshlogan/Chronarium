import { parseAdapterToCoreMessageV1 } from "@chronarium/schemas";
import type {
  AdapterCapability,
  AdapterId,
  AdapterToCoreMessage,
  ChronariumId
} from "@chronarium/types";

export interface AdapterFixtureReadinessRequest {
  readonly adapterId: AdapterId;
  readonly sessionId: ChronariumId;
  readonly capabilitiesRequested: readonly AdapterCapability[];
}

export interface AdapterFixtureReadinessInput {
  readonly request: AdapterFixtureReadinessRequest;
  readonly messages: AsyncIterable<unknown>;
}

export interface AdapterFixtureReadinessIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export interface AdapterFixtureReadinessReport {
  readonly ok: boolean;
  readonly adapterId: AdapterId;
  readonly sessionId: ChronariumId;
  readonly capabilities: readonly AdapterCapability[];
  readonly issues: readonly AdapterFixtureReadinessIssue[];
  readonly messageCount: number;
  readonly timelineEventCount: number;
  readonly finishedReason?: string;
}

export async function verifyAdapterFixtureReadiness(
  input: AdapterFixtureReadinessInput
): Promise<AdapterFixtureReadinessReport> {
  const state: MutableAdapterFixtureReadinessState = {
    adapterId: input.request.adapterId,
    sessionId: input.request.sessionId,
    capabilities: [],
    issues: [],
    messageCount: 0,
    timelineEventCount: 0,
    sawReady: false,
    sawFinished: false,
    sawRoomStateFact: false,
    sawChatEventFact: false
  };

  let index = 0;
  for await (const rawMessage of input.messages) {
    const path = `messages[${index}]`;
    state.messageCount += 1;
    scanForUnsafeValues(rawMessage, path, state.issues);

    const message = parseMessage(rawMessage, path, state.issues);
    if (message) {
      applyMessage(input.request, state, message, path);
    }

    index += 1;
  }

  if (!state.sawReady) {
    addIssue(state.issues, {
      code: "adapter_readiness.missing_ready",
      message: "Adapter fixture stream did not emit adapter.ready."
    });
  }

  if (!state.sawFinished) {
    addIssue(state.issues, {
      code: "adapter_readiness.missing_finished",
      message: "Adapter fixture stream did not emit adapter.finished."
    });
  }

  addCapabilityFactUsageIssues(input.request, state);

  return {
    ok: state.issues.length === 0,
    adapterId: state.adapterId,
    sessionId: state.sessionId,
    capabilities: [...state.capabilities],
    issues: [...state.issues],
    messageCount: state.messageCount,
    timelineEventCount: state.timelineEventCount,
    ...(state.finishedReason ? { finishedReason: state.finishedReason } : {})
  };
}

interface MutableAdapterFixtureReadinessState {
  adapterId: AdapterId;
  sessionId: ChronariumId;
  capabilities: AdapterCapability[];
  issues: AdapterFixtureReadinessIssue[];
  messageCount: number;
  timelineEventCount: number;
  sawReady: boolean;
  sawFinished: boolean;
  sawRoomStateFact: boolean;
  sawChatEventFact: boolean;
  finishedReason?: string;
}

function parseMessage(
  rawMessage: unknown,
  path: string,
  issues: AdapterFixtureReadinessIssue[]
): AdapterToCoreMessage | undefined {
  try {
    return parseAdapterToCoreMessageV1(rawMessage);
  } catch (error) {
    addIssue(issues, {
      code: "adapter_readiness.protocol_invalid",
      message:
        error instanceof Error
          ? error.message
          : "Adapter message failed protocol validation.",
      path
    });
    return undefined;
  }
}

function applyMessage(
  request: AdapterFixtureReadinessRequest,
  state: MutableAdapterFixtureReadinessState,
  message: AdapterToCoreMessage,
  path: string
): void {
  if (message.adapterId !== request.adapterId) {
    addIssue(state.issues, {
      code: "adapter_readiness.adapter_mismatch",
      message: `Message adapterId ${message.adapterId} does not match requested adapterId ${request.adapterId}.`,
      path: `${path}.adapterId`
    });
  }

  if (message.sessionId && message.sessionId !== request.sessionId) {
    addIssue(state.issues, {
      code: "adapter_readiness.session_mismatch",
      message: `Message sessionId ${message.sessionId} does not match requested sessionId ${request.sessionId}.`,
      path: `${path}.sessionId`
    });
  }

  if (!state.sawReady && message.type !== "adapter.ready") {
    addIssue(state.issues, {
      code: "adapter_readiness.ready_not_first",
      message: "Adapter fixture stream must emit adapter.ready before other messages.",
      path: `${path}.type`
    });
  }

  if (state.sawFinished) {
    addIssue(state.issues, {
      code: "adapter_readiness.message_after_finished",
      message: "Adapter fixture stream emitted a message after adapter.finished.",
      path: `${path}.type`
    });
  }

  switch (message.type) {
    case "adapter.ready":
      if (state.sawReady) {
        addIssue(state.issues, {
          code: "adapter_readiness.duplicate_ready",
          message: "Adapter fixture stream emitted adapter.ready more than once.",
          path: `${path}.type`
        });
      }
      state.sawReady = true;
      state.capabilities = [...message.capabilities];
      if (message.mode !== "fixture") {
        addIssue(state.issues, {
          code: "adapter_readiness.non_fixture_mode",
          message: `Adapter readiness fixtures must run in fixture mode, received ${message.mode}.`,
          path: `${path}.mode`
        });
      }
      for (const capability of request.capabilitiesRequested) {
        if (!message.capabilities.includes(capability)) {
          addIssue(state.issues, {
            code: "adapter_readiness.capability_missing",
            message: `Adapter ready message did not include requested capability ${capability}.`,
            path: `${path}.capabilities`
          });
        }
      }
      break;
    case "fact.timeline":
      state.timelineEventCount += 1;
      recordTimelineCapabilityUsage(state, message.event.type);
      if (message.event.sessionId !== request.sessionId) {
        addIssue(state.issues, {
          code: "adapter_readiness.timeline_session_mismatch",
          message: `Timeline event sessionId ${message.event.sessionId} does not match requested sessionId ${request.sessionId}.`,
          path: `${path}.event.sessionId`
        });
      }
      break;
    case "adapter.error":
      addIssue(state.issues, {
        code: "adapter_readiness.adapter_error",
        message: `Adapter emitted error ${message.code}: ${message.message}`,
        path
      });
      break;
    case "adapter.finished":
      state.sawFinished = true;
      state.finishedReason = message.reason;
      if (message.reason === "failed") {
        addIssue(state.issues, {
          code: "adapter_readiness.finished_failed",
          message: "Adapter fixture finished with failed reason.",
          path: `${path}.reason`
        });
      }
      break;
    case "diagnostic.event":
    case "health.pong":
      break;
  }
}

function recordTimelineCapabilityUsage(
  state: MutableAdapterFixtureReadinessState,
  eventType: string
): void {
  if (eventType === "room.state.changed") {
    state.sawRoomStateFact = true;
  }

  if (eventType === "chat.message.observed") {
    state.sawChatEventFact = true;
  }
}

function addCapabilityFactUsageIssues(
  request: AdapterFixtureReadinessRequest,
  state: MutableAdapterFixtureReadinessState
): void {
  const declaredOrRequestedCapabilities = new Set<AdapterCapability>([
    ...state.capabilities,
    ...request.capabilitiesRequested
  ]);

  if (
    declaredOrRequestedCapabilities.has("room.state") &&
    !state.sawRoomStateFact
  ) {
    addIssue(state.issues, {
      code: "adapter_readiness.capability_fact_missing",
      message:
        "Adapter fixture declares room.state but emitted no room.state.changed timeline fact.",
      path: "room.state"
    });
  }

  if (
    declaredOrRequestedCapabilities.has("chat.events") &&
    !state.sawChatEventFact
  ) {
    addIssue(state.issues, {
      code: "adapter_readiness.capability_fact_missing",
      message:
        "Adapter fixture declares chat.events but emitted no chat.message.observed timeline fact.",
      path: "chat.events"
    });
  }
}

function scanForUnsafeValues(
  value: unknown,
  path: string,
  issues: AdapterFixtureReadinessIssue[]
): void {
  if (typeof value === "string") {
    scanString(value, path, issues);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanForUnsafeValues(item, `${path}[${index}]`, issues)
    );
    return;
  }

  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) => {
      scanKey(key, `${path}.${key}`, issues);
      if (
        (key === "redactionStatus" || key === "sensitivity") &&
        item === "contains-sensitive"
      ) {
        addIssue(issues, {
          code: "adapter_readiness.contains_sensitive",
          message: `${path}.${key} is marked contains-sensitive.`,
          path: `${path}.${key}`
        });
      }
      scanForUnsafeValues(item, `${path}.${key}`, issues);
    });
  }
}

function scanKey(
  key: string,
  path: string,
  issues: AdapterFixtureReadinessIssue[]
): void {
  const forbiddenKeyPatterns = [
    /^cookie$/i,
    /^authorization$/i,
    /^proxy-authorization$/i,
    /^bearer$/i,
    /token/i,
    /signature/i,
    /signed[_-]?url/i
  ];

  if (forbiddenKeyPatterns.some((pattern) => pattern.test(key))) {
    addIssue(issues, {
      code: "adapter_readiness.secret_reference",
      message: "Adapter fixture messages must not contain secret-looking fields.",
      path
    });
  }
}

function scanString(
  value: string,
  path: string,
  issues: AdapterFixtureReadinessIssue[]
): void {
  const lowerValue = value.toLowerCase();

  if (lowerValue.startsWith("http://") || lowerValue.startsWith("https://")) {
    addIssue(issues, {
      code: "adapter_readiness.network_reference",
      message: "Adapter fixture messages must not contain raw network URLs.",
      path
    });
  }

  const forbiddenPatterns = [
    /\bcookie\b/i,
    /\bauthorization\b/i,
    /\bbearer\b/i,
    /token=/i,
    /session=/i,
    /signature=/i,
    /signed[_-]?url/i
  ];

  if (forbiddenPatterns.some((pattern) => pattern.test(value))) {
    addIssue(issues, {
      code: "adapter_readiness.secret_reference",
      message: "Adapter fixture messages must not contain secret-looking values.",
      path
    });
  }
}

function addIssue(
  issues: AdapterFixtureReadinessIssue[],
  issue: AdapterFixtureReadinessIssue
): void {
  issues.push(issue);
}
