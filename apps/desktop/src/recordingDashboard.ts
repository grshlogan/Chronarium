import { dashboardViewModel, type DashboardViewModel } from "./mockDashboard.js";

export type OfflineFixtureCaptureDemoStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed";

export interface OfflineFixtureCaptureDemo {
  readonly status: OfflineFixtureCaptureDemoStatus;
  readonly archiveLabel?: string;
  readonly factLabel?: string;
  readonly timelineEventCount?: number;
  readonly errorMessage?: string;
}

export interface RecordingDashboardState extends DashboardViewModel {
  readonly offlineFixtureCapture: OfflineFixtureCaptureDemo;
}

export type RecordingDashboardAction =
  | {
      readonly type: "offlineFixtureCapture.started";
    }
  | {
      readonly type: "offlineFixtureCapture.completed";
      readonly archiveLabel: string;
      readonly factLabel: string;
      readonly timelineEventCount: number;
    }
  | {
      readonly type: "offlineFixtureCapture.failed";
      readonly errorMessage: string;
    };

export function createInitialRecordingDashboard(): RecordingDashboardState {
  return {
    ...dashboardViewModel,
    offlineFixtureCapture: {
      status: "idle"
    }
  };
}

export function reduceRecordingDashboard(
  state: RecordingDashboardState,
  action: RecordingDashboardAction
): RecordingDashboardState {
  switch (action.type) {
    case "offlineFixtureCapture.started":
      return {
        ...state,
        offlineFixtureCapture: {
          status: "running"
        }
      };
    case "offlineFixtureCapture.completed":
      return {
        ...state,
        offlineFixtureCapture: {
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
            id: "synthetic-fixture-capture",
            label: action.archiveLabel,
            startedAt: "demo",
            duration: "00:00:03",
            size: "synthetic",
            status: "healthy"
          },
          ...state.history
        ]
      };
    case "offlineFixtureCapture.failed":
      return {
        ...state,
        offlineFixtureCapture: {
          status: "failed",
          errorMessage: action.errorMessage
        }
      };
  }
}

export async function runOfflineFixtureCaptureDemo(): Promise<RecordingDashboardAction> {
  await Promise.resolve();

  return {
    type: "offlineFixtureCapture.completed",
    archiveLabel: "Synthetic archive written",
    factLabel: "Fixture capture completed",
    timelineEventCount: 3
  };
}
