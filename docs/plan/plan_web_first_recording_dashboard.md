# Web-First Recording Dashboard Plan

## Goal

Build the first Web UI surface for Chronarium before Electron wrapping.

The first screen should follow the latest layout direction:

```text
managed streamers sidebar -> selected streamer workspace -> session history
global info bottom-left -> conditional detail panel below main surface
```

## Scope

- Web-first React + TypeScript + Vite app under `apps/desktop`.
- Static synthetic data only for this first UI pass.
- Left sidebar focuses on maintained streamers added by parsed links.
- Main workspace shows selected streamer state.
- Recording mode does not implement live preview. It shows capture status and a
  disabled future preview surface.
- Center-bottom panel shows recording information while recording.
- Right sidebar shows selected streamer's session history with the current
  recording pinned at the top and visually locked.
- Left-bottom global info panel matches the left sidebar width.

## Out Of Scope

- No Electron shell yet.
- No preload or IPC.
- No real site connection.
- No real Chaturbate adapter logic.
- No cookies, sessions, headers, tokens, signed URLs, private room data, or real
  media.
- No archive reader binding in the UI. This avoids further hard-coding the
  current full-array `timelineEvents` archive API.
- No live preview implementation.

## Data Boundary

This UI should render from a small view model / mock presenter first. It should
not call `readFileArchive`, `validateFileArchive`, or indexer APIs directly.

Future core integration should use GUI-facing DTOs and, after implementation,
streaming/batched timeline APIs.

## TDD

- Tests live under `tdd-tests/`.
- First RED: the Web UI public component renders the streamer maintenance
  dashboard shell with selected streamer, recording state, pinned current
  session, recording information, history, and global information.
- GREEN: add the smallest React/Vite app that satisfies the screen contract.

## Verification

- Targeted Vitest test under `tdd-tests/`.
- `pnpm typecheck`.
- `pnpm test`.
- `pnpm build`.
- `git diff --check`.
- trailing whitespace scan.
- JSON/package config parse scan.
- Vite dev server smoke in browser.

## Progress / Decisions

- Added the first static React/Vite implementation under `apps/desktop`.
- Added the first root-level TDD slice under
  `tdd-tests/apps/desktop/recording-dashboard/`.
- Added `tdd-tests/README.md` so future TDD slices keep a source-owner-shaped
  directory tree instead of flat files.
- The dashboard uses synthetic view-model data only.
- The dev server defaults to `http://127.0.0.1:5187/` with `--strictPort`.
- Port `5173` should not be used for Chronarium because it may belong to other
  local development work.
- Browser smoke on `5187` confirmed the main desktop viewport renders the
  three-column layout without detected text overflow.

## Current Non-Goals

- No Electron shell.
- No preload or IPC.
- No real adapter, downloader, credential, cookie, session, or live capture
  behavior.
- No live preview. Recording mode shows a disabled preview surface only.
