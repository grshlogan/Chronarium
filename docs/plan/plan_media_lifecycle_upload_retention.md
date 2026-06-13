# Plan: Media Lifecycle, Upload, And Retention

## Objective

Record the updated product requirements for real recording output handling:
raw capture facts, post-session processing, compressed playable outputs,
upload preparation, verification, and safe deletion gates.

This is documentation-only. It does not implement capture, transcoding, upload,
hashing, FFmpeg execution, or cleanup automation.

## Scope

- Summarize the supported media lifecycle from raw segment capture to optional
  verified upload and optional local media deletion.
- Clarify that durable local truth can be the fact archive while media
  retention remains configurable product policy.
- Clarify that the project owner's local deployment policy is more aggressive
  about deleting raw media and uploaded processed outputs than a public release
  should be by default.
- Clarify raw hash versus processed-output hash responsibilities.
- Clarify that processed recording outputs should be editable compositions:
  merging interrupted/restarted sessions and excluding unusable fragments must
  be possible without rewriting raw facts.
- Clarify CB-like split audio/video handling versus SC-like combined A/V
  handling.
- Link the design from product, architecture, archive, media-tool, security,
  code-map, handoff, change-index, and A01 context docs.

## Current Facts

- Chronarium currently writes synthetic media segment bytes only.
- Archive validation checks referenced segment file path safety, file
  existence, and declared byte length.
- No real capture, downloader integration, FFmpeg/ffprobe execution,
  transcoding, playable-output validation, upload queue, upload verification,
  or media deletion automation exists.
- The product direction is local-first facts with media as policy-controlled
  evidence or derived outputs.

## Constraints

- Do not connect to real livestream sites.
- Do not add real Chaturbate download logic.
- Do not handle cookies, headers, tokens, signed URLs, sessions, or credentials.
- Do not commit real media or private recording data.
- Destructive cleanup remains future behavior and must be gated by explicit
  policy, bounded paths, and verification facts. It must not be mandatory
  public-release behavior.

## Execution Plan

1. Add a media lifecycle design document.
2. Update product and architecture docs with the durable-facts/transient-media
   model.
3. Update archive, media-tools, and security docs with deletion and hash gates.
4. Update handoff, code map, change index, and A01 context.
5. Run docs-safe verification.

## Verification

Docs-only checks:

- `git diff --check`
- trailing whitespace scan
- JSON/package config parse scan

Code tests are not required for this documentation-only pass.

Result:

- `git diff --check`: passed.
- trailing whitespace scan: passed.
- JSON/package config parse scan: parsed 24 JSON files.

## Progress / Decisions

- Added `docs/MEDIA_LIFECYCLE_AND_RETENTION.md`.
- Updated product, architecture, archive, timeline, replay, media-tool,
  security, CB reference, code-map, handoff, change-index, and A01 context
  docs.
- Clarified that the project owner's local policy can delete raw media after
  verified processing and delete local processed outputs after verified upload,
  but public releases should expose this only as an optional configurable
  policy.
- Added the editability principle: future processed outputs may merge source
  sessions, exclude tiny or unusable fragments, and record source-to-output
  mappings as derived facts.
- No code, capture, transcoding, upload, hashing, or cleanup automation was
  added.

## Blockers

- None.
