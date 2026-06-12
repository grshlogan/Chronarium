# Web Dashboard Monitoring Semantics Plan

## Objective

Correct the first Web-first recording dashboard so the primary recording view
matches Chronarium's real product model: adding and maintaining streamer links
starts monitoring, and recording happens automatically when a streamer is live.
The GUI should not imply that users manually start recordings.

## Scope

- Add visible monitoring controls for the selected streamer:
  - pause monitoring;
  - resume monitoring;
  - check now.
- Reframe the existing browser-safe fixture action as an offline self-test under
  maintenance/diagnostics language, not a recording start action.
- Keep all behavior synthetic and browser-safe.
- Keep tests under `tdd-tests/apps/desktop/recording-dashboard/`.

## Out Of Scope

- No real Chaturbate connection.
- No live capture, downloader, cookies, headers, tokens, sessions, or account
  logic.
- No Electron shell, preload, IPC, archive filesystem access, SQLite access, or
  direct `packages/core` calls from the renderer.
- No live preview.

## Product Decision

The recording dashboard models an always-on maintenance loop:

```text
Add streamer link
  -> monitor streamer state
  -> check periodically or on demand
  -> automatically record when live
  -> finish archive when stream ends
  -> continue monitoring
```

The GUI may offer pause/resume/check controls for monitoring. It should not show
"Start recording" as the primary user operation.

## TDD

- RED: extend the dashboard TDD slice so the public app render contains pause,
  resume, and check-now monitoring controls, and no longer frames the fixture
  path as "Run fixture capture".
- GREEN: update dashboard state/reducer and UI labels.
- REFACTOR: keep the fixture action as an offline self-test panel and preserve
  the existing demo completion behavior.

## Verification

- Targeted `tdd-tests` Vitest file.
- Browser smoke on `http://127.0.0.1:5187/`.
- Full workspace typecheck/test/build.
- `git diff --check`.
- trailing whitespace scan.
- JSON/package config parse scan.

## Progress

- TDD RED failed because the dashboard did not render `Pause monitoring`,
  `Resume monitoring`, `Check now`, or `Offline self-test`, and still exposed
  the old fixture-capture wording.
- Added monitoring-first state to the dashboard view model.
- Added reducer actions for selected-streamer pause, resume, and check now.
- Reframed the synthetic fixture behavior as `Run offline self-test` under
  maintenance diagnostics.
- Targeted TDD test passed after implementation.
- Browser smoke on `http://127.0.0.1:5187/` confirmed pause/resume/check and
  `Run offline self-test` render, and that the old `Run fixture capture` button
  is absent.
- Browser smoke clicked `Check now` and `Run offline self-test`, then confirmed
  `Manual state check queued`, `Offline self-test completed`,
  `Synthetic archive validated`, and `3 timeline facts`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 16 files and 66 tests after the streamer-selection slice
  was added.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON/package config parse scan: parsed 24 JSON files.
