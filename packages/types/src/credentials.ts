/**
 * Credential model types for authenticated recording (ticket / private / spy
 * shows). See `docs/CREDENTIALS_AND_SESSIONS.md`.
 *
 * These types describe metadata and redacted references only. Raw cookie jars
 * are never represented here; a `CredentialProfile` holds an opaque
 * `storageHandle` to at-rest material, never the cookies themselves.
 */
import type { IsoDateTimeString, RedactionStatus } from "./primitives.js";

export type RecordingIntent = "public" | "ticket" | "private" | "spy";

export type CredentialHealth =
  | "unknown"
  | "ok"
  | "expired"
  | "rate_limited"
  | "banned"
  | "revoked";

export type CredentialSelectionPolicy =
  | "capability-match-failover"
  | "priority"
  | "round-robin"
  | "manual";

export interface CredentialEntitlement {
  readonly intent: RecordingIntent;
  /** `"site"` or `"streamer:<redacted streamerRef>"`. */
  readonly scope: string;
}

export interface CredentialProfile {
  readonly id: string;
  readonly siteId: string;
  readonly label: string;
  /** Redacted only (e.g. masked); never the full account identifier. */
  readonly accountHint?: string;
  /** Opaque reference to the at-rest encrypted jar; never the cookies. */
  readonly storageHandle: string;
  readonly entitlements: readonly CredentialEntitlement[];
  readonly health: CredentialHealth;
  /**
   * When this profile was added. The default profile for a site/scope is the
   * oldest surviving one (smallest `addedAt`); the first added is therefore the
   * default until it is removed. Optional for back-compat; selection falls back
   * to binding entry order when absent.
   */
  readonly addedAt?: IsoDateTimeString;
  readonly expiresAt?: string;
  readonly lastVerifiedAt?: string;
}

export interface StreamerCredentialBindingEntry {
  readonly profileId: string;
  readonly priority: number;
}

export interface StreamerCredentialBinding {
  readonly streamerRef: string;
  readonly siteId: string;
  readonly policy: CredentialSelectionPolicy;
  readonly entries: readonly StreamerCredentialBindingEntry[];
}

/** Redacted reference that may cross the protocol/timeline boundary. */
export interface CredentialRef {
  readonly profileId: string;
}

export type CredentialSelectionStatus = "selected" | "not-required" | "missing";

export interface CredentialSelectionResult {
  readonly status: CredentialSelectionStatus;
  readonly intent: RecordingIntent;
  readonly credentialRef?: CredentialRef;
  readonly entitlementMatched?: CredentialEntitlement;
  /** Eligible profile ids in failover order; empty for not-required/missing. */
  readonly orderedProfileIds: readonly string[];
  readonly reason?: string;
}

/** One cookie/header entry inside a resolved jar. Runtime-only, never persisted. */
export interface CredentialJarEntry {
  readonly name: string;
  readonly value: string;
}

/**
 * A resolved credential jar. This is the only place raw cookie/header material
 * exists, and it is runtime-only: it must never be serialized to disk, a
 * timeline, an archive, the index, logs, or process argv. In fixture mode the
 * entries are synthetic and `redactionStatus` is `"synthetic"`.
 */
export interface ResolvedCredentialJar {
  readonly profileId: string;
  readonly redactionStatus: RedactionStatus;
  readonly entries: readonly CredentialJarEntry[];
}

/** Loggable, redacted view of an injection — no jar values. */
export interface RedactedCredentialInjection {
  readonly credentialRef: CredentialRef;
  readonly entryCount: number;
}

/**
 * Models how a resolved jar would be handed to a worker. The jar lives only in
 * `handshake` (runtime-only); `redactedHandshake` is the only loggable form.
 * `kind: "none"` covers public (no credential needed) and degraded captures.
 */
export type CredentialInjectionDescriptor =
  | {
      readonly kind: "inject";
      readonly channel: "stdin-handshake";
      readonly credentialRef: CredentialRef;
      readonly handshake: { readonly jar: ResolvedCredentialJar };
      readonly redactedHandshake: RedactedCredentialInjection;
    }
  | {
      readonly kind: "none";
      readonly reason: string;
    };
