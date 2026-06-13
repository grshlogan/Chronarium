# Adapter Site Readiness

Status: implemented offline readiness contract, not live-site capture.

This document defines when Chronarium is ready to start designing a real site
adapter. Passing these checks does not mean the adapter can record a live site.
It only means the adapter package is safe to wire into Chronarium's local core
contract without leaking sensitive data or bypassing archive/timeline rules.

## Definition

A site adapter is ready for live-site design only after it has an offline
package scaffold with:

- an `AdapterManifest` exported by the adapter package;
- synthetic or approved redacted fixtures;
- parser/builders that convert fixture input into media tracks and timeline
  facts;
- a fixture runner that emits adapter protocol messages;
- `verifyAdapterFixtureReadiness` coverage from `packages/testkit`;
- core adapter catalog registration coverage;
- core task gate coverage proving only registered/capable adapters can run;
- docs that state the fixture evidence level and live-site non-goals.

## Minimum Package Shape

Use this shape for a new adapter package:

```text
packages/adapters/<site>/
  package.json
  tsconfig.json
  fixtures/
    README.md
    <scenario>.synthetic.json
  src/
    fixtureAdapter.ts
    index.ts
    manifest.ts
    <scenario>Fixture.ts
```

Tests may live in the adapter package for package-local behavior, or under
`tdd-tests/packages/adapters/<site>/` for cross-package TDD slices.

## Required Manifest Rules

The first manifest for a new site should normally be fixture-only:

```text
runtimeModes: ["fixture"]
security.networkAccess: "none"
security.requiresCredentials: false
security.emitsSensitiveSourceFields: false
fixtureReadiness.status: "fixture-ready"
```

Do not add `live` to `runtimeModes` until the adapter has a separate approved
live-site plan covering credentials, redaction, retry behavior, capture
boundaries, and failure diagnostics.

## Fixture Rules

Synthetic fixtures may use `fixture://<site>/...` references. They must not use:

- raw `http://` or `https://` URLs;
- cookies, headers, bearer tokens, signatures, signed URLs, or token query
  strings;
- real room names, account names, private room data, or personal data;
- real recorded media unless the user explicitly approves a public fixture.

Fixture parsers should reject unsafe references before producing timeline
facts.

## Timeline Expectations

Every adapter fixture should produce timeline facts around actual recording
semantics, not just a generic "success" event.

Common early facts:

```text
media.track.topology_observed
media.track.discovered
media.segment.observed
media.gap.detected
room.state.changed
chat.message.observed
diagnostic.*
```

CB-like split audio/video topologies should model separate raw tracks.
SC-like combined audio/video topologies may model a single raw media track with
`containsAudio: true` in adapter-specific fixture payloads and a normal
Chronarium `MediaTrack` output.

Gaps are facts. Overlapping or backwards media segments are fixture errors.

## Core Gate

When a runtime has adapter manifests, `CoreGuiService.runOfflineFixtureCapture`
passes the runtime adapter catalog into the offline capture pipeline. The
pipeline fails before adapter startup when:

- the adapter id is not registered;
- the manifest does not support the requested mode;
- a requested capability is not declared;
- fixture mode is requested but the manifest is not fixture-ready.

This gate is intentionally preflight-only. It should reject invalid task setup
before consuming adapter messages or writing archives.

## Current Examples

`packages/adapters/chaturbate` is the split audio/video example:

- fixture-only manifest;
- CB-like LL-HLS/CMAF split track fixture;
- synthetic diagnostic fixtures for missing audio, media gap, duration
  mismatch, and stalled output;
- archive/index flow coverage.

`packages/adapters/stripchat` is the combined audio/video example:

- fixture-only manifest;
- SC-like combined HLS A/V fixture;
- one raw media track with combined media observations;
- media gap fact generation for non-contiguous segments;
- overlap/backwards segment rejection.

## What Is Still Not Implemented

Chronarium is not yet running real site adapters.

Still pending before live capture:

- child-process adapter launcher;
- typed live adapter command lifecycle;
- credential and secret storage policy;
- site-specific redacted evidence process;
- downloader/media segment capture loop;
- FFmpeg/ffprobe execution boundary;
- hash/duration/playability validation for real media;
- GUI-core IPC and task control for real monitoring.

## First Live-Site Design Step

For any real site, first add a new synthetic or redacted fixture scenario that
captures the site's media topology and failure shape. Make that fixture pass
the readiness gate and core task gate. Only then write a live adapter design
plan.
