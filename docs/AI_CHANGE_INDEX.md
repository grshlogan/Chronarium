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
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
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
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
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

## 2026-06-12: Chaturbate offline diagnostic fixtures

- Conversation: user asked to continue after deferring upload/retention work,
  then clarified that tests based on synthetic scenarios must not be presented
  as live-site facts.
- Landed: added optional diagnostic records to the Chaturbate fixture parser,
  two synthetic diagnostic fixtures, and tests proving diagnostic facts can be
  validated, archived, read back, indexed, and queried.
- Files:
  - `README.md`
  - `docs/TIMELINE_SCHEMA_V1.md`
  - `docs/DIAGNOSTIC_CODES_V1.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_chaturbate_offline_diagnostic_fixtures.md`
  - `packages/adapters/chaturbate/fixtures/README.md`
  - `packages/adapters/chaturbate/fixtures/missing-audio.synthetic.json`
  - `packages/adapters/chaturbate/fixtures/diagnostic-anomalies.synthetic.json`
  - `packages/adapters/chaturbate/src/splitTrackFixture.ts`
  - `packages/adapters/chaturbate/tests/diagnosticFixtures.test.ts`
- Decisions:
  - The new diagnostic fixtures are synthetic contract tests only.
  - They model missing audio, media gap, duration mismatch, and stalled output
    to prove Chronarium can store/query bad recording facts.
  - They do not prove current live Chaturbate behavior; real compatibility
    evidence must come later from approved redacted samples or synthetic
    reproductions derived from approved local evidence.
  - Timeline diagnostic payload codes are documented separately from archive
    validator issue codes.
- Verification:
  - `pnpm exec vitest run packages/adapters/chaturbate/tests` passed 3 files
    and 7 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 8 files and 39 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON parse scan succeeded for package/config and synthetic fixture JSON
    files.
- Next: run full workspace verification, commit/push this step, then continue
  with archive recovery report-only detection or deterministic maintenance
  inspection types.

## 2026-06-12: Core maintenance inspector foundation

- Conversation: user accepted the recommendation to start the next phase with
  a deterministic read-only maintenance inspector before any AI operations.
- Landed: added first maintenance report/finding/evidence/action suggestion
  types, a core archive maintenance inspector, and tests for healthy archives,
  archive validator issues, and known timeline diagnostic facts.
- Files:
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_core_maintenance_inspector_foundation.md`
  - `packages/core/src/index.ts`
  - `packages/core/src/maintenance/index.ts`
  - `packages/core/src/maintenance/archiveInspector.ts`
  - `packages/core/src/maintenance/inspectionTypes.ts`
  - `packages/core/tests/maintenanceInspector.test.ts`
- Decisions:
  - The first maintenance inspector is Level 0: Report Only.
  - It reads through `CoreArchiveIndexService.validateArchive`.
  - It does not call `reindexArchive`, repair archives, run media tools, call
    AI, or connect to live sites.
  - Core tests construct generic timeline diagnostic facts directly instead of
    importing a site adapter, preserving the core/adapter boundary.
- Verification:
  - `pnpm exec vitest run packages/core/tests` passed 3 files and 7 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 9 files and 42 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON parse scan succeeded for package/config and synthetic fixture JSON
    files.
- Next: continue with archive recovery report-only detection or index freshness
  checks for the maintenance inspector.

## 2026-06-12: Merge mistaken A03/A04 context files into A01

- Conversation: user clarified that the project currently has only two active
  conversation contexts: A01 for Codex and A02 for ClaudeCode. The A03 and A04
  files were mistaken A01-internal labels.
- Landed: merged the important A03/A04 continuity facts into A01, removed the
  mistaken A03/A04 conversation context files, and updated indexes to list only
  A01 and A02 as conversation contexts.
- Files:
  - `AGENTS.md`
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/conversation-A03-chaturbate-offline-fixtures.md` removed
  - `docs/conversation-A04-core-maintenance-inspector-foundation.md` removed
  - `docs/plan/plan_chaturbate_offline_diagnostic_fixtures.md`
- Decisions:
  - A01 is the only Codex-maintained conversation context in this thread.
  - A02 remains independent and was not modified for the merge.
  - Future A01 phases update A01 plus plan/index docs instead of creating A03,
    A04, A05, or other pseudo-conversation files.
- Verification:
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
  - Conversation context file check now lists only A01 and A02.
- Next: run docs-safe checks, then continue A01 with archive recovery or
  maintenance index freshness work.

## 2026-06-12: Archive recovery inspector and core GUI facade

- Conversation: user asked to continue toward the first usable GUI-era shape by
  doing step 2 (archive recovery report-only detection) and step 3 (minimal
  core service interface for GUI).
- Landed: added report-only archive recovery inspection in `packages/archive`
  and a GUI-facing core facade in `packages/core`.
- Files:
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_archive_recovery.md`
  - `docs/plan/plan_archive_recovery_and_gui_core_facade.md`
  - `packages/archive/src/index.ts`
  - `packages/archive/src/recovery.ts`
  - `packages/archive/tests/archiveRecovery.test.ts`
  - `packages/core/src/guiService.ts`
  - `packages/core/src/index.ts`
  - `packages/core/tests/guiService.test.ts`
- Decisions:
  - Recovery remains report-only: no repair, delete, move, rewrite, quarantine,
    or index mutation.
  - The core GUI facade is an in-process TypeScript boundary for future GUI
    work; no Electron, React, preload, IPC, or renderer code exists yet.
  - GUI-facing async methods return rejected promises for runtime-not-started
    failures instead of throwing synchronously.
- Verification:
  - `pnpm exec vitest run packages/archive/tests` passed 3 files and 27 tests.
  - `pnpm exec vitest run packages/core/tests` passed 4 files and 9 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 11 files and 50 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
- Next: run full workspace checks, then build the Electron/React desktop shell
  around the new facade.

## 2026-06-12: Backend task, adapter lifecycle, and media tooling skeletons

- Conversation: user decided task scheduler, adapter lifecycle, and media
  tooling should be built before GUI.
- Landed: added an in-memory fixture task scheduler, a fixture-only adapter
  lifecycle host, and a new `packages/media-tools` package with typed
  FFmpeg/ffprobe command builders.
- Files:
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/MEDIA_TOOLS_BOUNDARY.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_backend_task_adapter_media_skeleton.md`
  - `packages/core/src/adapters/`
  - `packages/core/src/tasks/`
  - `packages/core/src/index.ts`
  - `packages/core/tests/adapterLifecycle.test.ts`
  - `packages/core/tests/taskScheduler.test.ts`
  - `packages/media-tools/`
  - `tsconfig.base.json`
  - `tsconfig.json`
- Decisions:
  - The task scheduler is memory-only and fixture-mode only for now.
  - The adapter lifecycle host consumes fixture message streams only; it does
    not spawn child processes.
  - Media-tools builds command descriptions only; tests do not execute FFmpeg
    or ffprobe.
- Verification:
  - `pnpm exec vitest run packages/core/tests packages/media-tools/tests`
    passed 7 files and 19 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 14 files and 60 tests.
  - `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
    passed.
  - `pnpm build` passed.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan succeeded.
- Next: connect scheduler plus fixture adapter lifecycle into an offline
  capture-like pipeline that emits timeline facts.

## 2026-06-12: Offline fixture capture pipeline

- Conversation: before starting GUI implementation, user asked for a 5 minute
  Image2 GUI concept attempt and a TDD-built offline vertical slice.
- Landed: added the first offline fixture capture pipeline in core and exposed
  it through the GUI-facing service facade.
- Files:
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_offline_fixture_capture_pipeline.md`
  - `packages/core/src/offlineFixtureCapturePipeline.ts`
  - `packages/core/src/guiService.ts`
  - `packages/core/src/index.ts`
  - `packages/core/tests/offlineFixtureCapturePipeline.test.ts`
- Decisions:
  - The pipeline is fixture-only and consumes caller-provided adapter protocol
    messages.
  - It writes synthetic `.chron` archives, media track metadata, and timeline
    facts, then reindexes SQLite.
  - Adapter errors and missing `adapter.finished` messages map to failed tasks
    and skip archive indexing.
  - Image2 GUI concept output is stored under ignored `runtime/` and is a
    design reference only.
- Verification:
  - Image2 `health --network` passed and small smoke generation succeeded.
  - GUI concept generation command hit the 5 minute timeout, but
    `runtime/imagegen/chronarium-gui-concept.png` later appeared and was
    visually inspected.
  - TDD RED: the first targeted core test failed because
    `gui.runOfflineFixtureCapture` did not exist.
  - GREEN: targeted pipeline tests passed after adding the pipeline and GUI
    facade method.
  - `pnpm exec vitest run packages/core/tests`: passed 7 files and 18 tests.
  - `pnpm typecheck`: passed after adding an `adapter.error` type guard.
  - `pnpm test`: passed 15 files and 63 tests.
  - `pnpm build`: passed.
  - `git diff --check`: produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan parsed 22 JSON files.
- Next: run full workspace verification, then build media-tool output parser
  fixtures or start the Web-first Electron/React/Vite GUI shell.

## 2026-06-12: Streaming archive IO and benchmark plan

- Conversation: user identified two pre-GUI architecture risks: full-array
  timeline reads in `validateFileArchive` / `readFileArchive`, and the lack of
  benchmark evidence for future Rust/native module decisions.
- Landed: added a planning document for streaming/batched archive timeline APIs
  and large synthetic timeline benchmark groundwork.
- Files:
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_streaming_archive_io_and_benchmarks.md`
- Decisions:
  - Future GUI, indexer, replay, and maintenance work should not further
    solidify full in-memory `timelineEvents` arrays as the only archive read
    shape.
  - Large deterministic timeline builders and benchmark scripts are required
    before "measured bottlenecks" can justify Rust or other native modules.
  - This pass implements no streaming API, benchmark, or Rust code.
- Verification:
  - Docs-only validation should run after this entry is added.
- Next: implement the streaming/batched archive timeline API and large
  synthetic timeline benchmark groundwork with TDD.

## 2026-06-12: Web-first recording dashboard shell

- Conversation: user clarified that the first GUI should focus on the recording
  view, with maintained streamers on the left, selected streamer workspace in
  the center, session history on the right, current recording pinned, and no
  live preview for now.
- Landed: added a static Web-first React/Vite dashboard under `apps/desktop`,
  rooted in synthetic view-model data only.
- Files:
  - `AGENTS.md`
  - `README.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/GUI_CORE_PROTOCOL.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_web_first_recording_dashboard.md`
  - `apps/desktop/`
  - `tdd-tests/README.md`
  - `tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
- Decisions:
  - The first GUI is Web-first React + TypeScript + Vite, before Electron
    wrapping.
  - The dashboard does not implement live preview, real capture, credentials,
    cookies, session handling, archive reads, SQLite queries, preload/IPC, or
    Electron.
  - The Chronarium desktop dev server defaults to
    `http://127.0.0.1:5187/` with `--strictPort`; port `5173` is avoided.
  - Root-level TDD tests must stay in a source-owner-shaped tree under
    `tdd-tests/`, not as flat files.
- Verification:
  - TDD RED: the dashboard test initially failed before
    `@chronarium/desktop` existed.
  - GREEN: the targeted dashboard test passed after adding the React/Vite app.
  - Browser smoke on `http://127.0.0.1:5187/` confirmed the three-column desktop
    layout rendered with no detected text overflow.
  - Full workspace checks should run after this entry is added.
- Next: run full workspace verification, then either add archive streaming /
  benchmark groundwork or add a GUI-facing DTO boundary for the dashboard.

## 2026-06-12: Web dashboard offline behavior demo

- Conversation: user asked to continue after choosing behavior over more GUI
  polish.
- Landed: added a browser-safe offline fixture capture demo action for the
  Web-first dashboard.
- Files:
  - `apps/desktop/src/App.tsx`
  - `apps/desktop/src/index.ts`
  - `apps/desktop/src/recordingDashboard.ts`
  - `apps/desktop/src/styles.css`
  - `tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  - `docs/plan/plan_web_dashboard_offline_behavior.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
- Decisions:
  - The Vite renderer still must not call Node-only core/archive/indexer APIs.
  - The new button uses a synthetic demo action and reducer state only.
  - A future Electron/preload or GUI DTO boundary should replace the demo
    action before calling `CoreGuiService`.
- Verification:
  - TDD RED: the dashboard behavior test failed because
    `createInitialRecordingDashboard` was not exported.
  - GREEN: the targeted TDD test passed after adding the dashboard state,
    reducer, demo action, and UI panel.
  - Browser smoke clicked `Run fixture capture` on
    `http://127.0.0.1:5187/` and confirmed the completed result rendered.
- Next: run full workspace verification, then connect the demo action to a real
  GUI-facing DTO/preload boundary or implement archive streaming benchmarks.

## 2026-06-12: Web dashboard monitoring semantics

- Conversation: user clarified that real recording has no manual "start
  recording" operation. The product flow is add streamer link, monitor streamer
  state, automatically record when live, finish archive when ended, and keep
  polling.
- Landed: corrected the Web-first recording dashboard to expose pause
  monitoring, resume monitoring, check now, offline self-test controls, and
  browser-local maintained-streamer selection.
- Files:
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/GUI_CORE_PROTOCOL.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_web_dashboard_monitoring_semantics.md`
  - `docs/plan/plan_web_dashboard_streamer_selection.md`
  - `apps/desktop/src/App.tsx`
  - `apps/desktop/src/index.ts`
  - `apps/desktop/src/mockDashboard.ts`
  - `apps/desktop/src/recordingDashboard.ts`
  - `apps/desktop/src/styles.css`
  - `tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
- Decisions:
  - Main GUI recording semantics are monitoring-first, not manual recording
    start.
  - The browser-safe synthetic fixture action is now an offline self-test under
    maintenance diagnostics.
  - The left streamer list can update the selected workspace in browser-local
    synthetic state.
  - The renderer still does not call core, archive, SQLite, Electron, adapter,
    or live site code.
- Verification:
  - TDD RED: targeted dashboard test failed on missing pause/resume/check and
    offline self-test UI.
  - GREEN: targeted dashboard test passed after implementation.
  - TDD RED/GREEN: targeted dashboard test failed before `streamer.select`
    updated the selected workspace, then passed after adding clickable streamer
    rows.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 16 files and 66 tests.
  - `pnpm build` passed.
  - Browser smoke confirmed pause/resume/check, offline self-test, and
    streamer selection on `http://127.0.0.1:5187/`.
  - `git diff --check` produced no output.
  - trailing whitespace scan produced no output.
  - JSON/package config parse scan parsed 24 JSON files.
- Next: continue with add-link behavior, clearer pause/resume/check feedback,
  or GUI/core DTO boundaries.

## 2026-06-12: Web dashboard streamer context

- Conversation: user pointed out inconsistent `Last check` wrapping in the
  left streamer list and asked to continue with selected-streamer context
  linkage.
- Landed: fixed left-list site/check-time wrapping, gave each synthetic
  streamer its own current session, no-current-recording state, history, latest
  facts, room state, and summary metrics, and widened the left rail to show
  richer streamer status lanes.
- Files:
  - `README.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_web_dashboard_streamer_context.md`
  - `apps/desktop/src/App.tsx`
  - `apps/desktop/src/mockDashboard.ts`
  - `apps/desktop/src/recordingDashboard.ts`
  - `apps/desktop/src/styles.css`
  - `tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
- Decisions:
  - The renderer still uses browser-local synthetic state only.
  - Paused and offline streamers show `No current recording` rather than
    reusing another streamer's active recording.
  - Site and check-time text in streamer rows are separate block elements.
  - Left streamer rows now show synthetic availability, show-mode,
    media-stream, and information-stream status lanes.
  - The status lanes were refined into a compact right-side status board:
    short availability cell, wider show-mode cell, and equal-width side-by-side
    media/info stream cells with hover descriptions.
  - Streamer cards vertically center the avatar, the three-line identity block,
    and the four-cell status board.
  - The status board does not implement real site detection, ticket/private-show
    handling, media capture, or information stream capture.
- Verification:
  - TDD RED/GREEN: targeted dashboard test failed before separate site/check
    elements and selected context existed, then passed after implementation.
  - TDD RED/GREEN: targeted dashboard test failed before expanded status lanes
    existed, then passed after adding the synthetic status fields and widened
    left rail rendering.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 16 files and 69 tests.
  - `pnpm build` passed.
  - Browser smoke confirmed site/check-time block display plus `VelvetMoth` and
    `CyberCyan` selected-context behavior on `http://127.0.0.1:5187/`.
  - After the expanded status-lane update, `pnpm typecheck` passed,
    `pnpm test` passed 16 files and 70 tests, and `pnpm build` passed.
  - Browser smoke confirmed a 382px left rail, four status chips per streamer
    row, and no detected streamer-card overflow.
  - TDD RED/GREEN: targeted dashboard test failed before compact status-board
    hover text existed, then passed after adding the fixed board structure and
    `title` descriptions.
  - Browser smoke confirmed the first status board is 120px wide, with a 35px
    availability cell, 81px show-mode cell, 120px media row, 120px information
    row, and no detected cell overflow.
  - Later browser smoke confirmed the left rail is 438px wide, streamer cards
    are 86px high, media/info cells share one row with equal 86px widths, and
    avatar, identity block, and status board all align to the card centerline.
  - `git diff --check` produced no output.
  - trailing whitespace scan produced no output.
  - JSON/package config parse scan parsed 24 JSON files.
- Next: continue with add-link behavior, clearer pause/resume/check feedback,
  or GUI/core DTO boundaries.

## 2026-06-12: Web dashboard enlarged streamer cards

- Conversation: user asked to enlarge the maintained-streamer cards, hover
  status cells, and typography to a clearer 18px / 16px / 14px scale.
- Landed: enlarged the left streamer rail and card/status-board CSS, added an
  explicit `expanded` marker to streamer cards, and added a TDD CSS contract
  check for the settled dimensions.
- Files:
  - `apps/desktop/src/App.tsx`
  - `apps/desktop/src/styles.css`
  - `tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_web_dashboard_streamer_context.md`
- Decisions:
  - The current left rail target is 560px.
  - Streamer cards are 112px tall with 58px avatars.
  - The card status board is 256px wide.
  - Left-card typography is 18px streamer name, 16px site/check text, and 14px
    status cells.
  - This is still browser-local synthetic UI only; it does not add real site
    state, real capture state, or GUI-core binding.
- Verification:
  - Targeted dashboard TDD test passed after adding the CSS contract check.
  - Browser smoke confirmed the enlarged streamer cards and no detected text
    overflow.
- Next: run full workspace verification, commit/push this UI refinement, then
  continue with add-link behavior, clearer monitoring feedback, or GUI-core DTO
  boundaries.

## 2026-06-13: Streaming timeline reader and benchmark groundwork

- Conversation: after GUI polish was split to A03, A01 continued with the
  archive foundation needed before large GUI/indexer/replay consumers hard-code
  full `timelineEvents` arrays.
- Landed: added archive timeline record/batch readers, deterministic large
  synthetic timeline builders, a local timeline scan benchmark script, TDD
  coverage, and documentation updates.
- Files:
  - `package.json`
  - `README.md`
  - `docs/ARCHITECTURE.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_streaming_archive_io_and_benchmarks.md`
  - `packages/archive/src/index.ts`
  - `packages/archive/src/timelineReader.ts`
  - `packages/testkit/src/index.ts`
  - `packages/testkit/src/largeTimeline.ts`
  - `tdd-tests/packages/archive/timeline-reader/timelineReader.test.ts`
  - `tdd-tests/packages/testkit/large-timeline/largeSyntheticTimeline.test.ts`
  - `tools/benchmarks/timeline-scan-benchmark.mjs`
- Decisions:
  - `iterateTimelineRecords` yields one parsed event or one validation issue per
    JSONL line.
  - `readTimelineEventBatches` yields bounded batches with line ranges, parsed
    events, and issues.
  - `createLargeSyntheticTimelineBuilder` streams deterministic synthetic JSONL
    chunks and can write synthetic `.chron` fixtures without constructing one
    giant event array.
  - `pnpm benchmark:timeline` is a local evidence tool, not a CI gate and not a
    Rust decision.
  - Existing full-snapshot archive APIs remain for small fixtures. Indexer,
    replay, GUI, and maintenance consumers have not yet moved to the batch
    reader.
- Verification:
  - TDD RED: archive timeline reader test failed before
    `readTimelineEventBatches` existed.
  - GREEN: targeted archive timeline reader test passed after adding
    `iterateTimelineRecords` and `readTimelineEventBatches`.
  - TDD RED: large synthetic timeline test failed before
    `createLargeSyntheticTimelineBuilder` existed.
  - GREEN: targeted testkit large timeline test passed after adding the
    builder.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed as a
    local smoke run.
- Next: move `packages/indexer` to consume `readTimelineEventBatches` so
  indexing no longer depends on full snapshot timeline arrays.

## 2026-06-13: Timeline batch indexing and segment write boundary

- Conversation: user asked to do the next two lower-level foundation steps
  before real recording behavior: move the SQLite indexer to archive timeline
  batches, and add the first archive media segment write boundary.
- Landed: added streaming validation summary for archives, moved
  `packages/indexer` timeline event insertion to `readTimelineEventBatches`,
  and added fixture-safe media segment byte writes to the archive writer.
- Files:
  - `README.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_media_track_archive_io.md`
  - `docs/plan/plan_offline_fixture_capture_pipeline.md`
  - `docs/plan/plan_streaming_archive_io_and_benchmarks.md`
  - `packages/archive/src/index.ts`
  - `packages/archive/src/streamingValidator.ts`
  - `packages/archive/src/writer.ts`
  - `packages/archive/tests/syntheticArchiveWriter.test.ts`
  - `packages/indexer/src/archiveIndexer.ts`
  - `tdd-tests/packages/indexer/timeline-batches/indexerTimelineBatches.test.ts`
- Decisions:
  - `validateFileArchiveStreaming` returns archive summary, media tracks,
    timeline event count, last sequence, and issues without returning a full
    `timelineEvents` array.
  - Indexing still validates first, then performs a second bounded batch scan
    to insert timeline rows. This keeps memory bounded while preserving simple
    behavior.
  - `ArchiveWriter.writeMediaSegment` writes caller-provided synthetic bytes
    only under a manifest-declared track.
  - Segment names must be safe single path segments, undeclared tracks are
    rejected, finalized archives are rejected, and existing segment files are
    not overwritten.
  - No real media download, probing, hashing, remuxing, FFmpeg execution,
    segment reader, segment validator, or manifest segment inventory was added.
- Verification:
  - TDD RED: indexer batch-consumption test initially failed before
    `readTimelineEventBatches` and `validateFileArchiveStreaming` were used by
    `packages/indexer`.
  - GREEN: targeted indexer tests passed after moving timeline insertion to the
    batch reader.
  - TDD RED: archive writer test failed before `writeMediaSegment` existed.
  - GREEN: targeted archive writer tests passed after adding
    `writeMediaSegment`.
  - TDD RED: duplicate segment write test failed because a second write to the
    same segment name resolved successfully.
  - GREEN: targeted archive writer tests passed after rejecting existing
    segment paths before rename.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 19 files and 84 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed as a
    local smoke run.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan parsed 21 JSON files.
- Next: add media segment reader/validator coverage so archive validation can
  report missing or unsafe segment files before real media probing exists.

## 2026-06-13: Media segment referenced-file validation

- Conversation: user asked to add media segment reader/validator coverage so
  archive validation can check segment file existence, path safety, and size.
- Landed: added `MediaSegmentFact` runtime schema validation and shared archive
  segment referenced-file validation for snapshot and streaming archive
  validators.
- Files:
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/DIAGNOSTIC_CODES_V1.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_media_segment_reader_validator.md`
  - `packages/schemas/src/mediaSchemas.ts`
  - `packages/schemas/src/primitiveSchemas.ts`
  - `packages/archive/src/segmentValidation.ts`
  - `packages/archive/src/streamingValidator.ts`
  - `packages/archive/src/validator.ts`
  - `packages/archive/tests/archiveReaderValidator.test.ts`
- Decisions:
  - `media.segment.*` timeline facts with `relativePath` are treated as
    references to stored segment files and get file checks.
  - `media.segment.*` facts without `relativePath` remain valid observations,
    because adapters may record discovered-but-not-yet-downloaded segments.
  - Segment validation checks payload schema, declared track id, archive path
    safety, ownership under the track `segmentsPath`, file existence, and
    declared byte length.
  - Hash validation, duration validation, media probing, FFmpeg/ffprobe
    execution, segment repair, and manifest segment inventory remain pending.
- Verification:
  - TDD RED: snapshot archive validation initially let a missing referenced
    segment file pass.
  - GREEN: targeted archive validator tests passed after adding segment schema
    and shared referenced-file validation.
  - TDD RED: streaming archive validation initially let a missing referenced
    segment file pass.
  - GREEN: targeted archive validator tests passed after connecting streaming
    validation to the shared segment validator.
  - Targeted archive/adapter/indexer regression passed 8 files and 54 tests,
    with the known Node `node:sqlite` ExperimentalWarning.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 19 files and 90 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed as a
    local smoke run.
  - `git diff --check` produced no output.
  - Trailing whitespace scan produced no output.
  - JSON/package config parse scan parsed 21 JSON files.
- Next: add hash/duration validation fixtures or media-tool output parser
  fixtures without executing real tools.

## 2026-06-13: Media lifecycle and retention design

- Conversation: user clarified that disk space is central, raw media should be
  processed after recording, the project owner's local machine should delete
  raw media after verified processing and later upload/delete processed outputs,
  but public releases must not force that policy on every user.
- Landed: added a media lifecycle and retention design contract and linked it
  from product, architecture, archive, timeline, media-tool, security, code-map,
  handoff, and A01 context docs.
- Files:
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ARCHITECTURE.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/TIMELINE_SCHEMA_V1.md`
  - `docs/MEDIA_TOOLS_BOUNDARY.md`
  - `docs/MEDIA_LIFECYCLE_AND_RETENTION.md`
  - `docs/SECURITY_PRIVACY.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_media_lifecycle_upload_retention.md`
- Decisions:
  - Chronarium supports configurable retention/upload policies; it should not
    force the project owner's local deletion/upload policy on public releases.
  - Durable local truth is the fact archive. Media files may be retained,
    processed, uploaded, or deleted according to policy.
  - Raw hashes prove captured evidence; processed-output hashes prove produced,
    uploaded, or locally deletable artifacts.
  - CB-like raw audio/video tracks stay split until a derived mux/transcode
    output is produced. SC-like combined A/V may be modeled as one raw media
    track.
  - Gap fill is synthetic derived output and must not be treated as captured
    media.
  - Processed recording products must be editable: future processing should be
    able to merge interrupted/restarted sessions, exclude tiny or unusable
    fragments, and record the output timeline mapping without rewriting raw
    capture facts.
- Verification:
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 24 JSON files.
- Next: add schema drafts and fixtures for raw hash/duration, processed-output,
  editable processing plans, derivation, playable-validation, and
  retention/upload decision facts without executing real media tools.

## 2026-06-13: Adapter site readiness gate

- Conversation: user asked for long-running autonomous progress until
  Chronarium is clearly ready to start connecting site adapters, while keeping
  the work fixture-first and not leaving unmanaged side conversations behind.
- Landed: added a reusable adapter fixture readiness gate, adapter manifest
  types and schemas, a fixture-only Chaturbate adapter manifest, and a core
  adapter catalog.
- Files:
  - `README.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_adapter_site_readiness_gate.md`
  - `packages/types/src/adapter.ts`
  - `packages/schemas/src/adapterSchemas.ts`
  - `packages/core/package.json`
  - `packages/core/tsconfig.json`
  - `packages/core/src/adapters/adapterCatalog.ts`
  - `packages/core/src/adapters/index.ts`
  - `packages/adapters/chaturbate/src/manifest.ts`
  - `packages/adapters/chaturbate/src/index.ts`
  - `packages/testkit/package.json`
  - `packages/testkit/tsconfig.json`
  - `packages/testkit/src/adapterReadiness.ts`
  - `packages/testkit/src/index.ts`
  - `tdd-tests/packages/core/adapter-catalog/adapterCatalog.test.ts`
  - `tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts`
- Decisions:
  - A site adapter should not move toward live-site design until it has a
    manifest, synthetic or redacted fixtures, a passing readiness gate, and
    catalog registration.
  - The readiness gate checks protocol parsing, ready/finished ordering,
    duplicate ready, requested capabilities, adapter/session matching, no
    messages after `adapter.finished`, and secret-looking or network-looking
    message content.
  - Adapter manifests declare runtime modes, capabilities, fixture readiness,
    and security posture. The current Chaturbate manifest is fixture-only and
    declares no network access or credential requirement.
  - The core catalog rejects duplicate adapter ids and manifests that declare
    sensitive source field emission.
- Verification:
  - TDD RED: adapter readiness test failed because
    `verifyAdapterFixtureReadiness` did not exist.
  - GREEN: targeted readiness test passed after adding the testkit readiness
    gate.
  - TDD RED: finished-terminal test failed because facts after
    `adapter.finished` were still accepted.
  - GREEN: targeted readiness test passed after adding
    `adapter_readiness.message_after_finished`.
  - TDD RED: duplicate-ready test failed because duplicate `adapter.ready`
    messages were accepted.
  - GREEN: targeted readiness test passed after adding
    `adapter_readiness.duplicate_ready`.
  - TDD RED: secret-looking diagnostic field test failed because an
    `Authorization` field name was accepted.
  - GREEN: targeted readiness test passed after scanning secret-looking field
    names.
  - TDD RED: adapter catalog test failed because `createAdapterCatalog` did not
    exist.
  - GREEN: targeted adapter catalog test passed after adding adapter manifest
    types/schema, Chaturbate manifest, and core catalog.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 21 files and 95 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 24 JSON files.
- Next: add the first new site adapter scaffold through this gate, or add
  media hash/duration and processed-output fact schemas before live-site work.

## 2026-06-13: Stripchat offline fixture and adapter task gate

- Conversation: user asked for long autonomous progress until Chronarium is
  clearly ready to start connecting site adapters, without touching real sites
  or opening unmanaged side conversations.
- Landed: added the first non-Chaturbate fixture-only adapter scaffold and the
  first runtime-catalog preflight gate for offline fixture capture tasks.
- Files:
  - `README.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/ADAPTER_SITE_READINESS.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_adapter_site_readiness_gate.md`
  - `docs/plan/plan_stripchat_offline_combined_fixture.md`
  - `packages/adapters/stripchat/`
  - `packages/core/src/guiService.ts`
  - `packages/core/src/offlineFixtureCapturePipeline.ts`
  - `packages/core/src/runtime.ts`
  - `tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts`
  - `tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `vitest.config.ts`
- Decisions:
  - `packages/adapters/stripchat` is fixture-only and models an SC-like
    combined audio/video HLS topology with one raw media track.
  - Non-contiguous combined media segments become `media.gap.detected` facts;
    overlapping or backwards media segments are rejected as bad fixture timing.
  - Runtime adapter manifests can now be passed into the offline capture
    pipeline as a preflight gate. Unregistered adapters, unsupported modes,
    missing requested capabilities, and fixture-not-ready manifests fail before
    adapter messages are consumed or archives are written.
  - `docs/ADAPTER_SITE_READINESS.md` is the practical checklist for future
    adapter packages before any live-site design.
- Verification:
  - TDD RED/GREEN for missing Stripchat package, overlapping segment rejection,
    gap fact generation, and unregistered adapter preflight.
  - Targeted readiness/catalog/adapter-gate/Stripchat regression passed 6 files
    and 16 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 23 files and 100 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 26 JSON files.
- Next: add more synthetic or approved redacted adapter fixtures for playlist
  parsing, room state, chat/event extraction, reconnect/gap handling, and
  error handling; still do not connect to real sites.

## 2026-06-13: Adapter worker JSONL message stream

- Conversation: continued the long-running adapter readiness work after the
  Stripchat scaffold, focusing on a child-process-safe message boundary without
  starting real adapter workers.
- Landed: added a core JSON Lines parser for future adapter stdout and tests
  that keep error reporting line-numbered but raw-output-safe.
- Files:
  - `README.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_adapter_worker_message_stream.md`
  - `packages/core/src/adapters/adapterMessageStream.ts`
  - `packages/core/src/adapters/index.ts`
  - `tdd-tests/packages/core/adapter-message-stream/adapterMessageStream.test.ts`
- Decisions:
  - Future adapter worker stdout should be parsed as JSON Lines before core
    lifecycle code consumes it.
  - `readAdapterWorkerJsonlMessages` ignores blank lines, parses JSON, validates
    through `parseAdapterToCoreMessageV1`, and yields typed
    `AdapterToCoreMessage` values.
  - `AdapterWorkerMessageStreamError` reports stable `code` and `lineNumber`
    for invalid JSON and invalid protocol without echoing raw worker output.
  - This is a parser boundary only; it does not spawn child processes, connect
    to live sites, or execute media tools.
- Verification:
  - TDD RED: targeted adapter message stream test failed because
    `readAdapterWorkerJsonlMessages` did not exist.
  - GREEN: targeted test passed after adding the parser and core export.
  - TDD RED/GREEN: invalid JSON errors gained stable code and line number
    without echoing raw output.
  - Targeted adapter message stream tests passed 1 file and 3 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 24 files and 103 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 26 JSON files.
- Next: add a typed adapter child-process command builder or supervised
  stdout/stderr harness, still without connecting to real sites.

## 2026-06-13: Adapter worker command builder

- Conversation: continued adapter worker readiness after adding the JSONL
  message stream parser.
- Landed: added a typed command descriptor builder for future adapter
  child-process launching.
- Files:
  - `README.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_adapter_worker_command_builder.md`
  - `packages/core/src/adapters/adapterWorkerCommand.ts`
  - `packages/core/src/adapters/index.ts`
  - `tdd-tests/packages/core/adapter-worker-command/adapterWorkerCommand.test.ts`
- Decisions:
  - `createAdapterWorkerCommand` returns `executablePath`, `argv`,
    `redactedArgv`, and `shell: false`.
  - Adapter id, runtime mode, session id, capabilities, and optional fixture
    name are structured argv fields.
  - The builder requires absolute executable and worker entry paths, rejects
    empty values and newline-bearing values, and does not spawn child processes.
  - The actual process launcher/supervisor remains pending.
- Verification:
  - TDD RED: targeted adapter worker command test failed because
    `createAdapterWorkerCommand` did not exist.
  - GREEN: targeted test passed after adding the builder and core export.
  - Safety coverage rejects relative worker entry paths and newline-bearing
    arguments.
  - Targeted adapter worker command tests passed 1 file and 2 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 25 files and 105 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 26 JSON files.
- Next: add a supervised stdout/stderr harness or process lifecycle test around
  the worker command descriptor and JSONL parser, still without connecting to
  real sites.

## 2026-06-13: No-spawn adapter worker supervisor harness

- Conversation: continued adapter worker readiness after the command descriptor
  and JSONL parser existed.
- Landed: added a no-spawn supervisor harness that connects modeled worker
  command/stdout/stderr/exit data to the fixture lifecycle host.
- Files:
  - `README.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_adapter_worker_supervisor_harness.md`
  - `packages/core/src/adapters/adapterWorkerSupervisor.ts`
  - `packages/core/src/adapters/index.ts`
  - `tdd-tests/packages/core/adapter-worker-supervisor/adapterWorkerSupervisor.test.ts`
- Decisions:
  - `runModeledAdapterWorker` is a no-spawn harness, not a process launcher.
  - The harness parses modeled stdout JSONL through
    `readAdapterWorkerJsonlMessages`, then feeds validated messages into the
    fixture lifecycle host.
  - Valid stdout plus exit code 0 yields a completed worker report.
  - Invalid stdout and non-zero exit codes yield failed reports.
  - Raw stdout is not echoed in invalid-output failures.
- Verification:
  - TDD RED: targeted supervisor test failed because `runModeledAdapterWorker`
    did not exist.
  - GREEN: targeted test passed after adding the no-spawn harness and core
    export.
  - TDD RED/GREEN: invalid stdout JSON escaped as an exception, then became a
    failed report.
  - Non-zero exit coverage verifies `adapter_worker.exit_nonzero`.
  - Targeted adapter worker supervisor tests passed 1 file and 3 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 26 files and 108 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 26 JSON files.
- Next: use fixture workers first if adding a real process launcher/supervisor;
  still do not connect to real sites.

## 2026-06-13: Real-site adapter bring-up checklist

- Conversation: after the adapter readiness, worker command, JSONL parser, and
  no-spawn supervisor foundations landed, A01 audited whether Chronarium had a
  clear starting point for real-site adapter work.
- Landed: added a go/no-go checklist that defines what real-site adapter work is
  allowed now and what remains prohibited.
- Files:
  - `README.md`
  - `docs/ADAPTER_SITE_READINESS.md`
  - `docs/REAL_SITE_ADAPTER_BRINGUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_real_site_adapter_bringup_checklist.md`
- Decisions:
  - Chronarium is ready to begin real-site adapter design and fixture-first
    bring-up.
  - Chronarium is not ready to run live capture jobs.
  - The allowed next phase is synthetic or approved redacted evidence,
    fixture-only parser/builders, readiness/catalog/task-gate/worker harness
    tests, and a site-specific live plan.
  - Live network access, credentials, cookies, headers, tokens, signed URLs,
    real media downloads, real adapter worker execution against a live site,
    and upload/deletion automation remain prohibited without explicit user
    approval.
- Verification:
  - Documentation-only pass.
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 26 JSON files.
- Next: choose a target site and start its fixture-first bring-up plan, or add a
  real process launcher using fixture workers only.

## 2026-06-13: Documentation and code state sync

- Conversation: user asked A01 to review the current documentation and code
  state, then keep docs aligned with implemented facts.
- Landed: documentation-only corrections for stale current-state wording.
- Files:
  - `README.md`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/ADAPTER_SITE_READINESS.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/DIAGNOSTIC_CODES_V1.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_documentation_code_state_sync.md`
- Decisions:
  - The Web-first renderer exists, but Electron shell, preload/IPC, and live
    GUI-core binding still do not.
  - Implemented `segment.*` archive validation codes are no longer described as
    only reserved drafts.
  - Current worker-boundary code is limited to JSONL parsing, typed command
    descriptors, and a no-spawn supervisor harness; real child-process
    launching remains pending.
  - The code map's root TDD tree should list the current worker, timeline,
    indexer, and large-timeline slices.
- Verification:
  - Documentation-only pass.
  - `git diff --check` passed.
  - trailing whitespace scan passed.
  - JSON/package config parse scan parsed 27 JSON files.
- Next: continue with fixture-first adapter bring-up or add hash/duration and
  processed-output fact schemas without live site access.

## 2026-06-13: Shared adapter kit for fixture safety and parsing

- Conversation: A02 foundation review (Phase 2) found the fixture-safety and
  fixture-parsing helpers were copy-pasted and drifting across site adapters;
  the user approved Round 1 to extract them into one shared package.
- Landed: new `@chronarium/adapter-kit` package and convergence of the
  Chaturbate and Stripchat adapters onto it (behavior-preserving refactor).
- Files:
  - `packages/adapters/kit/package.json`
  - `packages/adapters/kit/tsconfig.json`
  - `packages/adapters/kit/src/fixtureSafety.ts`
  - `packages/adapters/kit/src/fixtureParse.ts`
  - `packages/adapters/kit/src/index.ts`
  - `packages/adapters/chaturbate/src/splitTrackFixture.ts`
  - `packages/adapters/chaturbate/package.json`
  - `packages/adapters/chaturbate/tsconfig.json`
  - `packages/adapters/stripchat/src/combinedFixture.ts`
  - `packages/adapters/stripchat/package.json`
  - `packages/adapters/stripchat/tsconfig.json`
  - `tdd-tests/packages/adapters/kit/adapterKitFixtureGuards.test.ts`
  - `tsconfig.base.json`, `tsconfig.json`, `vitest.config.ts`
  - `docs/plan/plan_adapter_kit_shared_fixture_helpers.md`
  - `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`,
    `README.md`
  - `docs/conversation-A02-foundation-docs-completion.md`
- Decisions:
  - The shared guards `assertSyntheticFixtureReference` and
    `assertNoSensitiveFixtureStrings`, plus the `expect*` parsing primitives,
    live in one tested package so the per-adapter secret/URL safety checks have
    a single source of truth.
  - `assertSyntheticFixtureReference` takes the site prefix as an explicit
    argument, preserving each adapter's existing error messages exactly.
  - The duplicated fact-builders (`createSyntheticSource`,
    `createFixtureTimelineEvent`) are intentionally left in each adapter for now;
    they are reshaped when per-family timeline payload schemas land.
- Verification:
  - TDD RED: `tdd-tests/packages/adapters/kit` failed with
    `Cannot find package '@chronarium/adapter-kit'`; GREEN after creating the
    package and wiring aliases.
  - `pnpm install`, `pnpm typecheck`, `pnpm build` passed.
  - `pnpm test` passed 27 files and 117 tests (was 26 files / 108 tests), with
    the known Node `node:sqlite` ExperimentalWarning.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
  - `git diff --check` clean after normalizing two EOF newlines; trailing
    whitespace scan clean.
- Next: Round 2 — add per-family timeline payload schemas (audit P0-1/P0-2) and
  reconcile the `media.segment` fact shape, still fixture-first.

## 2026-06-13: Timeline payload schemas for media facts + gap reconcile

- Conversation: A02 Round 2 from the foundation audit. Added per-family timeline
  payload schemas for the media observation facts and reconciled the two payload
  divergences (P0-1, P0-2).
- Landed: lenient payload schemas + dispatcher, archive payload validation, and a
  unified structured `media.gap.detected` shape.
- Files:
  - `packages/schemas/src/timelinePayloadSchemas.ts` (new),
    `packages/schemas/src/index.ts`
  - `packages/types/src/timeline.ts`
  - `packages/archive/src/payloadValidation.ts` (new),
    `packages/archive/src/validator.ts`,
    `packages/archive/src/streamingValidator.ts`
  - `packages/adapters/chaturbate/src/splitTrackFixture.ts`
  - `tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
    (new),
    `tdd-tests/packages/archive/payload-validation/payloadValidation.test.ts`
    (new)
  - `packages/adapters/chaturbate/tests/diagnosticFixtures.test.ts`,
    `packages/core/tests/offlineFixtureCapturePipeline.test.ts`,
    `packages/core/tests/maintenanceInspector.test.ts`
  - `docs/TIMELINE_SCHEMA_V1.md`, `docs/DIAGNOSTIC_CODES_V1.md`,
    `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`,
    `README.md`, `docs/plan/plan_timeline_payload_schemas_round2.md` (new),
    `docs/conversation-A02-foundation-docs-completion.md`
- Decisions:
  - Payload schemas are lenient (validate required + known fields; allow extra
    keys) since the timeline payload is an open `JsonObject`.
  - `payload.schema_invalid` is reported by both the snapshot and streaming
    validators via a shared `validateTimelinePayloads`; the reader and writer
    stay envelope-only.
  - Canonical `media.gap.detected` requires structured geometry at top level and
    allows diagnostic annotations as optional extras. Stripchat already
    conformed; Chaturbate's gap moved out of its diagnostic-wrapped shape.
  - `media.segment.observed` (observation) is distinct from the stored,
    `relativePath`-bearing segment fact; `mediaSegmentFactV1Schema` is unchanged.
  - `diagnostic.*` / `room.*` / `chat.*` / `network.*` payload schemas are later
    rounds.
- Verification:
  - TDD RED→GREEN for the schema, validator, and gap-reshape slices.
  - `pnpm typecheck`, `pnpm build` passed; `pnpm test` passed 29 files and 133
    tests (was 27 / 117), with the known Node `node:sqlite` ExperimentalWarning.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` `issueCount: 0`.
  - `git diff --check` + trailing-whitespace scan clean.
- Next: Round 3 — payload schemas for `diagnostic.*`, then room/chat and
  network/reconnect fact families, still fixture-first.

## 2026-06-13: Credentials and sessions design draft

- Conversation: A02. The user raised that ticket / private / spy shows need
  authenticated sessions and wants per-streamer selection of a cookie or cookie
  combination. Agreed a two-layer model with capability-match-then-failover
  selection.
- Landed: a documentation-only design draft. No credential code.
- Files:
  - `docs/CREDENTIALS_AND_SESSIONS.md` (new)
  - `README.md`, `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`,
    `docs/AI_CHANGE_INDEX.md`,
    `docs/conversation-A02-foundation-docs-completion.md`
- Decisions:
  - A `CredentialProfile` is one account's full cookie jar; a streamer binds one
    or more profiles with a selection policy. Cross-account cookie merging into a
    single request is rejected as a model.
  - Default selection is capability-match (intent -> entitlement) then failover;
    missing credentials degrade to public-only or skip, never block monitoring.
  - Raw cookies are runtime inputs only: never in fixtures, timeline, archive,
    index, docs, logs, argv, or Git. Only a redacted `CredentialRef` crosses
    boundaries. The store is core-only and at-rest encrypted in the git-ignored
    runtime dir.
  - Integration reuses `manifest.security.requiresCredentials`, the catalog's
    `emitsSensitiveSourceFields` rejection, the readiness gate's secret scan, and
    the live-promotion gate in `docs/REAL_SITE_ADAPTER_BRINGUP.md`.
- Verification: documentation-only pass. `git diff --check` + trailing-whitespace
  scan clean.
- Next: when approved, build a fixture-only credential store + selector contract
  with synthetic placeholder profiles (no real cookies, no live requests).

## 2026-06-13: Fixture-only credential store and selector

- Conversation: A02. Implemented the first safe work package from
  `docs/CREDENTIALS_AND_SESSIONS.md` — an in-memory, fixture-only credential
  store and a per-streamer selector. No real cookies, no encryption, no live
  requests.
- Landed: credential model types, the store, and the
  capability-match-failover selector.
- Files:
  - `packages/types/src/credentials.ts` (new), `packages/types/src/index.ts`
  - `packages/core/src/credentials/credentialStore.ts` (new),
    `packages/core/src/credentials/credentialSelector.ts` (new),
    `packages/core/src/credentials/index.ts` (new),
    `packages/core/src/index.ts`
  - `tdd-tests/packages/core/credentials/credentialSelector.test.ts` (new)
  - `docs/plan/plan_credential_store_selector_fixture.md` (new),
    `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`,
    `README.md`, `docs/conversation-A02-foundation-docs-completion.md`
- Decisions:
  - The store holds only profile metadata + an opaque `storageHandle`; it
    rejects any profile carrying raw-secret-looking strings, so the fixture model
    is provably free of cookies/tokens/URLs.
  - The selector returns only a redacted `CredentialRef`. `public` returns
    `not-required`; no binding or no eligible profile returns `missing` (the
    caller degrades, monitoring is never blocked). Unhealthy profiles are
    excluded, which is how failover happens.
  - Deferred: core task gate, reserved `session.credential_*` timeline schemas,
    encryption/storage/import/injection, real cookies, the live path, and the
    `round-robin`/`manual` policies.
- Verification:
  - TDD RED→GREEN for the selector; 9 credential tests.
  - `pnpm typecheck`, `pnpm build` passed; `pnpm test` passed 30 files and 142
    tests (was 29 / 133), with the known Node `node:sqlite` ExperimentalWarning.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` `issueCount: 0`.
  - `git diff --check` + trailing-whitespace scan clean.
- Next: core task gate that refuses a gated capture without a usable bound
  profile, then the reserved credential timeline fact schemas — still
  fixture-first.

## 2026-06-13: Timeline payload schemas Round 3-5

- Conversation: A01 resumed the adapter-readiness foundation after A02's
  handoff and completed the remaining diagnostic, room/chat, and
  network/reconnect payload-schema rounds. Cookie/live work was left for later
  explicit instruction.
- Landed: diagnostic payload schemas, room/chat payload schemas, network
  disconnect/reconnect payload schemas, Stripchat synthetic room/chat/network
  fixture facts, and readiness fact-usage checks for `room.state` /
  `chat.events`.
- Files:
  - `packages/types/src/timeline.ts`
  - `packages/schemas/src/timelinePayloadSchemas.ts`
  - `packages/core/src/maintenance/archiveInspector.ts`
  - `packages/testkit/src/adapterReadiness.ts`
  - `packages/adapters/chaturbate/src/fixtureAdapter.ts`
  - `packages/adapters/stripchat/fixtures/combined-av.synthetic.json`
  - `packages/adapters/stripchat/src/combinedFixture.ts`
  - `packages/adapters/stripchat/src/fixtureAdapter.ts`
  - `tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  - `tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts`
  - `tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts`
  - `tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts`
  - `README.md`
  - `docs/TIMELINE_SCHEMA_V1.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/ADAPTER_SITE_READINESS.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_timeline_payload_schemas_round3_4_5.md`
- Decisions:
  - Canonical room/chat event type names are `room.state.changed` and
    `chat.message.observed`.
  - Initial reconnect event type names are `network.disconnected` and
    `network.reconnected`.
  - Stripchat is now the first fixture template that exercises room/chat,
    network reconnect, and media gap facts together.
  - Readiness requires declared or requested `room.state` / `chat.events`
    capabilities to have at least one matching fact in the fixture stream.
  - Chaturbate no longer declares `room.state` until it has a matching room
    fixture.
- Verification:
  - TDD RED/GREEN recorded in
    `docs/plan/plan_timeline_payload_schemas_round3_4_5.md`.
  - Targeted Round 3/4/5 tests passed 4 files and 38 tests.
  - `pnpm test` passed 30 files and 158 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed with
    1000 scanned events, 8 batches, and 0 issues.
  - `git diff --check` passed.
  - trailing whitespace scan found no matches.
  - JSON/package parse scan parsed 29 JSON files.
- Next: the next requested line is credential/Cookie B-line work, but only
  after user instruction. Otherwise continue fixture-first adapter bring-up or
  adapter worker process-supervisor foundations without live-site access.

## 2026-06-14: Fixture credential task gate and session facts

- Conversation: A01 continued the approved credential foundation line in a
  fixture-only way, without real cookies or live requests.
- Landed: core offline fixture capture preflight for gated recording intents
  plus redacted session credential payload schemas.
- Files:
  - `packages/core/src/tasks/taskTypes.ts`
  - `packages/core/src/runtime.ts`
  - `packages/core/src/guiService.ts`
  - `packages/core/src/offlineFixtureCapturePipeline.ts`
  - `packages/types/src/timeline.ts`
  - `packages/schemas/src/timelinePayloadSchemas.ts`
  - `tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts`
  - `tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  - `README.md`
  - `docs/CREDENTIALS_AND_SESSIONS.md`
  - `docs/TIMELINE_SCHEMA_V1.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
  - `docs/plan/plan_credential_task_gate_and_session_facts.md`
- Decisions:
  - `CoreTaskRequest` may carry optional `recordingIntent` and redacted
    `streamerRef`; missing intent defaults to `public`.
  - `ticket`, `private`, and `spy` are gated intents. The offline fixture
    pipeline rejects them before adapter startup when no usable bound
    credential profile exists.
  - The session credential fact schemas carry only intent and redacted
    `CredentialRef` metadata. Raw cookies, headers, tokens, signed URLs, and
    account material remain forbidden.
  - Real credential storage, import, injection, and live adapter request paths
    remain prohibited until a specific live adapter is explicitly approved.
- Verification:
  - TDD RED: gated ticket capture without a usable credential consumed adapter
    messages; GREEN after the credential gate failed preflight with
    `credential.missing`.
  - TDD RED: session credential parse functions and registry entries were
    missing; GREEN after adding the four session payload schemas.
  - Targeted adapter-gate test passed 1 file and 4 tests.
  - Targeted timeline payload schema test passed 1 file and 33 tests.
  - `pnpm test` passed 30 files and 166 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed with
    1000 scanned events, 8 batches, and 0 issues.
  - `git diff --check` passed.
  - trailing whitespace scan found no matches.
  - JSON/package parse scan parsed 29 JSON files.
- Next: continue fixture-first adapter work or worker process-supervisor
  foundations; do not implement real cookies without explicit approval.

## 2026-06-14: Credential vault + injection model + default election

- Conversation: A02. Advanced the credential line to the live edge without
  crossing it, and added the user's default-cookie election + no-cookie fallback
  rules. All fixture-safe: synthetic jars, no real cookies, no encryption
  backend, no spawn, no live requests.
- Landed: a fixture-only credential vault, a no-spawn injection-descriptor model,
  default-cookie election in the selector, and a gated-capture degrade.
- Files:
  - `packages/types/src/credentials.ts`
  - `packages/core/src/credentials/credentialVault.ts` (new),
    `credentialInjection.ts` (new), `credentialSelector.ts`, `index.ts`
  - `packages/core/src/offlineFixtureCapturePipeline.ts`
  - `tdd-tests/packages/core/credentials/credentialVaultInjection.test.ts` (new),
    `credentialSelector.test.ts`,
    `tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts`
  - `docs/CREDENTIALS_AND_SESSIONS.md`,
    `docs/plan/plan_credential_vault_injection_fixture.md` (new),
    `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`,
    `README.md`, `docs/conversation-A02-foundation-docs-completion.md`
- Decisions:
  - The vault is a backend-agnostic interface; the only backend now is in-memory
    + synthetic. Real encrypted at-rest backend deferred (OS keystore default,
    passphrase fallback recommended).
  - Injection is a one-time stdin handshake modeled no-spawn; the jar is
    runtime-only, never argv / logs / timeline / archive; only a redacted form
    (credentialRef + entryCount) is loggable.
  - Default cookie = oldest-added surviving eligible profile; single profile is
    the default; deleting the default auto-elects the next-oldest.
  - A gated capture with no usable credential **degrades to public/no-cookie**
    (revising the earlier hard-refuse gate) and proceeds; the credential outcome
    is exposed on the result. Public intent needs no credential.
- Verification:
  - TDD RED→GREEN for the vault/injection tracer.
  - `pnpm typecheck`, `pnpm build` passed; `pnpm test` 31 files / 174 tests (was
    30 / 166), with the known Node `node:sqlite` ExperimentalWarning.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` `issueCount: 0`.
  - `git diff --check` + trailing-whitespace scan clean.
- Next: deferred until a specific live adapter is approved — real encrypted
  backend, real cookie import, real spawn + stdin injection, live requests, GUI
  binding UI, and emitting `session.credential_*` facts during capture.

## 2026-06-14: Report-only archive recovery plan

- Conversation: A02, parallel lane (see `docs/AGENT_WORK_SPLIT.md`). With the
  credential live-prep blocked on live approval, added a core, fixture-safe slice
  in the archive lane.
- Landed: `buildArchiveRecoveryPlan` — a pure, report-only plan that groups the
  recovery inspector's findings into ordered, safety-tagged proposed actions and
  executes nothing.
- Files:
  - `packages/archive/src/recoveryPlan.ts` (new), `packages/archive/src/index.ts`
  - `tdd-tests/packages/archive/recovery-plan/recoveryPlan.test.ts` (new)
  - `docs/plan/plan_archive_recovery_plan.md` (new), `docs/APP_CODE_MAP.md`,
    `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`,
    `docs/conversation-A02-foundation-docs-completion.md`
- Decisions:
  - The plan is report-only: each step carries a safety level (`report-only` /
    `safe-rebuild` / `destructive-confirm`) and `executable: false`. A future,
    separately approved executor would consume it; nothing is deleted, rewritten,
    quarantined, or rebuilt here.
- Verification:
  - TDD RED→GREEN (3 tests). `pnpm typecheck`, `pnpm build` passed; `pnpm test`
    177 tests (was 174), with the known Node `node:sqlite` ExperimentalWarning;
    `git diff --check` clean.
- Next: a safe-rebuild executor design (gated) or the replay / IPC contract.

## 2026-06-14: Media tool output parser fixtures

- Conversation: A01 / Codex parallel media-tools lane from
  `docs/AGENT_WORK_SPLIT.md`.
- Landed: fixture-tested parsers for synthetic ffprobe JSON output and FFmpeg
  progress output. No real media tools are executed.
- Files:
  - `packages/media-tools/src/outputParsers.ts`
  - `packages/media-tools/src/index.ts`
  - `packages/media-tools/fixtures/ffprobe.synthetic.json`
  - `packages/media-tools/fixtures/ffmpeg-progress.synthetic.txt`
  - `tdd-tests/packages/media-tools/output-parsing/mediaToolOutputParsers.test.ts`
  - `docs/plan/plan_media_tool_output_parsers.md`
  - `docs/MEDIA_TOOLS_BOUNDARY.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/conversation-A01-documentation-and-initial-skeleton.md`
- Decisions:
  - Parsers live inside `packages/media-tools`; no shared core/types/schemas
    contracts changed.
  - Parser errors use stable codes and fixed messages, never raw output echoes.
  - Fixtures are synthetic and contain no real media paths, signed URLs,
    credentials, cookies, headers, or tokens.
- Verification:
  - TDD RED: parser tests failed because `parseFfprobeJsonOutput` and
    `parseFfmpegProgressOutput` were not exported.
  - GREEN: targeted parser and media command tests passed 2 files and 8 tests.
  - `pnpm typecheck` passed.
  - `pnpm test` passed 33 files and 181 tests, with the known Node
    `node:sqlite` ExperimentalWarning.
  - `pnpm build` passed.
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed with
    1000 scanned events, 8 batches, and 0 issues.
  - `git diff --check` passed.
  - trailing whitespace scan found no matches.
  - JSON/package parse scan parsed 30 JSON files.
- Next: candidate media-tools lane work: package-local parsed-output mapping to
  future diagnostic facts, still without executing tools.
