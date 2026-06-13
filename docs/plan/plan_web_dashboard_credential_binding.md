# Web Dashboard Credential Binding Plan

Date: 2026-06-14

## Goal

Polish the browser-safe desktop recording dashboard with clearer monitoring
feedback, add-streamer link validation, and a synthetic per-streamer credential
binding panel that mirrors the credential model without touching core,
packages, IPC, or real cookies.

## Scope

- `apps/desktop/**`
- `tdd-tests/apps/desktop/**`
- A01 conversation context and shared docs appended with this lane's notes

## Out Of Scope

- No real sites, rooms, media, cookies, headers, tokens, signed URLs, or
  credentials.
- No imports from `packages/types`, `packages/core`, or any credential
  implementation package.
- No IPC, Electron preload, core binding, or child-process work.
- No changes to `packages/**`, root `tsconfig*.json`, `vitest.config.ts`, or
  Claude's `packages/player` lane.

## TDD Plan

1. RED: link submission rejects unsupported or malformed streamer links with a
   clear form error. GREEN: add local reducer state and validation.
2. RED: valid synthetic streamer links add/select a maintained streamer without
   contacting any site. GREEN: create browser-local synthetic streamer/context.
3. RED: pause/resume/check actions leave clear feedback in state and UI.
   GREEN: add monitoring feedback derived from reducer actions.
4. RED: credential binding view elects the oldest healthy bound profile as the
   default cookie and re-elects the next oldest after removal. GREEN: add local
   mock credential profile/binding state.
5. RED: gated intents with no usable bound profile show a no-cookie/public
   degrade message while public intent says no cookie is required. GREEN: add
   intent reducer actions and dashboard panel rendering.

## Verification

- Targeted desktop TDD tests.
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- trailing whitespace scan

## TDD Notes

- RED:
  `pnpm exec vitest run tdd-tests/apps/desktop/recording-dashboard/desktopRecordingDashboard.test.tsx`
  failed because `addStreamerForm` did not exist on the dashboard state.
- GREEN: added browser-local streamer-link form state, supported synthetic URL
  validation, and safe form feedback.
- RED: supported synthetic links did not add or select a streamer. GREEN:
  reducer now adds a synthetic streamer/context and selects it.
- RED: monitoring actions did not expose a clear feedback object. GREEN:
  pause/resume/check-now actions now update `monitoringFeedback`, and the UI
  renders the latest action.
- RED: credential bindings did not exist. GREEN: added package-local mock
  credential profiles and per-streamer binding state, with oldest usable bound
  profile elected as the default Cookie.
- RED: a profile bound to a gated intent it did not support was still treated
  as usable. GREEN: default election now requires health `ok` and entitlement
  for the selected non-public recording intent.
- Public intent shows that no Cookie is required. Gated intents with no usable
  bound profile show a no-cookie/public degrade message.
- Targeted desktop recording-dashboard tests passed 15 tests.
- `pnpm typecheck` passed after the desktop implementation.
- `pnpm test` passed 34 files and 191 tests, with the known Node
  `node:sqlite` ExperimentalWarning.
- `pnpm build` passed.
- Browser smoke on `http://127.0.0.1:5187/` confirmed the add-link form,
  monitoring feedback, credential panel, and Default Cookie label render.
