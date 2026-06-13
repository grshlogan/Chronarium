# Chronarium App Code Map

This document maps the current repository tree and planned code boundaries. It
does not replace `docs/ARCHITECTURE.md`.

## Current State

Chronarium now has documentation plus a minimal executable TypeScript validation
chain. The package code is still early and fixture-first. It has a report-only
archive recovery inspector, a core GUI-facing facade, fixture task/lifecycle
skeletons, typed media command builders, and the first offline capture-like
pipeline with manifest-backed adapter task gating. It also has a first
non-Chaturbate fixture adapter scaffold for an SC-like combined A/V topology
under `packages/adapters/stripchat`. It also has a first Web-first React/Vite
recording dashboard shell
under `apps/desktop`, backed by synthetic data, monitoring-first controls, and
a browser-safe offline self-test action only. No Electron shell, preload/IPC,
real site capture, real adapter child process, external media tool execution,
real media segment capture/reader/prober, archive repair/migration, or replay
player exists yet.

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
  ADAPTER_SITE_READINESS.md
  REAL_SITE_ADAPTER_BRINGUP.md
  GUI_CORE_PROTOCOL.md
  DIAGNOSTIC_CODES_V1.md
  MEDIA_TOOLS_BOUNDARY.md
  MEDIA_LIFECYCLE_AND_RETENTION.md
  SECURITY_PRIVACY.md
  CREDENTIALS_AND_SESSIONS.md
  MAINTENANCE_OPS_DESIGN.md
  CB_RECORDING_REFERENCES.md
  DEVELOPMENT_SETUP.md
  APP_CODE_MAP.md
  AI_HANDOFF.md
  AI_CHANGE_INDEX.md
  conversation-A01-documentation-and-initial-skeleton.md
  conversation-A02-foundation-docs-completion.md
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
    plan_chaturbate_fixture_archive_flow.md
    plan_chaturbate_offline_diagnostic_fixtures.md
    plan_core_maintenance_inspector_foundation.md
    plan_archive_recovery_and_gui_core_facade.md
    plan_backend_task_adapter_media_skeleton.md
    plan_offline_fixture_capture_pipeline.md
    plan_media_segment_reader_validator.md
    plan_streaming_archive_io_and_benchmarks.md
    plan_media_lifecycle_upload_retention.md
    plan_adapter_site_readiness_gate.md
    plan_stripchat_offline_combined_fixture.md
    plan_adapter_worker_message_stream.md
    plan_adapter_worker_command_builder.md
    plan_adapter_worker_supervisor_harness.md
    plan_adapter_kit_shared_fixture_helpers.md
    plan_timeline_payload_schemas_round2.md
    plan_timeline_payload_schemas_round3_4_5.md
    plan_credential_store_selector_fixture.md
    plan_real_site_adapter_bringup_checklist.md
    plan_documentation_code_state_sync.md
    plan_web_dashboard_offline_behavior.md
    plan_web_dashboard_monitoring_semantics.md
    plan_web_dashboard_streamer_selection.md
    plan_web_dashboard_streamer_context.md
    plan_web_first_recording_dashboard.md
tools/
  benchmarks/
    timeline-scan-benchmark.mjs
apps/
  desktop/
    package.json
    index.html
    tsconfig.json
    vite.config.ts
    src/
      App.tsx
      index.ts
      main.tsx
      mockDashboard.ts
      recordingDashboard.ts
      styles.css
      vite-env.d.ts
packages/
  types/
  schemas/
  archive/
  indexer/
  core/
  media-tools/
  adapters/
    chaturbate/
    kit/
    stripchat/
  testkit/
tdd-tests/
  README.md
  packages/
    adapters/
      kit/
        adapterKitFixtureGuards.test.ts
      stripchat/
        stripchatCombinedFixture.test.ts
    archive/
      payload-validation/
        payloadValidation.test.ts
      timeline-reader/
        timelineReader.test.ts
    core/
      credentials/
        credentialSelector.test.ts
      adapter-catalog/
        adapterCatalog.test.ts
      adapter-gate/
        adapterTaskGate.test.ts
      adapter-message-stream/
        adapterMessageStream.test.ts
      adapter-worker-command/
        adapterWorkerCommand.test.ts
      adapter-worker-supervisor/
        adapterWorkerSupervisor.test.ts
    indexer/
      timeline-batches/
        indexerTimelineBatches.test.ts
    schemas/
      timeline-payloads/
        timelinePayloadSchemas.test.ts
    testkit/
      adapter-readiness/
        adapterReadiness.test.ts
      large-timeline/
        largeSyntheticTimeline.test.ts
  apps/
    desktop/
      recording-dashboard/
        desktopRecordingDashboard.test.tsx
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

- Does not claim real media segment capture/probing, archive repair, or
  migration exists.

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
- Current fixture-first adapter scopes.
- Manifest/catalog/readiness/core-task gate rules.

Boundary:

- No live site behavior is implemented.

### `docs/ADAPTER_SITE_READINESS.md`

Responsibility:

- Practical checklist for starting a new site adapter package.
- Required fixture-first package shape, manifest rules, fixture rules, timeline
  expectations, and core task gate behavior.
- Current split A/V and combined A/V examples.

Boundary:

- Does not claim live site capture is implemented.

### `docs/REAL_SITE_ADAPTER_BRINGUP.md`

Responsibility:

- Go/no-go checklist for starting real-site adapter work.
- Separates allowed fixture-first bring-up from prohibited live capture work.
- Maps current code evidence to adapter readiness requirements.

Boundary:

- Does not claim live capture, real media download, credential handling, or
  live worker execution exists.

### `docs/GUI_CORE_PROTOCOL.md`

Responsibility:

- GUI-to-core and core-to-GUI message families.
- Renderer/preload/Electron-main/core process boundary and transport options.
- Error model, query bounds, and protocol security rules.

Boundary:

- Draft protocol contract. A static Web-first renderer exists under
  `apps/desktop`, but no Electron shell, preload bridge, IPC implementation,
  or live GUI-core binding exists.

### `docs/DIAGNOSTIC_CODES_V1.md`

Responsibility:

- Registry of implemented archive validation issue codes.
- Naming, severity, stability, and evolution rules for diagnostic codes.
- Reserved code areas for future subsystems.

Boundary:

- The implemented registry mirrors `packages/archive/src/validator.ts`;
  `segment.*` basic referenced-file checks are implemented, while other
  reserved areas remain drafts until first emitting code lands.

### `docs/MEDIA_TOOLS_BOUNDARY.md`

Responsibility:

- Typed command builder, execution, evidence, redaction, and testing rules for
  external media tools.
- Tool roles for FFmpeg, ffprobe, and candidate downloaders.

Boundary:

- Design contract plus implemented command-builder boundary. The current
  `packages/media-tools` package builds typed FFmpeg/ffprobe command
  descriptions only; it does not execute tools.

### `docs/MEDIA_LIFECYCLE_AND_RETENTION.md`

Responsibility:

- Design contract for raw media, processed outputs, upload verification,
  retention policy, hash responsibilities, and deletion gates.
- Distinguishes the project owner's local disk-saving policy from optional
  public-release behavior.
- Clarifies CB-like split A/V raw tracks versus SC-like combined A/V tracks.

Boundary:

- Does not claim real capture, transcoding, upload, playable-output validation,
  hash validation, or deletion automation exists.

### `docs/SECURITY_PRIVACY.md`

Responsibility:

- Sensitive-data policy.
- Fixture policy.
- Redaction labels.
- Process, filesystem, external tool, and logging safety rules.

### `docs/CREDENTIALS_AND_SESSIONS.md`

Responsibility:

- Design contract for authenticated recording (ticket / private / spy shows).
- Credential profile + per-streamer binding + capability-match-failover model.
- Redaction, storage, threat model, and adapter/manifest integration rules.

Boundary:

- Design draft only. No credential store, encryption, import, injection,
  failover, real cookie handling, or live request path exists.

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
- Created before implementation; the first implemented slice is the report-only
  inspector tracked in `plan_archive_recovery_and_gui_core_facade.md`.

### `docs/plan/plan_archive_recovery_and_gui_core_facade.md`

Responsibility:

- Plan, scope, and verification notes for the first report-only archive
  recovery inspector and the first core GUI-facing facade.
- Records that this work adds no repair actions, no Electron/React GUI, no IPC,
  and no real site capture.

### `docs/plan/plan_backend_task_adapter_media_skeleton.md`

Responsibility:

- Plan, scope, and verification notes for the task scheduler skeleton, fixture
  adapter lifecycle host, and media-tools command-builder skeleton.
- Records that this work does not connect to real sites, start real adapter
  child processes, execute media tools, or build GUI.

### `docs/plan/plan_offline_fixture_capture_pipeline.md`

Responsibility:

- Plan, scope, and verification notes for the first offline capture-like core
  pipeline.
- Records that the flow consumes fixture adapter messages, writes synthetic
  `.chron` archives, reindexes SQLite, maps adapter lifecycle failures to task
  failures, and remains free of live site capture or real media IO.

### `docs/plan/plan_media_segment_reader_validator.md`

Responsibility:

- Plan, scope, and verification notes for basic media segment referenced-file
  validation.
- Records that archive validation checks `media.segment.*` facts with
  `relativePath` for schema, track, path, file existence, and declared byte
  length, without hash, duration, media probing, or repair.

### `docs/plan/plan_streaming_archive_io_and_benchmarks.md`

Responsibility:

- Plan for adding streaming or batched archive timeline read/validation entry
  points before GUI, indexer, replay, and maintenance hard-code full
  `timelineEvents` arrays.
- Plan for adding large deterministic synthetic timeline builders and a local
  benchmark script so future Rust/native module decisions have measured
  evidence.

### `docs/plan/plan_media_lifecycle_upload_retention.md`

Responsibility:

- Plan, scope, and verification notes for documenting raw media, processed
  output, upload, retention, hash, and deletion-gate requirements.
- Records that the pass is documentation-only and does not implement real
  transcoding, upload, or cleanup behavior.

### `docs/plan/plan_adapter_site_readiness_gate.md`

Responsibility:

- Plan, scope, and verification notes for the reusable adapter site readiness
  gate.
- Defines the pre-live adapter checklist: manifest, catalog registration,
  protocol validation, lifecycle order, capability checks, and sensitive data
  rejection.

### `docs/plan/plan_stripchat_offline_combined_fixture.md`

Responsibility:

- Plan, scope, and verification notes for the first non-Chaturbate adapter
  scaffold.
- Records the SC-like combined audio/video synthetic fixture, gap fact
  generation, overlap rejection, readiness gate usage, and core catalog/task
  gate coverage.

### `docs/plan/plan_adapter_worker_message_stream.md`

Responsibility:

- Plan, scope, and verification notes for the first future adapter child-process
  stdout JSONL parsing boundary.
- Records that the parser validates adapter-to-core messages, reports stable
  line-numbered errors, and does not echo raw worker output.

### `docs/plan/plan_adapter_worker_command_builder.md`

Responsibility:

- Plan, scope, and verification notes for the first typed adapter worker
  command descriptor.
- Records that the builder returns argv arrays with `shell: false`, rejects
  unsafe path/argument shapes, and does not spawn child processes.

### `docs/plan/plan_adapter_worker_supervisor_harness.md`

Responsibility:

- Plan, scope, and verification notes for the no-spawn adapter worker
  supervisor harness.
- Records how modeled command/stdout/stderr/exit data becomes a lifecycle
  report without launching a real process.

### `docs/plan/plan_adapter_kit_shared_fixture_helpers.md`

Responsibility:

- Plan, scope, and verification notes for extracting the shared
  `@chronarium/adapter-kit` fixture-safety and fixture-parsing helpers.
- Records that the work is a behavior-preserving refactor that converges the
  Chaturbate and Stripchat adapters onto the kit and defers the fact-builders to
  the timeline payload schema round.

### `docs/plan/plan_timeline_payload_schemas_round2.md`

Responsibility:

- Plan, scope, and verification notes for media observation timeline payload
  schemas and the `payload.schema_invalid` archive validation path.
- Records that `media.gap.detected` is a structured media fact and that the
  stored segment-file schema remains separate.

### `docs/plan/plan_timeline_payload_schemas_round3_4_5.md`

Responsibility:

- Plan, scope, TDD notes, and verification record for adding diagnostic,
  room/chat, and network/reconnect timeline payload schemas.
- Records the Stripchat synthetic room/chat/network/gap fixture expansion and
  readiness fact-usage gate for `room.state` / `chat.events`.
- Excludes live site access, real credentials, Cookie handling, upload, and
  deletion behavior.

### `docs/plan/plan_credential_store_selector_fixture.md`

Responsibility:

- Plan, scope, and verification notes for the fixture-only credential store and
  per-streamer selector.
- Records that the slice handles synthetic metadata and redacted
  `CredentialRef` values only, with no cookies, encryption, import, injection,
  or live request path.

### `docs/plan/plan_real_site_adapter_bringup_checklist.md`

Responsibility:

- Plan, scope, and verification notes for the real-site adapter bring-up
  checklist.
- Records that this pass is documentation-only and does not access real sites.

### `docs/plan/plan_documentation_code_state_sync.md`

Responsibility:

- Plan, scope, and verification notes for documentation-only passes that align
  current-state docs with implemented code facts.
- Records that this pass does not change source behavior, run live sites, or
  edit non-A01 conversation context documents.

### `docs/plan/plan_web_dashboard_offline_behavior.md`

Responsibility:

- Historical plan, scope, and verification notes for the first browser-safe
  behavior slice in the Web-first recording dashboard.
- Records that the button uses a synthetic demo action only and must not call
  Node-only core/archive/indexer APIs from the renderer.

### `docs/plan/plan_web_dashboard_monitoring_semantics.md`

Responsibility:

- Plan, scope, and verification notes for correcting the Web recording
  dashboard to a monitoring-first product model.
- Records that the visible controls are pause monitoring, resume monitoring,
  and check now, while synthetic fixture behavior is presented as an offline
  self-test diagnostic action.

### `docs/plan/plan_web_dashboard_streamer_selection.md`

Responsibility:

- Plan, scope, and verification notes for making the maintained streamer list
  select the active dashboard workspace.
- Records that selection is browser-local synthetic state only and does not
  persist streamer records or call core.

### `docs/plan/plan_web_dashboard_streamer_context.md`

Responsibility:

- Plan, scope, and verification notes for making the selected streamer drive
  center workspace and right-side session context.
- Records the left-list check-time wrapping fix and synthetic per-streamer
  current session, history, latest facts, and empty states.

### `docs/plan/plan_web_first_recording_dashboard.md`

Responsibility:

- Plan, scope, and verification notes for the first Web-first React/Vite
  recording dashboard.
- Records that the dashboard is static and synthetic-only, with no Electron
  shell, preload/IPC, core binding, live preview, credential handling, or real
  site capture.

### `docs/plan/plan_chaturbate_offline_split_fixture.md`

Responsibility:

- Plan, scope, and verification notes for the first Chaturbate offline split
  audio/video fixture and tests.
- Records that the work is fixture-only and excludes live site capture,
  downloader integration, and credential handling.

### `docs/plan/plan_chaturbate_fixture_archive_flow.md`

Responsibility:

- Plan, scope, and verification notes for writing the Chaturbate split-track
  fixture into a synthetic `.chron` archive and indexing it.
- Records that the flow remains offline, synthetic, and free of real media or
  credential handling.

### `docs/plan/plan_chaturbate_offline_diagnostic_fixtures.md`

Responsibility:

- Plan, scope, evidence level, and verification notes for synthetic
  Chaturbate diagnostic fixtures.
- Records that missing audio, duration mismatch, media gap, and stalled-output
  scenarios are contract tests for Chronarium's storage/query behavior, not
  proof of current live Chaturbate behavior.

### `docs/plan/plan_core_maintenance_inspector_foundation.md`

Responsibility:

- Plan, scope, and verification notes for the first read-only maintenance
  archive inspector under core.
- Records that the inspector reports archive validator issues and timeline
  diagnostic facts without AI calls, repair actions, real media probing, or
  reindex writes.

### `docs/conversation-A01-documentation-and-initial-skeleton.md`

Responsibility:

- Conversation-level continuity document for A01.
- Records current status, constraints, decisions, files in scope,
  verification, and next safe step.
- Also records the Chaturbate offline fixture and core maintenance inspector
  work that was previously mislabeled as A03/A04 inside the same A01 Codex
  conversation.

### `docs/conversation-A02-foundation-docs-completion.md`

Responsibility:

- Conversation-level continuity document for A02.
- Records the foundation documentation completion pass: scope, decisions,
  files changed, and verification.

## Current Code Tree

The following tree exists. Some packages are still contract skeletons; archive
and indexer have the first executable fixture paths. The first Web UI exists as
a static renderer shell only.

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
tsconfig.json
vitest.config.ts

apps/
  desktop/
    package.json
    index.html
    tsconfig.json
    vite.config.ts
    src/
      App.tsx
      index.ts
      main.tsx
      mockDashboard.ts
      recordingDashboard.ts
      styles.css
      vite-env.d.ts
packages/
  types/
    package.json
    tsconfig.json
    src/
      adapter.ts
      archive.ts
      credentials.ts
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
      timelinePayloadSchemas.ts
  core/
    package.json
    tsconfig.json
    src/
      adapters/
        adapterCatalog.ts
        adapterLifecycle.ts
        adapterMessageStream.ts
        adapterWorkerCommand.ts
        adapterWorkerSupervisor.ts
        index.ts
      archiveIndexService.ts
      guiService.ts
      index.ts
      offlineFixtureCapturePipeline.ts
      credentials/
        credentialSelector.ts
        credentialStore.ts
        index.ts
      maintenance/
        archiveInspector.ts
        index.ts
        inspectionTypes.ts
      runtime.ts
      tasks/
        index.ts
        taskScheduler.ts
        taskTypes.ts
    tests/
      adapterLifecycle.test.ts
      archiveIndexService.test.ts
      guiService.test.ts
      maintenanceInspector.test.ts
      offlineFixtureCapturePipeline.test.ts
      runtime.test.ts
      taskScheduler.test.ts
  adapters/
    chaturbate/
      package.json
      tsconfig.json
      fixtures/
        README.md
        diagnostic-anomalies.synthetic.json
        missing-audio.synthetic.json
        split-audio-video.synthetic.json
      src/
        fixtureAdapter.ts
        index.ts
        manifest.ts
        splitTrackFixture.ts
      tests/
        diagnosticFixtures.test.ts
        splitTrackArchiveFlow.test.ts
        splitTrackFixture.test.ts
    stripchat/
      package.json
      tsconfig.json
      fixtures/
        README.md
        combined-av.synthetic.json
      src/
        combinedFixture.ts
        fixtureAdapter.ts
        index.ts
        manifest.ts
  kit/
    package.json
    tsconfig.json
    src/
      fixtureParse.ts
      fixtureSafety.ts
      index.ts
  archive/
    package.json
    tsconfig.json
    src/
      index.ts
      layout.ts
      payloadValidation.ts
      reader.ts
      recovery.ts
      segmentValidation.ts
      streamingValidator.ts
      timelineReader.ts
      validator.ts
      writer.ts
    tests/
      archiveReaderValidator.test.ts
      archiveRecovery.test.ts
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
  media-tools/
    package.json
    tsconfig.json
    src/
      commandTypes.ts
      ffmpegCommand.ts
      ffprobeCommand.ts
      index.ts
      pathSafety.ts
    tests/
      mediaToolCommands.test.ts
  testkit/
    package.json
    tsconfig.json
    fixtures/
    src/
      adapterReadiness.ts
      fixtures.ts
      index.ts
      largeTimeline.ts
tdd-tests/
  README.md
  packages/
    adapters/
      kit/
        adapterKitFixtureGuards.test.ts
      stripchat/
        stripchatCombinedFixture.test.ts
    archive/
      payload-validation/
        payloadValidation.test.ts
      timeline-reader/
        timelineReader.test.ts
    core/
      credentials/
        credentialSelector.test.ts
      adapter-catalog/
        adapterCatalog.test.ts
      adapter-gate/
        adapterTaskGate.test.ts
    indexer/
      timeline-batches/
        indexerTimelineBatches.test.ts
    schemas/
      timeline-payloads/
        timelinePayloadSchemas.test.ts
    testkit/
      adapter-readiness/
        adapterReadiness.test.ts
      large-timeline/
        largeSyntheticTimeline.test.ts
  apps/
    desktop/
      recording-dashboard/
        desktopRecordingDashboard.test.tsx
```

## Planned Future Tree

These areas are planned but not implemented:

```text
apps/
  desktop/
    electron/
      main/
      preload/

packages/
  core/
    src/
      archive/
      timeline/
      index/
      diagnostics/
      exports/
  archive/
    tests/
      media segment hash/duration validation tests
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

- React/Vite renderer.
- Future Electron shell.
- Future preload bridge.
- GUI state and replay views.

Must not own:

- site protocol logic;
- archive write authority;
- FFmpeg command construction;
- credential storage.

Current status:

- Exists as a Web-first React + Vite app with a recording dashboard and a
  browser-safe synthetic offline self-test.
- The first screen focuses on maintained streamers, selected streamer
  monitoring state, automatic recording state, disabled live-preview
  placeholder, recording information, pinned current session, history, and
  global information.
- `recordingDashboard.ts` owns the browser-safe dashboard state, reducer,
  monitoring actions, and synthetic offline self-test action.
- The left maintained-streamer list is clickable and updates the selected
  workspace using browser-local synthetic state.
- Each synthetic streamer now has its own selected context: room state, current
  session or no-current-recording state, latest facts, history, and summary
  metrics. The center workspace and right-side history read from that selected
  context.
- Streamer list rows render site and last-check time as separate lines to avoid
  inconsistent wrapping.
- The left streamer rail now uses explicit width variables and wider streamer
  rows. Each row shows synthetic status lanes for availability, show mode,
  media-stream recording state, and information-stream recording state.
- Those row states are laid out as a compact right-side status board: a short
  availability cell, a wider show-mode cell, and equal-width side-by-side
  media-stream and information-stream cells with hover descriptions.
- Streamer cards vertically center the avatar, the three-line identity block,
  and the four-cell status board as three aligned blocks.
- The current left rail is 560px wide. Streamer cards are 112px tall, the
  status board is 256px wide, and left-card typography follows the explicit
  18px / 16px / 14px scale for streamer name, site/check text, and status
  cells.
- The UI exposes pause monitoring, resume monitoring, and check now controls for
  the selected streamer. The synthetic demo is presented as an offline
  self-test under maintenance diagnostics, not as a recording start action.
- The UI can run the self-test action from a button and render
  completed/failed status into history and latest facts.
- The dev server defaults to `http://127.0.0.1:5187/` with `--strictPort`.
- It uses synthetic mock view-model/demo data only.
- It does not connect to core, read archives, query SQLite, start tasks,
  launch Electron, expose preload/IPC, preview live streams, or connect to real
  sites.
- The status board does not implement real site state, ticket/private-show
  detection, media stream capture, or information stream capture.

### `packages/types`

Owns:

- shared DTOs;
- event type definitions;
- manifest types;
- adapter message contracts.

Change this first when a public contract changes.

Current status:

- Exists with initial TypeScript types for primitives, sessions, media,
  timeline events, archive manifests, adapter messages, and adapter manifests.
- Also defines the credential model types (`RecordingIntent`,
  `CredentialProfile`, `StreamerCredentialBinding`, `CredentialRef`,
  `CredentialSelectionResult`).

### `packages/schemas`

Owns:

- runtime validation schemas;
- fixture examples;
- schema version helpers.

Current status:

- Performs first-pass Zod runtime validation for sessions, media tracks,
  timeline events, archive manifests, adapter protocol messages, and adapter
  manifests.
- Also validates the first per-family timeline payloads and exposes
  `validateTimelineEventPayloadV1` for archive validation. Registered families
  currently include media observations, `diagnostic.note`,
  `diagnostic.duration_mismatch`, `diagnostic.media_tool_output`,
  `room.state.changed`, `chat.message.observed`, `network.disconnected`, and
  `network.reconnected`. These are lenient (required + known fields validated,
  extra keys allowed).

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
- The maintenance archive inspector produces read-only `MaintenanceReport`
  data from archive validator issues and known timeline diagnostic facts.
- The maintenance inspector does not start AI, repair archives, run media tools,
  reindex SQLite, or touch live sites.
- The GUI-facing facade exposes health, archive validate/read/reindex/list,
  maintenance inspection, and recovery inspection for future GUI callers.
- The facade is an in-process TypeScript boundary only; it is not yet connected
  to the Web-first renderer, Electron, preload, or IPC.
- The in-memory task scheduler can create, start, stop, fail, get, and list
  fixture capture tasks.
- The fixture adapter lifecycle host can consume adapter protocol message
  streams and summarize ready/fact/diagnostic/error/finished state.
- The adapter worker JSONL message stream parser can read future child-process
  stdout lines into validated adapter-to-core messages, reporting line-numbered
  errors without echoing raw worker output.
- The adapter worker command builder can create a typed spawn-style descriptor
  with `shell: false`, structured argv fields, redacted argv, and basic
  path/argument safety checks. It does not spawn processes.
- The no-spawn adapter worker supervisor harness can combine a command
  descriptor, modeled stdout JSONL, stderr lines, exit code, and fixture
  lifecycle request into a structured worker report. It does not spawn
  processes.
- The adapter catalog can register adapter manifests, list registered adapters,
  return a manifest by adapter id, reject duplicate adapter ids, and reject
  manifests that declare sensitive source field emission.
- The runtime can optionally hold adapter manifests as a catalog for GUI/core
  task preflight.
- The offline fixture capture pipeline can run a fixture capture request from
  adapter messages into a synthetic `.chron` archive, write media track
  metadata, append timeline facts, reindex SQLite, and return the result
  through the GUI facade.
- When a runtime catalog is provided, the offline fixture capture pipeline
  rejects unregistered adapters, unsupported runtime modes, missing requested
  capabilities, and non-ready fixture adapters before consuming adapter
  messages or writing archives.
- Adapter errors and missing `adapter.finished` map to failed tasks and skip
  archive indexing.
- The fixture-only credential store (`createCredentialStore`) and per-streamer
  selector (`selectCredentialForCapture`) resolve which redacted credential
  profile a gated capture would use (capability-match-failover), reject
  raw-secret-looking profile material, and never hold or return cookies. No
  encryption, import, injection, real cookies, or live path exists.
- Does not run live capture jobs, start adapter child processes, export media,
  run ops loops, execute media tools, or capture real media segments yet.

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
- It exports a fixture-only adapter manifest for the core adapter catalog. The
  manifest declares `runtimeModes: ["fixture"]`, no network access, no
  credential requirement, and no sensitive source field emission.
- It includes a committed offline split audio/video fixture for a CB-like
  LL-HLS/CMAF topology.
- It can parse that fixture into media track metadata and timeline facts, then
  emit those facts through the existing fixture adapter runner.
- It includes synthetic diagnostic fixtures for missing audio, media gap,
  duration mismatch, and stalled output. These are contract tests for
  Chronarium's archive/timeline/index behavior, not evidence that current live
  Chaturbate behaves this way.
- Its tests validate timeline envelopes, adapter protocol messages, rejection
  of network-looking or token-bearing fixture references, writing the fixture
  into a synthetic `.chron` archive, archive reader/validator consumption, and
  SQLite indexer queries for split-track and diagnostic facts.
- It does not perform network requests, downloads, account handling, cookies, or
  session handling.
- `packages/adapters/stripchat` exists as a synthetic fixture adapter scaffold
  for an SC-like combined audio/video topology.
- It exports a fixture-only adapter manifest for the core adapter catalog. The
  manifest declares `runtimeModes: ["fixture"]`, no network access, no
  credential requirement, and no sensitive source field emission.
- It includes a committed offline combined A/V fixture that becomes one
  Chronarium media track and now includes synthetic room, chat, network
  disconnect/reconnect, and gap facts.
- It can parse that fixture into media track metadata and timeline facts, then
  emit those facts through an adapter protocol fixture runner.
- It emits `room.state.changed`, `chat.message.observed`,
  `network.disconnected`, `network.reconnected`, and `media.gap.detected` for
  a synthetic reconnect-after-gap scenario, and rejects overlapping or
  backwards segments.
- It does not perform network requests, downloads, account handling, cookies, or
  session handling.
- Both adapters now obtain their fixture-safety guards
  (`assertSyntheticFixtureReference`, `assertNoSensitiveFixtureStrings`) and
  fixture-parsing primitives from `@chronarium/adapter-kit` instead of local
  copies. Only site-specific parsing and fact-building stay in the adapter.

### `packages/adapters/kit`

Owns:

- shared fixture-safety guards for synthetic references and sensitive strings;
- shared fixture-parsing primitives (`expect*`, `optionalStringProperty`);
- a single source of truth for the per-adapter secret/URL safety checks.

Must not own:

- site-specific topology, room, chat, or fact-building logic;
- timeline payload schemas (those live in `packages/schemas`);
- network, credential, or media-tool behavior.

Current status:

- Exists as `@chronarium/adapter-kit` with `fixtureSafety.ts` and
  `fixtureParse.ts`.
- `assertSyntheticFixtureReference(reference, path, expectedPrefix)` enforces the
  synthetic prefix, rejects query strings/fragments, and rejects secret-looking
  fragments.
- `assertNoSensitiveFixtureStrings` recursively rejects raw network URLs and
  secret-looking string fragments.
- The `expect*` primitives validate untyped fixture JSON with stable error
  messages.
- Consumed by `packages/adapters/chaturbate` and `packages/adapters/stripchat`.
- Depends only on `@chronarium/types`. It does no IO, network, or media work.

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
- Writes fixture-safe synthetic media segment bytes under declared
  `tracks/<track-id>/segments/<segment-name>` paths.
- Validates `media.segment.*` timeline facts that reference stored segment
  files: payload schema, known track, path safety, owning track `segmentsPath`,
  file existence, and declared byte length.
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
- Includes a report-only recovery inspector for missing/invalid manifest,
  invalid timeline JSONL lines, missing/finalized manifest counts, manifest
  count mismatches, orphan `.tmp` files, undeclared track directories, and
  missing manifest-declared track metadata.
- Exposes `iterateTimelineRecords` and `readTimelineEventBatches` as the first
  streaming-shaped timeline read entries. These read JSONL lines through a
  bounded public contract and return parsed events or validation issues without
  requiring callers to receive a full `timelineEvents` array.
- Exposes `validateFileArchiveStreaming` as the first validation summary that
  does not return the full timeline event array.
- Full snapshot archive validation still exists for small fixture workflows.
  Replay, GUI, and maintenance consumers have not yet been migrated to the new
  timeline batch reader.
- Reports `payload.schema_invalid` for timeline facts whose type has a
  registered per-family payload schema, from both the snapshot and streaming
  validators via `validateTimelinePayloads` (`payloadValidation.ts`).
- Real media probing, hash validation, duration validation, archive repair, and
  migration are still pending.

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
- Timeline event indexing consumes `readTimelineEventBatches` and no longer
  inserts events from `validateFileArchive().timelineEvents`.
- Supports explicit reindex, archive removal, clear-all, and filtered archive,
  timeline event, and validation issue queries.
- SQLite is still a rebuildable cache/index, not the source of replay truth.
- Integrated with `packages/core` through archive/index service and the
  GUI-facing facade. No live GUI/indexer binding exists yet.

### `packages/media-tools`

Owns:

- typed external media tool command builders;
- argv and redacted argv construction;
- command-boundary tests;
- future media tool output parser fixtures.

Current status:

- Exists with typed FFmpeg remux and ffprobe JSON command builders.
- Returns command descriptions only; it does not execute real binaries.
- Rejects empty FFmpeg input lists, output paths outside the working directory,
  and newline-bearing modeled paths.
- Uses argv arrays, not shell strings.

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
- Includes `verifyAdapterFixtureReadiness`, a reusable offline gate that checks
  adapter protocol parsing, ready/finished ordering, requested capabilities,
  adapter/session matching, terminal finished behavior, and secret-looking or
  network-looking message content. It also requires declared or requested
  `room.state` / `chat.events` capabilities to be represented by
  `room.state.changed` / `chat.message.observed` facts in the fixture stream.
- Includes `createLargeSyntheticTimelineBuilder`, which can generate
  deterministic large synthetic timeline events, stream JSONL chunks, and write
  a synthetic `.chron` fixture without constructing one giant event array.

## Tools

### `tools/benchmarks/timeline-scan-benchmark.mjs`

Responsibility:

- Generate a local synthetic `.chron` archive and scan its timeline through
  `readTimelineEventBatches`.
- Report event count, batch size, write time, scan time, and process memory
  usage as local evidence for future performance work.

Boundary:

- Not a CI pass/fail gate.
- Not a Rust decision by itself.
- Uses synthetic archives under ignored `runtime/benchmarks/`.

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
- Delegating scripts for build, typecheck, test, lint, and local timeline
  benchmark commands.

Current status:

- Root license is `Apache-2.0`.
- Package manager is pinned to `pnpm@11.5.3`.
- Root dev dependencies include TypeScript, Vitest, and Node types.
- `benchmark:timeline` builds the workspace and runs the local synthetic
  timeline scan benchmark.

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

Current root-level TDD slices:

```text
tdd-tests/
  packages/
    adapters/
      kit/
        adapterKitFixtureGuards.test.ts
      stripchat/
        stripchatCombinedFixture.test.ts
    archive/
      payload-validation/
        payloadValidation.test.ts
      timeline-reader/
        timelineReader.test.ts
    core/
      credentials/
        credentialSelector.test.ts
      adapter-catalog/
        adapterCatalog.test.ts
      adapter-gate/
        adapterTaskGate.test.ts
      adapter-message-stream/
        adapterMessageStream.test.ts
      adapter-worker-command/
        adapterWorkerCommand.test.ts
      adapter-worker-supervisor/
        adapterWorkerSupervisor.test.ts
    indexer/
      timeline-batches/
        indexerTimelineBatches.test.ts
    schemas/
      timeline-payloads/
        timelinePayloadSchemas.test.ts
    testkit/
      adapter-readiness/
        adapterReadiness.test.ts
      large-timeline/
        largeSyntheticTimeline.test.ts
  apps/
    desktop/
      recording-dashboard/
        desktopRecordingDashboard.test.tsx
```

`tdd-tests/README.md` documents that root-level TDD slices should mirror source
ownership paths instead of becoming a flat test dump.

## Maintenance Notes

- Update this file whenever the source tree or major module responsibilities
  change.
- Mark planned directories clearly until they exist.
- Do not let this document drift into a wish list of unimplemented features.
