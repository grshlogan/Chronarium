# Web Dashboard Streamer Context Plan

## Objective

Fix the maintained-streamer list timestamp wrapping and make the selected
streamer drive the center workspace and right-side session context.

## Scope

- Render site and last-check time on separate lines in the left streamer list.
- Give each synthetic streamer its own current session, history, latest facts,
  and summary metrics.
- Expand the left streamer rail so rows can show availability, show mode,
  media-stream recording state, and information-stream recording state.
- Show a no-current-recording state for paused, waiting, or offline streamers.
- Keep the work browser-local, synthetic-only, and under `apps/desktop`.

## Out Of Scope

- No real site connection.
- No real link parsing.
- No core, archive, SQLite, Electron, preload, or IPC calls.
- No real recording or media download logic.

## TDD

- RED/GREEN 1: left streamer rows render site and `Last check` as separate
  lines.
- RED/GREEN 2: selecting a paused streamer updates the center and right
  session context to that streamer and removes the current-recording card.
- RED/GREEN 3: selecting an offline streamer shows waiting/offline context and
  streamer-specific history/facts.
- RED/GREEN 4: left streamer rows render expanded status lanes for recording
  decisions.

## Verification

- Targeted dashboard TDD test.
- Browser smoke on `http://127.0.0.1:5187/`.
- Full workspace checks before commit.

## Progress

- TDD RED 1 failed because left streamer rows did not expose separate
  `site-code` and `last-check` elements.
- Added explicit `site-code` and `last-check` elements and CSS block display so
  every streamer row wraps the check time consistently.
- TDD RED 2 failed because selecting `velvet` still reused Luna's current
  recording, history, size, and facts.
- Reworked the synthetic dashboard data so each streamer has its own
  `StreamerContext`: current session, history, latest facts, room state, and
  summary metrics.
- Updated the UI to read recording details, right history, facts, and empty
  states from the selected streamer context.
- RED/GREEN 3 for `cyber` passed because the per-streamer context already
  covered offline empty-history state.
- Targeted dashboard TDD test passed after implementation.
- `pnpm typecheck`: passed after fixing optional current-session updates.
- `pnpm test`: passed 16 files and 69 tests.
- `pnpm build`: passed.
- Browser smoke confirmed every streamer row renders `.site-code` and
  `.last-check` as block elements.
- Browser smoke clicked `VelvetMoth` and confirmed `VelvetMoth idle`, `No
  current recording`, `VelvetMoth Jun 10`, and no leaked `12.46 GB` Luna size.
- Browser smoke clicked `CyberCyan` and confirmed `CyberCyan offline`, `Room
  state: OFFLINE`, `No sessions archived yet.`, and `No current recording`.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON/package config parse scan: parsed 24 JSON files.
- RED/GREEN 4 failed until the left streamer rows exposed synthetic status
  lanes for availability, show mode, media-stream capture, and
  information-stream capture.
- The left rail now uses explicit width variables. The left rail is wider than
  the first dashboard version so the status lanes can wrap cleanly.
- The expanded status lanes remain synthetic UI state only. They do not imply
  real site detection, private-show handling, stream capture, or information
  stream capture exists.
- Targeted dashboard TDD test passed with 7 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed 16 files and 70 tests.
- `pnpm build`: passed.
- Browser smoke on `http://127.0.0.1:5187/` confirmed the left rail width is
  382px, all 6 streamer rows have 4 status chips, and no streamer card overflow
  was detected.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON/package config parse scan: parsed 24 JSON files.
