# Chronarium Agent Guide

This file is the project-level operating guide for AI coding agents working
inside `D:\live\Chronarium`.

Chronarium is a local-first livestream archive and replay platform. Its purpose
is not merely to record video and audio. Its purpose is to preserve the media,
events, state changes, diagnostics, and time relationships of a livestream so
the session can later be replayed, searched, diagnosed, re-rendered, and
exported.

## 1. Language And Response Style

- Use Simplified Chinese when talking to the user unless they request another
  language.
- Keep code identifiers, commands, paths, APIs, schema names, file names,
  package names, and logs in their original language.
- Lead with conclusions, then give actionable details.
- Do not invent files, commands, config fields, APIs, test results, or completed
  features.
- If unsure, inspect local files first.

## 2. Repository Scope

- Work only inside `D:\live\Chronarium` unless the user explicitly asks to read
  another path for reference.
- Do not modify CTB Recorder, CTB maintenance, OneRecord, or other local
  recorder projects while working on Chronarium unless the user explicitly asks.
- Reference projects may be read for structure and patterns, but do not copy
  unrelated rules, persona prompts, credentials, runtime paths, or implementation
  assumptions into this repository.
- Do not commit or push unless the user explicitly asks.

## 3. Source Of Truth

Read and maintain sources in this order:

1. `AGENTS.md`: engineering boundaries, agent workflow, and safety rules.
2. Current code and executable validation results.
3. `README.md`: product overview, current stage, and document index.
4. `docs/CONTEXT.md`: product and architecture vocabulary.
5. `docs/ARCHITECTURE.md`: framework, technology choices, and process
   boundaries.
6. `docs/APP_CODE_MAP.md`: current and planned file responsibilities.
7. `docs/AI_HANDOFF.md` and `docs/AI_CHANGE_INDEX.md`: current handoff and
   change continuity.

If documentation conflicts with code and verified runtime behavior, trust the
code and update the docs.

## 4. Product Model

Design the project around these concepts:

```text
LiveSession
  -> MediaTracks
  -> Timeline
  -> RoomEvents
  -> ChatEvents
  -> StateChanges
  -> Diagnostics
  -> ReplayPackage
  -> RenderedExports
```

The main product artifact is a replayable session archive, not a single video
file. Video files are exports derived from preserved facts.

## 5. Non-Negotiable Boundaries

- GUI must not download media, parse site-specific stream protocols, or run
  heavy media work directly.
- Electron main must stay thin: window lifecycle, app lifecycle, safe IPC, and
  launching/stopping `chronarium-core` only.
- `chronarium-core` is the local authority for task state, session state,
  archive writes, indexing, adapter lifecycle, and diagnostics.
- Site-specific logic belongs in site adapters, not in GUI, player, shared
  storage, or generic scheduler code.
- Adapters must run in isolated worker or child processes once executable code
  exists.
- Timeline and event logs must be append-friendly and schema-validated.
- SQLite is an index and state store, not the only source of replay truth.
- FFmpeg / ffprobe must be invoked through typed command builders or adapters.
- Do not expose arbitrary shell execution through UI, config, adapter manifests,
  plugins, or debug endpoints.
- Do not silently overwrite user archives, media, exports, or runtime state.
- Destructive cleanup must require explicit user intent and bounded target
  paths.
- Secrets, cookies, bearer tokens, headers, signed URLs, private room data, and
  personal recording data must not be committed, logged, serialized into docs,
  or printed in shareable diagnostics.

## 6. Default Technology Direction

```text
Primary language: TypeScript
Desktop shell: Electron
GUI: React + TypeScript + Vite
Core backend: Node.js + TypeScript
Site adapters: TypeScript child processes
Shared contracts: TypeScript types + schema validation
Fact storage: JSON Lines
Index/state storage: SQLite
Media tools: FFmpeg / ffprobe typed command builders
Testing: Vitest for units, Playwright for GUI/replay, fixture-driven adapter tests
Analysis scripts: Python allowed for offline diagnostics
```

Do not migrate the project to Python, Rust, Go, Java/Kotlin, Tauri, Qt, Redis,
Postgres, or a web-server-first architecture unless the user explicitly asks for
an architectural migration.

Native Rust/Go/C++ modules may be introduced later only for measured bottlenecks
or security boundaries, and only behind stable TypeScript-facing contracts.

## 7. AI Maintainability Rules

- Prefer small, boring, typed modules over clever global abstractions.
- Keep shared contracts in one package once the codebase exists.
- Every timeline event type must have a schema, example, and fixture test.
- Every site adapter must have offline fixtures for playlist parsing, event
  parsing, gap detection, and error handling.
- Write deterministic tests before changing stream-state or archive-state
  behavior whenever feasible.
- Avoid magic thresholds without a recorded reason, sample evidence, or tuning
  note.
- Do not stack speculative fallbacks, retries, or bypasses before identifying
  the root cause.
- Keep documentation practical and handoff-friendly: current state, active
  boundaries, key files, commands, verification, and next step.

## 8. Documentation Discipline

For non-trivial work, create or update a plan document before implementation.

A task is non-trivial if it:

- touches logic or control flow;
- touches more than one source file;
- changes schema, protocol, config, CLI, public behavior, or storage format;
- involves adapters, concurrency, persistence, security, media processing, or
  replay semantics;
- requires debugging, research, or verification.

Plan files belong under `docs/plan/`.

Use descriptive names:

```text
docs/plan/plan_main_app_skeleton.md
docs/plan/plan_cb_adapter_fixture_harness.md
docs/plan/plan_archive_schema_v1.md
```

Avoid vague root files such as `task_plan.md`, `progress.md`, or
`implementation_plan.md`.

For any non-trivial conversation, also create or update a conversation context
document under `docs/` before or during implementation.

Use this naming pattern:

```text
docs/conversation-<conversation-id>-<short-english-slug>.md
```

The document must record:

- conversation topic and scope;
- current status;
- active constraints and safety boundaries;
- decisions made in this conversation;
- files changed or expected to change;
- verification run or intentionally skipped;
- next safe step for a future agent.

Keep conversation context documents factual and current. Update them after
structural changes and before final handoff when the task spans code, schemas,
storage, protocols, security, adapters, or multiple documentation files.

Conversation context documents are continuity aids, not a replacement for code,
schemas, tests, or the core docs. Do not place secrets, cookies, headers,
tokens, signed URLs, private room details, real captured media, or personal data
in them.

Update these docs after structural work:

- `docs/APP_CODE_MAP.md` when files, modules, or boundaries change.
- `docs/AI_HANDOFF.md` when the current phase or next-step facts change.
- `docs/AI_CHANGE_INDEX.md` when a conversation lands structural changes.
- `README.md` when project stage, entry points, or document index changes.

## 9. Verification Policy

Run the smallest useful validation after changes.

For docs-only changes before code exists:

```powershell
git diff --check
```

Once the TypeScript workspace exists, expected checks should grow toward:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

For GUI or replay behavior changes, add Playwright coverage or a documented
manual smoke result.

Do not claim checks passed if they were not run. State skipped checks and why.

## 10. Open Source Hygiene

- Do not commit real recordings, private chat logs, account cookies, request
  headers, tokens, signed media URLs, or site-specific personal data.
- Keep fixtures synthetic, public-domain, generated, or heavily redacted.
- Do not vendor third-party code without checking license compatibility.
- Do not copy CTB Recorder source, decompiled classes, or proprietary site code
  into Chronarium.
- Keep dependency additions intentional and documented.
