# AI Handoff

Chronarium is a new local-first livestream archive and replay platform under
`D:\live\Chronarium`.

## Current Status

Date: 2026-06-11

Current state:

- Project name selected: `Chronarium`.
- Product identity selected: local-first livestream archive and replay platform.
- Core purpose selected: preserve and replay the observable livestream world,
  not just record video and audio.
- Default stack selected: TypeScript-first, Electron + React GUI, Node.js
  TypeScript core, isolated TypeScript site adapters, JSON Lines fact logs,
  SQLite index, FFmpeg / ffprobe typed command builders.
- Repository now contains documentation and a minimal TypeScript workspace
  skeleton.
- Root workspace files exist: `package.json`, `pnpm-workspace.yaml`,
  `tsconfig.base.json`, and `tsconfig.json`.
- Initial packages exist: `packages/types`, `packages/schemas`,
  `packages/archive`, `packages/indexer`, `packages/core`,
  `packages/adapters/chaturbate`, and `packages/testkit`.
- Package code is contract-first, fixture-first, and only has the first
  executable validation path.
- Chaturbate adapter code is synthetic fixture mode only and does not connect to
  live rooms.
- License selected and added: Apache-2.0.
- Minimal dependencies have been installed and `pnpm-lock.yaml` exists.
- `packages/schemas` has first-pass Zod runtime schemas.
- `packages/archive` has a fixture-safe file writer that writes
  `manifest.json`, appends `timeline.jsonl`, and creates top-level archive
  directories.
- The archive writer enforces append-time invariants for manifest-before-append,
  session match, contiguous sequences, duplicate event IDs, and appends after
  finalization.
- `packages/archive` has fixture-safe media track metadata IO for
  `tracks/<track-id>/track.json` and empty `tracks/<track-id>/segments/`
  boundary directories.
- `packages/archive` has a fixture-safe reader/validator for `manifest.json`,
  `timeline.jsonl`, and manifest-declared media track metadata, including basic
  timeline and track consistency diagnostics.
- `packages/indexer` has a rebuildable SQLite indexer for synthetic `.chron`
  archive metadata, timeline events, and validation issues.
- `packages/indexer` has explicit reindex, archive removal, clear-all, and
  filtered query contracts.
- `packages/testkit` has synthetic session, timeline event, archive manifest,
  and media track helpers.
- Three Vitest behavior test files exercise synthetic archive writing, reading,
  validation failures, and SQLite indexing.
- No GUI, runnable core, SQLite integration with core/GUI, FFmpeg command
  builder, real media segment writer/prober, archive recovery/migration,
  replay player, or real capture exists yet.
- GitHub target provided by the user:
  `https://github.com/grshlogan/Chronarium.git`.

## Files Created In The Foundation Steps

```text
README.md
AGENTS.md
docs/CONTEXT.md
docs/ARCHITECTURE.md
docs/PRODUCT_SPEC.md
docs/ARCHIVE_FORMAT_V1.md
docs/TIMELINE_SCHEMA_V1.md
docs/ADAPTER_PROTOCOL.md
docs/SECURITY_PRIVACY.md
docs/DEVELOPMENT_SETUP.md
docs/APP_CODE_MAP.md
docs/AI_HANDOFF.md
docs/AI_CHANGE_INDEX.md
docs/plan/README.md
docs/plan/plan_workspace_schema_foundation.md
docs/plan/plan_license_apache_2.md
docs/plan/plan_runtime_schema_archive_fixture.md
docs/plan/plan_archive_reader_validator.md
docs/plan/plan_sqlite_index_foundation.md
docs/plan/plan_archive_writer_timeline_invariants.md
docs/plan/plan_indexer_rebuild_query_contracts.md
docs/plan/plan_media_track_archive_io.md
docs/conversation-A01-documentation-and-initial-skeleton.md
.gitattributes
.gitignore
LICENSE
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
tsconfig.json
vitest.config.ts
packages/types/
packages/schemas/
packages/archive/
packages/indexer/
packages/core/
packages/adapters/chaturbate/
packages/testkit/
```

## Important Decisions

### Product

Chronarium is not a CTB Recorder fork and not a generic download station.

It is a replay/archive platform centered on:

- `LiveSession`;
- media tracks;
- timeline facts;
- room/chat/paid-room events;
- diagnostics;
- replay packages;
- derived exports.

### Architecture

The first architecture direction is:

```text
Electron Main: thin desktop lifecycle
React Renderer: GUI and replay
chronarium-core: local backend authority
Site Adapter Workers: isolated site-specific capture logic
FFmpeg / ffprobe: typed external media tools
JSONL: durable fact logs
SQLite: index and state store
```

### AI Maintainability

The project should optimize for AI-assisted long-term maintenance:

- TypeScript-first;
- shared contracts;
- schema validation;
- fixture-driven adapter tests;
- explicit process boundaries;
- small modules;
- practical handoff docs.

## Active Constraints

- Work inside `D:\live\Chronarium` unless the user explicitly asks for another
  path.
- Do not modify CTB Recorder, CTB maintenance, OneRecord, or other recorder
  projects from this repository task.
- The user has provided the GitHub repository and allowed a first version commit
  when appropriate.
- Do not commit secrets, cookies, headers, signed URLs, private-room data, or
  real captured media.
- Keep docs honest: do not claim planned code exists.
- For non-trivial conversations, maintain a conversation context document under
  `docs/conversation-<conversation-id>-<short-english-slug>.md`.
- Do not change the Apache-2.0 license without explicit user direction.

## Suggested Next Steps

1. Plan `packages/indexer` integration with `packages/core`.
2. Add real media segment IO only after the media-track metadata validator
   remains stable.
3. Add recovery behavior for interrupted archive writes.
4. Only after archive/timeline validation works, expand the CB adapter fixture
   harness.

## Verification Status

Pre-commit safe checks run during the workspace skeleton step:

- `rg --files`: listed the expected docs and package skeleton files.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: no output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.
- `Test-Path .git`: returned `git-absent` before repository initialization.
- `git --version`: returned `git version 2.52.0.windows.1`.
- `.gitattributes` was added after repository initialization to normalize text
  files to LF and reduce cross-platform line-ending churn.
- `git init -b main`: initialized the repository on `main`.
- `git diff --cached --check`: passed after trimming extra blank lines at EOF.

No `pnpm`, `npm`, TypeScript, lint, build, or test command was run during the
initial workspace skeleton step because dependencies had not been installed yet.

License update checks:

- `package.json` parsed successfully and reports `license: Apache-2.0`.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: no output.
- `git diff --check`: no output before staging.

Runtime schema and archive fixture checks:

- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 1 Vitest file and 1 test.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: no output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.

Archive reader/validator continuation checks:

- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 2 Vitest files and 9 tests.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.

SQLite indexer continuation checks:

- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 3 Vitest files and 12 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.

Archive writer timeline invariants continuation checks:

- `pnpm typecheck`: passed across all workspace packages.
- Targeted archive writer and indexer tests passed.
- `pnpm test`: passed 3 Vitest files and 17 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.

Indexer rebuild/query contracts continuation checks:

- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 3 Vitest files and 21 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.

Media-track archive metadata IO continuation checks:

- `pnpm exec vitest run packages/archive/tests`: passed 2 Vitest files and 21
  tests.
- First `pnpm typecheck` during this continuation failed because TypeScript did
  not narrow an optional union in `packages/archive/src/validator.ts`; fixed by
  using explicit `"issue" in metadataPath` guards.
- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 3 Vitest files and 28 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.
