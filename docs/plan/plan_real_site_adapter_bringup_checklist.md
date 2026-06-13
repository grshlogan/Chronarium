# Plan: Real Site Adapter Bring-Up Checklist

## Objective

Document the exact point at which Chronarium can begin real-site adapter work
while preserving fixture-first development and the current safety boundaries.

This is documentation-only. It does not connect to a live site, start a worker,
handle credentials, download media, or execute FFmpeg.

## Scope

- Add a real-site adapter bring-up checklist.
- Separate "allowed now" from "still prohibited".
- Map current code evidence to the readiness requirements.
- Define the first safe real-site adapter work package.
- Link the checklist from README, code map, handoff, change index, and A01
  context.

## Constraints

- No real site access.
- No credentials, cookies, headers, tokens, signed URLs, or private room data.
- Do not claim live capture exists.
- Keep the checklist practical for future Codex/ClaudeCode handoff.

## Verification

Expected checks:

- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.

## Progress / Decisions

- Added `docs/REAL_SITE_ADAPTER_BRINGUP.md`.
- Defined "ready to start" as real-site adapter design and fixture-first
  bring-up, not live capture execution.
- Listed allowed work: fixture-only parser/builders, synthetic or approved
  redacted fixtures, manifest/catalog/readiness/worker harness tests.
- Listed prohibited work: real site access, real room polling, downloads,
  credentials/cookies/headers/tokens/signed URLs, real media, live adapter
  process execution, FFmpeg/ffprobe on real captured media, and upload/deletion
  automation.
- Added an evidence matrix mapping readiness requirements to current files.
- Defined the first safe real-site adapter work package and the promotion
  requirements before adding `live` to a manifest.
- Verification passed:
  - `git diff --check`
  - trailing whitespace scan
  - JSON/package config parse scan parsed 26 JSON files.

## Blockers

- None.
