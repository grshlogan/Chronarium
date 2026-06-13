# Plan: Timeline Payload Schemas (media families) — A02 Round 2

## Objective

Add runtime per-family payload schemas for the four media timeline fact families
that the fixture adapters emit, wire them into archive validation, and reconcile
the two payload divergences the foundation audit found. Stay fixture-first: no
live-site access, no real media, no credentials.

Closes audit findings P0-1 (no per-family payload schemas; AGENTS.md §7 unmet)
and P0-2 (`media.segment.observed` and `media.gap.detected` divergences) for the
media families. `diagnostic.*`, `room.*`, `chat.*`, `network.*` are later rounds.

## User-approved decisions

- Unify `media.gap.detected` to one shape this round.
- Schemas are lenient: validate required + known fields; unknown keys are allowed
  (Zod v4 `z.object` strips unknown keys without error — used for pass/fail
  validation, so the event keeps its real payload).
- Canonical gap shape is structured-first.

## Refinement found during implementation

The maintenance inspector (`archiveInspector.ts`), `maintenanceInspector.test.ts`,
and `docs/TIMELINE_SCHEMA_V1.md` all already use the diagnostic-wrapped gap
fields (`level/code/message/evidenceLevel`). A bare structured gap would ripple
into all of them. So the canonical `media.gap.detected` payload **requires the
structured geometry at top level** and **allows the diagnostic annotations as
optional extras**:

- Required: `trackId`, `previousSegmentId`, `nextSegmentId`, `gapStartMs`,
  `gapEndMs`, `durationMs`.
- Optional / passthrough: `level`, `code`, `evidenceLevel`, `message`,
  `affectedTrackIds`, `syntheticOnly`, source-sequence hints, etc.

Result: Stripchat already conforms (no change); Chaturbate lifts its gap geometry
from `evidence` to top level while keeping its annotations; the inspector and its
assertions keep working.

## Per-family required fields (lenient `z.object`, unknown keys allowed)

- `media.track.topology_observed`: required `protocol` (string), `trackIds`
  (string[]). Known-optional: `fixtureName`, `playlistReference`,
  `combinedAudioVideo`, `syntheticOnly`.
- `media.track.discovered`: required `trackId` (string), `kind`
  (`mediaTrackKindSchema`). Known-optional: `playlistReference`, `sourceIdHash`,
  `containsAudio`, `label`, `codec`, `container`, `timeBase`, `syntheticOnly`.
- `media.segment.observed`: required `trackId`, `segmentId`. Known-optional:
  `sourceSequence` (nonneg int), `mediaStartMs` (nonneg), `durationMs` (nonneg),
  `playlistReference`, `syntheticOnly`. This is the *observation* fact, distinct
  from the stored, `relativePath`-bearing segment fact validated by
  `mediaSegmentFactV1Schema` in `segmentValidation.ts` (unchanged).
- `media.gap.detected`: required structured geometry above; annotations optional.

## Implementation (TDD vertical slices)

1. `packages/schemas/src/timelinePayloadSchemas.ts` (new): one lenient `z.object`
   per family + `parse*PayloadV1`; a `TIMELINE_PAYLOAD_SCHEMAS` registry keyed by
   the exact type string (pins the canonical type names); and
   `validateTimelineEventPayloadV1(event): { message } | undefined` (undefined =
   no schema for that type, or valid). Reuse `mediaTrackKindSchema` and numeric
   guards. Re-export from `packages/schemas/src/index.ts`.
2. `packages/types/src/timeline.ts`: add the four payload interfaces.
3. `packages/archive`: add `validateTimelinePayloads({ timelineEvents })`
   (mirrors `validateTimelineMediaSegments`) emitting `payload.schema_invalid`
   (new `ArchiveValidationIssueCode`). Call it from `validateFileArchive`
   (`validator.ts`) and `scanTimeline` (`streamingValidator.ts`) so both paths
   validate payloads. The reader and writer stay envelope-only.
4. `packages/adapters/chaturbate/src/splitTrackFixture.ts`: branch the
   diagnostics loop so a `media.gap.detected` entry emits the structured-geometry
   payload (lift `trackId/previousSegmentId/nextSegmentId/gapStartMs` from
   `evidence`, `durationMs` from `gapDurationMs`, derive
   `gapEndMs = gapStartMs + durationMs`, keep `level/code/evidenceLevel/message/
   affectedTrackIds/syntheticOnly` + source-sequence hints). `duration_mismatch`
   / `media_tool_output` stay diagnostic-shaped.

## Dependent test/code touch-ups (kept green)

- `packages/core/tests/offlineFixtureCapturePipeline.test.ts`: add `kind:
  "video"` to its `media.track.discovered` payload (it currently omits the now-
  required `kind`).
- `packages/core/tests/maintenanceInspector.test.ts`: add the required structured
  geometry to its synthetic `media.gap.detected` payload (keeps annotations, so
  the 3-finding assertion is unchanged).
- `packages/adapters/chaturbate/tests/diagnosticFixtures.test.ts`: existing gap
  assertions still pass (gap keeps `code`); add one assertion for the new
  structured fields (drives the reshape slice).
- Stripchat / split-track / reader / indexer suites stay green unchanged.
- Maintenance inspector code: no change (still reads top-level `code/level`).

## New tests
- `tdd-tests/packages/schemas/timeline-payloads/*.test.ts`: per family — valid
  parses; missing a required field fails; wrong type fails; extra key allowed.
- `tdd-tests/packages/archive/payload-validation/*.test.ts`: a known-type fact
  missing a required field yields `payload.schema_invalid`; both adapters' good
  fixtures yield zero payload issues.

## Verification
- TDD RED captured for the first schema slice and the validator slice.
- `pnpm typecheck`, `pnpm test` (suite grows past 117), `pnpm build`,
  `pnpm benchmark:timeline -- --events 1000 --batch-size 128`.
- `git diff --check` + trailing-whitespace scan clean.

## Docs to update
`docs/TIMELINE_SCHEMA_V1.md` (mark the four families schema-backed; gap canonical
shape; segment observation-vs-stored note), `docs/DIAGNOSTIC_CODES_V1.md`
(`payload.schema_invalid`), `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`,
`docs/AI_CHANGE_INDEX.md`, `README.md`,
`docs/conversation-A02-foundation-docs-completion.md` (Phase 4). A01 context
untouched.

## Progress / Decisions

- Added `packages/schemas/src/timelinePayloadSchemas.ts` with lenient
  (`z.object`, unknown keys allowed) schemas + `parse*PayloadV1` for the four
  media families, the `TIMELINE_PAYLOAD_SCHEMAS_V1` registry, and
  `validateTimelineEventPayloadV1` (exact-type dispatch; unknown types pass
  through). Re-exported from `packages/schemas/src/index.ts`.
- Added the four payload interfaces to `packages/types/src/timeline.ts`.
- Added `packages/archive/src/payloadValidation.ts`
  (`validateTimelinePayloads`) and the `payload.schema_invalid`
  `ArchiveValidationIssueCode`; called it from `validateFileArchive`
  (`validator.ts`) and `scanTimeline` (`streamingValidator.ts`). The reader and
  writer stay envelope-only.
- Canonical `media.gap.detected` = structured geometry required + diagnostic
  annotations optional. Reshaped Chaturbate's gap emission in
  `splitTrackFixture.ts` (`createGapPayload`) to lift the geometry to top level
  while keeping `level/code/message/evidenceLevel/affectedTrackIds`; Stripchat
  already conformed and was unchanged.
- Test touch-ups kept green: `offlineFixtureCapturePipeline.test.ts` gained
  `kind: "video"`; `maintenanceInspector.test.ts` gained the structured gap
  geometry; `diagnosticFixtures.test.ts` gained a structured-gap assertion (its
  existing `code`-based assertions still pass).
- TDD: schema tracer RED (`parseMediaTrackDiscoveredPayloadV1` absent) → GREEN;
  validator integration RED (no `payload.schema_invalid`) → GREEN; Chaturbate
  diagnostic-archive RED (diagnostic-wrapped gap rejected) → GREEN after the
  reshape.
- Verification: `pnpm typecheck`, `pnpm build` passed; `pnpm test` passed 29
  files / 133 tests (was 27 / 117); `pnpm benchmark:timeline` `issueCount: 0`;
  `git diff --check` + trailing-whitespace scan clean.

## Blockers

- None.
