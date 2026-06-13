import { CHATURBATE_ADAPTER_MANIFEST } from "@chronarium/adapter-chaturbate";
import { createAdapterCatalog } from "@chronarium/core";
import { describe, expect, it } from "vitest";

describe("adapter catalog", () => {
  it("registers fixture-ready site adapter manifests for core callers", () => {
    const catalog = createAdapterCatalog({
      manifests: [CHATURBATE_ADAPTER_MANIFEST]
    });

    expect(catalog.listAdapters()).toEqual([
      expect.objectContaining({
        adapterId: "chaturbate",
        siteId: "chaturbate",
        runtimeModes: ["fixture"],
        capabilities: [
          "fixture.timeline",
          "media.discovery",
          "room.state",
          "diagnostics"
        ],
        fixtureReadiness: expect.objectContaining({
          status: "fixture-ready"
        })
      })
    ]);
    expect(catalog.getAdapter("chaturbate")).toMatchObject({
      displayName: "Chaturbate",
      security: {
        networkAccess: "none",
        requiresCredentials: false,
        emitsSensitiveSourceFields: false
      }
    });
  });
});
