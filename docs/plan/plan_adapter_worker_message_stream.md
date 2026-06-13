# Plan: Adapter Worker Message Stream

## Objective

Add the first safe parsing boundary for future adapter child-process stdout:
adapter workers will eventually emit JSON Lines, and core needs a small,
tested way to turn those lines into validated `AdapterToCoreMessage` objects.

This does not start child processes, connect to live sites, execute media tools,
or implement live capture.

## Scope

- Add a core adapter JSONL message stream parser.
- Parse line-delimited JSON from an async iterable of strings.
- Validate each parsed object through the shared adapter-to-core schema.
- Ignore blank lines.
- Report invalid JSON and invalid protocol with line numbers.
- Do not include raw line content in thrown errors, because adapter output may
  contain sensitive data before validation catches it.
- Export the parser through `packages/core/src/adapters/index.ts`.
- Add TDD coverage under `tdd-tests/packages/core/adapter-message-stream/`.

## Constraints

- No child-process spawning in this slice.
- No real adapter execution.
- No raw URL/cookie/token/header/session data in fixtures or errors.
- TDD: one behavior at a time.

## Verification

Expected checks:

- targeted adapter message stream tests;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.

## Progress / Decisions

- Added `readAdapterWorkerJsonlMessages` in
  `packages/core/src/adapters/adapterMessageStream.ts`.
- Added `AdapterWorkerMessageStreamError` with stable `code` and `lineNumber`.
- The parser ignores blank lines, parses JSON Lines, validates each object
  through `parseAdapterToCoreMessageV1`, and yields typed
  `AdapterToCoreMessage` objects.
- Invalid JSON uses `adapter_worker_stream.invalid_json`.
- Schema-invalid adapter messages use `adapter_worker_stream.protocol_invalid`.
- Error messages include line numbers but do not echo raw worker output.
- Added TDD coverage under
  `tdd-tests/packages/core/adapter-message-stream/adapterMessageStream.test.ts`.
- Targeted adapter message stream tests passed.
- Full verification passed:
  - `pnpm typecheck`
  - `pnpm test` passed 24 files and 103 tests;
  - `pnpm build`
  - `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
  - `git diff --check`
  - trailing whitespace scan
  - JSON/package config parse scan parsed 26 JSON files.

## Blockers

- None.
