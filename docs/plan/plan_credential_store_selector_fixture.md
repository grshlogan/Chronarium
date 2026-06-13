# Plan: Fixture-Only Credential Store And Selector

## Objective

Implement the first safe work package from `docs/CREDENTIALS_AND_SESSIONS.md`: an
in-memory, fixture-only credential store and a per-streamer credential selector
that proves binding, capability-match-then-failover selection, the
missing-credential degrade path, and the public-needs-no-credential case. No real
cookies, no encryption, no injection, no live requests.

## Scope

In scope:

- `packages/types`: credential model types (`RecordingIntent`,
  `CredentialHealth`, `CredentialSelectionPolicy`, `CredentialEntitlement`,
  `CredentialProfile`, `StreamerCredentialBinding(Entry)`, `CredentialRef`,
  `CredentialSelectionResult`).
- `packages/core/src/credentials`: an in-memory `createCredentialStore`
  (profiles + bindings; metadata + an opaque `storageHandle` only — never raw
  cookie material) and `selectCredentialForCapture` implementing
  capability-match-failover.
- The store rejects any profile that carries raw-secret-looking material
  (network URLs, cookie/token/authorization/bearer/signed/`session=`), so the
  fixture model is provably secret-free.
- Export both from `packages/core`.
- TDD coverage under `tdd-tests/packages/core/credentials/`.

Out of scope (later slices):

- Core task gate refusing a gated live task without a usable bound profile.
- Reserved `session.credential_*` timeline fact schemas.
- Encryption, at-rest storage, import/acquisition, secure injection, real
  cookies, and any live request path.
- `round-robin` / `manual` policy refinements (the selector implements
  `capability-match-failover`; `priority` ordering is also supported).

## Selection semantics (`capability-match-failover`)

1. `intent === "public"` returns `not-required` (public capture needs no
   credential).
2. Otherwise resolve the streamer binding. No binding, or no eligible profile,
   returns `missing` with a reason (caller degrades to public-only or skips;
   monitoring is never blocked).
3. Eligible = bound profiles where `siteId` matches, `health` is usable (`ok` or
   `unknown`; `expired`/`rate_limited`/`banned`/`revoked` are excluded, which is
   how failover happens), and an entitlement matches the intent with scope
   `site` or `streamer:<streamerRef>`.
4. Order eligible: streamer-scoped entitlement before site-scoped, then by
   `priority` ascending, then by binding entry order. Return the first as
   `selected` plus the ordered fallback ids.

## Safety

- Only a redacted `CredentialRef` (profile id) is returned; the selector never
  surfaces a jar (there is none in fixture mode).
- The store holds only metadata + an opaque handle; raw cookies never enter the
  model, per `docs/CREDENTIALS_AND_SESSIONS.md` and `docs/SECURITY_PRIVACY.md`.
- No network, filesystem, encryption, or live behavior.

## Verification

- TDD RED captured for the selector tracer.
- Targeted credential tests; `pnpm typecheck`; `pnpm test`; `pnpm build`;
  `pnpm benchmark:timeline -- --events 1000 --batch-size 128`; `git diff
  --check`; trailing-whitespace scan.

## Progress / Decisions

- Added credential model types to `packages/types/src/credentials.ts` and
  exported them.
- Added `packages/core/src/credentials/credentialStore.ts`
  (`createCredentialStore`) and `credentialSelector.ts`
  (`selectCredentialForCapture`), exported through `packages/core`.
- The store rejects profiles with raw-secret-looking strings (network URLs,
  `cookie`/`token=`/`authorization`/`bearer`/`signed`/`session=`), rejects
  duplicate profile ids, and rejects bindings that reference unknown profiles.
- The selector implements `capability-match-failover` (streamer-scope before
  site-scope, then priority, then entry order) and `priority`; `public` returns
  `not-required`; no binding or no eligible profile returns `missing`. Health
  `expired`/`rate_limited`/`banned`/`revoked` are excluded, which is how failover
  happens. Only a redacted `CredentialRef` is returned.
- TDD: selector tracer RED (`createCredentialStore` absent) → GREEN; grew to 9
  tests (tracer, failover, specificity, priority, public not-required, two
  missing cases, two store-safety cases).
- Verification: `pnpm typecheck`, `pnpm build` passed; `pnpm test` passed 30
  files / 142 tests (was 29 / 133); `pnpm benchmark:timeline` `issueCount: 0`;
  `git diff --check` + trailing-whitespace scan clean.
- Deferred (noted in the doc): core task gate, reserved `session.credential_*`
  timeline schemas, encryption/storage/import/injection, real cookies, live path,
  and `round-robin`/`manual` policy refinements.

## Blockers

- None.
