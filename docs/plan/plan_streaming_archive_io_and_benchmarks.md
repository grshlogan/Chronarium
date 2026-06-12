# Streaming Archive IO And Benchmarks Plan

## Goal

Prevent early archive APIs from locking GUI, indexer, replay, and maintenance
onto whole-file timeline reads.

This plan is language-independent. It is a prerequisite for any future
performance decision, including whether a Rust worker is justified.

## Current Risk

`validateFileArchive` currently reads the entire `timeline.jsonl` file into
memory, splits it into lines, parses all valid events, and returns a full
`timelineEvents` array.

`readFileArchive` then exposes that full array as part of `ArchiveSnapshot`.

That shape is convenient for small synthetic fixtures, but risky as a public
contract. If GUI, indexer, replay, or maintenance code hard-depends on complete
in-memory event arrays, large archives will force a broad refactor later.

## Planned Work

### 1. Add Streaming Or Batched Archive Timeline Entry Points

Add new public archive package entry points before more consumers are built on
top of full snapshots.

The exact implementation may still use the current whole-file reader at first,
but the public contract should be stream/batch-shaped from the start.

Candidate API directions:

```ts
iterateTimelineEvents(options): AsyncIterable<TimelineEventEnvelope>
iterateTimelineRecords(options): AsyncIterable<TimelineRecord>
readTimelineBatch(options): Promise<TimelineBatch>
validateFileArchiveStreaming(options): Promise<ArchiveValidationSummary>
```

Implementation rules:

- Keep `readFileArchive` and `validateFileArchive` for small fixtures and simple
  tests.
- New GUI, indexer, replay, and maintenance flows should prefer streaming or
  bounded batch APIs.
- Validation should be able to emit issues without keeping every parsed event in
  memory.
- Sequence, duplicate event ID, session mismatch, and manifest count/last
  sequence checks must remain possible under streaming constraints.
- If an invariant requires bounded state, document the state cost.
- Do not introduce Rust as part of this step. The purpose is to create a
  language-neutral contract boundary.

### 2. Add Large Synthetic Timeline Testkit Builders

Add testkit helpers that generate large deterministic synthetic timelines.

Target sizes:

- 100,000 timeline events for regular stress tests or local benchmark smoke.
- 1,000,000 timeline events for explicit benchmark runs only.

Builder requirements:

- Deterministic IDs, sequence numbers, timestamps, and payloads.
- Configurable event families and payload size.
- No real room names, users, URLs, tokens, headers, signed URLs, cookies, or
  media.
- Able to write JSONL to a `.chron` fixture without constructing one giant
  in-memory event array when testing streaming behavior.

### 3. Add A Simple Benchmark Script

Add a small benchmark script that measures archive timeline operations against
large synthetic archives.

The benchmark should report:

- archive size;
- event count;
- wall time;
- peak or approximate memory use where available;
- operation tested, such as full validation, streaming validation, indexing, or
  replay scan.

The benchmark is not a CI pass/fail gate at first. It is local evidence for
future performance decisions.

## Rust Decision Boundary

Rust is not selected by this plan.

Rust may be considered later only if benchmarks show a real bottleneck in a
bounded subsystem and a TypeScript implementation is no longer adequate.

Candidate future Rust areas remain:

- archive verifier;
- timeline scanner;
- hash/integrity scanner;
- repair or compaction worker;
- media segment integrity worker.

Any Rust module must sit behind a stable TypeScript-facing contract and must not
become a parallel source of truth for archive semantics.

## Out Of Scope

- No immediate implementation in this plan.
- No GUI work.
- No replay player changes.
- No Chaturbate live capture.
- No media segment writer/prober.
- No Rust toolchain requirement.
- No benchmark numbers claimed before scripts exist and are run.

## Verification For Future Implementation

Expected TDD order:

1. RED: a large synthetic archive can be scanned through a bounded streaming or
   batched public API without requiring callers to receive a full array.
2. GREEN: add the smallest public archive iterator/batch API.
3. RED: indexer can consume the streaming/batched API.
4. GREEN: move indexer off full `timelineEvents` array dependency.
5. RED: testkit can generate a 100,000 event synthetic archive deterministically.
6. GREEN: add large timeline builder and small benchmark script.

Validation should include:

- targeted archive tests;
- targeted indexer tests once moved;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm build`;
- `git diff --check`;
- trailing whitespace scan;
- JSON/package config parse scan.
