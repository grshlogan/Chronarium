import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  App,
  createInitialRecordingDashboard,
  getSelectedStreamer,
  reduceRecordingDashboard
} from "@chronarium/desktop";

const desktopStylesPath = fileURLToPath(
  new URL("../../../../apps/desktop/src/styles.css", import.meta.url)
);

describe("desktop recording dashboard", () => {
  it("renders the streamer maintenance recording workspace", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("Chronarium");
    expect(html).toContain("Add streamer link");
    expect(html).toContain("LunaCeleste");
    expect(html).toContain("Recording Now");
    expect(html).toContain("Preview disabled during recording");
    expect(html).toContain("Recording information");
    expect(html).toContain("Global information");
    expect(html).toContain("History");
    expect(html).toContain("Retention");
    expect(html).toContain("Pause monitoring");
    expect(html).toContain("Resume monitoring");
    expect(html).toContain("Check now");
    expect(html).not.toContain("Run fixture capture");
  });

  it("renders streamer site and last-check time on separate lines", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain(
      '<span class="site-code">CB</span><small class="last-check">Last check 12:24:18</small>'
    );
  });

  it("renders expanded streamer rail status lanes for recording decisions", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("在线");
    expect(html).toContain("离线");
    expect(html).toContain("暂离");
    expect(html).toContain("买断票房");
    expect(html).toContain("几时票房");
    expect(html).toContain("P2P");
    expect(html).toContain("私人秀");
    expect(html).toContain("媒体流录制中");
    expect(html).toContain("媒体流未录制");
    expect(html).toContain("信息流录制中");
    expect(html).toContain("信息流未录制");
  });

  it("renders streamer status board with descriptive hover text", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('class="streamer-identity"');
    expect(html).toContain('aria-label="LunaCeleste recording decision status"');
    expect(html).toContain('class="streamer-card selected expanded"');
    expect(html).toContain('class="stream-state-row"');
    expect(html).toContain('title="在线：监控已确认主播在线"');
    expect(html).toContain('title="票房/秀类型：买断票房"');
    expect(html).toContain('title="媒体流：正在录制"');
    expect(html).toContain('title="信息流：正在录制"');
  });

  it("keeps streamer cards on the enlarged 18/16/14 visual scale", () => {
    const css = readFileSync(desktopStylesPath, "utf8");

    expect(css).toContain("--rail-left-width: 560px;");
    expect(css).toContain(
      "grid-template-columns: 58px minmax(160px, 1fr) 256px;"
    );
    expect(css).toMatch(/\.streamer-card\s*{[\s\S]*?min-height: 112px;/);
    expect(css).toMatch(/\.streamer-status-board\s*{[\s\S]*?width: 256px;/);
    expect(css).toMatch(/\.streamer-card strong,[\s\S]*?font-size: 18px;/);
    expect(css).toMatch(
      /\.streamer-card span,[\s\S]*?\.pinned-session dt\s*{[\s\S]*?font-size: 16px;/
    );
    expect(css).toMatch(
      /\.streamer-card \.status-cell\s*{[\s\S]*?font-size: 14px;/
    );
  });

  it("renders the offline self-test result after the demo action completes", () => {
    const started = reduceRecordingDashboard(
      createInitialRecordingDashboard(),
      {
        type: "offlineSelfTest.started"
      }
    );
    const completed = reduceRecordingDashboard(started, {
      type: "offlineSelfTest.completed",
      archiveLabel: "Synthetic archive validated",
      factLabel: "Offline self-test completed",
      timelineEventCount: 3
    });

    const html = renderToStaticMarkup(<App dashboard={completed} />);

    expect(html).toContain("Offline self-test");
    expect(html).toContain("Completed");
    expect(html).toContain("Synthetic archive validated");
    expect(html).toContain("Offline self-test completed");
    expect(html).toContain("3 timeline facts");
  });

  it("renders the selected streamer workspace after streamer selection", () => {
    const selected = reduceRecordingDashboard(
      createInitialRecordingDashboard(),
      {
        type: "streamer.select",
        streamerId: "velvet"
      }
    );

    const html = renderToStaticMarkup(<App dashboard={selected} />);

    expect(html).toContain("VelvetMoth");
    expect(html).toContain("Monitoring paused");
    expect(html).toContain("Paused");
  });

  it("renders paused streamer context without a current recording card", () => {
    const selected = reduceRecordingDashboard(
      createInitialRecordingDashboard(),
      {
        type: "streamer.select",
        streamerId: "velvet"
      }
    );

    const html = renderToStaticMarkup(<App dashboard={selected} />);

    expect(html).toContain("VelvetMoth idle");
    expect(html).toContain("No current recording");
    expect(html).toContain("Monitoring is paused for this streamer.");
    expect(html).toContain("VelvetMoth Jun 10");
    expect(html).not.toContain("Recording Now");
    expect(html).not.toContain("12.46 GB");
  });

  it("renders offline streamer context with empty history", () => {
    const selected = reduceRecordingDashboard(
      createInitialRecordingDashboard(),
      {
        type: "streamer.select",
        streamerId: "cyber"
      }
    );

    const html = renderToStaticMarkup(<App dashboard={selected} />);

    expect(html).toContain("CyberCyan offline");
    expect(html).toContain("Room state: OFFLINE");
    expect(html).toContain("No sessions archived yet.");
    expect(html).toContain("No current recording");
    expect(html).not.toContain("Recording Now");
  });

  it("rejects malformed streamer links with a clear form error", () => {
    const dashboard = reduceRecordingDashboard(createInitialRecordingDashboard(), {
      type: "streamerLink.inputChanged",
      value: "not a streamer link"
    });
    const submitted = reduceRecordingDashboard(dashboard, {
      type: "streamerLink.submit"
    });

    const html = renderToStaticMarkup(<App dashboard={submitted} />);

    expect(submitted.addStreamerForm.error).toBe(
      "Enter a supported synthetic streamer URL."
    );
    expect(submitted.streamers).toHaveLength(
      createInitialRecordingDashboard().streamers.length
    );
    expect(html).toContain("Enter a supported synthetic streamer URL.");
  });

  it("adds and selects a streamer from a supported synthetic link", () => {
    const dashboard = reduceRecordingDashboard(createInitialRecordingDashboard(), {
      type: "streamerLink.inputChanged",
      value: "https://chaturbate.com/MiraNova"
    });
    const submitted = reduceRecordingDashboard(dashboard, {
      type: "streamerLink.submit"
    });

    const selected = getSelectedStreamer(submitted);
    const html = renderToStaticMarkup(<App dashboard={submitted} />);

    expect(submitted.streamers).toHaveLength(
      createInitialRecordingDashboard().streamers.length + 1
    );
    expect(selected).toMatchObject({
      id: "cb-miranova",
      name: "MiraNova",
      site: "CB",
      monitoringState: "active",
      captureState: "waiting"
    });
    expect(submitted.addStreamerForm.message).toBe(
      "Added MiraNova to monitoring."
    );
    expect(html).toContain("MiraNova monitoring");
    expect(html).toContain("Added MiraNova to monitoring.");
  });

  it("shows clear monitoring feedback for pause, resume, and check-now actions", () => {
    const paused = reduceRecordingDashboard(createInitialRecordingDashboard(), {
      type: "monitoring.pauseSelected"
    });
    const resumed = reduceRecordingDashboard(paused, {
      type: "monitoring.resumeSelected"
    });
    const checked = reduceRecordingDashboard(resumed, {
      type: "monitoring.checkNow"
    });

    const pausedHtml = renderToStaticMarkup(<App dashboard={paused} />);
    const checkedHtml = renderToStaticMarkup(<App dashboard={checked} />);

    expect(paused.monitoringFeedback.message).toBe(
      "Monitoring paused for LunaCeleste."
    );
    expect(checked.monitoringFeedback.message).toBe(
      "Manual check queued for LunaCeleste."
    );
    expect(pausedHtml).toContain("Monitoring paused for LunaCeleste.");
    expect(checkedHtml).toContain("Manual check queued for LunaCeleste.");
    expect(checkedHtml).toContain("Last action");
  });

  it("elects the oldest usable bound credential profile as the default cookie", () => {
    const dashboard = createInitialRecordingDashboard();
    const selectedCredential = dashboard.credentialBindings[dashboard.selectedStreamerId];

    expect(selectedCredential.defaultProfileId).toBe("cred-luna-main");

    const updated = reduceRecordingDashboard(dashboard, {
      type: "credential.profileRemoved",
      profileId: "cred-luna-main"
    });
    const updatedCredential =
      updated.credentialBindings[updated.selectedStreamerId];
    const html = renderToStaticMarkup(<App dashboard={updated} />);

    expect(updatedCredential.defaultProfileId).toBe("cred-luna-ticket");
    expect(html).toContain("Default Cookie");
    expect(html).toContain("Ticket backup");
  });

  it("shows public no-cookie guidance and gated degrade guidance", () => {
    const publicIntent = reduceRecordingDashboard(
      createInitialRecordingDashboard(),
      {
        type: "credential.intentSelected",
        intent: "public"
      }
    );
    const withoutMain = reduceRecordingDashboard(publicIntent, {
      type: "credential.profileRemoved",
      profileId: "cred-luna-main"
    });
    const withoutTicket = reduceRecordingDashboard(withoutMain, {
      type: "credential.profileRemoved",
      profileId: "cred-luna-ticket"
    });
    const privateIntent = reduceRecordingDashboard(withoutTicket, {
      type: "credential.intentSelected",
      intent: "private"
    });

    const publicHtml = renderToStaticMarkup(<App dashboard={publicIntent} />);
    const privateHtml = renderToStaticMarkup(<App dashboard={privateIntent} />);

    expect(publicIntent.credentialBindings.luna.message).toBe(
      "Public recording does not need a Cookie."
    );
    expect(privateIntent.credentialBindings.luna.message).toBe(
      "No usable bound Cookie. This gated intent degrades to no-cookie public recording."
    );
    expect(publicHtml).toContain("Public recording does not need a Cookie.");
    expect(privateHtml).toContain(
      "No usable bound Cookie. This gated intent degrades to no-cookie public recording."
    );
  });

  it("does not treat a bound profile as usable when it lacks the selected gated intent", () => {
    const withoutMain = reduceRecordingDashboard(
      createInitialRecordingDashboard(),
      {
        type: "credential.profileRemoved",
        profileId: "cred-luna-main"
      }
    );
    const privateIntent = reduceRecordingDashboard(withoutMain, {
      type: "credential.intentSelected",
      intent: "private"
    });

    expect(privateIntent.credentialBindings.luna.defaultProfileId).toBeUndefined();
    expect(privateIntent.credentialBindings.luna.message).toBe(
      "No usable bound Cookie. This gated intent degrades to no-cookie public recording."
    );
  });
});
