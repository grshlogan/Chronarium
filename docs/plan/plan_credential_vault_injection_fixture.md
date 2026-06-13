# Plan: Credential Vault + Injection Model + Default Election (fixture-safe)

## Objective

Advance the credential line to the live edge without crossing it: model how a
resolved credential's cookie jar is held (`CredentialVault`) and handed to a
worker (`CredentialInjectionDescriptor`), add the user's default-cookie election
rule to the selector, and change the gated no-credential path from a hard task
failure to a no-cookie / public degrade. All fixture-safe: synthetic placeholder
jars only — no real cookies, no encryption backend, no child-process spawn, no
live requests. Elaborates `docs/CREDENTIALS_AND_SESSIONS.md`.

## Decisions (user-approved)

- Vault is a backend-agnostic interface; only backend now is in-memory + synthetic.
  Real encrypted at-rest backend deferred (recommended later: OS keystore default,
  passphrase fallback).
- Injection channel: one-time stdin handshake, modeled no-spawn; jar never in
  argv / logs; only a redacted form (credentialRef + entryCount) is loggable.
- Default-cookie election: first-added is default, implemented as the **oldest
  surviving** eligible profile via a new `addedAt`; single profile is the
  default; deleting the default auto-elects the next-oldest. ("最近且最旧" read
  as oldest still-present.)
- No-cookie fallback: a gated intent with no usable credential **degrades to
  public / no-cookie capture and proceeds**, instead of failing the task. This
  revises the B1 gate.

## Implementation (TDD vertical slices)

1. `packages/types/src/credentials.ts`: add `CredentialJarEntry`,
   `ResolvedCredentialJar` (runtime-only; `redactionStatus`),
   `CredentialInjectionDescriptor`, and `addedAt?` on `CredentialProfile`.
2. `packages/core/src/credentials/credentialVault.ts`: `CredentialVault` +
   `createInMemoryCredentialVault()` (Map, synthetic, no disk/crypto/serialize):
   `importSecret`, `hasSecret(storageHandle)`, `resolveJar(storageHandle)` (throws
   on unknown).
3. `packages/core/src/credentials/credentialInjection.ts`:
   `createCredentialInjectionDescriptor({ selection, store, vault })` →
   `kind:"inject"` (stdin-handshake, carries jar, redactedHandshake hides values)
   for `selected`; `kind:"none"` for `not-required` / `missing`.
4. `credentialSelector.ts`: default ordering becomes specificity → `addedAt`
   ascending (oldest = default) → entry order; `priority` policy unchanged.
5. `offlineFixtureCapturePipeline.ts`: replace the credential failure with
   `resolveCaptureCredential` → `{ status: "selected"|"not-required"|
   "degraded-public", intent, credentialRef?, reason? }`, exposed on the result;
   capture always proceeds past the credential step (only the adapter-catalog
   gate can fail). The pipeline does not inject (no vault/spawn) — it records the
   outcome; emitting `session.credential_*` timeline facts during real capture is
   deferred to the capture layer (schemas already exist).
6. Export vault + injection from `credentials/index.ts`.

## Tests
- New `tdd-tests/packages/core/credentials/credentialVault.test.ts` and
  `credentialInjection.test.ts` (RED→GREEN tracers + behaviors).
- Extend `credentialSelector.test.ts`: single-profile default, first-added
  default, default-deleted-elects-next-oldest.
- Rewrite the adapterTaskGate "no usable credential" test from fail → degrade:
  give it real Stripchat messages, assert `completed` + `credential.status ===
  "degraded-public"`; keep the entitled-credential test (assert `selected`).

## Safety
- Synthetic jars only; jar lives only in the runtime handshake; never serialized,
  argv, timeline, archive, index, or logs. Aligns with `docs/SECURITY_PRIVACY.md`
  and the live gate in `docs/REAL_SITE_ADAPTER_BRINGUP.md`.

## Out of scope (gated until a specific live adapter is approved)
Real encrypted backend, real cookie import, real spawn + stdin write, live
adapter, live requests, GUI binding UI, emitting credential timeline facts.

## Verification
`pnpm typecheck`; `pnpm test` (> 166); `pnpm build`; `pnpm benchmark:timeline --
--events 1000 --batch-size 128`; `git diff --check`; trailing-whitespace scan.

## Docs
`docs/CREDENTIALS_AND_SESSIONS.md`, `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`,
`docs/AI_CHANGE_INDEX.md`, `README.md`, and
`docs/conversation-A02-foundation-docs-completion.md` (Phase 7). A01 untouched.

## Progress / Decisions

- Added `CredentialJarEntry`, `ResolvedCredentialJar`,
  `CredentialInjectionDescriptor`, and `addedAt` on `CredentialProfile` to
  `packages/types/src/credentials.ts`.
- Added `createInMemoryCredentialVault` (`credentialVault.ts`) and
  `createCredentialInjectionDescriptor` (`credentialInjection.ts`), exported via
  `credentials/index.ts`. The vault is in-memory + synthetic (no disk, crypto, or
  serialize). Injection is a no-spawn `stdin-handshake` descriptor; the jar lives
  only in `handshake`, and `redactedHandshake` exposes only credentialRef +
  entryCount.
- Selector default election: ordering is specificity → `addedAt` ascending
  (oldest = default) → entry order; `priority` policy unchanged.
- Pipeline: replaced the credential failure with `resolveCaptureCredential`; a
  gated intent with no usable profile now **degrades to public/no-cookie** and
  proceeds, exposed as `result.credential` (`selected` | `not-required` |
  `degraded-public`). The pipeline records the outcome but does not inject (no
  vault/spawn) — emitting `session.credential_*` facts is deferred.
- TDD: vault/injection tracer RED → GREEN (5 tests); selector election (3 tests);
  rewrote the adapterTaskGate "no usable credential" test from fail → degrade and
  added a `selected` assertion to the entitled test.
- Verification: `pnpm typecheck`, `pnpm build` passed; `pnpm test` 31 files / 174
  tests (was 30 / 166); `pnpm benchmark:timeline` `issueCount: 0`; `git diff
  --check` + trailing-whitespace scan clean.

## Blockers

- None.
