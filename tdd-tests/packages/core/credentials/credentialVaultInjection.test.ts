import {
  createCredentialInjectionDescriptor,
  createCredentialStore,
  createInMemoryCredentialVault,
  selectCredentialForCapture
} from "@chronarium/core";
import type {
  CredentialProfile,
  ResolvedCredentialJar,
  StreamerCredentialBinding
} from "@chronarium/types";
import { describe, expect, it } from "vitest";

const SITE = "stripchat";
const STREAMER = "streamer:redacted-001";

function syntheticJar(profileId: string): ResolvedCredentialJar {
  return {
    profileId,
    redactionStatus: "synthetic",
    entries: [
      { name: "synthetic_session", value: "synthetic-value-1" },
      { name: "synthetic_csrf", value: "synthetic-value-2" }
    ]
  };
}

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

describe("createInMemoryCredentialVault", () => {
  it("imports and resolves a synthetic jar by storage handle", () => {
    const vault = createInMemoryCredentialVault();
    const handle = "fixture://credential/profile-a";

    expect(vault.hasSecret(handle)).toBe(false);
    vault.importSecret({ storageHandle: handle, jar: syntheticJar("profile-a") });
    expect(vault.hasSecret(handle)).toBe(true);
    expect(vault.resolveJar(handle).entries).toHaveLength(2);
  });

  it("throws when resolving an unknown handle", () => {
    const vault = createInMemoryCredentialVault();
    expect(() => vault.resolveJar("fixture://credential/missing")).toThrow();
  });
});

describe("createCredentialInjectionDescriptor", () => {
  it("produces a stdin-handshake injection carrying the jar, redacted form hides values", () => {
    const store = createCredentialStore({
      profiles: [profile({})],
      bindings: [binding({})]
    });
    const vault = createInMemoryCredentialVault();
    vault.importSecret({
      storageHandle: "fixture://credential/profile-a",
      jar: syntheticJar("profile-a")
    });
    const selection = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "ticket"
    });

    const descriptor = createCredentialInjectionDescriptor({
      selection,
      store,
      vault
    });

    expect(descriptor.kind).toBe("inject");
    if (descriptor.kind !== "inject") {
      throw new Error("expected inject descriptor");
    }
    expect(descriptor.channel).toBe("stdin-handshake");
    expect(descriptor.credentialRef).toEqual({ profileId: "profile-a" });
    expect(descriptor.handshake.jar.entries).toHaveLength(2);
    expect(descriptor.redactedHandshake).toEqual({
      credentialRef: { profileId: "profile-a" },
      entryCount: 2
    });
    // the redacted form must not leak any jar values
    expect(JSON.stringify(descriptor.redactedHandshake)).not.toMatch(
      /synthetic-value/
    );
  });

  it("returns kind none for a public (not-required) selection", () => {
    const store = createCredentialStore({ profiles: [], bindings: [] });
    const vault = createInMemoryCredentialVault();
    const selection = selectCredentialForCapture({
      store,
      streamerRef: STREAMER,
      siteId: SITE,
      intent: "public"
    });

    const descriptor = createCredentialInjectionDescriptor({
      selection,
      store,
      vault
    });

    expect(descriptor.kind).toBe("none");
  });

  it("returns kind none for a missing selection", () => {
    const store = createCredentialStore({ profiles: [], bindings: [] });
    const vault = createInMemoryCredentialVault();
    const selection = selectCredentialForCapture({
      store,
      streamerRef: "streamer:unbound",
      siteId: SITE,
      intent: "ticket"
    });

    const descriptor = createCredentialInjectionDescriptor({
      selection,
      store,
      vault
    });

    expect(descriptor.kind).toBe("none");
  });
});
