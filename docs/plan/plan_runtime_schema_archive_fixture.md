# Plan Runtime Schema And Archive Fixture

## Objective

Create the first executable Chronarium validation path: synthetic fixture data
can be runtime-validated and written to a local `.chron` package skeleton.

## Scope

- Install minimal TypeScript test tooling and lock dependencies.
- Add Zod runtime schemas for sessions, media tracks, timeline events, archive
  manifests, and adapter protocol messages.
- Implement a fixture-safe file archive writer that creates a package directory,
  writes `manifest.json`, and appends `timeline.jsonl`.
- Add a Vitest behavior test that exercises the public package interfaces.
- Update documentation and handoff files with actual verification results.

## Out Of Scope

- No real site capture.
- No Chaturbate network, cookie, account, session, or download logic.
- No SQLite index.
- No FFmpeg or ffprobe invocation.
- No GUI or Electron implementation.
- No real media fixtures.

## Current Facts

- Apache-2.0 license is committed.
- Root package manager is pinned to `pnpm@11.5.3`.
- The first package skeletons exist.

## Execution Plan

1. Install minimal dependencies: TypeScript, Vitest, Node types, and Zod.
2. Add runtime schema parse helpers in `packages/schemas`.
3. Implement a file archive writer in `packages/archive`.
4. Add synthetic fixture helpers in `packages/testkit`.
5. Add a Vitest integration-style test through public package interfaces.
6. Run typecheck, tests, safe scans, and Git diff checks.

## Verification

Expected checks:

```powershell
corepack pnpm typecheck
corepack pnpm test
git diff --check
Get-ChildItem -Recurse -File | Select-String -Pattern '[ \t]$'
```

## Progress / Decisions

- Installed TypeScript, Vitest, Node types, and Zod.
- Added Zod runtime schema parse helpers.
- Implemented a fixture-safe file archive writer.
- Added synthetic archive manifest helper.
- Added a Vitest behavior test through public package interfaces.

## Verification Results

- `pnpm typecheck`: passed across all workspace packages.
- `pnpm test`: passed 1 test file and 1 test.
