# Plan: Foundation Docs Completion

## Objective

Close the largest documentation gaps identified after reviewing the current
docs and package skeleton, before more code is written.

The missing documents are:

- `docs/REPLAY_MODEL_V1.md`: replay semantics, the primary consumer contract
  that validates archive and timeline design.
- `docs/GUI_CORE_PROTOCOL.md`: the GUI-to-core message contract, mirroring
  `docs/ADAPTER_PROTOCOL.md` for the renderer/core edge.
- `docs/DIAGNOSTIC_CODES_V1.md`: registry and naming rules for validation and
  diagnostic codes that already flow into reports and SQLite rows.
- `docs/MEDIA_TOOLS_BOUNDARY.md`: the typed external media tool contract,
  promoted from `docs/CB_RECORDING_REFERENCES.md` section 4.
- `docs/plan/plan_archive_recovery.md`: design draft for interrupted-write
  recovery before the behavior is implemented.

## Scope

In scope:

- write the five documents above;
- create `docs/conversation-A02-foundation-docs-completion.md`;
- update `README.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`, and
  `docs/APP_CODE_MAP.md` indexes.

Out of scope:

- any code, schema, or test changes;
- implementing replay, GUI, IPC, recovery, or media tools;
- changing existing contract documents beyond index links;
- live site work of any kind.

## Current Facts

- The archive validator defines twenty `ArchiveValidationIssueCode` values in
  `packages/archive/src/validator.ts`; they are stored in SQLite by
  `packages/indexer` but documented nowhere.
- The archive writer uses create-new package roots, temp-file-plus-rename JSON
  writes, append-only JSONL, and finalize-time manifest counts; it has no
  recovery behavior and no in-progress marker.
- `docs/ARCHITECTURE.md` names a "narrow IPC/API client" for the GUI but no
  protocol document exists for that edge.
- `docs/CONTEXT.md` defines "perfect replay" but no document defines replay
  inputs, the replay clock, seeking, or state reconstruction.
- `docs/CB_RECORDING_REFERENCES.md` sketches media-tool command builder rules
  inside a reference document rather than a standalone contract.

## Constraints

- Docs must stay honest: nothing in these documents is implemented unless the
  status line says so.
- No secrets, signed URLs, cookies, headers, private room details, or real
  media examples.
- Keep vocabulary aligned with `docs/CONTEXT.md` and existing contracts.
- English document bodies, matching existing doc style.

## Execution Plan

1. Create this plan and the A02 conversation context document.
2. Draft the five documents.
3. Review drafts for factual accuracy against code, vocabulary consistency,
   cross-document consistency, and style.
4. Update `README.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`, and
   `docs/APP_CODE_MAP.md`.
5. Run docs-only verification checks.

## Verification

Expected commands:

```powershell
git diff --check
```

Also run trailing whitespace and JSON/package config parse scans. No code
changes are made, so `pnpm typecheck`, `pnpm test`, and `pnpm build` are not
required but may be run as a regression guard.

## Progress / Decisions

- Naming decision: versioned suffix only for stored-contract documents
  (`REPLAY_MODEL_V1`, `DIAGNOSTIC_CODES_V1`); protocol and policy documents
  follow `ADAPTER_PROTOCOL.md` / `SECURITY_PRIVACY.md` naming
  (`GUI_CORE_PROTOCOL.md`, `MEDIA_TOOLS_BOUNDARY.md`).
- Recovery work gets a plan document first because it changes storage
  behavior and must not start as code.
- All five documents were drafted, adversarially reviewed for factual
  accuracy against the code, cross-checked for consistency, and fixed.
- A `protocol.*` reserved area was added to `docs/DIAGNOSTIC_CODES_V1.md`
  so the GUI/core protocol error model has a registry home.
- `media.mux.*` is documented as a proposed new event family that must be
  reserved in `docs/TIMELINE_SCHEMA_V1.md` before first use.
- Archive recovery repair operations are classified as Level 2 (explicit
  user confirmation) under `docs/MAINTENANCE_OPS_DESIGN.md`.
- Index updates landed in `README.md`, `docs/APP_CODE_MAP.md`,
  `docs/AI_HANDOFF.md`, and `docs/AI_CHANGE_INDEX.md`.
- All verification checks passed; see `docs/AI_CHANGE_INDEX.md` for the
  recorded results.

## Blockers

None currently.
