# Credentials And Sessions

Status: design draft. Nothing here is implemented. No real cookies, headers,
tokens, accounts, or live requests exist yet. This document defines the model
and the safety boundaries for authenticated recording (ticket / private / spy
shows) so that a future fixture-first credential layer can be built without
leaking secrets. It elaborates the "Secrets And Credentials" rule in
`docs/SECURITY_PRIVACY.md` and the live-promotion gate in
`docs/REAL_SITE_ADAPTER_BRINGUP.md`.

## Why Credentials Are Needed

Some recordings require an authenticated session:

- ticketed shows (the account holds a purchased ticket);
- private / spy shows (the account is entitled to view);
- any site area gated behind login.

An authenticated session is never a single cookie. It is a coherent cookie jar
(auth + session + CSRF + similar), optionally with headers / user-agent. The
unit Chronarium stores is therefore a whole jar per account, not one cookie.

## Non-Negotiable Safety Boundaries

- Raw cookies / headers / tokens / signed URLs / account material are inputs,
  never facts. They must never enter: fixtures, timeline payloads, archive
  manifests, the SQLite index, docs, shareable diagnostics, logs, child-process
  argv, or Git.
- Only a redacted `CredentialRef` (a stable non-secret id, optionally a hash)
  may cross the adapter protocol, appear in timeline facts, or be shown in the
  GUI.
- The credential store is owned by `chronarium-core` only. GUI / renderer /
  Electron main never read or hold raw cookies. Adapters receive a resolved jar
  in memory at spawn time and must not echo it back.
- Raw jar material is `contains-sensitive` (a local runtime state only). Refs
  are `redacted` / `safe`.
- This is a new security boundary. No live cookie use happens until a specific
  live adapter is separately approved.

## Core Concepts (design types, not yet implemented)

```text
RecordingIntent = "public" | "ticket" | "private" | "spy"

CredentialProfile {
  id            // stable, non-secret CredentialProfileId
  siteId
  label         // human label, no secret
  accountHint?  // redacted only (e.g. masked), never the full account
  storageHandle // opaque reference to the at-rest encrypted jar; NOT the cookies
  entitlements  // what this profile can unlock (intent + scope), redacted
  health        // "unknown" | "ok" | "expired" | "rate_limited" | "banned" | "revoked"
  expiresAt?
  lastVerifiedAt?
}

StreamerCredentialBinding {
  streamerRef   // monitored-target id, site-scoped / redacted
  entries[]     // ordered { profileId, priority, tags }
  policy        // SelectionPolicy
}

SelectionPolicy = "capability-match-failover" (default)
                | "priority" | "round-robin" | "manual"

CredentialRef { profileId; profileHash? }   // redacted; crosses boundaries

ResolvedCredential   // runtime-only, in-memory, never serialized
  { ref; jar }
```

The model object holds metadata plus an opaque `storageHandle`. The actual
cookie material lives only in the encrypted store and only enters memory when a
task resolves it.

## Per-Streamer Selection (capability-match → failover)

The approved default policy:

1. The recording intent (public / ticket / private / spy) maps to a required
   entitlement.
2. From the streamer's bound profiles, keep those whose entitlements satisfy the
   required entitlement and whose `health` is usable.
3. Order the eligible set (capability match first, then health / priority).
4. Pick the first; on auth failure / rate-limit / ban, update that profile's
   `health` and fail over to the next eligible profile.
5. If none are eligible, do not hard-fail and do not block monitoring: record a
   `missing-credential` fact and either degrade to public-only capture or skip
   the gated capture, per task configuration.

Other policies (`priority`, `round-robin`, `manual`) are available for bindings
that opt into them.

## Storage And Threat Model

- Location: the local runtime data directory, git-ignored, outside any archive.
- At rest: encrypted. Mechanism is a later decision — OS keystore (Windows
  DPAPI / macOS Keychain / libsecret) or a user passphrase-derived key.
- Access: core-only. Importing a credential hands raw material directly to core
  through a dedicated guarded path, never through normal renderer state or
  logged IPC payloads.
- Lifecycle: import, health checks, expiry, rotation, and revocation. Bans /
  rate-limits update `health` and drive failover.
- Acquisition (browser export / login flow) is out of scope for the first
  design pass; the store only needs an import + health contract.

## Adapter Protocol And Manifest Integration

- A credential-requiring adapter sets `security.requiresCredentials = true` and
  must keep `security.emitsSensitiveSourceFields = false` (the core catalog
  rejects manifests that declare sensitive source-field emission).
- Core resolves the jar and injects it into the worker at spawn through a secure
  channel (e.g. a stdin handshake or a dedicated descriptor), never via argv.
  `createAdapterWorkerCommand` stays secret-free and keeps producing
  `redactedArgv`.
- The adapter uses the jar for requests but emits only a `CredentialRef` in
  facts and diagnostics. `verifyAdapterFixtureReadiness` continues to reject
  cookie / authorization / token / signed-url traces.
- When a runtime requires credentials, the core task gate must refuse a live
  task for a streamer that has no usable bound profile for the requested intent.

## Timeline Facts (reserved, redacted only)

Authenticated capture should leave queryable, replay-useful facts — carrying the
redacted ref and intent only, never the cookie. Proposed reserved shapes (need
payload schemas in a later round):

```text
session.intent_selected      { intent }
session.credential_selected  { credentialRef, intent, entitlementMatched }
session.credential_failover  { fromRef, toRef, reason }
session.credential_missing   { intent, reason }
```

Raw cookie facts must never be emitted.

## GUI

The per-streamer context already exists in the recording dashboard. A binding
editor there submits profile ids, the selection policy, and intent defaults —
it never handles raw cookies. Importing a credential is a separate guarded
action that delivers raw material straight to core.

## What Is Not Implemented

- No credential store, no encryption, no import flow.
- No resolution, injection, or failover logic.
- No live requests, no real cookie handling, no live adapter.
- No credential timeline payload schemas yet.

## First Safe Work Package

1. A fixture-only credential store + selector contract that holds synthetic /
   placeholder profiles (no real cookies) and proves: per-streamer binding,
   capability-match → failover, and the missing-credential degrade path.
2. Manifest gating (`requiresCredentials`) plus a core task gate that refuses a
   gated task without a usable bound profile.
3. Redacted `CredentialRef` plumbing and the reserved timeline fact shapes as
   schemas.

Only after that, and only with explicit per-adapter approval, may real cookie
injection and a live request path be designed.

## Open Questions

- Encryption mechanism (OS keystore vs passphrase) and key custody.
- `streamerRef` identity and redaction across sites.
- Whether intent is a per-binding default, a per-task input, or both.
- Whether a profile may span multiple sites or is strictly single-site.
- The credential import / acquisition flow.
