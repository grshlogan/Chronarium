# Development Setup

Status: initial workspace setup notes. Dependencies have not been installed in
this foundation step.

## Current State

The repository now has a minimal TypeScript workspace skeleton and package
boundaries. It does not yet have:

- installed dependencies;
- a lockfile;
- executable GUI;
- core runtime implementation;
- archive writer implementation;
- SQLite index implementation;
- real site adapters;
- tests that can be run through a package manager.

## Expected Tooling Direction

Planned tools:

- Node.js for TypeScript packages and Electron later.
- pnpm workspaces.
- TypeScript.
- Vitest for unit and fixture tests later.
- Playwright for GUI/replay smoke tests later.
- FFmpeg and ffprobe through typed command builders later.
- Python only for offline diagnostics.

Exact dependency versions are intentionally not pinned in this step because no
install was requested or performed.

## Safe Checks Before Dependencies Exist

These checks do not require network access or package installation:

```powershell
rg --files
Get-Content package.json -Raw | ConvertFrom-Json
Get-Content packages/types/package.json -Raw | ConvertFrom-Json
Test-Path .git
```

Trailing whitespace can be scanned with:

```powershell
Get-ChildItem -Recurse -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\' } |
  Select-String -Pattern '[ \t]$'
```

If Git has not been initialized, `git diff --check` is not available as a
meaningful repository check.

## Future Dependency Install

When the user approves dependency installation, a future step should:

1. choose exact dev dependency versions;
2. add or update `devDependencies`;
3. run `pnpm install`;
4. commit the generated lockfile only if the user asks for Git work;
5. run the first real checks, likely `pnpm typecheck` and fixture tests.

## Development Rules

- Keep source code inside `D:\live\Chronarium`.
- Do not touch sibling recorder projects.
- Do not commit or push unless explicitly requested.
- Do not add a license without asking the user to choose one.
- Keep Chaturbate work fixture-first until archive and timeline foundations are
  validated.
- Keep docs honest about what is implemented.
