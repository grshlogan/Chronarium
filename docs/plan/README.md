# Chronarium Plan Documents

Future non-trivial work should create or update a plan document in this
directory before implementation.

## When To Create A Plan

Create or update a plan when work:

- touches logic or control flow;
- touches more than one source file;
- changes schema, protocol, config, CLI, public behavior, or storage format;
- involves adapters, concurrency, persistence, security, media processing, or
  replay semantics;
- requires debugging, research, or verification.

## Naming

Use specific names:

```text
plan_main_app_skeleton.md
plan_archive_schema_v1.md
plan_cb_adapter_fixture_harness.md
plan_replay_player_mvp.md
```

Avoid vague names:

```text
implementation_plan.md
task_plan.md
progress.md
findings.md
```

## Suggested Structure

```text
# Plan Title

## Objective

## Scope

## Current Facts

## Constraints

## Execution Plan

## Verification

## Progress / Decisions

## Blockers
```

Keep plan files lightweight and current. Plans should help the next developer or
AI continue safely, not become stale process theater.
