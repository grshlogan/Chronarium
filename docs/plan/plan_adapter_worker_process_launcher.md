# Plan: Real Adapter Worker Process Launcher

## Objective

Turn the no-spawn supervisor harness (`runModeledAdapterWorker`) into a real
child-process launcher (`runAdapterWorkerProcess`) that actually `spawn`s a
worker, writes an optional one-time stdin handshake, reads stdout JSON Lines,
captures stderr, awaits exit (with a timeout/kill), and produces the same
lifecycle report. This is the process-isolation boundary required before a live
adapter, built fixture-safe: it spawns a **fixture / stub worker only**, never a
real site, and makes no network requests.

Lives in `packages/core/src/adapters` (no new package, so no root config edits;
no collision with the adapters/desktop lane).

## Design

- `runAdapterWorkerProcess(input)` where `input` carries:
  - `command: { executablePath, argv }` (from `createAdapterWorkerCommand` in
    real use; hand-built in tests), `shell: false`;
  - `lifecycleRequest` (the same shape `runModeledAdapterWorker` consumes);
  - optional `stdinHandshake?: string` — written once to the child's stdin then
    closed (models the runtime-only credential jar channel; never argv, never
    logged);
  - optional `timeoutMs`.
- It spawns the child with `stdio: ["pipe", "pipe", "pipe"]`, collects stdout
  lines / stderr lines / exit code, kills on timeout, then **delegates to the
  existing `runModeledAdapterWorker` report builder** with those collected
  values. So the real launcher only adds the process mechanics; report semantics
  stay shared and already tested.
- Errors (spawn failure, non-zero exit, invalid stdout JSON) become failed
  reports, never raw-output-leaking exceptions. The launcher never echoes raw
  stdout/stderr beyond the existing sanitized summaries.

## Out of scope (still gated)

- A real CB worker entry that fetches the network (the live crossing).
- Real HTTP, real media download, FFmpeg execution, manifest live flip,
  credential live-prep.

## TDD (vertical slices)

1. Tracer: spawn a stub worker (a single-line `node -e` script the test provides)
   that emits a valid `adapter.ready` ... `adapter.finished` JSONL stream; assert
   the launcher returns a finished lifecycle report with the parsed messages.
2. Stdin handshake: a stub worker that echoes a line read from stdin into a
   diagnostic; assert the launcher wrote the handshake and the child saw it
   (proves the runtime-only injection channel) — without the handshake appearing
   in any report field.
3. Failure: a stub worker that exits non-zero / emits invalid JSON becomes a
   failed report (reusing the supervisor's `adapter_worker.exit_nonzero` /
   `adapter_worker_stream.invalid_json` codes); a spawn of a missing executable
   becomes a failed report, not a throw.

## Verification

`pnpm typecheck`, `pnpm test`, `pnpm build`, `git diff --check`,
trailing-whitespace scan.

## Docs

`docs/ADAPTER_PROTOCOL.md` (note the real launcher), `docs/CHATURBATE_LIVE_ADAPTER_DESIGN.md`
(reference), my plan + A02 context. Shared index docs: hand snippets to the
committer (single-writer rule).

## Progress / Decisions
- (pending implementation)

## Blockers
- None.
