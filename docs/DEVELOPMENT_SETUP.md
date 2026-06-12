# Development Setup

Status: initial executable workspace setup notes.

## Current State

The repository now has a minimal TypeScript workspace skeleton, installed
development dependencies, runtime schema validation, a fixture-only archive
writer path, a first fixture-safe archive reader/validator, and a first
rebuildable SQLite indexer. `packages/core` now has a first small archive/index
service, a minimal runtime lifecycle shell, a first read-only maintenance
archive inspector, and a fixture-only offline capture pipeline. `apps/desktop`
now has a first Web-first React/Vite recording dashboard shell.

It has:

- `pnpm-lock.yaml`;
- root dev dependencies for TypeScript, Vitest, and Node types;
- `zod` in `@chronarium/schemas`;
- package project references;
- `vitest.config.ts`;
- runtime schemas for the first session, media track, timeline event, archive
  manifest, and adapter message boundaries;
- a fixture-safe archive writer that writes `manifest.json`, appends
  `timeline.jsonl`, creates top-level archive directories, and enforces basic
  append-time timeline invariants;
- a fixture-safe archive reader/validator that reads `manifest.json` and
  `timeline.jsonl`;
- fixture-safe media track metadata IO for `tracks/<track-id>/track.json` plus
  empty `tracks/<track-id>/segments/` boundary directories;
- a rebuildable SQLite indexer that derives archive metadata, timeline events,
  and validation issues from synthetic `.chron` packages, with reindex,
  remove, clear, and filtered query contracts;
- a core archive/index service that validates archives, reads valid archives,
  reindexes archives, and exposes index queries through `packages/core`;
- a minimal core runtime lifecycle shell that can start, stop, report health,
  create local data/archive directories, and expose the archive/index service
  while running;
- a read-only core maintenance archive inspector that turns archive validator
  issues and known timeline diagnostic facts into `MaintenanceReport` findings;
- a Web-first React/Vite recording dashboard under `apps/desktop`, using static
  synthetic data plus a browser-safe offline fixture capture demo action only,
  defaulting to `127.0.0.1:5187`;
- Vitest behavior tests for synthetic `.chron` writing, reading, and basic
  timeline consistency failures, writer append-time rejection, media track
  metadata diagnostics, SQLite indexing, core archive/index service
  coordination, core runtime lifecycle, core maintenance inspection, offline
  fixture capture, and the first desktop recording dashboard.

It does not yet have:

- Electron shell, preload, or IPC;
- live GUI binding to core/archive/indexer data;
- real media segment writing or probing;
- archive recovery or migration behavior;
- maintenance background loop, AI operations, or automatic repair;
- real site adapters;
- replay player.

## Tooling

Current tools:

- Node.js for TypeScript packages and Electron later.
- pnpm workspaces through Corepack.
- TypeScript.
- Vitest for fixture and unit tests.
- Zod for runtime schema validation.
- Node.js built-in `node:sqlite` for the first indexer package.

`node:sqlite` is currently experimental in the local Node runtime and emits an
ExperimentalWarning during tests. It is wrapped behind `@chronarium/indexer` so
the SQLite binding can be replaced later without changing archive contracts.

Planned tools:

- Playwright for GUI/replay smoke tests later.
- FFmpeg and ffprobe through typed command builders later.
- Python only for offline diagnostics.

Dependency versions are recorded in `pnpm-lock.yaml`. The root `package.json`
pins `packageManager` to `pnpm@11.5.3`.

## Common Commands

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @chronarium/desktop dev
```

The desktop Web UI dev server uses `http://127.0.0.1:5187/` by default. Avoid
using `5173`, which may be occupied by unrelated local projects.

## Safe Checks

```powershell
rg --files
Get-Content package.json -Raw | ConvertFrom-Json
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Trailing whitespace can be scanned with:

```powershell
Get-ChildItem -Recurse -File |
  Where-Object { $_.FullName -notmatch '\\.git\\|\\node_modules\\|\\dist\\' } |
  Select-String -Pattern '[ \t]$'
```

## Development Rules

- Keep source code inside `D:\live\Chronarium`.
- Do not touch sibling recorder projects.
- Do not commit or push unless explicitly requested.
- The project license is Apache-2.0; do not change it without explicit user
  direction.
- Keep Chaturbate work fixture-first until archive and timeline foundations are
  validated.
- Keep docs honest about what is implemented.
