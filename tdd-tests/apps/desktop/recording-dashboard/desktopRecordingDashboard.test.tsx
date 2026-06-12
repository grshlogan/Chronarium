import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  App,
  createInitialRecordingDashboard,
  reduceRecordingDashboard
} from "@chronarium/desktop";

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
});
