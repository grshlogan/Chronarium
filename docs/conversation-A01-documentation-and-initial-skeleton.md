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

The current A01 archive performance pass implemented the first part of that
plan. `packages/archive` now exposes `iterateTimelineRecords` and
`readTimelineEventBatches` so callers can scan timeline JSONL through bounded
records or batches. `packages/testkit` now exposes
`createLargeSyntheticTimelineBuilder` for deterministic large synthetic
timeline generation and JSONL chunk writing. The root
`benchmark:timeline` script runs `tools/benchmarks/timeline-scan-benchmark.mjs`
to generate and scan local synthetic archives under ignored `runtime/`.
Existing full-snapshot archive APIs still exist. The indexer has moved to the
batch reader; replay, GUI, and maintenance consumers have not yet migrated.

The current A01 foundation pass then moved `packages/indexer` onto that batch
reader. Indexing now uses `validateFileArchiveStreaming` for archive summary
and validation issues, then inserts timeline rows from `readTimelineEventBatches`
instead of `validateFileArchive().timelineEvents`.

The same pass added the first fixture-safe media segment write boundary to the
archive writer. `writeMediaSegment` writes caller-provided synthetic bytes under
declared `tracks/<track-id>/segments/<segment-name>` paths and rejects
undeclared tracks, unsafe segment names, existing segment files, and writes
after finalization. This is not real FFmpeg capture or media probing yet.

The current A01 archive validation pass added basic media segment referenced-file
checks. `media.segment.*` timeline facts that include `relativePath` now have
their payload schema, track id, path safety, owning `segmentsPath`, file
existence, and declared `byteLength` checked by both snapshot validation and
streaming validation. Segment facts without `relativePath` remain valid
observations for discovered-but-not-yet-downloaded segments. Hash, duration,
container, codec, and FFmpeg/ffprobe validation remain pending.

The current A01 documentation pass recorded the updated media lifecycle and
retention requirements. `docs/MEDIA_LIFECYCLE_AND_RETENTION.md` now states that
Chronarium should support configurable retention/upload policies rather than
forcing one deletion model on every user. The project owner's local deployment
policy is raw media -> process/transcode -> verify processed output -> delete
raw, then processed output -> scheduled upload -> verify upload -> delete local
output, with timeline facts kept locally. This is a personal deployment policy,
not mandatory release behavior. The same document records raw versus processed
hash responsibilities, CB-like split audio/video raw-track preservation,
SC-like combined A/V handling, gap fill as synthetic derived output, and
verification-backed deletion gates. The user then clarified that processing
recording products should prioritize editability over strict automatic
continuity: future processing must be able to merge interrupted or restarted
sessions, exclude tiny or unusable fragments, and record output timeline
mappings without rewriting raw capture facts. No real capture, transcode,
upload, hash validation, playable validation, or deletion automation was
implemented in this docs-only pass.

The current A01 adapter-readiness pass added the first reusable gate for
future site adapters. `packages/testkit` now exports
`verifyAdapterFixtureReadiness`, which consumes an adapter fixture message
stream and reports whether it is safe to wire into Chronarium's offline core
contract. It checks shared protocol parsing, adapter/session id matching,
requested capabilities, `adapter.ready` ordering, duplicate `adapter.ready`,
terminal `adapter.finished`, no messages after finished, and secret-looking or
network-looking values/field names. This does not prove live-site behavior; it
only proves offline contract safety.

The same pass added adapter manifests and a core adapter catalog. `packages/types`
and `packages/schemas` now include an `AdapterManifest` contract. Chaturbate
exports `CHATURBATE_ADAPTER_MANIFEST` as fixture-only, with no network access,
no credential requirement, and no sensitive source field emission. Core can
register manifests through `createAdapterCatalog`, list adapters, look up by
adapter id, reject duplicate adapter ids, and reject manifests that declare
sensitive source field emission. This makes the next site adapter path explicit:
manifest -> synthetic/redacted fixtures -> readiness gate -> catalog
registration -> only then live-site design.

The current A01 long-run adapter readiness continuation added the first
non-Chaturbate adapter scaffold. `packages/adapters/stripchat` is fixture-only
and models an SC-like combined audio/video HLS topology with one raw media
track. It exports `STRIPCHAT_ADAPTER_MANIFEST`, parses a synthetic combined A/V
fixture, builds media track metadata, emits timeline facts through an adapter
protocol fixture runner, passes `verifyAdapterFixtureReadiness`, and registers
through `createAdapterCatalog`. It records non-contiguous segments as
`media.gap.detected` facts and rejects overlapping or backwards segment timing.
It does not connect to Stripchat, download media, poll rooms, handle accounts,
or serialize cookies/headers/tokens/sessions/signed URLs.

The same continuation added the first core adapter task gate. `CoreRuntime` can
optionally hold adapter manifests as an adapter catalog. When a GUI-facing
offline fixture capture call runs with that catalog, the pipeline rejects
unregistered adapters, unsupported runtime modes, missing requested
capabilities, and fixture adapters that are not marked fixture-ready before
consuming adapter messages or writing archives. `docs/ADAPTER_SITE_READINESS.md`
now records the practical checklist for future site adapter packages.

The current A01 adapter worker boundary pass added
`readAdapterWorkerJsonlMessages` in `packages/core`. This is the first safe
parser for future adapter child-process stdout. It reads JSON Lines, ignores
blank lines, validates adapter-to-core protocol messages through the shared
schema, and throws line-numbered `AdapterWorkerMessageStreamError` values for
invalid JSON or invalid protocol without echoing raw worker output. It does not
spawn workers, connect to live sites, or execute media tools.

The same adapter worker boundary pass added `createAdapterWorkerCommand` in
`packages/core`. It returns a typed future `spawn` descriptor with
`executablePath`, `argv`, `redactedArgv`, and `shell: false`. It models adapter
id, runtime mode, session id, capabilities, and optional fixture name as
structured arguments, rejects relative paths, empty values, and newline-bearing
values, and does not spawn processes.

The current adapter worker boundary pass added `runModeledAdapterWorker` in
`packages/core`. This no-spawn harness combines a worker command descriptor,
modeled stdout JSONL, stderr lines, exit code, and lifecycle request into a
structured worker report. It maps invalid stdout and non-zero exit codes into
failed reports, while valid stdout and exit code 0 produce a completed
lifecycle report. It still does not start child processes or connect to real
sites.

The current adapter readiness audit added `docs/REAL_SITE_ADAPTER_BRINGUP.md`.
It records that Chronarium is ready to begin real-site adapter design and
fixture-first bring-up, but not ready to run live capture. The checklist defines
allowed work, prohibited work, current evidence, the first safe work package,
and the promotion requirements before any adapter manifest can add `live`.

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

The latest A01 UI typography refinement enlarged the maintained-streamer cards
after user review. The left rail is now 560px wide, streamer cards are 112px
tall, the status board is 256px wide, and the left-card typography scale is
18px streamer name, 16px site/check text, and 14px status cells. This remains a
synthetic WebUI presentation change only.

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
- `tools/benchmarks/timeline-scan-benchmark.mjs`
- `packages/archive/src/timelineReader.ts`
- `packages/archive/src/segmentValidation.ts`
- `packages/archive/src/streamingValidator.ts`
- `packages/testkit/src/largeTimeline.ts`
- `packages/indexer/src/archiveIndexer.ts`
- `packages/archive/src/writer.ts`
- `packages/schemas/src/mediaSchemas.ts`
- `packages/schemas/src/primitiveSchemas.ts`
- `docs/plan/plan_media_segment_reader_validator.md`
- `docs/MEDIA_LIFECYCLE_AND_RETENTION.md`
- `docs/plan/plan_media_lifecycle_upload_retention.md`
- `docs/plan/plan_adapter_site_readiness_gate.md`
- `packages/types/src/adapter.ts`
- `packages/schemas/src/adapterSchemas.ts`
- `packages/core/src/adapters/adapterCatalog.ts`
- `packages/core/src/adapters/index.ts`
- `packages/core/package.json`
- `packages/core/tsconfig.json`
- `packages/adapters/chaturbate/src/manifest.ts`
- `packages/adapters/chaturbate/src/index.ts`
- `packages/testkit/src/adapterReadiness.ts`
- `packages/testkit/src/index.ts`
- `packages/testkit/package.json`
- `packages/testkit/tsconfig.json`
- `tdd-tests/packages/core/adapter-catalog/adapterCatalog.test.ts`
- `tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts`
- `tdd-tests/packages/archive/timeline-reader/timelineReader.test.ts`
- `tdd-tests/packages/indexer/timeline-batches/indexerTimelineBatches.test.ts`
- `tdd-tests/packages/testkit/large-timeline/largeSyntheticTimeline.test.ts`
- `docs/plan/plan_web_dashboard_offline_behavior.md`
- `docs/plan/plan_web_dashboard_monitoring_semantics.md`
- `docs/plan/plan_web_dashboard_streamer_selection.md`
- `docs/plan/plan_web_dashboard_streamer_context.md`
- `docs/plan/plan_web_first_recording_dashboard.md`
- `docs/APP_CODE_MAP.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`

Current long-run adapter readiness continuation adds:

- `docs/ADAPTER_SITE_READINESS.md`
- `docs/plan/plan_stripchat_offline_combined_fixture.md`
- `packages/adapters/stripchat/package.json`
- `packages/adapters/stripchat/tsconfig.json`
- `packages/adapters/stripchat/fixtures/README.md`
- `packages/adapters/stripchat/fixtures/combined-av.synthetic.json`
- `packages/adapters/stripchat/src/combinedFixture.ts`
- `packages/adapters/stripchat/src/fixtureAdapter.ts`
- `packages/adapters/stripchat/src/index.ts`
- `packages/adapters/stripchat/src/manifest.ts`
- `packages/core/src/runtime.ts`
- `packages/core/src/guiService.ts`
- `packages/core/src/offlineFixtureCapturePipeline.ts`
- `packages/core/src/adapters/adapterMessageStream.ts`
- `packages/core/src/adapters/adapterWorkerCommand.ts`
- `packages/core/src/adapters/adapterWorkerSupervisor.ts`
- `packages/core/src/adapters/index.ts`
- `tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts`
- `tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts`
- `tdd-tests/packages/core/adapter-message-stream/adapterMessageStream.test.ts`
- `tdd-tests/packages/core/adapter-worker-command/adapterWorkerCommand.test.ts`
- `tdd-tests/packages/core/adapter-worker-supervisor/adapterWorkerSupervisor.test.ts`
- `docs/plan/plan_adapter_worker_message_stream.md`
- `docs/plan/plan_adapter_worker_command_builder.md`
- `docs/plan/plan_adapter_worker_supervisor_harness.md`
- `docs/REAL_SITE_ADAPTER_BRINGUP.md`
- `docs/plan/plan_real_site_adapter_bringup_checklist.md`
- `tsconfig.json`
- `vitest.config.ts`

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
- TDD RED for archive timeline batches:
  `pnpm exec vitest run
  tdd-tests/packages/archive/timeline-reader/timelineReader.test.ts` failed
  because `readTimelineEventBatches` did not exist.
- GREEN for archive timeline batches: added `iterateTimelineRecords` and
  `readTimelineEventBatches`; the targeted archive timeline reader test passed.
- Added coverage that invalid timeline JSONL lines stream as diagnostics rather
  than throwing or disappearing.
- TDD RED for the large synthetic timeline builder:
  `pnpm exec vitest run
  tdd-tests/packages/testkit/large-timeline/largeSyntheticTimeline.test.ts`
  failed because `createLargeSyntheticTimelineBuilder` did not exist.
- GREEN for the large synthetic timeline builder: added deterministic event
  generation, JSONL chunk streaming, and synthetic `.chron` fixture writing; the
  targeted testkit test passed.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed as a
  local smoke. It generated and scanned 1000 synthetic events in ignored
  `runtime/benchmarks/`, then deleted the generated archive.
- TDD RED for indexer batch consumption:
  `pnpm exec vitest run
  tdd-tests/packages/indexer/timeline-batches/indexerTimelineBatches.test.ts`
  failed because indexer did not import `readTimelineEventBatches` and still
  used `report.timelineEvents`.
- GREEN for indexer batch consumption: added `validateFileArchiveStreaming` and
  changed indexer timeline insertion to use `readTimelineEventBatches`; targeted
  indexer tests passed.
- TDD RED for media segment writer: archive writer tests failed because
  `writeMediaSegment` did not exist.
- GREEN for media segment writer: added fixture-safe media segment byte writes
  and rejection tests for undeclared tracks, unsafe segment names, and writes
  after finalization.
- TDD RED for media segment referenced-file validation:
  `pnpm exec vitest run packages/archive/tests/archiveReaderValidator.test.ts`
  failed because a timeline fact referencing a missing segment file still
  validated successfully.
- GREEN for snapshot media segment validation: added `MediaSegmentFact` runtime
  schema and `validateTimelineMediaSegments`; the targeted archive validator
  test passed.
- TDD RED for streaming media segment validation: targeted archive validator
  test failed because `validateFileArchiveStreaming` did not report
  `segment.missing_file`.
- GREEN for streaming media segment validation: connected streaming validation
  to the shared segment validator; targeted archive validator tests passed.
- Targeted archive/adapter/indexer regression:
  `pnpm exec vitest run packages/archive/tests packages/adapters/chaturbate/tests
  packages/indexer/tests
  tdd-tests/packages/indexer/timeline-batches/indexerTimelineBatches.test.ts`
  passed 8 files and 54 tests, with the known Node `node:sqlite`
  ExperimentalWarning.
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
- TDD contract coverage was expanded so the dashboard test reads
  `apps/desktop/src/styles.css` and checks the enlarged streamer-card visual
  scale: 560px left rail, 112px cards, 256px status board, and 18px / 16px /
  14px text levels.
- Browser smoke confirmed the enlarged streamer rail on
  `http://127.0.0.1:5187/`: 560px left rail, 112px cards, 256px status board,
  18px names, 16px site/check text, 14px status cells, and no detected text
  overflow.
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
- Added `docs/plan/plan_media_lifecycle_upload_retention.md` and
  `docs/MEDIA_LIFECYCLE_AND_RETENTION.md` as a documentation-only pass. No real
  capture, transcoding, upload, playable validation, hash validation, or
  deletion automation was implemented.
- `git diff --check`: passed after the media lifecycle documentation pass.
- trailing whitespace scan: passed after the media lifecycle documentation pass.
- JSON/package config parse scan: parsed 24 JSON files after the media
  lifecycle documentation pass.
- TDD RED for adapter readiness gate:
  `pnpm exec vitest run
  tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts` failed
  because `verifyAdapterFixtureReadiness` did not exist.
- GREEN for adapter readiness gate: added the testkit readiness gate and the
  targeted test passed.
- TDD RED/GREEN for adapter readiness ordering: facts after
  `adapter.finished`, duplicate `adapter.ready`, and secret-looking diagnostic
  field names each failed first, then passed after the readiness gate was
  tightened.
- TDD RED for adapter catalog:
  `pnpm exec vitest run
  tdd-tests/packages/core/adapter-catalog/adapterCatalog.test.ts` failed
  because `createAdapterCatalog` did not exist.
- GREEN for adapter catalog: added adapter manifest types/schema, the
  Chaturbate fixture-only manifest, and core adapter catalog; targeted catalog
  test passed.
- Targeted adapter readiness/catalog tests passed 2 files and 5 tests.
- `pnpm typecheck`: passed after adapter readiness gate and catalog work.
- `pnpm test`: passed 21 files and 95 tests after adapter readiness gate and
  catalog work, with the known Node `node:sqlite` ExperimentalWarning.
- `pnpm build`: passed after adapter readiness gate and catalog work.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed after
  adapter readiness gate and catalog work.
- `git diff --check`: passed after adapter readiness gate and catalog work.
- trailing whitespace scan: passed after adapter readiness gate and catalog
  work.
- JSON/package config parse scan: parsed 24 JSON files after adapter readiness
  gate and catalog work.
- TDD RED for Stripchat combined A/V fixture:
  `pnpm exec vitest run
  tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts`
  initially failed because `@chronarium/adapter-stripchat` did not exist.
- GREEN for Stripchat scaffold: added the fixture-only package, synthetic
  combined A/V fixture, parser/builders, manifest, and fixture runner; targeted
  Stripchat test passed.
- TDD RED for Stripchat segment timing: overlapping combined media segments
  were accepted; GREEN added overlap/backwards timing rejection.
- TDD RED for Stripchat gap facts: non-contiguous combined media segments did
  not emit `media.gap.detected`; GREEN added gap fact generation.
- TDD RED for core adapter task gate:
  `pnpm exec vitest run
  tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts` failed because
  an unregistered adapter task consumed adapter messages before preflight.
- GREEN for core adapter task gate: `CoreRuntime` now optionally holds adapter
  manifests as a catalog, `CoreGuiService` passes that catalog into offline
  fixture capture, and the pipeline fails unregistered/incapable adapters before
  adapter startup.
- Targeted readiness/catalog/adapter-gate/Stripchat regression passed 6 files
  and 16 tests.
- `pnpm typecheck`: passed after Stripchat scaffold and core adapter task gate.
- `pnpm test`: passed 23 files and 100 tests after Stripchat scaffold and core
  adapter task gate, with the known Node `node:sqlite` ExperimentalWarning.
- `pnpm build`: passed after Stripchat scaffold and core adapter task gate.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed after
  Stripchat scaffold and core adapter task gate.
- `git diff --check`: passed after Stripchat scaffold and core adapter task
  gate.
- trailing whitespace scan: passed after Stripchat scaffold and core adapter
  task gate.
- JSON/package config parse scan: parsed 26 JSON files after Stripchat scaffold
  and core adapter task gate.
- TDD RED for adapter worker JSONL stream:
  `pnpm exec vitest run
  tdd-tests/packages/core/adapter-message-stream/adapterMessageStream.test.ts`
  failed because `readAdapterWorkerJsonlMessages` did not exist.
- GREEN for adapter worker JSONL stream: added the core parser and exported it
  through `packages/core/src/adapters/index.ts`; targeted test passed.
- TDD RED/GREEN for worker stream errors: invalid JSON errors gained stable
  `adapter_worker_stream.invalid_json` code and line numbers without echoing raw
  output.
- Added protocol-invalid coverage for sensitive-looking fields; errors use
  `adapter_worker_stream.protocol_invalid` without echoing raw worker output.
- Targeted adapter worker message stream tests passed 1 file and 3 tests.
- `pnpm typecheck`: passed after adapter worker JSONL message stream parser.
- `pnpm test`: passed 24 files and 103 tests after adapter worker JSONL message
  stream parser, with the known Node `node:sqlite` ExperimentalWarning.
- `pnpm build`: passed after adapter worker JSONL message stream parser.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed after
  adapter worker JSONL message stream parser.
- `git diff --check`: passed after adapter worker JSONL message stream parser.
- trailing whitespace scan: passed after adapter worker JSONL message stream
  parser.
- JSON/package config parse scan: parsed 26 JSON files after adapter worker
  JSONL message stream parser.
- TDD RED for adapter worker command builder:
  `pnpm exec vitest run
  tdd-tests/packages/core/adapter-worker-command/adapterWorkerCommand.test.ts`
  failed because `createAdapterWorkerCommand` did not exist.
- GREEN for adapter worker command builder: added a typed command descriptor
  builder and exported it through core adapters; targeted test passed.
- Added safety coverage that rejects relative worker entry paths and
  newline-bearing arguments.
- Targeted adapter worker command tests passed 1 file and 2 tests.
- `pnpm typecheck`: passed after adapter worker command builder.
- `pnpm test`: passed 25 files and 105 tests after adapter worker command
  builder, with the known Node `node:sqlite` ExperimentalWarning.
- `pnpm build`: passed after adapter worker command builder.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed after
  adapter worker command builder.
- `git diff --check`: passed after adapter worker command builder.
- trailing whitespace scan: passed after adapter worker command builder.
- JSON/package config parse scan: parsed 26 JSON files after adapter worker
  command builder.
- TDD RED for no-spawn adapter worker supervisor:
  `pnpm exec vitest run
  tdd-tests/packages/core/adapter-worker-supervisor/adapterWorkerSupervisor.test.ts`
  failed because `runModeledAdapterWorker` did not exist.
- GREEN for no-spawn adapter worker supervisor: added the harness and exported
  it through core adapters; targeted test passed.
- TDD RED/GREEN for invalid stdout: invalid worker JSONL initially escaped as an
  exception, then became a failed report with
  `adapter_worker_stream.invalid_json` and no raw stdout echo.
- Added non-zero exit coverage: exit code 7 produces
  `adapter_worker.exit_nonzero` even when lifecycle messages finish.
- Targeted adapter worker supervisor tests passed 1 file and 3 tests.
- `pnpm typecheck`: passed after no-spawn adapter worker supervisor.
- `pnpm test`: passed 26 files and 108 tests after no-spawn adapter worker
  supervisor, with the known Node `node:sqlite` ExperimentalWarning.
- `pnpm build`: passed after no-spawn adapter worker supervisor.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed after
  no-spawn adapter worker supervisor.
- `git diff --check`: passed after no-spawn adapter worker supervisor.
- trailing whitespace scan: passed after no-spawn adapter worker supervisor.
- JSON/package config parse scan: parsed 26 JSON files after no-spawn adapter
  worker supervisor.
- Added `docs/plan/plan_documentation_code_state_sync.md` for a docs-only pass
  that reviewed current code exports, package state, and stale implementation
  wording.
- Synced `docs/PRODUCT_SPEC.md`, `docs/ADAPTER_PROTOCOL.md`,
  `docs/ADAPTER_SITE_READINESS.md`, `docs/DEVELOPMENT_SETUP.md`,
  `docs/DIAGNOSTIC_CODES_V1.md`, `docs/APP_CODE_MAP.md`, `README.md`, and
  `docs/AI_HANDOFF.md` with current code facts.
- The sync clarified that the Web-first renderer exists but still has no
  Electron shell, preload/IPC, or live GUI-core binding.
- The sync clarified that `segment.*` validation codes are implemented for
  basic referenced-file checks, while other reserved diagnostic areas remain
  drafts.
- The sync clarified that adapter worker support is currently JSONL parsing,
  typed command descriptors, and a no-spawn supervisor harness only; real
  child-process launching remains pending.
- The `docs/APP_CODE_MAP.md` root TDD tree now lists the current archive
  timeline-reader, core worker-supervisor, indexer batch-reader, and large
  timeline test slices.
- `git diff --check`: passed after the documentation/code-state sync.
- trailing whitespace scan: passed after the documentation/code-state sync.
- JSON/package config parse scan: parsed 27 JSON files after the
  documentation/code-state sync.
- Added `docs/plan/plan_timeline_payload_schemas_round3_4_5.md` for A01's
  adapter-readiness foundation closeout, covering diagnostic, room/chat, and
  network/reconnect payload schemas.
- Round 3 RED:
  `pnpm exec vitest run tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  failed because diagnostic payload parse functions and dispatcher entries did
  not exist.
- Round 3 GREEN: added `diagnostic.note`,
  `diagnostic.duration_mismatch`, and `diagnostic.media_tool_output` payload
  schemas, then the targeted schema test passed.
- Round 3 regression: Chaturbate diagnostic fixture archive validation and core
  maintenance inspector tests passed with no `payload.schema_invalid` issues.
- Round 4 RED:
  `pnpm exec vitest run tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts`
  failed because declared/requested `room.state` and `chat.events`
  capabilities did not require matching facts.
- Round 4 GREEN: readiness now requires `room.state.changed` and
  `chat.message.observed` facts; Stripchat emits synthetic room/chat facts, and
  Chaturbate no longer declares `room.state` until it has a room fixture.
- Round 5 RED:
  `pnpm exec vitest run tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  failed because network reconnect payload parse functions and dispatcher
  entries did not exist.
- Round 5 GREEN: added `network.disconnected` and `network.reconnected`
  payload schemas, and expanded the Stripchat synthetic fixture with
  disconnect/reconnect facts before a modeled media gap.
- Targeted Round 3/4/5 slice passed:
  `pnpm exec vitest run tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  passed 4 files and 38 tests.
- Early `pnpm typecheck`: passed after Round 3/4/5 implementation.
- Final `pnpm test`: passed 30 files and 158 tests after aligning the adapter
  catalog test with the current Chaturbate manifest.
- Final `pnpm typecheck`: passed.
- Final `pnpm build`: passed.
- Final `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed
  with 1000 scanned events, 8 batches, and 0 issues.
- Final `git diff --check`: passed.
- Final trailing whitespace scan: found no matches.
- Final JSON/package config parse scan: parsed 29 JSON files.
- Added `docs/plan/plan_credential_task_gate_and_session_facts.md` for the
  fixture-only credential line continuation. This scope explicitly excludes
  real cookies, headers, tokens, signed URLs, encrypted storage, import,
  injection, live requests, and browser cookie extraction.
- TDD RED for core credential gate:
  `pnpm exec vitest run tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts`
  failed because a gated `ticket` capture with no usable credential still
  consumed adapter messages.
- GREEN for core credential gate: `CoreTaskRequest` can now carry
  `recordingIntent` and redacted `streamerRef`; `CoreRuntime` can hold a
  fixture-only `CredentialStore`; `CoreGuiService` passes it into the offline
  fixture capture pipeline; and gated `ticket` / `private` / `spy` captures
  fail preflight with `credential.missing` before adapter startup when no
  usable bound profile exists.
- TDD RED for session credential payload schemas:
  `pnpm exec vitest run tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  failed because the session credential parse functions and registry entries
  did not exist.
- GREEN for session credential payload schemas: added redacted payload types,
  schemas, parse functions, and registry entries for `session.intent_selected`,
  `session.credential_selected`, `session.credential_failover`, and
  `session.credential_missing`.
- Targeted credential gate test passed 1 file and 4 tests.
- Targeted timeline payload schema test passed 1 file and 33 tests.
- Early `pnpm typecheck`: passed after the credential gate and session schema
  implementation.
- Final `pnpm test`: passed 30 files and 166 tests after the credential task
  gate and session fact schema implementation.
- Final `pnpm typecheck`: passed.
- Final `pnpm build`: passed.
- Final `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed
  with 1000 scanned events, 8 batches, and 0 issues.
- Final `git diff --check`: passed.
- Final trailing whitespace scan: found no matches.
- Final JSON/package config parse scan: parsed 29 JSON files.
- Added `docs/plan/plan_media_tool_output_parsers.md` for the Codex
  media-tools lane described in `docs/AGENT_WORK_SPLIT.md`. This lane is
  limited to `packages/media-tools`, matching `tdd-tests`, and Codex-owned docs;
  A02-owned `packages/core`, `packages/types`, `packages/schemas`, and
  `packages/archive` were treated as out of scope.
- TDD RED for media tool output parsers:
  `pnpm exec vitest run tdd-tests/packages/media-tools/output-parsing/mediaToolOutputParsers.test.ts`
  first failed because `parseFfprobeJsonOutput` / `parseFfmpegProgressOutput`
  were not exported.
- GREEN for ffprobe output parsing: added `packages/media-tools/src/outputParsers.ts`
  and a synthetic `ffprobe.synthetic.json` fixture; `parseFfprobeJsonOutput`
  now parses synthetic ffprobe JSON into typed format and stream metadata and
  returns stable sanitized errors for malformed input.
- RED/GREEN for FFmpeg progress parsing: added a synthetic
  `ffmpeg-progress.synthetic.txt` fixture; `parseFfmpegProgressOutput` now
  parses key/value progress lines including `out_time`, `frame`, `fps`,
  `bitrate`, `total_size`, `speed`, and `progress`.
- Targeted media-tools parser and command tests passed 2 files and 8 tests.
- `pnpm typecheck`: passed after the media-tools parser lane.
- `pnpm test`: passed 33 files and 181 tests after the media-tools parser lane.
- `pnpm build`: passed after the media-tools parser lane.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`: passed with
  1000 scanned events, 8 batches, and 0 issues after the media-tools parser
  lane.
- `git diff --check`: passed after the media-tools parser lane.
- trailing whitespace scan: found no matches after the media-tools parser lane.
- JSON/package config parse scan: parsed 30 JSON files after the media-tools
  parser lane.
- Added `docs/plan/plan_web_dashboard_credential_binding.md` for the Codex
  apps/desktop parallel lane. This lane is limited to `apps/desktop`, matching
  `tdd-tests/apps/desktop`, A01 context, and shared docs appended with A01
  notes. It does not touch `packages/**`, root `tsconfig*.json`, or
  `vitest.config.ts`.
- TDD RED for streamer-link validation:
  `pnpm exec vitest run tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  failed because `addStreamerForm` did not exist on dashboard state.
- GREEN for streamer-link validation and add flow: the reducer now validates
  supported synthetic Chaturbate/Stripchat streamer URLs, rejects malformed
  links with safe form feedback, and adds/selects a synthetic maintained
  streamer without contacting any site.
- TDD RED/GREEN for monitoring feedback: pause/resume/check-now actions now
  update `monitoringFeedback`, and the dashboard renders the latest action.
- TDD RED/GREEN for browser-local credential binding: added synthetic
  `RecordingIntent`, mock credential profiles, per-streamer bindings, default
  Cookie election by oldest usable bound profile, profile bind/remove actions,
  public no-cookie guidance, and gated no-usable-Cookie degrade messaging.
- Extra RED/GREEN tightened entitlement matching so a profile is usable only
  when it is healthy and supports the selected gated intent.
- Targeted desktop recording-dashboard tests passed 15 tests.
- `pnpm typecheck`: passed after the desktop credential binding lane.

## Next Safe Step

Use `docs/ADAPTER_SITE_READINESS.md` for the next adapter behavior: add more
synthetic or approved redacted fixtures for playlist parsing, room state,
chat/event extraction, reconnect/gap handling, and error handling before any
live-site request. Do not continue into real credential/Cookie work without
explicit approval for a specific live adapter: encrypted storage, import,
injection, real cookies, and live request paths remain prohibited. The next
worker-boundary step can be a real process launcher/supervisor shell fed by
fixture workers first, still without connecting to real sites. In parallel, add
media segment hash/duration validation fixtures plus schema drafts for editable
processing plans, processed-output, derivation, playable-validation,
retention/upload decision, and deletion-record facts, still without executing
real media tools or deleting files. GUI visual polish is intended for a separate
allowed GUI thread, while A01 should keep working on lower-level archive/core
foundations unless the user redirects. Keep A02 independent and do not create
extra A01 pseudo-conversation files.
