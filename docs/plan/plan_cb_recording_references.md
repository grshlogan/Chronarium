# Plan: CB Recording References

## Objective

Create a reference design document for GitHub projects related to
Chaturbate-style recording, especially split audio/video LL-HLS/CMAF recording
constraints.

The document should explain what Chronarium can learn from these projects
without implementing real site capture.

## Scope

In scope:

- summarize relevant public GitHub projects;
- document which ideas are useful for Chronarium;
- document what Chronarium must not copy;
- connect the references to Chronarium's archive, timeline, adapter, media
  tool, and maintenance design;
- keep the path fixture-first and offline.

Out of scope:

- live Chaturbate requests;
- account, cookie, header, token, or session handling;
- downloader integration;
- FFmpeg or `N_m3u8DL-RE` command implementation;
- real media recording;
- code changes.

## References Checked

- `Despernal/Recordurbate-Docker`
- `KFERMercer/ctbcap`
- `lossless1024/StreaMonitor`
- `nilaoda/N_m3u8DL-RE`
- `raccommode/P-StreamRec`
- `teacat/chaturbate-dvr`
- `oliverjrose99/Recordurbate`

## Verification

Expected checks:

```powershell
git diff --check
```

Also run trailing whitespace and JSON/package config parse scans.

## Progress / Decisions

- Created after commit `84899e7`.
- GitHub REST API was rate-limited from the current network.
- Public raw GitHub README files were used instead.
- The reference conclusion is that Chronarium should preserve split-track facts
  and mux diagnostics, not assume a single final video file is the truth.
- The doc remains design-only and does not implement real CB capture.
- `git diff --check` produced no output.
- Trailing whitespace scan produced no output.
- JSON/package config parse scan succeeded.

## Blockers

None currently.
