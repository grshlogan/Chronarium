export interface StreamerSummary {
  readonly id: string;
  readonly name: string;
  readonly site: string;
  readonly status: "online" | "offline";
  readonly monitoringState: "active" | "paused";
  readonly captureState: "recording" | "waiting";
  readonly lastCheck: string;
  readonly retentionDays: 1 | 3 | 7;
}

export interface SessionSummary {
  readonly id: string;
  readonly label: string;
  readonly startedAt: string;
  readonly duration: string;
  readonly size: string;
  readonly status: "recording" | "healthy" | "partial";
  readonly locked?: boolean;
}

export interface RecordingFact {
  readonly time: string;
  readonly label: string;
  readonly level: "ok" | "warn";
}

export interface DashboardViewModel {
  readonly streamers: readonly StreamerSummary[];
  readonly selectedStreamerId: string;
  readonly currentSession: SessionSummary;
  readonly history: readonly SessionSummary[];
  readonly facts: readonly RecordingFact[];
}

export const dashboardViewModel: DashboardViewModel = {
  selectedStreamerId: "luna",
  streamers: [
    {
      id: "luna",
      name: "LunaCeleste",
      site: "CB",
      status: "online",
      monitoringState: "active",
      captureState: "recording",
      lastCheck: "12:24:18",
      retentionDays: 7
    },
    {
      id: "aurora",
      name: "AuroraRaven",
      site: "CB",
      status: "online",
      monitoringState: "active",
      captureState: "waiting",
      lastCheck: "12:23:56",
      retentionDays: 3
    },
    {
      id: "neo",
      name: "NeoKitsune",
      site: "CB",
      status: "online",
      monitoringState: "active",
      captureState: "waiting",
      lastCheck: "12:23:21",
      retentionDays: 1
    },
    {
      id: "pixel",
      name: "PixelPanda",
      site: "CB",
      status: "offline",
      monitoringState: "active",
      captureState: "waiting",
      lastCheck: "12:20:42",
      retentionDays: 3
    },
    {
      id: "velvet",
      name: "VelvetMoth",
      site: "CB",
      status: "online",
      monitoringState: "paused",
      captureState: "waiting",
      lastCheck: "12:19:11",
      retentionDays: 7
    },
    {
      id: "cyber",
      name: "CyberCyan",
      site: "CB",
      status: "offline",
      monitoringState: "active",
      captureState: "waiting",
      lastCheck: "12:16:03",
      retentionDays: 1
    }
  ],
  currentSession: {
    id: "session-current",
    label: "Recording Now",
    startedAt: "Jun 12, 2026 18:02",
    duration: "01:23:47",
    size: "12.46 GB",
    status: "recording",
    locked: true
  },
  history: [
    {
      id: "session-2026-06-11",
      label: "Jun 11, 2026",
      startedAt: "21:14",
      duration: "04:12:33",
      size: "38.2 GB",
      status: "healthy"
    },
    {
      id: "session-2026-06-10",
      label: "Jun 10, 2026",
      startedAt: "20:57",
      duration: "03:08:21",
      size: "29.8 GB",
      status: "healthy"
    },
    {
      id: "session-2026-06-09",
      label: "Jun 09, 2026",
      startedAt: "22:02",
      duration: "02:47:11",
      size: "18.6 GB",
      status: "partial"
    },
    {
      id: "session-2026-06-08",
      label: "Jun 08, 2026",
      startedAt: "19:44",
      duration: "05:21:09",
      size: "44.1 GB",
      status: "healthy"
    }
  ],
  facts: [
    {
      time: "18:42:02",
      label: "Recording segment appended",
      level: "ok"
    },
    {
      time: "18:41:59",
      label: "Audio track heartbeat healthy",
      level: "ok"
    },
    {
      time: "18:41:41",
      label: "Video bitrate drift above baseline",
      level: "warn"
    },
    {
      time: "18:41:12",
      label: "Room state confirmed public",
      level: "ok"
    }
  ]
};
