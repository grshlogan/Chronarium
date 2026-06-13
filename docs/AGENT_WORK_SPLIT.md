# Agent Work Split

Status: active coordination guide for parallel AI work on Chronarium. This is a
process document, not a product contract. It keeps Claude (A02) and Codex
(A01 / its own context) out of each other's way and assigns every
safety/contract decision a single owner.

## Dividing Principle

Claude owns "core"; Codex owns "non-core".

- Core (Claude): security boundaries (credentials, secrets, cookies, injection,
  crypto, import); irreversible / destructive operations (archive repair,
  migration, deletion); the *definition* of cross-module contracts (timeline /
  archive / adapter protocol, replay model, IPC / preload boundary shape, new
  schemas); the real-site / live crossing.
- Non-core (Codex): additive fixtures; *instances* of schemas whose shape Claude
  has already fixed; UI / renderer against a fixed DTO; report-only tooling;
  docs and test-tree hygiene; adapter scaffolding.

Rule of thumb: if it changes a contract many modules depend on, or touches
secrets / destructive ops / the live line — Claude. If it follows an existing
pattern in an isolated area — Codex.

## Lanes (own these paths; do not edit the other's lane without coordinating)

- Claude (A02): `packages/core` (incl. `credentials`, the capture pipeline,
  maintenance contracts), `packages/types`, `packages/schemas`,
  `packages/archive`, and any new cross-cutting contract or design doc.
- Codex: `packages/media-tools`, `apps/desktop`, `packages/adapters/*` (fixtures
  + scaffold; consume `@chronarium/adapter-kit` read-only), and the matching
  `tdd-tests/**` and `docs/plan/<codex plans>`.

Shared files (both may append; keep edits minimal and in your own dated
sections; do not rewrite the other's lines): `README.md`, `docs/AI_HANDOFF.md`,
`docs/AI_CHANGE_INDEX.md`, `docs/APP_CODE_MAP.md`.

## Current Assignment

- Claude: credential line (real backend / import / injection — deferred to live
  approval), archive recovery, replay / IPC contracts.
- Codex: media-tools ffprobe/ffmpeg output parser fixtures (first), then the
  adapter scaffold and Web dashboard behavior polish.

## Hard Boundaries (both)

Fixture-first. No real sites / rooms / media. No real cookies / headers / tokens
/ signed URLs / credentials. No real adapter child-process spawn. No FFmpeg /
ffprobe execution. No commit / push unless the user asks. TDD (RED → GREEN, one
behavior at a time; load the local TDD skill). Do not claim unrun checks.

## Context-Document Ownership

Claude maintains `docs/conversation-A02-foundation-docs-completion.md` only.
Codex maintains `docs/conversation-A01-documentation-and-initial-skeleton.md`
(or its own) only. The other agent's context document is read-only.

## Coordination Rules

1. Commit a clean baseline before and after each slice; keep commits small; never
   commit the other agent's in-progress work.
2. Stay in your lane. If a task needs the other's lane or a core boundary, stop
   and flag to the user rather than reaching across.
3. Each slice verifies: `pnpm typecheck`, `pnpm test`, `pnpm build`,
   `pnpm benchmark:timeline -- --events 1000 --batch-size 128`, `git diff
   --check`, trailing-whitespace scan.
4. Escalate to the user (and Claude) before anything touching secrets,
   destructive operations, a new cross-module contract, or the live-site line.
