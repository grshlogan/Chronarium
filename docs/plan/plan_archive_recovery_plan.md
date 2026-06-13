# Plan: Archive Recovery Plan (report-only)

## Objective

Turn the existing report-only recovery findings (`inspectArchiveRecovery` in
`packages/archive/src/recovery.ts`) into a structured, ordered **recovery plan**:
proposed actions grouped by kind, each tagged with a safety level. The plan is
pure and report-only — it executes nothing. It is the contract a future,
user-approved recovery executor would consume.

This is Claude's (A02) lane (`packages/archive`); fixture-safe; no destructive
behavior; no collision with Codex's media-tools / desktop / adapters lane.

## Scope

- `packages/archive/src/recoveryPlan.ts` (new): `buildArchiveRecoveryPlan(report:
  ArchiveRecoveryReport): ArchiveRecoveryPlan` — a pure function over an existing
  recovery report (no IO).
- Types: `RecoveryPlanSafetyLevel` (`report-only` | `safe-rebuild` |
  `destructive-confirm`), `RecoveryPlanStep`, `ArchiveRecoveryPlan`.
- Re-export from `packages/archive/src/index.ts`.
- Tests under `tdd-tests/packages/archive/recovery-plan/`.

Out of scope (deferred; needs explicit user approval to ever execute):
- Executing any action. Every step is `executable: false` this slice. No file
  deletion, manifest rewrite, timeline quarantine, or index rebuild is performed.

## Behavior

- Group `report.findings` by `suggestedAction`; each group becomes one step with
  the union of finding codes and the affected targets (`path` / `trackId`).
- Safety-level mapping:
  - `inspect-manually` → `report-only`
  - `recompute-manifest-counts-with-confirmation` → `safe-rebuild`
  - `restore-or-recreate-manifest`,
    `quarantine-trailing-line-with-confirmation`,
    `remove-temp-file-with-confirmation`,
    `adopt-or-remove-track-with-confirmation` → `destructive-confirm`
- Order steps by a fixed recovery sequence: restore manifest → recompute counts
  → quarantine trailing line → remove temp file → adopt/remove track → inspect.
- `status`: `no-action` when there are no findings, else `actions-proposed`.
- `executable` is always `false` (nothing runs in this slice).

## TDD (vertical slices)

1. Tracer: a report with two `orphan_temp_file` findings yields one
   `remove-temp-file-with-confirmation` step, `destructive-confirm`, two targets,
   `executable: false`, plan `status: "actions-proposed"`.
2. Grouping + ordering across mixed findings; safety-level mapping; `no-action`
   for a healthy report.

## Verification

`pnpm typecheck`; `pnpm test`; `pnpm build`; `git diff --check`;
trailing-whitespace scan.

## Docs (shared files: append only my dated sections)

`docs/APP_CODE_MAP.md` (recovery plan file + responsibility), `docs/AI_HANDOFF.md`,
`docs/AI_CHANGE_INDEX.md`, and `docs/conversation-A02-foundation-docs-completion.md`
(Phase 8). A01 context and Codex lanes untouched.

## Progress / Decisions

- Added `packages/archive/src/recoveryPlan.ts` (`buildArchiveRecoveryPlan`, pure,
  report-only) + types (`RecoveryPlanSafetyLevel`, `RecoveryPlanStep`,
  `ArchiveRecoveryPlan`), re-exported from `packages/archive/src/index.ts`.
- Groups findings by `suggestedAction`; fixed recovery-sequence ordering; safety
  levels mapped (`inspect-manually`→report-only,
  `recompute-manifest-counts`→safe-rebuild, the rest→destructive-confirm);
  `status` is `no-action` / `actions-proposed`; every step `executable: false`.
- TDD: tracer RED (`buildArchiveRecoveryPlan` absent) → GREEN; 3 tests (grouping,
  no-action, ordering + safety-level mapping).
- Verification: `pnpm typecheck`, `pnpm build` passed; `pnpm test` 177 tests (was
  174); `git diff --check` clean.
- Nothing is executed; a future approved executor consumes this plan.

## Blockers
- None.
