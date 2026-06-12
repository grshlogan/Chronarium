# AI Handoff

Chronarium is a new local-first livestream archive and replay platform under
`D:\live\Chronarium`.

## Current Status

Date: 2026-06-12

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
  `packages/adapters/chaturbate`, `packages/media-tools`, and
  `packages/testkit`.
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
- `packages/archive` has fixture-safe media segment byte writing for declared
  tracks. It writes caller-provided synthetic bytes under
  `tracks/<track-id>/segments/<segment-name>` and rejects undeclared tracks,
  unsafe segment names, and writes after finalization.
- `packages/archive` validates `media.segment.*` timeline facts that declare a
  `relativePath`: payload schema, declared track, archive-relative path safety,
  owning track `segmentsPath`, file existence, and declared byte length.
- `packages/archive` has a fixture-safe reader/validator for `manifest.json`,
  `timeline.jsonl`, and manifest-declared media track metadata, including basic
  timeline and track consistency diagnostics.
- `packages/indexer` has a rebuildable SQLite indexer for synthetic `.chron`
  archive metadata, timeline events, and validation issues.
- `packages/indexer` has explicit reindex, archive removal, clear-all, and
  filtered query contracts.
- `packages/indexer` now consumes archive timeline batches when inserting
  timeline event rows. It no longer depends on `validateFileArchive` returning
  a full `timelineEvents` array for indexing.
- `packages/core` has a first archive/index service that coordinates archive
  validation, archive reading, reindexing, and index queries.
- `packages/core` has a minimal runtime lifecycle shell that can start, stop,
  report health, create local data/archive directories, and expose the
  archive/index service while running.
- `packages/core` has the first read-only maintenance archive inspector. It
  turns archive validator issues and known timeline diagnostic facts into a
  structured `MaintenanceReport`. It does not repair, reindex, run media tools,
  call AI, or connect to live sites.
- `packages/archive` has the first report-only archive recovery inspector. It
  detects common interrupted-write states and suggested manual actions, but it
  does not repair, delete, move, rewrite, or quarantine archive files.
- `packages/core` has the first GUI-facing service facade. It exposes health,
  archive validate/read/reindex/list, maintenance inspection, and recovery
  inspection through one core entry point for a future GUI. It is not yet wired
  to the Web renderer, Electron, preload, or IPC.
- `packages/core` has a minimal in-memory task scheduler skeleton for fixture
  capture tasks.
- `packages/core` has a fixture-only adapter lifecycle host that consumes
  adapter protocol messages and records ready/fact/diagnostic/error/finished
  state without starting real child processes.
- `packages/core` has the first offline fixture capture pipeline exposed
  through the GUI-facing service. It can turn fixture adapter messages into a
  capture task, write a synthetic `.chron` archive, reindex SQLite, and report
  success/failure to future GUI callers.
- Adapter lifecycle errors and missing `adapter.finished` messages map to
  failed tasks and skip archive indexing.
- `apps/desktop` has the first Web-first React/Vite recording dashboard shell.
  It renders maintained streamers, a selected streamer monitoring workspace,
  automatic recording state, disabled recording preview placeholder, recording
  information, pinned current session, history, and global information from
  synthetic static data only.
- `apps/desktop/src/recordingDashboard.ts` now owns a browser-safe dashboard
  state/reducer, monitoring actions, and synthetic offline self-test action.
  The renderer can select streamers from the left rail, click pause monitoring,
  resume monitoring, check now, and `Run offline self-test` without calling
  Node-only core/archive/indexer APIs.
- The Web dashboard now has per-streamer synthetic context. Selecting a
  streamer changes the center workspace, recording details, latest facts,
  right-side current-session card, history list, and streamer summary. Paused
  or offline streamers show `No current recording` instead of `Recording Now`.
- Left streamer rows now render site and last-check time on separate lines.
- The left streamer rail is widened with explicit CSS width variables. Streamer
  rows now show synthetic status lanes for availability, show mode, media-stream
  recording state, and information-stream recording state. These are UI mock
  states only, not real site/capture detection.
- The row states are now presented as a compact status board rather than loose
  chips: 48px availability cell plus a wider show-mode cell on the top row,
  then equal-width side-by-side media-stream and information-stream cells with
  `title` hover descriptions.
- The left rail is currently enlarged to 560px. Streamer cards are 112px tall,
  the status board is 256px wide, and the left-card typography scale is
  18px streamer name, 16px site/check text, and 14px status cells.
- Browser smoke confirmed the enlarged left rail renders on
  `http://127.0.0.1:5187/`; all six synthetic streamer rows have a four-cell
  status board, media/info cells sit on the same row, and no detected text or
  card overflow was found.
- `apps/desktop` defaults to `http://127.0.0.1:5187/` for dev. Do not use
  `5173` for Chronarium because the user uses that port for other local work.
- Root-level TDD slices are now organized under `tdd-tests/` by owner path; the
  first one is
  `tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`.
- `packages/media-tools` has typed FFmpeg/ffprobe command builders that return
  argv/redactedArgv descriptions. It does not execute real binaries.
- `docs/MAINTENANCE_OPS_DESIGN.md` records the draft maintenance / ops
  inspection model and external project references.
- `docs/CB_RECORDING_REFERENCES.md` records public GitHub project references
  for Chaturbate-style split audio/video recording and the design boundaries
  Chronarium should keep before real CB adapter work.
- `docs/REPLAY_MODEL_V1.md` records the draft replay semantics contract:
  replay inputs, the replay clock, seek and state reconstruction, and the
  constraints replay places on archive and timeline contracts.
- `docs/GUI_CORE_PROTOCOL.md` records the draft GUI-to-core message protocol
  mirroring `docs/ADAPTER_PROTOCOL.md`; no Electron/preload/IPC or live
  GUI-core binding exists.
- `docs/DIAGNOSTIC_CODES_V1.md` records the diagnostic code registry: the
  twenty-six implemented archive validation issue codes plus naming, stability,
  and reserved-area rules.
- `docs/MEDIA_TOOLS_BOUNDARY.md` records the typed external media tool
  contract promoted from the CB reference document; `packages/media-tools`
  implements command builders only, not execution.
- `docs/plan/plan_archive_recovery.md` records the interrupted-write recovery
  design plan; the first implemented slice is report-only inspection.
- `packages/adapters/chaturbate` has a first offline split audio/video
  synthetic fixture for a CB-like LL-HLS/CMAF topology.
- The Chaturbate fixture code converts that fixture into media track metadata
  and timeline facts, then verifies those facts through the existing adapter
  protocol fixture runner.
- The Chaturbate fixture can also be written into a synthetic `.chron` archive,
  read/validated by `packages/archive`, and indexed by `packages/indexer`.
- `packages/adapters/chaturbate` now also has synthetic diagnostic fixtures
  for missing audio, media gap, audio/video duration mismatch, and stalled
  output. These fixtures are contract tests for Chronarium's ability to store,
  read, validate, and query bad recording facts; they do not prove current live
  Chaturbate behavior.
- `packages/testkit` has synthetic session, timeline event, archive manifest,
  and media track helpers.
- `packages/archive` has first streaming-shaped timeline read entries:
  `iterateTimelineRecords` and `readTimelineEventBatches`. They parse JSONL
  line by line and yield events or validation issues through bounded records or
  batches.
- `packages/testkit` has `createLargeSyntheticTimelineBuilder` for deterministic
  large timeline event generation, JSONL chunk streaming, and synthetic `.chron`
  fixture writing without constructing one giant event array.
- `tools/benchmarks/timeline-scan-benchmark.mjs` can generate and scan a local
  synthetic `.chron` archive under ignored `runtime/benchmarks/`, reporting time
  and memory data. The root script is
  `pnpm benchmark:timeline -- --events 1000 --batch-size 128`.
- `docs/plan/plan_streaming_archive_io_and_benchmarks.md` now tracks the first
  implemented archive timeline batch API, testkit builder, and benchmark smoke.
  The indexer has moved to the batch reader; replay, GUI, and maintenance
  consumers have not yet moved.
- `docs/plan/plan_web_dashboard_offline_behavior.md` records the historical
  safe first behavior slice for the Web dashboard: synthetic demo action only,
  no core filesystem calls from the browser renderer.
- `docs/plan/plan_web_dashboard_monitoring_semantics.md` records the current
  correction: recording is automatic after streamer monitoring detects a live
  session, while the visible controls are pause monitoring, resume monitoring,
  check now, and offline self-test.
- `docs/plan/plan_web_dashboard_streamer_selection.md` records the first
  selectable maintained-streamer list behavior.
- `docs/plan/plan_web_dashboard_streamer_context.md` records the check-time
  wrapping fix and selected-streamer context linkage.
- Sixteen Vitest behavior test files exercise synthetic archive writing, reading,
  validation failures, SQLite indexing, the core archive/index service, core
  runtime lifecycle, core maintenance inspection, archive recovery inspection,
  the core GUI facade, task scheduling, fixture adapter lifecycle, offline
  fixture capture pipeline, media command builders, and the first desktop
  recording dashboard behavior, plus Chaturbate offline split-track fixture
  behavior and fixture archive/indexer and diagnostic flows.
- No Electron shell, preload/IPC, live GUI-core binding, live task execution,
  real adapter child process, external media tool execution, real media segment
  capture/reader/prober, archive repair/migration, replay player, or real site
  capture exists yet.
- GitHub target provided by the user:
  `https://github.com/grshlogan/Chronarium.git`.
- Conversation context files currently represent only two active conversation
  contexts:
  - `docs/conversation-A01-documentation-and-initial-skeleton.md` for Codex.
  - `docs/conversation-A02-foundation-docs-completion.md` for ClaudeCode.
- The Chaturbate offline fixture and core maintenance inspector work are now
  tracked inside A01. Do not recreate A03/A04 conversation context files for
  those A01-internal phases.

## Files Created In The Foundation Steps

```text
README.md
AGENTS.md
docs/CONTEXT.md
docs/ARCHITECTURE.md
docs/PRODUCT_SPEC.md
docs/ARCHIVE_FORMAT_V1.md
docs/TIMELINE_SCHEMA_V1.md
docs/REPLAY_MODEL_V1.md
docs/ADAPTER_PROTOCOL.md
docs/GUI_CORE_PROTOCOL.md
docs/DIAGNOSTIC_CODES_V1.md
docs/MEDIA_TOOLS_BOUNDARY.md
docs/SECURITY_PRIVACY.md
docs/MAINTENANCE_OPS_DESIGN.md
docs/CB_RECORDING_REFERENCES.md
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
docs/plan/plan_core_archive_index_service.md
docs/plan/plan_core_runtime_lifecycle_shell.md
docs/plan/plan_maintenance_ops_design.md
docs/plan/plan_cb_recording_references.md
docs/plan/plan_foundation_docs_completion.md
docs/plan/plan_archive_recovery.md
docs/plan/plan_chaturbate_offline_split_fixture.md
docs/plan/plan_chaturbate_fixture_archive_flow.md
docs/plan/plan_chaturbate_offline_diagnostic_fixtures.md
docs/plan/plan_core_maintenance_inspector_foundation.md
docs/plan/plan_archive_recovery_and_gui_core_facade.md
docs/plan/plan_streaming_archive_io_and_benchmarks.md
docs/plan/plan_web_dashboard_offline_behavior.md
docs/plan/plan_web_first_recording_dashboard.md
docs/conversation-A01-documentation-and-initial-skeleton.md
docs/conversation-A02-foundation-docs-completion.md
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
packages/media-tools/
packages/testkit/
apps/desktop/
tdd-tests/
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

1. Add media segment hash and duration validation fixtures, still without
   executing media tools.
2. Continue WebUI behavior with add-link form validation and clearer
   pause/resume/check state feedback, still synthetic-only.
3. Replace the browser-only offline self-test action with a real GUI-facing
   DTO/preload boundary, then connect it to `CoreGuiService` without letting the
   renderer call archive/indexer internals directly.
4. Add media-tool output parser fixtures for ffprobe/ffmpeg without executing
   real tools.
5. Build the Electron shell and preload/IPC boundary around the existing
   Web-first renderer only after the GUI/core DTO boundary is stable.
6. Let the Web renderer use the offline fixture capture pipeline to show
   archive list, timeline facts, validation, recovery, and maintenance status.
7. Extend the maintenance inspector with index freshness comparison, keeping
   writes as explicit safe-rebuild suggestions rather than automatic actions.
8. Add real media segment IO only after segment reader/validator coverage,
   media-track metadata validation, and media-tool fixture parsing remain
   stable.
9. If real Chaturbate behavior needs validation, first prepare separately
   approved redacted evidence or synthetic reproductions derived from approved
   local samples.

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

Core archive/index service continuation checks:

- `pnpm exec vitest run packages/core/tests`: passed 1 Vitest file and 2 tests.
- First `pnpm typecheck` during this continuation failed because tests were
  included in `packages/core/tsconfig.json` while `rootDir` was `src`; fixed by
  keeping package typecheck focused on `src`.
- Untracked generated files appeared under package source/test folders after
  check runs; removed only the explicit generated files.
- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 4 Vitest files and 30 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.

Core runtime lifecycle shell continuation checks:

- `pnpm exec vitest run packages/core/tests`: passed 2 Vitest files and 4
  tests.
- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 5 Vitest files and 32 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed across all workspace packages.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: all `package.json` and `tsconfig`
  files parsed successfully.

CB recording references continuation checks:

- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON/package config parse scan succeeded.

Foundation docs completion (A02) checks:

- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON/package config parse scan succeeded.
- New documents verified to use LF endings and end with a single newline.
- Regression guard on unchanged code: `pnpm typecheck` passed, `pnpm test`
  passed 5 Vitest files and 32 tests, `pnpm build` passed.

Chaturbate offline split-track fixture checks:

- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 1 file and
  3 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 6 files and 35 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: succeeded.

Chaturbate fixture archive flow checks:

- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 2 files and
  4 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 7 files and 36 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: produced no
  output.
- JSON parse scan with `ConvertFrom-Json`: succeeded.

Chaturbate offline diagnostic fixture checks:

- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 3 files and
  7 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 8 files and 39 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan produced no output.
- JSON parse scan succeeded for package/config and synthetic fixture JSON
  files.

Core maintenance inspector checks:

- `pnpm exec vitest run packages/core/tests`: passed 3 files and 7 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 9 files and 42 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan produced no output.
- JSON parse scan succeeded for package/config and synthetic fixture JSON
  files.

Offline fixture capture pipeline checks:

- Image2 `gpt-image2-proxy health --network`: passed and listed
  `gpt-image-2`.
- Image2 small smoke generation succeeded at
  `runtime/imagegen/image2-smoke.png`.
- Image2 GUI concept generation command hit the 5 minute timeout, but the
  output image later appeared at
  `runtime/imagegen/chronarium-gui-concept.png` and was visually inspected.
- TDD RED: `pnpm exec vitest run
  packages/core/tests/offlineFixtureCapturePipeline.test.ts` failed because
  `gui.runOfflineFixtureCapture` did not exist.
- Targeted pipeline test after implementation: passed 1 file and 3 tests.
- First `pnpm typecheck` failed because an adapter error needed explicit
  `adapter.error` type narrowing; fixed with a type guard.
- `pnpm typecheck`: passed after the type guard.
- `pnpm exec vitest run packages/core/tests`: passed 7 files and 18 tests.
- `pnpm test`: passed 15 files and 63 tests.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan parsed 22 JSON files.
