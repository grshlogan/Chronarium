# Conversation A02: Foundation Docs Completion

## Topic

A02 covers a documentation-completion pass: the user reviewed the project
state, agreed the early phase should prioritize documentation over more code,
and asked to fill the documentation gaps identified during the review.

## Current Status

Completed. This conversation added five documents and updated the doc
indexes:

- `docs/REPLAY_MODEL_V1.md` (new);
- `docs/GUI_CORE_PROTOCOL.md` (new);
- `docs/DIAGNOSTIC_CODES_V1.md` (new);
- `docs/MEDIA_TOOLS_BOUNDARY.md` (new);
- `docs/plan/plan_archive_recovery.md` (new design draft);
- `docs/plan/plan_foundation_docs_completion.md` (this work's plan);
- index updates in `README.md`, `docs/AI_HANDOFF.md`,
  `docs/AI_CHANGE_INDEX.md`, and `docs/APP_CODE_MAP.md`.

## Active Constraints

- Work only inside `D:\live\Chronarium`.
- Documentation only: no code, schema, test, or storage behavior changes.
- Do not connect to real livestream sites.
- Do not commit secrets, signed URLs, real media, private room details, or
  personal data.
- Keep docs honest about implemented versus planned behavior.
- Do not commit or push unless the user explicitly asks.

## Decisions So Far

- Early-phase priority is documentation completeness over new code.
- Replay semantics get a versioned contract document because replay is the
  primary consumer of `.chron` archives and constrains storage design.
- The GUI/core edge gets a protocol document mirroring
  `docs/ADAPTER_PROTOCOL.md`.
- Validation issue codes become a documented registry because they are stored
  in SQLite rows and must stay stable.
- Media tool rules are promoted out of `docs/CB_RECORDING_REFERENCES.md` into
  a standalone boundary contract.
- Archive recovery starts as a plan document, not code.

## Files Changed Or Expected To Change

- `docs/REPLAY_MODEL_V1.md`
- `docs/GUI_CORE_PROTOCOL.md`
- `docs/DIAGNOSTIC_CODES_V1.md`
- `docs/MEDIA_TOOLS_BOUNDARY.md`
- `docs/plan/plan_archive_recovery.md`
- `docs/plan/plan_foundation_docs_completion.md`
- `docs/conversation-A02-foundation-docs-completion.md`
- `README.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`
- `docs/APP_CODE_MAP.md`

## Verification

Run for this docs-only continuation:

- `git diff --check`: produced no output.
- Trailing whitespace scan: produced no output.
- JSON/package config parse scan: succeeded.
- New docs verified to use LF endings and end with a single newline.
- Regression guard on unchanged code: `pnpm typecheck` passed, `pnpm test`
  passed 5 Vitest files and 32 tests, `pnpm build` passed.

Drafts were also reviewed for factual accuracy against
`packages/archive/src/validator.ts`, `packages/archive/src/writer.ts`,
`packages/core`, and `packages/indexer`, plus cross-document consistency
against `docs/ARCHIVE_FORMAT_V1.md`, `docs/TIMELINE_SCHEMA_V1.md`,
`docs/ADAPTER_PROTOCOL.md`, and `docs/MAINTENANCE_OPS_DESIGN.md`. All
review findings were fixed before this handoff.

## Next Safe Step

After this documentation pass lands: add offline Chaturbate adapter fixtures
and tests (the only package violating the adapter fixture rule), or implement
archive recovery following `docs/plan/plan_archive_recovery.md`.
