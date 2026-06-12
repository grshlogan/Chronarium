import type { ReactElement } from "react";
import { dashboardViewModel } from "./mockDashboard.js";

const selectedStreamer = dashboardViewModel.streamers.find(
  (streamer) => streamer.id === dashboardViewModel.selectedStreamerId
);

if (selectedStreamer === undefined) {
  throw new Error("Selected streamer is missing from the dashboard view model.");
}

const selectedDashboardStreamer = selectedStreamer;

export function App(): ReactElement {
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
          {dashboardViewModel.streamers.map((streamer) => (
            <article
              className={
                streamer.id === selectedDashboardStreamer.id
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
            {selectedDashboardStreamer.name.slice(0, 1)}
          </div>
          <div>
            <p className="eyebrow">Selected streamer</p>
            <h2>{selectedDashboardStreamer.name}</h2>
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
            <h2>{dashboardViewModel.currentSession.duration}</h2>
            <dl className="metric-grid">
              <div>
                <dt>Written size</dt>
                <dd>{dashboardViewModel.currentSession.size}</dd>
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
              {dashboardViewModel.facts.map((fact) => (
                <li className={fact.level} key={`${fact.time}-${fact.label}`}>
                  <span>{fact.label}</span>
                  <time>{fact.time}</time>
                </li>
              ))}
            </ol>
          </div>
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
              <dd>{dashboardViewModel.currentSession.startedAt}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{dashboardViewModel.currentSession.duration}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{dashboardViewModel.currentSession.size}</dd>
            </div>
          </dl>
        </section>

        <section className="history-list">
          <h2>History</h2>
          {dashboardViewModel.history.map((session) => (
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
