# Media Lifecycle And Retention

Status: design contract. No real capture, transcoding, upload, playable media
validation, hash validation, or deletion automation is implemented yet.

## Purpose

Chronarium must be able to guard disk space while still preserving the facts
needed to replay, diagnose, summarize, and audit a livestream session.

The durable local asset is the `.chron` fact archive. Local media files are
bounded-retention evidence or derived upload/export artifacts when the user's
retention policy says so.

In plain terms:

```text
facts stay
local media expires
deletion waits for proof
```

## Product Policy Versus Personal Deployment Policy

The product should support configurable retention and upload policies. It
should not force every user into one media deletion or upload model.

For this project owner's local machine, the intended policy is:

```text
raw media -> process/transcode -> verify processed output -> delete raw
processed output -> scheduled upload -> verify upload -> delete local output
facts remain local
```

For a public release, that policy should be optional. Other users may choose to
keep raw files longer, keep processed outputs locally, disable upload, or use a
different retention window.

## Core Policy

- Timeline, chat, room state, adapter diagnostics, media decisions, hashes,
  upload records, and deletion records are durable local facts.
- Raw captured media segments do not have to be long-term local storage.
- Processed playable outputs also do not have to be long-term local storage;
  they can be upload-prep, export artifacts, or a user's local media library.
- Local media retention is policy-driven, for example per-streamer rules such
  as 1, 3, or 7 days on the project owner's machine.
- Future upload policy may choose which processed outputs are uploaded before
  local deletion. Upload is optional product behavior and is not part of the
  first release target.
- A media file may be deleted only after the relevant verification facts exist.
- No deletion policy may delete the durable fact timeline merely because media
  files have expired.

## Lifecycle Overview

The complete lifecycle Chronarium should support is:

```text
1. Monitor streamer
2. Detect live state
3. Capture raw track segments and information stream facts
4. Finalize the raw session archive
5. Validate continuity and gaps
6. Process raw media into playable compressed outputs
7. Validate playable outputs
8. Optionally delete raw media when the processed output is verified
9. Optionally schedule upload of processed outputs when policy requires it
10. Verify uploaded object identity and hash when upload is enabled
11. Optionally delete local processed output when upload is verified
12. Keep facts, indexes, summaries, and diagnostics locally
```

This lifecycle is future behavior. The current repository implements only
synthetic archive, segment-reference validation, index, and fixture paths.

## Raw Capture Layer

The raw layer preserves what Chronarium actually captured or attempted to
capture.

Raw media facts should include, when available:

- track id;
- segment id;
- source sequence;
- capture time;
- media start and duration;
- byte length;
- raw segment hash;
- safe archive-relative path while the file exists;
- source topology facts after redaction;
- gap, reconnect, retry, and stop decisions.

Raw files are evidence, not the final user-facing deliverable. They may be
unplayable or awkward to play directly, especially when a site uses segmented
stream formats or separate audio and video tracks.

## Processing Layer

After a livestream session ends, Chronarium should automatically process the
raw capture into one or more playable compressed outputs.

Processing includes:

- reading raw segment facts;
- building a continuity map and gap map;
- building an editable processing plan;
- aligning audio and video when they are separate;
- muxing and transcoding through typed media-tool jobs;
- producing playable output files;
- recording tool version, redacted argv, input facts, output facts, and
  diagnostics.

The likely long-term default output is compressed MP4 using a configurable
profile, with AV1/`av01` as a future candidate when local hardware and speed
allow it. Codec, bitrate ladder, container, and profile must remain policy and
capability choices, not hard-coded facts.

## Editable Processing Policy

Recording products must be editable. Processing should not assume that every
capture attempt becomes one strict, perfectly continuous output file.

Real sessions can be interrupted by network failures, site behavior, computer
sleep, tool crashes, restarts, or user decisions. Chronarium should support
derived outputs that:

- merge multiple capture sessions or restarted recording runs;
- exclude tiny, corrupt, silent, empty, or policy-rejected fragments;
- keep valid continuous runs separate when merging would hide important gaps;
- optionally create a full-session export with synthetic black/silence gap
  fill;
- preserve all edit decisions as facts.

The raw layer remains factual and conservative. If a tiny fragment was captured,
Chronarium should record that it existed. The processing layer may then decide
not to include it in a compressed output, but that exclusion is an editable
derived decision, not a rewrite of history.

An editable processing plan should record:

- source archive ids and session ids;
- included source track ids, segment ids, and time ranges;
- excluded fragments and exclusion reasons;
- output timeline mapping from source ranges to output ranges;
- gap-fill choices, when any;
- policy or user action that approved the plan;
- resulting processed output ids and hashes.

Merging two sessions should create a derived output or composition that
references both source sessions. It must not silently rewrite either source
archive into one pretend-continuous session.

## Hash Strategy

Chronarium should record both raw and processed hashes because they prove
different things.

Raw hashes prove:

- what bytes were captured before processing;
- whether the raw evidence changed before deletion;
- which source segment facts produced a derived output.

Processed-output hashes prove:

- what playable file Chronarium produced;
- what file was uploaded or exported;
- whether it is safe to delete the local processed output after verified
  upload.

Deletion should not depend on only one hash class:

- raw deletion requires a verified processed output and recorded derivation
  from the raw facts;
- processed-output deletion requires upload verification or an explicit local
  retention policy decision.

## CB-Like Split Audio / Video

For CB-like sites where audio and video can arrive as separate media tracks,
Chronarium must preserve the raw split topology.

The raw layer should keep:

- one video `MediaTrack`;
- one audio `MediaTrack`;
- separate segment facts per track;
- missing-audio facts when audio is absent;
- duration mismatch facts when tracks diverge;
- gap facts per affected track;
- mux/transcode decisions as derived facts.

Chronarium should not prematurely collapse split raw tracks into one raw file.
Muxed A/V output is a processed artifact derived from the split facts.

This matters because future replay, maintenance, and AI diagnosis need to
answer questions such as:

```text
Was audio absent at source?
Was audio captured but not muxed?
Did video have a gap while audio continued?
Did the processed output lose duration compared with raw tracks?
```

## SC-Like Combined A/V

For SC-like sites or any source where audio and video arrive together in one
media stream, the raw archive may model the media as one `MediaTrack` carrying
combined A/V evidence.

Even then, the session still has separate non-media facts:

- timeline facts;
- raw room or stream information facts;
- extracted event facts;
- session lifecycle facts;
- diagnostics.

The model remains timeline-centered. Combined media only changes the track
shape, not the fact-first archive principle.

## Gap Handling

When a policy chooses upload or aggressive local media cleanup, the recommended
unit should be compressed continuous runs rather than a single forced
full-session file.

If the network drops or a site stops producing media, Chronarium should record
the gap as a fact and process the valid runs around it. A later optional export
may render a full-session video with black frames or silence inserted, but that
gap-fill output is synthetic.

Gap fill must never be treated as captured media. It must be recorded as a
derived export decision.

## Upload Layer

Upload is a future feature and should stay behind an explicit policy boundary.

When implemented, upload facts should include:

- local processed output id;
- processed output hash and byte length;
- upload policy that selected it;
- remote storage provider id or redacted target reference;
- remote object id or safe reference;
- verification time;
- verification hash or provider-side checksum when available;
- retry and failure diagnostics.

Signed URLs, raw credentials, provider tokens, and private identifiers must not
be stored in shareable archives, logs, docs, or diagnostics.

## Deletion Gates

Deletion is allowed only when Chronarium can explain why the file is no longer
needed locally.

Raw media deletion gate:

- raw segment facts are written;
- raw segment hashes and byte lengths are recorded when available;
- continuity/gap validation has run;
- editable processing decisions, including excluded fragments, have been
  recorded when the output does not include all raw media;
- processed output has been produced;
- processed output has passed playable validation;
- derivation from raw facts to processed output is recorded;
- the deletion target is inside a bounded archive/media path;
- deletion action is recorded as a timeline or maintenance fact.

Processed output deletion gate:

- upload is selected by policy, or the user explicitly chooses local deletion
  without upload;
- upload or retention decision is recorded;
- uploaded object verification has passed when upload is involved;
- output hash and byte length are recorded;
- deletion target is bounded;
- deletion action is recorded.

Automatic cleanup must start conservative: report first, then suggest, then
execute only after policy and verification are implemented.

## Release Guidance

The first public release should not promise full upload/deletion automation, and
it should not force the project owner's personal retention policy on all users.

A better first-release shape is:

- preserve timeline, room, chat, state, diagnostics, and media segment facts;
- validate archive and segment references;
- produce local inspection and maintenance reports;
- keep media processing/upload/deletion as explicit planned or optional areas.

Real compression, upload, and automatic deletion should wait until the raw
archive, media-tool parsing, processed-output validation, and deletion-gate
tests are solid.

## Open Decisions

- Exact retention policy UI and defaults.
- Whether processed outputs live under `.chron/exports/`, a sibling media
  cache, or a managed library directory.
- Exact processed-output manifest shape.
- Upload provider abstraction and safe remote reference format.
- AV1/`av01` profile defaults and fallback codecs.
- Whether adaptive-bitrate MP4 means multiple rendition files, fragmented MP4,
  or a higher-level export package.
- Whether full-session black/silence-filled MP4 export is user-triggered only
  or policy-triggered for some upload destinations.
- Exact schema for editable processing plans and cross-session compositions.
