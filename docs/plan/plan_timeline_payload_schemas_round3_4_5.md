# Timeline Payload Schemas Round 3-5 Plan

Date: 2026-06-13

## Goal

Finish the remaining adapter-readiness foundation rounds before real site
adapter bring-up:

- Round 3: diagnostic timeline payload schemas.
- Round 4: room/chat timeline payload schemas, synthetic fixture coverage, and
  adapter readiness checks that declared room/chat capabilities are actually
  exercised.
- Round 5: network reconnect timeline payload schemas and synthetic
  disconnect/reconnect fixture coverage.

## Scope

- Add lenient per-event payload schemas to
  `packages/schemas/src/timelinePayloadSchemas.ts`.
- Keep schemas in `TIMELINE_PAYLOAD_SCHEMAS_V1` so archive snapshot and
  streaming validation pick them up through existing payload validation.
- Add fixture-first behavior under existing adapter/testkit boundaries.
- Update only A01 conversation context for this conversation.

## Out Of Scope

- No live site access.
- No real room polling.
- No real media download.
- No cookies, headers, bearer tokens, signed URLs, account sessions, or private
  room data.
- No encrypted credential storage or live credential injection.
- No B-line credential task gate in this round.
- No edits to A02 context.

## TDD Plan

Use vertical RED -> GREEN slices:

1. RED: schema tests fail for missing diagnostic payload exports/registry.
   GREEN: add diagnostic payload schemas and registry entries.
2. RED: readiness fails to require declared room/chat capabilities to emit
   matching facts. GREEN: add fact-family usage tracking.
3. RED: adapter fixture tests fail until a synthetic room/chat fixture emits
   canonical `room.state.changed` and `chat.message.observed` facts. GREEN:
   add fixture shape/parser/events through `@chronarium/adapter-kit`.
4. RED: network payload tests fail until `network.disconnected` and
   `network.reconnected` are registered. GREEN: add schemas and fixture facts.

## Verification

- Targeted Vitest slices during RED/GREEN.
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128`
- `git diff --check`
- trailing whitespace scan

## TDD Notes

- Round 3 RED:
  `pnpm exec vitest run tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  failed because diagnostic payload parse functions did not exist and the
  dispatcher did not validate diagnostic types.
- Round 3 GREEN: added diagnostic payload schemas and registry entries for
  `diagnostic.note`, `diagnostic.duration_mismatch`, and
  `diagnostic.media_tool_output`; targeted schema test passed.
- Round 3 regression: Chaturbate diagnostic fixture archive validation and core
  maintenance inspector tests passed with no `payload.schema_invalid` issues.
- Round 4 RED: readiness tests failed because `verifyAdapterFixtureReadiness`
  allowed streams that declared `room.state` / `chat.events` without emitting
  matching facts.
- Round 4 GREEN: readiness now requires `room.state.changed` and
  `chat.message.observed` facts for those capabilities; Stripchat fixture now
  emits synthetic room/chat facts and passes the gate. Chaturbate stopped
  declaring `room.state` until it has a room fixture.
- Round 5 RED:
  `pnpm exec vitest run tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  failed because network reconnect payload parse functions did not exist.
- Round 5 GREEN: added schemas and registry entries for `network.disconnected`
  and `network.reconnected`; Stripchat fixture now emits synthetic
  disconnect/reconnect facts before a modeled media gap.
- Targeted Round 3/4/5 slice:
  `pnpm exec vitest run tdd-tests/packages/adapters/stripchat/stripchatCombinedFixture.test.ts tdd-tests/packages/core/adapter-gate/adapterTaskGate.test.ts tdd-tests/packages/testkit/adapter-readiness/adapterReadiness.test.ts tdd-tests/packages/schemas/timeline-payloads/timelinePayloadSchemas.test.ts`
  passed 4 files and 38 tests.
- Early `pnpm typecheck` passed after the implementation slices.
- Final `pnpm test` passed 30 files and 158 tests after syncing the adapter
  catalog expectation with the Chaturbate manifest.
- Final `pnpm typecheck` passed.
- Final `pnpm build` passed.
- Final `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed with
  `scannedEvents: 1000`, `batchCount: 8`, and `issueCount: 0`.
- Final `git diff --check` passed.
- Final trailing whitespace scan found no matches.
- Final JSON/package parse scan parsed 29 JSON files.
