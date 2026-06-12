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
- RED/GREEN 5: left streamer rows render a compact status board with hover
  descriptions: short availability cell, wider show-mode cell, and stream state
  cells that can be arranged by the card layout.
- RED/GREEN 6: media-stream and information-stream cells sit side by side with
  equal widths, while avatar, identity text, and status board are vertically
  centered as three card blocks.

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
- RED/GREEN 5 failed until the status area exposed descriptive hover text and a
  compact recording decision board.
- The right-side status area now uses a fixed compact board: 35px availability
  cell plus 81px show-mode cell on the first row, then 120px full-width media
  and information stream rows.
- Browser smoke confirmed the first streamer board at 120px wide, with no cell
  overflow and hover titles for availability, show mode, media stream, and
  information stream.
- The status board was revised again so media-stream and information-stream
  states sit side by side with equal widths instead of stacking vertically.
- The left rail was widened to preserve text fit, status text is centered in
  every cell, and streamer card height was reduced to 86px in browser smoke.
- RED/GREEN 6 added an explicit `streamer-identity` structure and
  `stream-state-row` so layout can keep the avatar, identity, and status board
  centered as card-level blocks.
- Browser smoke confirmed a 438px left rail, 86px streamer cards, a 176px
  status board, equal 86px media/info cells on the same row, and zero centerline
  delta for avatar, identity block, and status board.
- RED/GREEN 7 enlarged the settled streamer-card presentation after user
  review: left rail 560px, streamer cards 112px tall, avatars 58px, status
  board 256px, and an explicit 18px / 16px / 14px type scale for streamer name,
  site/check text, and status cells.
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
- Later browser smoke confirmed the enlarged 560px rail and 112px streamer
  cards render with 18px / 16px / 14px typography, a 256px status board, and no
  detected text overflow.
- The targeted dashboard TDD test now includes a CSS contract check for the
  enlarged streamer-card dimensions and typography scale.
- `git diff --check`: produced no output.
- trailing whitespace scan: produced no output.
- JSON/package config parse scan: parsed 24 JSON files.
