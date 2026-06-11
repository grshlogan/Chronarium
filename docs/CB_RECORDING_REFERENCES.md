# CB Recording References

Status: design reference. No Chaturbate live capture, download logic, account
handling, cookie handling, session handling, or real media recording exists in
Chronarium yet.

## Purpose

This document records what Chronarium should learn from public GitHub projects
around Chaturbate-style recording, especially the newer split audio/video
LL-HLS/CMAF problem space.

It is not a dependency list and not an implementation plan for live capture.
The immediate goal is to keep future adapter and media-tool work honest:

```text
do not assume one playlist means one clean A/V stream
do not treat the final video file as the only truth
preserve stream topology, media tracks, tool decisions, gaps, and diagnostics
```

Sources checked: public GitHub README files and issue links on 2026-06-12. No
real livestream site, private room, account, cookie, token, header, signed URL,
or captured media was used.

## Short Conclusion

The closest reference is
[Despernal/Recordurbate-Docker](https://github.com/Despernal/Recordurbate-Docker),
because it documents the practical Chaturbate shift to LL-HLS/CMAF, split
audio/video chunklists, and FFmpeg direct-demux trouble. Its current workaround
uses [nilaoda/N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) for HLS
segment handling and keeps FFmpeg mainly for muxing.

For Chronarium, the important lesson is not "use this exact command." The
lesson is:

```text
adapter discovers stream facts
media tool records separate track facts
archive stores track-level evidence
muxing is a derived operation with its own diagnostics
replay/export is built from preserved facts
```

## Projects Reviewed

### Recordurbate-Docker

Project: [Despernal/Recordurbate-Docker](https://github.com/Despernal/Recordurbate-Docker)

Why it matters:

- It is directly focused on Chaturbate recording.
- Its README says Chaturbate moved to LL-HLS/CMAF around March-April 2026.
- It describes split audio/video CMAF behavior and FFmpeg HLS demux problems.
- It moved the actual HLS download path to `N_m3u8DL-RE`.
- It documents live mux modes, separate-files-then-merge fallback, hang
  watchdog behavior, shutdown finalization, and startup cleanup of partial
  outputs.

What Chronarium should learn:

- Treat audio and video as separate `MediaTrack` facts until proven otherwise.
- Record the source stream topology before download starts.
- Record the media tool mode used for a capture attempt.
- Record mux strategy and mux result as timeline facts.
- Detect "output no longer grows" as an evidence-based diagnostic, not as a
  vague timeout.
- Design partial-output finalization and reaper behavior before real capture.

What Chronarium should not copy:

- Do not copy Docker supervisor logic directly into core.
- Do not make `N_m3u8DL-RE` config a raw user-editable shell escape hatch.
- Do not store signed playlist URLs, headers, cookies, or private room details
  in the archive or logs.
- Do not claim FFmpeg is unusable in general; the useful boundary is that
  direct HLS demux can be the wrong layer for this specific stream shape.

### ctbcap

Project: [KFERMercer/ctbcap](https://github.com/KFERMercer/ctbcap)

Why it matters:

- It is a lightweight recorder/watchbot for Chaturbate and StripChat.
- It emphasizes auto recording, monitoring, stopping, and large-scale
  deployment.
- Recordurbate-Docker references a `ctbcap` `n_m3u8dl-re` branch as part of the
  community workaround path.

What Chronarium should learn:

- Keep monitor state small and explicit: offline, waiting, recording, stopping,
  failed, finalized.
- Separate "find stream", "record stream", and "watch process health" as
  different responsibilities.
- Make quality, segmentation, retry, and stop behavior inspectable.
- Keep a fixture harness for adapter state transitions before live site work.

What Chronarium should not copy:

- Do not build Chronarium as shell-script orchestration.
- Do not let site adapter code own generic archive writing or replay state.
- Do not connect to live rooms during fixture tests.

### StreaMonitor

Project: [lossless1024/StreaMonitor](https://github.com/lossless1024/StreaMonitor)

Related issue reference:
[StreaMonitor issue 342](https://github.com/lossless1/StreaMonitor/issues/342)

Why it matters:

- It is a multi-site monitor and recorder.
- Its README lists Chaturbate as a supported site and exposes a monitor-oriented
  command model.
- It is useful as a reference for site boundaries and status surfaces.

What Chronarium should learn:

- Model every site as an adapter with its own quirks.
- Keep monitoring, recording, and status reporting distinct.
- Build a common failure taxonomy across sites, but keep site-specific evidence
  inside adapter diagnostics.

What Chronarium should not copy:

- Do not turn Chronarium into a generic multi-site scraper first.
- Do not let adapter-specific logic leak into GUI, player, indexer, or archive
  format.
- Do not copy scraping details or site-specific bypasses.

### N_m3u8DL-RE

Project: [nilaoda/N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE)

Why it matters:

- It is a general DASH/HLS/MSS downloader with live HLS/DASH support.
- Its options include track selection, concurrent audio/video/subtitle
  download, live real-time merge, live pipe mux, mux-after-done, save patterns,
  retry controls, and metadata output.
- It is the strongest candidate for a future external downloader integration
  when a site produces split media tracks.

What Chronarium should learn:

- Treat media tools as typed workers with explicit inputs and structured
  outputs.
- Preserve downloader metadata as diagnostics.
- Make track selection deterministic and logged.
- Prefer command builders and fixture tests over hand-written command strings.
- Store tool version, selected streams, exit status, and mux results.

What Chronarium should not copy:

- Do not expose arbitrary `-H`, cookie, key, proxy, or custom option fields
  directly in GUI or adapter manifests.
- Do not depend on user-supplied raw command text.
- Do not make downloader output the only source of archive truth.

### P-StreamRec

Project: [raccommode/P-StreamRec](https://github.com/raccommode/P-StreamRec)

Why it matters:

- It is closer to an application/product than a small recorder script.
- Its README describes a profile-first media library, watch surface, recording
  controls, segmentation, MP4 conversion, settings, diagnostics, and Docker
  deployment.
- It supports several sites, including Chaturbate.

What Chronarium should learn:

- A user-facing recorder benefits from a real library model, not just a file
  folder.
- Profile/source separation can be useful for organizing long-lived recording
  intent.
- Settings and diagnostics should be visible in the app, not hidden in logs.
- Playback progress, watched state, and media indexing matter for real use.

What Chronarium should not copy:

- Do not reuse code without separate license review. The README marks the
  project as non-commercial licensed, which is not automatically compatible
  with Chronarium's Apache-2.0 direction.
- Do not make profile identity the archive truth. Chronarium's truth is the
  session archive and timeline.
- Do not add provider-account handling before the security model is designed.

### chaturbate-dvr

Project: [teacat/chaturbate-dvr](https://github.com/teacat/chaturbate-dvr)

Why it matters:

- It is a Chaturbate-specific recorder with CLI, Web UI, Docker, multi-stream
  recording, file splitting, naming patterns, and user-agent/cookie options.
- Its README says the project is deprecated and has not been maintained since
  September 2025.

What Chronarium should learn:

- CLI plus local Web UI can be a useful product shape.
- File naming, segmentation, and status UI are practical user needs.
- Deprecated projects are still useful for understanding old assumptions that
  may now be broken.

What Chronarium should not copy:

- Do not follow its cookie/session/private-show path in the first Chronarium
  adapter work.
- Do not build around a single final `.ts` file as the complete truth.
- Do not rely on it as evidence for current CB media behavior.

### Recordurbate

Project: [oliverjrose99/Recordurbate](https://github.com/oliverjrose99/Recordurbate)

Why it matters:

- It is an older Chaturbate recording daemon using Python, yt-dlp/youtube-dl
  style configuration, and FFmpeg.
- It influenced later projects such as StreaMonitor and Recordurbate-Docker.

What Chronarium should learn:

- Simple add/remove/list/start/stop daemon flows are easy to understand.
- Config files, logs, and import/export lists are basic operational needs.
- Old projects show why "download a stream and save a file" is too thin for
  Chronarium's goals.

What Chronarium should not copy:

- Do not base the future CB path on old youtube-dl assumptions.
- Do not treat old Chaturbate stream behavior as current behavior.

## Design Implications For Chronarium

### 1. Adapter Output Must Describe Stream Topology

Before any media download, a future CB adapter should emit facts like:

```text
stream topology observed
available variant tracks observed
video track candidate selected
audio track candidate selected
playlist kind observed
tool strategy selected
```

These facts must avoid private values:

- no cookies;
- no headers;
- no tokens;
- no signed URLs;
- no account/session identifiers;
- no private room labels.

For sensitive source values, store a redacted origin, hash, or stable synthetic
fixture identifier only when needed.

### 2. Media Tracks Stay Separate In The Archive

Chronarium already has a first media-track metadata boundary. Future CB work
should extend that boundary rather than collapsing everything into one output
file.

Possible future archive shape:

```text
tracks/
  video-main/
    track.json
    segments/
  audio-main/
    track.json
    segments/
diagnostics/
  media-tool.jsonl
derived/
  muxes/
```

The `.chron` package should preserve enough evidence to answer:

```text
Was audio present at capture time?
Were audio and video downloaded separately?
Were any segments missing?
Did muxing happen live or after capture?
Did the final export lose duration compared with source tracks?
```

### 3. Muxing Is A Derived Operation

The final `.ts`, `.mp4`, or `.mkv` should be treated as an export or derived
artifact, not the only session truth.

Future timeline event families should include:

- `media.track.discovered`;
- `media.segment.observed`;
- `media.segment.downloaded`;
- `media.segment.gap`;
- `media.track.probed`;
- `media.mux.started`;
- `media.mux.completed`;
- `media.mux.failed`;
- `diagnostic.media_tool_output`;
- `diagnostic.duration_mismatch`.

### 4. Tool Integration Needs Typed Command Builders

If Chronarium later uses `N_m3u8DL-RE`, FFmpeg, ffprobe, or another downloader,
they should sit behind a package boundary such as:

```text
packages/media-tools/
  src/
    nM3u8DlReCommand.ts
    ffmpegCommand.ts
    ffprobeCommand.ts
    mediaToolEvents.ts
  tests/
    nM3u8DlReCommand.test.ts
    ffmpegCommand.test.ts
```

Rules:

- command args are arrays, not shell strings;
- every supported flag is explicitly modeled;
- unsupported raw passthrough is rejected by default;
- output parsing is fixture-tested;
- tool logs are redacted before archive/index/AI use.

### 5. Watchdogs Need Evidence

Recordurbate-Docker's hang-watchdog idea is useful, but Chronarium should make
it a typed maintenance/diagnostic finding.

Examples:

```text
output file mtime did not advance for configured duration
segment counter did not advance
audio track duration is much shorter than video track duration
media tool process is alive but no new media evidence arrived
partial output exists after shutdown
```

Safe first action:

- report only;
- later, rebuild index or retry probing derived files;
- only with explicit user policy, send graceful stop/finalize to owned capture
  processes.

Unsafe automatic actions:

- delete archive media;
- rewrite source timeline facts;
- connect to a live site;
- read browser cookies;
- run arbitrary shell commands.

## Fixture-First CB Path

The next CB-related work should stay offline:

```text
1. Add synthetic split audio/video playlist fixtures.
2. Add adapter parser tests that produce redacted stream-topology facts.
3. Add media-tool command-builder tests for a hypothetical downloader run.
4. Add archive fixtures with separate audio/video track metadata.
5. Add validator diagnostics for duration mismatch and missing track metadata.
```

This gives Chronarium the important shape without touching a real livestream
site.

## Borrowing Rules

- Links are references, not approved dependencies.
- Do not vendor code from these projects without license review.
- Do not copy private-site bypass logic.
- Do not copy cookie/session/private-show flows.
- Do not copy real usernames, room URLs, screenshots, or recording samples.
- Keep Chronarium's code TypeScript-first, schema-first, and fixture-first.

## Open Decisions

- Whether `N_m3u8DL-RE` becomes an optional supported external tool or only a
  reference implementation.
- Whether Chronarium should store raw segment files, remuxed intermediate files,
  or both.
- How much public stream topology can be stored before it risks becoming a
  signed URL or session leak.
- Whether the first media-tool package should come before or after the first CB
  fixture parser.
- How the GUI should explain "source tracks" versus "exported video" in simple
  language.

## Recommended Next Step

Add offline split-track fixtures and schema drafts before any live CB adapter:

```text
docs/plan/plan_cb_split_track_fixture_schema.md
packages/adapters/chaturbate/fixtures/
packages/adapters/chaturbate/tests/
packages/types/src/media.ts
packages/schemas/src/mediaSchemas.ts
packages/archive/tests/
```

The success condition is simple:

```text
Chronarium can describe a CB-like split audio/video stream as facts without
connecting to CB and without downloading media.
```
