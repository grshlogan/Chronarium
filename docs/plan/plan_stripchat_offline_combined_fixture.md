# Plan: Stripchat Offline Combined Fixture

## Objective

Add the first non-Chaturbate site adapter scaffold using the adapter readiness
gate: a fixture-only Stripchat/SC-like adapter package with a synthetic combined
audio/video media-track fixture.

This does not connect to Stripchat, does not perform live polling, does not
download media, and does not handle accounts, cookies, headers, tokens,
sessions, signed URLs, or private room data.

## Scope

- Add `packages/adapters/stripchat`.
- Export a fixture-only adapter manifest for the core adapter catalog.
- Add a synthetic combined A/V fixture model.
- Convert that fixture into media track metadata and timeline facts.
- Emit those facts through an adapter protocol fixture runner.
- Prove the fixture stream passes `verifyAdapterFixtureReadiness`.
- Prove the manifest can be registered by `createAdapterCatalog`.

## Current Facts

- Chaturbate is the first fixture adapter and models split audio/video.
- The adapter readiness gate and core adapter catalog now exist.
- The media lifecycle design explicitly allows SC-like combined A/V to be
  represented as one raw media track.

## Constraints

- No network requests.
- No live Stripchat behavior.
- No account/session/cookie/header/token handling.
- No real media.
- Synthetic fixtures only.

## Execution Plan

1. RED/GREEN: add a test proving the Stripchat synthetic fixture produces one
   combined media track and timeline facts.
2. RED/GREEN: add a test proving the Stripchat fixture stream passes adapter
   readiness and catalog registration.
3. Implement the package with the smallest fixture parser/runner needed.
4. Wire the package into workspace references and test aliases.
5. Update docs and A01 context.

## Verification

Expected checks:

- targeted Stripchat adapter tests;
- targeted adapter readiness/catalog tests;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.

## Progress / Decisions

- Added `packages/adapters/stripchat` as a fixture-only package.
- Added `STRIPCHAT_ADAPTER_MANIFEST` with `runtimeModes: ["fixture"]`,
  `networkAccess: "none"`, `requiresCredentials: false`, and
  `emitsSensitiveSourceFields: false`.
- Added `combined-av.synthetic.json` as a synthetic SC-like combined
  audio/video HLS fixture.
- Added parser/builders for one combined media track and timeline facts.
- Added `runStripchatFixture`, which emits `adapter.ready`, `fact.timeline`
  messages, and terminal `adapter.finished`.
- Added gap behavior: non-contiguous combined media segments emit
  `media.gap.detected`.
- Added segment timing guard: overlapping or backwards combined media segments
  are rejected.
- Added cross-package TDD coverage under
  `tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts`.
- Added workspace project reference and Vitest source alias for
  `@chronarium/adapter-stripchat`.
- Targeted Stripchat fixture tests passed.
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
