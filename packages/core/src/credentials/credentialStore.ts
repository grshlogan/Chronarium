import type {
  CredentialProfile,
  StreamerCredentialBinding
} from "@chronarium/types";

/**
 * In-memory, fixture-only credential store. It holds credential profile
 * metadata and per-streamer bindings. It never holds raw cookie material: a
 * profile carries only an opaque `storageHandle`. The store rejects any profile
 * that contains raw-secret-looking strings, so the fixture model is provably
 * free of cookies, tokens, signed URLs, and network URLs.
 *
 * See `docs/CREDENTIALS_AND_SESSIONS.md`.
 */
export interface CredentialStore {
  getProfile(id: string): CredentialProfile | undefined;
  listProfiles(): readonly CredentialProfile[];
  getBinding(streamerRef: string): StreamerCredentialBinding | undefined;
}

export function createCredentialStore(input: {
  readonly profiles: readonly CredentialProfile[];
  readonly bindings: readonly StreamerCredentialBinding[];
}): CredentialStore {
  const profiles = new Map<string, CredentialProfile>();
  for (const profile of input.profiles) {
    assertRedactedProfile(profile);
    if (profiles.has(profile.id)) {
      throw new Error(`Duplicate credential profile id: ${profile.id}`);
    }
    profiles.set(profile.id, profile);
  }

  const bindings = new Map<string, StreamerCredentialBinding>();
  for (const binding of input.bindings) {
    if (bindings.has(binding.streamerRef)) {
      throw new Error(
        `Duplicate credential binding for streamer: ${binding.streamerRef}`
      );
    }
    for (const entry of binding.entries) {
      if (!profiles.has(entry.profileId)) {
        throw new Error(
          `Credential binding for ${binding.streamerRef} references unknown profile id: ${entry.profileId}`
        );
      }
    }
    bindings.set(binding.streamerRef, binding);
  }

  return {
    getProfile: (id) => profiles.get(id),
    listProfiles: () => [...profiles.values()],
    getBinding: (streamerRef) => bindings.get(streamerRef)
  };
}

function assertRedactedProfile(profile: CredentialProfile): void {
  scanForRawSecrets(profile, `credentialProfile[${profile.id}]`);
}

function scanForRawSecrets(value: unknown, path: string): void {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    if (lowerValue.startsWith("http://") || lowerValue.startsWith("https://")) {
      throw new Error(`${path} must not contain a network URL.`);
    }

    const forbiddenFragments = [
      "cookie",
      "token=",
      "authorization",
      "bearer",
      "signed",
      "session="
    ];
    if (forbiddenFragments.some((fragment) => lowerValue.includes(fragment))) {
      throw new Error(
        `${path} contains raw-secret-looking material; credential profiles must hold only redacted metadata and an opaque storageHandle.`
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForRawSecrets(item, `${path}[${index}]`));
    return;
  }

  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, item]) =>
      scanForRawSecrets(item, `${path}.${key}`)
    );
  }
}
