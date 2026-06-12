# Plan: Archive Recovery

Status: draft plan only. No recovery code exists yet. The fixture-safe archive
writer, reader, and validator in `packages/archive` exist today; everything in
this document beyond the Current Facts section is planned design, not
implemented behavior.

## Objective

Define explicit, conservative recovery for interrupted `.chron` writes so that
a crash never silently corrupts a Replay Package and recovery never silently
loses facts.

A `.chron` package is the durable truth for one `LiveSession`. Interrupted
writes are inevitable: processes are killed, machines lose power, disks fill.
This plan specifies how Chronarium should detect an unfinalized or partially
written archive and how a future explicit recovery action should repair the
limited, safe subset of damage. No recovery code exists yet; this plan is
created before implementation per the plan discipline in
`docs/plan/README.md`.

## Scope

In scope:

- detection of unfinalized archives (a manifest written but never finalized);
- handling of a partial trailing JSONL line in `timeline.jsonl`;
- handling of orphan temporary files left by interrupted JSON replacement
  writes;
- recomputation of manifest timeline counts from the timeline fact stream;
- detection of track directories under `tracks/` that no manifest entry
  declares.

Out of scope:

- real media segment recovery (no media segments are written today; see
  `docs/MEDIA_TOOLS_BOUNDARY.md`);
- schema migrations (see the versioning rules in `docs/ARCHIVE_FORMAT_V1.md`);
- SQLite repair — the index is a rebuildable derived artifact by design, so
  index damage is handled by rebuild, not recovery;
- any automatic destructive cleanup.

## Current Facts

These facts describe `packages/archive/src/writer.ts`,
`packages/archive/src/validator.ts`, and `packages/archive/src/layout.ts` as
they exist today.

- `createFileArchiveWriter` uses create-new semantics for package roots: with
  `createIfMissing` it calls `mkdir` with `recursive: false`, which fails if
  the root already exists; otherwise it requires an existing directory.
- `writeJsonFile` writes `<path>.tmp` and then renames it over the target
  (`manifest.json` and `tracks/<track-id>/track.json` both use this path). A
  crash between the temporary write and the rename can orphan a `.tmp` file
  beside the target.
- `appendTimelineEvent` appends one JSON line per call to `timeline.jsonl`
  with flag `"a"`. A crash mid-write can leave a partial final line.
- There is no `fsync` anywhere in the writer and no in-progress marker of any
  kind.
- `finalize()` rewrites the manifest with `eventCount` and `lastSequence`
  taken from in-memory counters. A non-finalized archive therefore usually has
  a manifest without timeline counts, and the validator only checks
  `timeline.eventCount` and `timeline.lastSequence` when they are defined.
- `writeMediaTrack` writes `tracks/<track-id>/track.json` first and then
  rewrites the manifest with the new track inventory. A crash between the two
  writes leaves a track directory that no manifest entry declares. The current
  validator only iterates manifest-declared tracks, so such an orphan track
  directory is invisible to it today.
- `validateFileArchive` reports issues — including `timeline.invalid_jsonl`
  for partial or malformed timeline lines — but it never repairs, rewrites, or
  quarantines anything.

## Constraints

- Keep `.chron` files as the replay truth; `timeline.jsonl` facts must never
  be deleted or rewritten by recovery.
- Keep SQLite as a rebuildable derived index only; recovery never touches it.
- Keep all fixtures synthetic and local-only, with `synthetic` sensitivity
  labels; no real room data, sessions, or media references.
- Keep path handling archive-relative and bounded to the package root via
  `resolveArchivePath`.
- Recovery actions must respect the action safety levels in
  `docs/MAINTENANCE_OPS_DESIGN.md`.
- Schema or layout changes must be additive so existing fixtures and archives
  stay valid.

## Failure Scenarios

Recovery design must account for at least these interruption points:

- Crash mid-append: `appendTimelineEvent` is interrupted while writing, leaving
  a partial last line in `timeline.jsonl`. Detected today as
  `timeline.invalid_jsonl` when the truncated text is not valid JSON; a
  truncation that lands exactly on a line boundary is indistinguishable from
  a clean stop and is only caught by the crash-before-finalize analysis
  below.
- Crash before finalize: the writer never reaches `finalize()`, so the
  manifest has no `eventCount` or `lastSequence`. The archive's completeness
  is unknown — the timeline may be internally consistent yet still shorter
  than the session it records.
- Crash during `writeJsonFile`: the process dies between writing `<path>.tmp`
  and renaming it, leaving an orphan `.tmp` file (for example
  `manifest.json.tmp` or `tracks/<track-id>/track.json.tmp`).
- Crash between track metadata write and manifest rewrite: `writeMediaTrack`
  wrote `tracks/<track-id>/track.json` but died before the manifest rewrite,
  leaving an undeclared track directory. Undetected today.
- Stale abandoned writer: the process holding the in-memory writer state is
  killed, so the archive stays in a writing state indefinitely with no record
  that anyone intends to finish it.

A conceptual shape of a damaged synthetic package:

```text
session-synthetic-001.chron/
  manifest.json            <- no eventCount / lastSequence (never finalized)
  manifest.json.tmp        <- orphan from an interrupted rewrite
  timeline.jsonl           <- last line is truncated mid-object
  tracks/
    track-synthetic-001/   <- declared in manifest, intact
    track-synthetic-002/   <- NOT declared in manifest (crash before rewrite)
      track.json
      segments/
```

## Design Direction

Conservative principles for all recovery behavior:

- `timeline.jsonl` is the fact truth. Manifest timeline counts are derived
  values and are always recomputable from the timeline itself. This is the
  Fact versus Interpretation boundary applied to recovery: facts win.
- Recovery never deletes facts. No timeline line that parses is ever removed,
  and no track metadata is ever deleted.
- A partial trailing line may be quarantined to a clearly named sidecar file
  (for example `timeline.jsonl.partial`) only through an explicit recovery
  action, never silently at read time. Readers and the validator keep
  reporting the damage until a human-invoked action moves it.
- Orphan `.tmp` files are safe to remove because the rename target is the
  authoritative file: either the rename happened and the target is current, or
  it did not and the target is the previous valid version. The `.tmp` content
  is never the source of truth.
- Undeclared track directories are reported, not auto-adopted. Recovery must
  not invent manifest inventory entries from directory contents.
- Every recovery action is recorded as a diagnostic so the repair itself
  becomes an inspectable fact about the package.
- Recovery runs only on explicit invocation. Following the action safety
  levels in `docs/MAINTENANCE_OPS_DESIGN.md`: detection is Level 0 (report
  only). All three repair operations modify the source package itself —
  recomputing manifest counts is a manifest rewrite, which that document
  places at Level 2 — so repair requires explicit user confirmation and never
  qualifies for Level 1, which is restricted to rebuildable derived
  artifacts. Neither `chronarium-core` nor a future Adapter Worker may
  trigger repair automatically.

## Proposed Mechanisms

### In-progress versus finalized marker

Today an unfinalized archive is only detectable indirectly (manifest without
counts). A future explicit marker should make the writing state observable.
Two options, choice deliberately left open:

Option A — additive optional status field in `manifest.json`:

```json
{
  "writeStatus": "writing"
}
```

- Pro: lives inside the existing schema, validated with the manifest, one
  authoritative file.
- Pro: travels with the manifest if the package is copied.
- Con: a crash before the first manifest write leaves no marker at all.
- Con: absence of the field on older archives must mean "unknown", not
  "finalized", which weakens its signal.
- Con: requires an additive manifest schema change.

Option B — marker file in the package root (for example a reserved
`writing.marker`):

- Pro: can be created before the manifest exists, covering the earliest crash
  window.
- Pro: trivial presence check; removal at `finalize()` is a single unlink.
- Con: adds a reserved name to the layout in `docs/ARCHIVE_FORMAT_V1.md`.
- Con: marker removal is not atomic with the final manifest rewrite, so a
  crash between the two still needs a defined interpretation.
- Con: easy to lose or leak when packages are copied with naive tooling.

The decision is a blocker for implementation (see Blockers). Either choice
must be additive and must define what absence means for archives written
before the marker existed.

### Recovery scan

A future recovery scan should reuse `validateFileArchive` and add new
detections on top of its report:

- orphan `.tmp` files beside known JSON targets within the package root;
- track directories under `tracks/` that no manifest entry declares.

The scan itself is Level 0: it only reads and reports.

### Recovery diagnostic codes

New reserved `recovery.*` diagnostic codes should be registered in
`docs/DIAGNOSTIC_CODES_V1.md`, for example codes for an unfinalized archive,
an orphan temporary file, an undeclared track directory, a quarantined partial
trailing line, and recomputed manifest counts. Exact code names belong to that
registry, not this plan.

### Repair operations

Repair is limited to exactly three operations, each recorded as a diagnostic:

- recompute `eventCount` and `lastSequence` in the manifest from the valid
  lines of `timeline.jsonl`;
- remove orphan `.tmp` files;
- quarantine a partial trailing timeline line to a sidecar file such as
  `timeline.jsonl.partial`.

Nothing else. In particular no timeline rewriting, no track adoption, no
directory deletion, and no media handling.

## Execution Plan

Future implementation order:

1. Extend the validator with report-only detection of orphan `.tmp` files and
   undeclared track directories.
2. Decide and add the writing/finalized marker (manifest field or marker
   file); keep the schema or layout change additive.
3. Implement an explicit `recoverArchive` entry point with bounded options for
   the three repair operations.
4. Add corrupted-fixture builders to `packages/testkit` (truncated trailing
   line, orphan `.tmp`, undeclared track directory, missing finalize).
5. Add behavior tests covering each failure scenario in this plan.
6. Update docs: the Write Safety section of `docs/ARCHIVE_FORMAT_V1.md` and
   the registry in `docs/DIAGNOSTIC_CODES_V1.md`.

## Verification

Expected commands:

```powershell
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Also run trailing whitespace and JSON/package config parse scans.

Tests must simulate truncated trailing lines, orphan `.tmp` files, and missing
finalize using synthetic fixtures only — never real archives or real media.

## Progress / Decisions

- Plan created during conversation A02.
- Implementation not started; no recovery code exists.
- Marker mechanism (Option A versus Option B) intentionally undecided.

## Blockers

- The marker mechanism decision (manifest `writeStatus` field versus a package
  root marker file) should be settled before coding step 2 and later steps.
