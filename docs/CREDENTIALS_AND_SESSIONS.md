# Credentials And Sessions

Status: fixture-only foundation partly implemented. No real cookies, headers,
tokens, accounts, imports, injection, encrypted storage, or live requests exist
yet. This document defines the model and the safety boundaries for
authenticated recording (ticket / private / spy shows) so the credential layer
can grow without leaking secrets. It elaborates the "Secrets And Credentials"
rule in `docs/SECURITY_PRIVACY.md` and the live-promotion gate in
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

## Core Concepts

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

Implemented today:

- `packages/types/src/credentials.ts` defines the fixture-safe metadata types.
- `packages/core/src/credentials` provides an in-memory fixture-only
  `createCredentialStore` and `selectCredentialForCapture`.
- The store holds redacted profile metadata plus an opaque `storageHandle`; it
  rejects raw-secret-looking strings.
- The selector returns only `not-required`, `missing`, or a redacted
  `CredentialRef`.

## Per-Streamer Selection (capability-match → failover)

The approved default policy:

1. The recording intent (public / ticket / private / spy) maps to a required
   entitlement.
2. From the streamer's bound profiles, keep those whose entitlements satisfy the
   required entitlement and whose `health` is usable.
3. Order the eligible set: most specific scope first (streamer-scope before
   site-scope), then the **default cookie** — the oldest-added surviving profile
   (smallest `addedAt`) — then binding entry order. The `priority` policy instead
   orders by explicit priority.
4. Pick the first; on auth failure / rate-limit / ban, update that profile's
   `health` and fail over to the next eligible profile.
5. If none are eligible, do not hard-fail and do not block monitoring: the gated
   capture **degrades to public / no-cookie capture** and proceeds, recording the
   degrade as the capture's credential outcome.

Default cookie election: a site/scope with exactly one eligible profile uses it
by default; the first-added profile is the default; when the default is deleted,
the next-oldest surviving profile becomes the default automatically; and when no
profile remains, capture falls back to no-cookie/public recording.

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
- The core offline fixture capture preflight refuses a gated capture
  (`ticket`, `private`, `spy`) before adapter startup when no usable bound
  profile exists for the requested streamer and intent. This is implemented
  for the fixture path; live task gating must reuse the same rule before any
  future live adapter can start.

## Timeline Facts (redacted only)

Authenticated capture should leave queryable, replay-useful facts — carrying the
redacted ref and intent only, never the cookie. The v1 payload schemas are now
registered for these fact types:

```text
session.intent_selected      { intent, selectionPolicy? }
session.credential_selected  { credentialRef, intent, entitlementMatched }
session.credential_failover  { fromRef, toRef, intent, reason }
session.credential_missing   { intent, reason }
```

Raw cookie facts must never be emitted.

## GUI

The per-streamer context already exists in the recording dashboard. A binding
editor there submits profile ids, the selection policy, and intent defaults —
it never handles raw cookies. Importing a credential is a separate guarded
action that delivers raw material straight to core.

## What Is Not Implemented

- No real encrypted at-rest backend or persistent storage. The vault
  (`createInMemoryCredentialVault`) is a fixture-only in-memory backend holding
  synthetic jars; no disk IO, no crypto, no serialization.
- No real cookie import; the import path accepts synthetic jars only.
- No real worker injection. The stdin-handshake injection
  (`createCredentialInjectionDescriptor`) is modeled no-spawn: it produces a
  descriptor only; nothing is spawned and no jar is written to a process.
- No live requests, no real cookie handling, no live adapter.
- No GUI binding editor or import UI.
- No emission of `session.credential_*` timeline facts during capture yet (the
  payload schemas exist; emission belongs to the future capture layer).

## First Safe Work Package

Completed:

1. A fixture-only credential store + selector contract that holds synthetic /
   placeholder profiles (no real cookies) and proves: per-streamer binding,
   capability-match → failover, default-cookie election (oldest-added), and the
   no-credential degrade path.
2. The core offline fixture capture pipeline resolves the capture credential and
   **degrades a gated capture with no usable bound profile to no-cookie/public
   capture** (exposing a `credential` outcome on the result), and selects the
   bound credential otherwise. Public intent needs no credential.
3. Redacted `CredentialRef` plumbing in types and the session credential fact
   payload schemas.
4. A fixture-only `CredentialVault` (in-memory, synthetic jars) and a no-spawn
   `CredentialInjectionDescriptor` model (one-time stdin handshake; jar
   runtime-only; only a redacted form is loggable).

Only after that, and only with explicit per-adapter approval, may real cookie
injection and a live request path be designed.

## Open Questions

- Encryption mechanism (OS keystore vs passphrase) and key custody — deferred to
  the real at-rest backend slice; recommended direction is OS keystore default
  with a passphrase fallback.
- `streamerRef` identity and redaction across sites.
- Whether a profile may span multiple sites or is strictly single-site.
- The real credential import / acquisition flow.

Resolved: intent is a **per-task** input (`recordingIntent` on the capture
task); the default cookie is the **oldest-added** surviving eligible profile.
