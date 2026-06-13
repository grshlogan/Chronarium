# Plan: Replay Timeline Reader (packages/player, milestone a + b-lite)

## Objective

Stand up `packages/player` with the first fixture-safe replay reader, satisfying
the early milestones in `docs/REPLAY_MODEL_V1.md`:

- (a) timeline inspector: turn a session's timeline events into an ordered,
  position-annotated, presentation-classed replay timeline;
- (b-lite) state reconstruction: fold state-bearing facts to reconstruct session
  state at a given replay-clock time `T`.

Pure functions over an in-memory timeline event array (no IO, no archive read,
no SQLite, no network) — fixture-safe and aligned with "replay must work from the
archive alone / never mutate / never require network or index".

## Contracts honored (from REPLAY_MODEL_V1)

- `sequence` is the only ordering authority (never reorder on timestamp).
- Position: `monotonicMs` relative to the epoch when present; else approximate
  `capturedAt` delta, flagged `approximate: true`. `sourceTime` is never used to
  position.
- Epoch = the first timeline event (lowest sequence).
- Presentation classes: `point` (chat/session/adapter/diagnostic/media obs),
  `state` (room.*/paid_room.*), `span` (media.gap.*/network.*).
- State at `T` = fold state-bearing events with position ≤ `T` in `sequence`
  order, last-write-wins per state key.

## Scope

- New package `packages/player` (`@chronarium/player`): `package.json`,
  `tsconfig.json`, `src/index.ts`, `src/replayTimeline.ts`.
- Root wiring (Claude-only this round): `tsconfig.base.json` paths,
  `tsconfig.json` references, `vitest.config.ts` alias. (`pnpm-workspace.yaml`
  already globs `packages/*`.)
- Replay-result types live package-local in `packages/player` (consume
  `TimelineEventEnvelope` from `@chronarium/types` read-only; do not edit
  `packages/types`).
- API:
  - `buildReplayTimeline(events): { epoch, steps }` — `steps` ordered by
    sequence, each `{ event, sequence, positionMs, approximate, presentationClass }`.
  - `reconstructRoomStateAt(events, atMs): RoomStateSnapshot` — per-key
    last-write-wins fold of `room.state.changed` payloads with position ≤ atMs.
- Tests under `tdd-tests/packages/player/`.

Out of scope: media decode/playback, segment anchor alignment (milestone c/d),
real archive reading, GUI, SQLite acceleration.

## TDD (vertical slices)

1. `buildReplayTimeline` tracer: out-of-order input is ordered by sequence;
   monotonicMs positions relative to epoch; a missing-monotonicMs event falls
   back to an approximate capturedAt delta; presentation classes mapped.
2. `reconstructRoomStateAt`: per-key last-write-wins fold up to T; events after T
   ignored; ordering by sequence not timestamp.

## Verification

`pnpm install` (new workspace package), `pnpm typecheck`, `pnpm test`,
`pnpm build`, `git diff --check`, trailing-whitespace scan.

## Docs

`docs/REPLAY_MODEL_V1.md` (mark milestone a/b-lite reader implemented),
`docs/APP_CODE_MAP.md` (player package), `docs/AI_HANDOFF.md`,
`docs/AI_CHANGE_INDEX.md`, `docs/conversation-A02-foundation-docs-completion.md`
(Phase 9). Shared index files: append my sections only. A01 + Codex lanes
untouched.

## Progress / Decisions

- Created `packages/player` (`@chronarium/player`) with `replayTimeline.ts`:
  `buildReplayTimeline(events)` (orders by `sequence`; positions by `monotonicMs`
  relative to the epoch, else approximate `capturedAt` delta flagged
  `approximate`; presentation class point/state/span) and
  `reconstructRoomStateAt(events, atMs)` (per-key last-write-wins fold of
  `room.state.changed` up to `T` in sequence order). Pure, no IO.
- Wired the package into `tsconfig.base.json`, `tsconfig.json`,
  `vitest.config.ts` (Claude-only root edits this round).
- TDD: tracer RED (module absent) → fixed a block-comment that contained `*/`
  inside `media.gap.*` text → GREEN; 4 tests (ordering/positioning/class,
  approximate fallback, state fold up to T, ignores events after T).
- Verification: `pnpm install`, `pnpm typecheck`, `pnpm build` passed; the player
  tests pass 4/4; `git diff --check` clean. (The combined tree shows 1 unrelated
  failure in Codex's in-progress `apps/desktop` dashboard test — different lane.)

## Blockers
- None for this slice.
