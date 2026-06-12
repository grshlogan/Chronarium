# AI Change Index

This document records AI-assisted conversations that land structural changes in
Chronarium. Keep entries factual, short, and ordered by date. Do not record
unimplemented ideas as completed work.

## Entry Format

```text
## YYYY-MM-DD: Short title

- Conversation: brief context.
- Landed: files or behavior changed.
- Decisions: architecture or product decisions made.
- Verification: commands or checks run.
- Next: immediate follow-up.
```

## 2026-06-11: Project identity and documentation foundation

- Conversation: CTB Recorder maintenance discussion produced a new independent
  platform direction after identifying that per-site media logic, hot
  maintenance, and perfect replay goals no longer fit a unified recorder model.
- Landed: initial Chronarium documentation framework under `D:\live\Chronarium`.
- Files:
  - `README.md`
  - `AGENTS.md`
  - `docs/CONTEXT.md`
  - `docs/ARCHITECTURE.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/plan/README.md`
- Decisions:
  - Product name is `Chronarium`.
  - Core purpose is livestream fact preservation and replay, not plain A/V
    recording.
  - Default stack is TypeScript-first: Electron + React GUI, Node.js core,
    isolated TypeScript site adapters, JSONL fact logs, SQLite index, FFmpeg
    typed command builders.
  - Initial site priority is Chaturbate only after archive/timeline foundations
    exist.
  - AI maintainability is a first-class design requirement.
- Verification: documentation files were created and should be inspected
  directly; no code checks exist yet.
- Next: choose license and package manager, initialize Git when approved, then
  scaffold the TypeScript workspace.

## 2026-06-11: Workspace and schema foundation

- Conversation: continued Chronarium project setup, with user-provided GitHub
  target `https://github.com/grshlogan/Chronarium.git` and permission to make a
  first version commit when appropriate.
- Landed: product and v1 contract documents, root workspace files, `.gitignore`,
  `.gitattributes`, and minimal TypeScript package skeletons.
- Files:
  - `README.md`
  - `.gitattributes`
  - `.gitignore`
  - `package.json`
  - `pnpm-workspace.yaml`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/TIMELINE_SCHEMA_V1.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/SECURITY_PRIVACY.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/plan/plan_workspace_schema_foundation.md`
  - `packages/types/`
  - `packages/schemas/`
  - `packages/archive/`
  - `packages/core/`
  - `packages/adapters/chaturbate/`
  - `packages/testkit/`
- Decisions:
  - First code boundary is schema-first and fixture-first.
  - `packages/types` owns shared DTOs for sessions, media, timeline, archive,
    and adapter protocol.
  - `packages/schemas` starts with schema descriptors only; runtime validation
    is still pending.
  - `packages/archive` exposes layout constants and writer contracts only.
  - `packages/core` exposes a runtime contract skeleton only.
  - `packages/adapters/chaturbate` is synthetic fixture mode only and does not
    connect to Chaturbate.
  - No license was added because the user has not chosen one.
- Verification:
  - `rg --files` listed expected files.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - JSON parse scan with `ConvertFrom-Json` succeeded for all package and
    TypeScript config JSON files.
  - `Test-Path .git` returned `git-absent` before repository initialization.
  - `git --version` returned `git version 2.52.0.windows.1`.
  - `.gitattributes` was added to normalize text files to LF.
  - `git init -b main` initialized the repository on `main`.
  - `git diff --cached --check` passed after trimming extra blank lines at EOF.
  - Dependency install, package-manager tests, typecheck, lint, and build were
    not run.
- Next: choose a license, install exact development dependencies, add runtime
  schema validation, and implement a synthetic-fixture archive writer.

## 2026-06-11: Apache-2.0 license

- Conversation: user accepted the recommendation to license Chronarium under
  Apache-2.0.
- Landed: added the standard Apache License 2.0 text, root package license
  metadata, and documentation updates.
- Files:
  - `LICENSE`
  - `package.json`
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/plan/plan_license_apache_2.md`
- Decisions:
  - Project license is Apache-2.0.
  - Future license changes require explicit user direction.
- Verification:
  - `package.json` parsed successfully and reports `license: Apache-2.0`.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - `git diff --check` produced no output before staging.
- Next: install exact development dependencies, add runtime schema validation,
  and implement a synthetic-fixture archive writer.

## 2026-06-11: Runtime schema and synthetic archive fixture

- Conversation: continued from the foundation work to make the first validation
  chain executable.
- Landed: installed minimal dependencies, added Zod runtime schemas, implemented
  a fixture-safe archive writer, and added a Vitest behavior test for writing a
  synthetic `.chron` package.
- Files:
  - `package.json`
  - `pnpm-lock.yaml`
  - `vitest.config.ts`
  - `tsconfig.base.json`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/plan/plan_runtime_schema_archive_fixture.md`
  - `packages/types/`
  - `packages/schemas/`
  - `packages/archive/`
  - `packages/core/`
  - `packages/adapters/chaturbate/`
  - `packages/testkit/`
- Decisions:
  - Runtime validation uses Zod.
  - Root package manager is pinned to `pnpm@11.5.3`.
  - The first archive writer is fixture-safe and local-only; it does not handle
    real media, recovery, migrations, SQLite, FFmpeg, or real site capture.
- Verification:
  - `pnpm typecheck` passed across all workspace packages.
  - `pnpm test` passed 1 Vitest file and 1 test.
  - `pnpm build` passed across all workspace packages.
  - `git diff --check` produced no output.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - JSON parse scan with `ConvertFrom-Json` succeeded for all package and
    TypeScript config JSON files.
- Next: add archive reader/validator and timeline ordering tests before any
  real adapter work.

## 2026-06-11: Archive reader and validator foundation

- Conversation: user asked to establish an A01 conversation context maintenance
  document and continue the foundation work.
- Landed: added a conversation context hard rule to `AGENTS.md`, created the
  A01 conversation context document, added a reader/validator plan, implemented
  fixture-safe archive reading and validation for `manifest.json` and
  `timeline.jsonl`, and added behavior tests.
- Files:
  - `AGENTS.md`
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_archive_reader_validator.md`
  - `packages/archive/src/layout.ts`
  - `packages/archive/src/writer.ts`
  - `packages/archive/src/reader.ts`
  - `packages/archive/src/validator.ts`
  - `packages/archive/src/index.ts`
  - `packages/archive/tests/archiveReaderValidator.test.ts`
- Decisions:
  - Non-trivial conversations must maintain a factual context document under
    `docs/conversation-<conversation-id>-<short-english-slug>.md`.
  - `validateFileArchive` returns a diagnostic report and can collect multiple
    issues.
  - `readFileArchive` is strict and throws when validation fails.
  - The first reader/validator scope is manifest and timeline only.
- Verification:
  - `pnpm typecheck` passed across all workspace packages.
  - `pnpm test` passed 2 Vitest files and 9 tests.
  - `pnpm build` passed across all workspace packages.
  - `git diff --check` produced no output.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - JSON parse scan with `ConvertFrom-Json` succeeded for all package and
    TypeScript config JSON files.
- Next: consider a minimal SQLite index from synthetic archives or more
  timeline append/order tests.

## 2026-06-11: SQLite indexer foundation

- Conversation: user approved continuing after discussing why SQLite exists as
  a rebuildable index/cache rather than an archive truth source.
- Landed: added `@chronarium/indexer`, a first SQLite schema, archive indexing
  from synthetic `.chron` packages, query APIs, and behavior tests.
- Files:
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_sqlite_index_foundation.md`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `pnpm-lock.yaml`
  - `packages/indexer/`
- Decisions:
  - SQLite remains a rebuildable index/cache, not the source of replay truth.
  - The first schema stores archive rows, timeline event rows, and validation
    issue rows.
  - Invalid archives can still be indexed for diagnostics; duplicate event IDs
    are stored as rows and reported through validation issues.
  - The first implementation uses Node.js built-in `node:sqlite` behind
    `@chronarium/indexer`; it currently emits an ExperimentalWarning.
- Verification:
  - `pnpm typecheck` passed across all workspace packages.
  - `pnpm test` passed 3 Vitest files and 12 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed across all workspace packages.
  - `git diff --check` produced no output.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - JSON parse scan with `ConvertFrom-Json` succeeded for all package and
    TypeScript config JSON files.
- Next: add rebuild/clear/query contracts or timeline append/order tests.

## 2026-06-11: Archive writer timeline invariants

- Conversation: after pushing the SQLite indexer commit, continued with
  writer-side timeline correctness checks.
- Landed: archive writer now rejects appends before manifest write,
  cross-session events, non-contiguous sequences, duplicate event IDs, and
  appends after finalization. Indexer invalid-archive tests now use manual bad
  fixtures rather than writer-generated invalid packages.
- Files:
  - `README.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_archive_writer_timeline_invariants.md`
  - `packages/archive/src/writer.ts`
  - `packages/archive/tests/syntheticArchiveWriter.test.ts`
  - `packages/indexer/tests/archiveIndexer.test.ts`
- Decisions:
  - Writer invariants prevent Chronarium-generated archives from creating
    avoidable timeline errors.
  - Validator/indexer diagnostics still handle corrupted, external, or manually
    crafted bad archives.
- Verification:
  - `pnpm typecheck` passed across all workspace packages.
  - Targeted archive writer and indexer tests passed.
  - `pnpm test` passed 3 Vitest files and 17 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed across all workspace packages.
  - `git diff --check` produced no output.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - JSON parse scan with `ConvertFrom-Json` succeeded for all package and
    TypeScript config JSON files.
- Next: continue with index rebuild/query contracts or media-track archive IO
  planning.

## 2026-06-11: Indexer rebuild and query contracts

- Conversation: after pushing writer timeline invariants, continued with the
  SQLite indexer's rebuild and query boundaries.
- Landed: added explicit reindex, archive removal, clear-all, and filtered
  archive/timeline/validation-issue query contracts.
- Files:
  - `README.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_indexer_rebuild_query_contracts.md`
  - `packages/indexer/src/archiveIndexer.ts`
  - `packages/indexer/tests/archiveIndexer.test.ts`
- Decisions:
  - Reindexing is explicit and replaces stale rows derived from an archive.
  - Archive removal and clear-all operate only on the rebuildable SQLite index.
  - Query filters are fixed, parameterized fields rather than arbitrary SQL.
- Verification:
  - `pnpm typecheck` passed across all workspace packages.
  - `pnpm test` passed 3 Vitest files and 21 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed across all workspace packages.
  - `git diff --check` produced no output.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - JSON parse scan with `ConvertFrom-Json` succeeded for all package and
    TypeScript config JSON files.
- Next: plan media-track archive IO or core integration.

## 2026-06-11: Media-track archive metadata IO

- Conversation: user approved starting the next stage after the indexer rebuild
  and query contracts landed.
- Landed: added fixture-safe media-track metadata write/read/validation behavior
  for `.chron` archives.
- Files:
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_media_track_archive_io.md`
  - `packages/testkit/src/fixtures.ts`
  - `packages/archive/src/layout.ts`
  - `packages/archive/src/writer.ts`
  - `packages/archive/src/reader.ts`
  - `packages/archive/src/validator.ts`
  - `packages/archive/tests/syntheticArchiveWriter.test.ts`
  - `packages/archive/tests/archiveReaderValidator.test.ts`
- Decisions:
  - Track metadata lives at `tracks/<track-id>/track.json`.
  - Future media files belong under `tracks/<track-id>/segments/`.
  - The current stage writes only synthetic metadata and empty segment
    directories, not real media segments.
  - Reader snapshots now expose validated `mediaTracks`.
  - Validator reports missing, invalid, unsafe, or manifest-mismatched track
    metadata.
- Verification:
  - `pnpm exec vitest run packages/archive/tests` passed 2 files and 21 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 3 files and 28 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
- Next: plan `packages/indexer` integration with `packages/core`, or add
  recovery behavior for interrupted archive metadata writes.

## 2026-06-11: Core archive/index service

- Conversation: user asked to continue work, push when appropriate, and report
  simply.
- Landed: added the first `packages/core` service that coordinates archive
  validation, archive reading, SQLite reindexing, and index queries.
- Files:
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_core_archive_index_service.md`
  - `packages/core/package.json`
  - `packages/core/tsconfig.json`
  - `packages/core/src/index.ts`
  - `packages/core/src/archiveIndexService.ts`
  - `packages/core/tests/archiveIndexService.test.ts`
  - `pnpm-lock.yaml`
- Decisions:
  - Core delegates validation and reading to `packages/archive`.
  - Core delegates indexing and query storage to `packages/indexer`.
  - This is not a full core runtime and does not start adapters, capture jobs,
    GUI, FFmpeg, or real media work.
- Verification:
  - `pnpm exec vitest run packages/core/tests` passed 1 file and 2 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 4 files and 30 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
- Next: add a minimal core runtime lifecycle shell around the core service, or
  add archive recovery behavior for interrupted metadata writes.

## 2026-06-11: Core runtime lifecycle shell

- Conversation: user described Chronarium's future direction as a local
  full-auto software with AI-style maintenance and asked to continue.
- Landed: implemented a minimal `packages/core` runtime lifecycle shell.
- Files:
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_core_runtime_lifecycle_shell.md`
  - `packages/core/src/runtime.ts`
  - `packages/core/tests/runtime.test.ts`
- Decisions:
  - `createCoreRuntime` now creates a local runtime that can start, stop, and
    report health.
  - `createCoreRuntimeContract` remains as a compatibility alias.
  - Runtime startup creates local data/archive directories, opens the
    rebuildable SQLite index, and exposes the archive/index service.
  - Runtime still does not start adapters, capture jobs, FFmpeg, GUI, ops loops,
    or real media work.
- Verification:
  - `pnpm exec vitest run packages/core/tests` passed 2 files and 4 tests.
  - `pnpm typecheck` passed.
- Next: design the maintenance / ops inspection model with deterministic checks
  first, or add archive recovery behavior for interrupted metadata writes.

## 2026-06-11: Maintenance ops design draft

- Conversation: user asked to look at GitHub projects that could inform a
  local always-on AI-style operations layer, then asked to consolidate the
  findings into a design document with project references.
- Landed: added a maintenance / ops design draft and linked it from the docs.
- Files:
  - `README.md`
  - `docs/MAINTENANCE_OPS_DESIGN.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_maintenance_ops_design.md`
- References:
  - Uptime Kuma
  - Healthchecks
  - Netdata
  - Beszel
  - OpenTelemetry Collector
  - Alerta
  - changedetection.io
  - Watchtower
  - Gotify
  - Home Assistant Core
  - OpenHands
  - Aider
  - Open Interpreter
- Decisions:
  - Chronarium maintenance starts with deterministic inspection, not LLM calls.
  - AI reasoning should later consume structured reports and approved tools.
  - Safe automatic actions are limited to rebuildable derived artifacts, such as
    SQLite indexes.
  - Destructive changes, migrations, real media probing, adapter live capture,
    and arbitrary shell execution remain outside automatic maintenance.
- Verification:
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
- Next: implement first deterministic maintenance inspection types and archive
  inspector under core.

## 2026-06-12: CB recording references

- Conversation: user asked whether GitHub has projects close to Chronarium,
  especially Chaturbate-style split audio/video recording projects, and asked
  to add the reference document.
- Landed: added a CB recording reference design document and linked it from the
  docs.
- Files:
  - `README.md`
  - `docs/CB_RECORDING_REFERENCES.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_cb_recording_references.md`
- References:
  - `Despernal/Recordurbate-Docker`
  - `KFERMercer/ctbcap`
  - `lossless1024/StreaMonitor`
  - `nilaoda/N_m3u8DL-RE`
  - `raccommode/P-StreamRec`
  - `teacat/chaturbate-dvr`
  - `oliverjrose99/Recordurbate`
- Decisions:
  - Future CB work should preserve split-track facts and mux diagnostics.
  - A final video file is a derived artifact, not the only archive truth.
  - `N_m3u8DL-RE` is a future external-tool candidate, not an approved
    dependency yet.
  - CB work stays fixture-first and offline before any real capture.
- Verification:
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
- Next: add offline split audio/video fixtures and schema drafts, or implement
  deterministic maintenance inspection types under core.

## 2026-06-12: Foundation docs completion

- Conversation: the user reviewed the project state, decided the early phase
  should prioritize documentation completeness over new code, and asked to
  fill the documentation gaps identified during the review (A02).
- Landed: five new documents, a plan document, an A02 conversation context
  document, and index updates. Documentation only; no code changes.
- Files:
  - `docs/REPLAY_MODEL_V1.md`
  - `docs/GUI_CORE_PROTOCOL.md`
  - `docs/DIAGNOSTIC_CODES_V1.md`
  - `docs/MEDIA_TOOLS_BOUNDARY.md`
  - `docs/plan/plan_archive_recovery.md`
  - `docs/plan/plan_foundation_docs_completion.md`
  - `docs/conversation-A02-foundation-docs-completion.md`
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
- Decisions:
  - Replay semantics are a versioned contract; replay is the primary consumer
    of `.chron` packages and constrains storage design.
  - The GUI/core edge gets a protocol document mirroring
    `docs/ADAPTER_PROTOCOL.md`; transport choice stays deferred.
  - Validation issue codes are a documented registry treated as a storage
    contract; a `protocol.*` reserved area was added for GUI/core protocol
    errors.
  - Media tool rules were promoted from `docs/CB_RECORDING_REFERENCES.md`
    into a standalone boundary contract; `media.mux.*` is a proposed new
    event family that must be reserved in `docs/TIMELINE_SCHEMA_V1.md`
    before first use.
  - Archive recovery starts as a plan; all repair operations are Level 2
    (explicit user confirmation) under the maintenance action safety levels;
    the writing/finalized marker mechanism is intentionally undecided.
- Verification:
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
  - New docs verified to use LF endings and end with a single newline.
  - Regression guard on unchanged code: `pnpm typecheck` passed,
    `pnpm test` passed 5 Vitest files and 32 tests, `pnpm build` passed.
- Next: add offline Chaturbate adapter fixtures and tests, or implement
  archive recovery following `docs/plan/plan_archive_recovery.md`.

## 2026-06-12: Chaturbate offline split-track fixture

- Conversation: after pushing the A02 foundation docs, user asked to continue
  with Chaturbate adapter offline fixtures and tests.
- Landed: added a synthetic CB-like split audio/video fixture, adapter-local
  fixture parser/builders, and behavior tests.
- Files:
  - `README.md`
  - `docs/TIMELINE_SCHEMA_V1.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A03-chaturbate-offline-fixtures.md`
  - `docs/plan/plan_chaturbate_offline_split_fixture.md`
  - `packages/adapters/chaturbate/fixtures/README.md`
  - `packages/adapters/chaturbate/fixtures/split-audio-video.synthetic.json`
  - `packages/adapters/chaturbate/src/index.ts`
  - `packages/adapters/chaturbate/src/splitTrackFixture.ts`
  - `packages/adapters/chaturbate/tests/splitTrackFixture.test.ts`
- Decisions:
  - The first CB adapter test uses synthetic JSON only.
  - Fixture source references must use `fixture://chaturbate/...`.
  - Network-looking playlist references and token-bearing query strings are
    rejected before timeline facts are built.
  - The fixture emits `media.track.topology_observed`,
    `media.track.discovered`, and `media.segment.observed` facts.
- Verification:
  - `pnpm exec vitest run packages/adapters/chaturbate/tests` passed 1 file
    and 3 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 6 files and 35 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON parse scan succeeded.
- Next: write the split-track fixture into a synthetic `.chron` archive and
  verify archive reader/indexer consumption.

## 2026-06-12: Chaturbate fixture archive flow

- Conversation: user chose to skip upload/retention complexity for now and
  continue with the next valuable foundation step.
- Landed: added a test proving the synthetic Chaturbate split-track fixture can
  be written into `.chron`, validated/read back, and indexed into SQLite.
- Files:
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A03-chaturbate-offline-fixtures.md`
  - `docs/plan/plan_chaturbate_fixture_archive_flow.md`
  - `packages/adapters/chaturbate/tests/splitTrackArchiveFlow.test.ts`
- Decisions:
  - The test stays under the Chaturbate adapter package because it verifies
    the adapter fixture's offline path through archive and indexer consumers.
  - The test uses only synthetic media track metadata and timeline facts; it
    does not write real media segments.
  - Upload and retention policy work remains deferred.
- Verification:
  - `pnpm exec vitest run packages/adapters/chaturbate/tests` passed 2 files
    and 4 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 7 files and 36 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON parse scan succeeded.
- Next: add offline Chaturbate diagnostic fixtures for missing audio, duration
  mismatch, stalled output, and reconnect/gap scenarios, or implement archive
  recovery report-only detection.
