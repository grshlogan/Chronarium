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
- a first read-only core maintenance archive inspector that turns archive
  validator issues and known timeline diagnostic facts into a structured
  `MaintenanceReport`.
- a maintenance / ops inspection design draft with external project references.
- a CB recording reference design doc covering public GitHub projects and
  split audio/video LL-HLS/CMAF lessons.
- synthetic Chaturbate offline fixtures covering split audio/video topology,
  archive/indexer flow, and diagnostic scenarios for missing audio, media gap,
  audio/video duration mismatch, and stalled output.

The current A01 continuation added archive reader/validator foundations before
any real site adapter work.

The A01 continuation also added a minimal rebuildable SQLite index package that
derives rows from synthetic `.chron` archives.

The active follow-up moved basic timeline append invariants into the archive
writer so Chronarium-generated archives avoid preventable timeline errors.

The active follow-up added a maintenance / ops design draft.

The active follow-up also added a CB recording reference design document before
any live CB adapter work.

Later A01 work also added the offline Chaturbate fixture path that had been
incorrectly tracked as `conversation-A03-chaturbate-offline-fixtures.md`.
That work is part of this A01 conversation, not a separate project
conversation. It added:

- synthetic split audio/video fixture data;
- adapter-local fixture parser and builders;
- media track metadata and timeline facts for track topology, track discovery,
  and observed media segments;
- archive/index flow coverage proving synthetic fixture facts can be written
  into `.chron`, validated/read back, and indexed into SQLite;
- synthetic diagnostic fixtures for missing audio, media gap, duration
  mismatch, and stalled output;
- explicit evidence clarification that these are synthetic contract tests and
  do not prove current live Chaturbate behavior.

Later A01 work also added the core maintenance inspector foundation that had
been incorrectly tracked as
`conversation-A04-core-maintenance-inspector-foundation.md`. That work is part
of this A01 conversation, not a separate project conversation. It added:

- first maintenance report/finding/evidence/action suggestion types;
- `createArchiveMaintenanceInspector`;
- read-only archive inspection through the existing core archive/index service;
- conversion of archive validator issues into maintenance findings;
- conversion of known timeline diagnostic facts into maintenance findings for
  `media.gap.detected`, `diagnostic.duration_mismatch`, and
  `diagnostic.media_tool_output`;
- core tests for healthy archives, diagnostic timeline facts, and archive
  validator issue findings.

The current A01 continuation added the first report-only archive recovery
inspector and the first core GUI-facing service facade. This moved the project
toward a GUI-era skeleton without adding any Electron/React app, real site
capture, AI calls, archive repair, or media tooling.

The current A01 continuation also added the first offline fixture capture
pipeline before GUI implementation. It connects fixture task scheduling,
fixture adapter lifecycle messages, archive writing, SQLite reindexing, and
the GUI-facing service facade into one offline vertical slice. It remains
synthetic-only and does not start adapter child processes, connect to live
sites, execute media tools, or write real media segments.

Image2 GUI concept generation was attempted through the local
`gpt-image2-proxy` skill with a 5 minute command timeout. The command returned
timeout, but the generated image later appeared at
`runtime/imagegen/chronarium-gui-concept.png`. The image is stored under the
ignored `runtime/` directory and is a design reference, not an implemented GUI.

The current A01 planning pass recorded a pre-GUI/pre-replay risk:
`validateFileArchive` and `readFileArchive` expose full in-memory
`timelineEvents` arrays. Before GUI, indexer, replay, or maintenance depend more
deeply on that shape, Chronarium should add streaming or batched archive
timeline entry points and large synthetic timeline benchmark fixtures. This is
tracked in `docs/plan/plan_streaming_archive_io_and_benchmarks.md`.

The current A01 GUI pass added the first Web-first React/Vite recording
dashboard shell under `apps/desktop`. It follows the streamer-maintenance
layout direction: maintained streamers on the left, selected streamer recording
workspace in the center, current session and history on the right, and global
information in the lower-left. It uses synthetic static data only. It does not
connect to core, read archives, query SQLite, start tasks, launch Electron,
expose preload/IPC, preview live streams, or connect to real sites. Its default
dev server port is `127.0.0.1:5187`; A01 stopped the earlier Chronarium Vite
process on `5173` after the user said that port is used by other local
development work.

A01 also hardened the TDD rules in `AGENTS.md` and added
`tdd-tests/README.md`. Root-level TDD slices now belong under an owner-shaped
tree such as `tdd-tests/apps/desktop/recording-dashboard/`, not as flat files
directly under `tdd-tests/`.

The current A01 behavior pass added a browser-safe offline fixture capture demo
for the Web dashboard. The new `apps/desktop/src/recordingDashboard.ts` owns
dashboard state, reducer actions, and a synthetic demo action. The UI can click
`Run fixture capture` and render a completed result into history and latest
facts. This is not a core/archive/indexer integration yet; it deliberately does
not write `.chron` archives, query SQLite, call Node APIs from the browser, or
connect to a real site.

The current A01 UI semantics pass corrected that Web dashboard behavior to the
real Chronarium product model. The visible recording workflow is now
monitoring-first: users add and maintain streamer links, pause monitoring,
resume monitoring, or check now. Recording is shown as an automatic result of a
monitored streamer being live, not as a manual "start recording" command. The
old browser-safe fixture demo is now presented as `Run offline self-test` under
maintenance diagnostics, still synthetic-only and still not connected to core,
filesystem, SQLite, Electron, or real sites.

The same A01 UI continuation then added the first left-rail streamer selection
behavior. Maintained streamer rows are now clickable buttons, and selecting a
streamer updates the browser-local selected workspace. This remains synthetic
state only; it does not persist streamer records, parse real links, call core,
or connect to live sites.

The current A01 UI continuation fixed the left streamer list check-time
wrapping and added per-streamer synthetic contexts. Each maintained streamer now
has its own room state, current session or no-current-recording state, history,
latest facts, and summary metrics. Selecting a streamer updates the center
workspace and right-side session context. This remains browser-local synthetic
state only and still does not call core, archive, SQLite, Electron, adapters, or
real sites.

The current A01 UI continuation also widened the left maintained-streamer rail
and added synthetic status lanes for each streamer row: availability,
show-mode/ticket context, media-stream recording state, and information-stream
recording state. This is only a WebUI mock-state presentation layer. It does
not implement real Chaturbate state detection, private-show handling, media
stream capture, or information stream capture.

The latest A01 UI refinement changed those loose status lanes into a compact
right-side status board. The top row uses a short availability cell and a wider
show-mode/ticket cell; the lower row now keeps media-stream and
information-stream states side by side with equal widths. Each cell has basic
hover text through `title`. The avatar, three-line identity block, and status
board are vertically centered as three aligned blocks in each streamer card.

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
- This Codex thread may maintain only this A01 conversation context document by
  default. Other `docs/conversation-*.md` files, including A02, are read-only
  unless the user explicitly authorizes editing that specific context document.
- The current project has two active conversation contexts: A01 for Codex and
  A02 for ClaudeCode. A03/A04 were mistaken A01-internal labels and should not
  remain as separate conversation context documents.
- Future A01 phases should update this A01 context and plan/index documents
  instead of creating `conversation-A03-*`, `conversation-A04-*`, or later
  pseudo-conversation files.
- Archive recovery inspection is report-only. It must not delete, move,
  rewrite, repair, quarantine, or reindex archive files.
- The core GUI facade is only an in-process TypeScript API for future GUI
  callers. It is not an Electron preload bridge or IPC implementation.
- The first React/Vite renderer is static and synthetic-only until a GUI-facing
  DTO boundary is added. It must not call `readFileArchive`,
  `validateFileArchive`, or indexer APIs directly.
- The offline fixture capture button in the Web renderer is a browser-safe demo
  action only. A future Electron/preload or GUI DTO client must replace it
  before it can call `CoreGuiService`.
- The Web renderer must not present manual "start recording" as the main user
  action. The main action model is add streamer link, automatic monitoring,
  pause/resume monitoring, and check now.
- Chronarium desktop Web UI development should use port `5187`, not `5173`.

## Files In Scope For This Continuation

Code changes for this continuation:

- `apps/desktop/package.json`
- `apps/desktop/index.html`
- `apps/desktop/tsconfig.json`
- `apps/desktop/vite.config.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/index.ts`
- `apps/desktop/src/main.tsx`
- `apps/desktop/src/mockDashboard.ts`
- `apps/desktop/src/recordingDashboard.ts`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/vite-env.d.ts`
- `tdd-tests/README.md`
- `tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`

Documentation changes for this continuation:

- `AGENTS.md`
- `README.md`
- `docs/DEVELOPMENT_SETUP.md`
- `docs/GUI_CORE_PROTOCOL.md`
- `docs/PRODUCT_SPEC.md`
- `docs/conversation-A01-documentation-and-initial-skeleton.md`
- `docs/plan/plan_streaming_archive_io_and_benchmarks.md`
- `docs/plan/plan_web_dashboard_offline_behavior.md`
- `docs/plan/plan_web_dashboard_monitoring_semantics.md`
- `docs/plan/plan_web_dashboard_streamer_selection.md`
- `docs/plan/plan_web_dashboard_streamer_context.md`
- `docs/plan/plan_web_first_recording_dashboard.md`
- `docs/APP_CODE_MAP.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`

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
- `pnpm exec vitest run packages/adapters/chaturbate/tests`: passed 3 files
  and 7 tests after synthetic Chaturbate diagnostic fixtures.
- `pnpm typecheck`: passed after synthetic Chaturbate diagnostic fixtures.
- `pnpm test`: passed 8 files and 39 tests after synthetic Chaturbate
  diagnostic fixtures.
- `pnpm build`: passed after synthetic Chaturbate diagnostic fixtures.
- `git diff --check`: produced no output after synthetic Chaturbate diagnostic
  fixtures.
- trailing whitespace scan: produced no output after synthetic Chaturbate
  diagnostic fixtures.
- JSON parse scan: succeeded after synthetic Chaturbate diagnostic fixtures.
- `pnpm exec vitest run packages/core/tests`: passed 3 files and 7 tests after
  core maintenance inspector foundation.
- `pnpm typecheck`: passed after core maintenance inspector foundation.
- `pnpm test`: passed 9 files and 42 tests after core maintenance inspector
  foundation.
- `pnpm build`: passed after core maintenance inspector foundation.
- `git diff --check`: produced no output after core maintenance inspector
  foundation.
- trailing whitespace scan: produced no output after core maintenance
  inspector foundation.
- JSON parse scan: succeeded after core maintenance inspector foundation.
- `pnpm exec vitest run packages/archive/tests`: passed 3 files and 27 tests
  after archive recovery inspector.
- `pnpm exec vitest run packages/core/tests`: passed 4 files and 9 tests after
  core GUI facade.
- `pnpm typecheck`: passed after archive recovery inspector and core GUI
  facade.
- `pnpm test`: passed 11 files and 50 tests after archive recovery inspector
  and core GUI facade.
- `pnpm build`: passed after archive recovery inspector and core GUI facade.
- `git diff --check`: produced no output after archive recovery inspector and
  core GUI facade.
- trailing whitespace scan: produced no output after archive recovery inspector
  and core GUI facade.
- JSON/package config parse scan: succeeded after archive recovery inspector
  and core GUI facade.
- `pnpm exec vitest run packages/core/tests packages/media-tools/tests`: passed
  7 files and 19 tests after task scheduler, fixture adapter lifecycle, and
  media-tools command builders.
- `pnpm typecheck`: passed after task scheduler, fixture adapter lifecycle, and
  media-tools command builders.
- `pnpm test`: passed 14 files and 60 tests after task scheduler, fixture
  adapter lifecycle, and media-tools command builders.
- `pnpm build`: passed after task scheduler, fixture adapter lifecycle, and
  media-tools command builders.
- `git diff --check`: produced no output after task scheduler, fixture adapter
  lifecycle, and media-tools command builders.
- trailing whitespace scan: produced no output after task scheduler, fixture
  adapter lifecycle, and media-tools command builders.
- JSON/package config parse scan: succeeded after task scheduler, fixture
  adapter lifecycle, and media-tools command builders.
- Image2 through `gpt-image2-proxy`:
  - `health --network`: passed and listed `gpt-image-2`.
  - small smoke generation: succeeded at `runtime/imagegen/image2-smoke.png`.
  - GUI concept generation with 5 minute command timeout returned timeout, but
    the output image later appeared at
    `runtime/imagegen/chronarium-gui-concept.png`.
- TDD RED 1: `pnpm exec vitest run
  packages/core/tests/offlineFixtureCapturePipeline.test.ts` failed because
  `gui.runOfflineFixtureCapture` did not exist.
- GREEN 1: added `runOfflineFixtureCapture` and exposed it through
  `CoreGuiService`; the targeted test passed.
- TDD RED/GREEN 2: added fixture adapter error coverage; the existing failure
  path satisfied the behavior.
- TDD RED/GREEN 3: added missing `adapter.finished` coverage; the lifecycle
  failure path mapped to a failed task and skipped indexing.
- `pnpm exec vitest run packages/core/tests/offlineFixtureCapturePipeline.test.ts`:
  passed 1 file and 3 tests.
- First `pnpm typecheck` during this continuation failed because
  `offlineFixtureCapturePipeline.ts` read `code/message/retryable` from a broad
  `AdapterToCoreMessage` union; fixed with an `adapter.error` type guard.
- `pnpm typecheck`: passed after adding the type guard.
- `pnpm exec vitest run packages/core/tests`: passed 7 files and 18 tests.
- `pnpm test`: passed 15 files and 63 tests.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON/package config parse scan: parsed 22 JSON files.
- Added `docs/plan/plan_streaming_archive_io_and_benchmarks.md` as a planning
  document only. No streaming archive API, large timeline builder, benchmark
  script, or Rust module was implemented in this planning pass.
- TDD RED for the Web-first recording dashboard:
  `pnpm exec vitest run
  tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  initially failed before the `@chronarium/desktop` app export existed.
- GREEN for the Web-first recording dashboard: the targeted `tdd-tests` Vitest
  file passed after adding the React/Vite app and static dashboard shell.
- Browser smoke on `http://127.0.0.1:5187/` confirmed the main desktop viewport
  renders the three-column dashboard with no detected text overflow.
- TDD RED for the Web dashboard offline behavior:
  `pnpm exec vitest run
  tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  failed because `createInitialRecordingDashboard` was not exported.
- GREEN for the Web dashboard offline behavior: the targeted TDD file passed
  after adding `recordingDashboard.ts`, reducer actions, and the UI demo panel.
- Browser smoke clicked `Run fixture capture` on
  `http://127.0.0.1:5187/` and confirmed `Completed`,
  `Synthetic archive written`, `Fixture capture completed`, and
  `3 timeline facts` were rendered without detected text overflow.
- TDD RED for the Web dashboard monitoring semantics:
  `pnpm exec vitest run
  tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  failed because the dashboard did not render `Pause monitoring`,
  `Resume monitoring`, `Check now`, or `Offline self-test`.
- GREEN for the Web dashboard monitoring semantics: the targeted TDD file
  passed after updating the dashboard state/reducer, monitor controls, and
  offline self-test labels.
- `pnpm typecheck`: passed after the monitoring semantics update.
- TDD RED for Web dashboard streamer selection:
  `pnpm exec vitest run
  tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  failed because selecting `velvet` did not update the selected workspace.
- GREEN for Web dashboard streamer selection: the targeted TDD file passed
  after adding `streamer.select` and clickable streamer rows.
- TDD RED for Web dashboard streamer context:
  `pnpm exec vitest run
  tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  failed because the left list did not expose separate check-time elements and
  paused streamer selection still reused Luna's current recording context.
- GREEN for Web dashboard streamer context: the targeted TDD file passed after
  adding per-streamer context data and selected-context rendering.
- TDD RED for expanded streamer rail status lanes failed until the WebUI
  rendered availability, show mode, media-stream recording state, and
  information-stream recording state in the left maintained-streamer rows.
- GREEN for expanded streamer rail status lanes: the targeted TDD file passed
  after widening the left rail and adding synthetic status lane fields/rendering.
- `pnpm typecheck`: passed after the expanded left-rail status update.
- `pnpm test`: passed 16 files and 70 tests after the expanded left-rail
  status update.
- `pnpm build`: passed after the expanded left-rail status update.
- Browser smoke on `http://127.0.0.1:5187/` confirmed a 382px left rail, four
  status chips per streamer row, and no detected streamer-card overflow.
- `git diff --check`: produced no output after the expanded left-rail status
  update.
- trailing whitespace scan: produced no output after the expanded left-rail
  status update.
- JSON/package config parse scan: parsed 24 JSON files after the expanded
  left-rail status update.
- TDD RED for compact status board hover text failed until the left streamer
  rows exposed a recording decision status board and descriptive hover titles.
- GREEN for compact status board hover text: targeted dashboard test passed
  after changing the loose status chips into a fixed right-side status board.
- Browser smoke confirmed the first streamer status board is 120px wide, its
  top row is 35px plus 81px, its media/info rows are 120px wide, and no cell
  overflow was detected.
- Later browser smoke confirmed the left rail is 438px wide, streamer cards are
  86px high, media/info cells share one row with equal 86px widths, and avatar,
  identity block, and status board all align to the card centerline.
- `pnpm typecheck`: passed after fixing optional current-session updates.
- `pnpm test`: passed 16 files and 69 tests after the Web dashboard streamer
  context update.
- `pnpm build`: passed after the Web dashboard streamer context update.
- Browser smoke on `http://127.0.0.1:5187/` confirmed site/check-time block
  display, `VelvetMoth` no-current-recording context, and `CyberCyan` offline
  empty-history context.
- `git diff --check`: produced no output after the Web dashboard streamer
  context update.
- trailing whitespace scan: produced no output after the Web dashboard streamer
  context update.
- JSON/package config parse scan: parsed 24 JSON files after the Web dashboard
  streamer context update.
- Browser smoke on `http://127.0.0.1:5187/` confirmed pause/resume/check and
  `Run offline self-test` render, old `Run fixture capture` is absent, `Check
  now` queues a visible fact, offline self-test completes, and clicking
  `VelvetMoth` updates the selected paused workspace.
- `pnpm typecheck`: passed after the WebUI monitoring/selection update.
- `pnpm test`: passed 16 files and 66 tests after the WebUI
  monitoring/selection update.
- `pnpm build`: passed after the WebUI monitoring/selection update.
- `git diff --check`: produced no output after the WebUI
  monitoring/selection update.
- trailing whitespace scan: produced no output after the WebUI
  monitoring/selection update.
- JSON/package config parse scan: parsed 24 JSON files after the WebUI
  monitoring/selection update.

## Next Safe Step

Continue the WebUI behavior layer with add-link form validation,
pause/resume/check feedback, and a cleaner diagnostics/self-test surface; or
implement the streaming/batched archive timeline API and benchmark groundwork
before deeper archive consumers hard-code full in-memory arrays. Keep A02
independent and do not create A03, A04, or later conversation context files
unless the user starts new real conversations and explicitly assigns those IDs.
