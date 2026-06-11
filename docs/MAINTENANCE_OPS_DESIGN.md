# Maintenance Ops Design

Status: design draft. No maintenance runtime, AI agent, scheduler, GUI, or
automatic repair implementation exists yet.

## Purpose

Chronarium should eventually include a local maintenance operator: a background
system that inspects archives, indexes, media metadata, runtime state, and
diagnostics, then explains what is healthy, what is broken, and what can be
safely repaired.

This is not a chat feature. It is an operations layer for a local-first
desktop archive system.

The first version must be deterministic. AI reasoning can be added later on top
of evidence produced by normal code.

## Plain Model

```text
Inspect facts
  -> classify findings
  -> create a health report
  -> suggest safe actions
  -> run only allowed actions
  -> verify the result
  -> keep an audit trail
```

## External Projects To Learn From

These projects are references for product and architecture ideas. They are not
dependencies and should not be copied wholesale.

### Uptime Kuma

Project: [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma)

What to learn:

- a clear status model for checks;
- user-friendly health dashboards;
- simple per-check configuration;
- visible history for failures and recovery.

Chronarium adaptation:

- show archive/session health as green, warning, failed, or unknown;
- keep each inspection result easy to read;
- avoid turning checks into generic web uptime probes.

### Healthchecks

Project: [healthchecks/healthchecks](https://github.com/healthchecks/healthchecks)

What to learn:

- missing check-ins are often more important than explicit failures;
- scheduled jobs need expected cadence and grace periods;
- reports should distinguish late, failed, and never-run checks.

Chronarium adaptation:

- detect stalled archive tasks, missed index rebuilds, or maintenance loops that
  have not run recently;
- keep schedule state local;
- avoid network-first alerting assumptions.

### Netdata

Project: [netdata/netdata](https://github.com/netdata/netdata)

What to learn:

- local agent model;
- low-friction metrics collection;
- historical trends for system health;
- practical alert rules.

Chronarium adaptation:

- collect local disk, archive count, index size, task count, and error trend
  facts;
- make resource pressure visible before capture fails;
- avoid building a general server monitoring product.

### Beszel

Project: [henrygd/beszel](https://github.com/henrygd/beszel)

What to learn:

- lightweight monitoring can be useful without a huge stack;
- local agents and compact dashboards are enough for many users.

Chronarium adaptation:

- keep the first maintenance layer small and local;
- prefer cheap checks that can run often;
- do not introduce a heavy observability platform inside Chronarium.

### OpenTelemetry Collector

Project:
[open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector)

What to learn:

- pipeline structure;
- separate receivers, processors, and exporters;
- keep collection and output concerns decoupled.

Chronarium adaptation:

```text
inspectors -> classifiers -> report writers -> optional action runners
```

Examples:

- archive inspector reads `.chron` packages;
- index inspector compares SQLite rows to archive truth;
- classifier turns raw issues into user-facing findings;
- report writer stores JSON and UI summaries.

### Alerta

Project: [alerta/alerta](https://github.com/alerta/alerta)

What to learn:

- alert deduplication;
- severity levels;
- grouping related failures;
- lifecycle states for open, acknowledged, resolved, or suppressed issues.

Chronarium adaptation:

- combine repeated timeline errors into one finding;
- show severity and suggested action;
- keep issue identity stable between inspections.

### changedetection.io

Project: [dgtlmoon/changedetection.io](https://github.com/dgtlmoon/changedetection.io)

What to learn:

- a watch model can track changes over time;
- differences are more useful than raw repeated snapshots.

Chronarium adaptation:

- detect when an archive was healthy last run but is now broken;
- detect when index rows are stale compared with manifest timestamps;
- avoid web scraping behavior in maintenance code.

### Watchtower

Project: [containrrr/watchtower](https://github.com/containrrr/watchtower)

What to learn:

- automatic actions need clear scope;
- update systems should log what changed;
- dangerous automation needs opt-in boundaries.

Chronarium adaptation:

- allow safe automatic actions such as rebuilding a derived SQLite index;
- require user confirmation for destructive or irreversible actions;
- never update adapters, delete archives, or migrate data silently.

### Gotify

Project: [gotify/server](https://github.com/gotify/server)

What to learn:

- simple notifications are valuable when they are focused;
- message priority helps users decide what needs attention.

Chronarium adaptation:

- local notifications can report failed inspections or finished repairs later;
- avoid notification spam by grouping related findings.

### Home Assistant Core

Project:
[home-assistant/core](https://github.com/home-assistant/core)

What to learn:

- local-first automation;
- integrations as explicit boundaries;
- user-controlled automations;
- clear separation between core state and integration-specific behavior.

Chronarium adaptation:

- treat archive, index, adapter, media tools, and exports as separate
  maintenance domains;
- keep adapter-specific checks out of generic maintenance code;
- make automation user-owned and inspectable.

### OpenHands

Project: [OpenHands/openhands](https://github.com/OpenHands/openhands)

What to learn:

- agents need tools, workspaces, state, and logs;
- autonomous steps must be traceable;
- tool access should be bounded.

Chronarium adaptation:

- future AI maintenance should read inspection reports, not raw secrets;
- every AI-suggested action should cite evidence;
- AI should operate through approved core tools only.

### Aider

Project: [aider-ai/aider](https://github.com/aider-ai/aider)

What to learn:

- AI work is safer when changes are explicit and diffable;
- local project context matters;
- the user needs a clear record of what changed.

Chronarium adaptation:

- maintenance repairs should produce before/after reports;
- archive migrations should be reviewable;
- no hidden edits to user archives.

### Open Interpreter

Project:
[openinterpreter/open-interpreter](https://github.com/openinterpreter/open-interpreter)

What to learn:

- computer-control agents need strict safety boundaries;
- user approval matters before risky operations.

Chronarium adaptation:

- future AI ops must not expose arbitrary shell execution;
- actions should be predefined core commands;
- destructive actions require explicit user confirmation.

## Chronarium Maintenance Domains

### Archive Health

Checks:

- manifest exists and matches schema;
- timeline exists and parses as JSON Lines;
- timeline sequence is contiguous;
- event IDs are not duplicated;
- media track metadata exists and matches manifest;
- archive-relative paths are safe.

First source:

- `packages/archive.validateFileArchive`.

### Index Health

Checks:

- SQLite archive rows exist for selected archives;
- index rows are derived from current archive facts;
- validation issues in SQLite match archive validator output;
- stale rows can be rebuilt.

First source:

- `packages/indexer`;
- `packages/core` archive/index service.

Safe automatic action:

- rebuild SQLite index for a selected archive.

### Runtime Health

Checks:

- core runtime status;
- last start time;
- last stop time;
- currently registered service availability;
- future task scheduler heartbeat.

First source:

- `packages/core.createCoreRuntime`.

### Storage Health

Checks:

- archive root exists;
- data root exists;
- free disk space is above a configured floor;
- export/cache directories do not exceed configured limits.

First implementation note:

- disk checks should be read-only;
- cleanup actions must require explicit user intent.

### Adapter Health

Checks later:

- adapter process state;
- fixture parse health;
- reconnect decisions;
- source-specific diagnostic facts.

Boundary:

- no real adapter checks until fixture adapter behavior is stronger;
- no cookies, headers, tokens, sessions, or signed URLs in reports.

### Media Tool Health

Checks later:

- FFmpeg executable availability;
- ffprobe executable availability;
- version capture;
- command builder sanity checks.

Boundary:

- no arbitrary shell execution;
- no media probing of real private files without explicit user intent.

## Finding Model

A maintenance finding should be small, stable, and evidence-based.

Draft shape:

```ts
interface MaintenanceFinding {
  id: string;
  domain: "archive" | "index" | "runtime" | "storage" | "adapter" | "media";
  severity: "info" | "warning" | "error" | "critical";
  status: "open" | "acknowledged" | "resolved" | "suppressed";
  title: string;
  summary: string;
  evidence: readonly MaintenanceEvidence[];
  suggestedActions: readonly MaintenanceActionSuggestion[];
  firstSeenAt: string;
  lastSeenAt: string;
}
```

Evidence should cite local facts:

```ts
interface MaintenanceEvidence {
  source: "archive-validator" | "indexer" | "runtime" | "filesystem";
  path?: string;
  code?: string;
  message: string;
}
```

## Action Safety Levels

### Level 0: Report Only

Allowed automatically:

- read archive metadata;
- read timeline facts;
- validate archives;
- read SQLite index rows;
- report health.

### Level 1: Safe Rebuild

Allowed automatically only when configured:

- rebuild SQLite index rows from `.chron` truth;
- rerun validation;
- regenerate local diagnostic reports.

Reason:

- these are derived artifacts and can be rebuilt.

### Level 2: User Confirmation Required

Requires explicit user approval:

- move archives;
- rewrite manifests;
- run migrations;
- delete cache/export data;
- probe real media files;
- change adapter settings.

### Level 3: Not Allowed In Maintenance

Never allowed from automatic maintenance:

- delete source archives silently;
- commit or upload private files;
- expose cookies, headers, tokens, signed URLs, or sessions;
- run arbitrary shell commands;
- connect to real livestream sites without user intent.

## First Implementation Boundary

Recommended first implementation:

```text
packages/core/src/maintenance/
  inspectionTypes.ts
  archiveInspector.ts
  indexInspector.ts
  runtimeInspector.ts
  maintenanceReport.ts
```

First behavior:

- inspect one archive path;
- inspect runtime health;
- optionally compare and rebuild index;
- return a structured report;
- no background loop;
- no AI call;
- no destructive action.

First report should answer:

```text
Is this archive readable?
Is the timeline valid?
Are media tracks present?
Is the SQLite index fresh enough?
What should the user do next?
Can Chronarium safely fix anything?
```

## Future AI Layer

AI should come after deterministic inspection.

AI input:

- maintenance report;
- selected docs;
- safe action catalog;
- user intent.

AI output:

- explanation;
- prioritized next steps;
- proposed safe action plan.

AI must not receive:

- cookies;
- headers;
- tokens;
- signed URLs;
- private room details;
- raw private media;
- arbitrary filesystem access.

AI must not directly execute:

- shell commands;
- destructive cleanup;
- migrations;
- adapter live capture.

## Product Direction

The target experience is:

```text
Chronarium opens
  -> core starts
  -> maintenance inspects local state
  -> user sees clear health
  -> safe fixes are one click or automatic by policy
  -> risky fixes require approval
  -> AI explains, prioritizes, and helps operate
```

This turns Chronarium from "recording software" into local archive operations
software: a self-maintaining livestream archive system.
