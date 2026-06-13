# Conversation A02: Foundation Docs Completion

## Topic

A02 covers a documentation-completion pass: the user reviewed the project
state, agreed the early phase should prioritize documentation over more code,
and asked to fill the documentation gaps identified during the review.

## Current Status

Completed. This conversation added five documents and updated the doc
indexes:

- `docs/REPLAY_MODEL_V1.md` (new);
- `docs/GUI_CORE_PROTOCOL.md` (new);
- `docs/DIAGNOSTIC_CODES_V1.md` (new);
- `docs/MEDIA_TOOLS_BOUNDARY.md` (new);
- `docs/plan/plan_archive_recovery.md` (new design draft);
- `docs/plan/plan_foundation_docs_completion.md` (this work's plan);
- index updates in `README.md`, `docs/AI_HANDOFF.md`,
  `docs/AI_CHANGE_INDEX.md`, and `docs/APP_CODE_MAP.md`.

## Active Constraints

- Work only inside `D:\live\Chronarium`.
- Documentation only: no code, schema, test, or storage behavior changes.
- Do not connect to real livestream sites.
- Do not commit secrets, signed URLs, real media, private room details, or
  personal data.
- Keep docs honest about implemented versus planned behavior.
- Do not commit or push unless the user explicitly asks.

## Decisions So Far

- Early-phase priority is documentation completeness over new code.
- Replay semantics get a versioned contract document because replay is the
  primary consumer of `.chron` archives and constrains storage design.
- The GUI/core edge gets a protocol document mirroring
  `docs/ADAPTER_PROTOCOL.md`.
- Validation issue codes become a documented registry because they are stored
  in SQLite rows and must stay stable.
- Media tool rules are promoted out of `docs/CB_RECORDING_REFERENCES.md` into
  a standalone boundary contract.
- Archive recovery starts as a plan document, not code.

## Files Changed Or Expected To Change

- `docs/REPLAY_MODEL_V1.md`
- `docs/GUI_CORE_PROTOCOL.md`
- `docs/DIAGNOSTIC_CODES_V1.md`
- `docs/MEDIA_TOOLS_BOUNDARY.md`
- `docs/plan/plan_archive_recovery.md`
- `docs/plan/plan_foundation_docs_completion.md`
- `docs/conversation-A02-foundation-docs-completion.md`
- `README.md`
- `docs/AI_HANDOFF.md`
- `docs/AI_CHANGE_INDEX.md`
- `docs/APP_CODE_MAP.md`

## Verification

Run for this docs-only continuation:

- `git diff --check`: produced no output.
- Trailing whitespace scan: produced no output.
- JSON/package config parse scan: succeeded.
- New docs verified to use LF endings and end with a single newline.
- Regression guard on unchanged code: `pnpm typecheck` passed, `pnpm test`
  passed 5 Vitest files and 32 tests, `pnpm build` passed.

Drafts were also reviewed for factual accuracy against
`packages/archive/src/validator.ts`, `packages/archive/src/writer.ts`,
`packages/core`, and `packages/indexer`, plus cross-document consistency
against `docs/ARCHIVE_FORMAT_V1.md`, `docs/TIMELINE_SCHEMA_V1.md`,
`docs/ADAPTER_PROTOCOL.md`, and `docs/MAINTENANCE_OPS_DESIGN.md`. All
review findings were fixed before this handoff.

## Next Safe Step

After this documentation pass lands: add offline Chaturbate adapter fixtures
and tests (the only package violating the adapter fixture rule), or implement
archive recovery following `docs/plan/plan_archive_recovery.md`.

---

## Phase 2: Foundation Review Before Adapter Fixture-First Bring-Up

### Topic And Scope

Same A02 conversation, new phase. The user asked A02 to audit whether the
foundation is complete enough to begin real-site adapter design and
fixture-first bring-up (playlist parsing, room state, chat/events, gap/reconnect
handling, error handling) without connecting to any real site. This phase is a
review pass: audit and supplement the foundation only, do not contact real
sites, and modify only this A02 context document.

### Active Constraints (unchanged + reaffirmed)

- No real-site connection, no real-room polling, no real media download.
- No cookies/headers/tokens/signed URLs/credentials handling.
- No live adapter child-process execution and no FFmpeg/ffprobe execution.
- Review and supplement foundation only. The only file this phase may modify is
  this A02 context document. Do not edit A01's context document or core docs in
  this phase; record recommendations here instead.

### Audit Method

Read `AGENTS.md`, `README.md`, `docs/AI_HANDOFF.md`, `docs/APP_CODE_MAP.md`,
`docs/REAL_SITE_ADAPTER_BRINGUP.md`, `docs/ADAPTER_SITE_READINESS.md`,
`docs/ADAPTER_PROTOCOL.md`, `docs/TIMELINE_SCHEMA_V1.md`, then verified claims
against code: `packages/types/src/{timeline,adapter}.ts`,
`packages/schemas/src/{timelineSchemas,mediaSchemas,index}.ts`,
`packages/testkit/src/{adapterReadiness,index}.ts`,
`packages/adapters/stripchat/src/combinedFixture.ts`,
`packages/adapters/chaturbate/src/splitTrackFixture.ts`,
`packages/archive/src/segmentValidation.ts`,
`packages/core/src/maintenance/archiveInspector.ts`, plus a grep sweep for
emitted `room.*`/`chat.*`/`network.*` facts and per-family `parse*` functions.

### What Is Ready (does not block bring-up)

- Adapter worker boundary for the no-spawn fixture path: lifecycle host,
  catalog, task preflight gate, JSONL stdout parser, typed command descriptor,
  and no-spawn supervisor harness. Fixture-first bring-up is no-spawn, so this
  is sufficient; the real process launcher is correctly deferred.
- Readiness gate (`verifyAdapterFixtureReadiness`) enforces protocol parsing,
  ready/finished ordering, single ready, capability declaration, adapter/session
  matching, terminal finished, and secret/network/`contains-sensitive` scanning.
- Archive writer/reader/validator/recovery, SQLite indexer, media-tools command
  boundary, offline fixture capture pipeline, and the `tdd-tests/` owner-mirrored
  test tree are all in place.
- Envelope-level timeline schema, `MediaTrack` schema, and the `media.segment`
  fact schema exist with parse functions.

### Foundation Gaps Found (audit findings)

P0 — recommended before bring-up; all pure foundation, no site contact:

1. Per-family timeline payload schemas are missing. Only the envelope,
   `MediaTrack`, and `media.segment` fact have runtime Zod schemas
   (`packages/schemas/src/{timelineSchemas,mediaSchemas}.ts`). The fact families
   bring-up will emit — `media.track.topology_observed`,
   `media.track.discovered`, `media.gap.detected`, `room.state.changed`,
   `chat.message.observed`, `diagnostic.note`/`.duration_mismatch`/
   `.media_tool_output` — are validated only as a generic
   `payload: z.record(...)`. AGENTS.md section 7 requires every timeline event
   type to have a schema, example, and fixture test; that rule is currently
   unmet for these families. The maintenance inspector
   (`archiveInspector.ts`) already reads untyped payload keys (`level`, `code`,
   `message`, `evidenceLevel`) from gap/diagnostic facts, so the contract is
   implicit and unenforced today.

2. A concrete `media.segment` fact divergence already exists. Stripchat's
   `media.segment.observed` payload carries `playlistReference`/`syntheticOnly`
   and omits `redactionStatus`, but `mediaSegmentFactV1Schema` is `.strict()`
   and requires `redactionStatus`. It escapes validation only because
   `validateTimelineMediaSegments` skips segment facts without `relativePath`.
   The first path-bearing segment fact emitted by a real bring-up adapter would
   fail the strict schema. The canonical segment-fact shape should be pinned and
   reconciled before more adapters copy the current divergent shapes.

3. Per-adapter fixture-safety/parse helpers are duplicated, not shared. The
   security-relevant reference checks (`assertSyntheticFixtureReference`,
   `assertNoSensitiveFixtureStrings`) and the whole `expect*` parsing family are
   copy-pasted in both `chaturbate/src/splitTrackFixture.ts` and
   `stripchat/src/combinedFixture.ts`, and they already diverge (e.g. forbidden
   fragment lists differ). Every new site adapter will copy-paste again, drifting
   the safety net. These belong in one shared, tested module (testkit or a new
   `@chronarium/adapter-kit`) so the secret/URL/`fixture://` checks have a single
   source of truth.

P1 — strongly recommended foundation, still no site contact:

4. No room/chat fact coverage anywhere, yet capability is advertised. Both the
   Chaturbate and Stripchat manifests declare the `room.state` capability, but
   neither emits a single `room.*` fact, and no adapter emits `chat.*`. There is
   no fixture, schema, or test for these families. The readiness gate verifies
   that requested capabilities are declared but not that the stream actually
   exercises them, so a manifest can claim `room.state`/`chat.events` with zero
   matching facts and still pass. Bring-up explicitly includes room state and
   chat/event extraction; there is no reference pattern to copy. Add a synthetic
   room/chat fixture + schema + readiness coverage as a foundation slice.

5. No reconnect/network fact family modeled. `network.*` is reserved in
   `TIMELINE_SCHEMA_V1.md` but absent from code (no schema, no fixture). Gaps are
   modeled (`media.gap.detected`); disconnect/reconnect is not. Bring-up scope
   names "reconnect/gap handling," so a `network.disconnected`/
   `network.reconnected` (or `session.*` interruption) schema draft + synthetic
   fixture would give reconnect handling a fact contract.

6. Canonical fact-type vocabulary is not pinned. `TIMELINE_SCHEMA_V1.md` payload
   guidelines use headings `room.state` and `chat.message`, while code/readiness
   reference `room.state.changed` and `chat.message.observed`. Without a single
   pinned type-name registry, bring-up adapters will pick divergent type strings.
   (Fix belongs in core docs/schemas; flagged here, not applied this phase.)

P2 — non-blocking observations:

7. The adapter package shape is documented only in prose
   (`ADAPTER_SITE_READINESS.md`). An executable scaffold/template or a shared
   `adapter-kit` re-export would reduce drift but is optional.
8. `docs/APP_CODE_MAP.md` "Current root TDD slices" tree omits the
   `adapter-message-stream`, `adapter-worker-command`, and
   `adapter-worker-supervisor` slices in its second tree block. That file is not
   A02-owned; flag for the owning conversation rather than editing here.

### Decisions This Phase

- Treat per-family timeline payload schemas (finding 1) as the central
  pre-bring-up foundation item, because every bring-up fact family flows through
  the unvalidated `payload: z.record(...)` path and AGENTS.md section 7 already
  requires those schemas.
- Treat the shared adapter fixture-safety helper (finding 3) as a security
  boundary item, since the duplicated checks are the per-adapter line of defense
  against leaking real URLs/secrets into fixtures.
- Keep this phase review-only: record findings here; do not write schemas, code,
  or core-doc edits in this turn, and do not contact any real site.

### Files Changed This Phase

- `docs/conversation-A02-foundation-docs-completion.md` (this document only).

### Verification (Phase 2)

- Documentation-only review pass; no code, schema, or core-doc behavior changed.
- `git diff --check`: see final report.
- Trailing-whitespace scan on the edited document: see final report.

### Next Safe Step

If the user approves acting on this audit (all still fixture-first, no site
contact), the recommended order is: (1) add per-family timeline payload schemas
+ parse functions + fixture tests for the bring-up fact families and reconcile
the `media.segment` shape; (2) extract a shared adapter fixture-safety/parse
module; (3) add synthetic room/chat and network/reconnect fixtures + schemas as
reference patterns; each landed as its own plan under `docs/plan/`. If instead
the user wants to start a specific site, begin at
`docs/REAL_SITE_ADAPTER_BRINGUP.md` "First Safe Work Package" and carry these
gaps into that adapter's plan.

---

## Phase 3: Round 1 Implementation — Shared Adapter Kit

### Topic And Scope

Same A02 conversation. The user approved doing "Round 1" from the Phase 2 audit:
extract the duplicated, drifting fixture-safety and fixture-parsing helpers
(finding P0-3) into one shared, tested package and converge both existing
adapters onto it. Behavior-preserving refactor; no live-site contact.

### Status

Completed and verified.

### What Landed

- New package `@chronarium/adapter-kit` at `packages/adapters/kit`:
  - `src/fixtureSafety.ts`: `assertSyntheticFixtureReference`,
    `assertNoSensitiveFixtureStrings`;
  - `src/fixtureParse.ts`: `expectRecord`, `expectArray`, `expectOptionalArray`,
    `expectString`, `optionalStringProperty`, `expectJsonObject`,
    `expectJsonValue`, `expectNumber`, `expectOptionalNumber`,
    `expectNonNegativeInteger`, `expectPositiveInteger`;
  - `src/index.ts` re-exports both; depends only on `@chronarium/types`.
- `packages/adapters/chaturbate/src/splitTrackFixture.ts` and
  `packages/adapters/stripchat/src/combinedFixture.ts` import the kit and deleted
  their local helper copies. Site-specific `parse*`, `createSyntheticSource`,
  `createFixtureTimelineEvent`, `parseDiagnostic*`, and `assertSegmentsAreOrdered`
  stay local.
- Wiring: `tsconfig.base.json` paths, root `tsconfig.json` references,
  `vitest.config.ts` aliases, and each adapter's `package.json`/`tsconfig.json`.
- TDD test: `tdd-tests/packages/adapters/kit/adapterKitFixtureGuards.test.ts`.

### Key Decisions

- `assertSyntheticFixtureReference(reference, path, expectedPrefix)` takes the
  site prefix as an argument, reproducing each adapter's existing error messages
  exactly (the message embeds the prefix).
- The duplicated fact-builders (`createSyntheticSource`,
  `createFixtureTimelineEvent`) are intentionally NOT moved this round; they are
  reshaped when per-family timeline payload schemas land (Round 2, P0-1/P0-2),
  so moving them now would churn.

### TDD Record

- RED: `pnpm exec vitest run tdd-tests/packages/adapters/kit` failed with
  `Cannot find package '@chronarium/adapter-kit'` (module absent).
- GREEN: passed after creating the package and adding the vitest alias; grew to
  9 kit tests (synthetic-reference guard, sensitive-string scan, parse guards).
- REFACTOR: converged both adapters; the existing adapter suites stayed green as
  the behavior-preservation net.

### Verification

- `pnpm install`, `pnpm typecheck`, `pnpm build` passed.
- `pnpm test`: 27 files and 117 tests passed (was 26 files / 108 tests), with
  the known Node `node:sqlite` ExperimentalWarning.
- `pnpm benchmark:timeline -- --events 1000 --batch-size 128` passed.
- `git diff --check` clean after normalizing two EOF newlines; trailing
  whitespace scan clean.
- Confirmed no moved helper remains locally defined in either adapter.

### Files Changed This Phase

- `packages/adapters/kit/**` (new), the two adapter fixture sources,
  `packages/adapters/{chaturbate,stripchat}/{package.json,tsconfig.json}`,
  `tsconfig.base.json`, `tsconfig.json`, `vitest.config.ts`,
  `tdd-tests/packages/adapters/kit/adapterKitFixtureGuards.test.ts`,
  `docs/plan/plan_adapter_kit_shared_fixture_helpers.md`, `docs/APP_CODE_MAP.md`,
  `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`, `README.md`, and this
  document. The A01 conversation context document was not touched.

### Next Safe Step

Round 2: add per-family timeline payload schemas (`media.track.topology_observed`,
`media.track.discovered`, `media.gap.detected`, `room.state.changed`,
`chat.message.observed`, `diagnostic.*`) with parse functions and fixture tests,
and reconcile the `media.segment` fact shape (audit P0-1, P0-2). New adapter
fixtures should build through `@chronarium/adapter-kit`.

---

## Phase 4: Round 2 Implementation — Timeline Payload Schemas (media facts)

### Topic And Scope

Same A02 conversation. The user approved Round 2: add per-family timeline payload
schemas for the four media observation fact families, wire them into archive
validation, and reconcile the `media.segment` and `media.gap.detected`
divergences. Fixture-first; no live-site contact. `diagnostic.*` / `room.*` /
`chat.*` / `network.*` deferred to later rounds. Plan:
`docs/plan/plan_timeline_payload_schemas_round2.md`.

### Status

Completed and verified.

### User-Approved Decisions (and one implementation refinement)

- Unify `media.gap.detected` to one shape this round.
- Schemas are lenient (validate required + known fields; allow extra keys —
  Zod v4 `z.object` ignores unknown keys).
- Canonical gap is structured-first. **Refinement found while implementing:** the
  maintenance inspector, its test, and the docs already use the diagnostic-wrapped
  gap fields, so the canonical gap payload *requires the structured geometry at
  top level* and *allows the diagnostic annotations as optional extras*. This
  keeps Stripchat unchanged, keeps the inspector working, and only moves
  Chaturbate's gap out of its diagnostic-wrapped shape.

### What Landed

- `packages/schemas/src/timelinePayloadSchemas.ts`: lenient schemas +
  `parse*PayloadV1` for the four families, `TIMELINE_PAYLOAD_SCHEMAS_V1`
  registry, and `validateTimelineEventPayloadV1` (exact-type dispatch; unknown
  types pass through). Re-exported from the schemas index.
- `packages/types/src/timeline.ts`: four payload interfaces.
- `packages/archive`: `payloadValidation.ts` (`validateTimelinePayloads`) + new
  `payload.schema_invalid` code, called from `validateFileArchive` and
  `validateFileArchiveStreaming`. Reader/writer stay envelope-only.
- `packages/adapters/chaturbate/src/splitTrackFixture.ts`: `createGapPayload`
  emits the structured gap (lifts geometry from `evidence`, keeps annotations).
- Tests: new schema + payload-validation TDD slices; touch-ups to
  `diagnosticFixtures.test.ts`, `offlineFixtureCapturePipeline.test.ts` (added
  `kind`), and `maintenanceInspector.test.ts` (added gap geometry).

### Verification

- TDD RED→GREEN for the schema, validator, and gap-reshape slices.
- `pnpm typecheck`, `pnpm build` passed; `pnpm test` 29 files / 133 tests (was
  27 / 117); `pnpm benchmark:timeline` `issueCount: 0`.
- `git diff --check` + trailing-whitespace scan clean.

### Files Changed This Phase

The files above, plus docs: `docs/TIMELINE_SCHEMA_V1.md`,
`docs/DIAGNOSTIC_CODES_V1.md`, `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`,
`docs/AI_CHANGE_INDEX.md`, `README.md`,
`docs/plan/plan_timeline_payload_schemas_round2.md`, and this document. The A01
conversation context document was not touched.

### Next Safe Step

Round 3: payload schemas for `diagnostic.note` / `diagnostic.duration_mismatch` /
`diagnostic.media_tool_output`, then the room/chat and network/reconnect fact
families with synthetic fixtures (audit P1-4, P1-5), still fixture-first.

---

## Phase 5: Credentials And Sessions Design Draft

### Topic And Scope

Same A02 conversation. The user raised that ticket / private / spy shows require
authenticated sessions and asked for per-streamer selection of a cookie or
cookie combination. This phase is a documentation-only design draft; no
credential code, no real cookies, no live requests.

### Status

Completed (design draft).

### Decisions Captured

- Two-layer model: a `CredentialProfile` is one account's full cookie jar; a
  streamer binds one or more profiles with a selection policy.
- Selection default is capability-match (intent -> entitlement) then failover;
  missing credentials degrade to public-only or skip, never block monitoring.
- Cross-account cookie merging into a single request is rejected as a model.
- Raw cookies are runtime inputs only — never in fixtures, timeline, archive,
  index, docs, logs, argv, or Git; only a redacted `CredentialRef` crosses
  boundaries. The store is core-only and at-rest encrypted in the git-ignored
  runtime data dir.
- Integration reuses existing hooks: `manifest.security.requiresCredentials`,
  the catalog's `emitsSensitiveSourceFields` rejection, the readiness gate's
  secret scan, and the live-promotion gate.

### Files Changed This Phase

- `docs/CREDENTIALS_AND_SESSIONS.md` (new); index updates in `README.md`,
  `docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`, and
  this document. A01 context untouched.

### Verification

- Documentation-only pass. `git diff --check` + trailing-whitespace scan clean.

### Next Safe Step

When the user approves, build a fixture-only credential store + selector contract
with synthetic placeholder profiles (no real cookies, no live requests), gated
by `manifest.requiresCredentials`, proving per-streamer binding,
capability-match -> failover, and the missing-credential degrade path.

---

## Phase 6: Fixture-Only Credential Store And Selector

### Topic And Scope

Same A02 conversation. The user said proceed, so this phase implements the first
safe work package from `docs/CREDENTIALS_AND_SESSIONS.md`: an in-memory,
fixture-only credential store and a per-streamer selector. No real cookies, no
encryption, no injection, no live requests. Plan:
`docs/plan/plan_credential_store_selector_fixture.md`.

### Status

Completed and verified.

### What Landed

- `packages/types/src/credentials.ts`: `RecordingIntent`, `CredentialHealth`,
  `CredentialSelectionPolicy`, `CredentialEntitlement`, `CredentialProfile`,
  `StreamerCredentialBinding(Entry)`, `CredentialRef`,
  `CredentialSelectionResult`.
- `packages/core/src/credentials/`: `createCredentialStore` and
  `selectCredentialForCapture`, exported through `packages/core`.
- The store holds only metadata + an opaque `storageHandle`, rejects
  raw-secret-looking profile material, rejects duplicate ids, and rejects
  bindings referencing unknown profiles.
- The selector implements capability-match-failover (streamer-scope before
  site-scope, then priority, then entry order) plus the `priority` policy;
  `public` returns `not-required`; no binding or no eligible profile returns
  `missing`; unhealthy profiles are excluded (that is the failover mechanism).
  It returns only a redacted `CredentialRef`.

### Decisions

- Raw cookies never enter the model; the store is provably secret-free by
  scanning profile strings.
- Missing credentials degrade (caller's choice of public-only or skip); the
  selector never throws for a missing/unentitled case and monitoring is never
  blocked.
- Deferred: core task gate, reserved `session.credential_*` timeline schemas,
  encryption/storage/import/injection, real cookies, live path, and the
  `round-robin`/`manual` policies.

### Verification

- TDD RED→GREEN for the selector; 9 credential tests.
- `pnpm typecheck`, `pnpm build` passed; `pnpm test` 30 files / 142 tests (was
  29 / 133); `pnpm benchmark:timeline` `issueCount: 0`.
- `git diff --check` + trailing-whitespace scan clean.

### Files Changed This Phase

`packages/types/src/credentials.ts` (new), `packages/types/src/index.ts`,
`packages/core/src/credentials/**` (new), `packages/core/src/index.ts`,
`tdd-tests/packages/core/credentials/credentialSelector.test.ts` (new), and the
docs: `docs/plan/plan_credential_store_selector_fixture.md` (new),
`docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`,
`README.md`, and this document. A01 context untouched.

### Next Safe Step

Add a core task gate that refuses a gated capture when a streamer has no usable
bound profile for the requested intent, then the reserved `session.credential_*`
timeline fact schemas — still fixture-first, no real cookies.

---

## Phase 7: Credential Vault + Injection Model + Default Election

### Topic And Scope

Same A02 conversation. The user chose to advance the credential line to the live
edge (fixture-safe), and added a default-cookie rule. This phase models how a
resolved jar is held (`CredentialVault`) and handed to a worker
(`CredentialInjectionDescriptor`), adds default-cookie election to the selector,
and changes the gated no-credential path from refuse to no-cookie degrade. No
real cookies, no encryption backend, no spawn, no live requests. Plan:
`docs/plan/plan_credential_vault_injection_fixture.md`.

### Status

Completed and verified.

### User Clarification Incorporated

- The common recording case is `public` and needs no cookie; credentials are the
  exception for ticket/private/spy.
- Default cookie: a site with one cookie uses it; the first-added is the default;
  if the default is deleted, the oldest surviving cookie becomes default; if none
  remain, fall back to no-cookie/public recording. ("最近且最旧" read as oldest
  surviving.) This revised the earlier B1 gate from refuse to degrade.

### What Landed

- `packages/types/src/credentials.ts`: `CredentialJarEntry`,
  `ResolvedCredentialJar`, `CredentialInjectionDescriptor`, `addedAt` on
  `CredentialProfile`.
- `packages/core/src/credentials/credentialVault.ts`
  (`createInMemoryCredentialVault`) and `credentialInjection.ts`
  (`createCredentialInjectionDescriptor`), exported via `index.ts`.
- `credentialSelector.ts`: default ordering by `addedAt` (oldest = default).
- `offlineFixtureCapturePipeline.ts`: `resolveCaptureCredential`; gated capture
  with no usable profile degrades to public/no-cookie and proceeds, exposed as
  `result.credential`.

### Decisions

- Vault is backend-agnostic; in-memory synthetic backend only. Real encrypted
  backend deferred (OS keystore default + passphrase fallback recommended).
- Injection is a no-spawn one-time stdin handshake; jar runtime-only; only a
  redacted form is loggable.
- The pipeline records the credential outcome but does not inject (no vault/spawn
  wired) and does not emit `session.credential_*` timeline facts yet (deferred to
  the capture layer; schemas already exist).

### Verification

- TDD RED→GREEN for the vault/injection tracer (5 tests); selector election (3
  tests); adapterTaskGate "no usable credential" rewritten fail → degrade.
- `pnpm typecheck`, `pnpm build` passed; `pnpm test` 31 files / 174 tests (was
  30 / 166); `pnpm benchmark:timeline` `issueCount: 0`.
- `git diff --check` + trailing-whitespace scan clean.

### Files Changed This Phase

The files above, plus docs: `docs/CREDENTIALS_AND_SESSIONS.md`,
`docs/plan/plan_credential_vault_injection_fixture.md` (new),
`docs/APP_CODE_MAP.md`, `docs/AI_HANDOFF.md`, `docs/AI_CHANGE_INDEX.md`,
`README.md`, and this document. A01 context untouched.

### Next Safe Step

Deferred until the user approves a specific live adapter: real encrypted at-rest
backend, real cookie import, real child-process spawn + stdin injection, live
requests, GUI binding UI, and emitting `session.credential_*` facts during
capture.
