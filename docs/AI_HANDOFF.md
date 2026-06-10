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
  `packages/archive`, `packages/core`, `packages/adapters/chaturbate`, and
  `packages/testkit`.
- Package code is contract-first and placeholder-only.
- Chaturbate adapter code is synthetic fixture mode only and does not connect to
  live rooms.
- License selected and added: Apache-2.0.
- No dependencies have been installed and no lockfile exists.
- No GUI, runnable core, SQLite index, FFmpeg command builder, complete archive
  writer, replay player, real capture, or tests exist yet.
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
.gitattributes
.gitignore
LICENSE
package.json
pnpm-workspace.yaml
tsconfig.base.json
tsconfig.json
packages/types/
packages/schemas/
packages/archive/
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
- Do not change the Apache-2.0 license without explicit user direction.

## Suggested Next Steps

1. Choose and install exact development dependencies, then generate a lockfile.
2. Run the first real TypeScript typecheck after dependencies exist.
3. Turn `packages/schemas` from JSON-schema-lite descriptors into runtime
   validators.
4. Add archive writer prototype using synthetic fixtures only.
5. Add first tests for timeline append and manifest validation.
6. Only after archive/timeline validation works, expand the CB adapter fixture
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

No `pnpm`, `npm`, TypeScript, lint, build, or test command was run because
dependencies have not been installed.

License update checks:

- `package.json` parsed successfully and reports `license: Apache-2.0`.
- Trailing whitespace scan with `Select-String -Pattern '[ \t]$'`: no output.
- `git diff --check`: no output before staging.
