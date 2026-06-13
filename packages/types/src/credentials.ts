/**
 * Credential model types for authenticated recording (ticket / private / spy
 * shows). See `docs/CREDENTIALS_AND_SESSIONS.md`.
 *
 * These types describe metadata and redacted references only. Raw cookie jars
 * are never represented here; a `CredentialProfile` holds an opaque
 * `storageHandle` to at-rest material, never the cookies themselves.
 */

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
