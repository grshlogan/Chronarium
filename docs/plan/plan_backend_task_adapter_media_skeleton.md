# Backend Task Adapter Media Skeleton Plan

## Objective

Build the next backend skeleton layer before GUI work:

- task scheduler foundation;
- adapter lifecycle foundation;
- media tooling typed command builder foundation.

This should make the backend closer to a recorder backend while staying fully
offline and fixture-first.

## Scope

In scope:

- core task scheduler types and in-memory lifecycle;
- fixture-only adapter lifecycle host that consumes adapter protocol messages;
- media-tools package with typed FFmpeg/ffprobe command builders;
- unit tests for all three foundations;
- docs and A01 context updates.

Out of scope:

- real livestream capture;
- real Chaturbate network access;
- cookies, headers, sessions, signed URLs, or account handling;
- spawning production recorder software;
- running FFmpeg/ffprobe in tests;
- Electron/React GUI;
- archive writes from tasks.

## Current Facts

- `packages/core` has runtime lifecycle, archive/index service, maintenance
  inspector, recovery inspector access, and GUI-facing facade.
- `packages/adapters/chaturbate` has synthetic fixture message generation.
- `docs/MEDIA_TOOLS_BOUNDARY.md` defines typed command builder rules but no
  package exists yet.
- Core does not yet have task scheduling or adapter lifecycle ownership.

## Execution Plan

1. Add task scheduler types and an in-memory scheduler to `packages/core`.
2. Add adapter lifecycle host types and a fixture-only host to `packages/core`.
3. Add `packages/media-tools` workspace package with typed command builders.
4. Add focused tests for task state transitions, fixture adapter lifecycle, and
   command argv/redaction behavior.
5. Update docs, A01 context, and workspace maps.

## Verification

- `pnpm exec vitest run packages/core/tests`
- `pnpm exec vitest run packages/media-tools/tests`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `git diff --check`
- trailing whitespace scan
- JSON/package config parse scan

## Progress / Decisions

- This is A01 Codex work.
- The adapter lifecycle skeleton is fixture-only.
- Media command builders return argv descriptions only; tests never execute
  real binaries.
