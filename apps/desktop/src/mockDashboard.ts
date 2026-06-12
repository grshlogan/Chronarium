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

export interface StreamerContext {
  readonly currentSession?: SessionSummary;
  readonly history: readonly SessionSummary[];
  readonly facts: readonly RecordingFact[];
  readonly roomState: "LIVE" | "OFFLINE" | "UNKNOWN";
  readonly summary: {
    readonly frequency: string;
    readonly diskUsage7d: string;
    readonly retention: string;
    readonly lastSummary: string;
    readonly idleLabel: string;
    readonly idleDetail: string;
    readonly writtenSize: string;
    readonly segments: string;
    readonly videoTrack: string;
    readonly audioTrack: string;
  };
}

export interface DashboardViewModel {
  readonly streamers: readonly StreamerSummary[];
  readonly selectedStreamerId: string;
  readonly streamerContexts: Readonly<Record<string, StreamerContext>>;
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
  streamerContexts: {
    luna: {
      roomState: "LIVE",
      currentSession: {
        id: "luna-session-current",
        label: "Recording Now",
        startedAt: "Jun 12, 2026 18:02",
        duration: "01:23:47",
        size: "12.46 GB",
        status: "recording",
        locked: true
      },
      history: [
        {
          id: "luna-session-2026-06-11",
          label: "LunaCeleste Jun 11",
          startedAt: "21:14",
          duration: "04:12:33",
          size: "38.2 GB",
          status: "healthy"
        },
        {
          id: "luna-session-2026-06-10",
          label: "LunaCeleste Jun 10",
          startedAt: "20:57",
          duration: "03:08:21",
          size: "29.8 GB",
          status: "healthy"
        },
        {
          id: "luna-session-2026-06-09",
          label: "LunaCeleste Jun 09",
          startedAt: "22:02",
          duration: "02:47:11",
          size: "18.6 GB",
          status: "partial"
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
      ],
      summary: {
        frequency: "Every stream",
        diskUsage7d: "8.9 TB",
        retention: "1 / 3 / 7 days",
        lastSummary: "12:10:42",
        idleLabel: "LunaCeleste recording",
        idleDetail: "Capture facts are being preserved.",
        writtenSize: "12.46 GB",
        segments: "29",
        videoTrack: "Healthy · 6.0 Mbps",
        audioTrack: "Healthy · 160 kbps"
      }
    },
    aurora: {
      roomState: "LIVE",
      history: [
        {
          id: "aurora-session-2026-06-12",
          label: "AuroraRaven Jun 12",
          startedAt: "11:42",
          duration: "01:02:19",
          size: "8.4 GB",
          status: "healthy"
        }
      ],
      facts: [
        {
          time: "12:23:56",
          label: "AuroraRaven live state confirmed",
          level: "ok"
        },
        {
          time: "12:23:51",
          label: "Waiting for next recording window",
          level: "ok"
        }
      ],
      summary: {
        frequency: "Every stream",
        diskUsage7d: "2.4 TB",
        retention: "1 / 3 days",
        lastSummary: "12:08:13",
        idleLabel: "AuroraRaven monitoring",
        idleDetail: "Live state is visible, but no capture task is active.",
        writtenSize: "0 GB",
        segments: "0",
        videoTrack: "Waiting",
        audioTrack: "Waiting"
      }
    },
    neo: {
      roomState: "LIVE",
      history: [
        {
          id: "neo-session-2026-06-11",
          label: "NeoKitsune Jun 11",
          startedAt: "23:02",
          duration: "00:47:35",
          size: "5.1 GB",
          status: "partial"
        }
      ],
      facts: [
        {
          time: "12:23:21",
          label: "NeoKitsune state check completed",
          level: "ok"
        },
        {
          time: "12:22:58",
          label: "No active capture task",
          level: "ok"
        }
      ],
      summary: {
        frequency: "Every stream",
        diskUsage7d: "1.1 TB",
        retention: "1 day",
        lastSummary: "11:58:44",
        idleLabel: "NeoKitsune monitoring",
        idleDetail: "Monitoring is active and waiting for a capture decision.",
        writtenSize: "0 GB",
        segments: "0",
        videoTrack: "Waiting",
        audioTrack: "Waiting"
      }
    },
    pixel: {
      roomState: "OFFLINE",
      history: [
        {
          id: "pixel-session-2026-06-10",
          label: "PixelPanda Jun 10",
          startedAt: "18:14",
          duration: "02:15:04",
          size: "16.7 GB",
          status: "healthy"
        }
      ],
      facts: [
        {
          time: "12:20:42",
          label: "PixelPanda offline state confirmed",
          level: "ok"
        }
      ],
      summary: {
        frequency: "Every stream",
        diskUsage7d: "920 GB",
        retention: "1 / 3 days",
        lastSummary: "10:22:08",
        idleLabel: "PixelPanda offline",
        idleDetail: "Monitoring is active. Recording will start automatically when live.",
        writtenSize: "0 GB",
        segments: "0",
        videoTrack: "Offline",
        audioTrack: "Offline"
      }
    },
    velvet: {
      roomState: "UNKNOWN",
      history: [
        {
          id: "velvet-session-2026-06-10",
          label: "VelvetMoth Jun 10",
          startedAt: "22:18",
          duration: "03:34:12",
          size: "31.5 GB",
          status: "healthy"
        },
        {
          id: "velvet-session-2026-06-07",
          label: "VelvetMoth Jun 07",
          startedAt: "21:03",
          duration: "02:01:44",
          size: "14.8 GB",
          status: "partial"
        }
      ],
      facts: [
        {
          time: "12:19:11",
          label: "Monitoring paused",
          level: "warn"
        },
        {
          time: "12:18:50",
          label: "Last check skipped by pause state",
          level: "warn"
        }
      ],
      summary: {
        frequency: "Every stream",
        diskUsage7d: "6.4 TB",
        retention: "1 / 3 / 7 days",
        lastSummary: "09:41:30",
        idleLabel: "VelvetMoth idle",
        idleDetail: "Monitoring is paused for this streamer.",
        writtenSize: "0 GB",
        segments: "0",
        videoTrack: "Paused",
        audioTrack: "Paused"
      }
    },
    cyber: {
      roomState: "OFFLINE",
      history: [],
      facts: [
        {
          time: "12:16:03",
          label: "CyberCyan offline state confirmed",
          level: "ok"
        }
      ],
      summary: {
        frequency: "Every stream",
        diskUsage7d: "0 GB",
        retention: "1 day",
        lastSummary: "Never",
        idleLabel: "CyberCyan offline",
        idleDetail: "No archived sessions yet. Monitoring is waiting for a live state.",
        writtenSize: "0 GB",
        segments: "0",
        videoTrack: "Offline",
        audioTrack: "Offline"
      }
    }
  }
};
