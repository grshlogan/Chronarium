import { useState, type ReactElement } from "react";
import {
  createInitialRecordingDashboard,
  getSelectedStreamer,
  getSelectedStreamerContext,
  reduceRecordingDashboard,
  runOfflineSelfTestDemo,
  type RecordingDashboardState
} from "./recordingDashboard.js";

export interface AppProps {
  readonly dashboard?: RecordingDashboardState;
}

export function App(props: AppProps = {}): ReactElement {
  const [interactiveDashboard, setInteractiveDashboard] = useState(
    () => props.dashboard ?? createInitialRecordingDashboard()
  );
  const dashboard = props.dashboard ?? interactiveDashboard;
  const selectedStreamer = getSelectedStreamer(dashboard);
  const selectedContext = getSelectedStreamerContext(dashboard);
  const currentSession = selectedContext.currentSession;
  const selectedMonitoringPaused =
    selectedStreamer.monitoringState === "paused";

  const dispatchDashboardAction = (
    action: Parameters<typeof reduceRecordingDashboard>[1]
  ): void => {
    setInteractiveDashboard((current) =>
      reduceRecordingDashboard(current, action)
    );
  };

  const runSelfTest = async (): Promise<void> => {
    setInteractiveDashboard((current) =>
      reduceRecordingDashboard(current, {
        type: "offlineSelfTest.started"
      })
    );

    try {
      const action = await runOfflineSelfTestDemo();
      setInteractiveDashboard((current) =>
        reduceRecordingDashboard(current, action)
      );
    } catch (error) {
      setInteractiveDashboard((current) =>
        reduceRecordingDashboard(current, {
          type: "offlineSelfTest.failed",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Offline self-test failed."
        })
      );
    }
  };

  return (
    <main className="app-shell">
      <aside className="streamer-rail" aria-label="Managed streamers">
        <header className="brand-row">
          <div>
            <p className="eyebrow">Chronarium</p>
            <h1>Maintained streamers</h1>
          </div>
          <button className="icon-button" type="button" aria-label="Add streamer link">
            +
          </button>
        </header>
        <button className="add-link" type="button">
          Add streamer link
        </button>
        <section className="streamer-list">
          {dashboard.streamers.map((streamer) => (
            <button
              className={
                streamer.id === selectedStreamer.id
                  ? "streamer-card selected"
                  : "streamer-card"
              }
              key={streamer.id}
              type="button"
              onClick={() => {
                dispatchDashboardAction({
                  type: "streamer.select",
                  streamerId: streamer.id
                });
              }}
            >
              <div className="avatar" aria-hidden="true">
                {streamer.name.slice(0, 1)}
              </div>
              <div className="streamer-identity">
                <strong>{streamer.name}</strong>
                <span className="site-code">{streamer.site}</span>
                <small className="last-check">Last check {streamer.lastCheck}</small>
              </div>
              <div
                className="streamer-status-board"
                aria-label={`${streamer.name} recording decision status`}
              >
                <span
                  className={`status-cell availability ${streamer.status}`}
                  title={describeAvailability(streamer)}
                >
                  {formatAvailability(streamer)}
                </span>
                <span
                  className="status-cell show-mode"
                  title={`票房/秀类型：${formatShowMode(streamer)}`}
                >
                  {formatShowMode(streamer)}
                </span>
                <span className="stream-state-row">
                  <span
                    className={`status-cell stream-state media-stream ${
                      streamer.mediaStreamState === "recording"
                        ? "recording"
                        : "idle"
                    }`}
                    title={describeMediaStreamState(streamer)}
                  >
                    {formatMediaStreamState(streamer)}
                  </span>
                  <span
                    className={`status-cell stream-state information-stream ${
                      streamer.informationStreamState === "recording"
                        ? "recording"
                        : "idle"
                    }`}
                    title={describeInformationStreamState(streamer)}
                  >
                    {formatInformationStreamState(streamer)}
                  </span>
                </span>
              </div>
            </button>
          ))}
        </section>
        <section className="global-info">
          <h2>Global information</h2>
          <dl>
            <div>
              <dt>Disk remaining</dt>
              <dd>2.48 TB</dd>
            </div>
            <div>
              <dt>Active recordings</dt>
              <dd>3</dd>
            </div>
            <div>
              <dt>Queue</dt>
              <dd>1 pending</dd>
            </div>
            <div>
              <dt>Core health</dt>
              <dd className="good">Healthy</dd>
            </div>
          </dl>
          <p>Retention: 1d 1.6 TB · 3d 4.2 TB · 7d 8.9 TB</p>
        </section>
      </aside>

      <section className="workspace" aria-label="Selected streamer workspace">
        <header className="workspace-header">
          <div className="avatar large" aria-hidden="true">
            {selectedStreamer.name.slice(0, 1)}
          </div>
          <div>
            <p className="eyebrow">Selected streamer</p>
            <h2>{selectedStreamer.name}</h2>
            <span className="status-pill">{formatAvailability(selectedStreamer)}</span>
          </div>
          <div className="header-actions">
            <span className="recording-pill">
              {formatSelectedCaptureState(selectedStreamer)}
            </span>
            <span className="safe-pill">Privacy safe</span>
          </div>
        </header>

        <section className="monitoring-controls" aria-label="Monitoring controls">
          <div>
            <p className="eyebrow">Monitoring controls</p>
            <h2>{selectedMonitoringPaused ? "Monitoring paused" : "Monitoring active"}</h2>
            <p>
              Streamer links are maintained automatically. Recording starts when
              a monitored streamer is detected live.
            </p>
          </div>
          <div className="control-buttons">
            <button
              className="control-button"
              type="button"
              disabled={selectedMonitoringPaused}
              onClick={() => {
                dispatchDashboardAction({
                  type: "monitoring.pauseSelected"
                });
              }}
            >
              Pause monitoring
            </button>
            <button
              className="control-button"
              type="button"
              disabled={!selectedMonitoringPaused}
              onClick={() => {
                dispatchDashboardAction({
                  type: "monitoring.resumeSelected"
                });
              }}
            >
              Resume monitoring
            </button>
            <button
              className="control-button primary"
              type="button"
              onClick={() => {
                dispatchDashboardAction({
                  type: "monitoring.checkNow"
                });
              }}
            >
              Check now
            </button>
          </div>
        </section>

        <section className="main-surface">
          <div className="capture-metrics">
            <span>Room state: {selectedContext.roomState}</span>
            <span>Monitor: {selectedMonitoringPaused ? "Paused" : "Active"}</span>
            <span>Auto capture: {formatSelectedCaptureState(selectedStreamer)}</span>
          </div>
          <div className="preview-disabled">
            <div className="preview-icon" aria-hidden="true" />
            <h3>
              {currentSession === undefined
                ? selectedContext.summary.idleLabel
                : "Preview disabled during recording"}
            </h3>
            <p>
              {currentSession === undefined
                ? selectedContext.summary.idleDetail
                : "Capture facts are being preserved. A future delayed preview can use a separate optional surface."}
            </p>
          </div>
        </section>

        <section className="recording-detail">
          <div>
            <p className="eyebrow">Recording information</p>
            <h2>{currentSession?.duration ?? "No current recording"}</h2>
            <dl className="metric-grid">
              <div>
                <dt>Written size</dt>
                <dd>{selectedContext.summary.writtenSize}</dd>
              </div>
              <div>
                <dt>Segments</dt>
                <dd>{selectedContext.summary.segments}</dd>
              </div>
              <div>
                <dt>Video track</dt>
                <dd className={currentSession === undefined ? "warn" : "good"}>
                  {selectedContext.summary.videoTrack}
                </dd>
              </div>
              <div>
                <dt>Audio track</dt>
                <dd className={currentSession === undefined ? "warn" : "good"}>
                  {selectedContext.summary.audioTrack}
                </dd>
              </div>
            </dl>
          </div>
          <div className="facts-panel">
            <h3>Latest facts</h3>
            <ol>
              {selectedContext.facts.map((fact) => (
                <li className={fact.level} key={`${fact.time}-${fact.label}`}>
                  <span>{fact.label}</span>
                  <time>{fact.time}</time>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="offline-capture-panel" aria-label="Offline self-test">
          <div>
            <p className="eyebrow">Maintenance diagnostics</p>
            <h2>{formatSelfTestStatus(dashboard.offlineSelfTest.status)}</h2>
            <p>{describeSelfTest(dashboard)}</p>
          </div>
          <button
            className="run-capture"
            type="button"
            disabled={dashboard.offlineSelfTest.status === "running"}
            onClick={() => {
              void runSelfTest();
            }}
          >
            Run offline self-test
          </button>
        </section>
      </section>

      <aside className="history-rail" aria-label="Selected streamer history">
        {currentSession === undefined ? (
          <section className="pinned-session idle-session">
            <p className="eyebrow">Current session</p>
            <h2>No current recording</h2>
            <span className="lock">Waiting</span>
            <p>{selectedContext.summary.idleDetail}</p>
          </section>
        ) : (
          <section className="pinned-session">
            <p className="eyebrow">Current session (pinned)</p>
            <h2>{currentSession.label}</h2>
            <span className="lock">Locked at top</span>
            <dl>
              <div>
                <dt>Started</dt>
                <dd>{currentSession.startedAt}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{currentSession.duration}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{currentSession.size}</dd>
              </div>
            </dl>
          </section>
        )}

        <section className="history-list">
          <h2>History</h2>
          {selectedContext.history.length === 0 ? (
            <p className="empty-history">No sessions archived yet.</p>
          ) : (
            selectedContext.history.map((session) => (
              <article className="history-row" key={session.id}>
                <div>
                  <strong>{session.label}</strong>
                  <span>{session.startedAt}</span>
                </div>
                <div>
                  <span>{session.duration}</span>
                  <b className={session.status}>{session.status}</b>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="streamer-info">
          <h2>Selected streamer info</h2>
          <dl>
            <div>
              <dt>Frequency</dt>
              <dd>{selectedContext.summary.frequency}</dd>
            </div>
            <div>
              <dt>Disk usage 7d</dt>
              <dd>{selectedContext.summary.diskUsage7d}</dd>
            </div>
            <div>
              <dt>Retention</dt>
              <dd>{selectedContext.summary.retention}</dd>
            </div>
            <div>
              <dt>Last summary</dt>
              <dd>{selectedContext.summary.lastSummary}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </main>
  );
}

function formatSelfTestStatus(
  status: RecordingDashboardState["offlineSelfTest"]["status"]
): string {
  switch (status) {
    case "idle":
      return "Ready";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
  }
}

function describeSelfTest(dashboard: RecordingDashboardState): string {
  const selfTest = dashboard.offlineSelfTest;

  switch (selfTest.status) {
    case "idle":
      return "Run a local synthetic self-test without contacting a live site.";
    case "running":
      return "Synthetic adapter facts are being checked through the UI behavior path.";
    case "completed":
      return `${selfTest.archiveLabel ?? "Synthetic archive validated"} · ${
        selfTest.timelineEventCount ?? 0
      } timeline facts`;
    case "failed":
      return selfTest.errorMessage ?? "Offline self-test failed.";
  }
}

function formatAvailability(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  switch (streamer.status) {
    case "online":
      return "在线";
    case "offline":
      return "离线";
    case "away":
      return "暂离";
  }
}

function describeAvailability(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  switch (streamer.status) {
    case "online":
      return "在线：监控已确认主播在线";
    case "offline":
      return "离线：监控已确认主播离线";
    case "away":
      return "暂离：主播状态暂离或不可录制";
  }
}

function formatShowMode(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  switch (streamer.showMode) {
    case "buyoutTicket":
      return "买断票房";
    case "timedTicket":
      return "几时票房";
    case "p2p":
      return "P2P";
    case "privateShow":
      return "私人秀";
  }
}

function formatMediaStreamState(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  return streamer.mediaStreamState === "recording"
    ? "媒体流录制中"
    : "媒体流未录制";
}

function describeMediaStreamState(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  return streamer.mediaStreamState === "recording"
    ? "媒体流：正在录制"
    : "媒体流：未录制";
}

function formatInformationStreamState(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  return streamer.informationStreamState === "recording"
    ? "信息流录制中"
    : "信息流未录制";
}

function describeInformationStreamState(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  return streamer.informationStreamState === "recording"
    ? "信息流：正在录制"
    : "信息流：未录制";
}

function formatSelectedCaptureState(
  streamer: RecordingDashboardState["streamers"][number]
): string {
  if (streamer.monitoringState === "paused") {
    return "Paused";
  }

  return streamer.captureState === "recording" ? "Recording" : "Monitoring";
}
