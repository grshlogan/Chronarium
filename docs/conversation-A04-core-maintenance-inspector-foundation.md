# Conversation A04: Core Maintenance Inspector Foundation

## Topic

A04 starts the first deterministic maintenance implementation: a read-only core
archive inspector that turns archive validation issues and timeline diagnostic
facts into structured maintenance findings.

## Current Status

In progress.

Starting point:

- `packages/core` has `CoreArchiveIndexService`.
- `packages/archive` can validate and read synthetic `.chron` packages.
- `packages/adapters/chaturbate` has synthetic diagnostic fixtures for bad
  recording facts.
- `docs/MAINTENANCE_OPS_DESIGN.md` says deterministic inspection should come
  before any AI layer.

Landed in this continuation:

- first maintenance report/finding/evidence/action suggestion types;
- `createArchiveMaintenanceInspector`;
- read-only archive inspection through the existing core archive/index service;
- conversion of archive validator issues into maintenance findings;
- conversion of known timeline diagnostic facts into maintenance findings:
  - `media.gap.detected`;
  - `diagnostic.duration_mismatch`;
  - `diagnostic.media_tool_output`;
- core tests for healthy archive, diagnostic timeline facts, and archive
  validator issue findings.

## Active Constraints

- Work only inside `D:\live\Chronarium`.
- No real livestream site connections.
- No Chaturbate live capture.
- No cookies, headers, tokens, sessions, signed URLs, private room data, or real
  media.
- Maintenance inspector is Level 0: Report Only.
- Do not delete, move, rewrite, repair, migrate, or reindex archives from the
  inspector.
- Do not add AI calls.
- Keep core generic; core must not depend on site adapter packages.

## Decisions So Far

- First maintenance inspector lives in `packages/core/src/maintenance/`.
- `MaintenanceReport` has a stable schema version, archive path, status,
  summary counts, and findings.
- Findings cite evidence and suggested actions.
- All first suggested actions are `report-only`.
- The inspector reads facts through `validateArchive`; it does not call
  `reindexArchive`.
- Core tests model diagnostic timeline facts directly instead of importing the
  Chaturbate adapter, preserving the core/adapter boundary.

## Files Changed Or Expected To Change

- `docs/conversation-A04-core-maintenance-inspector-foundation.md`
- `docs/plan/plan_core_maintenance_inspector_foundation.md`
- `packages/core/src/maintenance/`
- `packages/core/src/index.ts`
- `packages/core/tests/maintenanceInspector.test.ts`
- `README.md`
- `docs/APP_CODE_MAP.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`

## Verification

Checks run so far:

- `pnpm exec vitest run packages/core/tests`: passed 3 files and 7 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 9 files and 42 tests.
- `pnpm test` emitted Node's `node:sqlite` ExperimentalWarning; tests still
  passed.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON parse scan: succeeded for package/config and synthetic fixture JSON
  files.

## Next Safe Step

Commit and push if requested, then continue with archive recovery report-only
detection or maintenance inspector index freshness checks.
