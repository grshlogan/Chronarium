import {
  dashboardViewModel,
  type DashboardViewModel,
  type RecordingFact,
  type SessionSummary,
  type StreamerContext,
  type StreamerSummary
} from "./mockDashboard.js";

export type OfflineSelfTestStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface OfflineSelfTest {
  readonly status: OfflineSelfTestStatus;
  readonly archiveLabel?: string;
  readonly factLabel?: string;
  readonly timelineEventCount?: number;
  readonly errorMessage?: string;
}

export interface AddStreamerForm {
  readonly value: string;
  readonly error?: string;
  readonly message?: string;
}

export interface MonitoringFeedback {
  readonly message: string;
  readonly tone: "neutral" | "success" | "warning";
}

export type RecordingIntent = "public" | "ticket" | "private" | "spy";

export interface MockCredentialProfile {
  readonly id: string;
  readonly label: string;
  readonly accountHint: string;
  readonly addedAt: string;
  readonly health: "ok" | "expired" | "revoked";
  readonly intents: readonly Exclude<RecordingIntent, "public">[];
}

export interface StreamerCredentialBindingView {
  readonly recordingIntent: RecordingIntent;
  readonly boundProfileIds: readonly string[];
  readonly defaultProfileId?: string;
  readonly message: string;
}

export interface RecordingDashboardState extends DashboardViewModel {
  readonly offlineSelfTest: OfflineSelfTest;
  readonly addStreamerForm: AddStreamerForm;
  readonly monitoringFeedback: MonitoringFeedback;
  readonly credentialProfiles: readonly MockCredentialProfile[];
  readonly credentialBindings: Readonly<
    Record<string, StreamerCredentialBindingView>
  >;
}

export type RecordingDashboardAction =
  | {
      readonly type: "streamer.select";
      readonly streamerId: string;
    }
  | {
      readonly type: "streamerLink.inputChanged";
      readonly value: string;
    }
  | {
      readonly type: "streamerLink.submit";
    }
  | {
      readonly type: "monitoring.pauseSelected";
    }
  | {
      readonly type: "monitoring.resumeSelected";
    }
  | {
      readonly type: "monitoring.checkNow";
    }
  | {
      readonly type: "credential.profileSelected";
      readonly profileId: string;
    }
  | {
      readonly type: "credential.profileRemoved";
      readonly profileId: string;
    }
  | {
      readonly type: "credential.intentSelected";
      readonly intent: RecordingIntent;
    }
  | {
      readonly type: "offlineSelfTest.started";
    }
  | {
      readonly type: "offlineSelfTest.completed";
      readonly archiveLabel: string;
      readonly factLabel: string;
      readonly timelineEventCount: number;
    }
  | {
      readonly type: "offlineSelfTest.failed";
      readonly errorMessage: string;
    };

export function createInitialRecordingDashboard(): RecordingDashboardState {
  return {
    ...dashboardViewModel,
    offlineSelfTest: {
      status: "idle"
    },
    addStreamerForm: {
      value: ""
    },
    monitoringFeedback: {
      message: "Monitoring is ready.",
      tone: "neutral"
    },
    credentialProfiles: createMockCredentialProfiles(),
    credentialBindings: createInitialCredentialBindings()
  };
}

export function reduceRecordingDashboard(
  state: RecordingDashboardState,
  action: RecordingDashboardAction
): RecordingDashboardState {
  switch (action.type) {
    case "streamer.select":
      if (
        !state.streamers.some((streamer) => streamer.id === action.streamerId)
      ) {
        return state;
      }

      return {
        ...state,
        selectedStreamerId: action.streamerId
      };
    case "streamerLink.inputChanged":
      return {
        ...state,
        addStreamerForm: {
          value: action.value
        }
      };
    case "streamerLink.submit": {
      const parsedLink = parseSyntheticStreamerLink(state.addStreamerForm.value);

      if (!parsedLink) {
        return {
          ...state,
          addStreamerForm: {
            value: state.addStreamerForm.value,
            error: "Enter a supported synthetic streamer URL."
          }
        };
      }

      return {
        ...state,
        selectedStreamerId: parsedLink.id,
        streamers: [
          ...state.streamers,
          {
            id: parsedLink.id,
            name: parsedLink.name,
            site: parsedLink.site,
            status: "offline",
            monitoringState: "active",
            captureState: "waiting",
            showMode: "timedTicket",
            mediaStreamState: "notRecording",
            informationStreamState: "notRecording",
            lastCheck: "never",
            retentionDays: 3
          }
        ],
        streamerContexts: {
          ...state.streamerContexts,
          [parsedLink.id]: createSyntheticStreamerContext(parsedLink.name)
        },
        addStreamerForm: {
          value: "",
          message: `Added ${parsedLink.name} to monitoring.`
        }
      };
    }
    case "monitoring.pauseSelected":
      return {
        ...state,
        streamers: updateSelectedStreamer(state, {
          monitoringState: "paused",
          captureState: "waiting"
        }),
        streamerContexts: updateSelectedStreamerContext(state, {
          roomState: "UNKNOWN",
          currentSession: null,
          facts: [
            {
              time: "now",
              label: "Monitoring paused",
              level: "warn"
            },
            ...getSelectedStreamerContext(state).facts
          ]
        }),
        monitoringFeedback: {
          message: `Monitoring paused for ${getSelectedStreamer(state).name}.`,
          tone: "warning"
        }
      };
    case "monitoring.resumeSelected":
      return {
        ...state,
        streamers: updateSelectedStreamer(state, {
          monitoringState: "active"
        }),
        streamerContexts: updateSelectedStreamerContext(state, {
          facts: [
            {
              time: "now",
              label: "Monitoring resumed",
              level: "ok"
            },
            ...getSelectedStreamerContext(state).facts
          ]
        }),
        monitoringFeedback: {
          message: `Monitoring resumed for ${getSelectedStreamer(state).name}.`,
          tone: "success"
        }
      };
    case "monitoring.checkNow":
      return {
        ...state,
        streamers: updateSelectedStreamer(state, {
          lastCheck: "now"
        }),
        streamerContexts: updateSelectedStreamerContext(state, {
          facts: [
            {
              time: "now",
              label: "Manual state check queued",
              level: "ok"
            },
            ...getSelectedStreamerContext(state).facts
          ]
        }),
        monitoringFeedback: {
          message: `Manual check queued for ${getSelectedStreamer(state).name}.`,
          tone: "success"
        }
      };
    case "credential.profileSelected":
      return updateSelectedCredentialBinding(state, (binding) => ({
        ...binding,
        boundProfileIds: Array.from(
          new Set([...binding.boundProfileIds, action.profileId])
        )
      }));
    case "credential.profileRemoved":
      return updateSelectedCredentialBinding(state, (binding) => ({
        ...binding,
        boundProfileIds: binding.boundProfileIds.filter(
          (profileId) => profileId !== action.profileId
        )
      }));
    case "credential.intentSelected":
      return updateSelectedCredentialBinding(state, (binding) => ({
        ...binding,
        recordingIntent: action.intent
      }));
    case "offlineSelfTest.started":
      return {
        ...state,
        offlineSelfTest: {
          status: "running"
        }
      };
    case "offlineSelfTest.completed": {
      const selectedContext = getSelectedStreamerContext(state);

      return {
        ...state,
        offlineSelfTest: {
          status: "completed",
          archiveLabel: action.archiveLabel,
          factLabel: action.factLabel,
          timelineEventCount: action.timelineEventCount
        },
        streamerContexts: updateSelectedStreamerContext(state, {
          facts: [
            {
              time: "now",
              label: action.factLabel,
              level: "ok"
            },
            ...selectedContext.facts
          ],
          history: [
            {
              id: "synthetic-offline-self-test",
              label: action.archiveLabel,
              startedAt: "demo",
              duration: "00:00:03",
              size: "synthetic",
              status: "healthy"
            },
            ...selectedContext.history
          ]
        })
      };
    }
    case "offlineSelfTest.failed":
      return {
        ...state,
        offlineSelfTest: {
          status: "failed",
          errorMessage: action.errorMessage
        }
      };
  }
}

export async function runOfflineSelfTestDemo(): Promise<RecordingDashboardAction> {
  await Promise.resolve();

  return {
    type: "offlineSelfTest.completed",
    archiveLabel: "Synthetic archive validated",
    factLabel: "Offline self-test completed",
    timelineEventCount: 3
  };
}

export function getSelectedStreamer(
  dashboard: RecordingDashboardState
): StreamerSummary {
  const selectedStreamer = dashboard.streamers.find(
    (streamer) => streamer.id === dashboard.selectedStreamerId
  );

  if (selectedStreamer === undefined) {
    throw new Error("Selected streamer is missing from the dashboard view model.");
  }

  return selectedStreamer;
}

export function getSelectedStreamerContext(
  dashboard: RecordingDashboardState
): StreamerContext {
  const context = dashboard.streamerContexts[dashboard.selectedStreamerId];

  if (context === undefined) {
    throw new Error("Selected streamer context is missing from the dashboard.");
  }

  return context;
}

function updateSelectedStreamer(
  state: RecordingDashboardState,
  patch: Partial<StreamerSummary>
): readonly StreamerSummary[] {
  return state.streamers.map((streamer) =>
    streamer.id === state.selectedStreamerId
      ? {
          ...streamer,
          ...patch
        }
      : streamer
  );
}

function updateSelectedStreamerContext(
  state: RecordingDashboardState,
  patch: StreamerContextPatch
): RecordingDashboardState["streamerContexts"] {
  const selectedContext = getSelectedStreamerContext(state);
  const { currentSession, ...restPatch } = patch;
  const nextContext =
    currentSession === null
      ? omitCurrentSession({
          ...selectedContext,
          ...restPatch
        })
      : {
          ...selectedContext,
          ...restPatch,
          ...(currentSession === undefined ? {} : { currentSession })
        };

  return {
    ...state.streamerContexts,
    [state.selectedStreamerId]: nextContext
  };
}

type StreamerContextPatch = Partial<Omit<StreamerContext, "currentSession">> & {
  readonly currentSession?: SessionSummary | null;
};

function updateSelectedCredentialBinding(
  state: RecordingDashboardState,
  update: (
    binding: StreamerCredentialBindingView
  ) => StreamerCredentialBindingView
): RecordingDashboardState {
  const currentBinding = getCredentialBindingForStreamer(
    state,
    state.selectedStreamerId
  );
  const nextBinding = withCredentialBindingDerivedState(
    update(currentBinding),
    state.credentialProfiles
  );

  return {
    ...state,
    credentialBindings: {
      ...state.credentialBindings,
      [state.selectedStreamerId]: nextBinding
    }
  };
}

function getCredentialBindingForStreamer(
  state: RecordingDashboardState,
  streamerId: string
): StreamerCredentialBindingView {
  return (
    state.credentialBindings[streamerId] ??
    withCredentialBindingDerivedState(
      {
        recordingIntent: "public",
        boundProfileIds: [],
        message: ""
      },
      state.credentialProfiles
    )
  );
}

function withCredentialBindingDerivedState(
  binding: StreamerCredentialBindingView,
  profiles: readonly MockCredentialProfile[]
): StreamerCredentialBindingView {
  const usableProfiles = binding.boundProfileIds
    .map((profileId) => profiles.find((profile) => profile.id === profileId))
    .filter((profile): profile is MockCredentialProfile => profile !== undefined)
    .filter((profile) => profile.health === "ok")
    .filter((profile) =>
      binding.recordingIntent === "public"
        ? false
        : profile.intents.includes(binding.recordingIntent)
    )
    .sort((left, right) => left.addedAt.localeCompare(right.addedAt));
  const defaultProfile = usableProfiles[0];
  const message = describeCredentialBinding(binding.recordingIntent, defaultProfile);
  const baseBinding = {
    recordingIntent: binding.recordingIntent,
    boundProfileIds: binding.boundProfileIds,
    message
  };

  return defaultProfile === undefined
    ? baseBinding
    : {
        ...baseBinding,
        defaultProfileId: defaultProfile.id
      };
}

function describeCredentialBinding(
  intent: RecordingIntent,
  defaultProfile: MockCredentialProfile | undefined
): string {
  if (intent === "public") {
    return "Public recording does not need a Cookie.";
  }

  if (defaultProfile === undefined) {
    return "No usable bound Cookie. This gated intent degrades to no-cookie public recording.";
  }

  return `Using default Cookie: ${defaultProfile.label}.`;
}

function createMockCredentialProfiles(): readonly MockCredentialProfile[] {
  return [
    {
      id: "cred-luna-main",
      label: "Main public account",
      accountHint: "lu***@synthetic",
      addedAt: "2026-01-03T00:00:00.000Z",
      health: "ok",
      intents: ["ticket", "private"]
    },
    {
      id: "cred-luna-ticket",
      label: "Ticket backup",
      accountHint: "ti***@synthetic",
      addedAt: "2026-02-12T00:00:00.000Z",
      health: "ok",
      intents: ["ticket"]
    },
    {
      id: "cred-shared-expired",
      label: "Expired shared account",
      accountHint: "ex***@synthetic",
      addedAt: "2025-12-01T00:00:00.000Z",
      health: "expired",
      intents: ["ticket", "private", "spy"]
    }
  ];
}

function createInitialCredentialBindings(): Readonly<
  Record<string, StreamerCredentialBindingView>
> {
  const profiles = createMockCredentialProfiles();
  const binding = withCredentialBindingDerivedState(
    {
      recordingIntent: "ticket",
      boundProfileIds: [
        "cred-luna-main",
        "cred-luna-ticket",
        "cred-shared-expired"
      ],
      message: ""
    },
    profiles
  );

  return {
    luna: binding
  };
}

interface SyntheticStreamerLink {
  readonly id: string;
  readonly site: "CB" | "SC";
  readonly name: string;
}

function parseSyntheticStreamerLink(value: string): SyntheticStreamerLink | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.search !== "" || url.hash !== "") {
    return null;
  }

  const name = url.pathname.replace(/^\/+|\/+$/g, "");
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,31}$/.test(name)) {
    return null;
  }

  if (url.hostname === "chaturbate.com") {
    return {
      id: `cb-${toSyntheticId(name)}`,
      site: "CB",
      name
    };
  }

  if (url.hostname === "stripchat.com") {
    return {
      id: `sc-${toSyntheticId(name)}`,
      site: "SC",
      name
    };
  }

  return null;
}

function createSyntheticStreamerContext(name: string): StreamerContext {
  return {
    roomState: "OFFLINE",
    history: [],
    facts: [
      {
        time: "now",
        label: `${name} added from synthetic link`,
        level: "ok"
      }
    ],
    summary: {
      frequency: "Every stream",
      diskUsage7d: "0 GB",
      retention: "3 days",
      lastSummary: "Never",
      idleLabel: `${name} monitoring`,
      idleDetail: "Monitoring is active. Recording will start automatically when live.",
      writtenSize: "0 GB",
      segments: "0",
      videoTrack: "Waiting",
      audioTrack: "Waiting"
    }
  };
}

function toSyntheticId(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}

function omitCurrentSession(
  context: Omit<StreamerContext, "currentSession"> & {
    readonly currentSession?: SessionSummary | null;
  }
): StreamerContext {
  const { currentSession: _currentSession, ...withoutCurrentSession } = context;

  return withoutCurrentSession;
}
