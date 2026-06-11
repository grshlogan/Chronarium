# Conversation A01: Documentation And Initial Skeleton

## Topic

A01 covers the first Chronarium setup conversation: documentation writing,
initial TypeScript workspace skeleton, license selection, runtime schema
foundation, and the first archive package code.

## Current Status

Chronarium now has:

- project identity and architecture docs;
- Apache-2.0 license;
- pnpm workspace and TypeScript project references;
- package boundaries for `types`, `schemas`, `archive`, `core`,
  `adapters/chaturbate`, and `testkit`;
- Zod runtime schemas for the first shared contracts;
- a fixture-safe archive writer for synthetic `.chron` packages;
- a fixture-safe archive reader/validator for `manifest.json` and
  `timeline.jsonl`;
- two archive behavior test files covering writer, reader, and validator paths;
- a rebuildable SQLite indexer package for synthetic archive metadata,
  timeline events, and validation issues;
- archive writer append-time invariants for manifest ordering, session match,
  sequence continuity, duplicate event IDs, and finalization;
- indexer rebuild, removal, clear, and filtered query contracts.
- fixture-safe media-track metadata IO for `tracks/<track-id>/track.json`;
- archive reader/validator support for manifest-declared media track metadata.
- a first core archive index service that coordinates archive validation,
  archive reading, and rebuildable SQLite indexing.
- a minimal core runtime lifecycle shell for start/stop/health and archive
  index service ownership.
- a maintenance / ops inspection design draft with external project references.
- a CB recording reference design doc covering public GitHub projects and
  split audio/video LL-HLS/CMAF lessons.

The current A01 continuation added archive reader/validator foundations before
any real site adapter work.

The A01 continuation also added a minimal rebuildable SQLite index package that
derives rows from synthetic `.chron` archives.

The active follow-up moved basic timeline append invariants into the archive
writer so Chronarium-generated archives avoid preventable timeline errors.

The active follow-up added a maintenance / ops design draft.

The active follow-up also added a CB recording reference design document before
any live CB adapter work.

## Active Constraints

- Work only inside `D:\live\Chronarium`.
- Do not touch sibling recorder projects.
- Do not connect to real livestream sites.
- Do not add Chaturbate account, cookie, header, session, or download logic.
- Do not commit secrets, signed URLs, real media, private room details, or
  personal data.
- Keep docs honest about implemented versus planned behavior.
- Manual file edits should use `apply_patch`.
- Update `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, and
  `docs/AI_CHANGE_INDEX.md` after structural changes.

## Decisions So Far

- Chronarium is a local-first archive/replay platform, not a plain recorder.
- The primary artifact is a replayable `.chron` session archive.
- TypeScript is the primary implementation language.
- Runtime validation uses Zod.
- Package manager is pinned to `pnpm@11.5.3`.
- License is Apache-2.0.
- Chaturbate work remains fixture-first until archive and timeline foundations
  are stronger.

## Files In Scope For This Continuation

Expected code changes:

- none; this continuation is documentation design only.

Expected documentation changes:

- `docs/conversation-A01-documentation-and-initial-skeleton.md`
- `docs/CB_RECORDING_REFERENCES.md`
- `docs/plan/plan_cb_recording_references.md`
- `docs/APP_CODE_MAP.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`
- `README.md`

## Verification Log

Previous A01 verification:

- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `git diff --check`: passed.
- trailing whitespace scan: passed.
- JSON/package config parse scan: passed.

This continuation should rerun the smallest useful checks after changes:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- trailing whitespace scan
- JSON/package config parse scan

Checks already run during this continuation:

- `pnpm typecheck`: passed after adding reader/validator.
- `pnpm test`: passed 2 Vitest files and 9 tests.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON/package config parse scan: succeeded.
- `pnpm typecheck`: passed after adding `packages/indexer`.
- `pnpm test`: passed 3 Vitest files and 12 tests after adding
  `packages/indexer`.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed after adding `packages/indexer`.
- `git diff --check`: produced no output after SQLite indexer docs updates.
- trailing whitespace scan: produced no output after SQLite indexer docs
  updates.
- JSON/package config parse scan: succeeded after adding `packages/indexer`.
- `pnpm typecheck`: passed after archive writer timeline invariants.
- targeted archive writer and indexer tests: passed.
- `pnpm test`: passed 3 Vitest files and 17 tests after archive writer
  timeline invariants.
- `pnpm build`: passed after archive writer timeline invariants.
- `git diff --check`: produced no output after archive writer timeline
  invariants.
- trailing whitespace scan: produced no output after archive writer timeline
  invariants.
- JSON/package config parse scan: succeeded after archive writer timeline
  invariants.
- `pnpm typecheck`: passed after index rebuild/query contracts.
- `pnpm test`: passed 3 Vitest files and 21 tests after index rebuild/query
  contracts.
- `pnpm build`: passed after index rebuild/query contracts.
- `git diff --check`: produced no output after index rebuild/query contracts.
- trailing whitespace scan: produced no output after index rebuild/query
  contracts.
- JSON/package config parse scan: succeeded after index rebuild/query
  contracts.
- `pnpm exec vitest run packages/archive/tests`: passed 2 files and 21 tests
  after media-track archive metadata IO.
- First `pnpm typecheck` during media-track work failed because TypeScript did
  not narrow an optional union in `validator.ts`; fixed with explicit
  `"issue" in metadataPath` guards.
- `pnpm typecheck`: passed after media-track archive metadata IO.
- `pnpm test`: passed 3 Vitest files and 28 tests after media-track archive
  metadata IO.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed after media-track archive metadata IO.
- `git diff --check`: produced no output after media-track archive metadata IO.
- trailing whitespace scan: produced no output after media-track archive
  metadata IO.
- JSON/package config parse scan: succeeded after media-track archive metadata
  IO.
- `pnpm exec vitest run packages/core/tests`: passed 1 file and 2 tests after
  core archive/index service.
- First `pnpm typecheck` during core service work failed because tests were
  included in the package `tsconfig` while `rootDir` was `src`; fixed by keeping
  package typecheck focused on `src`.
- Untracked generated files appeared under package source/test folders after
  check runs; removed only the explicit generated files.
- `pnpm typecheck`: passed after core archive/index service.
- `pnpm test`: passed 4 Vitest files and 30 tests after core archive/index
  service.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed after core archive/index service.
- `git diff --check`: produced no output after core archive/index service.
- trailing whitespace scan: produced no output after core archive/index
  service.
- JSON/package config parse scan: succeeded after core archive/index service.
- `pnpm exec vitest run packages/core/tests`: passed 2 files and 4 tests after
  core runtime lifecycle shell.
- `pnpm typecheck`: passed after core runtime lifecycle shell.
- `pnpm test`: passed 5 Vitest files and 32 tests after core runtime lifecycle
  shell.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed after core runtime lifecycle shell.
- `git diff --check`: produced no output after core runtime lifecycle shell.
- trailing whitespace scan: produced no output after core runtime lifecycle
  shell.
- JSON/package config parse scan: succeeded after core runtime lifecycle shell.
- `git diff --check`: produced no output after maintenance / ops design draft.
- trailing whitespace scan: produced no output after maintenance / ops design
  draft.
- JSON/package config parse scan: succeeded after maintenance / ops design
  draft.
- `git diff --check`: produced no output after CB recording references.
- trailing whitespace scan: produced no output after CB recording references.
- JSON/package config parse scan: succeeded after CB recording references.

## Next Safe Step

Add offline split audio/video CB-like fixtures and schema drafts, implement the
first deterministic maintenance inspection types under core, or add archive
recovery behavior for interrupted metadata writes.
