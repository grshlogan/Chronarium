# Development Setup

Status: initial executable workspace setup notes.

## Current State

The repository now has a minimal TypeScript workspace skeleton, installed
development dependencies, runtime schema validation, a fixture-only archive
writer path, a first fixture-safe archive reader/validator, and a first
rebuildable SQLite indexer.

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
- a rebuildable SQLite indexer that derives archive metadata, timeline events,
  and validation issues from synthetic `.chron` packages;
- Vitest behavior tests for synthetic `.chron` writing, reading, and basic
  timeline consistency failures, writer append-time rejection, plus SQLite
  indexing.

It does not yet have:

- executable GUI;
- core runtime implementation;
- media-track archive reader/writer behavior;
- archive recovery or migration behavior;
- SQLite integration with core or GUI;
- real site adapters;
- FFmpeg / ffprobe command builders;
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
```

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
