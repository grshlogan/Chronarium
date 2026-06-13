# Real Site Adapter Bring-Up

Status: ready to begin real-site adapter design and fixture-first bring-up; not
ready to run live capture.

This document is the handoff gate for starting a real site adapter in
Chronarium. It translates the current foundation into a practical checklist for
the next phase.

## What "Ready To Start" Means

Chronarium can now start real-site adapter work in this narrow sense:

- choose a target site and adapter id;
- create or extend a fixture-first adapter package;
- collect only approved, redacted, non-secret evidence;
- model the site's media topology, room state, chat/events, gaps, and failures
  as synthetic or redacted fixtures;
- prove those fixtures through shared adapter protocol, readiness, catalog,
  task gate, worker command, worker JSONL, and no-spawn supervisor tests.

Chronarium is not yet ready to run live recording jobs.

## Allowed Now

The following work is allowed now:

- write a site-specific live adapter design plan;
- add fixture-only parser/builders for a real site's observed topology;
- add synthetic or approved redacted playlist/room/event/error fixtures;
- add adapter manifest entries that remain `runtimeModes: ["fixture"]` unless a
  separate live plan is approved;
- use `fixture://<site>/...` references or redacted handles instead of raw URLs;
- use the existing worker command/message/supervisor harness with modeled
  fixture workers;
- add tests under `tdd-tests/packages/adapters/<site>/` or package-local tests.

## Still Prohibited

Do not do these without explicit user approval:

- connect to a real livestream site;
- poll a real room;
- download or save real media;
- add cookies, headers, tokens, bearer auth, signed URLs, account sessions, or
  private-room data;
- commit real captured media or private logs;
- execute a real adapter child process against a live site;
- execute FFmpeg/ffprobe on real captured media;
- add automatic upload or deletion behavior.

## Evidence Matrix

Current foundations that make adapter bring-up possible:

```text
Requirement                         Current evidence
----------------------------------  -----------------------------------------
Shared adapter protocol             packages/types/src/adapter.ts
Runtime protocol validation          packages/schemas/src/adapterSchemas.ts
Fixture readiness gate               packages/testkit/src/adapterReadiness.ts
Manifest/catalog registration        packages/core/src/adapters/adapterCatalog.ts
Task preflight gate                  packages/core/src/offlineFixtureCapturePipeline.ts
Fixture lifecycle host               packages/core/src/adapters/adapterLifecycle.ts
Worker command descriptor            packages/core/src/adapters/adapterWorkerCommand.ts
Worker stdout JSONL parser           packages/core/src/adapters/adapterMessageStream.ts
No-spawn worker supervisor harness   packages/core/src/adapters/adapterWorkerSupervisor.ts
Split A/V adapter example            packages/adapters/chaturbate
Combined A/V adapter example         packages/adapters/stripchat
Archive writer/reader/validator      packages/archive
SQLite index/cache                   packages/indexer
Safe external media command shape    packages/media-tools
```

Current validation evidence:

- worker command, worker JSONL, supervisor, adapter gate, readiness, catalog,
  Chaturbate fixture, Stripchat fixture, archive, indexer, and GUI shell tests
  pass in the workspace test suite;
- known warning: Node's `node:sqlite` API is experimental in the local runtime.

## First Safe Work Package

The first real-site adapter work package should be:

1. Create `docs/plan/plan_<site>_adapter_fixture_bringup.md`.
2. Define the site's adapter id, display name, fixture names, and evidence
   level.
3. Add or extend `packages/adapters/<site>` with fixture mode only.
4. Add a redacted or synthetic media topology fixture.
5. Add parser/builders that produce media tracks and timeline facts.
6. Add adapter protocol fixture runner tests.
7. Run `verifyAdapterFixtureReadiness`.
8. Register the manifest through `createAdapterCatalog`.
9. Run the no-spawn worker command/message/supervisor harness using modeled
   fixture output.
10. Write down what live evidence is still missing before any network access.

## Promotion To Live Mode

Do not add `live` to an adapter manifest until all of these are true:

- fixture mode covers media topology, room state, chat/events if applicable,
  reconnect/gap handling, and adapter errors;
- redaction rules are documented for the site;
- credential policy is documented, even if the first live version uses no
  credentials;
- live request boundaries are documented without storing raw headers/cookies;
- worker process supervision has fixture coverage;
- archive/index/maintenance behavior for failures has fixture coverage;
- the user explicitly approves live-site access for that adapter.

## Out Of Scope For This Gate

The gate does not prove:

- current Chaturbate or Stripchat protocol compatibility;
- that a real stream URL can be discovered;
- that media can be downloaded or remuxed;
- that processed outputs are playable;
- that upload/deletion policies are implemented;
- that GUI/Electron can control live recording.

It only proves the project can begin the adapter bring-up phase without
breaking the fixture-first and safety model.
