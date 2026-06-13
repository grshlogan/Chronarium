import {
  createCredentialStore,
  selectCredentialForCapture
} from "@chronarium/core";
import type {
  CredentialProfile,
  StreamerCredentialBinding
} from "@chronarium/types";
import { describe, expect, it } from "vitest";

const SITE = "chaturbate";
const STREAMER = "streamer:redacted-001";

function profile(overrides: Partial<CredentialProfile>): CredentialProfile {
  return {
    id: "profile-a",
    siteId: SITE,
    label: "Synthetic account A",
    storageHandle: "fixture://credential/profile-a",
    entitlements: [{ intent: "ticket", scope: "site" }],
    health: "ok",
    ...overrides
  };
}

function binding(
  overrides: Partial<StreamerCredentialBinding>
): StreamerCredentialBinding {
  return {
    streamerRef: STREAMER,
    siteId: SITE,
    policy: "capability-match-failover",
    entries: [{ profileId: "profile-a", priority: 0 }],
    ...overrides
  };
}

describe("selectCredentialForCapture (capability-match-failover)", () => {
  it("selects the entitled profile bound to the streamer for a ticket intent", () => {
    const store = createCredentialStore({
      profiles: [profile({})],
      bindings: [binding({})]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result).toMatchObject({
      status: "selected",
      intent: "ticket",
      credentialRef: { profileId: "profile-a" }
    });
    expect(result.entitlementMatched).toMatchObject({ intent: "ticket" });
  });

  it("fails over past an unhealthy profile to the next eligible one", () => {
    const store = createCredentialStore({
      profiles: [
        profile({ id: "profile-a", health: "banned" }),
        profile({ id: "profile-b", health: "ok" })
      ],
      bindings: [
        binding({
          entries: [
            { profileId: "profile-a", priority: 0 },
            { profileId: "profile-b", priority: 1 }
          ]
        })
      ]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.status).toBe("selected");
    expect(result.credentialRef).toEqual({ profileId: "profile-b" });
    expect(result.orderedProfileIds).toEqual(["profile-b"]);
  });

  it("prefers a streamer-scoped entitlement over a site-scoped one", () => {
    const store = createCredentialStore({
      profiles: [
        profile({ id: "profile-site", entitlements: [{ intent: "ticket", scope: "site" }] }),
        profile({
          id: "profile-streamer",
          entitlements: [{ intent: "ticket", scope: `streamer:${STREAMER}` }]
        })
      ],
      bindings: [
        binding({
          entries: [
            { profileId: "profile-site", priority: 0 },
            { profileId: "profile-streamer", priority: 0 }
          ]
        })
      ]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.credentialRef).toEqual({ profileId: "profile-streamer" });
    expect(result.orderedProfileIds).toEqual(["profile-streamer", "profile-site"]);
  });

  it("orders by priority number under the priority policy", () => {
    const store = createCredentialStore({
      profiles: [
        profile({ id: "profile-a" }),
        profile({ id: "profile-b" })
      ],
      bindings: [
        binding({
          policy: "priority",
          entries: [
            { profileId: "profile-a", priority: 5 },
            { profileId: "profile-b", priority: 1 }
          ]
        })
      ]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.credentialRef).toEqual({ profileId: "profile-b" });
  });

  it("returns not-required for a public capture", () => {
    const store = createCredentialStore({ profiles: [], bindings: [] });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "public"
    });

    expect(result).toMatchObject({ status: "not-required", intent: "public" });
    expect(result.credentialRef).toBeUndefined();
  });

  it("returns missing when the streamer has no binding", () => {
    const store = createCredentialStore({ profiles: [], bindings: [] });

    const result = selectCredentialForCapture({
      store,
      streamerRef: "streamer:unbound",
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.status).toBe("missing");
    expect(result.reason).toMatch(/binding/);
  });

  it("returns missing when no bound profile is entitled to the intent", () => {
    const store = createCredentialStore({
      profiles: [
        profile({ entitlements: [{ intent: "private", scope: "site" }] })
      ],
      bindings: [binding({})]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.status).toBe("missing");
  });
});

describe("createCredentialStore safety", () => {
  it("rejects a profile that carries raw-secret-looking material", () => {
    expect(() =>
      createCredentialStore({
        profiles: [
          profile({ storageHandle: "https://example.invalid/session?cookie=abc" })
        ],
        bindings: []
      })
    ).toThrow();
  });

  it("rejects a binding that references an unknown profile id", () => {
    expect(() =>
      createCredentialStore({
        profiles: [profile({ id: "profile-a" })],
        bindings: [binding({ entries: [{ profileId: "profile-missing", priority: 0 }] })]
      })
    ).toThrow(/unknown profile/);
  });
});

describe("default-cookie election by addedAt", () => {
  it("uses the single eligible profile as the default", () => {
    const store = createCredentialStore({
      profiles: [profile({ id: "only", addedAt: "2026-06-10T00:00:00.000Z" })],
      bindings: [binding({ entries: [{ profileId: "only", priority: 0 }] })]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.credentialRef).toEqual({ profileId: "only" });
  });

  it("prefers the first-added (oldest) profile as the default", () => {
    const store = createCredentialStore({
      profiles: [
        profile({ id: "profile-new", addedAt: "2026-06-12T00:00:00.000Z" }),
        profile({ id: "profile-old", addedAt: "2026-06-10T00:00:00.000Z" })
      ],
      bindings: [
        binding({
          entries: [
            { profileId: "profile-new", priority: 0 },
            { profileId: "profile-old", priority: 0 }
          ]
        })
      ]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.credentialRef).toEqual({ profileId: "profile-old" });
    expect(result.orderedProfileIds).toEqual(["profile-old", "profile-new"]);
  });

  it("elects the next-oldest survivor when the default is removed", () => {
    // profile-old removed (deleted default) -> profile-mid is now the oldest.
    const store = createCredentialStore({
      profiles: [
        profile({ id: "profile-new", addedAt: "2026-06-12T00:00:00.000Z" }),
        profile({ id: "profile-mid", addedAt: "2026-06-11T00:00:00.000Z" })
      ],
      bindings: [
        binding({
          entries: [
            { profileId: "profile-new", priority: 0 },
            { profileId: "profile-mid", priority: 0 }
          ]
        })
      ]
    });

    const result = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    expect(result.credentialRef).toEqual({ profileId: "profile-mid" });
  });
});
