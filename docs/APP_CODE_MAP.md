# Chronarium App Code Map

This document maps the current repository tree and planned code boundaries. It
does not replace `docs/ARCHITECTURE.md`.

## Current State

Chronarium now has documentation plus a minimal executable TypeScript validation
chain. The package code is still early and fixture-first. No GUI, core task
scheduler, adapter lifecycle, real site capture, SQLite integration with GUI,
FFmpeg command builder, real media segment writer/prober, archive
recovery/migration, or replay player exists yet.

Current files:

```text
.gitattributes
.gitignore
README.md
AGENTS.md
LICENSE
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
tsconfig.json
vitest.config.ts
docs/
  CONTEXT.md
  ARCHITECTURE.md
  PRODUCT_SPEC.md
  ARCHIVE_FORMAT_V1.md
  TIMELINE_SCHEMA_V1.md
  REPLAY_MODEL_V1.md
  ADAPTER_PROTOCOL.md
  GUI_CORE_PROTOCOL.md
  DIAGNOSTIC_CODES_V1.md
  MEDIA_TOOLS_BOUNDARY.md
  SECURITY_PRIVACY.md
  MAINTENANCE_OPS_DESIGN.md
  CB_RECORDING_REFERENCES.md
  DEVELOPMENT_SETUP.md
  APP_CODE_MAP.md
  AI_HANDOFF.md
  AI_CHANGE_INDEX.md
  conversation-A01-documentation-and-initial-skeleton.md
  conversation-A02-foundation-docs-completion.md
  conversation-A03-chaturbate-offline-fixtures.md
  plan/
    README.md
    plan_workspace_schema_foundation.md
    plan_license_apache_2.md
    plan_runtime_schema_archive_fixture.md
    plan_archive_reader_validator.md
    plan_sqlite_index_foundation.md
    plan_archive_writer_timeline_invariants.md
    plan_indexer_rebuild_query_contracts.md
    plan_media_track_archive_io.md
    plan_core_archive_index_service.md
    plan_core_runtime_lifecycle_shell.md
    plan_maintenance_ops_design.md
    plan_cb_recording_references.md
    plan_foundation_docs_completion.md
    plan_archive_recovery.md
    plan_chaturbate_offline_split_fixture.md
packages/
  types/
  schemas/
  archive/
  indexer/
  core/
  adapters/
    chaturbate/
  testkit/
```

## Root Files

### `README.md`

Responsibility:

- Chinese project overview.
- Product direction.
- Current stage.
- Default technology direction.
- Document index.

Boundary:

- Summarizes current state and points to detailed docs.
- Does not replace detailed schemas or APIs.

### `AGENTS.md`

Responsibility:

- Project-level operating guide for AI agents.
- Repository boundaries.
- Safety and privacy rules.
- Default technology direction.
- Documentation and verification discipline.
- Required conversation context maintenance rules.

Boundary:

- It is not a product specification.
- It should not contain personal credentials, project-specific local secrets, or
  unrelated agent persona instructions.

### `LICENSE`

Responsibility:

- Project open-source license text.

Current status:

- Apache License 2.0.

## Docs

### `docs/CONTEXT.md`

Responsibility:

- Product vocabulary.
- Architecture vocabulary.
- Site direction.
- Definition of "perfect replay".

### `docs/ARCHITECTURE.md`

Responsibility:

- First architecture framework.
- Technology choices.
- Process model.
- Replay package direction.
- Component boundaries.
- AI maintainability model.

### `docs/PRODUCT_SPEC.md`

Responsibility:

- Product promise.
- MVP scope.
- Non-goals.
- First user workflows.
- Open product decisions.

Boundary:

- Draft product specification, not implementation status.

### `docs/ARCHIVE_FORMAT_V1.md`

Responsibility:

- Draft `.chron` package layout.
- Manifest minimum shape.
- JSON Lines and path rules.
- Archive write safety and sensitive-data rules.
- Current reader/validator consistency checks.

Boundary:

- Does not claim real media segment IO, recovery, or migration exists.

### `docs/TIMELINE_SCHEMA_V1.md`

Responsibility:

- Timeline event envelope.
- Time model.
- Event families.
- Initial payload guidelines.
- Ordering and schema evolution rules.

Boundary:

- Runtime validation exists for the initial event envelope, but payload-specific
  event schemas are still pending.

### `docs/REPLAY_MODEL_V1.md`

Responsibility:

- Replay semantics contract: replay inputs, replay clock, seek model, state
  reconstruction, and gap presentation rules.
- Constraints the replay consumer places on archive and timeline contracts.
- Replay milestones before a real player exists.

Boundary:

- Draft design contract. No replay player or replay reader integration exists.

### `docs/ADAPTER_PROTOCOL.md`

Responsibility:

- Core-to-adapter and adapter-to-core message families.
- Process boundary.
- Capability names.
- Chaturbate fixture-first initial scope.

Boundary:

- No live site behavior is implemented.

### `docs/GUI_CORE_PROTOCOL.md`

Responsibility:

- GUI-to-core and core-to-GUI message families.
- Renderer/preload/Electron-main/core process boundary and transport options.
- Error model, query bounds, and protocol security rules.

Boundary:

- Draft protocol contract. No GUI, Electron shell, preload bridge, or IPC
  implementation exists.

### `docs/DIAGNOSTIC_CODES_V1.md`

Responsibility:

- Registry of implemented archive validation issue codes.
- Naming, severity, stability, and evolution rules for diagnostic codes.
- Reserved code areas for future subsystems.

Boundary:

- The implemented registry mirrors `packages/archive/src/validator.ts`; all
  reserved areas are drafts without emitting code.

### `docs/MEDIA_TOOLS_BOUNDARY.md`

Responsibility:

- Typed command builder, execution, evidence, redaction, and testing rules for
  external media tools.
- Tool roles for FFmpeg, ffprobe, and candidate downloaders.

Boundary:

- Design contract. No media-tools package or tool integration exists.

### `docs/SECURITY_PRIVACY.md`

Responsibility:

- Sensitive-data policy.
- Fixture policy.
- Redaction labels.
- Process, filesystem, external tool, and logging safety rules.

### `docs/MAINTENANCE_OPS_DESIGN.md`

Responsibility:

- Design draft for Chronarium's maintenance / ops inspection system.
- Records external project references and what Chronarium should learn from
  them.
- Defines deterministic inspection, finding, evidence, and action-safety
  boundaries.

Boundary:

- Does not claim maintenance runtime, AI agent, scheduler, GUI, or automatic
  repair exists.

### `docs/CB_RECORDING_REFERENCES.md`

Responsibility:

- Design reference for GitHub projects related to Chaturbate-style recording.
- Records split audio/video LL-HLS/CMAF lessons and what Chronarium should
  borrow.
- Connects external project references to Chronarium archive, timeline,
  adapter, media-tool, and diagnostics boundaries.

Boundary:

- Does not implement live CB capture, downloader integration, cookies, headers,
  sessions, or real media recording.

### `docs/DEVELOPMENT_SETUP.md`

Responsibility:

- Current setup state.
- Planned tooling direction.
- Safe checks before dependencies exist.
- Future dependency installation notes.

### `docs/APP_CODE_MAP.md`

Responsibility:

- Current file map.
- Planned code map.
- Ownership guide for future contributors and AI agents.

### `docs/AI_HANDOFF.md`

Responsibility:

- Current status for the next AI or developer.
- Landed decisions.
- Active constraints.
- Suggested next steps.

### `docs/AI_CHANGE_INDEX.md`

Responsibility:

- Conversation-level change index.
- Short factual record of structural changes.
- Pointers to docs and validation.

### `docs/plan/README.md`

Responsibility:

- Future plan document location and naming rules.

### `docs/plan/plan_workspace_schema_foundation.md`

Responsibility:

- Plan and scope for the initial workspace and schema foundation.
- Records explicit out-of-scope items for this step.

### `docs/plan/plan_license_apache_2.md`

Responsibility:

- Plan and scope for adding Apache-2.0 licensing metadata.

### `docs/plan/plan_runtime_schema_archive_fixture.md`

Responsibility:

- Plan, scope, and verification notes for the first runtime schema and
  synthetic archive writer path.

### `docs/plan/plan_archive_reader_validator.md`

Responsibility:

- Plan, scope, and verification notes for the first fixture-safe archive
  reader/validator path.

### `docs/plan/plan_sqlite_index_foundation.md`

Responsibility:

- Plan, scope, and verification notes for the first rebuildable SQLite indexer.

### `docs/plan/plan_archive_writer_timeline_invariants.md`

Responsibility:

- Plan, scope, and verification notes for writer-side timeline append
  invariants.

### `docs/plan/plan_indexer_rebuild_query_contracts.md`

Responsibility:

- Plan, scope, and verification notes for indexer rebuild, removal, clear, and
  filtered query contracts.

### `docs/plan/plan_media_track_archive_io.md`

Responsibility:

- Plan, scope, and verification notes for fixture-safe media-track archive
  metadata IO.

### `docs/plan/plan_core_archive_index_service.md`

Responsibility:

- Plan, scope, and verification notes for the first core archive/index service.

### `docs/plan/plan_core_runtime_lifecycle_shell.md`

Responsibility:

- Plan, scope, and verification notes for the minimal core runtime lifecycle
  shell.

### `docs/plan/plan_maintenance_ops_design.md`

Responsibility:

- Plan, scope, and verification notes for the maintenance / ops design draft.

### `docs/plan/plan_cb_recording_references.md`

Responsibility:

- Plan, scope, references, and verification notes for the CB recording
  reference design document.

### `docs/plan/plan_foundation_docs_completion.md`

Responsibility:

- Plan, scope, and verification notes for the A02 foundation documentation
  completion pass.

### `docs/plan/plan_archive_recovery.md`

Responsibility:

- Design plan for interrupted-write archive recovery: failure scenarios,
  conservative recovery principles, proposed mechanisms, and implementation
  order.
- Created before implementation; no recovery code exists.

### `docs/plan/plan_chaturbate_offline_split_fixture.md`

Responsibility:

- Plan, scope, and verification notes for the first Chaturbate offline split
  audio/video fixture and tests.
- Records that the work is fixture-only and excludes live site capture,
  downloader integration, and credential handling.

### `docs/conversation-A01-documentation-and-initial-skeleton.md`

Responsibility:

- Conversation-level continuity document for A01.
- Records current status, constraints, decisions, files in scope,
  verification, and next safe step.

### `docs/conversation-A02-foundation-docs-completion.md`

Responsibility:

- Conversation-level continuity document for A02.
- Records the foundation documentation completion pass: scope, decisions,
  files changed, and verification.

### `docs/conversation-A03-chaturbate-offline-fixtures.md`

Responsibility:

- Conversation-level continuity document for A03.
- Records the Chaturbate offline split-track fixture and test continuation.

## Current Code Tree

The following tree exists. Some packages are still contract skeletons; archive
and indexer have the first executable fixture paths.

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
tsconfig.json
vitest.config.ts

packages/
  types/
    package.json
    tsconfig.json
    src/
      adapter.ts
      archive.ts
      index.ts
      media.ts
      primitives.ts
      session.ts
      timeline.ts
  schemas/
    package.json
    tsconfig.json
    src/
      adapterSchemas.ts
      archiveSchemas.ts
      index.ts
      mediaSchemas.ts
      primitiveSchemas.ts
      schemaDefinition.ts
      sessionSchemas.ts
      timelineSchemas.ts
  core/
    package.json
    tsconfig.json
    src/
      archiveIndexService.ts
      index.ts
      runtime.ts
    tests/
      archiveIndexService.test.ts
      runtime.test.ts
  adapters/
    chaturbate/
      package.json
      tsconfig.json
      fixtures/
        README.md
        split-audio-video.synthetic.json
      src/
        fixtureAdapter.ts
        index.ts
        splitTrackFixture.ts
      tests/
        splitTrackFixture.test.ts
  archive/
    package.json
    tsconfig.json
    src/
      index.ts
      layout.ts
      reader.ts
      validator.ts
      writer.ts
    tests/
      archiveReaderValidator.test.ts
      syntheticArchiveWriter.test.ts
  indexer/
    package.json
    tsconfig.json
    src/
      archiveIndexer.ts
      index.ts
      schema.ts
    tests/
      archiveIndexer.test.ts
  testkit/
    package.json
    tsconfig.json
    fixtures/
    src/
      fixtures.ts
      index.ts
```

## Planned Future Tree

These areas are planned but not implemented:

```text
apps/
  desktop/
    electron/
    src/
      main/
      renderer/
      preload/

packages/
  core/
    src/
      tasks/
      adapters/
      archive/
      timeline/
      index/
      diagnostics/
      exports/
  adapters/
    stripchat/
      src/
      fixtures/
      tests/
  archive/
    tests/
      media segment archive IO tests
      recovery/migration tests
  player/
    src/
      timeline/
      media/
      overlays/

tools/
  diagnostics/
  migration/
```

## Planned Ownership

### `apps/desktop`

Owns:

- Electron shell.
- React renderer.
- preload bridge.
- GUI state and replay views.

Must not own:

- site protocol logic;
- archive write authority;
- FFmpeg command construction;
- credential storage.

### `packages/types`

Owns:

- shared DTOs;
- event type definitions;
- manifest types;
- adapter message contracts.

Change this first when a public contract changes.

Current status:

- Exists with initial TypeScript types for primitives, sessions, media,
  timeline events, archive manifests, and adapter messages.

### `packages/schemas`

Owns:

- runtime validation schemas;
- fixture examples;
- schema version helpers.

Current status:

- Performs first-pass Zod runtime validation for sessions, media tracks,
  timeline events, archive manifests, and adapter protocol messages.

### `packages/core`

Owns:

- task lifecycle;
- adapter worker lifecycle;
- archive writes;
- timeline appends;
- SQLite indexing;
- export orchestration;
- diagnostics.

Current status:

- Exists with a minimal runtime lifecycle shell and a first archive/index
  service.
- The runtime can start, stop, report health, create local data/archive
  directories, open/close the rebuildable SQLite index, and expose the
  archive/index service while running.
- The archive/index service validates archives, reads valid archives, reindexes
  archives, and exposes index queries through core.
- Does not start tasks, adapters, capture jobs, exports, ops loops, or media
  tools yet.

### `packages/adapters/<site>`

Owns:

- site-specific media discovery;
- room state discovery;
- chat/event discovery;
- gap/reconnect strategy;
- fixtures and adapter tests.

Adapters must not call each other.

Current status:

- `packages/adapters/chaturbate` exists as a synthetic fixture adapter.
- It includes a committed offline split audio/video fixture for a CB-like
  LL-HLS/CMAF topology.
- It can parse that fixture into media track metadata and timeline facts, then
  emit those facts through the existing fixture adapter runner.
- Its tests validate timeline envelopes, adapter protocol messages, and
  rejection of network-looking or token-bearing fixture references.
- It does not perform network requests, downloads, account handling, cookies, or
  session handling.

### `packages/archive`

Owns:

- `.chron` package read/write/validate behavior.
- Atomic write helpers.
- Manifest and timeline consistency checks.

Current status:

- Exists with layout constants, path safety helpers, writer interfaces, reader
  interfaces, and validator interfaces.
- Includes a fixture-safe file writer for synthetic `.chron` packages.
- Writes `manifest.json`, appends `timeline.jsonl`, and creates top-level
  archive directories.
- Writes fixture-safe media track metadata to
  `tracks/<track-id>/track.json`, updates manifest track inventory, and creates
  empty `tracks/<track-id>/segments/` boundary directories.
- Rejects appending before manifest write, cross-session events,
  non-contiguous sequence values, duplicate event IDs, and appends after
  finalization for one writer session.
- Includes a fixture-safe file reader for `manifest.json`, `timeline.jsonl`,
  and manifest-declared media track metadata.
- Includes a fixture-safe validator for invalid JSONL, schema-invalid timeline
  lines, duplicate event IDs, sequence gaps, session mismatches, manifest
  event-count mismatches, manifest last-sequence mismatches, timeline path
  mismatches, missing/invalid media track metadata, track manifest mismatches,
  and unsafe archive-relative paths.
- Real media segment writing/reading/probing, recovery, and migration are still
  pending.

### `packages/indexer`

Owns:

- rebuildable local indexes derived from `.chron` archives;
- SQLite schema setup for query/cache tables;
- archive metadata, timeline event, and validation issue indexing;
- narrow query interfaces for future core/GUI use.

Current status:

- Exists as the first SQLite indexer package.
- Uses Node.js built-in `node:sqlite`, which is currently experimental in the
  local runtime.
- Can index synthetic `.chron` archives from `packages/archive`.
- Stores archive rows, timeline event rows, and archive validation issue rows.
- Supports explicit reindex, archive removal, clear-all, and filtered archive,
  timeline event, and validation issue queries.
- SQLite is still a rebuildable cache/index, not the source of replay truth.
- Not yet integrated with `packages/core` or any GUI.

### `packages/player`

Owns:

- replay timeline model;
- media playback coordination;
- overlays for room/chat/paid-room events;
- diagnostic timeline views.

### `packages/testkit`

Owns:

- synthetic fixtures;
- helper archive builders;
- fake adapter workers;
- golden timeline assertions.

Current status:

- Exists with helpers for synthetic sessions and timeline events.
- Includes a helper for synthetic archive manifests.
- Includes a helper for synthetic media tracks.

## Root Workspace Files

### `.gitattributes`

Responsibility:

- Normalize text files to LF in Git.
- Keep Windows command scripts on CRLF.
- Mark common binary asset formats as binary.

### `package.json`

Responsibility:

- Root private workspace metadata.
- SPDX license identifier.
- Delegating scripts for future build, typecheck, test, and lint commands.

Current status:

- Root license is `Apache-2.0`.
- Package manager is pinned to `pnpm@11.5.3`.
- Root dev dependencies include TypeScript, Vitest, and Node types.

### `pnpm-lock.yaml`

Responsibility:

- Locked dependency graph for the pnpm workspace.

### `pnpm-workspace.yaml`

Responsibility:

- Workspace package globs.

### `tsconfig.base.json`

Responsibility:

- Shared strict TypeScript compiler options.
- Path aliases for workspace packages.

### `tsconfig.json`

Responsibility:

- TypeScript project references for package skeletons.

### `vitest.config.ts`

Responsibility:

- Vitest Node environment configuration.
- Source aliases for workspace packages during tests.

### `.gitignore`

Responsibility:

- Exclude dependencies, build output, local state, secrets, archives, captures,
  and real media.

## Future Test Map

Planned test families:

```text
types/schema contract tests
archive writer/reader tests
timeline append/order tests
SQLite index tests
adapter fixture tests
FFmpeg command builder tests
player timeline tests
Electron boundary tests
Playwright replay smoke tests
```

## Maintenance Notes

- Update this file whenever the source tree or major module responsibilities
  change.
- Mark planned directories clearly until they exist.
- Do not let this document drift into a wish list of unimplemented features.
