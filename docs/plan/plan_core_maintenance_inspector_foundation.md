# Plan: Core Maintenance Inspector Foundation

## Objective

Add the first read-only maintenance inspector under `packages/core`.

The inspector should answer, in structured data, whether a `.chron` archive is
readable and which known validation or recording diagnostic facts need user
attention.

## Scope

In scope:

- define first `MaintenanceReport`, `MaintenanceFinding`, evidence, and action
  suggestion types;
- inspect one archive path through the existing core archive/index service;
- convert archive validator issues into maintenance findings;
- convert known timeline diagnostic facts into maintenance findings:
  - `media.gap.detected`;
  - `diagnostic.duration_mismatch`;
  - `diagnostic.media_tool_output`;
- keep all behavior read-only and deterministic;
- test with synthetic archives and synthetic Chaturbate diagnostic fixtures.

Out of scope:

- background maintenance loop;
- AI calls;
- automatic repair;
- deleting, moving, rewriting, or migrating archives;
- real Chaturbate requests;
- real media probing;
- FFmpeg / ffprobe execution;
- index freshness comparison beyond reading existing archive/index service
  facts.

## Current Facts

- `packages/core` has `CoreArchiveIndexService` for archive validation, reading,
  reindexing, and index queries.
- `packages/archive` exposes `validateFileArchive` and `readFileArchive`.
- `packages/adapters/chaturbate` has synthetic diagnostic fixtures that model
  bad recording facts without proving live-site behavior.
- `docs/MAINTENANCE_OPS_DESIGN.md` recommends deterministic inspection before
  any AI layer.

## Design Notes

- First implementation should be Level 0: Report Only.
- Findings should cite evidence rather than hide raw facts.
- Diagnostic timeline fixture evidence level should remain visible in report
  evidence.
- The inspector should degrade gracefully: invalid archives still produce a
  report with validation findings.
- It should not call `reindexArchive`, because reindexing is a derived write.

## Verification

Expected commands:

```powershell
pnpm exec vitest run packages/core/tests
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run trailing whitespace and JSON parse scans.

## Progress / Decisions

- Plan created before implementation.
- Added `packages/core/src/maintenance/inspectionTypes.ts`.
- Added `packages/core/src/maintenance/archiveInspector.ts`.
- Exported maintenance APIs from `packages/core/src/index.ts`.
- Added `packages/core/tests/maintenanceInspector.test.ts`.
- The inspector is read-only and only calls `validateArchive`.
- Core tests construct generic timeline diagnostic facts directly instead of
  importing any site adapter package.
- `pnpm exec vitest run packages/core/tests`: passed 3 files and 7 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 9 files and 42 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- Trailing whitespace scan produced no output.
- JSON parse scan succeeded for package/config and synthetic fixture JSON
  files.

## Blockers

None currently.
