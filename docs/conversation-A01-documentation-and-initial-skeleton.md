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

The current A01 continuation added archive reader/validator foundations before
any real site adapter work.

The A01 continuation also added a minimal rebuildable SQLite index package that
derives rows from synthetic `.chron` archives.

The active follow-up moved basic timeline append invariants into the archive
writer so Chronarium-generated archives avoid preventable timeline errors.

The active follow-up is now clarifying `packages/indexer` rebuild, removal,
clear, and filtered query contracts.

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

- `packages/archive/src/reader.ts`
- `packages/archive/src/validator.ts`
- `packages/archive/src/index.ts`
- `packages/archive/tests/*`
- `packages/archive/src/layout.ts`
- `packages/archive/src/writer.ts`
- `packages/indexer/*`

Expected documentation changes:

- `AGENTS.md`
- `docs/conversation-A01-documentation-and-initial-skeleton.md`
- `docs/plan/plan_archive_reader_validator.md`
- `docs/plan/plan_sqlite_index_foundation.md`
- `docs/plan/plan_archive_writer_timeline_invariants.md`
- `docs/plan/plan_indexer_rebuild_query_contracts.md`
- `docs/APP_CODE_MAP.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`
- possibly `docs/ARCHIVE_FORMAT_V1.md` and `docs/DEVELOPMENT_SETUP.md`

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

## Next Safe Step

Continue with either media-track archive IO planning or `packages/indexer`
integration with `packages/core`.
