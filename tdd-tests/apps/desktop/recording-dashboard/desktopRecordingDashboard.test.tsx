import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "@chronarium/desktop";

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
});
