# AI Change Index

This document records AI-assisted conversations that land structural changes in
Chronarium. Keep entries factual, short, and ordered by date. Do not record
unimplemented ideas as completed work.

## Entry Format

```text
## YYYY-MM-DD: Short title

- Conversation: brief context.
- Landed: files or behavior changed.
- Decisions: architecture or product decisions made.
- Verification: commands or checks run.
- Next: immediate follow-up.
```

## 2026-06-11: Project identity and documentation foundation

- Conversation: CTB Recorder maintenance discussion produced a new independent
  platform direction after identifying that per-site media logic, hot
  maintenance, and perfect replay goals no longer fit a unified recorder model.
- Landed: initial Chronarium documentation framework under `D:\live\Chronarium`.
- Files:
  - `README.md`
  - `AGENTS.md`
  - `docs/CONTEXT.md`
  - `docs/ARCHITECTURE.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/AI_CHANGE_INDEX.md`
  - `docs/plan/README.md`
- Decisions:
  - Product name is `Chronarium`.
  - Core purpose is livestream fact preservation and replay, not plain A/V
    recording.
  - Default stack is TypeScript-first: Electron + React GUI, Node.js core,
    isolated TypeScript site adapters, JSONL fact logs, SQLite index, FFmpeg
    typed command builders.
  - Initial site priority is Chaturbate only after archive/timeline foundations
    exist.
  - AI maintainability is a first-class design requirement.
- Verification: documentation files were created and should be inspected
  directly; no code checks exist yet.
- Next: choose license and package manager, initialize Git when approved, then
  scaffold the TypeScript workspace.

## 2026-06-11: Workspace and schema foundation

- Conversation: continued Chronarium project setup, with user-provided GitHub
  target `https://github.com/grshlogan/Chronarium.git` and permission to make a
  first version commit when appropriate.
- Landed: product and v1 contract documents, root workspace files, `.gitignore`,
  `.gitattributes`, and minimal TypeScript package skeletons.
- Files:
  - `README.md`
  - `.gitattributes`
  - `.gitignore`
  - `package.json`
  - `pnpm-workspace.yaml`
  - `tsconfig.base.json`
  - `tsconfig.json`
  - `docs/PRODUCT_SPEC.md`
  - `docs/ARCHIVE_FORMAT_V1.md`
  - `docs/TIMELINE_SCHEMA_V1.md`
  - `docs/ADAPTER_PROTOCOL.md`
  - `docs/SECURITY_PRIVACY.md`
  - `docs/DEVELOPMENT_SETUP.md`
  - `docs/APP_CODE_MAP.md`
  - `docs/AI_HANDOFF.md`
  - `docs/plan/plan_workspace_schema_foundation.md`
  - `packages/types/`
  - `packages/schemas/`
  - `packages/archive/`
  - `packages/core/`
  - `packages/adapters/chaturbate/`
  - `packages/testkit/`
- Decisions:
  - First code boundary is schema-first and fixture-first.
  - `packages/types` owns shared DTOs for sessions, media, timeline, archive,
    and adapter protocol.
  - `packages/schemas` starts with schema descriptors only; runtime validation
    is still pending.
  - `packages/archive` exposes layout constants and writer contracts only.
  - `packages/core` exposes a runtime contract skeleton only.
  - `packages/adapters/chaturbate` is synthetic fixture mode only and does not
    connect to Chaturbate.
  - No license was added because the user has not chosen one.
- Verification:
  - `rg --files` listed expected files.
  - Trailing whitespace scan with `Select-String -Pattern '[ \t]$'` produced no
    output.
  - JSON parse scan with `ConvertFrom-Json` succeeded for all package and
    TypeScript config JSON files.
  - `Test-Path .git` returned `git-absent` before repository initialization.
  - `git --version` returned `git version 2.52.0.windows.1`.
  - `.gitattributes` was added to normalize text files to LF.
  - `git init -b main` initialized the repository on `main`.
  - `git diff --cached --check` passed after trimming extra blank lines at EOF.
  - Dependency install, package-manager tests, typecheck, lint, and build were
    not run.
- Next: choose a license, install exact development dependencies, add runtime
  schema validation, and implement a synthetic-fixture archive writer.
