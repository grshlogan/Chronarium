# Plan Workspace And Schema Foundation

## Objective

Create the first maintainable Chronarium project foundation: product and schema
documents, TypeScript workspace boundaries, and fixture-first package skeletons.

## Scope

- Audit existing project documents for obvious stage conflicts.
- Add first draft documents for product scope, archive format, timeline schema,
  adapter protocol, security/privacy, and development setup.
- Create root workspace files without installing dependencies.
- Add minimal TypeScript package boundaries for shared types, schemas, archive,
  core, Chaturbate fixture adapter, and testkit helpers.
- Update code map, handoff, and change index after structural changes.

## Out Of Scope

- No real site connections.
- No Chaturbate download, playlist polling, account, cookie, header, or session
  handling.
- No Electron, React, SQLite, FFmpeg, or archive writer implementation.
- No Git initialization, commit, push, or license decision.
- No real recordings, private room data, personal data, or signed URLs.

## Current Facts

- The repository starts as documentation only.
- Git is not initialized.
- The chosen default direction is TypeScript-first with Electron, React, Node
  core, isolated TypeScript site adapters, JSON Lines fact logs, and SQLite
  indexing.
- The first code should be schema-first and fixture-first.

## Execution Plan

1. Add plan and v1 draft documents.
2. Add workspace configuration and `.gitignore`.
3. Add package skeletons with explicit contracts and no external dependencies.
4. Update README and APP_CODE_MAP to reflect the new current state.
5. Run minimal safe validation: file tree, trailing whitespace scan, JSON parse,
   and Git presence check.
6. Update AI_HANDOFF and AI_CHANGE_INDEX with actual verification results.

## Verification

Expected safe checks for this step:

```powershell
rg --files
Get-ChildItem -Recurse -File | ... trailing whitespace scan
Get-Content package.json | ConvertFrom-Json
Test-Path .git
```

Dependency installation, TypeScript compilation, tests, lint, and build are
intentionally deferred until package dependencies are selected and installed.

## Progress / Decisions

- 2026-06-11: Plan created for the initial workspace and schema foundation.
