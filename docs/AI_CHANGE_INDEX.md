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
