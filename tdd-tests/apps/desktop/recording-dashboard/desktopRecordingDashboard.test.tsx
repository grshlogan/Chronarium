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
});
