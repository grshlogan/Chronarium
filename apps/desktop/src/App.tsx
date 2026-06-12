import { useState, type ReactElement } from "react";
import {
  createInitialRecordingDashboard,
  reduceRecordingDashboard,
  runOfflineFixtureCaptureDemo,
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
  const selectedStreamer = dashboard.streamers.find(
    (streamer) => streamer.id === dashboard.selectedStreamerId
  );

  if (selectedStreamer === undefined) {
    throw new Error("Selected streamer is missing from the dashboard view model.");
  }

  const runDemoCapture = async (): Promise<void> => {
    setInteractiveDashboard((current) =>
      reduceRecordingDashboard(current, {
        type: "offlineFixtureCapture.started"
      })
    );

    try {
      const action = await runOfflineFixtureCaptureDemo();
      setInteractiveDashboard((current) =>
        reduceRecordingDashboard(current, action)
      );
    } catch (error) {
      setInteractiveDashboard((current) =>
        reduceRecordingDashboard(current, {
          type: "offlineFixtureCapture.failed",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Offline fixture capture failed."
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
            <article
              className={
                streamer.id === selectedStreamer.id
                  ? "streamer-card selected"
                  : "streamer-card"
              }
              key={streamer.id}
            >
              <div className="avatar" aria-hidden="true">
                {streamer.name.slice(0, 1)}
              </div>
              <div>
                <strong>{streamer.name}</strong>
                <span>{streamer.site}</span>
                <small>Last check {streamer.lastCheck}</small>
              </div>
              <div className="streamer-state">
                <span className={`dot ${streamer.status}`} />
                <b>{streamer.captureState}</b>
              </div>
            </article>
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
            <span className="status-pill">ONLINE</span>
          </div>
          <div className="header-actions">
            <span className="recording-pill">Recording</span>
            <span className="safe-pill">Privacy safe</span>
          </div>
        </header>

        <section className="main-surface">
          <div className="capture-metrics">
            <span>Room state: LIVE</span>
            <span>Adapter: Fixture HLS</span>
            <span>Lifecycle: Running</span>
          </div>
          <div className="preview-disabled">
            <div className="preview-icon" aria-hidden="true" />
            <h3>Preview disabled during recording</h3>
            <p>
              Capture facts are being preserved. A future delayed preview can use
              a separate optional surface.
            </p>
          </div>
        </section>

        <section className="recording-detail">
          <div>
            <p className="eyebrow">Recording information</p>
            <h2>{dashboard.currentSession.duration}</h2>
            <dl className="metric-grid">
              <div>
                <dt>Written size</dt>
                <dd>{dashboard.currentSession.size}</dd>
              </div>
              <div>
                <dt>Segments</dt>
                <dd>29</dd>
              </div>
              <div>
                <dt>Video track</dt>
                <dd className="good">Healthy · 6.0 Mbps</dd>
              </div>
              <div>
                <dt>Audio track</dt>
                <dd className="good">Healthy · 160 kbps</dd>
              </div>
            </dl>
          </div>
          <div className="facts-panel">
            <h3>Latest facts</h3>
            <ol>
              {dashboard.facts.map((fact) => (
                <li className={fact.level} key={`${fact.time}-${fact.label}`}>
                  <span>{fact.label}</span>
                  <time>{fact.time}</time>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="offline-capture-panel" aria-label="Offline fixture capture">
          <div>
            <p className="eyebrow">Offline fixture capture</p>
            <h2>{formatFixtureCaptureStatus(dashboard.offlineFixtureCapture.status)}</h2>
            <p>{describeFixtureCapture(dashboard)}</p>
          </div>
          <button
            className="run-capture"
            type="button"
            disabled={dashboard.offlineFixtureCapture.status === "running"}
            onClick={() => {
              void runDemoCapture();
            }}
          >
            Run fixture capture
          </button>
        </section>
      </section>

      <aside className="history-rail" aria-label="Selected streamer history">
        <section className="pinned-session">
          <p className="eyebrow">Current session (pinned)</p>
          <h2>Recording Now</h2>
          <span className="lock">Locked at top</span>
          <dl>
            <div>
              <dt>Started</dt>
              <dd>{dashboard.currentSession.startedAt}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{dashboard.currentSession.duration}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{dashboard.currentSession.size}</dd>
            </div>
          </dl>
        </section>

        <section className="history-list">
          <h2>History</h2>
          {dashboard.history.map((session) => (
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
          ))}
        </section>

        <section className="streamer-info">
          <h2>Selected streamer info</h2>
          <dl>
            <div>
              <dt>Frequency</dt>
              <dd>Every stream</dd>
            </div>
            <div>
              <dt>Disk usage 7d</dt>
              <dd>8.9 TB</dd>
            </div>
            <div>
              <dt>Retention</dt>
              <dd>1 / 3 / 7 days</dd>
            </div>
            <div>
              <dt>Last summary</dt>
              <dd>12:10:42</dd>
            </div>
          </dl>
        </section>
      </aside>
    </main>
  );
}

function formatFixtureCaptureStatus(
  status: RecordingDashboardState["offlineFixtureCapture"]["status"]
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

function describeFixtureCapture(dashboard: RecordingDashboardState): string {
  const capture = dashboard.offlineFixtureCapture;

  switch (capture.status) {
    case "idle":
      return "Run a local synthetic capture path without contacting a live site.";
    case "running":
      return "Synthetic adapter facts are being passed through the UI behavior path.";
    case "completed":
      return `${capture.archiveLabel ?? "Synthetic archive written"} · ${
        capture.timelineEventCount ?? 0
      } timeline facts`;
    case "failed":
      return capture.errorMessage ?? "Offline fixture capture failed.";
  }
}
