# Web Dashboard Streamer Selection Plan

## Objective

Make the left maintained-streamer list behave like real navigation for the
Web-first recording dashboard. Selecting a streamer should update the main
workspace and right-side context to that streamer.

## Scope

- Add a browser-safe selected-streamer action to the dashboard reducer.
- Render maintained streamers as clickable controls.
- Keep the behavior synthetic and local to `apps/desktop`.
- Keep TDD coverage under
  `tdd-tests/apps/desktop/recording-dashboard/`.

## Out Of Scope

- No real link parsing.
- No persistent streamer storage.
- No core, archive, SQLite, Electron, preload, or IPC calls.
- No real site connection or recording logic.

## TDD

- RED: selecting `VelvetMoth` through the public dashboard reducer changes the
  selected streamer and renders the workspace as paused.
- GREEN: add the reducer action and clickable streamer list.

## Verification

- Targeted dashboard TDD test.
- Browser smoke by clicking a streamer in the left rail.
- Full workspace checks before commit.

## Progress

- TDD RED failed because selecting `velvet` did not update the selected
  workspace.
- Added `streamer.select` to the dashboard reducer.
- Rendered maintained streamer rows as clickable buttons.
- Targeted dashboard TDD test passed after implementation.
- Browser smoke clicked `VelvetMoth` on `http://127.0.0.1:5187/` and confirmed
  the selected card, `Monitoring paused`, and `Auto capture: Paused`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 16 files and 66 tests.
- `pnpm build`: passed.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON/package config parse scan: parsed 24 JSON files.
