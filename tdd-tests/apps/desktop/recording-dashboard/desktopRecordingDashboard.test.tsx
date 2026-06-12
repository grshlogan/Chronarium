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
  });

  it("renders the offline fixture capture result after the demo action completes", () => {
    const started = reduceRecordingDashboard(
      createInitialRecordingDashboard(),
      {
        type: "offlineFixtureCapture.started"
      }
    );
    const completed = reduceRecordingDashboard(started, {
      type: "offlineFixtureCapture.completed",
      archiveLabel: "Synthetic archive written",
      factLabel: "Fixture capture completed",
      timelineEventCount: 3
    });

    const html = renderToStaticMarkup(<App dashboard={completed} />);

    expect(html).toContain("Offline fixture capture");
    expect(html).toContain("Completed");
    expect(html).toContain("Synthetic archive written");
    expect(html).toContain("Fixture capture completed");
    expect(html).toContain("3 timeline facts");
  });
});
