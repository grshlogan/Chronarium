# Plan: Adapter Site Readiness Gate

## Objective

Make Chronarium clearly ready to start adding real site adapters by defining
and implementing a reusable offline readiness gate for adapter packages.

This does not connect to any real livestream site. It does not implement live
Chaturbate, cookies, headers, sessions, signed URLs, downloader logic, or real
media capture.

## Scope

- Define what "ready to connect a site adapter" means for Chronarium.
- Add a public testkit/core-facing harness that can validate an adapter fixture
  message stream before live work begins.
- Add a small adapter manifest/catalog boundary so core can register adapter
  packages through declared metadata instead of ad hoc imports.
- Use the existing Chaturbate synthetic fixture as the first readiness example.
- Keep the gate fixture-first and schema-first.

## Readiness Definition

A site adapter is ready for live-site design only when it can prove, offline:

- it emits only valid adapter protocol messages;
- it reports capabilities before facts;
- it emits facts for the requested session and adapter id;
- it completes with `adapter.finished` or fails with structured
  `adapter.error`;
- it does not leak raw network URLs, cookies, headers, tokens, signed URLs, or
  private room/session data into messages;
- its emitted timeline facts pass the shared timeline schema;
- its fixture stream can flow through the core fixture lifecycle host;
- for capture-like fixtures, the resulting `.chron` archive can be validated
  and indexed.
- it has an adapter manifest declaring adapter id, site id, capabilities,
  runtime modes, fixture status, and security posture.

Passing this gate does not prove current live-site compatibility. It only proves
that the adapter can be safely wired into Chronarium's core contract.

## Current Facts

- `packages/core` has a fixture adapter lifecycle host.
- `packages/core` has an offline fixture capture pipeline.
- `packages/adapters/chaturbate` has synthetic split audio/video and diagnostic
  fixtures.
- `packages/adapters/stripchat` has a synthetic combined audio/video fixture
  scaffold.
- Adapter protocol runtime schemas already exist in `packages/schemas`.
- `packages/testkit` has a reusable adapter fixture readiness gate.
- `packages/core` has a shared adapter manifest catalog.
- `packages/core` can now preflight offline fixture capture tasks against a
  runtime adapter catalog before consuming adapter messages.

## Constraints

- No network requests.
- No real capture.
- No credentials, cookies, headers, tokens, signed URLs, or private room data.
- No arbitrary shell or media-tool execution.
- TDD: add one behavior test at a time, then implementation.

## Execution Plan

1. RED/GREEN: add a testkit readiness gate that accepts a fixture message
   stream and confirms it passes protocol/lifecycle/sensitivity checks.
2. RED/GREEN: fail readiness when adapter messages contain network-looking or
   secret-looking strings.
3. RED/GREEN: fail readiness when facts appear before `adapter.ready`.
4. RED/GREEN: add adapter manifest schema/type coverage and a Chaturbate
   manifest that declares fixture-only readiness.
5. RED/GREEN: add a core adapter catalog that rejects duplicate adapter ids and
   exposes registered adapter manifests to future task setup.
6. RED/GREEN: add a core task gate that rejects unregistered or incapable
   adapters before adapter startup.
7. Use the Chaturbate synthetic fixture as a passing readiness example.
8. Add a second combined A/V fixture-only site scaffold to prove the path is not
   Chaturbate-specific.
9. Update adapter protocol docs, site readiness docs, code map, handoff, change
   index, and A01
   context.

## Verification

Expected checks:

- targeted readiness tests;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.

## Progress / Decisions

- Added `verifyAdapterFixtureReadiness` in `packages/testkit`.
- Added adapter manifest types in `packages/types` and runtime schema parsing
  in `packages/schemas`.
- Added `CHATURBATE_ADAPTER_MANIFEST` as a fixture-only manifest.
- Added `createAdapterCatalog` in `packages/core`.
- Added `STRIPCHAT_ADAPTER_MANIFEST` and a fixture-only SC-like combined A/V
  scaffold under `packages/adapters/stripchat`.
- Added `docs/ADAPTER_SITE_READINESS.md` as the practical adapter bring-up
  checklist.
- Added runtime catalog handoff from `CoreRuntime` through `CoreGuiService` into
  `runOfflineFixtureCapture`.
- Added offline capture preflight gating for unregistered adapters, unsupported
  modes, missing capabilities, and fixture-not-ready manifests.
- TDD RED/GREEN:
  - readiness API missing -> added testkit readiness gate;
  - messages after `adapter.finished` accepted -> rejected as
    `adapter_readiness.message_after_finished`;
  - duplicate `adapter.ready` accepted -> rejected as
    `adapter_readiness.duplicate_ready`;
  - secret-looking diagnostic field names accepted -> rejected as
    `adapter_readiness.secret_reference`;
  - adapter catalog missing -> added manifest/schema/catalog boundary;
  - Stripchat package missing -> added fixture-only combined A/V scaffold;
  - overlapping Stripchat media segments accepted -> rejected overlap/backwards
    timing;
  - non-contiguous Stripchat media segments lacked gap facts -> emitted
    `media.gap.detected`;
  - unregistered adapter task consumed messages -> failed preflight before
    startup with `adapter.catalog.unregistered`.
- Targeted readiness/catalog/adapter-gate/Stripchat tests passed.
- `pnpm typecheck` passed.
- Full verification passed:
  - `pnpm typecheck`
  - `pnpm test` passed 23 files and 100 tests;
  - `pnpm build`
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
  - `git diff --check`
  - trailing whitespace scan
  - JSON/package config parse scan parsed 26 JSON files.

## Blockers

- None.
