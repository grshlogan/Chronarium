import type {
  CredentialInjectionDescriptor,
  CredentialSelectionResult
} from "@chronarium/types";
import type { CredentialStore } from "./credentialStore.js";
import type { CredentialVault } from "./credentialVault.js";

/**
 * Model how a resolved credential jar would be handed to a worker. This is a
 * no-spawn model (mirrors `createAdapterWorkerCommand` and the no-spawn
 * supervisor): it produces a descriptor only and never launches a process.
 *
 * - A `selected` selection yields a one-time stdin handshake descriptor that
 *   carries the jar in `handshake` (runtime-only) and exposes only a redacted
 *   form (`credentialRef` + `entryCount`) for logging.
 * - `not-required` (public) and `missing` yield `kind: "none"` — public and
 *   degraded captures run cookie-free.
 *
 * The jar never goes in argv and must never be logged or serialized.
 * See `docs/CREDENTIALS_AND_SESSIONS.md`.
 */
export function createCredentialInjectionDescriptor(input: {
  readonly selection: CredentialSelectionResult;
  readonly store: CredentialStore;
  readonly vault: CredentialVault;
}): CredentialInjectionDescriptor {
  const { selection, store, vault } = input;

  if (selection.status !== "selected" || !selection.credentialRef) {
    return {
      kind: "none",
      reason:
        selection.status === "not-required"
          ? "public-capture-needs-no-credential"
          : "missing-credential"
    };
  }

  const credentialRef = selection.credentialRef;
  const profile = store.getProfile(credentialRef.profileId);
  if (!profile) {
    return { kind: "none", reason: "selected-profile-not-found" };
  }

  const jar = vault.resolveJar(profile.storageHandle);

  return {
    kind: "inject",
    channel: "stdin-handshake",
    credentialRef,
    handshake: { jar },
    redactedHandshake: {
      credentialRef,
      entryCount: jar.entries.length
    }
  };
}
