# Plan: Shared Adapter Kit For Fixture Safety And Parsing

## Objective

Extract the fixture-safety and fixture-parsing helpers that are currently
copy-pasted inside each site adapter into one shared, tested package
`@chronarium/adapter-kit`. This removes the per-adapter drift risk in the
security-relevant synthetic-reference and sensitive-string checks before more
site adapters are added during fixture-first bring-up.

This is a behavior-preserving refactor. It does not connect to live sites, poll
real rooms, download media, handle credentials, change timeline fact shapes, or
change adapter manifests.

## Motivation

The A02 foundation review (see
`docs/conversation-A02-foundation-docs-completion.md`, Phase 2, finding P0-3)
found that the security-relevant helpers `assertSyntheticFixtureReference` and
`assertNoSensitiveFixtureStrings`, plus the whole `expect*` parsing family, are
duplicated in both `packages/adapters/chaturbate/src/splitTrackFixture.ts` and
`packages/adapters/stripchat/src/combinedFixture.ts`, and have already begun to
diverge. Every new site adapter would copy them again, drifting the fixture
safety net. They belong in one source of truth.

## Scope

In scope:

- Add `packages/adapters/kit` exporting `@chronarium/adapter-kit`.
- Provide shared fixture-safety guards:
  - `assertSyntheticFixtureReference(reference, path, expectedPrefix)`;
  - `assertNoSensitiveFixtureStrings(value, path)`.
- Provide the shared fixture-parsing primitives: `expectRecord`, `expectArray`,
  `expectOptionalArray`, `expectString`, `optionalStringProperty`,
  `expectJsonObject`, `expectJsonValue`, `expectNumber`, `expectOptionalNumber`,
  `expectNonNegativeInteger`, `expectPositiveInteger`.
- Converge `packages/adapters/chaturbate` and `packages/adapters/stripchat` onto
  the kit, deleting their local copies.
- Wire the package into `pnpm-workspace.yaml` (already globbed), root
  `tsconfig.json` references, `tsconfig.base.json` paths, and
  `vitest.config.ts` aliases.
- Add TDD coverage under `tdd-tests/packages/adapters/kit/`.

Out of scope (deferred to later rounds):

- The duplicated fact-builders `createSyntheticSource` and
  `createFixtureTimelineEvent` stay in each adapter for now. They are reshaped
  when per-family timeline payload schemas land (audit finding P0-1, P0-2), so
  moving them here first would cause churn. They remain a known duplication.
- No new timeline payload schemas, no new fact families, no manifest changes.

## Key Decisions

- Package id `@chronarium/adapter-kit`, located at `packages/adapters/kit` to
  sit beside the site adapter packages and match the existing
  `packages/adapters/*` workspace glob.
- `assertSyntheticFixtureReference` takes the site prefix as an explicit third
  argument rather than hard-coding a site. Each adapter keeps its own
  `*_SYNTHETIC_REFERENCE_PREFIX` constant and passes it. This reproduces both
  adapters' existing error messages exactly (the message embeds the prefix).
- The shared helpers are a verbatim behavior-preserving union of the two current
  implementations. The two `assertSyntheticFixtureReference` bodies are
  identical except the prefix; the `expect*` family is identical;
  `assertNoSensitiveFixtureStrings` currently exists only in chaturbate and is
  moved unchanged.
- The kit depends only on `@chronarium/types` (for `JsonObject`/`JsonValue`).

## Behavior That Must Stay Green

- `parseChaturbateSplitTrackFixture` still throws `/fixture:\/\/chaturbate/` for
  a raw network reference and `/query strings/` for a query-string reference
  (`packages/adapters/chaturbate/tests/splitTrackFixture.test.ts`).
- Stripchat fixture parsing, overlap rejection, gap facts, readiness, and
  catalog registration are unchanged
  (`tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts`).
- The full existing suite stays green; it is the regression net for the moved
  `expect*` primitives.

## Constraints

- No live site connection, no real media, no credentials/cookies/headers/tokens.
- TDD: one behavior at a time; RED before GREEN; refactor only while green.
- Preserve every existing thrown error message and validation outcome.

## Verification

Expected checks:

- targeted `tdd-tests/packages/adapters/kit/` tests;
- regression: chaturbate + stripchat adapter tests;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`;
- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.

## Progress / Decisions

- Added `@chronarium/adapter-kit` at `packages/adapters/kit` with
  `fixtureSafety.ts` (`assertSyntheticFixtureReference`,
  `assertNoSensitiveFixtureStrings`) and `fixtureParse.ts` (the `expect*` and
  `optionalStringProperty` primitives).
- `assertSyntheticFixtureReference(reference, path, expectedPrefix)` takes the
  prefix as an argument; each adapter passes its own
  `*_SYNTHETIC_REFERENCE_PREFIX`, preserving existing error messages.
- Converged `packages/adapters/chaturbate/src/splitTrackFixture.ts` and
  `packages/adapters/stripchat/src/combinedFixture.ts` onto the kit and deleted
  their local helper copies. The site-specific `parse*`, `createSyntheticSource`,
  `createFixtureTimelineEvent`, `parseDiagnostic*`, and `assertSegmentsAreOrdered`
  functions stay local.
- Wired the package into `pnpm-workspace.yaml` (already globbed),
  `tsconfig.base.json` paths, root `tsconfig.json` references,
  `vitest.config.ts` aliases, and each adapter's `package.json`/`tsconfig.json`.
- TDD RED→GREEN: `tdd-tests/packages/adapters/kit/adapterKitFixtureGuards.test.ts`
  first failed with `Cannot find package '@chronarium/adapter-kit'`, then passed
  after the package and wiring were added; expanded to 9 kit tests.
- Verification:
  - `pnpm install`, `pnpm typecheck`, `pnpm build` passed.
  - `pnpm test` passed 27 files and 117 tests (was 26 files / 108 tests);
    all existing adapter regression tests stayed green, confirming the move is
    behavior-preserving.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
  - `git diff --check` clean after normalizing two EOF newlines; trailing
    whitespace scan clean.
  - Confirmed no moved helper remains locally defined in either adapter.
- Deferred to Round 2: per-family timeline payload schemas and reconciling the
  `media.segment` fact shape; the fact-builders move then.

## Blockers

- None.
