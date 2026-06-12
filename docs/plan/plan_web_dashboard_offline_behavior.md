# Web Dashboard Offline Behavior Plan

## Objective

Give the first Web-first recording dashboard one safe behavior path: a user can
trigger an offline fixture capture demo and see the UI move from ready/running
to completed or failed.

## Scope

- Add a small `apps/desktop` recording dashboard state model.
- Add a reducer that maps demo capture actions into UI state.
- Add a button in the recording workspace for a synthetic offline fixture
  capture demo.
- Keep the demo browser-safe and synthetic-only.
- Keep the root-level TDD slice under
  `tdd-tests/apps/desktop/recording-dashboard/`.

## Out Of Scope

- No real Chaturbate connection.
- No real capture, downloader, cookie, header, token, session, or account logic.
- No archive writer, SQLite, filesystem, or `packages/core` call from the Vite
  renderer.
- No Electron shell, preload, or IPC.
- No live preview.

## Boundary Decision

The browser renderer cannot directly call Node-only core/archive/indexer APIs.
This pass therefore adds a browser-safe demo behavior boundary under
`apps/desktop/src/recordingDashboard.ts`. A future Electron/preload or
GUI-facing DTO client can replace the demo action while keeping the reducer and
view state shape.

## TDD

- RED: extend the dashboard TDD slice so the public `@chronarium/desktop`
  interface can render a completed offline fixture capture result.
- GREEN: add the recording dashboard state/reducer/demo action and render the
  offline fixture capture panel.

## Verification

- Targeted `tdd-tests` Vitest file.
- Browser smoke on `http://127.0.0.1:5187/` by clicking `Run fixture capture`.
- Full workspace typecheck/test/build.
- `git diff --check`.
- trailing whitespace scan.
- JSON/package config parse scan.

## Progress

- TDD RED failed because `createInitialRecordingDashboard` was not exported.
- Added `recordingDashboard.ts`, reducer, demo action, and UI panel.
- Targeted test passed after implementation.
- Browser smoke confirmed clicking the button renders `Completed`,
  `Synthetic archive written`, `Fixture capture completed`, and
  `3 timeline facts`.
