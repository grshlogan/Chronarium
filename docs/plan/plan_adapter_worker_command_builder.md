# Plan: Adapter Worker Command Builder

## Objective

Add a typed command-description boundary for future adapter child-process
launching. Core should be able to build a safe `spawn`-style command descriptor
without executing it and without accepting arbitrary shell strings.

This does not start child processes, connect to live sites, execute media tools,
or implement live capture.

## Scope

- Add an adapter worker command builder under `packages/core/src/adapters`.
- Model executable path, worker entry path, adapter id, runtime mode, session id,
  requested capabilities, and optional fixture name as structured input.
- Return a command descriptor with `executablePath`, `argv`, `redactedArgv`, and
  `shell: false`.
- Reject empty or newline-bearing executable/entry/argument values.
- Require absolute executable and worker entry paths.
- Export the builder through `packages/core/src/adapters/index.ts`.
- Add TDD coverage under `tdd-tests/packages/core/adapter-worker-command/`.

## Constraints

- No process spawning in this slice.
- No manifest-provided arbitrary command strings.
- No credentials, cookies, headers, bearer tokens, signed URLs, or session
  secrets in command arguments.
- TDD: one behavior at a time.

## Verification

Expected checks:

- targeted adapter worker command tests;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.

## Progress / Decisions

- Added `createAdapterWorkerCommand` in
  `packages/core/src/adapters/adapterWorkerCommand.ts`.
- The builder returns `executablePath`, `argv`, `redactedArgv`, and
  `shell: false`.
- The builder models adapter id, runtime mode, session id, requested
  capabilities, and optional fixture name as structured argv fields.
- The builder requires absolute executable and worker entry paths.
- Empty values and newline-bearing values are rejected.
- The builder does not check file existence and does not spawn child processes.
- Added TDD coverage under
  `tdd-tests/packages/core/adapter-worker-command/adapterWorkerCommand.test.ts`.
- Full verification passed:
  - `pnpm typecheck`
  - `pnpm test` passed 25 files and 105 tests;
  - `pnpm build`
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
  - `git diff --check`
  - trailing whitespace scan
  - JSON/package config parse scan parsed 26 JSON files.

## Blockers

- None.
