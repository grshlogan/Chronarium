# Media Tools Boundary

Status: design contract plus first command-builder and output-parser skeleton.
A `packages/media-tools` package now exists with typed FFmpeg/ffprobe command
builders that return argv/redactedArgv descriptions, plus fixture-tested parsers
for synthetic ffprobe JSON and FFmpeg progress output. Chronarium still does
not execute FFmpeg, ffprobe, or downloader tools, and no downloader integration
is implemented. These rules were promoted from section "4. Tool Integration
Needs Typed Command Builders" of docs/CB_RECORDING_REFERENCES.md into a
standalone boundary contract.

## Purpose

External media tools are typed, evidence-producing workers. They are never
shell escape hatches. Chronarium does not pass user-written or adapter-written
command strings to any external binary, ever.

The archive truth for a `LiveSession` is its Replay Package: the `.chron`
directory with its Timeline, `MediaTrack` metadata, `MediaSegment` facts, and
diagnostics. Final video files such as mp4 or mkv are derived artifacts
produced by tools, not archive truth. This follows the core principle in
docs/ARCHITECTURE.md:

```text
Record facts first. Render videos later.
```

Every tool invocation should therefore answer two questions:

- What facts did this run observe or produce?
- What evidence proves how and why this run happened?

How replay consumes preserved facts is the subject of docs/REPLAY_MODEL_V1.md.
How raw media, processed outputs, upload verification, and safe deletion relate
to each other is recorded in docs/MEDIA_LIFECYCLE_AND_RETENTION.md.

## Tool Roles

Planned tool roles, each behind its own typed command builder:

- ffprobe: probing and evidence. It reads media inputs and produces structured
  facts about containers, streams, codecs, and durations. It must remain a
  read-only evidence source for `MediaTrack` and derived-file inspection.
- FFmpeg: muxing, exports, and other derived operations. It combines preserved
  track facts into derived outputs such as remuxes, clips, and exports. Its
  outputs belong in derived or export locations of the Replay Package, never
  in place of source facts.
- N_m3u8DL-RE: candidate downloader for split audio/video HLS, including the
  LL-HLS/CMAF shape documented in docs/CB_RECORDING_REFERENCES.md. It is
  explicitly a reference candidate, not an approved dependency. Whether it
  becomes a supported optional tool is an open decision recorded in
  docs/CB_RECORDING_REFERENCES.md and mirrored below.

No other external media tool is in scope for this contract. Adding one
requires extending this document first.

## Processing And Retention Role

Real livestream media is often not directly useful as a final file. A future
post-session processing job should turn raw captured segments into playable,
compressed outputs only after the raw capture facts are finalized.

The media-tool layer must preserve:

- input raw segment facts and hashes;
- continuity and gap decisions;
- editable processing plan inputs, including included ranges, excluded
  fragments, and merge sources;
- mux/transcode profile and tool version;
- processed output hash, byte length, duration, and codec/container facts;
- playable validation evidence;
- derivation from raw facts to processed outputs.

For CB-like split audio/video, media tools align and mux separate raw tracks
into a derived output. They must not erase the fact that the raw layer was
split. For SC-like combined A/V, one raw media track may feed the processed
output directly.

AV1/`av01` MP4 output is a future candidate profile, not a hard-coded
requirement. Profile choice must remain configurable and evidence-backed.

Media tools execute an approved processing plan; they do not decide silently
which captured fragments matter. If a future tool run merges two restarted
sessions or excludes tiny fragments, the plan and reasons must already be
represented as facts so the output is editable and auditable.

## Planned Package Boundary

The planned package shape from docs/CB_RECORDING_REFERENCES.md:

```text
packages/media-tools/
  src/
    nM3u8DlReCommand.ts
    ffmpegCommand.ts
    ffprobeCommand.ts
    outputParsers.ts
    mediaToolEvents.ts
  fixtures/
    ffprobe.synthetic.json
    ffmpeg-progress.synthetic.txt
  tests/
    nM3u8DlReCommand.test.ts
    ffmpegCommand.test.ts
```

Boundary intent:

- one command builder module per tool, exposing typed inputs and returning
  argv arrays plus expected-output descriptions;
- `outputParsers.ts` parses synthetic or redacted tool output into structured
  metadata and returns stable sanitized errors for malformed input;
- `mediaToolEvents.ts` defines the typed event and result shapes that
  chronarium-core records as facts and diagnostics;
- `tests/` holds argv unit tests and output-parser fixture tests;
- the package builds commands and parses outputs; it does not own scheduling,
  concurrency, archive writes, or user policy. Those belong to
  chronarium-core.

Implemented parser boundary:

- `parseFfprobeJsonOutput(text)` parses synthetic `ffprobe -print_format json`
  output into `format.durationMs`, `format.sizeBytes`, `format.bitRate`, and
  stream metadata such as `index`, `codecType`, `codecName`, duration,
  dimensions, sample rate, and channels.
- `parseFfmpegProgressOutput(text)` parses synthetic `ffmpeg -progress`
  key/value lines such as `frame`, `fps`, `bitrate`, `total_size`, `out_time`,
  `speed`, and `progress`.
- Parser failures return stable error codes and fixed messages. They must not
  throw raw parser exceptions or echo raw tool output, because future tool logs
  may contain paths, signed URLs, headers, or other sensitive data.
- The committed fixtures are synthetic only. They are parser contract examples,
  not evidence from real media or real tool execution.

## Command Builder Rules

Future command builders must follow these rules:

- arguments are arrays, never shell strings;
- every supported flag is explicitly modeled as a typed option;
- raw passthrough of unmodeled flags or free-form argument text is rejected by
  default;
- processes spawn without a shell;
- working directories are bounded: a run executes inside an explicit,
  validated directory such as a Replay Package export area or a configured
  workspace, never an arbitrary path from input data;
- binary resolution is explicit: the executable path comes from
  user-configured tool settings, and the resolved path origin is recorded as
  evidence for the run;
- every run has a timeout, recorded with the run so the limit is inspectable
  rather than magic;
- results are structured: tool, tool version, redacted argv, exit code,
  duration, parsed output, and diagnostics.

A draft synthetic result shape:

```json
{
  "tool": "ffprobe",
  "toolVersion": "0.0.0-synthetic",
  "binaryOrigin": "user-settings",
  "argv": ["-v", "error", "-print_format", "json", "<redacted:input>"],
  "exitCode": 0,
  "durationMs": 42,
  "timeoutMs": 30000,
  "sensitivity": "synthetic",
  "parsedOutput": {
    "streams": []
  },
  "diagnostics": []
}
```

The `argv` stored in any durable record is the redacted form, never the raw
form handed to the process.

## Execution Rules

- tools run as child processes with a minimal, controlled environment: an
  explicit allowlist of environment variables, not the parent environment
  passed through wholesale;
- stdout and stderr are captured and parsed by fixture-tested parsers; raw
  output is treated as `unknown` sensitivity until redaction classifies it;
- kill semantics are explicit: a graceful stop signal first, then a bounded
  escalation to forced termination, with the outcome recorded as evidence.
  Partial tool-output finalization and reaper behavior after interruption is
  an unowned open design area: docs/CB_RECORDING_REFERENCES.md records the
  lesson ("partial output exists after shutdown") and
  docs/plan/plan_archive_recovery.md covers interrupted `.chron` metadata and
  timeline writes only, explicitly excluding media outputs. See Open
  Decisions;
- concurrency is owned by chronarium-core: the media-tools package never
  decides how many tool processes run at once;
- tools are invoked only through chronarium-core. The GUI, Electron main, and
  Adapter Workers never spawn media tools directly. The GUI requests derived
  operations through the planned core protocol in docs/GUI_CORE_PROTOCOL.md,
  and adapters emit typed intents that core may translate into tool runs.

## Evidence Rules

- tool versions are probed once per resolved binary and cached as evidence,
  together with the resolved path origin;
- strategy selection (which tool, which mode, why), exit status, and mux
  results are recorded as Timeline facts, not hidden in logs;
- planned future timeline event types from docs/CB_RECORDING_REFERENCES.md.
  The `media.mux.*` types would form a new event family that must be added to
  the reserved family list in docs/TIMELINE_SCHEMA_V1.md before first use;
  the `diagnostic.*` entries are new types inside the existing reserved
  `diagnostic.*` family:

```text
media.mux.started
media.mux.completed
media.mux.failed
diagnostic.media_tool_output
diagnostic.duration_mismatch
```

- stall detection is evidence-based rather than a vague timeout: output file
  growth stopped, segment counters stopped advancing, or a process is alive
  while no new media evidence arrives. Each detection cites its observed
  facts, following the watchdog guidance in docs/CB_RECORDING_REFERENCES.md
  and the finding model in docs/MAINTENANCE_OPS_DESIGN.md;
- failures map to the reserved `media_tool.*` diagnostic code area in
  docs/DIAGNOSTIC_CODES_V1.md, so tool errors stay stable and searchable;
- Fact versus Interpretation applies: captured tool output and exit codes are
  facts; judgments such as "the export lost duration compared with source
  tracks" are interpretations and must cite the facts they derive from.

## Redaction

Tool argv and tool logs may contain signed URLs, request headers, or other
sensitive source values, especially for any future downloader run. Rules:

- redact before any durable destination: logs, the Replay Package, the SQLite
  index, shareable diagnostics, or AI use;
- never store raw signed URLs, consistent with docs/SECURITY_PRIVACY.md;
- prefer redacted placeholders, stable hashes, or synthetic fixture
  identifiers when a reference must survive;
- apply the project sensitivity labels (`safe`, `synthetic`, `redacted`,
  `contains-sensitive`, `unknown`) to stored tool evidence;
- `contains-sensitive` is a local runtime warning state only. Such data must
  not be committed, exported, or included in shareable diagnostics.

## Testing Rules

- command builders are unit-tested by asserting the exact argv arrays they
  produce for typed inputs;
- output parsers are fixture-tested with synthetic or redacted tool outputs
  committed as fixtures;
- the default test suite never executes real tools and never touches the
  network;
- optional local integration tests against real binaries sit behind an
  explicit opt-in environment flag (draft name:
  `CHRONARIUM_MEDIA_TOOLS_INTEGRATION`), are skipped by default, and must not
  use real captured media or live sites.

## Security Rules

These restate the non-negotiable boundaries in AGENTS.md and
docs/SECURITY_PRIVACY.md for the media tool surface:

- no arbitrary shell execution is exposed through UI, config files, adapter
  manifests, plugins, or debug endpoints;
- unsupported flags are rejected, not forwarded; there is no "extra arguments"
  text field anywhere in the product;
- Adapter Workers express typed intents only, never raw command fragments,
  raw header fields, cookie fields, proxy fields, or custom option strings;
- tool paths come from user settings, never from adapter messages, adapter
  manifests, or archive data, so an archive or adapter payload can never
  redirect execution to an attacker-chosen binary;
- tool runs must not write outside their bounded working directories, and
  destructive cleanup of tool outputs requires explicit user intent and
  bounded target paths.

## Open Decisions

The first and last items mirror open decisions recorded in
docs/CB_RECORDING_REFERENCES.md; the others are raised here for the first
time. All remain unresolved:

- whether N_m3u8DL-RE becomes a supported optional external tool or stays a
  reference implementation only;
- bundled versus system-installed binaries for FFmpeg and ffprobe, and how
  user-configured paths interact with either choice;
- version pinning policy: which tool versions are tested, supported, and
  warned about;
- partial tool-output finalization and reaper behavior after interruption,
  which no document owns yet (see Execution Rules);
- whether Chronarium stores raw `MediaSegment` files, remuxed intermediate
  files, or both inside the Replay Package.
