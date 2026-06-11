# Chronarium App Code Map

This document maps the current repository tree and planned code boundaries. It
does not replace `docs/ARCHITECTURE.md`.

## Current State

Chronarium now has documentation plus a minimal executable TypeScript validation
chain. The package code is still early and fixture-first. No GUI, runnable core,
real site capture, SQLite integration with core/GUI, FFmpeg command builder,
media-track archive reader/writer behavior, archive recovery/migration, real
media writer, or replay player exists yet.

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
  ADAPTER_PROTOCOL.md
  SECURITY_PRIVACY.md
  DEVELOPMENT_SETUP.md
  APP_CODE_MAP.md
  AI_HANDOFF.md
  AI_CHANGE_INDEX.md
  conversation-A01-documentation-and-initial-skeleton.md
  plan/
    README.md
    plan_workspace_schema_foundation.md
    plan_license_apache_2.md
    plan_runtime_schema_archive_fixture.md
    plan_archive_reader_validator.md
    plan_sqlite_index_foundation.md
    plan_archive_writer_timeline_invariants.md
    plan_indexer_rebuild_query_contracts.md
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

- Does not claim media-track archive IO, recovery, or migration exists.

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

### `docs/ADAPTER_PROTOCOL.md`

Responsibility:

- Core-to-adapter and adapter-to-core message families.
- Process boundary.
- Capability names.
- Chaturbate fixture-first initial scope.

Boundary:

- No live site behavior is implemented.

### `docs/SECURITY_PRIVACY.md`

Responsibility:

- Sensitive-data policy.
- Fixture policy.
- Redaction labels.
- Process, filesystem, external tool, and logging safety rules.

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

### `docs/conversation-A01-documentation-and-initial-skeleton.md`

Responsibility:

- Conversation-level continuity document for A01.
- Records current status, constraints, decisions, files in scope,
  verification, and next safe step.

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
      index.ts
      runtime.ts
  adapters/
    chaturbate/
      package.json
      tsconfig.json
      fixtures/
      src/
        fixtureAdapter.ts
        index.ts
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
      media-track archive IO tests
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

- Exists as a runtime contract skeleton only.
- Does not start tasks, adapters, archives, SQLite, or exports yet.

### `packages/adapters/<site>`

Owns:

- site-specific media discovery;
- room state discovery;
- chat/event discovery;
- gap/reconnect strategy;
- fixtures and adapter tests.

Adapters must not call each other.

Current status:

- `packages/adapters/chaturbate` exists as a synthetic fixture adapter
  skeleton only.
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
- Rejects appending before manifest write, cross-session events,
  non-contiguous sequence values, duplicate event IDs, and appends after
  finalization for one writer session.
- Includes a fixture-safe file reader for `manifest.json` and `timeline.jsonl`.
- Includes a fixture-safe validator for invalid JSONL, schema-invalid timeline
  lines, duplicate event IDs, sequence gaps, session mismatches, manifest
  event-count mismatches, manifest last-sequence mismatches, timeline path
  mismatches, and unsafe archive-relative paths.
- Media-track writing/reading, recovery, migration, and real media behavior are
  still pending.

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
