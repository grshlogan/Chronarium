# Plan: Adapter Worker Supervisor Harness

## Objective

Add a no-spawn supervisor harness that connects the adapter worker command
descriptor, stdout JSONL parser, stderr summaries, exit code, and fixture
lifecycle host into one testable boundary.

This is the last local skeleton step before a real process launcher can be
designed. It still does not spawn child processes, connect to live sites,
execute media tools, or implement live capture.

## Scope

- Add a core adapter worker supervisor harness under `packages/core/src/adapters`.
- Accept a modeled worker result: command descriptor, stdout lines, stderr
  lines, and exit code.
- Parse stdout with `readAdapterWorkerJsonlMessages`.
- Run parsed adapter messages through the existing fixture lifecycle host.
- Return a structured report containing command, lifecycle, stderr summary,
  exit code, status, and optional failure.
- Treat non-zero exit codes as worker failures.
- Treat invalid stdout JSON/protocol as worker failures without echoing raw
  stdout.
- Keep stderr bounded and redacted-looking by length, not raw secret scanning.
- Export through `packages/core/src/adapters/index.ts`.
- Add TDD coverage under `tdd-tests/packages/core/adapter-worker-supervisor/`.

## Constraints

- No process spawning.
- No real adapter execution.
- No real livestream site access.
- No cookies, headers, tokens, signed URLs, sessions, or private room data.
- TDD: one behavior at a time.

## Verification

Expected checks:

- targeted adapter worker supervisor tests;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.

## Progress / Decisions

- Added `runModeledAdapterWorker` in
  `packages/core/src/adapters/adapterWorkerSupervisor.ts`.
- The harness accepts a command descriptor, lifecycle request, stdout lines,
  stderr lines, and exit code.
- The harness parses stdout through `readAdapterWorkerJsonlMessages`, then runs
  parsed messages through the fixture lifecycle host.
- The report includes command, lifecycle when available, bounded stderr summary,
  exit code, status, and optional failure.
- Valid stdout plus exit code 0 returns `status: "completed"`.
- Invalid stdout JSON/protocol returns `status: "failed"` without echoing raw
  stdout.
- Non-zero exit code returns `adapter_worker.exit_nonzero` even when lifecycle
  messages finished.
- Added TDD coverage under
  `tdd-tests/packages/core/adapter-worker-supervisor/adapterWorkerSupervisor.test.ts`.
- Full verification passed:
  - `pnpm typecheck`
  - `pnpm test` passed 26 files and 108 tests;
  - `pnpm build`
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
  - `git diff --check`
  - trailing whitespace scan
  - JSON/package config parse scan parsed 26 JSON files.

## Blockers

- None.
