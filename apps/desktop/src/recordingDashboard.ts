import {
  dashboardViewModel,
  type DashboardViewModel,
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

export interface RecordingDashboardState extends DashboardViewModel {
  readonly offlineSelfTest: OfflineSelfTest;
}

export type RecordingDashboardAction =
  | {
      readonly type: "streamer.select";
      readonly streamerId: string;
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
    }
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
    case "monitoring.pauseSelected":
      return {
        ...state,
        streamers: updateSelectedStreamer(state, {
          monitoringState: "paused",
          captureState: "waiting"
        }),
        facts: [
          {
            time: "now",
            label: "Monitoring paused",
            level: "warn"
          },
          ...state.facts
        ]
      };
    case "monitoring.resumeSelected":
      return {
        ...state,
        streamers: updateSelectedStreamer(state, {
          monitoringState: "active"
        }),
        facts: [
          {
            time: "now",
            label: "Monitoring resumed",
            level: "ok"
          },
          ...state.facts
        ]
      };
    case "monitoring.checkNow":
      return {
        ...state,
        streamers: updateSelectedStreamer(state, {
          lastCheck: "now"
        }),
        facts: [
          {
            time: "now",
            label: "Manual state check queued",
            level: "ok"
          },
          ...state.facts
        ]
      };
    case "offlineSelfTest.started":
      return {
        ...state,
        offlineSelfTest: {
          status: "running"
        }
      };
    case "offlineSelfTest.completed":
      return {
        ...state,
        offlineSelfTest: {
          status: "completed",
          archiveLabel: action.archiveLabel,
          factLabel: action.factLabel,
          timelineEventCount: action.timelineEventCount
        },
        facts: [
          {
            time: "now",
            label: action.factLabel,
            level: "ok"
          },
          ...state.facts
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
          ...state.history
        ]
      };
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
