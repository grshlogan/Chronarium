# Documentation Code State Sync Plan

Date: 2026-06-13

## Goal

Review the current code and documentation state, then correct documentation
that has drifted from implemented repository facts.

## Scope

- Re-read project rules, current file tree, package entry points, and key
  handoff documents.
- Update current-state docs when they still describe older code boundaries.
- Keep this pass documentation-only.
- Maintain only the A01 conversation context document.

## Out Of Scope

- No source code behavior changes.
- No new tests or production logic.
- No live site access.
- No Electron, preload, IPC, adapter launcher, media-tool execution, upload, or
  deletion implementation.
- No edits to A02 context except read-only inspection if needed.

## Expected Updates

- Correct stale GUI/core protocol descriptions in the code map.
- Correct diagnostic-code wording around implemented versus reserved areas.
- Bring product/setup/adapter docs in line with the current worker-boundary and
  fixture-adapter state.
- Record the sync pass in `docs/AI_HANDOFF.md`,
  `docs/AI_CHANGE_INDEX.md`, and the A01 context document.

## Verification

Because this is docs-only, run the smallest safe checks:

- `git diff --check`
- trailing whitespace scan
- JSON/package config parse scan
